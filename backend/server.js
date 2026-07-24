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
const {
  subtractSpoolWeight,
  getStaticInitialSpools,
  getStaticSpoolMap,
  getStaticCasing,
} = require("./utils/spoolManager");

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

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\+\s*/g, "+");

const getCanonicalKey = (filamentName, colorName) =>
  `${normalizeName(filamentName)}|${normalizeName(colorName)}`;

const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.warn(
    "MONGO_URI is not defined. MongoDB routes will not function until .env is configured.",
  );
}

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.RENDER
    ? "/etc/secrets/credentials.json"
    : path.join(__dirname, "credentials.json"),
  // Full spreadsheet access (read & write) for appending rows
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const DEFAULT_INVENTORY = [
  { filament: "Hyper PLA", color: "White", spools: [167, 664] },
  { filament: "Hyper PLA", color: "Orange", spools: [686] },
  { filament: "Hyper PLA", color: "Blue", spools: [940] },
  { filament: "Hyper PLA", color: "Gold", spools: [225] },
  { filament: "Hyper PLA", color: "Green", spools: [911, 11] },
  { filament: "Hyper PLA", color: "Blossom L", spools: [824] },
  { filament: "Hyper PLA", color: "Red", spools: [611] },
  { filament: "Hyper PLA", color: "Viva Magenta", spools: [199] },
  { filament: "Hyper PLA", color: "Black", spools: [499] },
  { filament: "PLA +", color: "White", spools: [14, 321] },
  { filament: "PLA +", color: "Yellow", spools: [736] },
  { filament: "PLA +", color: "Silver", spools: [357] },
  { filament: "Silk PLA", color: "Tri colour / Blue Green Purple", spools: [535] },
  { filament: "Silk PLA", color: "Light Gold", spools: [587] },
  { filament: "PLA", color: "ANTIQUE BRASS", spools: [47] },
  { filament: "ePLA-Metal", color: "Metal Brass", spools: [648] },
  { filament: "Eco PLA", color: "Black", spools: [72] },
  { filament: "ABS", color: "Green", spools: [618] },
  { filament: "ABS", color: "White", spools: [163] },
  { filament: "ABS +", color: "Brown", spools: [845] },
  { filament: "ASA", color: "Lemon Yellow", spools: [924] },
  { filament: "TPU", color: "95A - Black", spools: [816, 26] },
  { filament: "TPU", color: "Silk Black", spools: [944] },
  { filament: "PETG", color: "Blue", spools: [866] },
  { filament: "PETG", color: "Yellow", spools: [325] },
  { filament: "PETG", color: "Transparent", spools: [920] },
  { filament: "PETG", color: "Red", spools: [260] },
  { filament: "PETG", color: "Orange", spools: [265] },
  { filament: "CF", color: "PLA - Black", spools: [24] },
  { filament: "CF", color: "PPA - Black", spools: [350] },
];

const seedDefaultInventory = async () => {
  try {
    const seedEntries = DEFAULT_INVENTORY.map((item) => {
      const spools = (item.spools || []).map((weight) => Number(weight || 0));
      return {
        filament: String(item.filament || "").trim(),
        color: String(item.color || "").trim(),
        spools,
        currentStock: spools.reduce((sum, weight) => sum + weight, 0),
        usedStock: 0,
        baseSpools: spools,
      };
    });

    const existingDocs = await Filament.find({});
    const existingByKey = new Map();

    existingDocs.forEach((doc) => {
      const key = getCanonicalKey(doc.filament, doc.color);
      if (!existingByKey.has(key)) {
        existingByKey.set(key, []);
      }
      existingByKey.get(key).push(doc);
    });

    for (const item of seedEntries) {
      const key = getCanonicalKey(item.filament, item.color);
      const matchingDocs = existingByKey.get(key) || [];

      if (matchingDocs.length > 0) {
        const [docToUpdate] = matchingDocs;
        await Filament.findByIdAndUpdate(
          docToUpdate._id,
          {
            $set: {
              filament: item.filament,
              color: item.color,
              spools: item.spools,
              currentStock: item.currentStock,
              usedStock: 0,
              baseSpools: item.baseSpools,
            },
          },
          { new: true },
        );

        if (matchingDocs.length > 1) {
          const idsToDelete = matchingDocs.slice(1).map((doc) => doc._id);
          await Filament.deleteMany({ _id: { $in: idsToDelete } });
        }
      } else {
        await Filament.create(item);
      }
    }

    const allTargetKeys = new Set(seedEntries.map((item) => getCanonicalKey(item.filament, item.color)));
    const docsToDelete = existingDocs.filter(
      (doc) => !allTargetKeys.has(getCanonicalKey(doc.filament, doc.color)),
    );

    if (docsToDelete.length > 0) {
      await Filament.deleteMany({ _id: { $in: docsToDelete.map((doc) => doc._id) } });
    }

    console.log("Seeded and synchronized inventory documents to the requested weights");
  } catch (err) {
    console.error("Seed inventory error:", err.message);
  }
};

