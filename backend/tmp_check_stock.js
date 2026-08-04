const mongoose = require('mongoose');
const Filament = require('./models/filamentModel');
require('dotenv').config({ path: '.env' });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await Filament.findOne({
      filament: { $regex: '^ABS$', $options: 'i' },
      color: { $regex: '^Black$', $options: 'i' },
    });
    console.log(JSON.stringify({ current: { currentStock: existing && existing.currentStock, spools: existing && existing.spools, usedStock: existing && existing.usedStock } }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
