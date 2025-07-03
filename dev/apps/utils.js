// utils.js
import * as d3 from 'd3';

// Configuration
const FILE_SIZE_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_ROWS: 10000, // Take top 10k words
    WARN_ROWS: 5000 // Warn user if file has more than this many rows
};

function recalculateStats(data) {
    // Sort by counts (descending) to get top words
    const sortedData = [...data].sort((a, b) => b.counts - a.counts);
    
    // Take top N rows
    const topData = sortedData.slice(0, FILE_SIZE_LIMITS.MAX_ROWS);
    
    // Recalculate total counts and probabilities
    const totalCounts = topData.reduce((sum, item) => sum + item.counts, 0);
    const newTotalUnique = topData.length;
    
    // Update probabilities based on new total
    const recalculatedData = topData.map(item => ({
        types: item.types,
        counts: item.counts,
        probs: item.counts / totalCounts, // Recalculate probability
        totalunique: newTotalUnique
    }));
    
    return {
        data: recalculatedData,
        originalTotal: data.length,
        newTotal: newTotalUnique,
        originalTotalCounts: data.reduce((sum, item) => sum + item.counts, 0),
        newTotalCounts: totalCounts
    };
}

function parseCSV(csvText, options = {}) {
    // Use d3 to parse CSV - much more robust!
    const parsed = d3.csvParse(csvText);
    
    if (!parsed || parsed.length === 0) {
        throw new Error('No data found in CSV file');
    }
    
    // Get headers from first row
    const headers = parsed.columns;
    
    // Find columns (case insensitive, flexible naming)
    const findHeader = (possibleNames) => {
        for (const name of possibleNames) {
            const found = headers.find(h => h.toLowerCase() === name.toLowerCase());
            if (found) return found;
        }
        return null;
    };
    
    const typeColumn = findHeader(['types', 'type', 'words', 'word', 'terms', 'term']);
    const countsColumn = findHeader(['counts', 'count', 'frequency', 'freq', 'n']);
    const probsColumn = findHeader(['probs', 'prob', 'probability', 'probabilities', 'p']);
    const totaluniqueColumn = findHeader(['totalunique', 'total_unique', 'total', 'unique_total']);
    
    // Check required columns
    if (!typeColumn || !countsColumn || !probsColumn) {
        const missing = [];
        if (!typeColumn) missing.push('types/words');
        if (!countsColumn) missing.push('counts/frequency');
        if (!probsColumn) missing.push('probs/probability');
        throw new Error(`Missing required columns: ${missing.join(', ')}. Found: ${headers.join(', ')}`);
    }
    
    const rawData = [];
    let skippedRows = 0;
    
    // Process each row
    for (let i = 0; i < parsed.length; i++) {
        const row = parsed[i];
        
        const typeValue = row[typeColumn];
        const countsStr = row[countsColumn];
        const probsStr = row[probsColumn];
        
        // Skip rows with missing essential data
        if (!typeValue || !countsStr || !probsStr) {
            skippedRows++;
            continue;
        }
        
        const counts = +countsStr; // d3 style number conversion
        const probs = +probsStr;
        
        // Validation with detailed logging
        if (isNaN(counts)) {
            console.warn(`Row ${i + 2}: invalid counts "${countsStr}" for "${typeValue}"`);
            skippedRows++;
            continue;
        }
        
        if (isNaN(probs)) {
            console.warn(`Row ${i + 2}: invalid probs "${probsStr}" for "${typeValue}"`);
            skippedRows++;
            continue;
        }
        
        if (counts <= 0) {
            console.warn(`Row ${i + 2}: counts <= 0 (${counts}) for "${typeValue}"`);
            skippedRows++;
            continue;
        }
        
        if (probs < 0) {
            console.warn(`Row ${i + 2}: probs < 0 (${probs}) for "${typeValue}"`);
            skippedRows++;
            continue;
        }
        
        rawData.push({
            types: typeValue,
            counts: counts,
            probs: probs,
            totalunique: totaluniqueColumn ? 
                +(row[totaluniqueColumn]) || 0 : 
                0 // Will be recalculated
        });
    }
    
    if (rawData.length === 0) {
        throw new Error('No valid data rows found');
    }
    
    // Decide whether to truncate and recalculate
    let finalData, meta;
    
    if (rawData.length > FILE_SIZE_LIMITS.MAX_ROWS) {
        // Smart truncation: take top words and recalculate
        const recalcResult = recalculateStats(rawData);
        finalData = recalcResult.data;
        
        meta = {
            totalRows: rawData.length,
            processedRows: finalData.length,
            skippedRows,
            wasTruncated: true,
            truncatedAt: FILE_SIZE_LIMITS.MAX_ROWS,
            wasRecalculated: true,
            originalTotalCounts: recalcResult.originalTotalCounts,
            newTotalCounts: recalcResult.newTotalCounts,
            coveragePercent: ((recalcResult.newTotalCounts / recalcResult.originalTotalCounts) * 100).toFixed(1)
        };
    } else {
        // No truncation needed, but ensure totalunique is correct
        const totalUnique = rawData.length;
        finalData = rawData.map(item => ({
            ...item,
            totalunique: totalUnique
        }));
        
        meta = {
            totalRows: rawData.length,
            processedRows: finalData.length,
            skippedRows,
            wasTruncated: false,
            truncatedAt: null,
            wasRecalculated: false
        };
    }
    
    return { data: finalData, meta };
}

