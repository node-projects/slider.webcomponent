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
            -webkit-appearance: none; 
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
            -webkit-appearance: none; 
        } 
  
        /* Styles for the range thumb in WebKit browsers */
        input[type="range"]::-webkit-slider-thumb { 
            height: 18px; 
            width: 18px; 
            border-radius: 70%; 
            background: #555; 
            pointer-events: auto; 
            -webkit-appearance: none; 
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
            <input type="range" class="min-range" min="0" max="10000" value="2500" step="1">
            <input type="range" class="max-range" min="0" max="10000" value="7500" step="1">
        </div>

        <div class="inputs-wrapper">
        <div class="input-field">
            <input type="number" class="min-input" value="2500">
        </div>
        <div class="input-field">
            <input type="number" class="max-input" value="7500">
        </div>
    </div>

    `;

    public static readonly is = 'node-projects-slider';

    public static properties = {
        min: Number,
        max: Number
    }

    static observedAttributes = ['min', 'max'];

    private _min: number = 0;
    private _max: number = 0;
    private _inputValues: HTMLInputElement[];
    private _rangeInputvalues: HTMLInputElement[];
    private _ready: Boolean = false;

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
        if (this._ready) {
            if (name == "min"){
                this._min = Number(newValue);
                this._minChanged();
            }
            if (name === "max"){
                this._max = Number(newValue);
                this._maxChanged();
            } 
        }
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
        this._inputValues = Array.from(this._getDomElements(".inputs-wrapper input"));
        this._rangeInputvalues = Array.from(this._getDomElements(".range-input input"));
    }

    disconnectedCallback() {}

    ready() {
        this._parseAttributesToProperties();

        const rangevalue: HTMLDivElement = this._getDomElement("slider");

        let valuesGap = 500;

        for (let i = 0; i < this._inputValues.length; i++) {
            this._inputValues[i].addEventListener("blur", this._handleInputChange.bind(this));
            this._inputValues[i].addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    this._handleInputChange(e);
                }
            });
        }

        // Add event listeners to range input elements 
        for (let i = 0; i < this._rangeInputvalues.length; i++) {
            this._rangeInputvalues[i].addEventListener("input", e => {
                let minVal = parseInt(this._rangeInputvalues[0].value);
                let maxVal = parseInt(this._rangeInputvalues[1].value);

                let diff = maxVal - minVal;

                // Check if the values gap is exceeded 
                if (diff < valuesGap) {

                    // Check if the input is the min range input 
                    if ((e.target as HTMLInputElement).className === "min-range") {
                        this._rangeInputvalues[0].value = (maxVal - valuesGap).toString();
                    } else {
                        this._rangeInputvalues[1].value = (minVal + valuesGap).toString();
                    }
                } else {

                    // Update input values and range progress 
                    this._inputValues[0].value = minVal.toString();
                    this._inputValues[1].value = maxVal.toString();
                    rangevalue.style.left = `${(minVal / parseInt(this._rangeInputvalues[0].max)) * 100}%`;
                    rangevalue.style.right = `${100 - (maxVal / parseInt(this._rangeInputvalues[1].max)) * 100}%`;
                }
            });
        }

        this._ready = true;
    }

    private _handleInputChange(e: Event) {
        const inputIndex = this._inputValues.indexOf(e.target as HTMLInputElement);
        if (inputIndex === -1) return;

        let minp = parseInt(this._inputValues[0].value);
        let maxp = parseInt(this._inputValues[1].value);
        let diff = maxp - minp;

        if (minp < 0) {
            alert("Minimum value cannot be less than 0");
            this._inputValues[0].value = '0';
            minp = 0;
        }

        if (maxp > 10000) {
            alert("Maximum value cannot be greater than 10000");
            this._inputValues[1].value = '10000';
            maxp = 10000;
        }

        if (minp > maxp - diff) {
            this._inputValues[0].value = (maxp - diff).toString();
            minp = maxp - diff;

            if (minp < 0) {
                this._inputValues[0].value = '0';
                minp = 0;
            }
        }

        if (diff >= 500 && maxp <= parseInt(this._rangeInputvalues[1].max)) {
            if (inputIndex === 0) {
                this._rangeInputvalues[0].value = minp.toString();
                let value1 = parseInt(this._rangeInputvalues[0].max);
                this._updateSliderPosition(minp, value1, true);
            } else {
                this._rangeInputvalues[1].value = maxp.toString();
                let value2 = parseInt(this._rangeInputvalues[1].max);
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

    private _minChanged() {
        this._inputValues[0].value = this._min.toString();
        this._inputValues[0].dispatchEvent(new Event('blur', { bubbles: true }));
    }

    private _maxChanged() {
        this._inputValues[1].value = this._max.toString();
        this._inputValues[1].dispatchEvent(new Event('blur', { bubbles: true }));
    }
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);
