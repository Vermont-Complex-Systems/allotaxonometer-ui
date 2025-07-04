<script>
    import { Accordion } from "bits-ui";
    
    let { 
        allotax,  // Pass the whole class instance
        alphaIndex = $bindable(7),
        alphas
    } = $props();

    // Derived alpha for display
    let alpha = $derived(allotax.alpha);
</script>

<Accordion.Item value="alpha" class="accordion-item">
    <Accordion.Content class="accordion-content">
        <div class="alpha-control">
            <div class="alpha-display">
                <span class="alpha-value">α = {alpha}</span>
            </div>
            
            <div class="slider-container">
                <input 
                    type="range"
                    min="0"
                    max={alphas.length - 1}
                    value={alphaIndex}
                    oninput={(e) => {
                        alphaIndex = parseInt(e.target.value);
                        allotax.setAlpha(alphas[alphaIndex]); // Update the class
                    }}
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

<style>
    .alpha-control {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .alpha-display {
        text-align: center;
        padding: 1rem;
        background-color: var(--color-input-bg);
        border-radius: var(--border-radius);
        border: 1px solid var(--color-border);
    }

    .alpha-value {
        font-size: var(--font-size-small);
        font-family: var(--font-body);
        font-weight: var(--font-weight-bold);
        color: var(--color-fg);
    }

    .slider-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .alpha-slider {
        width: 100%;
        height: 6px;
        background-color: var(--color-border);
        border-radius: var(--border-radius);
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
        background: var(--color-good-blue);
        border-radius: 50%;
        cursor: pointer;
    }

    .alpha-slider::-moz-range-thumb {
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
</style>