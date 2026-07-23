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
    spoolNumber: {
      type: String,
      default: "Spool 1",
    },
    username: {
      type: String,
      default: "Admin",
    },
    date: String,
    time: String,

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
  }
);

module.exports =
  mongoose.models.Log || mongoose.model("Log", logSchema);