const express = require("express");
const { google } = require("googleapis");
const verifyToken = require("../middleware/authMiddleware");
const { subtractSpoolWeight } = require("../utils/spoolManager");

const router = express.Router();

const Filament = require("../models/filamentModel");
const Log = require("../models/Log");
const SyncState = require("../models/SyncState");

// Fallback file logger when MongoDB is not configured
const fs = require("fs");
const path = require("path");
const fallbackLogPath = path.join(__dirname, "..", "fallback_logs.json");
function fallbackLog(entry) {
  try {
    fs.appendFileSync(fallbackLogPath, JSON.stringify(entry) + "\n");
  } catch (e) {
    console.error("Fallback log write failed:", e);
  }
}

const SHEET_ID = "1OzkGSMy7l4F3xVrYvTxEpywZN2RSDrnDlLisdhUSp3I";

// Normalize spools array into clean number weights (grams)
const normalizeSpools = (spools, currentStock = 0) => {
  let arr = [];
  if (Array.isArray(spools)) {
    arr = spools;
  } else if (spools !== null && spools !== undefined && spools !== "") {
    arr = [spools];
  }

  const result = arr
    .map((spool) => {
      if (spool && typeof spool === "object") {
        if ("weight" in spool) return Number(spool.weight || 0);
        if ("currentStock" in spool) return Number(spool.currentStock || 0);
      }
      const num = parseFloat(String(spool).replace(/[^0-9.]/g, ""));
      return isNaN(num) ? 0 : num;
    })
    .filter((w) => !isNaN(w) && w > 0);

  if (result.length === 0 && Number(currentStock) > 0) {
    return [Number(currentStock)];
  }

  return result;
};

const calculateStock = (spools, currentStock = 0) =>
  normalizeSpools(spools, currentStock).reduce(
    (sum, weight) => sum + Number(weight || 0),
    0,
  );

function formatDateString(dateInput, forSheet = false) {
  let cleanStr = "";
  if (!dateInput) {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    cleanStr = `${day}-${month}-${year}`;
  } else {
    const str = String(dateInput).replace(/^'/, "").trim();
    if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
      const parts = str.split(/[-/]/);
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      cleanStr = `${day}-${month}-${year}`;
    } else if (
      !isNaN(Number(str)) &&
      Number(str) > 30000 &&
      Number(str) < 100000
    ) {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + Number(str) * 86400000);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      cleanStr = `${day}-${month}-${year}`;
    } else {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        cleanStr = `${day}-${month}-${year}`;
      } else {
        cleanStr = str;
      }
    }
  }

  // Prepend single quote for Google Sheet so it is stored as text (e.g. '23-07-2026) and displayed literally without converting to serial 46226
  return forSheet ? "'" + cleanStr : cleanStr;
}

const appendSheetRow = async (rowValues) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.RENDER
        ? "/etc/secrets/credentials.json"
        : path.join(__dirname, "..", "credentials.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Determine accurate next S.No. by inspecting Column A from Google Sheets
    let nextSNo = 1;
    let totalRowsInSheet = 0;
    try {
      const getColA = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A:A",
        majorDimension: "ROWS",
      });
      const colA = getColA.data.values || [];
      totalRowsInSheet = colA.length;
      if (colA.length > 1) {
        const lastCellVal = colA[colA.length - 1]?.[0];
        const numVal = Number(lastCellVal);
        if (!isNaN(numVal) && numVal > 0) {
          nextSNo = numVal + 1;
        } else {
          nextSNo = colA.length;
        }
      } else {
        nextSNo = 1;
      }
    } catch (fetchErr) {
      console.warn(
        "Could not fetch Col A, falling back to SyncState:",
        fetchErr.message,
      );
      let syncState = await SyncState.findOne({ key: "google_sheet_sync" });
      nextSNo = (syncState?.lastProcessedRow || 0) + 1;
    }

    // Ensure Date column (rowValues[0]) is formatted as 'DD-MM-YYYY for Google Sheets text display
    if (rowValues.length > 0) {
      rowValues[0] = formatDateString(rowValues[0], true);
    }

    // Prepend S.No. as first column
    const fullRow = [nextSNo, ...rowValues];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:L",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [fullRow],
      },
    });
    console.log(`[SHEET] Appended row with S.No. ${nextSNo}`);

    // Update sync state to reflect new row count in Google Sheet
    const newRowCount = totalRowsInSheet > 0 ? totalRowsInSheet + 1 : nextSNo;
    await SyncState.findOneAndUpdate(
      { key: "google_sheet_sync" },
      { $set: { lastProcessedRow: newRowCount } },
      { upsert: true },
    );
  } catch (err) {
    console.error("Google Sheets append failed:", err);
    throw err;
  }
};

