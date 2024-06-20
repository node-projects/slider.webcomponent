import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";

export class SliderWebcomponent extends BaseCustomWebComponentConstructorAppend {

    public static override readonly style = css` 

        .inputs-wrapper { 
            display: flex;
            font-size: 19px; 
            color: #555; 
            justify-content: space-between;
            margin-top: 10px;
        } 
        
        .input-field input { 
            height: 35px; 
            font-size: 15px; 
            font-family: "DM Sans", sans-serif; 
            border-radius: 9px; 
            text-align: center; 
            border: 0px; 
            background: #e4e4e4; 
            width: 100px;
        } 
        
        /* Remove Arrows/Spinners */
        input::-webkit-outer-spin-button, 
        input::-webkit-inner-spin-button { 
            appearance: none; 
            margin: 0; 
        } 
        
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

        <div class="inputs-wrapper-container">

            <div class="slider-container">
                <div id="slider">
                </div>
            </div>
        </div>

        <!-- Slider -->
        <div class="range-input">
            <input type="range" class="min-range" step="1">
            <input type="range" class="max-range" step="1">
        </div>

        <div class="inputs-wrapper">
            <div class="input-field">
                <input type="number" class="min-input">
            </div>
            <div class="input-field">
                <input type="number" class="max-input">
            </div>
        </div>

    `;

    public static readonly is = 'node-projects-slider';

    public static properties = {
        valueMin: Number,
        valueMax: Number,
        min: Number,
        max: Number
    }

    static observedAttributes = ['value-min', 'value-max', 'min', 'max'];

    private _valueMin: number = 0;
    private _valueMax: number = 0;
    private _min: number = 0;
    private _max: number = 0;
    private _inputs: HTMLInputElement[];
    private _rangeInputs: HTMLInputElement[];
    private _ready: Boolean = false;
    private _valuesGap: number = 1;

    public get valueMin() {
        return this._valueMin;
    }
    public set valueMin(value) {
        this.setAttribute('value-min', value.toString());
    }

    public get valueMax() {
        return this._valueMax;
    }
    public set valueMax(value) {
        this.setAttribute('value-max', value.toString());
    }

    public get min() {
        return this._min;
    }
    public set min(value) {
        this.setAttribute('min', value.toString());
    }

    public get max() {
        return this._max;
    }
    public set max(value) {
        this.setAttribute('max', value.toString());
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
            if (name == "value-min"){
                this._valueMin = Number(newValue);
                this._valueMinChanged();
            }
            if (name === "value-max"){
                this._valueMax = Number(newValue);
                this._valueMaxChanged();
            } 
            if (name == "min"){
                this._min = Number(newValue);
                this._minChanged();
            }
            if (name === "max"){
                this._max = Number(newValue);
                this._maxChanged();
            } 
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
        this._inputs = Array.from(this._getDomElements(".inputs-wrapper input"));
        this._rangeInputs = Array.from(this._getDomElements(".range-input input"));
    }

    disconnectedCallback() {}

    ready() {
        this._parseAttributesToProperties();

        const rangevalue: HTMLDivElement = this._getDomElement("slider");

        for (let i = 0; i < this._inputs.length; i++) {
            this._inputs[i].addEventListener("blur", this._handleInputChange.bind(this));
            this._inputs[i].addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    this._handleInputChange(e);
                }
            });
        }

        // Add event listeners to range input elements 
        for (let i = 0; i < this._rangeInputs.length; i++) {
            this._rangeInputs[i].addEventListener("input", e => {
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
                    this._inputs[0].value = minVal.toString();
                    this._inputs[1].value = maxVal.toString();
                    this.valueMin = minVal;
                    this.valueMax = maxVal;
                    rangevalue.style.left = `${(minVal / parseInt(this._rangeInputs[0].max)) * 100}%`;
                    rangevalue.style.right = `${100 - (maxVal / parseInt(this._rangeInputs[1].max)) * 100}%`;
                }
            });
        }

        this._ready = true;

        this._updateInputValues();
        this._updateRangeInputsMinMax();
        this._updateSliderPosition(this.valueMin, parseInt(this._rangeInputs[0].max), true);
        this._updateSliderPosition(this.valueMax, parseInt(this._rangeInputs[1].max), false);
    }

    private _updateInputValues() {
        this._inputs[0].value = this._valueMin.toString();
        this._inputs[1].value = this._valueMax.toString();
    }

    private _updateRangeInputsMinMax() {
        this._rangeInputs.forEach(rangeInput => {
            rangeInput.min = this._min.toString();
            rangeInput.max = this._max.toString();
        });
        this._rangeInputs[0].value = this.valueMin.toString();
        this._rangeInputs[1].value = this.valueMax.toString();
    }

    private _handleInputChange(e: Event) {
        const inputIndex = this._inputs.indexOf(e.target as HTMLInputElement);
        if (inputIndex === -1) return;

        let minp = parseInt(this._inputs[0].value);
        let maxp = parseInt(this._inputs[1].value);
        let diff = maxp - minp;

        if (minp < this._min) {
            console.log(`Minimum value cannot be less than ${this.min.toString()}`);
            this._inputs[0].value = this._min.toString();
            minp = 0;
        }

        if (maxp > this._max) {
            console.log(`Maximum value cannot be greater than ${this.max.toString()}`)
            this._inputs[1].value = this._max.toString();
            maxp = this._max;
        }

        if (minp > maxp - diff) {
            this._inputs[0].value = (maxp - diff).toString();
            minp = maxp - diff;

            if (minp < this._min) {
                this._inputs[0].value = this._min.toString();
                minp = this._min;
            }
        }

        if (diff >= this._valuesGap && maxp <= parseInt(this._rangeInputs[1].max)) {
            if (inputIndex === 0) {
                this._rangeInputs[0].value = minp.toString();
                let value1 = parseInt(this._rangeInputs[0].max);
                this._updateSliderPosition(minp, value1, true);
            } else {
                this._rangeInputs[1].value = maxp.toString();
                let value2 = parseInt(this._rangeInputs[1].max);
                this._updateSliderPosition(maxp, value2, false);
            }
        }
    }

    private _updateSliderPosition(value: number, max: number, isMin: boolean) {
        const rangevalue: HTMLDivElement = this._getDomElement("slider");
        if (isMin) {
            rangevalue.style.left = `${(value / max) * 100}%`;
        } else {
            rangevalue.style.right = `${100 - (value / max) * 100}%`;
        }
    }

    private _valueMinChanged() {
        if (!this._ready) return;
        this._inputs[0].value = this._valueMin.toString();
        this._inputs[0].dispatchEvent(new Event('blur', { bubbles: true }));
    }

    private _valueMaxChanged() {
        if (!this._ready) return;
        this._inputs[1].value = this._valueMax.toString();
        this._inputs[1].dispatchEvent(new Event('blur', { bubbles: true }));
    }

    private _minChanged() {
        if (!this._ready) return;
        this._updateRangeInputsMinMax();
    }

    private _maxChanged() {
        if (!this._ready) return;
        this._updateRangeInputsMinMax();
    }
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);
