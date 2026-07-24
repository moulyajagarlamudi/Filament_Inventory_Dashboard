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

    spools: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    baseSpools: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// ⭐ ADD THESE 3 LINES
filamentSchema.index(
  { filament: 1, color: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Filament ||
  mongoose.model("Filament", filamentSchema);