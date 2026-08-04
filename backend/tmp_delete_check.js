const mongoose = require('mongoose');
const Filament = require('./models/filamentModel');
const { subtractSpoolWeight } = require('./utils/spoolManager');
require('dotenv').config({ path: '.env' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await Filament.findOne({
      filament: { $regex: '^ABS$', $options: 'i' },
      color: { $regex: '^Black$', $options: 'i' },
    });

    if (!existing) {
      throw new Error('ABS Black record not found');
    }

    const currentSpools = Array.isArray(existing.spools) && existing.spools.length > 0
      ? existing.spools
      : [existing.currentStock || 0];

    const reduction = subtractSpoolWeight(currentSpools, 12);
    const updated = await Filament.findByIdAndUpdate(existing._id, {
      $set: {
        spools: reduction.spools,
        currentStock: reduction.totalStock,
        usedStock: Number(existing.usedStock || 0) + 12,
        baseSpools: Array.isArray(existing.baseSpools) && existing.baseSpools.length > 0 ? existing.baseSpools : currentSpools,
      },
    }, { new: true });

    console.log(JSON.stringify({
      before: { currentStock: existing.currentStock, spools: existing.spools, usedStock: existing.usedStock },
      after: { currentStock: updated.currentStock, spools: updated.spools, usedStock: updated.usedStock },
    }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
