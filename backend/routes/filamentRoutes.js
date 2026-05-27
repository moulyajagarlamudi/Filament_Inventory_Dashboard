const express = require("express");
const Filament = require("../models/filamentModel");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newFilament = await Filament.create(req.body);
    res.json(newFilament);
  } catch (err) {
    console.error("Create filament error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/inventory", async (req, res) => {
  try {
    const filaments = await Filament.find().sort({ filament: 1, color: 1 });
    res.json(filaments);
  } catch (err) {
    console.error("Inventory fetch error:", err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Filament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ error: "Filament not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Update filament error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Filament.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Filament not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete filament error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-stock", async (req, res) => {
  const { filament, color, amount } = req.body;
  const parsedAmount = Number(amount);

  if (!filament || !color || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "filament, color and positive amount are required" });
  }

  try {
    const updatedFilament = await Filament.findOneAndUpdate(
      { filament, color },
      {
        $inc: { currentStock: parsedAmount },
        $set: { updatedAt: new Date() },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json(updatedFilament);
  } catch (err) {
    console.error("Add stock error:", err);
    res.status(500).json({ error: "Failed to update stock" });
  }
});

router.post("/use-stock", async (req, res) => {
  const { filament, color, amount } = req.body;
  const parsedAmount = Number(amount);

  if (!filament || !color || isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "filament, color and positive amount are required" });
  }

  try {
    const existing = await Filament.findOne({ filament, color });
    if (!existing) {
      return res.status(404).json({ error: "Filament entry not found" });
    }

    if (existing.currentStock < parsedAmount) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    existing.currentStock -= parsedAmount;
    existing.usedStock += parsedAmount;
    existing.updatedAt = new Date();
    await existing.save();

    res.json(existing);
  } catch (err) {
    console.error("Use stock error:", err);
    res.status(500).json({ error: "Failed to update used stock" });
  }
});

module.exports = router;
