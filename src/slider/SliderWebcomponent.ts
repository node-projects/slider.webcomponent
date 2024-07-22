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

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (newValue === 'undefined') return;
        if (name === "value-min" || name === "value-max") {
            this._validateMinMaxValuesAfterAttributeChangedCallback(name, newValue);
        }

        if (name === "min" || name === "max") {
            this._updateRangeInputsMinMax();
        }
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    disconnectedCallback() { }

    ready() {
        this._rangeInputs = Array.from(this._getDomElements(".range-input input"));

        this._parseAttributesToProperties();

        // Add event listeners to range input elements
        for (let i = 0; i < this._rangeInputs.length; i++) {
            this._rangeInputs[i].addEventListener("input", e => {
                this._handleRangeInputInputEvent(e);                
            });

            this._rangeInputs[i].addEventListener("change", e => {
                this._handleRangeInputChangeEvent(e);
            });
        }

        this._updateRangeInputsMinMax();
        this._rangeInputs[0].value = this.getAttribute('value-min');
        this._rangeInputs[1].value = this.getAttribute('value-max');
        this._updateSliderPosition(parseInt(this.getAttribute('value-min')), parseInt(this.getAttribute('max')), true);
        this._updateSliderPosition(parseInt(this.getAttribute('value-max')), parseInt(this.getAttribute('max')), false);
    }

    private _validateMinMaxValuesAfterAttributeChangedCallback(changedAttr: string, newValue: string) {
        let min = parseInt(this.getAttribute('min'));
        let max = parseInt(this.getAttribute('max'));
        let valueMin = parseInt(this.getAttribute('value-min'));
        let valueMax = parseInt(this.getAttribute('value-max'));

        if (changedAttr === 'value-min') {
            if (parseInt(newValue) < min) {
                this._overwriteOutOfRangeAttributeValue('value-min', min.toString());
                return;
            }
            valueMin = Math.max(min, Math.min(parseInt(newValue), valueMax - this._valuesGap));
            this._updateSliderPosition(valueMin, max, true);
            if (this._rangeInputs) {
                this._rangeInputs[0].value = valueMin.toString(); 
            }
        } else if (changedAttr === 'value-max') {
            if (parseInt(newValue) > max) {
                this._overwriteOutOfRangeAttributeValue('value-max', max.toString());
                return;
            }
            valueMax = Math.min(max, Math.max(parseInt(newValue), valueMin + this._valuesGap));
            this._updateSliderPosition(valueMax, max, false);
            if (this._rangeInputs) {
                this._rangeInputs[1].value = valueMax.toString();
            }
        }
    }

    private _overwriteOutOfRangeAttributeValue(name: string, value: string) {
        this._setAttributeFromInternal(name, value);
    }

    private _updateRangeInputsMinMax() {
        if (this._rangeInputs) {
            this._rangeInputs.forEach(rangeInput => {
                rangeInput.min = this.getAttribute('min');
                rangeInput.max = this.getAttribute('max');
            });
            this._updateSliderPosition(parseInt(this.getAttribute('value-min')), parseInt(this.getAttribute('max')), true);
            this._updateSliderPosition(parseInt(this.getAttribute('value-max')), parseInt(this.getAttribute('max')), false);
        }
    }

    private _handleRangeInputInputEvent(e: Event) {
        let minRangeInputMinVal = parseInt(this._rangeInputs[0].value);
        let maxRangeInputMaxVal = parseInt(this._rangeInputs[1].value);

        let diff = maxRangeInputMaxVal - minRangeInputMinVal;

        // Check if the values gap is exceeded
        if (diff < this._valuesGap) {
            if ((e.target as HTMLInputElement).className === "min-range") {
                this._rangeInputs[0].value = (maxRangeInputMaxVal - this._valuesGap).toString();
            } else {
                this._rangeInputs[1].value = (minRangeInputMinVal + this._valuesGap).toString();
            }
        } else {
            if ((e.target as HTMLInputElement).className === "min-range") {                
                this._setAttributeFromInternal('value-min', minRangeInputMinVal.toString());

            } else if ((e.target as HTMLInputElement).className === "max-range") {                
                this._setAttributeFromInternal('value-max', maxRangeInputMaxVal.toString());
            }            
        }
    }

    private _setAttributeFromInternal(name: string, value: string) {
        this.setAttribute(name,value);
    }

    private _handleRangeInputChangeEvent(e: Event) {
        let minRangeInputMinVal = parseInt(this._rangeInputs[0].value);
        let maxRangeInputMaxVal = parseInt(this._rangeInputs[1].value);

        // Dispatch the appropriate event
        if ((e.target as HTMLInputElement).className === "min-range") {
            this._dispatchChangeEvent('value-min-changed', minRangeInputMinVal);
        } else if ((e.target as HTMLInputElement).className === "max-range") {
            this._dispatchChangeEvent('value-max-changed', maxRangeInputMaxVal);
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
