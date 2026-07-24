const mongoose = require('mongoose');
const Filament = require('./models/filamentModel');

(async () => {
  try {
    await mongoose.connect('mongodb+srv://moulyajagarlamudi93_db_user:moulya1234@cluster0.pvodhao.mongodb.net/filamentDB?retryWrites=true&w=majority&appName=Cluster0');
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
