import * as d3 from "d3";
import { combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } from 'allotaxonometer-ui';

type AcceptedData = {
    types: string[];
    counts: number[];
    totalunique: number;
    probs: number[];
}

interface DiamondState {
    title: string[];
    alpha: number;
    height: number;
    width: number;
    DiamondHeight: number;
    DiamondWidth: number;
    marginInner: number;
    marginDiamond: number;

    me: any;
    rtd: any;
    divnorm: any;
    dat: any;
    barData: any;
    balanceData: any;
    maxlog10: number;
    max_count_log: number;
    max_shift: number;
    xDomain: any;

    uploadData: (sys1: AcceptedData[], sys2: AcceptedData[]) => void;
}

export class DiamondClass implements DiamondState {
    // State properties
    sys1 = $state<AcceptedData[] | null>(null);
    sys2 = $state<AcceptedData[] | null>(null);
    alpha = $state(0.58);
    title = $state<string[]>(['Dataset 1', 'Dataset 2']);

    constructor(sys1?: AcceptedData[], sys2?: AcceptedData[], alpha?: number, title?: string[]) {
        if (sys1) this.sys1 = sys1;
        if (sys2) this.sys2 = sys2;
        if (alpha !== undefined) this.alpha = alpha;
        if (title) this.title = title;
    }
    
    // Static configuration properties
    height = 815;
    width = 1200;
    DiamondHeight = 600;
    DiamondWidth = this.DiamondHeight;
    marginInner = 160;
    marginDiamond = 40;

    // Derived properties
    me = $derived(this.sys1 && this.sys2 ? combElems(this.sys1, this.sys2) : null);
    rtd = $derived(this.me ? rank_turbulence_divergence(this.me, this.alpha) : null);
    divnorm = $derived(this.rtd.normalization);
    dat = $derived(this.me && this.rtd ? diamond_count(this.me, this.rtd) : null);
    
    // Updated derived values
    barData = $derived(this.me && this.dat ? wordShift_dat(this.me, this.dat).slice(0, 30) : []);
    balanceData = $derived(this.sys1 && this.sys2 ? balanceDat(this.sys1, this.sys2) : []);
    maxlog10 = $derived(this.me ? Math.ceil(d3.max([Math.log10(d3.max(this.me[0].ranks)), Math.log10(d3.max(this.me[1].ranks))])) : 0);
    max_count_log = $derived(this.dat ? Math.ceil(Math.log10(d3.max(this.dat.counts, d => d.value))) + 1 : 2);
    max_shift = $derived(this.barData.length > 0 ? d3.max(this.barData, d => Math.abs(d.metric)) : 1);
    
    xDomain = $derived([-this.max_shift * 1.5, this.max_shift * 1.5]);

    uploadData = (sys1: AcceptedData[], sys2: AcceptedData[], title?: string[]) => {
        this.sys1 = sys1;
        this.sys2 = sys2;
        if (title) this.title = title;
    };
}