const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { google } = require("googleapis");
const filamentRoutes = require("./routes/filamentRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

app.use("/api/filaments", filamentRoutes);

// Direct create endpoint to ensure POST /api/filaments returns JSON
// (keeps compatibility and helps clients that hit the root path)
try {
  const Filament = require("./models/filamentModel");

  app.post("/api/filaments", async (req, res) => {
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
  console.warn(
    "Filament model not available to create directly:",
    e.message,
  );
}

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.RENDER
    ? "/etc/secrets/credentials.json"
    : "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

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
    });

    const rows = response.data.values || [];

    let usage = {};

    rows.forEach((row) => {
      const filamentType = row[5];
      const filamentColor = row[6];
      const totalUsage = Number(row[8] || 0);

      const key = `${filamentType} ${filamentColor}`;

      if (!filamentType || !filamentColor) return;

      usage[key] = (usage[key] || 0) + totalUsage;
    });

    res.json(usage);
  } catch (err) {
    console.error("GOOGLE SHEET ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/healthz", (req, res) => {
  res.send("OK");
});
