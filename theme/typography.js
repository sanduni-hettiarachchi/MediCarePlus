export const typography = {
  sizes: {
    body: 16,
    secondary: 14,
    caption: 14,
    heading: 24,
  },
  largeTextMultiplier: 1.25,
};

export function fontSize(size, largeText = false) {
  return largeText ? size * typography.largeTextMultiplier : size;
}

export default typography;
