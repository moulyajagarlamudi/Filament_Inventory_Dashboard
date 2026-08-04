const mongoose = require("mongoose");
const Filament = require("./models/filamentModel");
require("dotenv").config({ path: ".env" });

mongoose.connect(process.env.MONGO_URI);

async function update() {
  const inventory = [
    {
      filament: "Hyper PLA",
      color: "White",
      spools: [167, 664],
    },
    {
      filament: "Hyper PLA",
      color: "Orange",
      spools: [686],
    },
    {
      filament: "Hyper PLA",
      color: "Blue",
      spools: [940],
    },
    {
      filament: "Hyper PLA",
      color: "Gold",
      spools: [225],
    },
    {
      filament: "Hyper PLA",
      color: "Green",
      spools: [911, 11],
    },
    {
      filament: "Hyper PLA",
      color: "Blossom L",
      spools: [824],
    },
    {
      filament: "Hyper PLA",
      color: "Red",
      spools: [611],
    },
    {
      filament: "Hyper PLA",
      color: "Viva Magenta",
      spools: [199],
    },
    {
      filament: "Hyper PLA",
      color: "Black",
      spools: [499],
    },

    {
      filament: "PLA +",
      color: "White",
      spools: [14, 321],
    },
    {
      filament: "Silk PLA",
      color: "Tri colour / Blue Green Purple",
      spools: [535],
    },
    {
      filament: "ePLA-Metal",
      color: "Metal Brass",
      spools: [648],
    },
    {
      filament: "Eco PLA",
      color: "Black",
      spools: [72],
    },
    {
      filament: "PLA +",
      color: "Yellow",
      spools: [736],
    },
    {
      filament: "Silk PLA",
      color: "Light Gold",
      spools: [587],
    },
    {
      filament: "PLA",
      color: "ANTIQUE BRASS",
      spools: [47],
    },
    {
      filament: "PLA +",
      color: "Silver",
      spools: [357],
    },

    {
      filament: "ABS",
      color: "Green",
      spools: [618],
    },
    {
      filament: "ABS",
      color: "White",
      spools: [163],
    },
    {
      filament: "ABS +",
      color: "Brown",
      spools: [845],
    },

    {
      filament: "ASA",
      color: "Lemon Yellow",
      spools: [924],
    },

    {
      filament: "TPU",
      color: "95A - Black",
      spools: [816, 26],
    },
    {
      filament: "TPU",
      color: "Silk Black",
      spools: [944],
    },

    {
      filament: "PETG",
      color: "Blue",
      spools: [866],
    },
    {
      filament: "PETG",
      color: "Yellow",
      spools: [325],
    },
    {
      filament: "PETG",
      color: "Transparent",
      spools: [920],
    },
    {
      filament: "PETG",
      color: "Red",
      spools: [260],
    },
    {
      filament: "PETG",
      color: "Orange",
      spools: [265],
    },

    {
      filament: "CF",
      color: "PLA - Black",
      spools: [24],
    },
    {
      filament: "CF",
      color: "PPA - Black",
      spools: [350],
    },
  ];

  await Filament.deleteMany({});
  console.log("🗑️ Old inventory deleted");

  for (const item of inventory) {
    const spools = item.spools.map((weight) => Number(weight || 0));
    const total = spools.reduce((sum, w) => sum + w, 0);

    await Filament.create({
      filament: item.filament,
      color: item.color,
      currentStock: total,
      usedStock: 0,
      spools,
      baseSpools: spools,
    });

    console.log(`✅ Added ${item.filament} - ${item.color}`);
  }

  console.log("🎉 Inventory recreated successfully");

  await mongoose.disconnect();
}

update().catch((err) => {
  console.error(err);
  mongoose.disconnect();
});
