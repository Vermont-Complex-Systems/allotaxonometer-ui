use wasm_bindgen::prelude::*;

// Enable console.log for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Helper function to calculate divergence elements
fn div_elems(inv_r1: &[f64], inv_r2: &[f64], alpha: f64) -> Vec<f64> {
    if alpha == f64::INFINITY {
        inv_r1
            .iter()
            .zip(inv_r2.iter())
            .map(|(r1, r2)| {
                if r1 == r2 {
                    0.0
                } else {
                    r1.max(*r2)
                }
            })
            .collect()
    } else if alpha == 0.0 {
        inv_r1
            .iter()
            .zip(inv_r2.iter())
            .map(|(r1, r2)| {
                let x_max = (1.0 / r1).max(1.0 / r2);
                let x_min = (1.0 / r1).min(1.0 / r2);
                (x_max / x_min).log10()
            })
            .collect()
    } else {
        inv_r1
            .iter()
            .zip(inv_r2.iter())
            .map(|(r1, r2)| {
                ((alpha + 1.0) / alpha)
                    * (r1.powf(alpha) - r2.powf(alpha)).abs().powf(1.0 / (alpha + 1.0))
            })
            .collect()
    }
}

// Helper function to find indices where counts > 0
fn which_positive(counts: &[f64]) -> Vec<usize> {
    counts
        .iter()
        .enumerate()
        .filter(|(_, &c)| c > 0.0)
        .map(|(i, _)| i)
        .collect()
}

// Helper function to calculate normalization
fn norm_div_elems(
    counts1: &[f64],
    counts2: &[f64],
    inv_r1: &[f64],
    inv_r2: &[f64],
    alpha: f64,
) -> f64 {
    let indices1 = which_positive(counts1);
    let indices2 = which_positive(counts2);

    let n1 = indices1.len() as f64;
    let n2 = indices2.len() as f64;

    let inv_r1_disjoint = 1.0 / (n2 + n1 / 2.0);
    let inv_r2_disjoint = 1.0 / (n1 + n2 / 2.0);

    if alpha == f64::INFINITY {
        let sum1: f64 = indices1.iter().map(|&i| inv_r1[i]).sum();
        let sum2: f64 = indices2.iter().map(|&i| inv_r2[i]).sum();
        sum1 + sum2
    } else if alpha == 0.0 {
        let term1: f64 = indices1
            .iter()
            .map(|&i| (inv_r1[i] / inv_r2_disjoint).ln().abs())
            .sum();
        let term2: f64 = indices2
            .iter()
            .map(|&i| (inv_r2[i] / inv_r1_disjoint).ln().abs())
            .sum();
        term1 + term2
    } else {
        let term1: f64 = ((alpha + 1.0) / alpha)
            * indices1
                .iter()
                .map(|&i| {
                    (inv_r1[i].powf(alpha).abs() - inv_r2_disjoint.powf(alpha))
                        .powf(1.0 / (alpha + 1.0))
                })
                .sum::<f64>();

        let term2: f64 = ((alpha + 1.0) / alpha)
            * indices2
                .iter()
                .map(|&i| {
                    (inv_r1_disjoint.powf(alpha) - inv_r2[i].powf(alpha))
                        .abs()
                        .powf(1.0 / (alpha + 1.0))
                })
                .sum::<f64>();

        term1 + term2
    }
}

/// Main function exported to JavaScript
/// Takes two systems with ranks and counts, returns divergence elements and normalization
#[wasm_bindgen]
pub fn rank_turbulence_divergence(
    ranks1: Vec<f64>,
    ranks2: Vec<f64>,
    counts1: Vec<f64>,
    counts2: Vec<f64>,
    alpha: f64,
) -> JsValue {
    // Calculate inverse ranks
    let inv_r1: Vec<f64> = ranks1.iter().map(|r| r.powi(-1)).collect();
    let inv_r2: Vec<f64> = ranks2.iter().map(|r| r.powi(-1)).collect();

    // Calculate divergence elements
    let divergence_elements = div_elems(&inv_r1, &inv_r2, alpha);

    // Calculate normalization
    let normalization = norm_div_elems(&counts1, &counts2, &inv_r1, &inv_r2, alpha);

    // Normalize divergence elements
    let normalized: Vec<f64> = divergence_elements
        .iter()
        .map(|d| d / normalization)
        .collect();

    // Return as JS object
    let result = serde_json::json!({
        "divergence_elements": normalized,
        "normalization": normalization
    });

    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_div_elems_infinity() {
        let inv_r1 = vec![1.0, 0.5, 0.33];
        let inv_r2 = vec![1.0, 0.33, 0.5];
        let result = div_elems(&inv_r1, &inv_r2, f64::INFINITY);

        assert_eq!(result[0], 0.0); // Equal ranks
        assert_eq!(result[1], 0.5); // max(0.5, 0.33)
        assert_eq!(result[2], 0.5); // max(0.33, 0.5)
    }

    #[test]
    fn test_which_positive() {
        let counts = vec![0.0, 5.0, 0.0, 10.0];
        let result = which_positive(&counts);
        assert_eq!(result, vec![1, 3]);
    }
}
