<script>
    let { isDataReady } = $props();
</script>

<div class="status-card">
    <div class="status-indicator">
        <div class="status-dot {isDataReady ? 'ready' : 'processing'}"></div>
        <span class="status-text">
            {isDataReady ? 'Ready' : 'Processing...'}
        </span>
    </div>
</div>

<style>
    .status-card {
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        background-color: var(--color-bg);
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

    .status-text {
        font-size: var(--14px);
        font-weight: var(--font-weight-normal);
        color: var(--color-fg);
        font-family: var(--font-form);
    }
</style>