import * as d3 from "d3";
import { Allotaxonograph } from 'allotaxonometer-ui';
import { parseDataFile } from './utils.js';

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

export const allotax = new Allotaxonograph(
		boys1895, 
		boys1968, 
		0.58, 
		['Boys 1895', 'Boys 1968']
	);

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