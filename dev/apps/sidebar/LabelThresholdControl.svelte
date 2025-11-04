<script>
    import { Accordion } from "bits-ui";

    let {
        labelThreshold = $bindable(10)
    } = $props();

    function getThresholdLabel(val) {
        return val >= 10 ? "All" : val.toString();
    }
</script>

<Accordion.Item value="labelThreshold" class="accordion-item">
    <Accordion.Content class="accordion-content">
        <div class="threshold-control">
            <div class="threshold-display">
                <span class="threshold-value">Max types/cell: {getThresholdLabel(labelThreshold)}</span>
            </div>

            <div class="slider-container">
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={labelThreshold}
                    oninput={(e) => {
                        labelThreshold = parseInt(e.target.value);
                    }}
                    class="threshold-slider"
                />

                <div class="slider-labels">
                    <span>1</span>
                    <span>10+</span>
                </div>
            </div>
        </div>
    </Accordion.Content>
</Accordion.Item>

<style>
    .threshold-control {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .threshold-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: var(--color-input-bg);
        border-radius: var(--border-radius);
        border: 1px solid var(--color-border);
    }

    .threshold-label {
        font-size: var(--12px);
        font-family: var(--font-form);
        color: var(--color-secondary-gray);
    }

    .threshold-value {
        font-size: var(--font-size-small);
        font-family: var(--font-body);
        font-weight: var(--font-weight-bold);
        color: var(--color-fg);
    }

    .threshold-description {
        font-size: var(--12px);
        color: var(--color-secondary-gray);
        font-family: var(--font-form);
        line-height: 1.4;
        margin: 0;
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .threshold-slider {
        width: 100%;
        height: 6px;
        background-color: var(--color-border);
        border-radius: var(--border-radius);
        outline: none;
        cursor: pointer;
        -webkit-appearance: none;
        appearance: none;
    }

    .threshold-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: var(--color-good-blue);
        border-radius: 50%;
        cursor: pointer;
    }

    .threshold-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: var(--color-good-blue);
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: var(--12px);
        color: var(--color-secondary-gray);
        font-family: var(--font-form);
    }

    .preset-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .preset-btn {
        flex: 1;
        min-width: 3rem;
        padding: 0.5rem;
        background-color: var(--color-input-bg);
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        font-family: var(--font-form);
        font-size: var(--12px);
        color: var(--color-fg);
        cursor: pointer;
        transition: all var(--transition-medium) ease;
    }

    .preset-btn:hover {
        background-color: var(--color-gray-200);
        border-color: var(--color-good-blue);
    }

    .preset-btn.active {
        background-color: var(--color-good-blue);
        color: var(--color-white);
        border-color: var(--color-good-blue);
    }

    :global(.dark) .preset-btn:hover {
        background-color: var(--color-gray-700);
    }
</style>
