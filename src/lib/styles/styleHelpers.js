export const colors = {
  blue: "rgb(43, 103, 198)",
  red: "rgb(198, 43, 103)",
  paleblue: "rgb(195, 230, 243)",
  palered: "rgb(255, 204, 204)",
  lightergrey: "rgb(245, 245, 245)",
  lightishgrey: "rgb(237, 237, 237)",
  lightgrey: "rgb(230, 230, 230)",
  lightgreyer: "rgb(217, 217, 217)",
  lightgreyish: "rgb(204, 204, 204)",
  grey: "rgb(191, 191, 191)",
  darkgrey: "rgb(140, 140, 140)",
  darkergrey: "rgb(89, 89, 89)",
  verydarkgrey: "rgb(38, 38, 38)",
  superdarkgrey: "rgb(26, 26, 26)",
  reallyverdarkgrey: "rgb(13, 13, 13)",
  orange: "rgb(255, 116, 0)"
};

export const fonts = {
  family: '"EB Garamond", "Garamond", "Century Schoolbook L", "URW Bookman L", "Bookman Old Style", "Times", serif',
  sizes: { 
    xs: "10px", 
    sm: "12px", 
    md: "14px", 
    lg: "16px",
    xl: "18px"
  }
};

// Style builder function
export function style(props) {
  return Object.entries(props)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ');
}

// Axis styles
export const axisStyles = {
  label: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.lg,
    fill: colors.darkergrey,
    textAnchor: "middle"
  }),
  
  tickLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.sm,
    fill: colors.darkergrey,
  }),
  
  helperText: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.sm,
    fill: colors.darkgrey,
    textAnchor: "middle",
    opacity: "0.8"
  }),
  
  tickLine: () => style({
    stroke: colors.darkgrey,
    strokeWidth: "0.5"
  })
};

// Diamond chart styles
export const diamondStyles = {
  label: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.sm,
    fill: colors.darkergrey
  }),
  
  middleLine: () => style({
    stroke: colors.verydarkgrey,
    strokeWidth: "0.5"
  }),
  
  gridLine: () => style({
    stroke: colors.darkergrey,
    strokeDasharray: "1, 3"
  }),
  
  contourLine: () => style({
    fill: "none",
    stroke: colors.verydarkgrey,
    strokeWidth: "0.25",
    strokeOpacity: "0.9"
  }),
  
  cellStroke: () => style({
    stroke: colors.darkergrey,
    strokeWidth: "1.18",
    strokeOpacity: "0.4"
  })
};

// Legend styles
export const legendStyles = {
  tick: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    fill: colors.verydarkgrey,
    textAnchor: "start"
  }),
  
  title: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    fill: colors.verydarkgrey,
    textAnchor: "start"
  }),
  
  colorRect: () => style({
    stroke: "black",
    strokeWidth: "0.65",
    shapeRendering: "crispEdges"
  })
};

// Wordshift styles
export const wordshiftStyles = {
  tickLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    fill: colors.verydarkgrey
  }),
  
  axisTitle: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.lg,
    fill: colors.verydarkgrey,
    textAnchor: "middle"
  }),
  
  nameLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    fill: colors.verydarkgrey
  }),
  
  numbersLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    fill: colors.darkgrey,
    opacity: "0.7"
  }),
  
  gridLine: () => style({
    stroke: "currentColor",
    strokeOpacity: "0.1"
  })
};

// Balance chart styles
export const balanceStyles = {
  valueLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.xs,
    fill: colors.darkergrey,
    opacity: "0.5"
  }),
  
  yLabel: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.xs,
    fill: colors.darkergrey
  })
};

// Dashboard global styles
export const dashboardStyles = {
  instrumentText: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    color: colors.darkgrey
  }),
  
  alphaText: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.md,
    color: colors.darkgrey
  }),
  
  title: () => style({
    fontFamily: fonts.family,
    fontSize: fonts.sizes.lg,
    color: colors.superdarkgrey
  })
};