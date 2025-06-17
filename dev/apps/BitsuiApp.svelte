<script>
    import * as d3 from "d3";
    import { Accordion, Button, Separator } from "bits-ui";
    import { Dashboard } from 'allotaxonometer-ui';
    import { combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat } from 'allotaxonometer-ui';
    
    import boys1895 from '../../tests/fixtures/boys-1895.json';
    import boys1968 from '../../tests/fixtures/boys-1968.json';

    // Process the data directly
    let sys1 = $state(boys1895);
    let sys2 = $state(boys1968);
    let alpha = $state(0.58);
    let title = $state(['Boys 1895', 'Boys 1968']); // Make this mutable
    
    let sidebarCollapsed = $state(false);
    let isDarkMode = $state(false);

    let DashboardHeight = 815;
    let DashboardWidth = $derived(sidebarCollapsed ? 1200 : 900);
    let DiamondHeight = 600;
    let DiamondWidth = DiamondHeight;
    let marginInner = 160;
    let marginDiamond = 40;
    let WordshiftWidth = $derived(sidebarCollapsed ? 550 : 400);

    const alphas = d3.range(0,18).map(v => +(v/12).toFixed(2)).concat([1, 2, 5, Infinity]);
    let alphaIndex = $state(7); // Start at 0.58

    $effect(() => {
        alpha = alphas[alphaIndex];
    });

    // Theme toggle
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        document.documentElement.classList.toggle('dark', isDarkMode);
    }

    // File upload handling
    let fileInput1, fileInput2;
    let uploadStatus = $state('');

    async function handleFileUpload(file, system) {
        try {
            uploadStatus = `Loading ${system}...`;
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Update the appropriate system
            if (system === 'sys1') {
                sys1 = data;
                title[0] = file.name.replace('.json', '');
            } else {
                sys2 = data;
                title[1] = file.name.replace('.json', '');
            }
            
            uploadStatus = `${system.toUpperCase()} loaded successfully!`;
            setTimeout(() => uploadStatus = '', 3000);
        } catch (error) {
            uploadStatus = `Error loading ${system}: ${error.message}`;
            setTimeout(() => uploadStatus = '', 5000);
        }
    }

    // Data processing
    let me = $derived(sys1 && sys2 ? combElems(sys1, sys2) : null);
    let rtd = $derived(me ? rank_turbulence_divergence(me, alpha) : null);
    let dat = $derived(me && rtd ? diamond_count(me, rtd) : null);
    
    let barData = $derived(me && dat ? wordShift_dat(me, dat).slice(0, 30) : []);
    let balanceData = $derived(sys1 && sys2 ? balanceDat(sys1, sys2) : []);
    let maxlog10 = $derived(me ? Math.ceil(d3.max([Math.log10(d3.max(me[0].ranks)), Math.log10(d3.max(me[1].ranks))])) : 0);
    let max_count_log = $derived(dat ? Math.ceil(Math.log10(d3.max(dat.counts, d => d.value))) + 1 : 2);
    let max_shift = $derived(barData.length > 0 ? d3.max(barData, d => Math.abs(d.metric)) : 1);
    let isDataReady = $derived(dat && barData && balanceData && me && rtd);
</script>

