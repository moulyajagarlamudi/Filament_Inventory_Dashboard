const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const filamentRoutes = require("./routes/filamentRoutes");
const verifyToken = require("./middleware/authMiddleware");
const path = require("path");
const Log = require(path.join(__dirname, "models/Log"));
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

// simple request logger to help debug routing
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
    "MONGO_URI is not defined. MongoDB routes will not function until .env is configured.",
  );
}

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

// Direct create endpoint to ensure POST /api/filaments returns JSON
// (keeps compatibility and helps clients that hit the root path)
try {
  const Filament = require("./models/filamentModel");

  app.post("/api/filaments", verifyToken, async (req, res) => {
    try {
      const newFilament = await Filament.create(req.body);

      res.json(newFilament);
    } catch (err) {
      console.error("Direct create error:", err);

      res.status(500).json({
        error: err.message,
      });
    }
  });
} catch (e) {
  console.warn("Filament model not available to create directly:", e.message);
}

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.RENDER
    ? "/etc/secrets/credentials.json"
    : "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

// ✅ DEBUG LOGS
console.log("JWT:", process.env.JWT_SECRET);
console.log("ADMIN:", process.env.ADMIN_ID);
console.log(
  "MONGO:",
  process.env.MONGO_URI ? "FOUND" : "MISSING",
);

app.get("/api/filaments", async (req, res) => {
  try {
    const client = await auth.getClient();

    const sheets = google.sheets({
      version: "v4",
      auth: client,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A2:J",
      // ADD THIS 👇
      majorDimension: "ROWS",
    });

    const rows = response.data.values || [];

    let usage = {};

    rows.forEach((row) => {
      console.log("ROW:", row);
      const filamentType = row[6];
      const filamentColor = row[7];
      const totalUsage = Number(row[9] || 0);

      if (!filamentType || !filamentColor) return;

      const key = `${filamentType} ${filamentColor}`;
      usage[key] = (usage[key] || 0) + totalUsage;
    });

    // 🔥 FORCE NO CACHE
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.json(usage);
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
