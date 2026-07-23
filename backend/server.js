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
    : path.join(__dirname, "credentials.json"),
  // Full spreadsheet access (read & write) for appending rows
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});


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

    // Map total usage by key "filament|color"
    const usageMap = {};
    for (const row of rows) {
      const fType = (row[6] || "").trim();
      const fColor = (row[7] || "").trim();
      const weight = parseFloat(row[9]) > 0 ? parseFloat(row[9]) : (parseFloat(row[8]) > 0 ? parseFloat(row[8]) : 0);

      if (fType && fColor && weight > 0) {
        const key = `${fType.toLowerCase()}|${fColor.toLowerCase()}`;
        if (!usageMap[key]) {
          usageMap[key] = 0;
        }
        usageMap[key] += weight;
      }
    }

    // Retrieve existing DB documents
    const existingDocs = await Filament.find();
    const docMap = {};
    existingDocs.forEach((doc) => {
      const key = `${doc.filament.toLowerCase().trim()}|${doc.color.toLowerCase().trim()}`;
      docMap[key] = doc;
    });

    const staticGroups = getStaticSpoolMap();
    const allKeys = new Set([...Object.keys(docMap)]);

    for (const groupName of Object.keys(staticGroups)) {
      for (const colorName of Object.keys(staticGroups[groupName])) {
        allKeys.add(`${groupName.toLowerCase().trim()}|${colorName.toLowerCase().trim()}`);
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

      // Determine base spools
      let baseSpools = [];
      if (existingDoc && Array.isArray(existingDoc.baseSpools) && existingDoc.baseSpools.length > 0) {
        baseSpools = existingDoc.baseSpools.map(Number).filter((w) => w > 0);
      } else {
        baseSpools = getStaticInitialSpools(filamentName, colorName);
      }

      const totalUsage = usageMap[key] || 0;
      const { spools: updatedSpools, totalStock } = subtractSpoolWeight(baseSpools, totalUsage);

      if (existingDoc) {
        await Filament.findByIdAndUpdate(existingDoc._id, {
          $set: {
            spools: updatedSpools,
            currentStock: totalStock,
            usedStock: totalUsage,
            baseSpools: baseSpools,
          },
        });
      } else {
        await Filament.create({
          filament: filamentName,
          color: colorName,
          spools: updatedSpools,
          currentStock: totalStock,
          usedStock: totalUsage,
          baseSpools: baseSpools,
        });
      }
    }
  } catch (err) {
    console.error("[SYNC ERROR]", err.message);
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
  // Run initial Google Sheet sync immediately on server start
  syncGoogleSheetIncremental().catch((err) =>
    console.error("[STARTUP SYNC ERROR]", err)
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

module.exports = {
  syncGoogleSheetIncremental,
};


