/**
 * Spool Weight Manager
 * Reduces spool weights starting from the LOWEST spool first and removes any spool that reaches 0g.
 */

const STATIC_SPOOL_MAP = {
  "Silk PLA": {
    Silver: [450],
    "Dark Yellow": [100],
    "Light Gold": [600],
    "Tri colour / Blue Green Purple": [600],
  },
  PLA: {
    White: [300],
    "ANTIQUE BRASS": [900],
    Black: [3000],
  },
  "PLA +": {
    Yellow: [950],
    Brown: [90],
    Red: [200, 30, 50, 200],
    Orange: [150],
    White: [500, 350],
    Black: [50],
    Grey: [30],
    Blue: [100],
  },
  "Hyper PLA": {
    Brown: [50],
    "Blossom L": [800],
    Gold: [180],
    Black: [100, 150, 900, 400, 600],
    Green: [80, 950],
    Red: [950],
    White: [2000],
    Blue: [1000],
    "Viva Magenta": [100],
    Orange: [1000],
  },
  PETG: {
    Orange: [270],
    Blue: [800],
    Transparent: [850],
    Yellow: [300],
    Black: [0],
    Red: [1000, 250, 1000],
  },
  ABS: {
    White: [250],
    Green: [650],
    Black: [100],
  },
  "ABS +": {
    Brown: [900],
  },
  ASA: {
    "Lemon Yellow": [1000],
  },
  TPU: {
    "95A - Black": [900, 50],
    "Silk Black": [900],
  },
  CF: {
    "PPA - Black": [250],
    "PLA - Black": [50],
  },
};

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\+\s*/g, "+");
}

function normalizeSpools(spools) {
  if (!Array.isArray(spools)) return [];

  return spools
    .map((spool) => {
      if (spool && typeof spool === "object") {
        return Number(spool.weight || 0);
      }

      return Number(spool || 0);
    })
    .filter((weight) => weight > 0);
}

function subtractSpoolWeight(spools, weightToSubtract) {
  const numericSpools = normalizeSpools(spools).sort((a, b) => a - b);

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

  updatedSpools = updatedSpools.filter((weight) => Number(weight) > 0);

  const totalStock = updatedSpools.reduce((sum, weight) => sum + weight, 0);

  return {
    spools: updatedSpools,
    totalStock,
  };
}

function getStaticSpoolMap() {
  return STATIC_SPOOL_MAP;
}

function getStaticInitialSpools(filamentName, colorName) {
  const filament = normalizeName(filamentName);
  const color = normalizeName(colorName);

  if (!filament || !color) {
    return [1000];
  }

  const filamentGroup = STATIC_SPOOL_MAP[String(filamentName || "").trim()];
  if (filamentGroup && Array.isArray(filamentGroup[String(colorName || "").trim()])) {
    return filamentGroup[String(colorName || "").trim()]
      .map((weight) => Number(weight || 0))
      .filter((weight) => weight > 0);
  }

  for (const [groupName, colors] of Object.entries(STATIC_SPOOL_MAP)) {
    if (normalizeName(groupName) !== filament) continue;

    for (const [colorKey, spools] of Object.entries(colors)) {
      if (normalizeName(colorKey) === color && Array.isArray(spools)) {
        return spools
          .map((weight) => Number(weight || 0))
          .filter((weight) => weight > 0);
      }
    }
  }

  const fallbackGroup = Object.values(STATIC_SPOOL_MAP).find((group) =>
    Object.keys(group).some((key) => normalizeName(key) === color),
  );

  if (fallbackGroup) {
    const fallbackSpools = Object.values(fallbackGroup)[0];
    if (Array.isArray(fallbackSpools)) {
      return fallbackSpools
        .map((weight) => Number(weight || 0))
        .filter((weight) => weight > 0);
    }
  }

  return [1000];
}

function getStaticCasing(filamentName, colorName) {
  const filament = normalizeName(filamentName);
  const color = normalizeName(colorName);

  if (!filament || !color) {
    return { filament: String(filamentName || "").trim(), color: String(colorName || "").trim() };
  }

  for (const [groupName, colors] of Object.entries(STATIC_SPOOL_MAP)) {
    if (normalizeName(groupName) === filament) {
      const matchingColor = Object.keys(colors).find(
        (colorKey) => normalizeName(colorKey) === color,
      );

      if (matchingColor) {
        return { filament: groupName, color: matchingColor };
      }
    }
  }

  return { filament: String(filamentName || "").trim(), color: String(colorName || "").trim() };
}

module.exports = {
  subtractSpoolWeight,
  getStaticInitialSpools,
  getStaticSpoolMap,
  getStaticCasing,
};