// ========================================
// GET INVENTORY
// ========================================
router.get("/inventory", async (req, res) => {
  try {
    const inventory = await Filament.find();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ========================================
// CREATE OR ADD NEW STOCK (Always creates a new spool)
// ========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      filament,
      color,
      currentStock = 0,
      usedStock = 0,
      spools = [],
      weight = null,
      existingSpools = [], // sent by frontend: current spools from DB or static data
    } = req.body;

    if (!filament || !color) {
      return res
        .status(400)
        .json({ error: "Filament name and color are required." });
    }

    const filter = {
      filament: {
        $regex: new RegExp(
          "^" + filament.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i",
        ),
      },
      color: {
        $regex: new RegExp(
          "^" + color.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i",
        ),
      },
    };

    const existing = await Filament.findOne(filter);
    const now = new Date();
    const dateStr = formatDateString(now);
    const timeStr = now.toLocaleTimeString();

    let newSpoolWeight = Number(weight);
    if (isNaN(newSpoolWeight) || newSpoolWeight <= 0) {
      if (Array.isArray(spools) && spools.length > 0) {
        newSpoolWeight = Number(spools[spools.length - 1] || spools[0] || 0);
      }
    }
    if (isNaN(newSpoolWeight) || newSpoolWeight <= 0) {
      newSpoolWeight = Number(currentStock || 1000);
    }

    if (existing) {
      let currentSpools = normalizeSpools(
        existing.spools,
        existing.currentStock,
      );
      if (currentSpools.length === 0 && existingSpools.length > 0) {
        currentSpools = existingSpools.map(Number).filter((w) => w > 0);
      }
      const nextSpools = [...currentSpools, newSpoolWeight];
      const totalStock = nextSpools.reduce((sum, w) => sum + Number(w || 0), 0);

      const updated = await Filament.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            spools: nextSpools,
            usedStock: usedStock || existing.usedStock,
            currentStock: totalStock,
          },
        },
        { new: true },
      );

      try {
        await Log.create({
          action: "ADD_STOCK",
          filament: updated.filament,
          color: updated.color,
          weight: newSpoolWeight,
          spoolNumber: `Spool ${updated.spools.length}`,
          username: req.user?.adminId || "Admin",
          date: dateStr,
          time: timeStr,
          adminId: req.user?.adminId || "ADMIN",
        });
      } catch (logErr) {
        console.error("Log create failed (non-fatal):", logErr);
      }

      return res.json(updated);
    }

    const baseSpools = existingSpools.map(Number).filter((w) => w > 0);
    const initialSpools = [...baseSpools, newSpoolWeight];
    const initialStock = initialSpools.reduce((sum, w) => sum + w, 0);

    const newFilament = await Filament.create({
      filament: filament.trim(),
      color: color.trim(),
      currentStock: initialStock,
      usedStock,
      spools: initialSpools,
    });

    try {
      await Log.create({
        action: "ADD_STOCK",
        filament: newFilament.filament,
        color: newFilament.color,
        weight: newSpoolWeight,
        spoolNumber: "Spool 1",
        username: req.user?.adminId || "Admin",
        date: dateStr,
        time: timeStr,
        adminId: req.user?.adminId || "ADMIN",
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

    return res.json(newFilament);
  } catch (err) {
    console.log("Create stock error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ========================================
// UPDATE STOCK (PUT BY ID)
// ========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const existing = await Filament.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Filament not found",
      });
    }

    const previousStock = existing.currentStock || 0;

    // If a new weight is being added, ALWAYS append as a new spool — never replace
    let nextSpools;
    if (req.body.weight && Number(req.body.weight) > 0) {
      const currentSpools = normalizeSpools(
        existing.spools,
        existing.currentStock,
      );
      nextSpools = [...currentSpools, Number(req.body.weight)];
    } else if (
      req.body.spools &&
      Array.isArray(req.body.spools) &&
      req.body.spools.length > 0
    ) {
      // Explicit spools array provided — APPEND each new one, don't replace
      const currentSpools = normalizeSpools(
        existing.spools,
        existing.currentStock,
      );
      const incomingWeights = normalizeSpools(req.body.spools);
      nextSpools = [...currentSpools, ...incomingWeights];
    } else {
      nextSpools = normalizeSpools(existing.spools, existing.currentStock);
    }
    const nextCurrentStock = nextSpools.reduce(
      (sum, w) => sum + Number(w || 0),
      0,
    );

    const updated = await Filament.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        spools: nextSpools,
        currentStock: nextCurrentStock,
      },
      { new: true },
    );

    const newStock = updated.currentStock || 0;
    const addedWeight = newStock - previousStock;
    const now = new Date();

    try {
      await Log.create({
        action: addedWeight >= 0 ? "ADD_STOCK" : "DELETE_STOCK",
        filament: updated.filament,
        color: updated.color,
        weight: Math.abs(addedWeight),
        spoolNumber:
          addedWeight >= 0 ? `Spool ${updated.spools.length}` : "Spool 1",
        username: req.user?.adminId || "Admin",
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString(),
        adminId: req.user?.adminId || "ADMIN",
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

    return res.json(updated);
  } catch (err) {
    console.log("Update stock error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ========================================
// DELETE FILAMENT (DELETE BY ID)
// ========================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const existing = await Filament.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Filament not found",
      });
    }

    await Filament.findByIdAndDelete(req.params.id);

    const now = new Date();
    try {
      await Log.create({
        action: "DELETE_STOCK",
        filament: existing.filament,
        color: existing.color,
        weight: existing.currentStock,
        spoolNumber: "All Spools",
        username: req.user?.adminId || "Admin",
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString(),
        adminId: req.user?.adminId || "ADMIN",
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

    return res.json({
      success: true,
      message: "Filament deleted successfully",
    });
  } catch (err) {
    console.log("Delete stock error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ========================================
// DELETE STOCK BY FILAMENT + COLOR (GLOBAL ENDPOINT FOR ADMIN & USER POPUPS)
// Removes from LOWEST spool first, auto-deletes 0g spools, logs & appends to Google Sheet
// ========================================
router.post("/delete-stock", async (req, res) => {
  console.log("POST /delete-stock received", req.body);
  try {
    const {
      filament,
      color,
      weightToReduce,
      sheetData = {},
      username,
    } = req.body;

    const safeFilament = (filament || sheetData.filamentType || "").trim();
    const safeColor = (color || sheetData.filamentColor || "").trim();
    const safeWeight = Number(
      weightToReduce || sheetData.totalFilamentUsage || 0,
    );

    if (!safeFilament || !safeColor) {
      return res
        .status(400)
        .json({ error: "Filament type and colour are required." });
    }

    if (isNaN(safeWeight) || safeWeight <= 0) {
      return res
        .status(400)
        .json({ error: "Weight to reduce must be a positive number." });
    }

    // Find document case-insensitively
    let existing = await Filament.findOne({
      filament: {
        $regex: new RegExp(
          "^" + safeFilament.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i",
        ),
      },
      color: {
        $regex: new RegExp(
          "^" + safeColor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i",
        ),
      },
    });

    if (!existing) {
      existing = await Filament.create({
        filament: safeFilament,
        color: safeColor,
        currentStock: 1000,
        usedStock: 0,
        spools: [1000],
      });
    }

    const existingBaseSpools = Array.isArray(existing.baseSpools)
      ? existing.baseSpools.map(Number).filter((w) => w > 0)
      : [];
    const currentSpools = Array.isArray(existing.spools) && existing.spools.length > 0
      ? normalizeSpools(existing.spools, existing.currentStock)
      : existingBaseSpools.length > 0
        ? existingBaseSpools
        : normalizeSpools(existing.spools, existing.currentStock);

    const reduction = subtractSpoolWeight(currentSpools, safeWeight);
    const nextSpools = reduction.spools;
    const nextStock = reduction.totalStock;

    const updated = await Filament.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          spools: nextSpools,
          currentStock: nextStock,
          usedStock: Number(existing.usedStock || 0) + safeWeight,
          baseSpools: existingBaseSpools.length > 0 ? existingBaseSpools : currentSpools,
        },
      },
      { new: true },
    );

    const now = new Date();
    const dateVal = formatDateString(sheetData.date || now);
    const timeVal = now.toLocaleTimeString();
    const userVal =
      username || sheetData.username || req.user?.adminId || "User";

    try {
      await Log.create({
        action: "DELETE_STOCK",
        filament: updated.filament,
        color: updated.color,
        weight: safeWeight,
        spoolNumber: "Spool 1",
        username: userVal,
        date: dateVal,
        time: timeVal,
        adminId: req.user?.adminId || "ADMIN",
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

    // Append deletion info to Google Sheet (always, using sheetData fields when available)
    const rowValues = [
      dateVal, // B: Date
      userVal, // C: Username
      sheetData.partName || "", // D: 3D Part Name
      sheetData.projectBy || "", // E: Project By
      sheetData.quantity || 1, // F: Quantity
      safeFilament, // G: Filament Type
      safeColor, // H: Filament Color
      sheetData.filamentUsage || safeWeight, // I: Filament Usage (gms)
      sheetData.totalFilamentUsage || safeWeight, // J: Total Filament Usage (gms)
      sheetData.printTime || "", // K: Print Time
      sheetData.printer || "", // L: Printer
    ];
    try {
      await appendSheetRow(rowValues);
    } catch (sheetErr) {
      console.error("Sheet append failed:", sheetErr);
    }

    return res.json({
      success: true,
      message: `Removed ${safeWeight}g from inventory.`,
      updated,
      spoolsRemoved: currentSpools.length - nextSpools.length,
    });
  } catch (err) {
    console.error("Delete stock error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Also support POST /:id/delete-stock for compatibility
router.post("/:id/delete-stock", async (req, res) => {
  try {
    const existing = await Filament.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Filament not found" });
    }
    req.body.filament = existing.filament;
    req.body.color = existing.color;

    const safeWeight = Number(
      req.body.weightToReduce || req.body.sheetData?.totalFilamentUsage || 0,
    );

    const existingBaseSpools = Array.isArray(existing.baseSpools)
      ? existing.baseSpools.map(Number).filter((w) => w > 0)
      : [];
    const currentSpools = Array.isArray(existing.spools) && existing.spools.length > 0
      ? normalizeSpools(existing.spools, existing.currentStock)
      : existingBaseSpools.length > 0
        ? existingBaseSpools
        : normalizeSpools(existing.spools, existing.currentStock);

    const reduction = subtractSpoolWeight(currentSpools, safeWeight);
    const nextSpools = reduction.spools;
    const nextStock = reduction.totalStock;

    const updated = await Filament.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          spools: nextSpools,
          currentStock: nextStock,
          usedStock: Number(existing.usedStock || 0) + safeWeight,
          baseSpools: existingBaseSpools.length > 0 ? existingBaseSpools : currentSpools,
        },
      },
      { new: true },
    );

    const now = new Date();
    const dateVal = formatDateString(req.body.sheetData?.date || now);
    const timeVal = now.toLocaleTimeString();
    const userVal = req.body.username || req.body.sheetData?.username || "User";

    try {
      await Log.create({
        action: "DELETE_STOCK",
        filament: updated.filament,
        color: updated.color,
        weight: safeWeight,
        spoolNumber: "Spool 1",
        username: userVal,
        date: dateVal,
        time: timeVal,
      });
    } catch (logErr) {
      console.error(logErr);
    }

    if (req.body.sheetData) {
      const rowValues = [
        dateVal,
        userVal,
        req.body.sheetData.partName || "",
        req.body.sheetData.projectBy || "",
        req.body.sheetData.quantity || 1,
        updated.filament,
        updated.color,
        req.body.sheetData.filamentUsage || safeWeight,
        req.body.sheetData.totalFilamentUsage || safeWeight,
        req.body.sheetData.printTime || "",
        req.body.sheetData.printer || "",
      ];

      try {
        await appendSheetRow(rowValues);
      } catch (sheetErr) {
        console.error(sheetErr);
      }
    }

    return res.json({ success: true, updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE endpoint for delete-stock (compatibility)
router.delete("/delete-stock", async (req, res) => {
  // reuse POST handler logic
  try {
    const {
      filament,
      color,
      weightToReduce,
      sheetData = {},
      username,
    } = req.body;
    const safeFilament = (filament || sheetData.filamentType || "").trim();
    const safeColor = (color || sheetData.filamentColor || "").trim();
    const safeWeight = Number(
      weightToReduce || sheetData.totalFilamentUsage || 0,
    );
    if (!safeFilament || !safeColor) {
      return res
        .status(400)
        .json({ error: "Filament type and colour are required." });
    }
    if (isNaN(safeWeight) || safeWeight <= 0) {
      return res
        .status(400)
        .json({ error: "Weight to reduce must be a positive number." });
    }
    let existing = await Filament.findOne({
      filament: {
        $regex: new RegExp(
          "^" + safeFilament.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "$",
          "i",
        ),
      },
      color: {
        $regex: new RegExp(
          "^" + safeColor.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "$",
          "i",
        ),
      },
    });
    if (!existing) {
      existing = await Filament.create({
        filament: safeFilament,
        color: safeColor,
        currentStock: 1000,
        usedStock: 0,
        spools: [1000],
      });
    }
    const existingBaseSpools = Array.isArray(existing.baseSpools)
      ? existing.baseSpools.map(Number).filter((w) => w > 0)
      : [];
    const currentSpools = Array.isArray(existing.spools) && existing.spools.length > 0
      ? normalizeSpools(existing.spools, existing.currentStock)
      : existingBaseSpools.length > 0
        ? existingBaseSpools
        : normalizeSpools(existing.spools, existing.currentStock);
    const reduction = subtractSpoolWeight(currentSpools, safeWeight);
    const nextSpools = reduction.spools;
    const nextStock = reduction.totalStock;
    const updated = await Filament.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          spools: nextSpools,
          currentStock: nextStock,
          usedStock: Number(existing.usedStock || 0) + safeWeight,
          baseSpools: existingBaseSpools.length > 0 ? existingBaseSpools : currentSpools,
        },
      },
      { new: true },
    );
    const now = new Date();
    const dateVal = formatDateString(sheetData.date || now);
    const timeVal = now.toLocaleTimeString();
    const userVal =
      username || sheetData.username || req.user?.adminId || "User";

    try {
      await Log.create({
        action: "DELETE_STOCK",
        filament: updated.filament,
        color: updated.color,
        weight: safeWeight,
        spoolNumber: "Spool 1",
        username: userVal,
        date: dateVal,
        time: timeVal,
        adminId: req.user?.adminId || "ADMIN",
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

    if (
      sheetData &&
      (sheetData.partName ||
        sheetData.projectBy ||
        sheetData.printer ||
        sheetData.date)
    ) {
      const rowValues = [
        dateVal,
        userVal,
        sheetData.partName || "",
        sheetData.projectBy || "",
        sheetData.quantity || 1,
        updated.filament,
        updated.color,
        sheetData.filamentUsage || safeWeight,
        sheetData.totalFilamentUsage || safeWeight,
        sheetData.printTime || "",
        sheetData.printer || "",
      ];
      try {
        await appendSheetRow(rowValues);
      } catch (sheetErr) {
        console.error("Sheet append failed:", sheetErr);
      }
    }

    return res.json({
      success: true,
      message: `Removed ${safeWeight}g from inventory.`,
      updated,
      spoolsRemoved: currentSpools.length - nextSpools.length,
    });
  } catch (err) {
    console.error("Delete stock error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
