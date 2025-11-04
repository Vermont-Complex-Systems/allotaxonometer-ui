<script>
    import Sidebar from './Sidebar.svelte';
    import { Dashboard } from 'allotaxonometer-ui';
    import { uiState, allotax } from './state.svelte.ts';

    
</script>

<div class="app-container">
        <div class="layout">
            <aside class="sidebar-container {uiState.sidebarCollapsed ? 'collapsed' : ''}">
                <Sidebar />
            </aside>
            
            <main class="main-content {uiState.sidebarCollapsed ? 'collapsed-sidebar' : ''}">
                {#if allotax.isDataReady}
                    <Dashboard {...allotax} labelThreshold={uiState.labelThreshold} />
                {:else}
                    <div class="loading-container">
                        <div class="loading-content">
                            <div class="spinner"></div>
                            <p class="loading-text">Loading allotaxonograph...</p>
                        </div>
                    </div>
                {/if}
            </main>
        </div>
</div>

<style>

    .app-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        overflow: hidden;
    }

    .layout {
        display: flex;
        height: 100vh;
        width: 100vw;
        margin: 0;
        padding: 0;
    }

    .sidebar-container {
        flex-shrink: 0;
        width: 17rem;
        background-color: var(--color-input-bg);
        border-right: 1px solid var(--color-border);
        transition: width var(--transition-medium) ease;
        overflow: hidden;
    }

    .sidebar-container.collapsed {
        width: 5rem;
    }

    .main-content {
        flex: 1;
        overflow: auto;
        background-color: var(--color-bg);
        max-width: none;
        margin: 0;
        padding: 5.5rem 0 0 5.5rem; /* Added left and right padding */
        transition: padding-left var(--transition-medium) ease;
    }

    .main-content.collapsed-sidebar {
        padding-left: 0;
    }
    

    /* Responsive */
    @media (max-width: 768px) {
        .layout {
            flex-direction: column;
        }
        
        .sidebar-container {
            width: 100% !important;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
        }

        .main-content.collapsed-sidebar {
            padding-left: 0;
        }
    }

    .loading-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px;
    }

    .loading-content {
        text-align: center;
    }

    .spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid var(--color-border);
        border-top: 3px solid var(--color-good-blue);
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
        color: var(--color-fg);
        margin: 0;
        font-family: var(--font-body);
    }
</style>