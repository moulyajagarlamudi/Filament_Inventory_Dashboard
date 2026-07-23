/**
 * Spool Weight Manager
 * Reduces spool weights starting from the LOWEST spool first and removes any spool that reaches 0g.
 */

/**
 * Subtract weight from spools - removes material from lowest spool first
 * @param {Number[]} spools - Array of spool weights
 * @param {Number} weightToSubtract - Weight to subtract
 * @returns {Object} { spools: updated array, totalStock: new total, affectedSpoolIndex: number }
 */
function subtractSpoolWeight(spools, weightToSubtract) {
  if (!Array.isArray(spools)) {
    spools = [];
  }

  // Extract clean number weights > 0
  let numericSpools = spools
    .map((s) => (typeof s === "object" ? Number(s.weight || 0) : Number(s || 0)))
    .filter((w) => w > 0);

  // Sort ascending so material is removed from the LOWEST spool first
  numericSpools.sort((a, b) => a - b);

  let remaining = Number(weightToSubtract || 0);
  let updatedSpools = [...numericSpools];

  for (let i = 0; i < updatedSpools.length && remaining > 0; i++) {
    const spoolWeight = updatedSpools[i];
    if (spoolWeight <= remaining) {
      remaining -= spoolWeight;
      updatedSpools[i] = 0;
    } else {
      updatedSpools[i] = spoolWeight - remaining;
      remaining = 0;
    }
  }

  // Filter out empty spools (0g)
  updatedSpools = updatedSpools.filter((weight) => Number(weight || 0) > 0);

  // Recalculate total stock
  const totalStock = updatedSpools.reduce((sum, w) => sum + Number(w || 0), 0);

  return {
    spools: updatedSpools,
    totalStock,
  };
}

const staticSpoolMap = {
  "Silk PLA": {
    "Silver": [450],
    "Dark Yellow": [100],
    "Light Gold": [600],
    "Tri colour / Blue Green Purple": [600],
  },
  "PLA": {
    "White": [300],
    "ANTIQUE BRASS": [900],
    "Black": [3000],
  },
  "PLA +": {
    "Yellow": [950],
    "Brown": [90],
    "Red": [200, 30, 50, 200],
    "Orange": [150],
    "White": [500, 350],
    "Black": [50],
    "Grey": [30],
    "Blue": [100],
  },
  "Hyper PLA": {
    "Brown": [50],
    "Blossom L": [800],
    "Gold": [180],
    "Black": [100, 150, 900, 400, 600],
    "Green": [80, 950],
    "Red": [950],
    "White": [2000],
    "Blue": [1000],
    "Viva Magenta": [100],
    "Orange": [1000],
  },
  "PETG": {
    "Orange": [270],
    "Blue": [800],
    "Transparent": [850],
    "Yellow": [300],
    "Black": [0],
    "Red": [1000, 250, 1000],
  },
  "ABS": {
    "White": [250],
    "Green": [650],
    "Black": [100],
  },
  "ABS +": {
    "Brown": [900],
  },
  "ASA": {
    "Lemon Yellow": [1000],
  },
  "TPU": {
    "95A - Black": [900, 50],
    "Silk Black": [900],
  },
  "CF": {
    "PPA - Black": [250],
    "PLA - Black": [50],
  },
};

function getStaticInitialSpools(filament, color) {
  if (!filament || !color) return [1000];
  const fNorm = filament.trim().toLowerCase();
  const cNorm = color.trim().toLowerCase();

  for (const groupKey of Object.keys(staticSpoolMap)) {
    if (groupKey.toLowerCase() === fNorm) {
      for (const colorKey of Object.keys(staticSpoolMap[groupKey])) {
        if (colorKey.toLowerCase() === cNorm) {
          return [...staticSpoolMap[groupKey][colorKey]];
        }
      }
    }
  }
  return [1000];
}

module.exports = {
  subtractSpoolWeight,
  getStaticInitialSpools,
};

