<script>
    import { Accordion, Button, Separator } from "bits-ui";
    import UploadSection from './sidebar/UploadSection.svelte';
    import AlphaControl from './sidebar/AlphaControl.svelte';
    import LabelThresholdControl from './sidebar/LabelThresholdControl.svelte';
    import DataInfo from './sidebar/DataInfo.svelte';
    import StatusCard from './sidebar/StatusCard.svelte';


    import {
        allotax,
        uiState,
        alphas,
        toggleSidebar,
        handleFileUpload
    } from './state.svelte.ts';

    let alphaIndex = $state(7);
</script>

<div class="sidebar-content">
    <div class="sidebar-header">
        {#if !uiState.sidebarCollapsed}
            <h2 class="sidebar-title">Allotaxonograph</h2>
        {/if}
        <Button.Root onclick={toggleSidebar} variant="ghost" size="sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                {#if uiState.sidebarCollapsed}
                    <path d="M9 18l6-6-6-6"/>
                {:else}
                    <path d="M15 18l-6-6 6-6"/>
                {/if}
            </svg>
        </Button.Root>
    </div>
    
    {#if !uiState.sidebarCollapsed}
        <div class="sidebar-body">
            <Accordion.Root type="multiple" value={["upload", "alpha", "labelThreshold", "info"]} class="accordion">
                <UploadSection
                        bind:sys1={allotax.sys1}
                        bind:sys2={allotax.sys2}
                        bind:title={allotax.title}
                        {handleFileUpload}
                        uploadStatus={uiState.uploadStatus}
                        uploadWarnings={uiState.uploadWarnings}
                        fileMetadata={uiState.fileMetadata}
                />
                <Separator.Root/>
                <AlphaControl
                    {allotax}
                    bind:alphaIndex={alphaIndex}
                    {alphas}
                />
                <Separator.Root/>
                <LabelThresholdControl
                    bind:labelThreshold={uiState.labelThreshold}
                />
                <Separator.Root/>
                <DataInfo
                    title={allotax.title}
                    me={allotax.me}
                    rtd={allotax.rtd}
                    isDataReady={allotax.isDataReady}
                />
            </Accordion.Root>

            <StatusCard isDataReady={allotax.isDataReady} />
        </div>
    {:else}
        <div class="sidebar-collapsed">
            <div class="collapsed-item" title="Alpha: {allotax.alpha}">
                <div class="alpha-icon">α</div>
                <div class="alpha-mini">{allotax.alpha.toString().slice(0, 4)}</div>
            </div>
            
            <div class="collapsed-item" title={allotax.isDataReady ? 'Ready' : 'Processing...'}>
                <div class="status-dot {allotax.isDataReady ? 'ready' : 'processing'}"></div>
            </div>

            <div class="collapsed-item" title="Upload Data">📁</div>
            <div class="collapsed-item" title="Dataset Info">📊</div>
        </div>
    {/if}
</div>

<style>
    .sidebar-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-width: 0;
        overflow: hidden;
        max-width: 100%;
    }

    .sidebar-header {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        border-bottom: 1px solid var(--color-border);
        min-height: 80px;
        flex-shrink: 0;
        min-width: 0;
        overflow: hidden;
        max-width: 100%;
    }

    /* When collapsed, center the toggle button */
    .sidebar-content:has(.sidebar-collapsed) .sidebar-header,
    .sidebar-header:has(+ * .sidebar-collapsed) {
        padding: 1rem;
        justify-content: center;
    }

    .sidebar-title {
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-bold);
        margin: 0;
        color: var(--color-fg);
        font-family: var(--font-body);
    }

    .sidebar-body {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        overflow-y: auto;
        overflow-x: hidden;
        max-width: 100%;
    }

    .sidebar-collapsed {
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    .collapsed-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        border-radius: var(--border-radius);
        transition: background-color var(--transition-medium) ease;
        cursor: pointer;
    }

    .collapsed-item:hover {
        background-color: var(--color-gray-200);
    }

    :global(.dark) .collapsed-item:hover {
        background-color: var(--color-gray-700);
    }

    .alpha-icon {
        width: 2rem;
        height: 2rem;
        background-color: var(--color-good-blue);
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-white);
        font-size: var(--14px);
        font-weight: var(--font-weight-bold);
        font-family: var(--font-form);
    }

    .alpha-mini {
        font-size: var(--12px);
        font-family: var(--font-form);
        color: var(--color-secondary-gray);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-dot.ready {
        background-color: var(--color-electric-green);
    }

    .status-dot.processing {
        background-color: var(--color-yellow);
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
  
  :global([data-separator-root]) {
            margin-top: 1.2rem;   /* my-4 = 1rem top */
            margin-bottom: 1.2rem;/* my-4 = 1rem bottom */
            flex-shrink: 0;     /* shrink-0 */
            height: 1px;        /* h-px */
            width: 100%;        /* w-full */
        }
</style>