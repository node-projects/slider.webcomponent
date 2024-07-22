import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class SliderWebcomponent extends BaseCustomWebComponentConstructorAppend {

    public static override readonly style = css` 

        .slider-container { 
            width: 100%;
        } 
        
        .slider-container { 
            height: 6px; 
            position: relative; 
            background: #e4e4e4; 
            border-radius: 5px; 
        } 
        
        .slider-container #slider { 
            height: 100%; 
            left: 25%; 
            right: 25%; 
            position: absolute; 
            border-radius: 5px; 
            background: #01940b; 
        } 
        
        .range-input { 
            position: relative; 
        } 
  
        .range-input input { 
            position: absolute; 
            width: 100%; 
            height: 5px; 
            background: none; 
            top: -8px; 
            pointer-events: none; 
            cursor: pointer; 
            appearance: none; 
        } 
  
        /* Styles for the range thumb in WebKit browsers */
        input[type="range"]::-webkit-slider-thumb { 
            height: 18px; 
            width: 18px; 
            border-radius: 70%; 
            background: #555; 
            pointer-events: auto; 
            appearance: none; 
        } 
        
        input[type="range"]::-moz-range-thumb { 
            height: 18px; 
            width: 18px; 
            border-radius: 70%; 
            background: #555; 
            pointer-events: auto; 
            appearance: none; 
        }
  
    `;

    public static override readonly template = html`

        <div class="slider-container">
            <div id="slider"></div>
        </div>

        <!-- Slider -->
        <div class="range-input">
            <input type="range" class="min-range" step="1">
            <input type="range" class="max-range" step="1">
        </div>

    `;

    public static readonly is = 'node-projects-slider';

    static observedAttributes = ['value-min', 'value-max', 'min', 'max'];

    private _rangeInputs: HTMLInputElement[];
    private _valuesGap: number = 1;
    private _suppressAttributeChange: boolean = false;

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this._suppressAttributeChange) return;

        if (name === "value-min" || name === "value-max") {
            this._validateValues(name, newValue);
        }

        if (name === "min" || name === "max") {
            this._updateRangeInputsMinMax();
        }
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
        this._rangeInputs = Array.from(this._getDomElements(".range-input input"));
    }

    disconnectedCallback() { }

    ready() {
        this._parseAttributesToProperties();

        // Add event listeners to range input elements
        for (let i = 0; i < this._rangeInputs.length; i++) {
            this._rangeInputs[i].addEventListener("input", e => {
                this._handleRangeInput(e);
            });

            this._rangeInputs[i].addEventListener("change", e => {
                this._handleRangeChange(e);
            });
        }

        this._updateRangeInputsMinMax();
        this._updateRangeInputsValues();
        this._updateSliderPosition(parseInt(this.getAttribute('value-min')), parseInt(this.getAttribute('max')), true);
        this._updateSliderPosition(parseInt(this.getAttribute('value-max')), parseInt(this.getAttribute('max')), false);
    }

    private _validateValues(changedAttr: string, newValue: string) {
        let min = parseInt(this.getAttribute('min'));
        let max = parseInt(this.getAttribute('max'));
        let valueMin = parseInt(this.getAttribute('value-min'));
        let valueMax = parseInt(this.getAttribute('value-max'));

        if (changedAttr === 'value-min') {
            valueMin = Math.max(min, Math.min(parseInt(newValue), valueMax - this._valuesGap));
        } else if (changedAttr === 'value-max') {
            valueMax = Math.min(max, Math.max(parseInt(newValue), valueMin + this._valuesGap));
        }

        const oldValueMin = parseInt(this.getAttribute('value-min'));
        const oldValueMax = parseInt(this.getAttribute('value-max'));

        this._suppressAttributeChange = true;
        this.setAttribute('value-min', valueMin.toString());
        this.setAttribute('value-max', valueMax.toString());
        this._suppressAttributeChange = false;

        this._updateRangeInputsValues();
        this._updateSliderPosition(valueMin, max, true);
        this._updateSliderPosition(valueMax, max, false);

        if (changedAttr === 'value-min' && valueMin !== oldValueMin) {
            this._dispatchChangeEvent('value-min-changed', valueMin);
        } else if (changedAttr === 'value-max' && valueMax !== oldValueMax) {
            this._dispatchChangeEvent('value-max-changed', valueMax);
        }
    }

    private _updateRangeInputsMinMax() {
        this._rangeInputs.forEach(rangeInput => {
            rangeInput.min = this.getAttribute('min');
            rangeInput.max = this.getAttribute('max');
        });
    }

    private _updateRangeInputsValues() {
        this._rangeInputs[0].value = this.getAttribute('value-min');
        this._rangeInputs[1].value = this.getAttribute('value-max');
    }

    private _handleRangeInput(e: Event) {
        let minVal = parseInt(this._rangeInputs[0].value);
        let maxVal = parseInt(this._rangeInputs[1].value);

        let diff = maxVal - minVal;

        // Check if the values gap is exceeded
        if (diff < this._valuesGap) {
            // Check if the input is the min range input
            if ((e.target as HTMLInputElement).className === "min-range") {
                this._rangeInputs[0].value = (maxVal - this._valuesGap).toString();
            } else {
                this._rangeInputs[1].value = (minVal + this._valuesGap).toString();
            }
        } else {
            // Update input values and range progress
            this._suppressAttributeChange = true;
            this.setAttribute('value-min', minVal.toString());
            this.setAttribute('value-max', maxVal.toString());
            this._suppressAttributeChange = false;
            this._updateSliderPosition(minVal, parseInt(this.getAttribute('max')), true);
            this._updateSliderPosition(maxVal, parseInt(this.getAttribute('max')), false);
        }
    }

    private _handleRangeChange(e: Event) {
        let minVal = parseInt(this._rangeInputs[0].value);
        let maxVal = parseInt(this._rangeInputs[1].value);

        // Prevent duplicate event firing
        const currentMinVal = parseInt(this.getAttribute('value-min'));
        const currentMaxVal = parseInt(this.getAttribute('value-max'));

            this._suppressAttributeChange = true;
            this.setAttribute('value-min', minVal.toString());
            this.setAttribute('value-max', maxVal.toString());
            this._suppressAttributeChange = false;

            // Dispatch the appropriate event
            if ((e.target as HTMLInputElement).className === "min-range") {
                this._dispatchChangeEvent('value-min-changed', minVal);
            } else {
                this._dispatchChangeEvent('value-max-changed', maxVal);
            }
    }

    private _updateSliderPosition(value: number, max: number, isMin: boolean) {
        const rangevalue: HTMLDivElement = this._getDomElement("slider");
        const range = parseInt(this.getAttribute('max')) - parseInt(this.getAttribute('min')); // Calculate the total range

        if (isMin) {
            const relativeValue = value - parseInt(this.getAttribute('min')); // Calculate the relative value within the range
            rangevalue.style.left = `${(relativeValue / range) * 100}%`;
        } else {
            const relativeValue = value - parseInt(this.getAttribute('min')); // Calculate the relative value within the range
            rangevalue.style.right = `${100 - (relativeValue / range) * 100}%`;
        }
    }

    private _dispatchChangeEvent(eventName: string, value: number) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail: {
                value: value
            }
        }));
    }
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);
