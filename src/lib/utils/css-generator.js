// Helper: convert [0–1, 0–1, 0–1] → "rgb(R, G, B)"
function rgbArrayToCss(rgbArray) {
  const [r, g, b] = rgbArray.map(v => Math.round(v * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

// Normalized RGB color definitions (your existing data)
const rawColors = {
  blue: [43, 103, 198].map(v => v / 255),
  red: [198, 43, 103].map(v => v / 255),
  paleblue: [195, 230, 243].map(v => v / 255),
  palered: [255, 204, 204].map(v => v / 255),
  lightergrey: [1, 1, 1].map(v => v * 0.96),
  lightishgrey: [1, 1, 1].map(v => v * 0.93),
  lightgrey: [1, 1, 1].map(v => v * 0.90),
  lightgreyer: [1, 1, 1].map(v => v * 0.85),
  lightgreyish: [1, 1, 1].map(v => v * 0.80),
  grey: [1, 1, 1].map(v => v * 0.75),
  darkgrey: [1, 1, 1].map(v => v * 0.55),
  darkergrey: [1, 1, 1].map(v => v * 0.35),
  verydarkgrey: [1, 1, 1].map(v => v * 0.15),
  superdarkgrey: [1, 1, 1].map(v => v * 0.10),
  reallyverdarkgrey: [1, 1, 1].map(v => v * 0.05),
  orange: [255, 116, 0].map(v => v / 255)
};

// System font stack
const alloFonts = `"EB Garamond", "Garamond", "Century Schoolbook L", "URW Bookman L", "Bookman Old Style", "Times", serif`;


// Generate CSS variables string
export function generateAllotaxonometerCSS() {
  const colorVars = Object.entries(rawColors)
    .map(([key, rgb]) => `  --allo-${key}: ${rgbArrayToCss(rgb)};`)
    .join('\n');

  return `
:root {
  /* Color Variables */
${colorVars}
  
  /* Typography */
  --allo-font-family: ${alloFonts};
  
  /* Font sizes */
  --allo-font-xs: 10px;
  --allo-font-sm: 12px;
  --allo-font-md: 14px;
  --allo-font-lg: 16px;
  --allo-font-xl: 18px;
}

body {
  font-family: var(--allo-font-family);
}

.allo-fonts {
  font-family: var(--allo-font-family);
}`;
}

// Also export the raw data for other uses
export { rawColors, alloFonts };