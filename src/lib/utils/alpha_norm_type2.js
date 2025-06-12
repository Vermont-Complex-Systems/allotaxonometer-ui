// alpha_norm_type2
// returns per type divergence values for alpha type2 norms 
//
// alpha >= 0 and may be specified as Inf
// similar to p-norm but 
// normalized by a (alpha+1)/alpha prefactor and using a power 1/(alpha+1)
// 
// expects x1 and x2 to be values
// for ranks, x = 1/r.
// 
// adapted from https://gitlab.com/compstorylab/allotaxonometer/-/blob/master/scripts-divergences/alpha_norm_type2.m?ref_type=heads
export default function alpha_norm_type2(x1, x2, alpha) {
    if (alpha == 0) {
      return Math.abs(Math.log(x1 / x2));
    } else if (alpha === Infinity) {
      return x1 === x2 ? 0 : Math.max(x1, x2);
    } else {
          const prefactor = (alpha + 1) / alpha;
          const power = 1 / (alpha + 1);
          return prefactor * Math.abs(Math.pow(x1, alpha) - Math.pow(x2, alpha)) ** power;
    }
  }