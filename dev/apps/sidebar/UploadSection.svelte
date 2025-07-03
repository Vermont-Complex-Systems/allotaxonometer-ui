<script>
    import { Accordion } from "bits-ui";
    
    let {
        sys1 = $bindable(null),
        sys2 = $bindable(null),
        title = $bindable(['System 1', 'System 2']),
        handleFileUpload,
        uploadStatus,
        uploadWarnings = [],
        fileMetadata = { sys1: null, sys2: null } // New prop for file metadata
    } = $props();
    
    let fileInput1, fileInput2;
</script>

<Accordion.Item value="upload" class="accordion-item">
    <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
            <span>📁 Upload Data</span>
        </Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content class="accordion-content">
        <div class="upload-section">
            <div class="input-group">
                <label for="file1" class="input-label">System 1 (.json or .csv)</label>
                <div class="file-input-wrapper">
                    <input
                        id="file1"
                        type="file"
                        accept=".json,.csv"
                        bind:this={fileInput1}
                        onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys1')}
                        class="file-input-hidden"
                    />
                    <button class="file-input-button" onclick={() => fileInput1.click()}>
                        Choose file
                    </button>
                </div>
                {#if fileMetadata.sys1}
                    <div class="file-status">
                        <div class="file-status-item">
                            <span class="status-label">📊 {fileMetadata.sys1.processedRows?.toLocaleString() || 0} items</span>
                            {#if fileMetadata.sys1.wasTruncated}
                                <span class="status-badge truncated">Truncated</span>
                            {/if}
                            {#if fileMetadata.sys1.skippedRows > 0}
                                <span class="status-badge skipped">{fileMetadata.sys1.skippedRows} skipped</span>
                            {/if}
                        </div>
                        {#if fileMetadata.sys1.wasRecalculated}
                            <div class="coverage-info">
                                {fileMetadata.sys1.coveragePercent}% frequency coverage
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            <div class="input-group">
                <label for="file2" class="input-label">System 2 (.json or .csv)</label>
                <div class="file-input-wrapper">
                    <input
                        id="file2"
                        type="file"
                        accept=".json,.csv"
                        bind:this={fileInput2}
                        onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys2')}
                        class="file-input-hidden"
                    />
                    <button class="file-input-button" onclick={() => fileInput2.click()}>
                        Choose file
                    </button>
                </div>
                {#if fileMetadata.sys2}
                    <div class="file-status">
                        <div class="file-status-item">
                            <span class="status-label">📊 {fileMetadata.sys2.processedRows?.toLocaleString() || 0} items</span>
                            {#if fileMetadata.sys2.wasTruncated}
                                <span class="status-badge truncated">Truncated</span>
                            {/if}
                            {#if fileMetadata.sys2.skippedRows > 0}
                                <span class="status-badge skipped">{fileMetadata.sys2.skippedRows} skipped</span>
                            {/if}
                        </div>
                        {#if fileMetadata.sys2.wasRecalculated}
                            <div class="coverage-info">
                                {fileMetadata.sys2.coveragePercent}% frequency coverage
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
            
            {#if uploadStatus}
                <div class="upload-status {uploadStatus.includes('Error') ? 'error' : 'success'}">
                    {uploadStatus}
                </div>
            {/if}
            
            {#if uploadWarnings.length > 0}
                <div class="upload-warnings">
                    <div class="warning-header">⚠️ Warnings:</div>
                    {#each uploadWarnings as warning}
                        <div class="warning-item">{warning}</div>
                    {/each}
                </div>
            {/if}
        </div>
    </Accordion.Content>
</Accordion.Item>

<style>
    .upload-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-label {
        font-size: var(--14px);
    }

    .file-input-wrapper {
        position: relative;
    }

    .file-input-hidden {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .file-input-button {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--color-input-bg);
        color: var(--color-input-fg);
        font-size: var(--14px);
        font-family: var(--font-form);
        cursor: pointer;
        transition: all var(--transition-medium) ease;
    }

    .file-input-button:hover {
        background-color: var(--color-gray-200);
        border-color: var(--color-good-blue);
    }

    :global(.dark) .file-input-button:hover {
        background-color: var(--color-gray-700);
    }

    .file-status {
        padding: 0.5rem;
        background-color: rgba(0, 123, 255, 0.05);
        border: 1px solid rgba(0, 123, 255, 0.2);
        border-radius: var(--border-radius);
        font-size: var(--13px);
    }

    .file-status-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .status-label {
        font-weight: var(--font-weight-medium);
        color: var(--color-text-primary);
    }

    .status-badge {
        padding: 0.125rem 0.5rem;
        border-radius: 12px;
        font-size: var(--12px);
        font-weight: var(--font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-badge.truncated {
        background-color: rgba(255, 193, 7, 0.2);
        color: var(--color-warning-text, #856404);
        border: 1px solid var(--color-warning, #ffc107);
    }

    .status-badge.skipped {
        background-color: rgba(220, 53, 69, 0.2);
        color: var(--color-error-text, #721c24);
        border: 1px solid var(--color-red, #dc3545);
    }

    .coverage-info {
        margin-top: 0.25rem;
        font-size: var(--12px);
        color: var(--color-text-secondary);
        font-style: italic;
    }

    .upload-status {
        font-size: var(--14px);
        padding: 0.75rem;
        border-radius: var(--border-radius);
        font-weight: var(--font-weight-normal);
        font-family: var(--font-form);
    }

    .upload-status.success {
        color: var(--color-electric-green);
        background-color: rgba(58, 230, 96, 0.1);
        border: 1px solid var(--color-electric-green);
    }

    .upload-status.error {
        color: var(--color-red);
        background-color: rgba(255, 83, 61, 0.1);
        border: 1px solid var(--color-red);
    }

    .upload-warnings {
        font-size: var(--13px);
        padding: 0.75rem;
        border-radius: var(--border-radius);
        background-color: rgba(255, 193, 7, 0.1);
        border: 1px solid var(--color-warning, #ffc107);
        color: var(--color-warning-text, #856404);
    }

    .warning-header {
        font-weight: var(--font-weight-medium);
        margin-bottom: 0.5rem;
    }

    .warning-item {
        margin-bottom: 0.25rem;
        padding-left: 1rem;
    }

    .warning-item:last-child {
        margin-bottom: 0;
    }
</style>