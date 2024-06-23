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

    private _numberInputs: HTMLInputElement[];
    private _rangeInputs: HTMLInputElement[];
    private _ready: Boolean = false;
    private _valuesGap: number = 1;
    private _suppressAttributeChange: boolean = false;

    public get valueMin() {
        return this.getAttribute('value-min');
    }
    public set valueMin(value) {
        this._suppressAttributeChange = true;
        this.setAttribute('value-min', value.toString());
        this._suppressAttributeChange = false;
    }

    public get valueMax() {
        return this.getAttribute('value-max');
    }
    public set valueMax(value) {
        this._suppressAttributeChange = true;
        this.setAttribute('value-max', value.toString());
        this._suppressAttributeChange = false;
    }

    public get min() {
        return this.getAttribute('min');
    }
    public set min(value) {
        this._suppressAttributeChange = true;
        this.setAttribute('min', value.toString());
        this._suppressAttributeChange = false;
    }

    public get max() {
        return this.getAttribute('max');
    }
    public set max(value) {
        this._suppressAttributeChange = true;
        this.setAttribute('max', value.toString());
        this._suppressAttributeChange = false;
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this._suppressAttributeChange) return;
        if (name == "value-min") {
            this._valueMinAttributeChanged();
        }
        if (name === "value-max") {
            this._valueMaxAttributeChanged();
        }
        if (name == "min") {
            this._minAttributeChanged();
        }
        if (name === "max") {
            this._maxAttributeChanged();
        }
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
        this._numberInputs = Array.from(this._getDomElements(".inputs-wrapper input"));
        this._rangeInputs = Array.from(this._getDomElements(".range-input input"));
    }

    disconnectedCallback() { }

    ready() {
        this._parseAttributesToProperties();

        for (let i = 0; i < this._numberInputs.length; i++) {
            this._numberInputs[i].addEventListener("blur", this._handleInputChange.bind(this));
            this._numberInputs[i].addEventListener("keydown", (e) => {
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
                    this._numberInputs[0].value = minVal.toString();
                    this._numberInputs[1].value = maxVal.toString();
                    this._updateSliderPosition(minVal, parseInt(this._rangeInputs[0].max), true);
                    this._updateSliderPosition(maxVal, parseInt(this._rangeInputs[1].max), false);
                }
            });

            this._rangeInputs[i].addEventListener("change", e => {
                let minVal = parseInt(this._rangeInputs[0].value);
                let maxVal = parseInt(this._rangeInputs[1].value);

                this.valueMin = minVal.toString();
                this.valueMax = maxVal.toString();
            });
        }

        this._ready = true;

        this._updateInputValues();
        this._updateRangeInputsMinMax();
        this._updateSliderPosition(parseInt(this.valueMin), parseInt(this._rangeInputs[0].max), true);
        this._updateSliderPosition(parseInt(this.valueMax), parseInt(this._rangeInputs[1].max), false);
    }

    private _updateInputValues() {
        this._numberInputs[0].value = this.valueMin.toString();
        this._numberInputs[1].value = this.valueMax.toString();
    }

    private _updateRangeInputsMinMax() {
        this._rangeInputs.forEach(rangeInput => {
            rangeInput.min = this.min.toString();
            rangeInput.max = this.max.toString();
        });
        this._rangeInputs[0].value = this.valueMin.toString();
        this._rangeInputs[1].value = this.valueMax.toString();
    }

    private _handleInputChange(e: Event) {
        const inputIndex = this._numberInputs.indexOf(e.target as HTMLInputElement);
        if (inputIndex === -1) return;

        let minp = parseInt(this._numberInputs[0].value);
        let maxp = parseInt(this._numberInputs[1].value);
        let diff = maxp - minp;

        if (minp < parseInt(this.min)) {
            console.log(`Minimum value cannot be less than ${this.min.toString()}`);
            this._numberInputs[0].value = this.min.toString();
            minp = parseInt(this.min);
        }

        if (maxp > parseInt(this.max)) {
            console.log(`Maximum value cannot be greater than ${this.max.toString()}`)
            this._numberInputs[1].value = this.max.toString();
            maxp = parseInt(this.max);
        }

        if (minp > maxp - diff) {
            this._numberInputs[0].value = (maxp - diff).toString();
            minp = maxp - diff;

            if (minp < parseInt(this.min)) {
                this._numberInputs[0].value = this.min.toString();
                minp = parseInt(this.min);
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
        this.valueMin = this._rangeInputs[0].value;
        this.valueMax = this._rangeInputs[1].value;
    }

    private _updateSliderPosition(value: number, max: number, isMin: boolean) {
        const rangevalue: HTMLDivElement = this._getDomElement("slider");
        const range = parseInt(this.max) - parseInt(this.min); // Calculate the total range

        if (isMin) {
            const relativeValue = value - parseInt(this.min); // Calculate the relative value within the range
            rangevalue.style.left = `${(relativeValue / range) * 100}%`;
        } else {
            const relativeValue = value - parseInt(this.min); // Calculate the relative value within the range
            rangevalue.style.right = `${100 - (relativeValue / range) * 100}%`;
        }
    }

    private _valueMinAttributeChanged() {
        if (!this._ready) return;
        this._handleInputChange({ target: this._numberInputs[0] } as unknown as Event);
    }

    private _valueMaxAttributeChanged() {
        if (!this._ready) return;
        this._handleInputChange({ target: this._numberInputs[1] } as unknown as Event);
    }

    private _minAttributeChanged() {
        if (!this._ready) return;
        this._updateRangeInputsMinMax();
    }

    private _maxAttributeChanged() {
        if (!this._ready) return;
        this._updateRangeInputsMinMax();
    }
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);
