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
    const { filament, color, currentStock = 0, usedStock = 0, spools = [] } = req.body;

    // Try to find existing document by filament+color
    const filter = { filament, color };

    const existing = await Filament.findOne(filter);

    if (existing) {
      // Merge spools arrays and recalc stock
      const mergedSpools = [ ...(existing.spools || []), ...spools ];
      const totalStock = mergedSpools.reduce((s, w) => s + Number(w || 0), 0);

      const updated = await Filament.findOneAndUpdate(
        filter,
        {
          $set: {
            spools: mergedSpools,
            usedStock: usedStock || existing.usedStock,
            currentStock: totalStock,
          },
        },
        { new: true },
      );

      // ✅ SAFE LOG
      try {
        await Log.create({
          action: "ADD_STOCK",
          filament,
          color,
          weight: (updated.currentStock || 0) - (existing.currentStock || 0),
        });
      } catch (logErr) {
        console.error("Log create failed (non-fatal):", logErr);
      }

      return res.json(updated);
    }

    // Create new document when none exists. If a race causes duplicate-key,
    // fallback to updating the existing document instead of failing.
    try {
      const newFilament = await Filament.create({
        filament,
        color,
        currentStock,
        usedStock,
        spools,
      });

      try {
        await Log.create({
          action: "NEW_STOCK_CREATED",
          filament,
          color,
          weight: currentStock,
        });
      } catch (logErr) {
        console.error("Log create failed (non-fatal):", logErr);
      }

      return res.json(newFilament);
    } catch (createErr) {
      // Handle duplicate key race: merge into existing doc
      if (createErr && createErr.code === 11000) {
        console.warn("Duplicate key on create; falling back to update/merge");

        const existingAfter = await Filament.findOne(filter);
        const mergedSpools = [ ...(existingAfter.spools || []), ...spools ];
        const totalStock = mergedSpools.reduce((s, w) => s + Number(w || 0), 0);

        const updated = await Filament.findOneAndUpdate(
          filter,
          {
            $set: {
              spools: mergedSpools,
              usedStock: usedStock || existingAfter.usedStock,
              currentStock: totalStock,
            },
          },
          { new: true },
        );

        try {
          await Log.create({
            action: "ADD_STOCK",
            filament,
            color,
            weight: (updated.currentStock || 0) - (existingAfter.currentStock || 0),
          });
        } catch (logErr) {
          console.error("Log create failed (non-fatal):", logErr);
        }

        return res.json(updated);
      }

      throw createErr;
    }
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

    const updated = await Filament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    const newStock = updated.currentStock || 0;

    const addedWeight = newStock - previousStock;

    // ✅ STORE LOG
    try {
      await Log.create({
        action: "ADD_STOCK",
        filament: updated.filament,
        color: updated.color,
        weight: addedWeight,
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

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
    try {
      await Log.create({
        action: "DELETE_STOCK",
        filament: existing.filament,
        color: existing.color,
        weight: existing.currentStock,
      });
    } catch (logErr) {
      console.error("Log create failed (non-fatal):", logErr);
    }

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