function truncateJsonArray(data, maxRows = FILE_SIZE_LIMITS.MAX_ROWS) {
    if (!Array.isArray(data)) {
        return {
            data,
            meta: {
                totalRows: 1,
                processedRows: 1,
                skippedRows: 0,
                wasTruncated: false,
                truncatedAt: null,
                wasRecalculated: false
            }
        };
    }
    
    if (data.length <= maxRows) {
        return {
            data,
            meta: {
                totalRows: data.length,
                processedRows: data.length,
                skippedRows: 0,
                wasTruncated: false,
                truncatedAt: null,
                wasRecalculated: false
            }
        };
    }
    
    // Smart truncation for JSON too
    const recalcResult = recalculateStats(data);
    
    return {
        data: recalcResult.data,
        meta: {
            totalRows: data.length,
            processedRows: recalcResult.data.length,
            skippedRows: 0,
            wasTruncated: true,
            truncatedAt: maxRows,
            wasRecalculated: true,
            originalTotalCounts: recalcResult.originalTotalCounts,
            newTotalCounts: recalcResult.newTotalCounts,
            coveragePercent: ((recalcResult.newTotalCounts / recalcResult.originalTotalCounts) * 100).toFixed(1)
        }
    };
}

function validateDataStructure(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    
    return data.every(item => 
        item && 
        typeof item === 'object' &&
        typeof item.types === 'string' &&
        typeof item.counts === 'number' &&
        typeof item.probs === 'number' &&
        typeof item.totalunique === 'number' &&
        item.counts > 0 &&
        item.probs >= 0 &&
        item.probs <= 1
    );
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function parseDataFile(file) {
    try {
        // Check file size first
        if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
            throw new Error(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}.`);
        }
        
        const text = await file.text();
        const fileName = file.name.replace(/\.(json|csv)$/i, '');
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        let result;
        
        if (extension === 'json') {
            const jsonData = JSON.parse(text);
            result = truncateJsonArray(jsonData);
        } else if (extension === 'csv') {
            result = parseCSV(text);
        } else {
            throw new Error('Unsupported file type. Please use .json or .csv files.');
        }
        
        // Validate the parsed data structure
        if (!validateDataStructure(result.data)) {
            throw new Error('Invalid data structure. Expected array of objects with types, counts, probs, and totalunique fields.');
        }
        
        // Create informative messages
        const warnings = [];
        
        if (result.meta.wasRecalculated) {
            warnings.push(
                `Dataset truncated to top ${result.meta.processedRows.toLocaleString()} most frequent items ` +
                `(${result.meta.coveragePercent}% of original frequency mass). ` +
                `Probabilities recalculated for subset.`
            );
        } else if (result.meta.wasTruncated) {
            warnings.push(`File was truncated from ${result.meta.totalRows.toLocaleString()} to ${result.meta.processedRows.toLocaleString()} rows.`);
        } else if (result.meta.totalRows > FILE_SIZE_LIMITS.WARN_ROWS) {
            warnings.push(`Large dataset detected (${result.meta.totalRows.toLocaleString()} items). Processing may be slow.`);
        }
        
        if (result.meta.skippedRows > 0) {
            warnings.push(`Skipped ${result.meta.skippedRows} invalid rows.`);
        }
        
        return {
            success: true,
            data: result.data,
            fileName,
            fileType: extension,
            meta: result.meta,
            warnings,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            fileName: null,
            fileType: null,
            meta: null,
            warnings: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}