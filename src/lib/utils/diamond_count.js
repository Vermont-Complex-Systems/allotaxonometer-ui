import { group, extent } from "d3-array";

import { matlab_sort, which, rin, rank_maxlog10 } from "./utils_helpers.js";


function rank2coord(rank) { return Math.floor(Math.log10(rank) / (1/15)) }

// Augment information already in `me` class with coordinates. 
function diamond_counts(mixedelements) {

  let maxlog10 = rank_maxlog10(mixedelements);
  if (maxlog10 < 1) maxlog10 = 1;
  
  const CELL_LENGTH = 1/15;
  const Ncells = Math.floor(maxlog10/CELL_LENGTH) + 1;
  
  // Pre-compute all coordinates and group by them
  const coordGroups = new Map();
  for (let i = 0; i < mixedelements[0]['ranks'].length; i++) {
      const x1 = rank2coord(mixedelements[1]['ranks'][i]); // System 1 → X
      const y1 = rank2coord(mixedelements[0]['ranks'][i]); // System 0 → Y
      const key = `${x1},${y1}`;
      
      if (!coordGroups.has(key)) {
          coordGroups.set(key, []);
      }
      
      coordGroups.get(key).push({
          types: mixedelements[0]['types'][i],
          x1: x1,
          y1: y1,
          rank1: mixedelements[0]['ranks'][i],
          rank2: mixedelements[1]['ranks'][i]
      });
  }
  
  // Generate final result directly without intermediate arrays
  const result = [];
  for (let i = 0; i < Ncells; i++) {
      for (let j = 0; j < Ncells; j++) {
          const key = `${i},${j}`;
          const items = coordGroups.get(key);
          
          if (!items) {
              result.push({
                  x1: i,
                  y1: j,
                  coord_on_diag: (j+i)/2,
                  cos_dist: (i-j)**2,
                  rank: "",
                  rank_L: "",
                  rank_R: "",
                  value: 0,
                  types: "",
                  which_sys: i - j <= 0 ? "right" : "left"
              });
          } else {
              result.push({
                  x1: i,
                  y1: j,
                  coord_on_diag: (j+i)/2,
                  cos_dist: (i-j)**2,
                  rank: `(${items[0].rank1}, ${items[0].rank2})`,
                  rank_L: extent(items.map(d => d.rank1)),
                  rank_R: extent(items.map(d => d.rank2)),
                  value: items.length,
                  types: items.map(d => d.types).join(', '),
                  which_sys: i - j <= 0 ? "right" : "left"
              });
          }
      }
  }
  
  return result;
}


// we expect wordshift to be of the form { divergence_elements: [ length of type ], normalization: float }
export default function diamond_count(mixedelements, wordshift) {
 
    let deltas = wordshift["divergence_elements"];
    let sorted_div = matlab_sort(deltas, true);
    let indices_deltas = sorted_div.orig_idx;
    
    const len = indices_deltas.length;
    const reordered = {
        deltas: new Array(len),
        mixedelements: [
            { types: new Array(len), counts: new Array(len), ranks: new Array(len), probs: new Array(len) },
            { types: new Array(len), counts: new Array(len), ranks: new Array(len), probs: new Array(len) }
        ]
    };
    
    for (let i = 0; i < len; i++) {
        const idx = indices_deltas[i];
        reordered.deltas[i] = deltas[idx];
        reordered.mixedelements[0].types[i] = mixedelements[0]['types'][idx];
        reordered.mixedelements[0].counts[i] = mixedelements[0]['counts'][idx];
        reordered.mixedelements[0].ranks[i] = mixedelements[0]['ranks'][idx];
        reordered.mixedelements[0].probs[i] = mixedelements[0]['probs'][idx];
        reordered.mixedelements[1].types[i] = mixedelements[1]['types'][idx];
        reordered.mixedelements[1].counts[i] = mixedelements[1]['counts'][idx];
        reordered.mixedelements[1].ranks[i] = mixedelements[1]['ranks'][idx];
        reordered.mixedelements[1].probs[i] = mixedelements[1]['probs'][idx];
    }
    
    // Update original arrays
    Object.assign(mixedelements[0], reordered.mixedelements[0]);
    Object.assign(mixedelements[1], reordered.mixedelements[1]);
    deltas = reordered.deltas;
    
    const deltas_loss = [...deltas];
    const deltas_gain = [...deltas];
    
    for (let i = 0; i < len; i++) {
        if (mixedelements[0]['ranks'][i] > mixedelements[1]['ranks'][i]) {
            deltas_loss[i] = -1;
        }
        // Fix apparent bug: comparing mixedelements[1]['ranks'][i] < mixedelements[1]['ranks'][i] always false
        if (mixedelements[1]['ranks'][i] < mixedelements[0]['ranks'][i]) {
            deltas_gain[i] = -1;
        }
    }
    
    const counts = diamond_counts(mixedelements);

  // Find max manually to avoid stack overflow with large arrays
  let max_delta_loss = deltas_loss[0];
  for (let i = 1; i < deltas_loss.length; i++) {
    if (deltas_loss[i] > max_delta_loss) max_delta_loss = deltas_loss[i];
  }

  return({'counts': counts, 'deltas': deltas, 'max_delta_loss': max_delta_loss})
}

