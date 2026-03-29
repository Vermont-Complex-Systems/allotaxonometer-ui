/**
 * Adapters for consuming AllotaxDisplayResult from the /allotax API endpoint.
 * Maps lean server-computed data to the shapes allotaxonometer-ui components expect.
 */

type DisplayDiamondCell = {
    x1: number;
    y1: number;
    value: number;
    types: string;
    which_sys: string;
    coord_on_diag: number;
    cos_dist: number;
    max_rank: number;
};

type DisplayWordshiftEntry = {
    type: string;
    metric: number;
};

type BalanceEntry = {
    y_coord: string;
    frequency: number;
};

type AllotaxDisplayResult = {
    normalization: number;
    diamond_counts: DisplayDiamondCell[];
    max_delta_loss: number;
    wordshift: DisplayWordshiftEntry[];
    balance: BalanceEntry[];
    alpha: number;
};

/** Map display diamond cells to the shape Diamond.svelte expects. */
function adaptCounts(cells: DisplayDiamondCell[]) {
    return cells.map(c => ({
        x1: c.x1,
        y1: c.y1,
        value: c.value,
        types: c.types,
        which_sys: c.which_sys,
        coord_on_diag: c.coord_on_diag,
        cos_dist: c.cos_dist,
        rank: '',
        rank_L: [0, c.max_rank],
        rank_R: [],
    }));
}

/** Compute derived metrics from adapted counts and wordshift. */
function computeMetrics(counts: ReturnType<typeof adaptCounts>, wordshift: DisplayWordshiftEntry[]) {
    const maxRank = counts.length > 0
        ? Math.max(...counts.map(c => c.rank_L[1]))
        : 1;
    const maxlog10 = Math.ceil(Math.log10(maxRank) || 1);

    const maxValue = counts.length > 0
        ? Math.max(...counts.map(c => c.value))
        : 1;
    const max_count_log = Math.ceil(Math.log10(maxValue)) + 1;

    const max_shift = wordshift.length > 0
        ? Math.max(...wordshift.map(d => Math.abs(d.metric)))
        : 1;

    return { maxlog10, max_count_log, max_shift };
}

/**
 * Adapt a single-alpha AllotaxDisplayResult from the /allotax API
 * into the shapes allotaxonometer-ui components expect.
 *
 * Usage:
 * ```js
 * const apiResult = await fetch('/allotax?...').then(r => r.json());
 * const display = adaptDisplayResult(apiResult);
 * // Use display.dat, display.barData, etc. with <Diamond>, <Wordshift>, etc.
 * ```
 */
export function adaptDisplayResult(apiResponse: AllotaxDisplayResult) {
    const counts = adaptCounts(apiResponse.diamond_counts);
    const { maxlog10, max_count_log, max_shift } = computeMetrics(counts, apiResponse.wordshift);

    return {
        dat: { counts, deltas: [], max_delta_loss: apiResponse.max_delta_loss },
        barData: apiResponse.wordshift,
        balanceData: apiResponse.balance,
        divnorm: apiResponse.normalization,
        alpha: apiResponse.alpha,
        maxlog10,
        max_count_log,
        max_shift,
        xDomain: [-max_shift * 1.5, max_shift * 1.5] as [number, number],
        isDataReady: true,
    };
}

