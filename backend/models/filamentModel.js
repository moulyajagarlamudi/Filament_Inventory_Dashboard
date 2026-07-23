const mongoose = require("mongoose");

const filamentSchema = new mongoose.Schema(
  {
    filament: {
      type: String,
      required: true,
    },

    color: {
      type: String,
      required: true,
    },

    currentStock: {
      type: Number,
      default: 0,
    },

    usedStock: {
      type: Number,
      default: 0,
    },

    // ✅ STORE MULTIPLE SPOOLS
    spools: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Filament ||
  mongoose.model("Filament", filamentSchema);