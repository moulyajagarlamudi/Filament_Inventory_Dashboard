const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const path = require("path");

const filamentRoutes = require("./routes/filamentRoutes");
const authRoutes = require("./routes/authRoutes");
const verifyToken = require("./middleware/authMiddleware");
const Log = require(path.join(__dirname, "models/Log"));
const Filament = require("./models/filamentModel");
const SyncState = require("./models/SyncState");
const { subtractSpoolWeight, getStaticInitialSpools } = require("./utils/spoolManager");


global.og = Log;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use((req, res, next) => {
  console.log("[REQ]", req.method, req.originalUrl);
  next();
});

const SHEET_ID = "1OzkGSMy7l4F3xVrYvTxEpywZN2RSDrnDlLisdhUSp3I";

const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn(
    "MONGO_URI is not defined. MongoDB routes will not function until .env is configured."
  );
}

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.RENDER
    ? "/etc/secrets/credentials.json"
    : "credentials.json",
  // Full spreadsheet access (read & write) for appending rows
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Incremental Google Sheets Sync Helper
const syncGoogleSheetIncremental = async () => {
  try {
    let syncState = await SyncState.findOne({ key: "google_sheet_sync" });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    if (!syncState) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A:L",
        majorDimension: "ROWS",
      });
      const rows = response.data.values || [];
      syncState = await SyncState.create({
        key: "google_sheet_sync",
        lastProcessedRow: rows.length > 0 ? rows.length : 1,
      });
      console.log(`[SYNC] Initialized lastProcessedRow to ${syncState.lastProcessedRow}`);
      return;
    }

    const startRow = syncState.lastProcessedRow + 1;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Sheet1!A${startRow}:L`,
      majorDimension: "ROWS",
    });

    const newRows = response.data.values || [];
    if (newRows.length === 0) {
      return;
    }

    console.log(`[SYNC] Found ${newRows.length} new row(s) to process starting at row ${startRow}`);

    for (const row of newRows) {
      // Row format:
      // 0: S.No., 1: Date, 2: Username, 3: Part Name, 4: Project By, 5: Quantity,
      // 6: Filament Type, 7: Filament Color, 8: Filament Usage, 9: Total Filament Usage, 10: Print Time, 11: Printer
      const filamentType = (row[6] || row[5] || "").trim();
      const filamentColor = (row[7] || row[6] || "").trim();
      const weight = Number(row[9] || row[8] || 0);

      if (filamentType && filamentColor && weight > 0) {
        let item = await Filament.findOne({
          filament: { $regex: new RegExp("^" + filamentType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") },
          color: { $regex: new RegExp("^" + filamentColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") },
        });

        if (!item) {
          const initialSpools = getStaticInitialSpools(filamentType, filamentColor);
          item = await Filament.create({
            filament: filamentType,
            color: filamentColor,
            currentStock: initialSpools.reduce((sum, w) => sum + w, 0),
            usedStock: 0,
            spools: initialSpools,
          });
          console.log(`[SYNC] Initialized new DB doc for ${filamentType} ${filamentColor} with spools [${initialSpools.join(", ")}]`);
        }

        const currentSpools = item.spools || [];
        const { spools: updatedSpools, totalStock } = subtractSpoolWeight(currentSpools, weight);
        await Filament.findByIdAndUpdate(item._id, {
          $set: { spools: updatedSpools, currentStock: totalStock },
        });
        console.log(`[SYNC] Deducted ${weight}g from ${filamentType} ${filamentColor}`);
      }

    }

    syncState.lastProcessedRow += newRows.length;
    await syncState.save();
  } catch (err) {
    console.error("[SYNC] Incremental sync error:", err.message);
  }
};

// Background Google Sheet Auto-Sync (Every 5 seconds)
setInterval(() => {
  syncGoogleSheetIncremental().catch((err) =>
    console.error("[SYNC INTERVAL ERROR]", err)
  );
}, 5000);

// GET LOGS
app.get("/api/logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (
      adminId !== process.env.ADMIN_ID ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        adminId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

app.use("/api/filaments", filamentRoutes);
// DELETE-STOCK endpoint now handled by router


app.get("/api/filaments", async (req, res) => {
  try {
    await syncGoogleSheetIncremental();
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json({ success: true, message: "Incremental sync complete" });
  } catch (err) {
    console.error("GOOGLE SHEET ERROR:", err);
    res.status(500).json({
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 4000;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/version", (req, res) => {
  res.send("NEW BACKEND VERSION");
});

app.get("/healthz", (req, res) => {
  res.send("OK");
});

app.get("/debug-db", async (req, res) => {
  try {
    const count = await Filament.countDocuments();
    const docs = await Filament.find().limit(5);

    res.json({
      count,
      docs,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
