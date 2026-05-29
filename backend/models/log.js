const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },

    adminId: {
      type: String,
      default: "admin",
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

module.exports = mongoose.model("Log", logSchema);