// Google Sheets Full Auto-Sync Helper
// Reads all active rows from Google Sheet to ensure new entries, edited entries, AND removed entries automatically update the website.
const syncGoogleSheetIncremental = async () => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Fetch all active usage rows starting from row 2 (row 1 is header)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A2:L",
      majorDimension: "ROWS",
    });

    const rows = response.data.values || [];

    // Retrieve existing DB documents and collapse duplicate variants
    const existingDocs = await Filament.find();
    const docMap = {};
    const groupedDocs = {};

    existingDocs.forEach((doc) => {
      const filament = String(doc.filament || "").trim();
      const color = String(doc.color || "").trim();

      if (!filament || !color) {
        console.warn("Skipping invalid document:", doc._id);
        return;
      }

      const key = getCanonicalKey(filament, color);
      if (!groupedDocs[key]) {
        groupedDocs[key] = [];
      }

      groupedDocs[key].push(doc);
    });

    for (const [key, docs] of Object.entries(groupedDocs)) {
      if (docs.length > 1) {
        const duplicateIds = docs.slice(1).map((doc) => doc._id);
        if (duplicateIds.length > 0) {
          await Filament.deleteMany({ _id: { $in: duplicateIds } });
        }
      }

      const primaryDoc = docs[0];
      if (primaryDoc) {
        docMap[key] = primaryDoc;
      }
    }

    const staticGroups = getStaticSpoolMap();
    const allKeys = new Set(Object.keys(docMap));

    for (const [groupName, colors] of Object.entries(staticGroups)) {
      for (const colorName of Object.keys(colors)) {
        allKeys.add(getCanonicalKey(groupName, colorName));
      }
    }

    for (const key of allKeys) {
      const [fTypeLower, fColorLower] = key.split("|");
      const existingDoc = docMap[key];

      let filamentName = existingDoc ? existingDoc.filament : "";
      let colorName = existingDoc ? existingDoc.color : "";

      if (!filamentName || !colorName) {
        const staticMatch = getStaticCasing(fTypeLower, fColorLower);
        filamentName = staticMatch.filament || fTypeLower;
        colorName = staticMatch.color || fColorLower;
      }

      const staticMatch = getStaticCasing(filamentName, colorName);
      filamentName = staticMatch.filament || filamentName;
      colorName = staticMatch.color || colorName;

      let baseSpools = [];
      if (
        existingDoc &&
        Array.isArray(existingDoc.baseSpools) &&
        existingDoc.baseSpools.length > 0
      ) {
        baseSpools = existingDoc.baseSpools.map(Number).filter((w) => w > 0);
      } else if (
        existingDoc &&
        Array.isArray(existingDoc.spools) &&
        existingDoc.spools.length > 0
      ) {
        baseSpools = existingDoc.spools.map(Number).filter((w) => w > 0);
      } else {
        baseSpools = getStaticInitialSpools(filamentName, colorName);
      }

      const normalizedBaseSpools = baseSpools.map((weight) => Number(weight || 0));
      const totalStock = normalizedBaseSpools.reduce(
        (sum, weight) => sum + weight,
        0,
      );
      const usedStock = Number(existingDoc?.usedStock || 0);

      if (existingDoc) {
        await Filament.findByIdAndUpdate(existingDoc._id, {
          $set: {
            filament: filamentName,
            color: colorName,
            spools: normalizedBaseSpools,
            currentStock: totalStock,
            usedStock,
            baseSpools: normalizedBaseSpools,
          },
        });
      } else {
        await Filament.create({
          filament: filamentName,
          color: colorName,
          spools: normalizedBaseSpools,
          currentStock: totalStock,
          usedStock,
          baseSpools: normalizedBaseSpools,
        });
      }
    }
  } catch (err) {
    console.error("[SYNC ERROR]", err.message);
  }
};

// Background Google Sheet Auto-Sync (Every 5 seconds)
// setInterval(() => {
//   syncGoogleSheetIncremental().catch((err) =>
//     console.error("[SYNC INTERVAL ERROR]", err),
//   );
// }, 5000);

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
      },
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

app.get("/api/filaments", async (req, res) => {
  try {
    await syncGoogleSheetIncremental();
    const filaments = await Filament.find();
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json({
      success: true,
      message: "Incremental sync complete",
      data: filaments,
    });
  } catch (err) {
    console.error("GOOGLE SHEET ERROR:", err);
    res.status(500).json({ error: err.message });
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
  seedDefaultInventory().catch((err) => console.error("[SEED ERROR]", err));
  syncGoogleSheetIncremental().catch((err) =>
    console.error("[STARTUP SYNC ERROR]", err),
  );
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

app.get("/api/logs", async (req, res) => {
  // Disable caching
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("[LOGS ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  syncGoogleSheetIncremental,
};
