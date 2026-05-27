const mongoose = require("mongoose");

const filamentSchema = new mongoose.Schema({
  filament: String,

  color: String,

  currentStock: Number,

  usedStock: Number,

  // ✅ STORE ALL SPOOLS
  spools: {
    type: [Number],
    default: [],
  },
});

module.exports = mongoose.model("Filament", filamentSchema);