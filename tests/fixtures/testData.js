export const testData = {
  // Fake processed data object (from diamond_count)
  dat: {
    counts: [
      { x1: 0, y1: 0, value: 5, types: "apple,fruit", rank_L: [1, 10], rank_R: [2, 8], coord_on_diag: 0, cos_dist: 0, which_sys: "left" },
      { x1: 1, y1: 0, value: 3, types: "banana", rank_L: [5, 15], rank_R: [3, 12], coord_on_diag: 0.5, cos_dist: 1, which_sys: "right" },
      { x1: 0, y1: 1, value: 8, types: "cherry", rank_L: [2, 8], rank_R: [1, 5], coord_on_diag: 0.5, cos_dist: 1, which_sys: "left" },
      { x1: 1, y1: 1, value: 12, types: "date,sweet", rank_L: [10, 20], rank_R: [15, 25], coord_on_diag: 1, cos_dist: 0, which_sys: "right" },
      { x1: 2, y1: 1, value: 0, types: "", rank_L: "", rank_R: "", coord_on_diag: 1.5, cos_dist: 1, which_sys: "left" },
    ],
    deltas: [0.5, -0.3, 0.8, -0.2, 0.1],
    max_delta_loss: 0.8
  },

  // Fake wordshift data
  barData: [
    { type: "apple (1 ⇋ 2)", rank_diff: -1, metric: 0.45 },
    { type: "banana (5 ⇋ 3)", rank_diff: 2, metric: -0.23 },
    { type: "cherry (2 ⇋ 1)", rank_diff: 1, metric: 0.67 },
    { type: "date (10 ⇋ 15)", rank_diff: -5, metric: -0.12 },
    { type: "elderberry (3 ⇋ 8)", rank_diff: -5, metric: 0.34 },
  ],

  // Fake balance data  
  balanceData: [
    { y_coord: "total count", frequency: 0.520 },
    { y_coord: "total count", frequency: -0.480 },
    { y_coord: "all names", frequency: 0.650 },
    { y_coord: "all names", frequency: -0.350 },
    { y_coord: "exclusive names", frequency: 0.180 },
    { y_coord: "exclusive names", frequency: -0.220 },
  ],

  // Configuration values
  alpha: 0.17,
  divnorm: 15.42,
  maxlog10: 3,
  max_count_log: 2,
  title: ["Test System 1", "Test System 2"]
};