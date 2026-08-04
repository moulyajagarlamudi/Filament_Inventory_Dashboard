const mongoose = require('mongoose');
const Filament = require('./models/filamentModel');
require('dotenv').config({ path: '.env' });

const inventory = [
  { filament: 'Silk PLA', color: 'Silver', spools: [461] },
  { filament: 'Silk PLA', color: 'Dark Yellow', spools: [47] },
  { filament: 'Silk PLA', color: 'Light Gold', spools: [587] },
  { filament: 'Silk PLA', color: 'Tri colour / Blue Green Purple', spools: [535] },
  { filament: 'PLA', color: 'White', spools: [0] },
  { filament: 'PLA', color: 'ANTIQUE BRASS', spools: [648] },
  { filament: 'PLA', color: 'Black', spools: [72] },
  { filament: 'PLA +', color: 'Yellow', spools: [736] },
  { filament: 'PLA +', color: 'Brown', spools: [152] },
  { filament: 'PLA +', color: 'Red', spools: [178] },
  { filament: 'PLA +', color: 'Orange', spools: [0] },
  { filament: 'PLA +', color: 'White', spools: [14, 321] },
  { filament: 'PLA +', color: 'Black', spools: [0] },
  { filament: 'PLA +', color: 'Grey', spools: [0] },
  { filament: 'PLA +', color: 'Blue', spools: [0] },
  { filament: 'PLA +', color: 'Silver', spools: [357] },
  { filament: 'Hyper PLA', color: 'Brown', spools: [0] },
  { filament: 'Hyper PLA', color: 'Blossom L', spools: [824] },
  { filament: 'Hyper PLA', color: 'Gold', spools: [225] },
  { filament: 'Hyper PLA', color: 'Black', spools: [499] },
  { filament: 'Hyper PLA', color: 'Green', spools: [911, 11] },
  { filament: 'Hyper PLA', color: 'Red', spools: [611] },
  { filament: 'Hyper PLA', color: 'White', spools: [167, 664] },
  { filament: 'Hyper PLA', color: 'Blue', spools: [940] },
  { filament: 'Hyper PLA', color: 'Viva Magenta', spools: [199] },
  { filament: 'Hyper PLA', color: 'Orange', spools: [686] },
  { filament: 'PETG', color: 'Orange', spools: [265] },
  { filament: 'PETG', color: 'Blue', spools: [866] },
  { filament: 'PETG', color: 'Transparent', spools: [920] },
  { filament: 'PETG', color: 'Yellow', spools: [325] },
  { filament: 'PETG', color: 'Black', spools: [0] },
  { filament: 'PETG', color: 'Red', spools: [260] },
  { filament: 'ABS', color: 'White', spools: [163] },
  { filament: 'ABS', color: 'Green', spools: [618] },
  { filament: 'ABS', color: 'Black', spools: [95] },
  { filament: 'ABS +', color: 'Brown', spools: [845] },
  { filament: 'ASA', color: 'Lemon Yellow', spools: [924] },
  { filament: 'TPU', color: '95A - Black', spools: [816, 26] },
  { filament: 'TPU', color: 'Silk Black', spools: [944] },
  { filament: 'CF', color: 'PPA - Black', spools: [350] },
  { filament: 'CF', color: 'PLA - Black', spools: [24] },
];

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\+\s*/g, '+');

const getKey = (filament, color) => `${normalizeName(filament)}|${normalizeName(color)}`;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const targetKeys = new Set(inventory.map((item) => getKey(item.filament, item.color)));

    for (const item of inventory) {
      const spools = (item.spools || []).map((weight) => Number(weight || 0));
      const total = spools.reduce((sum, weight) => sum + weight, 0);
      const query = {
        filament: new RegExp(`^${item.filament.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        color: new RegExp(`^${item.color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      };

      await Filament.findOneAndUpdate(
        query,
        {
          $set: {
            filament: item.filament,
            color: item.color,
            spools,
            baseSpools: spools,
            currentStock: total,
            usedStock: 0,
          },
        },
        { upsert: true, new: true },
      );
    }

    const docs = await Filament.find({}).lean();
    const idsToDelete = docs
      .filter((doc) => !targetKeys.has(getKey(doc.filament, doc.color)))
      .map((doc) => doc._id);

    if (idsToDelete.length > 0) {
      await Filament.deleteMany({ _id: { $in: idsToDelete } });
    }

    const updatedDocs = await Filament.find({}).lean();
    console.log(`Updated ${updatedDocs.length} inventory documents.`);
    console.log(JSON.stringify(updatedDocs.find((doc) => doc.filament === 'Hyper PLA' && doc.color === 'Black'), null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
