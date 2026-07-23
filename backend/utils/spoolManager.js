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

module.exports = {
  subtractSpoolWeight,
};
