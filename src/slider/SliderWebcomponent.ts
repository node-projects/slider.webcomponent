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
        value: Number,
        max: Number
    }

    private _min: Number = 0;
    private _value: Number = 0;
    private _max: Number = 0;

    public get min() {
        return this._min;
    }
    public set min(value) {
        this._min = value;
        this._minChanged();
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }

    ready() {
        this._parseAttributesToProperties();

        const rangevalue: HTMLDivElement = this._getDomElement("slider");
        const rangeInputvalue: HTMLInputElement[] = this._getDomElements(".range-input input");

        let valuesGap = 500;
       
        const inputValues: HTMLInputElement[] = Array.from(this._getDomElements(".inputs-wrapper input"));

        for (let i = 0; i < inputValues.length; i++) {

            inputValues[i].addEventListener("input", e => {

                // Parse min and max values of the range input 
                let minp = parseInt(inputValues[0].value);
                let maxp = parseInt(inputValues[1].value);
                let diff = maxp - minp

                if (minp < 0) {
                    alert("minimum price cannot be less than 0");
                    inputValues[0].value = '0';
                    minp = 0;
                }

                // Validate the input values 
                if (maxp > 10000) {
                    alert("maximum price cannot be greater than 10000");
                    inputValues[1].value = '10000';
                    maxp = 10000;
                }

                if (minp > maxp - valuesGap) {
                    inputValues[0].value = (maxp - valuesGap).toString();
                    minp = maxp - valuesGap;

                    if (minp < 0) {
                        inputValues[0].value = '0';
                        minp = 0;
                    }
                }

                // Check if the values gap is met  
                // and max value is within the range 
                if (diff >= valuesGap && maxp <= parseInt(rangeInputvalue[1].max)) {
                    if ((e.target as HTMLInputElement).className === "min-input") {
                        rangeInputvalue[0].value = minp.toString();
                        let value1 = parseInt(rangeInputvalue[0].max);
                        rangevalue.style.left = `${(minp / value1) * 100}%`;
                    }
                    else {
                        rangeInputvalue[1].value = maxp.toString();
                        let value2 = parseInt(rangeInputvalue[1].max);
                        rangevalue.style.right =
                            `${100 - (maxp / value2) * 100}%`;
                    }
                }
            });

            // Add event listeners to range input elements 
            for (let i = 0; i < rangeInputvalue.length; i++) {
                rangeInputvalue[i].addEventListener("input", e => {
                    let minVal = parseInt(rangeInputvalue[0].value);
                    let maxVal = parseInt(rangeInputvalue[1].value);

                    let diff = maxVal - minVal

                    // Check if the values gap is exceeded 
                    if (diff < valuesGap) {

                        // Check if the input is the min range input 
                        if ((e.target as HTMLInputElement).className === "min-range") {
                            rangeInputvalue[0].value = (maxVal - valuesGap).toString();
                        }
                        else {
                            rangeInputvalue[1].value = (minVal + valuesGap).toString();
                        }
                    }
                    else {

                        // Update input values and range progress 
                        inputValues[0].value = minVal.toString();
                        inputValues[1].value = maxVal.toString();
                        rangevalue.style.left = `${(minVal / parseInt(rangeInputvalue[0].max)) * 100}%`;
                        rangevalue.style.right = `${100 - (maxVal / parseInt(rangeInputvalue[1].max)) * 100}%`;
                    }
                });
            }
        }
    }

    private _minChanged() {

    }
}

customElements.define(SliderWebcomponent.is, SliderWebcomponent);