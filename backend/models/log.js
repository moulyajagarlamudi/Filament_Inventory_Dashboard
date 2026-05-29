const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },

  filament: {
    type: String,
  },

  color: {
    type: String,
  },

  weight: {
    type: Number,
  },

  user: {
    type: String,
    default: "Admin",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Log", logSchema);