/**
 * Calculate dynamic font size based on multiplier
 * @param {number} baseSize - The base font size
 * @param {number} multiplier - The font size multiplier (1 = normal, 1.2 = 20% larger, etc.)
 * @returns {number} - The calculated font size
 */
export const calculateFontSize = (baseSize, multiplier = 1) => {
  return Math.round(baseSize * multiplier);
};

/**
 * Predefined font size multipliers
 */
export const fontSizePresets = {
  small: 0.85,
  medium: 1,
  large: 1.15,
};

/**
 * Get label for font size multiplier
 */
export const getFontSizeLabel = (multiplier) => {
  if (multiplier === fontSizePresets.small) return 'Small';
  if (multiplier === fontSizePresets.medium) return 'Medium';
  if (multiplier === fontSizePresets.large) return 'Large';
  return 'Custom';
};
