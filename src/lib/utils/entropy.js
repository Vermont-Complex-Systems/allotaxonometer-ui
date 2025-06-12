export { get_jsd_scores, get_entropy_scores }

// Functions ported from:
// https://github.com/ryanjgallagher/shifterator/blob/master/shifterator/entropy.py

function get_entropy_type_scores(mixedelements, base, alpha) {
    const p_1 = mixedelements[0]['probs'][1]
    const p_2 = mixedelements[1]['probs'][1] 
    var score_1 = 0
    var score_2 = 0
    if (alpha === 1) {
        if (p_1 > 0) {
            score_1 = -Math.log(p_1, base)
        }
        if (p_2 > 0) {
            score_2 = -Math.log(p_2, base)
        }
      } else if (alpha > 0) {
        if (p_1 > 0) {
            score_1 = -1 * p_1 ** (alpha - 1) / (alpha - 1)
        }
        if (p_2 > 0) {
            score_2 = -1 * p_2 ** (alpha - 1) / (alpha - 1)
        }
      }
    return([score_1, score_2])
 }

 function get_entropy_scores(mixedelem, base=2, alpha=1) {
    const type2score_1 = {}
    const type2score_2 = {}
    for (let i=0; i < mixedelem[0]['types'].length; i++) {
        const t = mixedelem[0]['types'][i]
        const s = get_entropy_type_scores(mixedelem, base, alpha)
        type2score_1[t] = s[0]
        type2score_2[t] = s[1]
    }
    return({"type2score_1": type2score_1, "type2score_2": type2score_2})
}

function get_jsd_type_scores(mixedelements, m, weight_1, weight_2, base, alpha) {
    const p_1 = mixedelements[0]['probs'][1]
    const p_2 = mixedelements[1]['probs'][1] 
    var score_1 = 0
    var score_2 = 0
    if (alpha == 1) {
      score_1 = p_1 > 0 ? weight_1 * (Math.log(m, base) - Math.log(p_1, base)) : weight_1 * Math.log(m, base)
      score_2 = p_2 > 0 ? weight_2 * (Math.log(p_2, base) - Math.log(m, base)) : weight_2 * -Math.log(m, base)
      
    } else if (alpha > 0) {
        if (p_1 > 0) {
            score_1 = weight_1 * (m ** (alpha - 1) - p_1 ** (alpha - 1)) / (alpha - 1)
          }
      
        if (p_2 > 0) {
          score_2 = weight_2 * (m ** (alpha - 1) - p_2 ** (alpha - 1)) / (alpha - 1)
        }
}    
return([score_1, score_2]) 
}

function get_jsd_scores(mixedelem, weight_1=0.5, weight_2=0.5, base=2, alpha=1){
    const type2m = {}
    const type2score_1 = {}
    const type2score_2 = {}
    for (let i=0; i < mixedelem[0]['types'].length; i++) {
        const t  = mixedelem[0]['types'][i]
        const p_1 = mixedelem[0]['probs'][i]
        const p_2 = mixedelem[1]['probs'][i]
        const m = weight_1 * p_1 + weight_2 * p_2
        const s = get_jsd_type_scores(mixedelem, m, weight_1, weight_2, base, alpha)

        type2m[t] = m
        type2score_1[t] = s[0]
        type2score_2[t] = s[1]
    }
    return([type2m, type2score_1, type2score_2])
}
