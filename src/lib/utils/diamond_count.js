import structuredClone  from '@ungap/structured-clone';
import { group, extent } from "d3-array";

import { matlab_sort, which, rin, rank_maxlog10 } from "./utils_helpers.js";


function rank2coord(rank) { return Math.floor(Math.log10(rank) / (1/15)) }

// Augment information already in `me` class with coordinates. 
function diamond_counts(mixedelements) {

  let maxlog10 = rank_maxlog10(mixedelements) // max of values of me[system]['rank'] in logspace
  
  if (maxlog10 < 1) {
    maxlog10 = 1
  }
  
  const CELL_LENGTH = 1/15
  const Ncells = Math.floor(maxlog10/CELL_LENGTH) + 1 

  // me = mixed elements which is of the form:
  // [array_from_system_L, array_from_system_R]
  // where each array is of the form [types:{types}, counts:{counts}, ranks:{ranks}, probs:{probs}, totalunique]
  // where types is in the order [rank1TypeFromL, rank1TypeFromR, ... rankMaxTypeFromL, rankMaxTypeFromR] and if there is a tie it goes ... ranknTypeFromL, ranknTypeFromR_1, ranknTypeFromR_2, ranknplus1TypeFromL ... Example 1880-2015 charlie and clarence tie from left
  // counts, ranks, and probs are correct corresponding to the types 
  const x1s = mixedelements[0]['ranks'].map(r => rank2coord(r)) // Math.floor(Math.log10(rank) / (1/15))
  const y1s = mixedelements[1]['ranks'].map(r => rank2coord(r))

  // all the combination of coords that exists. There are many duplicated coords.
  const existing_coords = Array.from(mixedelements[0]['ranks'], (d,i) => { return `(${x1s[i]}, ${y1s[i]})` }) // for i in range(len(me[0]['ranks'])), existing_coords.append('x1s[i], y1s[i]'). or alternatively existing_coords = [str(pair) for pair in zip(x1s, y1s)]
  // note we make this a tring so that indexOf works later. In python we would use a 2-tuple
  
  // return existing_coords
  
  const out = []
  // iterate through each cell
  for (var i=0; i < Ncells; i++) { // Ncells is the length of the square matrix (note 1-d length not total number of cells)
    for (var j=0; j < Ncells; j++) { 
      
      // Does coords (i,j) are in existing_coords? 
      if ( existing_coords.indexOf(`(${i}, ${j})`)  === -1) {  
        out.push({ types: "", x1: i, y1: j, rank1: "", rank2: "" }) // if it doesnt exist, thats a blank cell, make the data there blank
      } else { //if that coordinate is full of data
        const indices_coords_in_exist_coords = which(rin(existing_coords, `(${i}, ${j})`)) //rin(arr1, arr2) = [foo is in arr2 for foo in arr1]. rin([3, 4, 5], [3]) = [true, false, false], then the which is returning the indices of the elements which are true. So in the end this is getting all the indices where '${i}, ${j})' appears in existing_coords. When there are ties, the same coordinate appears multiple times in a row in exisiting_coords and so indices_coords_in_exist_coords will be an array with multiple indices

        for (let z=0; z < indices_coords_in_exist_coords.length; z++ ) {
          out.push({
            types: mixedelements[0]['types'][indices_coords_in_exist_coords[z]],
            x1: i,  
            y1: j, 
            rank1: mixedelements[0]['ranks'][indices_coords_in_exist_coords[z]],  
            rank2: mixedelements[1]['ranks'][indices_coords_in_exist_coords[z]]
          })
        }
     }
    }
  }
  // group data by unique coordinates
  const agg_dat = group(out, d => `${d.x1}, ${d.y1}`)

  return Array.from(agg_dat , ([ key, value ]) => {
    const x1 = +key.split(", ")[1] // 2
    const y1 = +key.split(", ")[0] // 7
    return {
      x1: x1,
      y1: y1,
      coord_on_diag: (y1+x1)/2, 
      cos_dist: (x1-y1)**2,
      rank: value.map(d => d.types)[0] === ""   ? "" : value.map(d => `(${d.rank1}, ${d.rank2})`)[0],
      rank_L: value.map(d => d.types)[0] === "" ? "" : extent(value.map(d => d.rank1)),
      rank_R: value.map(d => d.types)[0] === "" ? "" : extent(value.map(d => d.rank2)),
      value: value.map(d => d.types)[0] === ""  ? 0 : value.length,
      types: value.map(d => d.types).join(', '),
      which_sys: x1 - y1 <= 0 ? "right" : "left"
    }
  })
}


// we expect wordshift to be of the form { divergence_elements: [ length of type ], normalization: float }
export default function diamond_count(mixedelements, wordshift) {

  let deltas = wordshift["divergence_elements"]
  let sorted_div = matlab_sort(deltas, true)
  let indices_deltas = sorted_div.orig_idx
 
  deltas = indices_deltas.map(e => deltas[e])


  mixedelements[0]['types']  =  indices_deltas.map(i => mixedelements[0]['types'][i])  
  mixedelements[0]['counts']  =  indices_deltas.map(i => mixedelements[0]['counts'][i])
  mixedelements[0]['ranks']  =  indices_deltas.map(i => mixedelements[0]['ranks'][i])
  mixedelements[0]['probs'] =  indices_deltas.map(i => mixedelements[0]['probs'][i])
  
  mixedelements[1]['types']  =  indices_deltas.map(i => mixedelements[1]['types'][i])
  mixedelements[1]['counts']  =  indices_deltas.map(i => mixedelements[1]['counts'][i])
  mixedelements[1]['ranks']  =  indices_deltas.map(i => mixedelements[1]['ranks'][i])
  mixedelements[1]['probs'] =  indices_deltas.map(i => mixedelements[1]['probs'][i])
  
  const deltas_loss = structuredClone(deltas)
  const deltas_gain = structuredClone(deltas)

  which(mixedelements[0]['ranks'].map((d,i) => mixedelements[0]['ranks'][i] > mixedelements[1]['ranks'][i])).map(e => deltas_loss[e] = -1)
  which(mixedelements[0]['ranks'].map((d,i) => mixedelements[1]['ranks'][i] < mixedelements[1]['ranks'][i])).map(e => deltas_gain[e] = -1)

  
  const counts = diamond_counts(mixedelements)
  
  return({'counts': counts, 'deltas': deltas, 'max_delta_loss': Math.max(...deltas_loss)})
}