<!-- Theme toggle button -->
<div class="theme-toggle">
    <Button.Root onclick={toggleTheme} variant="outline" size="sm">
        {#if isDarkMode}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
        {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        {/if}
        <span class="sr-only">Toggle theme</span>
    </Button.Root>
</div>

<div class="app-container">
    <div class="layout">
        <!-- Sidebar -->
        <aside class="sidebar" style="width: {sidebarCollapsed ? '4rem' : '20rem'}">
            <div class="sidebar-header">
                {#if !sidebarCollapsed}
                    <h2 class="sidebar-title">Allotaxonograph</h2>
                {/if}
                <Button.Root onclick={() => sidebarCollapsed = !sidebarCollapsed} variant="ghost" size="sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        {#if sidebarCollapsed}
                            <path d="M9 18l6-6-6-6"/>
                        {:else}
                            <path d="M15 18l-6-6 6-6"/>
                        {/if}
                    </svg>
                </Button.Root>
            </div>
            
            {#if !sidebarCollapsed}
                <div class="sidebar-content">
                    <Accordion.Root type="multiple" value={["upload", "alpha", "info"]} class="accordion">
                        <!-- File Upload Section -->
                        <Accordion.Item value="upload" class="accordion-item">
                            <Accordion.Header>
                                <Accordion.Trigger class="accordion-trigger">
                                    <span>📁 Upload Data</span>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content class="accordion-content">
                                <div class="upload-section">
                                    <div class="input-group">
                                        <label for="file1" class="input-label">System 1 (.json)</label>
                                        <div class="file-input-wrapper">
                                            <input 
                                                id="file1"
                                                type="file" 
                                                accept=".json"
                                                bind:this={fileInput1}
                                                onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys1')}
                                                class="file-input-hidden"
                                            />
                                            <button class="file-input-button" onclick={() => fileInput1.click()}>
                                                Choose file
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="input-group">
                                        <label for="file2" class="input-label">System 2 (.json)</label>
                                        <div class="file-input-wrapper">
                                            <input 
                                                id="file2"
                                                type="file" 
                                                accept=".json"
                                                bind:this={fileInput2}
                                                onchange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'sys2')}
                                                class="file-input-hidden"
                                            />
                                            <button class="file-input-button" onclick={() => fileInput2.click()}>
                                                Choose file
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {#if uploadStatus}
                                        <div class="upload-status {uploadStatus.includes('Error') ? 'error' : 'success'}">
                                            {uploadStatus}
                                        </div>
                                    {/if}
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>

                        <!-- Alpha Control -->
                        <Accordion.Item value="alpha" class="accordion-item">
                            <Accordion.Header>
                                <Accordion.Trigger class="accordion-trigger">
                                    <span>α Alpha Parameter</span>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content class="accordion-content">
                                <div class="alpha-control">
                                    <div class="alpha-display">
                                        <span class="alpha-value">{alpha}</span>
                                    </div>
                                    
                                    <div class="slider-container">
                                        <input 
                                            type="range"
                                            min="0"
                                            max={alphas.length - 1}
                                            value={alphaIndex}
                                            oninput={(e) => alphaIndex = parseInt(e.target.value)}
                                            class="alpha-slider"
                                        />
                                        
                                        <div class="slider-labels">
                                            <span>0</span>
                                            <span>∞</span>
                                        </div>
                                    </div>
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>
                            
                        <!-- Data Info -->
                        <Accordion.Item value="info" class="accordion-item">
                            <Accordion.Header>
                                <Accordion.Trigger class="accordion-trigger">
                                    <span>📊 Dataset Info</span>
                                </Accordion.Trigger>
                            </Accordion.Header>
                            <Accordion.Content class="accordion-content">
                                <div class="data-info">
                                    <div class="info-item">
                                        <span class="info-label">System 1</span>
                                        <span class="info-value">{title[0]}</span>
                                    </div>
                                    
                                    <div class="info-item">
                                        <span class="info-label">System 2</span>
                                        <span class="info-value">{title[1]}</span>
                                    </div>
                                    
                                    {#if isDataReady}
                                        <div class="stats">
                                            <div class="stat">
                                                <span class="stat-label">Items</span>
                                                <span class="stat-value">{me[0].ranks.length.toLocaleString()}</span>
                                            </div>
                                            <div class="stat">
                                                <span class="stat-label">Divergence</span>
                                                <span class="stat-value">{rtd.normalization.toFixed(4)}</span>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>

                    <!-- Status -->
                    <div class="status-card">
                        <div class="status-indicator">
                            <div class="status-dot {isDataReady ? 'ready' : 'processing'}"></div>
                            <span class="status-text">
                                {isDataReady ? 'Ready' : 'Processing...'}
                            </span>
                        </div>
                    </div>
                </div>
            {:else}
                <!-- Collapsed sidebar content -->
                <div class="sidebar-collapsed">
                    <div class="collapsed-item" title="Alpha: {alpha}">
                        <div class="alpha-icon">α</div>
                        <div class="alpha-mini">{alpha.toString().slice(0, 4)}</div>
                    </div>
                    
                    <div class="collapsed-item" title={isDataReady ? 'Ready' : 'Processing...'}>
                        <div class="status-dot {isDataReady ? 'ready' : 'processing'}"></div>
                    </div>

                    <div class="collapsed-item" title="Upload Data">
                        📁
                    </div>

                    <div class="collapsed-item" title="Dataset Info">
                        📊
                    </div>
                </div>
            {/if}
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            {#if isDataReady}
                <Dashboard 
                    {dat}
                    {alpha}
                    divnorm={rtd.normalization}
                    {barData}
                    {balanceData}
                    {title}
                    {maxlog10}
                    {max_count_log}
                    height={DashboardHeight}
                    width={DashboardWidth}
                    {DiamondHeight}
                    {DiamondWidth}
                    {marginInner}
                    {marginDiamond}
                    {WordshiftWidth}
                    xDomain={[-max_shift * 1.5, max_shift * 1.5]}
                    class="dashboard"
                />
            {:else}
                <div class="loading-container">
                    <div class="loading-content">
                        <div class="spinner"></div>
                        <p class="loading-text">Loading dashboard...</p>
                    </div>
                </div>
            {/if}
        </main>
    </div>
</div>

<style>
    /* CSS Custom Properties for theming */
    :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --text-primary: #212529;
        --text-secondary: #6c757d;
        --text-muted: #adb5bd;
        --border-color: #e9ecef;
        --accent-color: #0066cc;
        --success-color: #28a745;
        --error-color: #dc3545;
        --warning-color: #ffc107;
        --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        --radius: 6px;
    }

    :global(.dark) {
        --bg-primary: #0f0f0f;
        --bg-secondary: #1a1a1a;
        --text-primary: #f5f5f5;
        --text-secondary: #a3a3a3;
        --text-muted: #737373;
        --border-color: #404040;
        --accent-color: #4a9eff;
        --success-color: #22c55e;
        --error-color: #ef4444;
        --warning-color: #f59e0b;
        --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    /* Global styles */
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: var(--bg-primary);
        color: var(--text-primary);
        overflow: hidden;
    }

    .theme-toggle {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
    }

    .app-container {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        margin-top: 1rem;
        margin-left: 1rem;
        height: calc(100vh - 1rem);
    }

    .layout {
        display: flex;
        height: 100vh;
        width: 100%;
    }

    /* Sidebar styles */
    .sidebar {
        background-color: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        transition: width 0.3s ease;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--border-color);
    }

    .sidebar-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
    }

    .sidebar-content {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        overflow-y: auto;
    }

    .sidebar-collapsed {
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .collapsed-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem;
        border-radius: var(--radius);
        transition: background-color 0.2s ease;
        cursor: pointer;
    }

    .collapsed-item:hover {
        background-color: var(--border-color);
    }

    .alpha-icon {
        width: 2rem;
        height: 2rem;
        background-color: var(--accent-color);
        border-radius: var(--radius);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .alpha-mini {
        font-size: 0.75rem;
        font-family: monospace;
        color: var(--text-secondary);
    }

    /* Upload section */
    .upload-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
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
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .file-input-button:hover {
        background-color: var(--border-color);
        border-color: var(--accent-color);
    }

    .upload-status {
        font-size: 0.875rem;
        padding: 0.75rem;
        border-radius: var(--radius);
        font-weight: 500;
    }

    .upload-status.success {
        color: var(--success-color);
        background-color: rgba(40, 167, 69, 0.1);
        border: 1px solid var(--success-color);
    }

    .upload-status.error {
        color: var(--error-color);
        background-color: rgba(220, 53, 69, 0.1);
        border: 1px solid var(--error-color);
    }

    /* Alpha control */
    .alpha-control {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .alpha-display {
        text-align: center;
        padding: 1rem;
        background-color: var(--bg-secondary);
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
    }

    .alpha-value {
        font-size: 1.75rem;
        font-family: monospace;
        font-weight: 600;
        color: var(--text-primary);
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .alpha-slider {
        width: 100%;
        height: 6px;
        background-color: var(--border-color);
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
    }

    .alpha-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--accent-color);
        border-radius: 50%;
        cursor: pointer;
    }

    .alpha-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: var(--accent-color);
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    /* Data info */
    .data-info {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background-color: var(--bg-secondary);
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
    }

    .info-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
    }

    .info-value {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.75rem;
        background-color: var(--bg-secondary);
        border-radius: var(--radius);
        border: 1px solid var(--border-color);
    }

    .stat-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-bottom: 0.25rem;
    }

    .stat-value {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
    }

    /* Status */
    .status-card {
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius);
        background-color: var(--bg-primary);
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-dot.ready {
        background-color: var(--success-color);
    }

    .status-dot.processing {
        background-color: var(--warning-color);
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .status-text {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    /* Main content */
    .main-content {
        flex: 1;
        overflow: auto;
        background-color: var(--bg-primary);
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }

    .loading-content {
        text-align: center;
    }

    .spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid var(--border-color);
        border-top: 3px solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .loading-text {
        font-size: 1rem;
        color: var(--text-primary);
        margin: 0;
    }

    /* Screen reader only */
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>