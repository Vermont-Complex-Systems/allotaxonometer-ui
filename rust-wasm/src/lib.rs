use serde::Serialize;
use wasm_bindgen::prelude::*;

use allotax_core::{compute_allotax as core_compute_allotax, InputSystem};

/// Run the full allotaxonometer pipeline (combine → rtd → diamond → wordshift → balance)
/// in Rust and return a lean display result the JS `Allotaxonograph` can consume
/// directly. Shape matches `allotax_core::AllotaxDisplayResult`, i.e. the same
/// canonical shape the Python binding emits — there is now a single source of
/// truth for the output schema (and for `ncells` / `maxlog10`).
#[wasm_bindgen]
pub fn compute_allotax(
    types1: Vec<String>,
    counts1: Vec<f64>,
    types2: Vec<String>,
    counts2: Vec<f64>,
    alpha: f64,
) -> JsValue {
    let sys1 = InputSystem {
        types: types1,
        counts: counts1,
    };
    let sys2 = InputSystem {
        types: types2,
        counts: counts2,
    };

    // `to_display(0)` = no wordshift truncation (the frontend handles label
    // thresholding interactively via `labelThreshold`).
    let display = core_compute_allotax(&sys1, &sys2, alpha).to_display(0);

    // Serialize maps as plain JS objects (not `Map`) so the JS side can use
    // normal property access instead of `.get(...)`.
    let serializer = serde_wasm_bindgen::Serializer::new().serialize_maps_as_objects(true);
    display.serialize(&serializer).unwrap()
}
