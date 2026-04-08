// src/lib/utils/allotaxonograph.svelte.ts
import * as d3 from 'd3';
import { runPipeline } from './pipeline.js';

export type AcceptedData = {
    types: string[];
    counts: number[];
    totalunique?: number;  // Optional: will be calculated if missing
    probs?: number[];      // Optional: will be calculated if missing
};

export type AllotaxonographOptions = {
    alpha?: number;
    title?: string[];
    topN?: number;
};

export class Allotaxonograph {
    // Core data state
    sys1 = $state<AcceptedData[] | null>(null);
    sys2 = $state<AcceptedData[] | null>(null);
    title = $state<string[]>(['System 1', 'System 2']);

    // Configuration
    alpha = $state(0.58);
    topN = $state(30);

    // Single pipeline run — uses WASM `compute_allotax` if available,
    // falls back to the per-stage JS pipeline otherwise.
    _pipeline = $derived(
        this.sys1 && this.sys2
            ? runPipeline(this.sys1, this.sys2, this.alpha)
            : null
    );

    // Public fields read from the pipeline result (legacy / nested shape)
    rtd = $derived(this._pipeline?.rtd ?? null);
    dat = $derived(this._pipeline?.dat ?? null);
    barData = $derived(this._pipeline ? this._pipeline.barData.slice(0, this.topN) : []);
    balanceData = $derived(this._pipeline?.balanceData ?? []);
    maxlog10 = $derived(this._pipeline?.maxlog10 ?? 0);

    // Canonical (flat) shape — mirrors `compute_allotax` from the Rust core
    // and the Python binding. Both shapes are exposed so that
    // `<Dashboard {...allotax} />` keeps working regardless of which prop
    // names the Dashboard prefers internally.
    diamond_counts = $derived(this.dat?.counts ?? []);
    ncells = $derived(this.dat?.ncells);
    wordshift = $derived(this.barData);
    balance = $derived(this.balanceData);
    normalization = $derived(this.rtd?.normalization);

    // Computed metrics
    max_count_log = $derived(this.dat ? Math.ceil(Math.log10(d3.max(this.dat.counts, d => d.value))) + 1 : 2);
    max_shift = $derived(this.barData.length > 0 ? d3.max(this.barData, d => Math.abs(d.metric)) : 1);

    // Legacy alias for `normalization`. Kept for callers that read it directly.
    divnorm = $derived(this.normalization);
    xDomain = $derived([-this.max_shift * 1.5, this.max_shift * 1.5]);
    isDataReady = $derived(this.dat && this.barData && this.balanceData && this.rtd);

    constructor(sys1?: AcceptedData[], sys2?: AcceptedData[], options: AllotaxonographOptions = {}) {
        if (sys1) this.sys1 = sys1;
        if (sys2) this.sys2 = sys2;
        if (options.alpha !== undefined) this.alpha = options.alpha;
        if (options.title) this.title = options.title;
        if (options.topN !== undefined) this.topN = options.topN;
    }

    // Methods
    updateData(sys1: AcceptedData[], sys2: AcceptedData[], titles?: string[]) {
        this.sys1 = sys1;
        this.sys2 = sys2;
        if (titles) this.title = titles;
    }

    setAlpha(alpha: number) {
        this.alpha = alpha;
    }

    setTopN(n: number) {
        this.topN = n;
    }

    exportData() {
        return {
            rtd: this.rtd,
            barData: this.barData,
            balanceData: this.balanceData,
            meta: {
                alpha: this.alpha,
                titles: this.title,
                maxlog10: this.maxlog10,
                max_count_log: this.max_count_log
            }
        };
    }

    // Static factory methods
    static fromData(data1: AcceptedData[], data2: AcceptedData[], options?: AllotaxonographOptions) {
        return new Allotaxonograph(data1, data2, options);
    }

    static createComparison(data1: AcceptedData[], data2: AcceptedData[], preset: 'standard' | 'sensitive' | 'robust' = 'standard') {
        const presets = {
            standard: { alpha: 0.58 },
            sensitive: { alpha: 0.1 },
            robust: { alpha: Infinity }
        };
        return new Allotaxonograph(data1, data2, presets[preset]);
    }
}
