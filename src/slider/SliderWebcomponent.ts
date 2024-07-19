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

    static observedAttributes = ['value-min', 'value-max', 'min', 'max'];

    private _numberInputs: HTMLInputElement[];
    private _rangeInputs: HTMLInputElement[];
    private _valuesGap: number = 1;
    private _suppressAttributeChange: boolean = false;

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (this._suppressAttributeChange) return;
        if (name === "value-min" || name === "value-max") {
            this._updateInputValues();
            this._updateRangeInputsValues();
            this._updateSliderPosition(parseInt(this.getAttribute('value-min')), parseInt(this.getAttribute('max')), true);
            this._updateSliderPosition(parseInt(this.getAttribute('value-max')), parseInt(this.getAttribute('max')), false);
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
        this._numberInputs = Array.from(this._getDomElements(".inputs-wrapper input"));
        this._rangeInputs = Array.from(this._getDomElements(".range-input input"));
        this.ready();
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
                    this.setAttribute('value-min', minVal.toString());
                    this.setAttribute('value-max', maxVal.toString());
                }
            });

            this._rangeInputs[i].addEventListener("change", e => {
                let minVal = parseInt(this._rangeInputs[0].value);
                let maxVal = parseInt(this._rangeInputs[1].value);

                this.setAttribute('value-min', minVal.toString());
                this.setAttribute('value-max', maxVal.toString());
            });
        }

        this._updateInputValues();
        this._updateRangeInputsMinMax();
        this._updateRangeInputsValues();
        this._updateSliderPosition(parseInt(this.getAttribute('value-min')), parseInt(this.getAttribute('max')), true);
        this._updateSliderPosition(parseInt(this.getAttribute('value-max')), parseInt(this.getAttribute('max')), false);
    }

    private _updateInputValues() {
        this._numberInputs[0].value = this.getAttribute('value-min');
        this._numberInputs[1].value = this.getAttribute('value-max');
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

    private _handleInputChange(e: Event) {
        const inputIndex = this._numberInputs.indexOf(e.target as HTMLInputElement);
        if (inputIndex === -1) return;

        let minp = parseInt(this._numberInputs[0].value);
        let maxp = parseInt(this._numberInputs[1].value);
        let diff = maxp - minp;

        if (minp < parseInt(this.getAttribute('min'))) {
            console.log(`Minimum value cannot be less than ${this.getAttribute('min')}`);
            this._numberInputs[0].value = this.getAttribute('min');
            minp = parseInt(this.getAttribute('min'));
        }

        if (maxp > parseInt(this.getAttribute('max'))) {
            console.log(`Maximum value cannot be greater than ${this.getAttribute('max')}`)
            this._numberInputs[1].value = this.getAttribute('max');
            maxp = parseInt(this.getAttribute('max'));
        }

        if (minp > maxp - diff) {
            this._numberInputs[0].value = (maxp - diff).toString();
            minp = maxp - diff;

            if (minp < parseInt(this.getAttribute('min'))) {
                this._numberInputs[0].value = this.getAttribute('min');
                minp = parseInt(this.getAttribute('min'));
            }
        }

        if (diff >= this._valuesGap && maxp <= parseInt(this.getAttribute('max'))) {
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
        this.setAttribute('value-min', this._rangeInputs[0].value);
        this.setAttribute('value-max', this._rangeInputs[1].value);
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
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);
