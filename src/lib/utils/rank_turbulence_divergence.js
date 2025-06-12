import { sum } from "d3-array";

import { which } from "./utils_helpers.js";

// This function calculates the divergence between two arrays of inverse ranks
// based on the specified alpha value. If alpha is equal to infinity, it returns
// an array with the maximum of each element in inv_r1 and inv_r2. If alpha is
// equal to 0, it returns an array with the log of the ratio of the maximum and
// minimum of 1/inv_r1 and 1/inv_r2 for each element. Otherwise, it returns an
// array with the absolute value of (alpha + 1)/alpha * (inv_r1^alpha - inv_r2^alpha)^(1/(alpha + 1))
// for each element.

function divElems(inv_r1, inv_r2, alpha) {
  if (alpha === Infinity) {
      return inv_r1.map((d,i) => inv_r1[i] == inv_r2[i] ? 0 : Math.max(inv_r1[i], inv_r2[i]))
  } else if (alpha == 0) {
      const x_max = inv_r1.map((d,i) => Math.max(1 / inv_r1[i], 1 / inv_r2[i]))
      const x_min = inv_r1.map((d,i) => Math.min(1 / inv_r1[i], 1 / inv_r2[i]))
      return inv_r1.map((d,i) => Math.log10(x_max[i] / x_min[i]))
  } else {
      return inv_r1.map((d,i) => (alpha+1) / alpha * Math.abs(inv_r1[i]**alpha - inv_r2[i]**alpha)**(1. / (alpha+1)))
    }
}

// This function calculates the normalization factor for the divergence between
// two arrays of inverse ranks. It first extracts the counts from the mixedelements
// parameter and finds the indices where the counts are greater than 0. It then
// calculates the disjoint set for each array based on the number of non-zero
// counts. If alpha is equal to infinity, it returns the sum of the elements in
// inv_r1 and inv_r2 for the indices with non-zero counts. If alpha is equal to
// 0, it returns the sum of the absolute value of the log of the ratio of each
// element in inv_r1 and the disjoint set for inv_r2, and the absolute value of
// the log of the ratio of each element in inv_r2 and the disjoint set for inv_r1.
// Otherwise, it returns the sum of (alpha + 1)/alpha * (inv_r1^alpha - disjoint set^alpha)^(1/(alpha + 1))
// for each element in inv_r1, and the same for inv_r2.

function norm_divElems(mixedelements, inv_r1, inv_r2, alpha) {
  const c1 = mixedelements[0]['counts']  
  const c2 = mixedelements[1]['counts']

  const indices1 = which(c1.map(d => d > 0))
  const indices2 = which(c2.map(d => d > 0))

  const N1 = indices1.length
  const N2 = indices2.length

// This function calculates the disjoint set for a given array of inverse ranks
  // based on the number of non-zero counts in the array and the number of non-zero
  // counts in the other array. It returns 1/(number of non-zero counts in other array + 
  // number of non-zero counts in this array/2)
  
  function calc_disjoint(N1, N2) { 
    return( 1 / (N2 + N1/2) )
    }
  
  const inv_r1_disjoint = calc_disjoint(N1, N2) 
  const inv_r2_disjoint = calc_disjoint(N2, N1) 
  
  if (alpha === Infinity) {
    
      return sum(indices1.map((i) => inv_r1[i])) + sum(indices2.map((i) => inv_r2[i]))
    
  } else if (alpha === 0) {
      const term1 = sum(
        indices1.map((i) => Math.abs(Math.log(inv_r1[i] / inv_r2_disjoint)))
      )
      const term2 = sum(
        indices2.map((i) => Math.abs(Math.log(inv_r2[i] / inv_r1_disjoint)))
      )
      return term1 + term2 
  } else {
      const term1 = (alpha+1)/alpha * sum( 
        indices1.map((i) => inv_r1[i]).map( d => (Math.abs(d**alpha) - inv_r2_disjoint**alpha)**(1./(alpha+1) ))
      )
      const term2 = (alpha+1)/alpha * sum(
        indices2.map((i) => inv_r2[i]).map(d => Math.abs(inv_r1_disjoint**alpha - d**alpha)**(1. / (alpha+1)))
      )
      return term1 + term2
    }
}

// This function calculates the rank turbulence divergence for two arrays of mixed
// elements, using the specified alpha value. It first calculates the arrays of
// inverse ranks for each mixed element array and then calculates the divergence
// and normalization factors using the divElems and norm_divElems functions. It
// returns the divergence divided by the normalization.

export default function rank_turbulence_divergence(mixedelements, alpha) {

  const inv_r1 = mixedelements[0]['ranks'].map(d => Math.pow(d, -1))
  const inv_r2 = mixedelements[1]['ranks'].map(d => Math.pow(d, -1))
  
  const divergence_elements = divElems(inv_r1, inv_r2, alpha)
  const normalization = norm_divElems(mixedelements, inv_r1, inv_r2, alpha)
  
  return { // the divergence used to wordshift dat to sort name in wordshift plot
         // is equal to the formula in the upperleft of the diamond plot. However
         // the formula is a proportionality and miss the normalization constant 
         // shown here. 
         // Example: for alpha = infinity, for the rank 1 names on both systems, the formula as written is equal to max(1/1, 1/former_rank) = 1/1 =1
         // this value of 1 is then divided by the normalization constant.
         // this constant of proportionality is the reason for the difference between the 1/1 that the written formula gives you
         // and the decimal value that wordshift_dat states and which is actuallly used to sort the types.
    'divergence_elements': divergence_elements.map(d => d / normalization), 
    'normalization': normalization
  }
}

