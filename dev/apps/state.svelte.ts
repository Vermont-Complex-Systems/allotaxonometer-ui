import * as d3 from "d3";
import { combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } from 'allotaxonometer-ui';
import { parseDataFile } from './utils.js';

type AcceptedData = {
    types: string[];
    counts: number[];
    totalunique: number;
    probs: number[];
}

    import boys1895 from '../../tests/fixtures/boys-1895.json';
    import boys1968 from '../../tests/fixtures/boys-1968.json';


// =============================================================================
// SIMPLE UI STATE (only for sidebar/nav, not data)
// =============================================================================

export const uiState = $state({
    sidebarCollapsed: false,
    isDarkMode: false,
    uploadStatus: '',
    uploadWarnings: [],
    fileMetadata: {
        sys1: null,
        sys2: null
    }
});

// =============================================================================
// CONSTANTS
// =============================================================================

export const alphas = d3.range(0,18).map(v => +(v/12).toFixed(2)).concat([1, 2, 5, Infinity]);

// =============================================================================
// MAIN ALLOTAXONOGRAPH CLASS - SINGLE SOURCE OF TRUTH
// =============================================================================

function timedCombElems(sys1, sys2) {
        console.time('combElems');
        const result = combElems(sys1, sys2);
        console.timeEnd('combElems');
        return result;
    }

export class Allotaxonograph {
    // Core data state
    sys1 = $state<AcceptedData[] | null>(boys1895);
    sys2 = $state<AcceptedData[] | null>(boys1968);
    title = $state<string[]>(['Boys 1895', 'Boys 1968']);
    
    // Alpha control
    alphaIndex = $state(7);
    alpha = $derived(alphas[this.alphaIndex]);
    
    // Layout configuration
    height = 815;
    width = $derived(uiState.sidebarCollapsed ? 1200 : 900);
    DiamondHeight = 600;
    DiamondWidth = this.DiamondHeight;
    marginInner = 160;
    marginDiamond = 40;
    WordshiftWidth = $derived(uiState.sidebarCollapsed ? 550 : 400);

    // Core data pipeline
    me = $derived(this.sys1 && this.sys2 ? timedCombElems(this.sys1, this.sys2) : null);
    rtd = $derived(this.me ? rank_turbulence_divergence(this.me, this.alpha) : null);
    dat = $derived(this.me && this.rtd ? diamond_count(this.me, this.rtd) : null);
    
    // Derived data for dashboard
    barData = $derived(this.me && this.dat ? wordShift_dat(this.me, this.dat).slice(0, 30) : []);
    balanceData = $derived(this.sys1 && this.sys2 ? balanceDat(this.sys1, this.sys2) : []);
    
    // Computed metrics
    maxlog10 = $derived(this.me ? Math.ceil(d3.max([
        Math.log10(d3.max(this.me[0].ranks)), 
        Math.log10(d3.max(this.me[1].ranks))
    ])) : 0);
    
    max_count_log = $derived(this.dat ? Math.ceil(Math.log10(d3.max(this.dat.counts, d => d.value))) + 1 : 2);
    max_shift = $derived(this.barData.length > 0 ? d3.max(this.barData, d => Math.abs(d.metric)) : 1);
    
    // Dashboard props
    divnorm = $derived(this.rtd?.normalization);
    xDomain = $derived([-this.max_shift * 1.5, this.max_shift * 1.5]);
    isDataReady = $derived(this.dat && this.barData && this.balanceData && this.me && this.rtd);
    
    // Methods
    uploadData(sys1: AcceptedData[], sys2: AcceptedData[], titles?: string[]) {
        this.sys1 = sys1;
        this.sys2 = sys2;
        if (titles) this.title = titles;
    }
    
    updateAlpha(index: number) {
        if (index >= 0 && index < alphas.length) {
            this.alphaIndex = index;
        }
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const allotax = new Allotaxonograph();

// =============================================================================
// UI ACTIONS
// =============================================================================

export function toggleSidebar() {
    uiState.sidebarCollapsed = !uiState.sidebarCollapsed;
}

// App-specific file upload handler that manages state
export async function handleFileUpload(file: File, system: 'sys1' | 'sys2') {
    uiState.uploadStatus = `Loading ${system}...`;
    uiState.uploadWarnings = []; // Clear previous warnings
    
    const result = await parseDataFile(file);
    
    if (result.success) {
        if (system === 'sys1') {
            allotax.sys1 = result.data;
            allotax.title[0] = result.fileName;
            uiState.fileMetadata.sys1 = result.meta; // Store metadata
        } else {
            allotax.sys2 = result.data;
            allotax.title[1] = result.fileName;
            uiState.fileMetadata.sys2 = result.meta; // Store metadata
        }
        
        // Set warnings if any
        if (result.warnings && result.warnings.length > 0) {
            uiState.uploadWarnings = result.warnings;
        }
        
        // Create success message with file info
        const fileInfo = result.meta ? 
            ` (${result.meta.processedRows.toLocaleString()} rows, ${result.fileType?.toUpperCase()})` :
            ` (${result.fileType?.toUpperCase()})`;
            
        uiState.uploadStatus = `${system.toUpperCase()} loaded successfully!${fileInfo}`;
        setTimeout(() => {
            uiState.uploadStatus = '';
            if (uiState.uploadWarnings.length === 0) {
                uiState.uploadWarnings = [];
            }
        }, 3000);
    } else {
        uiState.uploadStatus = `Error loading ${system}: ${result.error}`;
        uiState.fileMetadata[system] = null; // Clear metadata on error
        setTimeout(() => uiState.uploadStatus = '', 5000);
    }
}