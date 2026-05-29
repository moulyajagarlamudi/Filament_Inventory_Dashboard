const express = require("express");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

const Filament = require("../models/filamentModel");

const Log = require("../models/Log");


// ========================================
// GET INVENTORY
// ========================================
router.get("/inventory", async (req, res) => {
  try {
    const inventory = await Filament.find().sort({
      createdAt: -1,
    });

    res.json(inventory);
  } catch (err) {
    console.log("Inventory fetch error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// ========================================
// CREATE NEW STOCK
// ========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      filament,
      color,
      currentStock,
      usedStock,
      spools,
    } = req.body;

    const newFilament = await Filament.create({
      filament,
      color,
      currentStock,
      usedStock,
      spools,
    });

    // ✅ STORE LOG
    await Log.create({
      action: "NEW_STOCK_CREATED",
      filament,
      color,
      weight: currentStock,
    });

    res.json(newFilament);
  } catch (err) {
    console.log("Create stock error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// ========================================
// UPDATE STOCK
// ========================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const existing = await Filament.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Filament not found",
      });
    }

    const previousStock = existing.currentStock || 0;

    const updated = await Filament.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    const newStock = updated.currentStock || 0;

    const addedWeight = newStock - previousStock;

    // ✅ STORE LOG
    await Log.create({
      action: "ADD_STOCK",
      filament: updated.filament,
      color: updated.color,
      weight: addedWeight,
    });

    res.json(updated);
  } catch (err) {
    console.log("Update stock error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});


// ========================================
// DELETE FILAMENT
// ========================================
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const existing = await Filament.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: "Filament not found",
      });
    }

    await Filament.findByIdAndDelete(req.params.id);

    // ✅ STORE LOG
    await Log.create({
      action: "DELETE_STOCK",
      filament: existing.filament,
      color: existing.color,
      weight: existing.currentStock,
    });

    res.json({
      success: true,
      message: "Filament deleted successfully",
    });
  } catch (err) {
    console.log("Delete stock error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;