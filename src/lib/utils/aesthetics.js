// Helper: convert [0–1, 0–1, 0–1] → "rgb(R, G, B)"
function rgbArrayToCss(rgbArray) {
    const [r, g, b] = rgbArray.map(v => Math.round(v * 255));
    return `rgb(${r}, ${g}, ${b})`;
  }

export function style(props) {
  return Object.entries(props)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
}

  // // imported from matlab version. Normalized RGB color definitions
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

  // Create CSS strings for each
  const cssColors = {};
  for (const [key, rgb] of Object.entries(rawColors)) {
    cssColors[key] = rgbArrayToCss(rgb);
  }

  // Export both raw RGB arrays and CSS strings
  export const alloColors = {
    raw: rawColors,    // e.g., colors.raw.blue → [0.168, 0.403, 0.776]
    css: cssColors     // e.g., colors.css.blue → "rgb(43, 103, 198)"
  };

// System font stack in order of preference
export const alloFonts = {
  family: `"EB Garamond", "Garamond", "Century Schoolbook L", "URW Bookman L", "Bookman Old Style", "Times", serif`,
  sizes: {
    xs: "10px",
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "18px"
  }

}
