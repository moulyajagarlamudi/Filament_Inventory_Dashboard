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
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {
  console.warn("Filament model not available to create directly:", e.message);
}

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

app.get("/api/filaments", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A2:L",
    });

    const rows = response.data.values || [];

    let usage = {};

    rows.forEach((row) => {
      // G column
      const filamentType = row[6]?.trim();

      // H column
      const filamentColor = row[7]?.trim();

      // J column
      const weightUsed = Number(row[9] || 0);

      // SAME FORMAT AS FRONTEND
      const key = `${filamentType} ${filamentColor}`;

      console.log("DEBUG:", key, weightUsed);

      if (!filamentType || !filamentColor || isNaN(weightUsed)) return;

      usage[key] = (usage[key] || 0) + weightUsed;
    });

    res.json(usage);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Sheet error" });
  }
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
