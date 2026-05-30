const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },

    filament: String,
    color: String,
    weight: Number,

    adminId: {
      type: String,
      default: "ADMIN",
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// ✅ FIX OVERWRITE ERROR
module.exports =
  mongoose.models.Log || mongoose.model("Log", logSchema);