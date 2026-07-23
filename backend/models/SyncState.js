const mongoose = require("mongoose");

const syncStateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    lastProcessedRow: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.SyncState || mongoose.model("SyncState", syncStateSchema);
