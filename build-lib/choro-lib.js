var choroLib = (function (exports) {
	'use strict';

	const viridis = [
	  "#440154",
	  "#482878",
	  "#3e4a89",
	  "#31688e",
	  "#26838f",
	  "#1f9e89",
	  "#6cce5a",
	  "#b5de2c",
	  "#fde725"
	];
	const plasma = [
	  "#0d0887",
	  "#46039f",
	  "#7201a8",
	  "#9c179e",
	  "#bd3786",
	  "#d8576b",
	  "#ed7953",
	  "#fb9f3a",
	  "#fdca26"
	];
	const inferno = [
	  "#000004",
	  "#1b0c41",
	  "#4a0c6b",
	  "#781c6d",
	  "#a52c60",
	  "#cf4446",
	  "#ed6925",
	  "#fb9b06",
	  "#f7d13d"
	];
	const magma = [
	  "#000004",
	  "#180f3d",
	  "#440f76",
	  "#721f81",
	  "#9e2f7f",
	  "#cd4071",
	  "#f1605d",
	  "#fd9668",
	  "#fcfdbf"
	];
	const COLOR_SCHEMES = {
	  viridis,
	  plasma,
	  inferno,
	  magma
	};
	const COLOR_SCHEME_NAMES = ["viridis", "plasma", "inferno", "magma"];

	/**
	 * The abstract `Color` class provides a blueprint for color manipulation and conversion.
	 * It includes methods for converting between different color models ({@link HSL}, {@link HSV}, {@link RGB}),
	 * as well as various color transformations such as inversion, rotation, saturation, and blending.
	 *
	 * @abstract
	 */
	/**
	 * Abstract class representing a color.
	 */
	class Color {
	    /**
	     * Parses a color from a string or another Color instance.
	     * @param input - The input color as a string or Color instance.
	     * @returns The parsed Color instance.
	     */
	    static parse;
	    /**
	     * The HSL color model.
	     */
	    static HSL;
	    /**
	     * The HSV color model.
	     */
	    static HSV;
	    /**
	     * The RGB color model.
	     */
	    static RGB;
	    /**
	     * Converts the color to a hexadecimal string.
	     * @returns The hexadecimal representation of the color.
	     */
	    asHex() {
	        return this.asRGB().asHex();
	    }
	    /**
	     * Inverts the luminosity of the color.
	     * @returns A new HSL color with inverted luminosity.
	     */
	    invertLuminosity() {
	        return this.asHSL().invertLuminosity();
	    }
	    /**
	     * Rotates the hue of the color by a given offset.
	     * @param offset - The amount to rotate the hue.
	     * @returns A new HSL color with the hue rotated.
	     */
	    rotateHue(offset) {
	        return this.asHSL().rotateHue(offset);
	    }
	    /**
	     * Saturates the color by a given ratio.
	     * @param ratio - The ratio to saturate the color.
	     * @returns A new HSL color with increased saturation.
	     */
	    saturate(ratio) {
	        return this.asHSL().saturate(ratio);
	    }
	    /**
	     * Applies gamma correction to the color.
	     * @param value - The gamma correction value.
	     * @returns A new RGB color with gamma correction applied.
	     */
	    gamma(value) {
	        return this.asRGB().gamma(value);
	    }
	    /**
	     * Inverts the color.
	     * @returns A new RGB color with inverted values.
	     */
	    invert() {
	        return this.asRGB().invert();
	    }
	    /**
	     * Adjusts the contrast of the color.
	     * @param value - The contrast adjustment value.
	     * @returns A new RGB color with adjusted contrast.
	     */
	    contrast(value) {
	        return this.asRGB().contrast(value);
	    }
	    /**
	     * Adjusts the brightness of the color.
	     * @param value - The brightness adjustment value.
	     * @returns A new RGB color with adjusted brightness.
	     */
	    brightness(value) {
	        return this.asRGB().brightness(value);
	    }
	    /**
	     * Lightens the color by a given value.
	     * @param value - The amount to lighten the color.
	     * @returns A new RGB color that is lightened.
	     */
	    lighten(value) {
	        return this.asRGB().lighten(value);
	    }
	    /**
	     * Darkens the color by a given value.
	     * @param value - The amount to darken the color.
	     * @returns A new RGB color that is darkened.
	     */
	    darken(value) {
	        return this.asRGB().darken(value);
	    }
	    /**
	     * Tints the color by blending it with another color.
	     * @param value - The blend ratio.
	     * @param tintColor - The color to blend with.
	     * @returns A new RGB color that is tinted.
	     */
	    tint(value, tintColor) {
	        return this.asRGB().tint(value, tintColor);
	    }
	    /**
	     * Blends the color with another color.
	     * @param value - The blend ratio.
	     * @param blendColor - The color to blend with.
	     * @returns A new RGB color that is blended.
	     */
	    blend(value, blendColor) {
	        return this.asRGB().blend(value, blendColor);
	    }
	    /**
	     * Sets the hue of the color.
	     * @param value - The new hue value.
	     * @returns A new HSV color with the hue set.
	     */
	    setHue(value) {
	        return this.asHSV().setHue(value);
	    }
	}

	function clamp(value, min, max) {
	    if (value == null || isNaN(value))
	        return min;
	    if (value < min)
	        return min;
	    if (value > max)
	        return max;
	    return value;
	}
	function mod(value, max) {
	    value = value % max;
	    if (value < 0)
	        value += max;
	    if (value == 0)
	        return 0;
	    return value;
	}
	function formatFloat(num, precision) {
	    return num.toFixed(precision).replace(/0+$/, '').replace(/\.$/, '');
	}

	let colorDictionary = new Map();
	function randomColor(options) {
	    if (colorDictionary.size === 0)
	        colorDictionary = initColorDictionary();
	    options ??= {};
	    let seed = inputToSeed(options.seed);
	    const H = pickHue(options);
	    const S = pickSaturation(H, options);
	    const V = pickBrightness(H, S, options);
	    return new HSV(H, S, V, options.opacity ?? 1);
	    function pickHue(options) {
	        return mod(randomWithin(getHueRange(options.hue)), 360);
	        function getHueRange(hue) {
	            if (typeof hue === 'number') {
	                hue = mod(hue, 360);
	                return [hue, hue];
	            }
	            if (typeof hue === 'string') {
	                const color = colorDictionary.get(hue);
	                if (color?.hueRange)
	                    return color.hueRange;
	            }
	            return [0, 360];
	        }
	    }
	    function pickSaturation(hue, options) {
	        if (options.hue === 'monochrome')
	            return 0;
	        if (options.luminosity === 'random')
	            return randomWithin([0, 100]);
	        let [sMin, sMax] = getColorInfo(hue).saturationRange;
	        if (options.saturation === 'strong')
	            return sMax;
	        switch (options.luminosity) {
	            case 'bright':
	                sMin = 55;
	                break;
	            case 'dark':
	                sMin = sMax - 10;
	                break;
	            case 'light':
	                sMax = 55;
	                break;
	        }
	        return randomWithin([sMin, sMax]);
	    }
	    function pickBrightness(h, s, options) {
	        let bMin = getMinimumBrightness(h, s), bMax = 100;
	        if (typeof options.luminosity === 'number') {
	            bMin = options.luminosity;
	            bMax = options.luminosity;
	        }
	        else {
	            switch (options.luminosity) {
	                case 'dark':
	                    bMax = Math.min(100, bMin + 20);
	                    break;
	                case 'light':
	                    bMin = (bMax + bMin) / 2;
	                    break;
	                case 'random':
	                    bMin = 0;
	                    bMax = 100;
	                    break;
	            }
	        }
	        return randomWithin([bMin, bMax]);
	        function getMinimumBrightness(h, s) {
	            const { lowerBounds } = getColorInfo(h);
	            for (let i = 0; i < lowerBounds.length - 1; i++) {
	                const [s1, v1] = lowerBounds[i];
	                const [s2, v2] = lowerBounds[i + 1];
	                if (s >= s1 && s <= s2) {
	                    const m = (v2 - v1) / (s2 - s1), b = v1 - m * s1;
	                    return m * s + b;
	                }
	            }
	            return 0;
	        }
	    }
	    function randomWithin(range) {
	        //Seeded random algorithm from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
	        seed = (seed * 9301 + 49297) % 233280;
	        return Math.floor(range[0] + (seed / 233280.0) * (range[1] - range[0]));
	    }
	}
	function inputToSeed(input) {
	    if (input == null)
	        return 0;
	    if (typeof input === 'number')
	        return input;
	    let i = 0;
	    for (let p = 0; p < input.length; p++)
	        i = (i * 0x101 + input.charCodeAt(p)) % 0x100000000;
	    return i;
	}
	function initColorDictionary() {
	    const dict = new Map();
	    const defineColor = (name, hueRange, lowerBounds) => {
	        const [greyest] = lowerBounds;
	        const colorful = lowerBounds[lowerBounds.length - 1];
	        dict.set(name, {
	            hueRange,
	            lowerBounds,
	            saturationRange: [greyest[0], colorful[0]],
	            brightnessRange: [colorful[1], greyest[1]],
	        });
	    };
	    defineColor('monochrome', null, [
	        [0, 0],
	        [100, 0],
	    ]);
	    defineColor('red', [-26, 18], [
	        [20, 100],
	        [30, 92],
	        [40, 89],
	        [50, 85],
	        [60, 78],
	        [70, 70],
	        [80, 60],
	        [90, 55],
	        [100, 50],
	    ]);
	    defineColor('orange', [18, 46], [
	        [20, 100],
	        [30, 93],
	        [40, 88],
	        [50, 86],
	        [60, 85],
	        [70, 70],
	        [100, 70],
	    ]);
	    defineColor('yellow', [46, 62], [
	        [25, 100],
	        [40, 94],
	        [50, 89],
	        [60, 86],
	        [70, 84],
	        [80, 82],
	        [90, 80],
	        [100, 75],
	    ]);
	    defineColor('green', [62, 178], [
	        [30, 100],
	        [40, 90],
	        [50, 85],
	        [60, 81],
	        [70, 74],
	        [80, 64],
	        [90, 50],
	        [100, 40],
	    ]);
	    defineColor('blue', [178, 257], [
	        [20, 100],
	        [30, 86],
	        [40, 80],
	        [50, 74],
	        [60, 60],
	        [70, 52],
	        [80, 44],
	        [90, 39],
	        [100, 35],
	    ]);
	    defineColor('purple', [257, 282], [
	        [20, 100],
	        [30, 87],
	        [40, 79],
	        [50, 70],
	        [60, 65],
	        [70, 59],
	        [80, 52],
	        [90, 45],
	        [100, 42],
	    ]);
	    defineColor('pink', [282, 334], [
	        [20, 100],
	        [30, 90],
	        [40, 86],
	        [60, 84],
	        [80, 80],
	        [90, 75],
	        [100, 73],
	    ]);
	    return dict;
	}
	function getColorInfo(hue) {
	    hue = mod(hue, 360);
	    if (hue >= 334)
	        hue -= 360;
	    for (const color of colorDictionary.values()) {
	        if (color.hueRange && hue >= color.hueRange[0] && hue <= color.hueRange[1]) {
	            return color;
	        }
	    }
	    throw Error('Color hue value not found');
	}

	/**
	 * Represents an RGB color with optional alpha transparency.
	 *
	 * @extends Color
	 */
	class RGB extends Color {
	    /**
	     * Red component (0-255).
	     */
	    r;
	    /**
	     * Green component (0-255).
	     */
	    g;
	    /**
	     * Blue component (0-255).
	     */
	    b;
	    /**
	     * Alpha component (0-1).
	     */
	    a;
	    /**
	     * Creates an instance of RGB.
	     *
	     * @param r - Red component (0-255).
	     * @param g - Green component (0-255).
	     * @param b - Blue component (0-255).
	     * @param a - Alpha component (0-1), defaults to 1.
	     */
	    constructor(r, g, b, a = 1) {
	        super();
	        this.r = clamp(r, 0, 255);
	        this.g = clamp(g, 0, 255);
	        this.b = clamp(b, 0, 255);
	        this.a = clamp(a, 0, 1);
	    }
	    /**
	     * Creates a clone of the current RGB color.
	     *
	     * @returns A new RGB instance with the same color values.
	     */
	    clone() {
	        return new RGB(this.r, this.g, this.b, this.a);
	    }
	    /**
	     * Returns the RGB color as an array.
	     *
	     * @returns An array containing the red, green, blue, and alpha components.
	     */
	    asArray() {
	        return [this.r, this.g, this.b, this.a];
	    }
	    /**
	     * Rounds the RGB color components to the nearest integer.
	     *
	     * @returns A new RGB instance with rounded color values.
	     */
	    round() {
	        return new RGB(Math.round(this.r), Math.round(this.g), Math.round(this.b), Math.round(this.a * 1000) / 1000);
	    }
	    /**
	     * Returns the RGB color as a string.
	     *
	     * @returns A string representation of the RGB color in either `rgb` or `rgba` format.
	     */
	    asString() {
	        if (this.a === 1) {
	            return `rgb(${this.r.toFixed(0)},${this.g.toFixed(0)},${this.b.toFixed(0)})`;
	        }
	        else {
	            return `rgba(${this.r.toFixed(0)},${this.g.toFixed(0)},${this.b.toFixed(0)},${formatFloat(this.a, 3)})`;
	        }
	    }
	    /**
	     * Returns the RGB color as a hexadecimal string.
	     *
	     * @returns A string representation of the RGB color in hexadecimal format.
	     */
	    asHex() {
	        const r = Math.round(this.r).toString(16).padStart(2, '0');
	        const g = Math.round(this.g).toString(16).padStart(2, '0');
	        const b = Math.round(this.b).toString(16).padStart(2, '0');
	        if (this.a === 1) {
	            return `#${r}${g}${b}`.toUpperCase();
	        }
	        else {
	            const a = Math.round(this.a * 255)
	                .toString(16)
	                .padStart(2, '0');
	            return `#${r}${g}${b}${a}`.toUpperCase();
	        }
	    }
	    /**
	     * Converts the RGB color to an HSL color.
	     *
	     * @returns An HSL instance representing the same color.
	     */
	    asHSL() {
	        const r = this.r / 255;
	        const g = this.g / 255;
	        const b = this.b / 255;
	        const min = Math.min(r, g, b);
	        const max = Math.max(r, g, b);
	        const delta = max - min;
	        let h = 0;
	        let s = 0;
	        if (max === min)
	            h = 0;
	        else if (r === max)
	            h = (g - b) / delta;
	        else if (g === max)
	            h = 2 + (b - r) / delta;
	        else if (b === max)
	            h = 4 + (r - g) / delta;
	        h = Math.min(h * 60, 360);
	        if (h < 0)
	            h += 360;
	        const l = (min + max) / 2;
	        if (max === min)
	            s = 0;
	        else if (l <= 0.5)
	            s = delta / (max + min);
	        else
	            s = delta / (2 - max - min);
	        return new HSL(h, s * 100, l * 100, this.a);
	    }
	    /**
	     * Converts the RGB color to an HSV color.
	     *
	     * @returns An HSV instance representing the same color.
	     */
	    asHSV() {
	        const r = this.r / 255;
	        const g = this.g / 255;
	        const b = this.b / 255;
	        const v = Math.max(r, g, b);
	        const diff = v - Math.min(r, g, b);
	        let h = 0;
	        let s = 0;
	        if (diff !== 0) {
	            function diffc(c) {
	                return (v - c) / 6 / diff + 1 / 2;
	            }
	            s = diff / v;
	            const rdif = diffc(r);
	            const gdif = diffc(g);
	            const bdif = diffc(b);
	            if (r === v)
	                h = bdif - gdif;
	            else if (g === v)
	                h = 1 / 3 + rdif - bdif;
	            else if (b === v)
	                h = 2 / 3 + gdif - rdif;
	            if (h < 0)
	                h += 1;
	            else if (h > 1)
	                h -= 1;
	        }
	        return new HSV(h * 360, s * 100, v * 100, this.a);
	    }
	    /**
	     * Returns the RGB color.
	     *
	     * @returns The current RGB instance.
	     */
	    asRGB() {
	        return this.clone();
	    }
	    /**
	     * Returns the RGB color.
	     *
	     * @returns The current RGB instance.
	     */
	    toRGB() {
	        return this;
	    }
	    /**
	     * Parses a string or Color instance into an RGB color.
	     *
	     * @param input - The input string or Color instance to parse.
	     * @returns A new RGB instance representing the parsed color.
	     * @throws Will throw an error if the input string is not a valid RGB color string.
	     */
	    static parse(input) {
	        if (input instanceof Color)
	            return input.asRGB();
	        input = input.toLowerCase().replaceAll(/[^0-9a-z.#,()]/g, '');
	        let match;
	        match = input.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/);
	        if (match) {
	            const r = parseInt(match[1], 16);
	            const g = parseInt(match[2], 16);
	            const b = parseInt(match[3], 16);
	            const a = match[4] ? parseInt(match[4], 16) / 255 : 1;
	            return new RGB(r, g, b, a);
	        }
	        match = input.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/);
	        if (match) {
	            const r = parseInt(match[1], 16) * 17;
	            const g = parseInt(match[2], 16) * 17;
	            const b = parseInt(match[3], 16) * 17;
	            const a = match[4] ? parseInt(match[4], 16) / 15 : 1;
	            return new RGB(r, g, b, a);
	        }
	        input = input.trim().toLowerCase().replaceAll(' ', '');
	        match = input.match(/^rgb\((\d+),(\d+),(\d+)\)$/);
	        if (match) {
	            const r = parseInt(match[1]);
	            const g = parseInt(match[2]);
	            const b = parseInt(match[3]);
	            return new RGB(r, g, b);
	        }
	        match = input.match(/^rgba\((\d+),(\d+),(\d+),([.\d]+)\)$/);
	        if (match) {
	            const r = parseInt(match[1]);
	            const g = parseInt(match[2]);
	            const b = parseInt(match[3]);
	            const a = parseFloat(match[4]);
	            return new RGB(r, g, b, a);
	        }
	        throw new Error(`Invalid RGB color string: "${input}"`);
	    }
	    /**
	     * Adjusts the gamma of the RGB color.
	     *
	     * @param value - The gamma value to apply.
	     * @returns A new RGB instance with the adjusted gamma.
	     */
	    gamma(value) {
	        if (value < 1e-3)
	            value = 1e-3;
	        if (value > 1e3)
	            value = 1e3;
	        return new RGB(Math.pow(this.r / 255, value) * 255, Math.pow(this.g / 255, value) * 255, Math.pow(this.b / 255, value) * 255, this.a);
	    }
	    /**
	     * Inverts the RGB color.
	     *
	     * @returns A new RGB instance with the inverted color values.
	     */
	    invert() {
	        return new RGB(255 - this.r, 255 - this.g, 255 - this.b, this.a);
	    }
	    /**
	     * Adjusts the contrast of the RGB color.
	     *
	     * @param value - The contrast value to apply.
	     * @returns A new RGB instance with the adjusted contrast.
	     */
	    contrast(value) {
	        if (value < 0)
	            value = 0;
	        if (value > 1e6)
	            value = 1e6;
	        return new RGB(clamp((this.r - 127.5) * value + 127.5, 0, 255), clamp((this.g - 127.5) * value + 127.5, 0, 255), clamp((this.b - 127.5) * value + 127.5, 0, 255), this.a);
	    }
	    /**
	     * Adjusts the brightness of the RGB color.
	     *
	     * @param value - The brightness value to apply.
	     * @returns A new RGB instance with the adjusted brightness.
	     */
	    brightness(value) {
	        if (value < -1)
	            value = -1;
	        if (value > 1)
	            value = 1;
	        const a = 1 - Math.abs(value);
	        const b = value < 0 ? 0 : 255 * value;
	        return new RGB(this.r * a + b, this.g * a + b, this.b * a + b, this.a);
	    }
	    /**
	     * Tints the RGB color with another color.
	     *
	     * @param value - The tint value to apply.
	     * @param tintColor - The color to use for tinting.
	     * @returns A new RGB instance with the applied tint.
	     */
	    tint(value, tintColor) {
	        if (value < 0)
	            value = 0;
	        if (value > 1)
	            value = 1;
	        const rgbNew = this.setHue(tintColor.asHSV().h).asRGB();
	        return new RGB(this.r * (1 - value) + value * rgbNew.r, this.g * (1 - value) + value * rgbNew.g, this.b * (1 - value) + value * rgbNew.b, this.a);
	    }
	    /**
	     * Blends the RGB color with another color.
	     *
	     * @param value - The blend value to apply.
	     * @param blendColor - The color to blend with.
	     * @returns A new RGB instance with the blended color.
	     */
	    blend(value, blendColor) {
	        value = clamp(value ?? 0, 0, 1);
	        const rgbNew = blendColor.asRGB();
	        return new RGB(this.r * (1 - value) + value * rgbNew.r, this.g * (1 - value) + value * rgbNew.g, this.b * (1 - value) + value * rgbNew.b, this.a);
	    }
	    /**
	     * Lightens the RGB color.
	     *
	     * @param ratio - The ratio to lighten the color by.
	     * @returns A new RGB instance with the lightened color.
	     */
	    lighten(ratio) {
	        return new RGB(clamp(255 - (255 - this.r) * (1 - ratio), 0, 255), clamp(255 - (255 - this.g) * (1 - ratio), 0, 255), clamp(255 - (255 - this.b) * (1 - ratio), 0, 255), this.a);
	    }
	    /**
	     * Darkens the RGB color.
	     *
	     * @param ratio - The ratio to darken the color by.
	     * @returns A new RGB instance with the darkened color.
	     */
	    darken(ratio) {
	        return new RGB(clamp(this.r * (1 - ratio), 0, 255), clamp(this.g * (1 - ratio), 0, 255), clamp(this.b * (1 - ratio), 0, 255), this.a);
	    }
	    /**
	     * Fades the RGB color by reducing its alpha value.
	     *
	     * @param value - The fade value to apply.
	     * @returns A new RGB instance with the faded color.
	     */
	    fade(value) {
	        return new RGB(this.r, this.g, this.b, this.a * (1 - value));
	    }
	}

	/**
	 * Represents a color in the HSV (Hue, Saturation, Value) color space.
	 * Extends the base `Color` class.
	 */
	class HSV extends Color {
	    /**
	     * The hue component of the color, in the range [0, 360].
	     */
	    h;
	    /**
	     * The saturation component of the color, in the range [0, 100].
	     */
	    s;
	    /**
	     * The value (brightness) component of the color, in the range [0, 100].
	     */
	    v;
	    /**
	     * The alpha (opacity) component of the color, in the range [0, 1].
	     */
	    a;
	    /**
	     * Constructs a new HSV color.
	     * @param h - The hue component, in the range [0, 360].
	     * @param s - The saturation component, in the range [0, 100].
	     * @param v - The value (brightness) component, in the range [0, 100].
	     * @param a - The alpha (opacity) component, in the range [0, 1]. Defaults to 1.
	     */
	    constructor(h, s, v, a = 1) {
	        super();
	        this.h = mod(h, 360);
	        this.s = clamp(s, 0, 100);
	        this.v = clamp(v, 0, 100);
	        this.a = clamp(a, 0, 1);
	    }
	    /**
	     * Returns the HSV color as an array of numbers.
	     * @returns An array containing the hue, saturation, value, and alpha components.
	     */
	    asArray() {
	        return [this.h, this.s, this.v, this.a];
	    }
	    /**
	     * Returns a new HSV color with the components rounded to the nearest integer.
	     * @returns A new HSV color with rounded components.
	     */
	    round() {
	        return new HSV(Math.round(this.h), Math.round(this.s), Math.round(this.v), Math.round(this.a * 1000) / 1000);
	    }
	    /**
	     * Returns the color as a string representation.
	     * @returns A string representation of the color.
	     */
	    asString() {
	        return this.asHSL().asString();
	    }
	    /**
	     * Creates a new HSV color that is a copy of the current color.
	     * @returns A new HSV color that is a clone of the current color.
	     */
	    clone() {
	        return new HSV(this.h, this.s, this.v, this.a);
	    }
	    /**
	     * Converts the HSV color to an HSL color.
	     * @returns An HSL representation of the color.
	     */
	    asHSL() {
	        const s = this.s / 100;
	        const v = this.v / 100;
	        const k = (2 - s) * v;
	        const q = k < 1 ? k : 2 - k;
	        return new HSL(this.h, q == 0 ? 0 : (100 * s * v) / q, (100 * k) / 2, this.a);
	    }
	    /**
	     * Returns the current HSV color.
	     * @returns The current HSV color.
	     */
	    asHSV() {
	        return this.clone();
	    }
	    /**
	     * Returns the current HSV color.
	     * @returns The current HSV color.
	     */
	    toHSV() {
	        return this;
	    }
	    /**
	     * Converts the HSV color to an RGB color.
	     * @returns An RGB representation of the color.
	     */
	    asRGB() {
	        const h = this.h / 360; // Normalize h to range [0, 1]
	        const s = this.s / 100; // Normalize s to range [0, 1]
	        const v = this.v / 100; // Normalize v to range [0, 1]
	        let r = 0, g = 0, b = 0;
	        if (s === 0) {
	            // Achromatic (grey)
	            r = g = b = v;
	        }
	        else {
	            const i = Math.floor(h * 6); // Determine the sector of the color wheel
	            const f = h * 6 - i; // Fractional part of h * 6
	            const p = v * (1 - s);
	            const q = v * (1 - s * f);
	            const t = v * (1 - s * (1 - f));
	            switch (i % 6) {
	                case 0:
	                    r = v;
	                    g = t;
	                    b = p;
	                    break;
	                case 1:
	                    r = q;
	                    g = v;
	                    b = p;
	                    break;
	                case 2:
	                    r = p;
	                    g = v;
	                    b = t;
	                    break;
	                case 3:
	                    r = p;
	                    g = q;
	                    b = v;
	                    break;
	                case 4:
	                    r = t;
	                    g = p;
	                    b = v;
	                    break;
	                case 5:
	                    r = v;
	                    g = p;
	                    b = q;
	                    break;
	            }
	        }
	        // Convert to RGB in the 0-255 range and return
	        return new RGB(r * 255, g * 255, b * 255, this.a);
	    }
	    /**
	     * Fades the color by a given value.
	     * @param value - The amount to fade the color by, in the range [0, 1].
	     * @returns A new HSV color with the alpha component faded by the given value.
	     */
	    fade(value) {
	        return new HSV(this.h, this.s, this.v, this.a * (1 - value));
	    }
	    /**
	     * Sets the hue component of the color.
	     * @param value - The new hue value, in the range [0, 360].
	     * @returns A new HSV color with the updated hue component.
	     */
	    setHue(value) {
	        return new HSV(value, this.s, this.v, this.a);
	    }
	    static randomColor(options) {
	        return randomColor(options);
	    }
	}

	/**
	 * Represents a color in the HSL (Hue, Saturation, Lightness) color space.
	 * Extends the base `Color` class.
	 */
	class HSL extends Color {
	    /**
	     * The hue component of the color, in the range [0, 360].
	     */
	    h;
	    /**
	     * The saturation component of the color, in the range [0, 100].
	     */
	    s;
	    /**
	     * The lightness component of the color, in the range [0, 100].
	     */
	    l;
	    /**
	     * The alpha (opacity) component of the color, in the range [0, 1].
	     */
	    a;
	    /**
	     * Creates a new HSL color.
	     * @param h - The hue component, in the range [0, 360].
	     * @param s - The saturation component, in the range [0, 100].
	     * @param l - The lightness component, in the range [0, 100].
	     * @param a - The alpha (opacity) component, in the range [0, 1]. Defaults to 1.
	     */
	    constructor(h, s, l, a = 1) {
	        super();
	        this.h = mod(h, 360);
	        this.s = clamp(s, 0, 100);
	        this.l = clamp(l, 0, 100);
	        this.a = clamp(a, 0, 1);
	    }
	    /**
	     * Returns the HSL color as an array of numbers.
	     * @returns An array containing the hue, saturation, lightness, and alpha components.
	     */
	    asArray() {
	        return [this.h, this.s, this.l, this.a];
	    }
	    /**
	     * Returns a new HSL color with rounded components.
	     * @returns A new HSL color with rounded hue, saturation, lightness, and alpha components.
	     */
	    round() {
	        return new HSL(Math.round(this.h), Math.round(this.s), Math.round(this.l), Math.round(this.a * 1000) / 1000);
	    }
	    /**
	     * Creates a copy of the current HSL color.
	     * @returns A new HSL color with the same components as the current color.
	     */
	    clone() {
	        return new HSL(this.h, this.s, this.l, this.a);
	    }
	    /**
	     * Returns the HSL color as a CSS-compatible string.
	     * @returns A string representing the HSL color in CSS format.
	     */
	    asString() {
	        if (this.a === 1) {
	            return `hsl(${this.h.toFixed(0)},${this.s.toFixed(0)}%,${this.l.toFixed(0)}%)`;
	        }
	        else {
	            return `hsla(${this.h.toFixed(0)},${this.s.toFixed(0)}%,${this.l.toFixed(0)}%,${formatFloat(this.a, 3)})`;
	        }
	    }
	    /**
	     * Returns the current HSL color.
	     * @returns The current HSL color.
	     */
	    asHSL() {
	        return this.clone();
	    }
	    /**
	     * Returns the current HSL color.
	     * @returns The current HSL color.
	     */
	    toHSL() {
	        return this;
	    }
	    /**
	     * Converts the HSL color to an HSV color.
	     * @returns A new HSV color representing the same color.
	     */
	    asHSV() {
	        const s = this.s / 100, l = this.l / 100;
	        const v = l + s * Math.min(l, 1 - l);
	        const sv = v === 0 ? 0 : 2 * (1 - l / v);
	        return new HSV(this.h, sv * 100, v * 100, this.a);
	    }
	    /**
	     * Converts the HSL color to an RGB color.
	     * @returns A new RGB color representing the same color.
	     */
	    asRGB() {
	        const h = this.h / 360;
	        const s = this.s / 100;
	        const l = this.l / 100;
	        // Achromatic (grey)
	        if (s === 0)
	            return new RGB(l * 255, l * 255, l * 255, this.a);
	        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        const p = 2 * l - q;
	        const hueToRgb = (t) => {
	            if (t < 0)
	                t += 1;
	            if (t > 1)
	                t -= 1;
	            if (t < 1 / 6)
	                return p + (q - p) * 6 * t;
	            if (t < 1 / 2)
	                return q;
	            if (t < 2 / 3)
	                return p + (q - p) * (2 / 3 - t) * 6;
	            return p;
	        };
	        // Convert to RGB in the 0-255 range and return
	        return new RGB(255 * hueToRgb(h + 1 / 3), 255 * hueToRgb(h), 255 * hueToRgb(h - 1 / 3), this.a);
	    }
	    /**
	     * Parses a string or Color object into an HSL color.
	     * @param input - The input string or Color object to parse.
	     * @returns A new HSL color parsed from the input.
	     * @throws Will throw an error if the input string is not a valid HSL color string.
	     */
	    static parse(input) {
	        if (input instanceof Color)
	            return input.asHSL();
	        input = input.replace(/\s+/g, '').toLowerCase();
	        let match = input.match(/^hsl\((?<h>[-+0-9.]+)(?:deg)?,(?<s>[-+0-9.]+)%,(?<l>[-+0-9.]+)%\)$/);
	        if (match) {
	            return new HSL(parseFloat(match.groups.h), parseFloat(match.groups.s), parseFloat(match.groups.l));
	        }
	        match = input.match(/^hsla\((?<h>[-+0-9.]+)(?:deg)?,(?<s>[-+0-9.]+)%,(?<l>[-+0-9.]+)%,(?<a>[-+0-9.]+)\)$/);
	        if (match) {
	            return new HSL(parseFloat(match.groups.h), parseFloat(match.groups.s), parseFloat(match.groups.l), parseFloat(match.groups.a));
	        }
	        throw new Error(`Invalid HSL color string: "${input}"`);
	    }
	    /**
	     * Inverts the lightness component of the HSL color.
	     * @returns A new HSL color with the lightness component inverted.
	     */
	    invertLuminosity() {
	        return new HSL(this.h, this.s, 100 - this.l, this.a);
	    }
	    /**
	     * Rotates the hue component of the HSL color by a given offset.
	     * @param offset - The amount to rotate the hue by, in degrees.
	     * @returns A new HSL color with the hue rotated by the given offset.
	     */
	    rotateHue(offset) {
	        return new HSL(mod(this.h + offset, 360), this.s, this.l, this.a);
	    }
	    /**
	     * Increases the saturation of the HSL color by a given ratio.
	     * @param ratio - The ratio by which to increase the saturation.
	     * @returns A new HSL color with increased saturation.
	     */
	    saturate(ratio) {
	        return new HSL(this.h, clamp(this.s * (1 + ratio), 0, 100), this.l, this.a);
	    }
	    /**
	     * Decreases the alpha (opacity) of the HSL color by a given value.
	     * @param value - The value by which to decrease the alpha.
	     * @returns A new HSL color with decreased alpha.
	     */
	    fade(value) {
	        return new HSL(this.h, this.s, this.l, this.a * (1 - value));
	    }
	}

	Color.parse = function (input) {
	    if (input instanceof Color)
	        return input;
	    input = input.trim().toLowerCase();
	    if (input.startsWith('#'))
	        return RGB.parse(input);
	    const prefix = input.replace(/\d.*/, '').trim().toLowerCase();
	    switch (prefix) {
	        case 'rgb(':
	        case 'rgba(':
	            return RGB.parse(input);
	        case 'hsl(':
	        case 'hsla(':
	            return HSL.parse(input);
	        default:
	            throw Error('Unknown color format: ' + input);
	    }
	};
	Color.HSL = HSL;
	Color.HSV = HSV;
	Color.RGB = RGB;

	const maxzoom = 14;
	function getShortbreadTemplate() {
	    return {
	        version: 8,
	        name: 'versatiles',
	        metadata: {
	            license: 'https://creativecommons.org/publicdomain/zero/1.0/',
	        },
	        glyphs: 'https://tiles.versatiles.org/assets/glyphs/{fontstack}/{range}.pbf',
	        sprite: [{ id: 'basics', url: 'https://tiles.versatiles.org/assets/sprites/basics/sprites' }],
	        sources: {
	            'versatiles-shortbread': {
	                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	                tiles: ['https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}'],
	                type: 'vector',
	                scheme: 'xyz',
	                bounds: [-180, -85.0511287798066, 180, 85.0511287798066],
	                minzoom: 0,
	                maxzoom,
	            },
	        },
	        layers: [],
	    };
	}

	function getShortbreadLayers(option) {
	    const { language } = option;
	    let nameField = ['get', 'name'];
	    if (language) {
	        nameField = ['case', ['to-boolean', ['get', 'name_' + language]], ['get', 'name_' + language], ['get', 'name']];
	    }
	    return [
	        // background
	        { id: 'background', type: 'background' },
	        // ocean
	        { id: 'water-ocean', type: 'fill', 'source-layer': 'ocean' },
	        // land
	        {
	            id: 'land-glacier',
	            type: 'fill',
	            'source-layer': 'water_polygons',
	            filter: ['all', ['==', 'kind', 'glacier']],
	        },
	        ...[
	            { id: 'commercial', kinds: ['commercial', 'retail'] },
	            { id: 'industrial', kinds: ['industrial', 'quarry', 'railway'] },
	            { id: 'residential', kinds: ['garages', 'residential'] },
	            {
	                id: 'agriculture',
	                kinds: [
	                    'brownfield',
	                    'farmland',
	                    'farmyard',
	                    'greenfield',
	                    'greenhouse_horticulture',
	                    'orchard',
	                    'plant_nursery',
	                    'vineyard',
	                ],
	            },
	            { id: 'waste', kinds: ['landfill'] },
	            { id: 'park', kinds: ['park', 'village_green', 'recreation_ground'] },
	            { id: 'garden', kinds: ['allotments', 'garden'] },
	            { id: 'burial', kinds: ['cemetery', 'grave_yard'] },
	            { id: 'leisure', kinds: ['miniature_golf', 'playground', 'golf_course'] },
	            { id: 'rock', kinds: ['bare_rock', 'scree', 'shingle'] },
	            { id: 'forest', kinds: ['forest'] },
	            { id: 'grass', kinds: ['grass', 'grassland', 'meadow', 'wet_meadow'] },
	            { id: 'vegetation', kinds: ['heath', 'scrub'] },
	            { id: 'sand', kinds: ['beach', 'sand'] },
	            { id: 'wetland', kinds: ['bog', 'marsh', 'string_bog', 'swamp'] },
	        ].map(({ id, kinds }) => ({
	            id: 'land-' + id,
	            type: 'fill',
	            'source-layer': 'land',
	            filter: ['all', ['in', 'kind', ...kinds]],
	        })),
	        // water-lines
	        ...['river', 'canal', 'stream', 'ditch'].map((t) => ({
	            id: 'water-' + t,
	            type: 'line',
	            'source-layer': 'water_lines',
	            filter: ['all', ['in', 'kind', t], ['!=', 'tunnel', true], ['!=', 'bridge', true]],
	        })),
	        // water polygons
	        {
	            id: 'water-area',
	            type: 'fill',
	            'source-layer': 'water_polygons',
	            filter: ['==', 'kind', 'water'],
	        },
	        {
	            id: 'water-area-river',
	            type: 'fill',
	            'source-layer': 'water_polygons',
	            filter: ['==', 'kind', 'river'],
	        },
	        {
	            id: 'water-area-small',
	            type: 'fill',
	            'source-layer': 'water_polygons',
	            filter: ['in', 'kind', 'reservoir', 'basin', 'dock'],
	        },
	        // dam
	        { id: 'water-dam-area', type: 'fill', 'source-layer': 'dam_polygons', filter: ['==', 'kind', 'dam'] },
	        { id: 'water-dam', type: 'line', 'source-layer': 'dam_lines', filter: ['==', 'kind', 'dam'] },
	        // pier
	        {
	            id: 'water-pier-area',
	            type: 'fill',
	            'source-layer': 'pier_polygons',
	            filter: ['in', 'kind', 'pier', 'breakwater', 'groyne'],
	        },
	        {
	            id: 'water-pier',
	            type: 'line',
	            'source-layer': 'pier_lines',
	            filter: ['in', 'kind', 'pier', 'breakwater', 'groyne'],
	        },
	        // site
	        ...[
	            'danger_area',
	            'sports_center',
	            'university',
	            'college',
	            'school',
	            'hospital',
	            'prison',
	            'parking',
	            'bicycle_parking',
	            'construction',
	        ].map((t) => ({
	            id: 'site-' + t.replace(/_/g, ''),
	            type: 'fill',
	            'source-layer': 'sites',
	            filter: ['in', 'kind', t],
	        })),
	        // airport
	        {
	            id: 'airport-area',
	            type: 'fill',
	            'source-layer': 'street_polygons',
	            filter: ['in', 'kind', 'runway', 'taxiway'],
	        },
	        {
	            id: 'airport-taxiway:outline',
	            type: 'line',
	            'source-layer': 'streets',
	            filter: ['==', 'kind', 'taxiway'],
	        },
	        {
	            id: 'airport-runway:outline',
	            type: 'line',
	            'source-layer': 'streets',
	            filter: ['==', 'kind', 'runway'],
	        },
	        {
	            id: 'airport-taxiway',
	            type: 'line',
	            'source-layer': 'streets',
	            filter: ['==', 'kind', 'taxiway'],
	        },
	        {
	            id: 'airport-runway',
	            type: 'line',
	            'source-layer': 'streets',
	            filter: ['==', 'kind', 'runway'],
	        },
	        // building
	        {
	            id: 'building:outline',
	            type: 'fill',
	            'source-layer': 'buildings',
	        },
	        {
	            id: 'building',
	            type: 'fill',
	            'source-layer': 'buildings',
	        },
	        // tunnel-, street-, bridges-bridge
	        ...['tunnel', 'street', 'bridge'].flatMap((c) => {
	            let filter;
	            let prefix;
	            let suffixes = [];
	            const results = [];
	            switch (c) {
	                case 'tunnel':
	                    filter = [['==', 'tunnel', true]];
	                    prefix = 'tunnel-';
	                    suffixes = [':outline', ''];
	                    break;
	                case 'street':
	                    filter = [
	                        ['!=', 'bridge', true],
	                        ['!=', 'tunnel', true],
	                    ];
	                    prefix = '';
	                    suffixes = [':outline', ''];
	                    break;
	                case 'bridge':
	                    filter = [['==', 'bridge', true]];
	                    prefix = 'bridge-';
	                    suffixes = [':bridge', ':outline', ''];
	                    break;
	            }
	            // in osm data streets on bridges are often not tagged as such
	            // to be able to have multiple levels of bridges cross over each
	            // other in the right order without using a secondary property.
	            // this results in bridge-polygons being rendered above streets.
	            // therefore bridge polygons are *under* surface streets here.
	            // this workaround is also wrong, but everyone is using it since
	            // it's simpler than removing all these tagging hacks from osm.
	            // bridges, above tunnel, below street
	            if (c === 'street')
	                results.push({
	                    id: 'bridge',
	                    type: 'fill',
	                    'source-layer': 'bridges',
	                });
	            suffixes.forEach((suffix) => {
	                // pedestrian zone — no outline
	                if (suffix === ':outline')
	                    results.push({
	                        id: prefix + 'street-pedestrian-zone',
	                        type: 'fill',
	                        'source-layer': 'street_polygons',
	                        filter: ['all', ...filter, ['==', 'kind', 'pedestrian']],
	                    });
	                // non-car streets
	                ['footway', 'steps', 'path', 'cycleway'].forEach((t) => {
	                    results.push({
	                        id: prefix + 'way-' + t.replace(/_/g, '') + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ...filter, ['in', 'kind', t]],
	                    });
	                });
	                // no links
	                ['track', 'pedestrian', 'service', 'living_street', 'residential', 'unclassified'].forEach((t) => {
	                    results.push({
	                        id: prefix + 'street-' + t.replace(/_/g, '') + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ['==', 'kind', t], ...filter],
	                    });
	                });
	                // no links, bicycle=designated
	                if (suffix === '')
	                    ['track', 'pedestrian', 'service', 'living_street', 'residential', 'unclassified'].forEach((t) => {
	                        results.push({
	                            id: prefix + 'street-' + t.replace(/_/g, '') + '-bicycle',
	                            type: 'line',
	                            'source-layer': 'streets',
	                            filter: ['all', ['==', 'kind', t], ['==', 'bicycle', 'designated'], ...filter],
	                        });
	                    });
	                // links
	                ['tertiary', 'secondary', 'primary', 'trunk', 'motorway'].forEach((t) => {
	                    results.push({
	                        id: prefix + 'street-' + t.replace(/_/g, '') + '-link' + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ...filter, ['in', 'kind', t], ['==', 'link', true]],
	                    });
	                });
	                // main
	                ['tertiary', 'secondary', 'primary', 'trunk', 'motorway'].forEach((t) => {
	                    results.push({
	                        id: prefix + 'street-' + t.replace(/_/g, '') + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ...filter, ['in', 'kind', t], ['!=', 'link', true]],
	                    });
	                });
	            });
	            // separate outline for trains
	            [':outline', ''].forEach((suffix) => {
	                // with service distinction
	                ['rail', 'light_rail', 'subway', 'narrow_gauge', 'tram'].reverse().forEach((t) => {
	                    // main rail
	                    results.push({
	                        id: prefix + 'transport-' + t.replace(/_/g, '') + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ['in', 'kind', t], ['!has', 'service'], ...filter],
	                    });
	                    // service rail (crossover, siding, spur, yard)
	                    results.push({
	                        id: prefix + 'transport-' + t.replace(/_/g, '') + '-service' + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ['in', 'kind', t], ['has', 'service'], ...filter],
	                    });
	                });
	                // other transport
	                ['funicular', 'monorail', 'bus_guideway', 'busway'].reverse().forEach((t) => {
	                    results.push({
	                        id: prefix + 'transport-' + t.replace(/_/g, '') + suffix,
	                        type: 'line',
	                        'source-layer': 'streets',
	                        filter: ['all', ['in', 'kind', t], ...filter],
	                    });
	                });
	                if (c === 'street') {
	                    // aerialway, no bridges, above street evel
	                    ['cable_car', 'gondola', 'goods', 'chair_lift', 'drag_lift', 't-bar', 'j-bar', 'platter', 'rope-tow']
	                        .reverse()
	                        .forEach((t) => {
	                        results.push({
	                            id: 'aerialway-' + t.replace(/[_-]+/g, '') + suffix,
	                            type: 'line',
	                            'source-layer': 'aerialways',
	                            filter: ['all', ...filter, ['in', 'kind', t]],
	                        });
	                    });
	                    // ferry — only on street level
	                    results.push({
	                        id: 'transport-ferry' + suffix,
	                        type: 'line',
	                        'source-layer': 'ferries',
	                    });
	                }
	            });
	            return results;
	        }),
	        // poi, one layer per type
	        ...['amenity', 'leisure', 'tourism', 'shop', 'man_made', 'historic', 'emergency', 'highway', 'office'].map((key) => ({
	            id: 'poi-' + key,
	            type: 'symbol',
	            'source-layer': 'pois',
	            filter: ['to-boolean', ['get', key]],
	        })),
	        // boundary
	        ...[':outline', ''].flatMap((suffix) => [
	            {
	                id: 'boundary-country' + suffix,
	                type: 'line',
	                'source-layer': 'boundaries',
	                filter: [
	                    'all',
	                    ['==', 'admin_level', 2],
	                    ['!=', 'maritime', true],
	                    ['!=', 'disputed', true],
	                    ['!=', 'coastline', true],
	                ],
	            },
	            {
	                id: 'boundary-country-disputed' + suffix,
	                type: 'line',
	                'source-layer': 'boundaries',
	                filter: [
	                    'all',
	                    ['==', 'admin_level', 2],
	                    ['==', 'disputed', true],
	                    ['!=', 'maritime', true],
	                    ['!=', 'coastline', true],
	                ],
	            },
	            {
	                id: 'boundary-country-maritime' + suffix,
	                type: 'line',
	                'source-layer': 'boundaries',
	                filter: [
	                    'all',
	                    ['==', 'admin_level', 2],
	                    ['==', 'maritime', true],
	                    ['!=', 'disputed', true],
	                    ['!=', 'coastline', true],
	                ],
	            },
	            {
	                id: 'boundary-state' + suffix,
	                type: 'line',
	                'source-layer': 'boundaries',
	                filter: [
	                    'all',
	                    ['==', 'admin_level', 4],
	                    ['!=', 'maritime', true],
	                    ['!=', 'disputed', true],
	                    ['!=', 'coastline', true],
	                ],
	            },
	        ]),
	        // label-address
	        {
	            id: 'label-address-housenumber',
	            type: 'symbol',
	            'source-layer': 'addresses',
	            filter: ['has', 'housenumber'],
	            layout: { 'text-field': '{housenumber}' },
	        },
	        // label-motorway
	        {
	            id: 'label-motorway-exit',
	            type: 'symbol',
	            'source-layer': 'street_labels_points', // docs say `streets_labels_points`, but layer is actually called `street_labels_points`
	            filter: ['==', 'kind', 'motorway_junction'],
	            layout: { 'text-field': '{ref}' },
	            // FIXME shield
	        },
	        {
	            id: 'label-motorway-shield',
	            type: 'symbol',
	            'source-layer': 'street_labels',
	            filter: ['==', 'kind', 'motorway'],
	            layout: { 'text-field': '{ref}' },
	            // FIXME shield
	        },
	        // label-street
	        ...['pedestrian', 'living_street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk'].map((t) => ({
	            id: 'label-street-' + t.replace(/_/g, ''),
	            type: 'symbol',
	            'source-layer': 'street_labels',
	            filter: ['==', 'kind', t],
	            layout: { 'text-field': nameField },
	        })),
	        // label-place of small places
	        ...[
	            /*'locality', 'island', 'farm', 'dwelling',*/ 'neighbourhood',
	            'quarter',
	            'suburb',
	            'hamlet',
	            'village',
	            'town',
	        ].map((id) => ({
	            id: 'label-place-' + id.replace(/_/g, ''),
	            type: 'symbol',
	            'source-layer': 'place_labels',
	            filter: ['==', 'kind', id],
	            layout: { 'text-field': nameField },
	        })),
	        // label-boundary
	        {
	            id: 'label-boundary-state',
	            type: 'symbol',
	            'source-layer': 'boundary_labels',
	            filter: ['in', 'admin_level', 4, '4'],
	            layout: { 'text-field': nameField },
	        },
	        // label-place-* of large places
	        ...['city', 'state_capital', 'capital'].map((id) => ({
	            id: 'label-place-' + id.replace(/_/g, ''),
	            type: 'symbol',
	            'source-layer': 'place_labels',
	            filter: ['==', 'kind', id],
	            layout: { 'text-field': nameField },
	        })),
	        {
	            id: 'label-boundary-country-small',
	            type: 'symbol',
	            'source-layer': 'boundary_labels',
	            filter: ['all', ['in', 'admin_level', 2, '2'], ['<=', 'way_area', 10000000]],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'label-boundary-country-medium',
	            type: 'symbol',
	            'source-layer': 'boundary_labels',
	            filter: ['all', ['in', 'admin_level', 2, '2'], ['<', 'way_area', 90000000], ['>', 'way_area', 10000000]],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'label-boundary-country-large',
	            type: 'symbol',
	            'source-layer': 'boundary_labels',
	            filter: ['all', ['in', 'admin_level', 2, '2'], ['>=', 'way_area', 90000000]],
	            layout: { 'text-field': nameField },
	        },
	        // marking
	        {
	            id: 'marking-oneway', // streets → oneway
	            type: 'symbol',
	            'source-layer': 'streets',
	            filter: [
	                'all',
	                ['==', 'oneway', true],
	                ['in', 'kind', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street'],
	            ],
	            layout: {
	                'symbol-placement': 'line',
	                'symbol-spacing': 175,
	                'icon-rotate': 90,
	                'icon-rotation-alignment': 'map',
	                'icon-padding': 5,
	                'symbol-avoid-edges': true,
	            },
	        },
	        {
	            id: 'marking-oneway-reverse', // oneway_reverse
	            type: 'symbol',
	            'source-layer': 'streets',
	            filter: [
	                'all',
	                ['==', 'oneway_reverse', true],
	                ['in', 'kind', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street'],
	            ],
	            layout: {
	                'symbol-placement': 'line',
	                'symbol-spacing': 75,
	                'icon-rotate': -90,
	                'icon-rotation-alignment': 'map',
	                'icon-padding': 5,
	                'symbol-avoid-edges': true,
	            },
	        },
	        {
	            id: 'marking-bicycle', // bicycle=designated or kind=cycleway
	            type: 'symbol',
	            'source-layer': 'streets',
	            filter: ['all', ['==', 'bicycle', 'designated'], ['==', 'kind', 'cycleway']],
	            layout: {
	                'symbol-placement': 'line',
	                'symbol-spacing': 50,
	            },
	        },
	        // symbol
	        {
	            id: 'symbol-transit-bus',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['==', 'kind', 'bus_stop'],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-tram',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['==', 'kind', 'tram_stop'],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-subway',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['all', ['in', 'kind', 'station', 'halt'], ['==', 'station', 'subway']],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-lightrail',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['all', ['in', 'kind', 'station', 'halt'], ['==', 'station', 'light_rail']],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-station',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['all', ['in', 'kind', 'station', 'halt'], ['!in', 'station', 'light_rail', 'subway']],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-airfield',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['all', ['==', 'kind', 'aerodrome'], ['!has', 'iata']],
	            layout: { 'text-field': nameField },
	        },
	        {
	            id: 'symbol-transit-airport',
	            type: 'symbol',
	            'source-layer': 'public_transport',
	            filter: ['all', ['==', 'kind', 'aerodrome'], ['has', 'iata']],
	            layout: { 'text-field': nameField },
	        },
	    ];
	}

	/**
	 * @param {string | RegExp} a
	 * @param {string | RegExp} b
	 * @param {string} str
	 */
	function balanced (a, b, str) {
	  if (a instanceof RegExp) a = maybeMatch(a, str);
	  if (b instanceof RegExp) b = maybeMatch(b, str);

	  const r = range(a, b, str);

	  return (
	    r && {
	      start: r[0],
	      end: r[1],
	      pre: str.slice(0, r[0]),
	      body: str.slice(r[0] + a.length, r[1]),
	      post: str.slice(r[1] + b.length)
	    }
	  )
	}

	/**
	 * @param {RegExp} reg
	 * @param {string} str
	 */
	function maybeMatch (reg, str) {
	  const m = str.match(reg);
	  return m ? m[0] : null
	}

	/**
	 * @param {string} a
	 * @param {string} b
	 * @param {string} str
	 */
	function range (a, b, str) {
	  let begs, beg, left, right, result;
	  let ai = str.indexOf(a);
	  let bi = str.indexOf(b, ai + 1);
	  let i = ai;

	  if (ai >= 0 && bi > 0) {
	    if (a === b) {
	      return [ai, bi]
	    }
	    begs = [];
	    left = str.length;

	    while (i >= 0 && !result) {
	      if (i === ai) {
	        begs.push(i);
	        ai = str.indexOf(a, i + 1);
	      } else if (begs.length === 1) {
	        result = [begs.pop(), bi];
	      } else {
	        beg = begs.pop();
	        if (beg < left) {
	          left = beg;
	          right = bi;
	        }

	        bi = str.indexOf(b, i + 1);
	      }

	      i = ai < bi && ai >= 0 ? ai : bi;
	    }

	    if (begs.length) {
	      result = [left, right];
	    }
	  }

	  return result
	}

	const escSlash = '\0SLASH' + Math.random() + '\0';
	const escOpen = '\0OPEN' + Math.random() + '\0';
	const escClose = '\0CLOSE' + Math.random() + '\0';
	const escComma = '\0COMMA' + Math.random() + '\0';
	const escPeriod = '\0PERIOD' + Math.random() + '\0';
	const escSlashPattern = new RegExp(escSlash, 'g');
	const escOpenPattern = new RegExp(escOpen, 'g');
	const escClosePattern = new RegExp(escClose, 'g');
	const escCommaPattern = new RegExp(escComma, 'g');
	const escPeriodPattern = new RegExp(escPeriod, 'g');
	const slashPattern = /\\\\/g;
	const openPattern = /\\{/g;
	const closePattern = /\\}/g;
	const commaPattern = /\\,/g;
	const periodPattern = /\\./g;

	/**
	 * @return {number}
	 */
	function numeric (str) {
	  return !isNaN(str)
	    ? parseInt(str, 10)
	    : str.charCodeAt(0)
	}

	/**
	 * @param {string} str
	 */
	function escapeBraces (str) {
	  return str.replace(slashPattern, escSlash)
	    .replace(openPattern, escOpen)
	    .replace(closePattern, escClose)
	    .replace(commaPattern, escComma)
	    .replace(periodPattern, escPeriod)
	}

	/**
	 * @param {string} str
	 */
	function unescapeBraces (str) {
	  return str.replace(escSlashPattern, '\\')
	    .replace(escOpenPattern, '{')
	    .replace(escClosePattern, '}')
	    .replace(escCommaPattern, ',')
	    .replace(escPeriodPattern, '.')
	}

	/**
	 * Basically just str.split(","), but handling cases
	 * where we have nested braced sections, which should be
	 * treated as individual members, like {a,{b,c},d}
	 * @param {string} str
	 */
	function parseCommaParts (str) {
	  if (!str) { return [''] }

	  const parts = [];
	  const m = balanced('{', '}', str);

	  if (!m) { return str.split(',') }

	  const { pre, body, post } = m;
	  const p = pre.split(',');

	  p[p.length - 1] += '{' + body + '}';
	  const postParts = parseCommaParts(post);
	  if (post.length) {
	    p[p.length - 1] += postParts.shift();
	    p.push.apply(p, postParts);
	  }

	  parts.push.apply(parts, p);

	  return parts
	}

	/**
	 * @param {string} str
	 */
	function expandTop (str) {
	  if (!str) { return [] }

	  // I don't know why Bash 4.3 does this, but it does.
	  // Anything starting with {} will have the first two bytes preserved
	  // but *only* at the top level, so {},a}b will not expand to anything,
	  // but a{},b}c will be expanded to [a}c,abc].
	  // One could argue that this is a bug in Bash, but since the goal of
	  // this module is to match Bash's rules, we escape a leading {}
	  if (str.slice(0, 2) === '{}') {
	    str = '\\{\\}' + str.slice(2);
	  }

	  return expand(escapeBraces(str), true).map(unescapeBraces)
	}

	/**
	 * @param {string} str
	 */
	function embrace (str) {
	  return '{' + str + '}'
	}

	/**
	 * @param {string} el
	 */
	function isPadded (el) {
	  return /^-?0\d/.test(el)
	}

	/**
	 * @param {number} i
	 * @param {number} y
	 */
	function lte (i, y) {
	  return i <= y
	}

	/**
	 * @param {number} i
	 * @param {number} y
	 */
	function gte (i, y) {
	  return i >= y
	}

	/**
	 * @param {string} str
	 * @param {boolean} [isTop]
	 */
	function expand (str, isTop) {
	  /** @type {string[]} */
	  const expansions = [];

	  const m = balanced('{', '}', str);
	  if (!m) return [str]

	  // no need to expand pre, since it is guaranteed to be free of brace-sets
	  const pre = m.pre;
	  const post = m.post.length
	    ? expand(m.post, false)
	    : [''];

	  if (/\$$/.test(m.pre)) {
	    for (let k = 0; k < post.length; k++) {
	      const expansion = pre + '{' + m.body + '}' + post[k];
	      expansions.push(expansion);
	    }
	  } else {
	    const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
	    const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
	    const isSequence = isNumericSequence || isAlphaSequence;
	    const isOptions = m.body.indexOf(',') >= 0;
	    if (!isSequence && !isOptions) {
	      // {a},b}
	      if (m.post.match(/,(?!,).*\}/)) {
	        str = m.pre + '{' + m.body + escClose + m.post;
	        return expand(str)
	      }
	      return [str]
	    }

	    let n;
	    if (isSequence) {
	      n = m.body.split(/\.\./);
	    } else {
	      n = parseCommaParts(m.body);
	      if (n.length === 1) {
	        // x{{a,b}}y ==> x{a}y x{b}y
	        n = expand(n[0], false).map(embrace);
	        if (n.length === 1) {
	          return post.map(function (p) {
	            return m.pre + n[0] + p
	          })
	        }
	      }
	    }

	    // at this point, n is the parts, and we know it's not a comma set
	    // with a single entry.
	    let N;

	    if (isSequence) {
	      const x = numeric(n[0]);
	      const y = numeric(n[1]);
	      const width = Math.max(n[0].length, n[1].length);
	      let incr = n.length === 3
	        ? Math.abs(numeric(n[2]))
	        : 1;
	      let test = lte;
	      const reverse = y < x;
	      if (reverse) {
	        incr *= -1;
	        test = gte;
	      }
	      const pad = n.some(isPadded);

	      N = [];

	      for (let i = x; test(i, y); i += incr) {
	        let c;
	        if (isAlphaSequence) {
	          c = String.fromCharCode(i);
	          if (c === '\\') { c = ''; }
	        } else {
	          c = String(i);
	          if (pad) {
	            const need = width - c.length;
	            if (need > 0) {
	              const z = new Array(need + 1).join('0');
	              if (i < 0) { c = '-' + z + c.slice(1); } else { c = z + c; }
	            }
	          }
	        }
	        N.push(c);
	      }
	    } else {
	      N = [];

	      for (let j = 0; j < n.length; j++) {
	        N.push.apply(N, expand(n[j], false));
	      }
	    }

	    for (let j = 0; j < N.length; j++) {
	      for (let k = 0; k < post.length; k++) {
	        const expansion = pre + N[j] + post[k];
	        if (!isTop || isSequence || expansion) { expansions.push(expansion); }
	      }
	    }
	  }

	  return expansions
	}

	const propertyLookup = new Map();
	const propertyDefs = [
	    { parent: 'layer', types: 'background,fill,line,symbol', key: 'filter', valueType: 'filter' },
	    { parent: 'layer', types: 'background,fill,line,symbol', key: 'maxzoom', valueType: 'number' },
	    { parent: 'layer', types: 'background,fill,line,symbol', key: 'minzoom', valueType: 'number' },
	    { parent: 'layout', types: 'background,fill,line,symbol', key: 'visibility', valueType: 'enum' },
	    { parent: 'layout', types: 'fill', key: 'fill-sort-key', valueType: 'number' },
	    { parent: 'layout', types: 'line', key: 'line-cap', valueType: 'enum' },
	    { parent: 'layout', types: 'line', key: 'line-join', valueType: 'enum' },
	    { parent: 'layout', types: 'line', key: 'line-miter-limit', valueType: 'number' },
	    { parent: 'layout', types: 'line', key: 'line-round-limit', valueType: 'number' },
	    { parent: 'layout', types: 'line', key: 'line-sort-key', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'icon-allow-overlap', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'icon-anchor', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'icon-ignore-placement', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'icon-image', short: 'image', valueType: 'resolvedImage' },
	    { parent: 'layout', types: 'symbol', key: 'icon-keep-upright', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'icon-offset', valueType: 'array' },
	    { parent: 'layout', types: 'symbol', key: 'icon-optional', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'icon-overlap', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'icon-padding', valueType: 'padding' },
	    { parent: 'layout', types: 'symbol', key: 'icon-pitch-alignment', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'icon-rotate', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'icon-rotation-alignment', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'icon-size', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'icon-text-fit-padding', valueType: 'array' },
	    { parent: 'layout', types: 'symbol', key: 'icon-text-fit', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'symbol-avoid-edges', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'symbol-placement', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'symbol-sort-key', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'symbol-spacing', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'symbol-z-order', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-allow-overlap', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'text-anchor', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-field', short: 'text', valueType: 'formatted' },
	    { parent: 'layout', types: 'symbol', key: 'text-font', short: 'font', valueType: 'fonts' },
	    { parent: 'layout', types: 'symbol', key: 'text-ignore-placement', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'text-justify', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-keep-upright', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'text-letter-spacing', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-line-height', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-max-angle', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-max-width', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-offset', valueType: 'array' },
	    { parent: 'layout', types: 'symbol', key: 'text-optional', valueType: 'boolean' },
	    { parent: 'layout', types: 'symbol', key: 'text-overlap', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-padding', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-pitch-alignment', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-radial-offset', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-rotate', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-rotation-alignment', valueType: 'enum' },
	    { parent: 'layout', types: 'symbol', key: 'text-size', short: 'size', valueType: 'number' },
	    { parent: 'layout', types: 'symbol', key: 'text-transform', valueType: 'enum' },
	    {
	        parent: 'layout',
	        types: 'symbol',
	        key: 'text-variable-anchor-offset',
	        valueType: 'variableAnchorOffsetCollection',
	    },
	    { parent: 'layout', types: 'symbol', key: 'text-variable-anchor', valueType: 'array' },
	    { parent: 'layout', types: 'symbol', key: 'text-writing-mode', valueType: 'array' },
	    { parent: 'paint', types: 'background', key: 'background-color', short: 'color', valueType: 'color' },
	    { parent: 'paint', types: 'background', key: 'background-opacity', short: 'opacity', valueType: 'number' },
	    { parent: 'paint', types: 'background', key: 'background-pattern', short: 'image', valueType: 'resolvedImage' },
	    { parent: 'paint', types: 'fill', key: 'fill-antialias', valueType: 'boolean' },
	    { parent: 'paint', types: 'fill', key: 'fill-color', short: 'color', valueType: 'color' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-base', valueType: 'number' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-color', valueType: 'color' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-height', valueType: 'number' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-opacity', valueType: 'number' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-pattern', valueType: 'resolvedImage' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-translate-anchor', valueType: 'enum' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-translate', valueType: 'array' },
	    { parent: 'paint', types: 'fill', key: 'fill-extrusion-vertical-gradient', valueType: 'boolean' },
	    { parent: 'paint', types: 'fill', key: 'fill-opacity', short: 'opacity', valueType: 'number' },
	    { parent: 'paint', types: 'fill', key: 'fill-outline-color', valueType: 'color' },
	    { parent: 'paint', types: 'fill', key: 'fill-pattern', short: 'image', valueType: 'resolvedImage' },
	    { parent: 'paint', types: 'fill', key: 'fill-translate-anchor', valueType: 'enum' },
	    { parent: 'paint', types: 'fill', key: 'fill-translate', valueType: 'array' },
	    { parent: 'paint', types: 'line', key: 'line-blur', valueType: 'number' },
	    { parent: 'paint', types: 'line', key: 'line-color', short: 'color', valueType: 'color' },
	    { parent: 'paint', types: 'line', key: 'line-dasharray', valueType: 'array' },
	    { parent: 'paint', types: 'line', key: 'line-gap-width', valueType: 'number' },
	    { parent: 'paint', types: 'line', key: 'line-gradient', valueType: 'color' },
	    { parent: 'paint', types: 'line', key: 'line-offset', valueType: 'number' },
	    { parent: 'paint', types: 'line', key: 'line-opacity', short: 'opacity', valueType: 'number' },
	    { parent: 'paint', types: 'line', key: 'line-pattern', short: 'image', valueType: 'resolvedImage' },
	    { parent: 'paint', types: 'line', key: 'line-translate-anchor', valueType: 'enum' },
	    { parent: 'paint', types: 'line', key: 'line-translate', valueType: 'array' },
	    { parent: 'paint', types: 'line', key: 'line-width', short: 'size', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'icon-color', short: 'color', valueType: 'color' },
	    { parent: 'paint', types: 'symbol', key: 'icon-halo-blur', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'icon-halo-color', valueType: 'color' },
	    { parent: 'paint', types: 'symbol', key: 'icon-halo-width', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'icon-opacity', short: 'opacity', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'icon-translate-anchor', valueType: 'enum' },
	    { parent: 'paint', types: 'symbol', key: 'icon-translate', valueType: 'array' },
	    { parent: 'paint', types: 'symbol', key: 'text-color', short: 'color', valueType: 'color' },
	    { parent: 'paint', types: 'symbol', key: 'text-halo-blur', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'text-halo-color', valueType: 'color' },
	    { parent: 'paint', types: 'symbol', key: 'text-halo-width', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'text-opacity', short: 'opacity', valueType: 'number' },
	    { parent: 'paint', types: 'symbol', key: 'text-translate-anchor', valueType: 'enum' },
	    { parent: 'paint', types: 'symbol', key: 'text-translate', valueType: 'array' },
	];
	propertyDefs.forEach((propertyDef) => {
	    const types = propertyDef.types;
	    types.split(',').forEach((type) => {
	        function add(propertyKey) {
	            const key = type + '/' + propertyKey;
	            const property = {
	                key: propertyDef.key,
	                parent: propertyDef.parent,
	                valueType: propertyDef.valueType,
	            };
	            const propertyList = propertyLookup.get(key);
	            if (propertyList) {
	                propertyList.push(property);
	            }
	            else {
	                propertyLookup.set(key, [property]);
	            }
	        }
	        add(propertyDef.key);
	        if (propertyDef.short != null)
	            add(propertyDef.short);
	    });
	});

	// Utility function to deep clone an object
	function deepClone(obj) {
	    const type = typeof obj;
	    if (type !== 'object') {
	        switch (type) {
	            case 'boolean':
	            case 'number':
	            case 'string':
	            case 'undefined':
	                return obj;
	            default:
	                throw new Error(`Not implemented yet: "${type}" case`);
	        }
	    }
	    if (isSimpleObject(obj)) {
	        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, deepClone(value)]));
	    }
	    if (obj instanceof Array) {
	        return obj.map((e) => deepClone(e));
	    }
	    if (obj instanceof Color) {
	        return obj.clone();
	    }
	    if (obj == null)
	        return obj;
	    console.log('obj', obj);
	    console.log('obj.prototype', Object.getPrototypeOf(obj));
	    throw Error();
	}
	function isSimpleObject(item) {
	    if (item === null)
	        return false;
	    if (typeof item !== 'object')
	        return false;
	    if (Array.isArray(item))
	        return false;
	    const prototypeKeyCount = Object.keys(Object.getPrototypeOf(item)).length;
	    if (prototypeKeyCount !== 0)
	        return false;
	    if (item.constructor.name !== 'Object')
	        return false;
	    return true;
	}
	function isBasicType(item) {
	    switch (typeof item) {
	        case 'boolean':
	        case 'number':
	        case 'string':
	        case 'undefined':
	            return true;
	        case 'object':
	            return false;
	        default:
	            throw Error('unknown type: ' + typeof item);
	    }
	}
	function deepMerge(source0, ...sources) {
	    const target = deepClone(source0);
	    for (const source of sources) {
	        if (typeof source !== 'object')
	            continue;
	        for (const key in source) {
	            if (!(key in source))
	                continue;
	            const sourceValue = source[key];
	            // *********
	            // overwrite
	            // *********
	            switch (typeof sourceValue) {
	                case 'number':
	                case 'string':
	                case 'boolean':
	                    target[key] = sourceValue;
	                    continue;
	            }
	            if (isBasicType(target[key])) {
	                target[key] = deepClone(sourceValue);
	                continue;
	            }
	            if (sourceValue instanceof Color) {
	                target[key] = sourceValue.clone();
	                continue;
	            }
	            if (isSimpleObject(target[key]) && isSimpleObject(sourceValue)) {
	                target[key] = deepMerge(target[key], sourceValue);
	                continue;
	            }
	            // *********
	            // merge
	            // *********
	            if (isSimpleObject(target[key]) && isSimpleObject(sourceValue)) {
	                target[key] = deepMerge(target[key], sourceValue);
	                continue;
	            }
	            console.log('target[key]:', target[key]);
	            console.log('source[key]:', source[key]);
	            throw Error('unpredicted case');
	        }
	    }
	    return target;
	}
	function resolveUrl(base, url) {
	    if (!base)
	        return url;
	    url = new URL(url, base).href;
	    url = url.replace(/%7B/gi, '{');
	    url = url.replace(/%7D/gi, '}');
	    return url;
	}
	function basename(url) {
	    if (!url)
	        return '';
	    try {
	        url = new URL(url, 'http://example.org').pathname;
	    }
	    catch (_) {
	        // ignore
	    }
	    url = url.replace(/\/+$/, '');
	    return url.split('/').pop() ?? '';
	}

	function decorate(layers, rules, recolor) {
	    const layerIds = layers.map((l) => l.id);
	    const layerIdSet = new Set(layerIds);
	    // Initialize a new map to hold final styles for layers
	    const layerStyles = new Map();
	    // Iterate through the generated layer style rules
	    Object.entries(rules).forEach(([idDef, layerStyle]) => {
	        if (layerStyle == null)
	            return;
	        // Expand any braces in IDs and filter them through a RegExp if necessary
	        const ids = expandTop(idDef).flatMap((id) => {
	            if (!id.includes('*'))
	                return id;
	            const regExpString = id.replace(/[^a-z_:-]/g, (c) => {
	                if (c === '*')
	                    return '[a-z_-]*';
	                throw new Error('unknown char to process. Do not know how to make a RegExp from: ' + JSON.stringify(c));
	            });
	            const regExp = new RegExp(`^${regExpString}$`, 'i');
	            return layerIds.filter((layerId) => regExp.test(layerId));
	        });
	        ids.forEach((id) => {
	            if (!layerIdSet.has(id))
	                return;
	            layerStyles.set(id, deepMerge(layerStyles.get(id) ?? {}, layerStyle));
	        });
	    });
	    // Deep clone the original layers and apply styles
	    return layers.flatMap((layer) => {
	        // Get the id and style of the layer
	        const layerStyle = layerStyles.get(layer.id);
	        // Don't export layers that have no style
	        if (!layerStyle)
	            return [];
	        processStyling(layer, layerStyle);
	        return [layer];
	    });
	    // Function to process each style attribute for the layer
	    function processStyling(layer, styleRule) {
	        for (const [ruleKeyCamelCase, ruleValue] of Object.entries(styleRule)) {
	            if (ruleValue == null)
	                continue;
	            // CamelCase to not-camel-case
	            const ruleKey = ruleKeyCamelCase.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
	            const propertyDefs = propertyLookup.get(layer.type + '/' + ruleKey);
	            if (!propertyDefs)
	                continue;
	            propertyDefs.forEach((propertyDef) => {
	                const { key } = propertyDef;
	                let value = ruleValue;
	                switch (propertyDef.valueType) {
	                    case 'color':
	                        value = processExpression(value, processColor);
	                        break;
	                    case 'fonts':
	                        value = processExpression(value, processFont);
	                        break;
	                    case 'resolvedImage':
	                    case 'formatted':
	                    case 'array':
	                    case 'boolean':
	                    case 'enum':
	                    case 'number':
	                        value = processExpression(value);
	                        break;
	                    default:
	                        throw new Error(`unknown propertyDef.valueType "${propertyDef.valueType}" for key "${key}"`);
	                }
	                switch (propertyDef.parent) {
	                    case 'layer':
	                        // @ts-expect-error: too complex to handle
	                        layer[key] = value;
	                        break;
	                    case 'layout':
	                        if (!layer.layout)
	                            layer.layout = {};
	                        // @ts-expect-error: too complex to handle
	                        layer.layout[key] = value;
	                        break;
	                    case 'paint':
	                        if (!layer.paint)
	                            layer.paint = {};
	                        // @ts-expect-error: too complex to handle
	                        layer.paint[key] = value;
	                        break;
	                    default:
	                        throw new Error(`unknown parent "${propertyDef.parent}" for key "${key}"`);
	                }
	            });
	        }
	        function processColor(value) {
	            if (typeof value === 'string')
	                value = Color.parse(value);
	            if (value instanceof Color) {
	                const color = recolor.do(value);
	                return color.asString();
	            }
	            throw new Error(`unknown color type "${typeof value}"`);
	        }
	        function processFont(value) {
	            if (typeof value === 'string')
	                return [value];
	            throw new Error(`unknown font type "${typeof value}"`);
	        }
	        function processExpression(value, cbValue) {
	            if (typeof value === 'object') {
	                if (value instanceof Color)
	                    return processColor(value);
	                if (!Array.isArray(value)) {
	                    return processZoomStops(value, cbValue);
	                }
	            }
	            return cbValue ? cbValue(value) : value;
	        }
	        function processZoomStops(obj, cbValue) {
	            return {
	                stops: Object.entries(obj)
	                    .map(([z, v]) => [parseInt(z, 10), cbValue ? cbValue(v) : v])
	                    .sort((a, b) => a[0] - b[0]),
	            };
	        }
	    }
	}

	/**
	 * Module for applying various color transformations such as hue rotation, saturation, contrast, brightness,
	 * tinting, and blending. These transformations are defined through the `RecolorOptions` interface.
	 */
	/**
	 * Returns the default recolor settings.
	 */
	function getDefaultRecolorFlags() {
	    return {
	        invertBrightness: false,
	        rotate: 0,
	        saturate: 0,
	        gamma: 1,
	        contrast: 1,
	        brightness: 0,
	        tint: 0,
	        tintColor: '#FF0000',
	        blend: 0,
	        blendColor: '#000000',
	    };
	}
	/**
	 * Checks if the given options object contains any active recolor transformations.
	 * @param opt The recolor options to validate.
	 */
	function isValidRecolorOptions(opt) {
	    if (!opt)
	        return false;
	    return (opt.invertBrightness ||
	        (opt.rotate != null && opt.rotate !== 0) ||
	        (opt.saturate != null && opt.saturate !== 0) ||
	        (opt.gamma != null && opt.gamma !== 1) ||
	        (opt.contrast != null && opt.contrast !== 1) ||
	        (opt.brightness != null && opt.brightness !== 0) ||
	        (opt.tint != null && opt.tint !== 0) ||
	        (opt.tintColor != null && opt.tintColor !== '#FF0000') ||
	        (opt.blend != null && opt.blend !== 0) ||
	        (opt.blendColor != null && opt.blendColor !== '#000000'));
	}
	/**
	 * Caches recolored colors to optimize performance.
	 */
	class CachedRecolor {
	    skip;
	    opt;
	    cache;
	    /**
	     * Creates a cached recolor instance.
	     * @param opt Optional recolor options.
	     */
	    constructor(opt) {
	        this.skip = !isValidRecolorOptions(opt);
	        this.cache = new Map();
	        this.opt = opt;
	    }
	    /**
	     * Applies cached recoloring to a given color.
	     * @param color The color to recolor.
	     * @returns The recolored color, either from cache or newly computed.
	     */
	    do(color) {
	        if (this.skip)
	            return color;
	        const key = color.asHex();
	        if (this.cache.has(key))
	            return this.cache.get(key);
	        const recolored = recolor(color, this.opt);
	        this.cache.set(key, recolored);
	        return recolored;
	    }
	}
	/**
	 * Applies the specified recoloring transformations to a single color.
	 * @param color The original color.
	 * @param opt Optional recolor options.
	 * @returns A new `Color` instance with applied transformations.
	 */
	function recolor(color, opt) {
	    if (!isValidRecolorOptions(opt))
	        return color;
	    if (opt.invertBrightness)
	        color = color.invertLuminosity();
	    if (opt.rotate)
	        color = color.rotateHue(opt.rotate);
	    if (opt.saturate)
	        color = color.saturate(opt.saturate);
	    if (opt.gamma != null && opt.gamma != 1)
	        color = color.gamma(opt.gamma);
	    if (opt.contrast != null && opt.contrast != 1)
	        color = color.contrast(opt.contrast);
	    if (opt.brightness)
	        color = color.brightness(opt.brightness);
	    if (opt.tint && opt.tintColor != null)
	        color = color.tint(opt.tint, Color.parse(opt.tintColor));
	    if (opt.blend && opt.blendColor != null)
	        color = color.blend(opt.blend, Color.parse(opt.blendColor));
	    return color;
	}

	const styleBuilderColorKeys = [
	    'agriculture',
	    'boundary',
	    'building',
	    'buildingbg',
	    'burial',
	    'commercial',
	    'construction',
	    'cycle',
	    'danger',
	    'disputed',
	    'education',
	    'foot',
	    'glacier',
	    'grass',
	    'hospital',
	    'industrial',
	    'label',
	    'labelHalo',
	    'land',
	    'leisure',
	    'motorway',
	    'motorwaybg',
	    'park',
	    'parking',
	    'poi',
	    'prison',
	    'rail',
	    'residential',
	    'rock',
	    'sand',
	    'shield',
	    'street',
	    'streetbg',
	    'subway',
	    'symbol',
	    'trunk',
	    'trunkbg',
	    'waste',
	    'water',
	    'wetland',
	    'wood',
	];

	// StyleBuilder class definition
	class StyleBuilder {
	    #sourceName = 'versatiles-shortbread';
	    build(options) {
	        options ??= {};
	        const defaults = this.getDefaultOptions();
	        const baseUrl = options.baseUrl ?? defaults.baseUrl;
	        const glyphs = options.glyphs ?? defaults.glyphs;
	        const sprite = options.sprite ?? defaults.sprite;
	        const tiles = options.tiles ?? defaults.tiles;
	        const bounds = options.bounds ?? defaults.bounds;
	        const hideLabels = options.hideLabels ?? defaults.hideLabels;
	        const language = options.language ?? defaults.language;
	        const recolorOptions = options.recolor ?? defaults.recolor;
	        const colors = this.getColors(this.defaultColors);
	        if (options.colors) {
	            let key;
	            for (key in options.colors) {
	                const value = options.colors[key];
	                if (value != null)
	                    colors[key] = Color.parse(value);
	            }
	        }
	        const fonts = deepClone(this.defaultFonts);
	        if (options.fonts) {
	            let key;
	            for (key in options.fonts) {
	                const fontName = options.fonts[key];
	                if (fontName != null)
	                    fonts[key] = fontName;
	            }
	        }
	        // get empty shortbread style
	        const style = getShortbreadTemplate();
	        const styleRuleOptions = {
	            colors,
	            fonts,
	            language,
	        };
	        // get layer style rules from child class
	        const layerStyleRules = this.getStyleRules(styleRuleOptions);
	        // get shortbread layers
	        const layerDefinitions = getShortbreadLayers({ language });
	        let layers = layerDefinitions.map((layer) => {
	            switch (layer.type) {
	                case 'background':
	                    return layer;
	                case 'fill':
	                case 'line':
	                case 'symbol':
	                    return {
	                        source: this.#sourceName,
	                        ...layer,
	                    };
	            }
	            throw Error('unknown layer type');
	        });
	        // apply layer rules
	        layers = decorate(layers, layerStyleRules, new CachedRecolor(recolorOptions));
	        // hide labels, if wanted
	        if (hideLabels)
	            layers = layers.filter((l) => l.type !== 'symbol');
	        style.layers = layers;
	        style.name = 'versatiles-' + this.name.toLowerCase();
	        style.glyphs = resolveUrl(baseUrl, glyphs);
	        if (typeof sprite == 'string') {
	            style.sprite = [{ id: basename(sprite), url: resolveUrl(baseUrl, sprite) }];
	        }
	        else {
	            style.sprite = sprite.map(({ id, url }) => ({ id, url: resolveUrl(baseUrl, url) }));
	        }
	        const source = style.sources[this.#sourceName];
	        if ('tiles' in source)
	            source.tiles = tiles.map((url) => resolveUrl(baseUrl, url));
	        if ('bounds' in source)
	            source.bounds = bounds;
	        return style;
	    }
	    getColors(colors) {
	        const entriesString = Object.entries(colors);
	        const result = Object.fromEntries(entriesString.map(([key, value]) => [key, Color.parse(value)]));
	        return result;
	    }
	    getDefaultOptions() {
	        return {
	            // @ts-expect-error globalThis may be undefined in some environments
	            baseUrl: globalThis?.document?.location?.origin ?? 'https://tiles.versatiles.org',
	            bounds: [-180, -85.0511287798066, 180, 85.0511287798066],
	            glyphs: '/assets/glyphs/{fontstack}/{range}.pbf',
	            sprite: [{ id: 'basics', url: '/assets/sprites/basics/sprites' }],
	            tiles: ['/tiles/osm/{z}/{x}/{y}'],
	            hideLabels: false,
	            language: '',
	            colors: deepClone(this.defaultColors),
	            fonts: deepClone(this.defaultFonts),
	            recolor: getDefaultRecolorFlags(),
	        };
	    }
	    transformDefaultColors(callback) {
	        const colors = this.getColors(this.defaultColors);
	        for (const key of styleBuilderColorKeys) {
	            this.defaultColors[key] = callback(colors[key]);
	        }
	    }
	}

	class Colorful extends StyleBuilder {
	    name = 'Colorful';
	    defaultFonts = {
	        regular: 'noto_sans_regular',
	        bold: 'noto_sans_bold',
	    };
	    defaultColors = {
	        /** Color for land areas on the map. */
	        land: '#F9F4EE',
	        /** Color for water bodies like lakes and rivers. */
	        water: '#BEDDF3',
	        /** Color for glacier areas, usually shown as white. */
	        glacier: '#FFFFFF',
	        /** Color for wooded or forested areas. */
	        wood: '#66AA44',
	        /** Color for grasslands or open fields. */
	        grass: '#D8E8C8',
	        /** Color for parks and recreational areas. */
	        park: '#D9D9A5',
	        /** Color for streets and roads on the map. */
	        street: '#FFFFFF',
	        /** Background color for streets. */
	        streetbg: '#CFCDCA',
	        /** Color for major highways or motorways. */
	        motorway: '#FFCC88',
	        /** Background color for motorways. */
	        motorwaybg: '#E9AC77',
	        /** Color for trunk roads. */
	        trunk: '#FFEEAA',
	        /** Background color for trunk roads. */
	        trunkbg: '#E9AC77',
	        /** Background color for buildings. */
	        buildingbg: '#DFDBD7',
	        /** Primary color for buildings. */
	        building: '#F2EAE2',
	        /** Color used for boundaries. */
	        boundary: '#A6A6C8',
	        /** Color used for disputed boundaries. */
	        disputed: '#BEBCCF',
	        /** Color used for residential areas. */
	        residential: '#EAE6E133',
	        /** Color used for commercial areas. */
	        commercial: '#F7DEED40',
	        /** Color used for industrial areas. */
	        industrial: '#FFF4C255',
	        /** Color used for footpaths and pedestrian areas. */
	        foot: '#FBEBFF',
	        /** Primary color used for labels. */
	        label: '#333344',
	        /** Color used for label halos. */
	        labelHalo: '#FFFFFFCC',
	        /** Color used for shields on maps. */
	        shield: '#FFFFFF',
	        /** Color used for agriculture areas. */
	        agriculture: '#F0E7D1',
	        /** Color used for railways. */
	        rail: '#B1BBC4',
	        /** Color used for subways and underground systems. */
	        subway: '#A6B8C7',
	        /** Color used for cycle paths. */
	        cycle: '#EFF9FF',
	        /** Color used for waste areas. */
	        waste: '#DBD6BD',
	        /** Color used for burial and cemetery areas. */
	        burial: '#DDDBCA',
	        /** Color used for sand areas like beaches. */
	        sand: '#FAFAED',
	        /** Color used for rocky terrain. */
	        rock: '#E0E4E5',
	        /** Color used for leisure areas like parks and gardens. */
	        leisure: '#E7EDDE',
	        /** Color used for wetland areas like marshes. */
	        wetland: '#D3E6DB',
	        /** Color used for various symbols on the map. */
	        symbol: '#66626A',
	        /** Color indicating danger or warning areas. */
	        danger: '#FF0000',
	        /** Color used for prison areas. */
	        prison: '#FDF2FC',
	        /** Color used for parking areas. */
	        parking: '#EBE8E6',
	        /** Color used for construction sites. */
	        construction: '#A9A9A9',
	        /** Color used for educational facilities. */
	        education: '#FFFF80',
	        /** Color used for hospitals and medical facilities. */
	        hospital: '#FF6666',
	        /** Color used for points of interest. */
	        poi: '#555555',
	    };
	    getStyleRules(options) {
	        const { colors, fonts } = options;
	        return {
	            // background
	            background: {
	                color: colors.land,
	            },
	            // boundary
	            'boundary-{country,state}:outline': {
	                color: colors.land.lighten(0.1),
	                lineBlur: 1,
	                lineCap: 'round',
	                lineJoin: 'round',
	            },
	            'boundary-{country,state}': {
	                color: colors.boundary,
	                lineCap: 'round',
	                lineJoin: 'round',
	            },
	            'boundary-country{-disputed,}:outline': {
	                size: { 2: 0, 3: 2, 10: 8 },
	                opacity: 0.75,
	                color: colors.land.lighten(0.05),
	            },
	            'boundary-country{-disputed,}': {
	                size: { 2: 0, 3: 1, 10: 4 },
	            },
	            'boundary-country-disputed': {
	                color: colors.disputed,
	                lineDasharray: [2, 1],
	                lineCap: 'square',
	            },
	            'boundary-state:outline': {
	                size: { 7: 0, 8: 2, 10: 4 },
	                opacity: 0.75,
	            },
	            'boundary-state': {
	                size: { 7: 0, 8: 1, 10: 2 },
	            },
	            // water
	            'water-*': {
	                color: colors.water,
	                lineCap: 'round',
	                lineJoin: 'round',
	            },
	            'water-area': {
	                opacity: { 4: 0, 6: 1 },
	            },
	            'water-area-*': {
	                opacity: { 4: 0, 6: 1 },
	            },
	            'water-{pier,dam}-area': {
	                color: colors.land,
	                opacity: { 12: 0, 13: 1 },
	            },
	            'water-pier': {
	                color: colors.land,
	            },
	            'water-river': {
	                lineWidth: { 9: 0, 10: 3, 15: 5, 17: 9, 18: 20, 20: 60 },
	            },
	            'water-canal': {
	                lineWidth: { 9: 0, 10: 2, 15: 4, 17: 8, 18: 17, 20: 50 },
	            },
	            'water-stream': {
	                lineWidth: { 13: 0, 14: 1, 15: 2, 17: 6, 18: 12, 20: 30 },
	            },
	            'water-ditch': {
	                lineWidth: { 14: 0, 15: 1, 17: 4, 18: 8, 20: 20 },
	            },
	            // land
	            'land-*': {
	                color: colors.land,
	            },
	            'land-glacier': {
	                color: colors.glacier,
	            },
	            'land-forest': {
	                color: colors.wood,
	                opacity: { 7: 0, 8: 0.1 },
	            },
	            'land-grass': {
	                color: colors.grass,
	                opacity: { 11: 0, 12: 1 },
	            },
	            'land-{park,garden,vegetation}': {
	                color: colors.park,
	                opacity: { 11: 0, 12: 1 },
	            },
	            'land-agriculture': {
	                color: colors.agriculture,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-residential': {
	                color: colors.residential,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-commercial': {
	                color: colors.commercial,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-industrial': {
	                color: colors.industrial,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-waste': {
	                color: colors.waste,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-burial': {
	                color: colors.burial,
	                opacity: { 13: 0, 14: 1 },
	            },
	            'land-leisure': {
	                color: colors.leisure,
	            },
	            'land-rock': {
	                color: colors.rock,
	            },
	            'land-sand': {
	                color: colors.sand,
	            },
	            'land-wetland': {
	                color: colors.wetland,
	            },
	            // site
	            'site-dangerarea': {
	                color: colors.danger,
	                fillOutlineColor: colors.danger,
	                opacity: 0.3,
	                image: 'basics:pattern-warning',
	            },
	            'site-hospital': {
	                color: colors.hospital,
	                opacity: 0.1,
	            },
	            'site-prison': {
	                color: colors.prison,
	                image: 'basics:pattern-striped',
	                opacity: 0.1,
	            },
	            'site-construction': {
	                color: colors.construction,
	                image: 'basics:pattern-hatched_thin',
	                opacity: 0.1,
	            },
	            'site-{university,college,school}': {
	                color: colors.education,
	                opacity: 0.1,
	            },
	            'site-{bicycleparking,parking}': {
	                color: colors.parking,
	            },
	            // building
	            'building:outline': {
	                color: colors.buildingbg,
	                opacity: { 14: 0, 15: 1 },
	            },
	            building: {
	                // fake 2.5d with translate
	                color: colors.building,
	                opacity: { 14: 0, 15: 1 },
	                fillTranslate: [-2, -2],
	            },
	            // airport
	            'airport-area': {
	                color: colors.street,
	                opacity: 0.5,
	            },
	            'airport-{runway,taxiway}:outline': {
	                color: colors.streetbg,
	                lineJoin: 'round',
	            },
	            'airport-{runway,taxiway}': {
	                color: colors.street,
	                lineJoin: 'round',
	            },
	            'airport-runway:outline': {
	                size: { 11: 0, 12: 6, 13: 9, 14: 16, 15: 24, 16: 40, 17: 100, 18: 160, 20: 300 },
	            },
	            'airport-runway': {
	                size: { 11: 0, 12: 5, 13: 8, 14: 14, 15: 22, 16: 38, 17: 98, 18: 158, 20: 298 },
	                opacity: { 11: 0, 12: 1 },
	            },
	            'airport-taxiway:outline': {
	                size: { 13: 0, 14: 2, 15: 10, 16: 14, 18: 20, 20: 40 },
	            },
	            'airport-taxiway': {
	                size: { 13: 0, 14: 1, 15: 8, 16: 12, 18: 18, 20: 36 },
	                opacity: { 13: 0, 14: 1 },
	            },
	            // bridge
	            bridge: {
	                color: colors.land.darken(0.02),
	                fillAntialias: true,
	                opacity: 0.8,
	            },
	            // street
	            // colors and joins
	            '{tunnel-,bridge-,}street-*:outline': {
	                color: colors.streetbg,
	                lineJoin: 'round',
	            },
	            '{tunnel-,bridge-,}street-*': {
	                color: colors.street,
	                lineJoin: 'round',
	            },
	            'tunnel-street-*:outline': {
	                color: colors.street.darken(0.13),
	            },
	            'tunnel-street-*': {
	                color: colors.street.darken(0.03),
	            },
	            'bridge-street-*:outline': {
	                color: colors.street.darken(0.15),
	            },
	            // streets and ways, line caps
	            '{tunnel-,}{street,way}-*': {
	                lineCap: 'round',
	            },
	            '{tunnel-,}{street,way}-*:outline': {
	                lineCap: 'round',
	            },
	            'bridge-{street,way}-*': {
	                lineCap: 'butt',
	            },
	            'bridge-{street,way}-*:outline': {
	                lineCap: 'butt',
	            },
	            // faux bridges
	            'bridge-{street,way}-*:bridge': {
	                lineCap: 'butt',
	                lineJoin: 'round',
	                color: colors.land.darken(0.02),
	                fillAntialias: true,
	                opacity: 0.5,
	            },
	            'bridge-street-motorway:bridge': {
	                size: { '5': 0, '6': 3, '10': 7, '14': 7, '16': 20, '18': 53, '19': 118, '20': 235 },
	            },
	            'bridge-street-trunk:bridge': {
	                size: { '7': 0, '8': 3, '10': 6, '14': 8, '16': 17, '18': 50, '19': 104, '20': 202 },
	            },
	            'bridge-street-primary:bridge': {
	                size: { '8': 0, '9': 1, '10': 6, '14': 8, '16': 17, '18': 50, '19': 104, '20': 202 },
	            },
	            'bridge-street-secondary:bridge': {
	                size: { '11': 3, '14': 7, '16': 11, '18': 42, '19': 95, '20': 193 },
	                opacity: { '11': 0, '12': 1 },
	            },
	            'bridge-street-motorway-link:bridge': {
	                minzoom: 12,
	                size: { '12': 3, '14': 4, '16': 10, '18': 20, '20': 56 },
	            },
	            'bridge-street-{trunk,primary,secondary}-link:bridge': {
	                minzoom: 13,
	                size: { '12': 3, '14': 4, '16': 10, '18': 20, '20': 56 },
	            },
	            'bridge-street-{tertiary,tertiary-link,unclassified,residential,livingstreet,pedestrian}*:bridge': {
	                size: { '12': 3, '14': 4, '16': 8, '18': 36, '19': 90, '20': 179 },
	                opacity: { '12': 0, '13': 1 },
	            },
	            'bridge-street-{service,track}:bridge': {
	                size: { '14': 3, '16': 6, '18': 25, '19': 67, '20': 134 },
	                opacity: { '14': 0, '15': 1 },
	            },
	            'bridge-way-*:bridge': {
	                size: { '15': 0, '16': 7, '18': 10, '19': 17, '20': 31 },
	                minzoom: 15,
	            },
	            // special color: motorway
	            '{bridge-,}street-motorway{-link,}:outline': {
	                color: colors.motorwaybg,
	            },
	            '{bridge-,}street-motorway{-link,}': {
	                color: colors.motorway,
	            },
	            '{bridge-,}street-{trunk,primary,secondary}{-link,}:outline': {
	                color: colors.trunkbg,
	            },
	            '{bridge-,}street-{trunk,primary,secondary}{-link,}': {
	                color: colors.trunk,
	            },
	            'tunnel-street-motorway{-link,}:outline': {
	                color: colors.motorwaybg.lighten(0.05),
	                lineDasharray: [1, 0.3],
	            },
	            'tunnel-street-motorway{-link,}': {
	                color: colors.motorway.lighten(0.1),
	                lineCap: 'butt',
	            },
	            'tunnel-street-{trunk,primary,secondary}{-link,}:outline': {
	                color: colors.trunkbg.lighten(0.05),
	                lineDasharray: [1, 0.3],
	            },
	            'tunnel-street-{trunk,primary,secondary}{-link,}': {
	                color: colors.trunk.lighten(0.1),
	                lineCap: 'butt',
	            },
	            // motorway
	            '{bridge-,tunnel-,}street-motorway:outline': {
	                size: { 5: 0, 6: 2, 10: 5, 14: 5, 16: 14, 18: 38, 19: 84, 20: 168 },
	            },
	            '{bridge-,tunnel-,}street-motorway': {
	                size: { 5: 0, 6: 1, 10: 4, 14: 4, 16: 12, 18: 36, 19: 80, 20: 160 },
	                opacity: { 5: 0, 6: 1 },
	            },
	            // trunk
	            '{bridge-,tunnel-,}street-trunk:outline': {
	                size: { 7: 0, 8: 2, 10: 4, 14: 6, 16: 12, 18: 36, 19: 74, 20: 144 },
	            },
	            '{bridge-,tunnel-,}street-trunk': {
	                size: { 7: 0, 8: 1, 10: 3, 14: 5, 16: 10, 18: 34, 19: 70, 20: 140 },
	                opacity: { 7: 0, 8: 1 },
	            },
	            // primary
	            '{bridge-,tunnel-,}street-primary:outline': {
	                size: { 8: 0, 9: 1, 10: 4, 14: 6, 16: 12, 18: 36, 19: 74, 20: 144 },
	            },
	            '{bridge-,tunnel-,}street-primary': {
	                size: { 8: 0, 9: 2, 10: 3, 14: 5, 16: 10, 18: 34, 19: 70, 20: 140 },
	                opacity: { 8: 0, 9: 1 },
	            },
	            // secondary
	            '{bridge-,tunnel-,}street-secondary:outline': {
	                size: { 11: 2, 14: 5, 16: 8, 18: 30, 19: 68, 20: 138 },
	                opacity: { 11: 0, 12: 1 },
	            },
	            '{bridge-,tunnel-,}street-secondary': {
	                size: { 11: 1, 14: 4, 16: 6, 18: 28, 19: 64, 20: 130 },
	                opacity: { 11: 0, 12: 1 },
	            },
	            // links
	            '{bridge-,tunnel-,}street-motorway-link:outline': {
	                minzoom: 12,
	                size: { 12: 2, 14: 3, 16: 7, 18: 14, 20: 40 },
	                //		opacity: { 12: 0, 13: 1 }, // no fade-in because those are merged in lower zooms
	            },
	            '{bridge-,tunnel-,}street-motorway-link': {
	                minzoom: 12,
	                size: { 12: 1, 14: 2, 16: 5, 18: 12, 20: 38 },
	                //		opacity: { 12: 0, 13: 1 }, // no fade-in because those are merged in lower zooms
	            },
	            '{bridge-,tunnel-,}street-{trunk,primary,secondary}-link:outline': {
	                minzoom: 13,
	                size: { 12: 2, 14: 3, 16: 7, 18: 14, 20: 40 },
	                //		opacity: { 13: 0, 14: 1 }, // no fade-in because those are merged in lower zooms
	            },
	            '{bridge-,tunnel-,}street-{trunk,primary,secondary}-link': {
	                minzoom: 13,
	                size: { 12: 1, 14: 2, 16: 5, 18: 12, 20: 38 },
	                //		opacity: { 13: 0, 14: 1 }, // no fade-in because those are merged in lower zooms
	            },
	            // minor streets
	            '{bridge-,tunnel-,}street-{tertiary,tertiary-link,unclassified,residential,livingstreet,pedestrian}*:outline': {
	                size: { 12: 2, 14: 3, 16: 6, 18: 26, 19: 64, 20: 128 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            '{bridge-,tunnel-,}street-{tertiary,tertiary-link,unclassified,residential,livingstreet,pedestrian}*': {
	                size: { 12: 1, 14: 2, 16: 5, 18: 24, 19: 60, 20: 120 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            // tracks
	            '{bridge-,tunnel-,}street-track:outline': {
	                size: { 14: 2, 16: 4, 18: 18, 19: 48, 20: 96 },
	                opacity: { 14: 0, 15: 1 },
	            },
	            '{bridge-,tunnel-,}street-track': {
	                size: { 14: 1, 16: 3, 18: 16, 19: 44, 20: 88 },
	                opacity: { 14: 0, 15: 1 },
	            },
	            // service
	            '{bridge-,tunnel-,}street-service:outline': {
	                size: { 14: 1, 16: 3, 18: 12, 19: 32, 20: 48 },
	                opacity: { 15: 0, 16: 1 },
	                color: colors.streetbg.lighten(0.3),
	            },
	            '{bridge-,tunnel-,}street-service': {
	                size: { 14: 1, 16: 2, 18: 10, 19: 28, 20: 40 },
	                opacity: { 15: 0, 16: 1 },
	                color: colors.street.darken(0.03),
	            },
	            // ways
	            '{bridge-,tunnel-,}way-*:outline': {
	                size: { 15: 0, 16: 5, 18: 7, 19: 12, 20: 22 },
	                minzoom: 15,
	            },
	            '{bridge-,tunnel-,}way-*': {
	                size: { 15: 0, 16: 4, 18: 6, 19: 10, 20: 20 },
	                minzoom: 15,
	            },
	            // foot
	            '{bridge-,}way-{footway,path,steps}:outline': {
	                color: colors.foot.darken(0.1),
	            },
	            '{bridge-,}way-{footway,path,steps}': {
	                color: colors.foot.lighten(0.02),
	            },
	            'tunnel-way-{footway,path,steps}:outline': {
	                color: colors.foot.darken(0.1).saturate(-0.5),
	            },
	            'tunnel-way-{footway,path,steps}': {
	                color: colors.foot.darken(0.02).saturate(-0.5),
	                lineDasharray: [1, 0.2],
	            },
	            // cycleway
	            '{bridge-,}way-cycleway:outline': {
	                color: colors.cycle.darken(0.1),
	            },
	            '{bridge-,}way-cycleway': {
	                color: colors.cycle,
	            },
	            'tunnel-way-cycleway:outline': {
	                color: colors.cycle.darken(0.1).saturate(-0.5),
	            },
	            'tunnel-way-cycleway': {
	                color: colors.cycle.darken(0.02).saturate(-0.5),
	                lineDasharray: [1, 0.2],
	            },
	            // cycle streets overlay
	            '{bridge-,tunnel-,}street-{tertiary,tertiary-link,unclassified,residential,livingstreet,pedestrian}-bicycle': {
	                lineJoin: 'round',
	                lineCap: 'round',
	                color: colors.cycle,
	            },
	            // pedestrian
	            'street-pedestrian': {
	                size: { 12: 1, 14: 2, 16: 5, 18: 24, 19: 60, 20: 120 },
	                opacity: { 13: 0, 14: 1 },
	                color: colors.foot,
	            },
	            'street-pedestrian-zone': {
	                color: colors.foot.lighten(0.02).fade(0.75),
	                opacity: { 14: 0, 15: 1 },
	            },
	            // rail, lightrail
	            '{tunnel-,bridge-,}transport-{rail,lightrail}:outline': {
	                color: colors.rail,
	                minzoom: 8,
	                size: { 8: 1, 13: 1, 15: 1, 20: 14 },
	            },
	            '{tunnel-,bridge-,}transport-{rail,lightrail}': {
	                color: colors.rail.lighten(0.25),
	                minzoom: 14,
	                size: { 14: 0, 15: 1, 20: 10 },
	                lineDasharray: [2, 2],
	            },
	            // rail-service, lightrail-service
	            '{tunnel-,bridge-,}transport-{rail,lightrail}-service:outline': {
	                color: colors.rail,
	                minzoom: 14,
	                size: { 14: 0, 15: 1, 16: 1, 20: 14 },
	            },
	            '{tunnel-,bridge-,}transport-{rail,lightrail}-service': {
	                color: colors.rail.lighten(0.25),
	                minzoom: 15,
	                size: { 15: 0, 16: 1, 20: 10 },
	                lineDasharray: [2, 2],
	            },
	            // subway
	            '{tunnel-,bridge-,}transport-subway:outline': {
	                color: colors.subway,
	                size: { 11: 0, 12: 1, 15: 3, 16: 3, 18: 6, 19: 8, 20: 10 },
	            },
	            '{tunnel-,bridge-,}transport-subway': {
	                color: colors.subway.lighten(0.25),
	                size: { 11: 0, 12: 1, 15: 2, 16: 2, 18: 5, 19: 6, 20: 8 },
	                lineDasharray: [2, 2],
	            },
	            // monorail
	            '{tunnel-,bridge-,}transport-{tram,narrowgauge,funicular,monorail}:outline': {
	                minzoom: 15,
	                color: colors.rail,
	                size: { 15: 0, 16: 5, 18: 7, 20: 20 },
	                lineDasharray: [0.1, 0.5],
	            },
	            '{tunnel-,bridge-,}transport-{tram,narrowgauge,funicular,monorail}': {
	                minzoom: 13,
	                size: { 13: 0, 16: 1, 17: 2, 18: 3, 20: 5 },
	                color: colors.rail,
	            },
	            // bridge
	            '{bridge-,}transport-rail:outline': {
	                opacity: { 8: 0, 9: 1 },
	            },
	            '{bridge-,}transport-rail': {
	                opacity: { 14: 0, 15: 1 },
	            },
	            '{bridge-,}transport-{lightrail,subway}:outline': {
	                opacity: { 11: 0, 12: 1 },
	            },
	            '{bridge-,}transport-{lightrail,subway}': {
	                opacity: { 14: 0, 15: 1 },
	            },
	            // tunnel
	            'tunnel-transport-rail:outline': {
	                opacity: { 8: 0, 9: 0.3 },
	            },
	            'tunnel-transport-rail': {
	                opacity: { 14: 0, 15: 0.3 },
	            },
	            'tunnel-transport-{lightrail,subway}:outline': {
	                opacity: { 11: 0, 12: 0.5 },
	            },
	            'tunnel-transport-{lightrail,subway}': {
	                opacity: { 14: 0, 15: 1 },
	            },
	            // ferry
	            'transport-ferry': {
	                minzoom: 10,
	                color: colors.water.darken(0.1),
	                size: { 10: 1, 13: 2, 14: 3, 16: 4, 17: 6 },
	                opacity: { 10: 0, 11: 1 },
	                lineDasharray: [1, 1],
	            },
	            // labels
	            'label-boundary-*': {
	                color: colors.label,
	                font: fonts.regular,
	                textTransform: 'uppercase',
	                textHaloColor: colors.labelHalo,
	                textHaloWidth: 2,
	                textHaloBlur: 1,
	                textAnchor: 'top',
	                textOffset: [0, 0.2],
	                textPadding: 0,
	                textOptional: true,
	            },
	            'label-boundary-country-large': {
	                minzoom: 2,
	                size: { 2: 8, 5: 13 },
	            },
	            'label-boundary-country-medium': {
	                minzoom: 3,
	                size: { 3: 8, 5: 12 },
	            },
	            'label-boundary-country-small': {
	                minzoom: 4,
	                size: { 4: 8, 5: 11 },
	            },
	            'label-boundary-state': {
	                minzoom: 5,
	                color: colors.label.lighten(0.05),
	                size: { 5: 8, 8: 12 },
	            },
	            'label-place-*': {
	                color: colors.label.rotateHue(-15).saturate(1).darken(0.05),
	                font: fonts.regular,
	                textHaloColor: colors.labelHalo,
	                textHaloWidth: 2,
	                textHaloBlur: 1,
	            },
	            'label-place-capital': {
	                minzoom: 5,
	                size: { 5: 12, 10: 16 },
	            },
	            'label-place-statecapital': {
	                minzoom: 6,
	                size: { 6: 11, 10: 15 },
	            },
	            'label-place-city': {
	                minzoom: 7,
	                size: { 7: 11, 10: 14 },
	            },
	            'label-place-town': {
	                minzoom: 9,
	                size: { 8: 11, 12: 14 },
	            },
	            'label-place-village': {
	                minzoom: 11,
	                size: { 9: 11, 12: 14 },
	            },
	            'label-place-hamlet': {
	                minzoom: 13,
	                size: { 10: 11, 12: 14 },
	            },
	            // all the city things
	            'label-place-suburb': {
	                minzoom: 11,
	                size: { 11: 11, 13: 14 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-30).saturate(1).darken(0.05),
	            },
	            'label-place-quarter': {
	                minzoom: 13,
	                size: { 13: 13 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-40).saturate(1).darken(0.05),
	            },
	            'label-place-neighbourhood': {
	                minzoom: 14,
	                size: { 14: 12 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-50).saturate(1).darken(0.05),
	            },
	            'label-motorway-shield': {
	                color: colors.shield,
	                font: fonts.bold,
	                textHaloColor: colors.motorway,
	                textHaloWidth: 0.1,
	                textHaloBlur: 1,
	                symbolPlacement: 'line',
	                textAnchor: 'center',
	                minzoom: 14,
	                size: { 14: 10, 18: 12, 20: 16 },
	            },
	            'label-street-*': {
	                color: colors.label,
	                font: fonts.regular,
	                textHaloColor: colors.labelHalo,
	                textHaloWidth: 2,
	                textHaloBlur: 1,
	                symbolPlacement: 'line',
	                textAnchor: 'center',
	                minzoom: 12,
	                size: { 12: 10, 15: 13 },
	            },
	            'label-address-housenumber': {
	                font: fonts.regular,
	                textHaloColor: colors.building.lighten(0.05),
	                textHaloWidth: 2,
	                textHaloBlur: 1,
	                symbolPlacement: 'point',
	                textAnchor: 'center',
	                minzoom: 17,
	                size: { 17: 8, 19: 10 },
	                color: colors.building.darken(0.3),
	            },
	            // markings
	            'marking-oneway{-reverse,}': {
	                minzoom: 16,
	                image: 'basics:marking-arrow',
	                opacity: { 16: 0, 17: 0.4, 20: 0.4 },
	                font: fonts.regular,
	            },
	            // TODO: bicycle and pedestrian
	            // transit
	            'symbol-*': {
	                iconSize: 1,
	                symbolPlacement: 'point',
	                iconOpacity: 0.7,
	                iconKeepUpright: true,
	                font: fonts.regular,
	                size: 10,
	                color: colors.symbol,
	                iconAnchor: 'bottom',
	                textAnchor: 'top',
	                textHaloColor: colors.labelHalo,
	                textHaloWidth: 2,
	                textHaloBlur: 1,
	            },
	            'symbol-transit-airport': {
	                minzoom: 12,
	                image: 'basics:icon-airport',
	                iconSize: { 12: 0.5, 14: 1 },
	            },
	            'symbol-transit-airfield': {
	                minzoom: 13,
	                image: 'basics:icon-airfield',
	                iconSize: { 13: 0.5, 15: 1 },
	            },
	            'symbol-transit-station': {
	                minzoom: 13,
	                image: 'basics:icon-rail',
	                iconSize: { 13: 0.5, 15: 1 },
	            },
	            'symbol-transit-lightrail': {
	                minzoom: 14,
	                image: 'basics:icon-rail_light',
	                iconSize: { 14: 0.5, 16: 1 },
	            },
	            'symbol-transit-subway': {
	                minzoom: 14,
	                image: 'basics:icon-rail_metro',
	                iconSize: { 14: 0.5, 16: 1 },
	            },
	            'symbol-transit-tram': {
	                minzoom: 15,
	                image: 'basics:transport-tram',
	                iconSize: { 15: 0.5, 17: 1 },
	            },
	            'symbol-transit-bus': {
	                minzoom: 16,
	                image: 'basics:icon-bus',
	                iconSize: { 16: 0.5, 18: 1 },
	            },
	            // TODO: localized symbols? depends on shortbread
	            // pois
	            'poi-*': {
	                minzoom: 16,
	                iconSize: { 16: 0.5, 19: 0.5, 20: 1 },
	                opacity: { 16: 0, 17: 0.4 },
	                symbolPlacement: 'point',
	                iconOptional: true,
	                font: fonts.regular,
	                color: colors.poi,
	            },
	            'poi-amenity': {
	                image: [
	                    'match',
	                    ['get', 'amenity'],
	                    'arts_centre',
	                    'basics:icon-art_gallery',
	                    'atm',
	                    'basics:icon-atm',
	                    'bank',
	                    'basics:icon-bank',
	                    'bar',
	                    'basics:icon-bar',
	                    'bench',
	                    'basics:icon-bench',
	                    'bicycle_rental',
	                    'basics:icon-bicycle_share',
	                    'biergarten',
	                    'basics:icon-beergarden',
	                    'cafe',
	                    'basics:icon-cafe',
	                    'car_rental',
	                    'basics:icon-car_rental',
	                    'car_sharing',
	                    'basics:icon-car_rental',
	                    'car_wash',
	                    'basics:icon-car_wash',
	                    'cinema',
	                    'basics:icon-cinema',
	                    //'clinic', 'basics:icon-clinic',
	                    'college',
	                    'basics:icon-college',
	                    'community_centre',
	                    'basics:icon-community',
	                    //'courthouse', 'basics:icon-courthouse',
	                    'dentist',
	                    'basics:icon-dentist',
	                    'doctors',
	                    'basics:icon-doctor',
	                    'dog_park',
	                    'basics:icon-dog_park',
	                    'drinking_water',
	                    'basics:icon-drinking_water',
	                    'embassy',
	                    'basics:icon-embassy',
	                    'fast_food',
	                    'basics:icon-fast_food',
	                    'fire_station',
	                    'basics:icon-fire_station',
	                    //'food_court', 'basics:icon-food_court',
	                    'fountain',
	                    'basics:icon-fountain',
	                    'grave_yard',
	                    'basics:icon-cemetery',
	                    'hospital',
	                    'basics:icon-hospital',
	                    'hunting_stand',
	                    'basics:icon-huntingstand',
	                    'library',
	                    'basics:icon-library',
	                    'marketplace',
	                    'basics:icon-marketplace',
	                    'nightclub',
	                    'basics:icon-nightclub',
	                    'nursing_home',
	                    'basics:icon-nursinghome',
	                    'pharmacy',
	                    'basics:icon-pharmacy',
	                    'place_of_worship',
	                    'basics:icon-place_of_worship',
	                    'playground',
	                    'basics:icon-playground',
	                    'police',
	                    'basics:icon-police',
	                    'post_box',
	                    'basics:icon-postbox',
	                    'post_office',
	                    'basics:icon-post',
	                    'prison',
	                    'basics:icon-prison',
	                    'pub',
	                    'basics:icon-beer',
	                    //'public_building', 'basics:icon-public_building',
	                    'recycling',
	                    'basics:icon-recycling',
	                    'restaurant',
	                    'basics:icon-restaurant',
	                    'school',
	                    'basics:icon-school',
	                    'shelter',
	                    'basics:icon-shelter',
	                    'telephone',
	                    'basics:icon-telephone',
	                    'theatre',
	                    'basics:icon-theatre',
	                    'toilets',
	                    'basics:icon-toilet',
	                    'townhall',
	                    'basics:icon-town_hall',
	                    //'university', 'basics:icon-university',
	                    'vending_machine',
	                    'basics:icon-vendingmachine',
	                    'veterinary',
	                    'basics:icon-veterinary',
	                    'waste_basket',
	                    'basics:icon-waste_basket',
	                    '',
	                ],
	            },
	            'poi-leisure': {
	                image: [
	                    'match',
	                    ['get', 'leisure'],
	                    'golf_course',
	                    'basics:icon-golf',
	                    'ice_rink',
	                    'basics:icon-icerink',
	                    'pitch',
	                    'basics:icon-pitch',
	                    //'sports_centre', 'basics:icon-sports_centre',
	                    'stadium',
	                    'basics:icon-stadium',
	                    'swimming_pool',
	                    'basics:icon-swimming',
	                    'water_park',
	                    'basics:icon-waterpark',
	                    'basics:icon-sports',
	                ],
	            },
	            'poi-tourism': {
	                image: [
	                    'match',
	                    ['get', 'tourism'],
	                    //'alpine_hut', 'basics:icon-alpine_hut',
	                    //'bed_and_breakfast', 'basics:icon-bed_and_breakfast',
	                    //'camp_site', 'basics:icon-camp_site',
	                    //'caravan_site', 'basics:icon-caravan_site',
	                    'chalet',
	                    'basics:icon-chalet',
	                    //'guest_house', 'basics:icon-guest_house',
	                    //'hostel', 'basics:icon-hostel',
	                    //'hotel', 'basics:icon-hotel',
	                    'information',
	                    'basics:transport-information',
	                    //'motel', 'basics:icon-motel',
	                    'picnic_site',
	                    'basics:icon-picnic_site',
	                    //'theme_park', 'basics:icon-theme_park',
	                    'viewpoint',
	                    'basics:icon-viewpoint',
	                    'zoo',
	                    'basics:icon-zoo',
	                    '',
	                ],
	            },
	            'poi-shop': {
	                image: [
	                    'match',
	                    ['get', 'shop'],
	                    'alcohol',
	                    'basics:icon-alcohol_shop',
	                    'bakery',
	                    'basics:icon-bakery',
	                    'beauty',
	                    'basics:icon-beauty',
	                    'beverages',
	                    'basics:icon-beverages',
	                    //'bicycle', 'basics:icon-bicycle',
	                    'books',
	                    'basics:icon-books',
	                    'butcher',
	                    'basics:icon-butcher',
	                    //'car', 'basics:icon-car',
	                    'chemist',
	                    'basics:icon-chemist',
	                    'clothes',
	                    'basics:icon-clothes',
	                    //'computer', 'basics:icon-computer',
	                    //'convinience', 'basics:icon-convinience',
	                    //'department_store', 'basics:icon-department_store',
	                    'doityourself',
	                    'basics:icon-doityourself',
	                    'dry_cleaning',
	                    'basics:icon-drycleaning',
	                    'florist',
	                    'basics:icon-florist',
	                    'furniture',
	                    'basics:icon-furniture',
	                    'garden_centre',
	                    'basics:icon-garden_centre',
	                    'general',
	                    'basics:icon-shop',
	                    'gift',
	                    'basics:icon-gift',
	                    'greengrocer',
	                    'basics:icon-greengrocer',
	                    'hairdresser',
	                    'basics:icon-hairdresser',
	                    'hardware',
	                    'basics:icon-hardware',
	                    'jewelry',
	                    'basics:icon-jewelry_store',
	                    'kiosk',
	                    'basics:icon-kiosk',
	                    'laundry',
	                    'basics:icon-laundry',
	                    //'mall', 'basics:icon-mall',
	                    //'mobile_phone', 'basics:icon-mobile_phone',
	                    'newsagent',
	                    'basics:icon-newsagent',
	                    'optican',
	                    'basics:icon-optician',
	                    'outdoor',
	                    'basics:icon-outdoor',
	                    'shoes',
	                    'basics:icon-shoes',
	                    'sports',
	                    'basics:icon-sports',
	                    'stationery',
	                    'basics:icon-stationery',
	                    //'supermarket', 'basics:icon-supermarket',
	                    'toys',
	                    'basics:icon-toys',
	                    'travel_agency',
	                    'basics:icon-travel_agent',
	                    'video',
	                    'basics:icon-video',
	                    'basics:icon-shop',
	                ],
	            },
	            'poi-man_made': {
	                image: [
	                    'match',
	                    ['get', 'man_made'],
	                    'lighthouse',
	                    'basics:icon-lighthouse',
	                    'surveillance',
	                    'basics:icon-surveillance',
	                    'tower',
	                    'basics:icon-observation_tower',
	                    //'wastewater_plant', 'basics:icon-wastewater_plant',
	                    //'water_well', 'basics:icon-water_well',
	                    //'water_works', 'basics:icon-water_works',
	                    'watermill',
	                    'basics:icon-watermill',
	                    'windmill',
	                    'basics:icon-windmill',
	                    '',
	                ],
	            },
	            'poi-historic': {
	                image: [
	                    'match',
	                    ['get', 'historic'],
	                    //'archaelogical_site', 'basics:icon-archaelogical_site',
	                    'artwork',
	                    'basics:icon-artwork',
	                    //'battlefield', 'basics:icon-battlefield',
	                    'castle',
	                    'basics:icon-castle',
	                    //'fort', 'basics:icon-fort',
	                    //'memorial', 'basics:icon-memorial',
	                    'monument',
	                    'basics:icon-monument',
	                    //'ruins', 'basics:icon-ruins',
	                    //'wayside_cross', 'basics:icon-wayside_cross',
	                    'wayside_shrine',
	                    'basics:icon-shrine',
	                    'basics:icon-historic',
	                ],
	            },
	            'poi-emergency': {
	                image: [
	                    'match',
	                    ['get', 'emergency'],
	                    'defibrillator',
	                    'basics:icon-defibrillator',
	                    'fire_hydrant',
	                    'basics:icon-hydrant',
	                    'phone',
	                    'basics:icon-emergency_phone',
	                    '',
	                ],
	            },
	            /*
	            'poi-highway': {
	                image: ['match',
	                    ['get', 'highway'],
	                    //'emergency_access_point', 'basics:icon-emergency_access_point',
	                    ''
	                ]
	            },
	            'poi-office': {
	                image: ['match',
	                    ['get', 'office'],
	                    //'diplomatic', 'basics:icon-diplomatic',
	                    ''
	                ]
	            },
	            */
	        };
	    }
	}

	class Eclipse extends Colorful {
	    name = 'Eclipse';
	    constructor() {
	        super();
	        this.transformDefaultColors((color) => color.invertLuminosity());
	    }
	}

	class Graybeard extends Colorful {
	    name = 'Graybeard';
	    constructor() {
	        super();
	        this.transformDefaultColors((color) => color.saturate(-1));
	    }
	}

	class Shadow extends Colorful {
	    name = 'Shadow';
	    constructor() {
	        super();
	        this.transformDefaultColors((color) => color.saturate(-1).invert().brightness(0.2));
	    }
	}

	class Neutrino extends Colorful {
	    name = 'Neutrino';
	    defaultFonts = {
	        regular: 'noto_sans_regular',
	        bold: 'noto_sans_bold',
	    };
	    defaultColors = {
	        /** Color representing land areas. */
	        land: '#f6f0f6',
	        /** Color representing bodies of water such as lakes and rivers. */
	        water: '#cbd2df',
	        /** Color for grassy areas and fields. */
	        grass: '#e7e9e5',
	        /** Color for wooded or forested areas. */
	        wood: '#d9e3d9',
	        /** Color used for agricultural land. */
	        agriculture: '#f8eeee',
	        /** Color for site areas such as parks or recreational facilities. */
	        commercial: '#ebe8e6',
	        /** Primary color for buildings. */
	        building: '#e0d1d9',
	        /** Color for streets and roads. */
	        street: '#ffffff',
	        /** Color used for boundaries, such as national or state lines. */
	        boundary: '#e6ccd8',
	        /** Color for footpaths and pedestrian areas. */
	        foot: '#fef8ff',
	        /** Color used for railways. */
	        rail: '#e8d5e0',
	        /** Primary color used for text labels. */
	        label: '#cbb7b7',
	        // Don't need these colors:
	        buildingbg: '#000',
	        burial: '#000',
	        construction: '#000',
	        cycle: '#000',
	        danger: '#000',
	        disputed: '#000',
	        education: '#000',
	        glacier: '#000',
	        hospital: '#000',
	        industrial: '#000',
	        labelHalo: '#000',
	        leisure: '#000',
	        motorway: '#000',
	        motorwaybg: '#000',
	        park: '#000',
	        parking: '#000',
	        poi: '#000',
	        prison: '#000',
	        residential: '#000',
	        rock: '#000',
	        sand: '#000',
	        shield: '#000',
	        streetbg: '#000',
	        subway: '#000',
	        symbol: '#000',
	        trunk: '#000',
	        trunkbg: '#000',
	        waste: '#000',
	        wetland: '#000',
	    };
	    getStyleRules(options) {
	        const { colors, fonts } = options;
	        return {
	            background: {
	                color: colors.land,
	            },
	            'boundary-{country,state}': {
	                color: colors.boundary,
	            },
	            'boundary-country:outline': {
	                size: { 2: 2, 10: 6 },
	                opacity: { 2: 0, 4: 0.3 },
	                color: colors.land.lighten(0.05),
	                lineBlur: 1,
	            },
	            'boundary-country': {
	                size: { 2: 1, 10: 4 },
	                opacity: { 2: 0, 4: 1 },
	            },
	            'boundary-state:outline': {
	                size: { 7: 3, 10: 5 },
	                opacity: { 7: 0, 8: 0.3 },
	                color: colors.land.lighten(0.05),
	                lineBlur: 1,
	            },
	            'boundary-state': {
	                size: { 7: 2, 10: 3 },
	                opacity: { 7: 0, 8: 1 },
	                lineDasharray: [0, 1.5, 1, 1.5],
	                lineCap: 'round',
	                lineJoin: 'round',
	            },
	            'water-*': {
	                color: colors.water,
	            },
	            'water-area': {
	                opacity: { 4: 0, 6: 1 },
	            },
	            'water-area-*': {
	                opacity: { 4: 0, 6: 1 },
	            },
	            'water-{pier,dam}-area': {
	                color: colors.land,
	                opacity: { 12: 0, 13: 1 },
	            },
	            'water-pier': {
	                color: colors.land,
	            },
	            'land-*': {
	                color: colors.land,
	            },
	            'land-forest': {
	                color: colors.wood,
	                opacity: { 7: 0, 8: 1 },
	            },
	            'land-grass': {
	                color: colors.grass,
	                opacity: { 11: 0, 12: 1 },
	            },
	            'land-{park,garden,vegetation}': {
	                color: colors.grass.darken(0.05).saturate(0.05),
	                opacity: { 11: 0, 12: 1 },
	            },
	            'land-agriculture': {
	                color: colors.agriculture,
	                opacity: { 10: 0, 11: 1 },
	            },
	            'land-{commercial,industrial,residential}': {
	                color: colors.land.darken(0.03),
	                opacity: { 10: 0, 11: 1 },
	            },
	            'site-{bicycleparking,parking}': {
	                color: colors.commercial,
	            },
	            building: {
	                color: colors.building,
	                opacity: { 14: 0, 15: 1 },
	            },
	            bridge: {
	                color: colors.land.darken(0.01),
	            },
	            '{tunnel-,bridge-,}street-*': {
	                color: colors.street,
	                size: 1,
	                lineJoin: 'round',
	                lineCap: 'round',
	            },
	            '{tunnel-,}street-*:outline': {
	                color: colors.street.darken(0.1),
	                lineJoin: 'round',
	                lineCap: 'round',
	            },
	            'tunnel-street-*': {
	                color: colors.street.darken(0.03),
	            },
	            'tunnel-street-*:outline': {
	                color: colors.street.darken(0.13),
	                lineDasharray: [1, 2],
	            },
	            'bridge-street-*:outline': {
	                color: colors.street.darken(0.15),
	            },
	            // motorway
	            '{bridge-street,tunnel-street,street}-motorway:outline': {
	                size: { 5: 2, 10: 5, 14: 5, 16: 14, 18: 38, 19: 84, 20: 168 },
	                opacity: { 5: 0, 6: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-motorway': {
	                size: { 5: 1, 10: 4, 14: 4, 16: 12, 18: 36, 19: 80, 20: 160 },
	                opacity: { 5: 0, 6: 1 },
	            },
	            // trunk
	            '{bridge-street,tunnel-street,street}-trunk:outline': {
	                size: { 7: 2, 10: 4, 14: 6, 16: 12, 18: 36, 19: 74, 20: 144 },
	                opacity: { 7: 0, 8: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-trunk': {
	                size: { 7: 1, 10: 3, 14: 5, 16: 10, 18: 34, 19: 70, 20: 140 },
	                opacity: { 7: 0, 8: 1 },
	            },
	            // primary
	            '{bridge-street,tunnel-street,street}-primary:outline': {
	                size: { 7: 2, 10: 4, 14: 6, 16: 12, 18: 36, 19: 74, 20: 144 },
	                opacity: { 7: 0, 8: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-primary': {
	                size: { 7: 1, 10: 3, 14: 5, 16: 10, 18: 34, 19: 70, 20: 140 },
	                opacity: { 7: 0, 8: 1 },
	            },
	            // secondary
	            '{bridge-street,tunnel-street,street}-secondary:outline': {
	                size: { 11: 2, 14: 5, 16: 8, 18: 30, 19: 68, 20: 138 },
	                opacity: { 11: 0, 12: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-secondary': {
	                size: { 11: 1, 14: 4, 16: 6, 18: 28, 19: 64, 20: 130 },
	                opacity: { 11: 0, 12: 1 },
	            },
	            // links
	            '{bridge-street,tunnel-street,street}-motorway-link:outline': {
	                minzoom: 12,
	                size: { 12: 2, 14: 3, 16: 7, 18: 14, 20: 40 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-motorway-link': {
	                minzoom: 12,
	                size: { 12: 1, 14: 2, 16: 5, 18: 12, 20: 38 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-{trunk,primary,secondary}-link:outline': {
	                minzoom: 13,
	                size: { 12: 2, 14: 3, 16: 7, 18: 14, 20: 40 },
	                opacity: { 13: 0, 14: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-{trunk,primary,secondary}-link': {
	                minzoom: 13,
	                size: { 12: 1, 14: 2, 16: 5, 18: 12, 20: 38 },
	                opacity: { 13: 0, 14: 1 },
	            },
	            // minor streets
	            '{bridge-street,tunnel-street,street}-{tertiary,tertiary-link,unclassified,residential,living_street,pedestrian}:outline': {
	                size: { 12: 2, 14: 3, 16: 6, 18: 26, 19: 64, 20: 128 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-{tertiary,tertiary-link,unclassified,residential,living_street,pedestrian}': {
	                size: { 12: 1, 14: 2, 16: 5, 18: 24, 19: 60, 20: 120 },
	                opacity: { 12: 0, 13: 1 },
	            },
	            // service and tracks
	            '{bridge-street,tunnel-street,street}-{service,track}:outline': {
	                size: { 14: 2, 16: 4, 18: 18, 19: 48, 20: 96 },
	                opacity: { 14: 0, 15: 1 },
	            },
	            '{bridge-street,tunnel-street,street}-{service,track}': {
	                size: { 14: 1, 16: 3, 18: 16, 19: 44, 20: 88 },
	                opacity: { 14: 0, 15: 1 },
	            },
	            // ways, surface only
	            'way-{footway,path,steps}:outline': {
	                size: { 17: 0, 18: 3 },
	                opacity: { 17: 0, 18: 1 },
	                minzoom: 17,
	                color: colors.foot.darken(0.05),
	            },
	            'way-{footway,path,steps}': {
	                size: { 17: 0, 18: 2 },
	                opacity: { 17: 0, 18: 1 },
	                minzoom: 17,
	                color: colors.foot,
	            },
	            'street-pedestrian': {
	                size: { 13: 1, 15: 3 },
	                opacity: { 13: 0, 14: 1 },
	                color: colors.foot,
	            },
	            'street-pedestrian-zone': {
	                color: colors.foot,
	                opacity: { 14: 0, 15: 1 },
	            },
	            // rail
	            '{tunnel-,bridge-,}transport-{rail,lightrail}:outline': {
	                color: colors.rail,
	                size: { 8: 1, 12: 1, 15: 3 },
	            },
	            '{tunnel-,bridge-,}transport-{rail,lightrail}': {
	                color: colors.rail.lighten(0.1),
	                size: { 8: 1, 12: 1, 15: 2 },
	                lineDasharray: [2, 2],
	            },
	            // bridge
	            '{bridge-,}transport-rail:outline': {
	                opacity: { 8: 0, 9: 1 },
	            },
	            '{bridge-,}transport-rail': {
	                opacity: { 14: 0, 15: 1 },
	            },
	            '{bridge-,}transport-lightrail:outline': {
	                opacity: { 11: 0, 12: 1 },
	            },
	            '{bridge-,}transport-lightrail': {
	                opacity: { 14: 0, 15: 1 },
	            },
	            // tunnel
	            'tunnel-transport-rail:outline': {
	                opacity: { 8: 0, 9: 0.3 },
	            },
	            'tunnel-transport-rail': {
	                opacity: { 14: 0, 15: 0.3 },
	            },
	            'tunnel-transport-lightrail:outline': {
	                opacity: { 11: 0, 12: 0.3 },
	            },
	            'tunnel-transport-lightrail': {
	                opacity: { 14: 0, 15: 0.3 },
	            },
	            // labels
	            'label-boundary-*': {
	                color: colors.label,
	                font: fonts.bold,
	                textTransform: 'uppercase',
	                textHaloColor: colors.label.lighten(0.5),
	                textHaloWidth: 0.1,
	                textHaloBlur: 1,
	            },
	            'label-boundary-country-large': {
	                minzoom: 2,
	                size: { 2: 11, 5: 16 },
	            },
	            'label-boundary-country-medium': {
	                minzoom: 3,
	                size: { 3: 11, 5: 15 },
	            },
	            'label-boundary-country-small': {
	                minzoom: 4,
	                size: { 4: 11, 5: 14 },
	            },
	            'label-boundary-state': {
	                minzoom: 5,
	                color: colors.label.lighten(0.05),
	                size: { 5: 8, 8: 12 },
	            },
	            'label-place-*': {
	                color: colors.label.rotateHue(-15).saturate(1).darken(0.05),
	                font: fonts.regular,
	                textHaloColor: colors.label.lighten(0.5),
	                textHaloWidth: 0.1,
	                textHaloBlur: 1,
	                size: 1,
	            },
	            'label-place-capital': {
	                minzoom: 5,
	                size: { 5: 12, 10: 16 },
	            },
	            'label-place-statecapital': {
	                minzoom: 6,
	                size: { 6: 11, 10: 15 },
	            },
	            'label-place-city': {
	                minzoom: 7,
	                size: { 7: 11, 10: 14 },
	            },
	            'label-place-town': {
	                minzoom: 8,
	                size: { 8: 11, 12: 14 },
	            },
	            'label-place-village': {
	                minzoom: 9,
	                size: { 9: 11, 12: 14 },
	            },
	            'label-place-hamlet': {
	                minzoom: 10,
	                size: { 10: 11, 12: 14 },
	            },
	            // all the city things
	            'label-place-suburb': {
	                minzoom: 11,
	                size: { 11: 11, 13: 14 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-30).saturate(1).darken(0.05),
	            },
	            'label-place-quarter': {
	                minzoom: 13,
	                size: { 13: 13 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-40).saturate(1).darken(0.05),
	            },
	            'label-place-neighbourhood': {
	                minzoom: 14,
	                size: { 14: 12 },
	                textTransform: 'uppercase',
	                color: colors.label.rotateHue(-50).saturate(1).darken(0.05),
	            },
	            'label-motorway-shield': {
	                color: colors.label,
	                font: fonts.regular,
	                textHaloColor: colors.label.saturate(-0.5).lighten(0.1),
	                textHaloWidth: 0.1,
	                textHaloBlur: 1,
	                symbolPlacement: 'line',
	                textAnchor: 'center',
	                minzoom: 14,
	                size: { 14: 8, 18: 10, 20: 16 },
	            },
	            'label-street-*': {
	                color: colors.label,
	                font: fonts.regular,
	                textHaloColor: colors.label.saturate(-0.5).lighten(0.1),
	                textHaloWidth: 0.1,
	                textHaloBlur: 1,
	                symbolPlacement: 'line',
	                textAnchor: 'center',
	                minzoom: 12,
	                size: { 12: 10, 15: 13 },
	            },
	        };
	    }
	}

	class Empty extends Colorful {
	    name = 'Empty';
	    getStyleRules(_options) {
	        return {};
	    }
	}

	// import styles
	function getStyleBuilder(styleBuilder) {
	    const fn = function (options) {
	        return new styleBuilder().build(options);
	    };
	    fn.getOptions = () => new styleBuilder().getDefaultOptions();
	    return fn;
	}
	// generate style builders
	const colorful = getStyleBuilder(Colorful);
	getStyleBuilder(Eclipse);
	getStyleBuilder(Graybeard);
	getStyleBuilder(Shadow);
	getStyleBuilder(Neutrino);
	getStyleBuilder(Empty);

	function mergeStyles(style1, style2) {
	  return {
	    sources: {
	      ...style1.sources,
	      ...style2.sources
	    },
	    layers: [...style1.layers ?? [], ...style2.layers ?? []],
	    version: 8
	  };
	}
	function getChoroplethStyle(spec, layerName, choropleth) {
	  const sourceName = "vectorSource";
	  const colors = COLOR_SCHEMES[choropleth.colorScheme];
	  const colorStops = [];
	  const range = choropleth.max - choropleth.min;
	  colors.forEach((color, index) => {
	    const value = choropleth.min + range * index / (colors.length - 1);
	    colorStops.push(value, color);
	  });
	  const fillColor = [
	    "interpolate",
	    ["linear"],
	    ["get", choropleth.field],
	    ...colorStops
	  ];
	  const layers = [];
	  layers.push({
	    id: `${sourceName}-${layerName}-choropleth`,
	    "source-layer": layerName,
	    source: sourceName,
	    type: "fill",
	    filter: ["==", "$type", "Polygon"],
	    paint: {
	      "fill-color": fillColor,
	      "fill-opacity": 0.7,
	      "fill-antialias": true
	    }
	  });
	  layers.push({
	    id: `${sourceName}-${layerName}-outline`,
	    "source-layer": layerName,
	    source: sourceName,
	    type: "line",
	    filter: ["==", "$type", "Polygon"],
	    paint: {
	      "line-color": "#333333",
	      "line-width": 0.5,
	      "line-opacity": 0.5
	    }
	  });
	  const source = { tiles: spec.tiles, type: "vector" };
	  if (spec.minzoom != null) source.minzoom = spec.minzoom;
	  if (spec.maxzoom != null) source.maxzoom = spec.maxzoom;
	  if (spec.attribution != null) source.attribution = spec.attribution;
	  if (spec.scheme != null) source.scheme = spec.scheme;
	  return {
	    version: 8,
	    sources: {
	      [sourceName]: source
	    },
	    layers
	  };
	}
	function getColorStops(choropleth) {
	  const colors = COLOR_SCHEMES[choropleth.colorScheme];
	  const range = choropleth.max - choropleth.min;
	  return colors.map((color, index) => ({
	    value: choropleth.min + range * index / (colors.length - 1),
	    color
	  }));
	}

	function createBackgroundStyle(backgroundMap, baseUrl = "https://tiles.versatiles.org") {
	  const base = {
	    baseUrl,
	    language: "de"
	  };
	  let style;
	  switch (backgroundMap) {
	    case "Colorful":
	      style = colorful(base);
	      break;
	    case "Gray":
	      style = colorful({ ...base, recolor: { saturate: -1 } });
	      break;
	    case "GrayBright":
	      style = colorful({
	        ...base,
	        recolor: { saturate: -1, blendColor: "#ffffff", blend: 0.5 }
	      });
	      break;
	    case "GrayDark":
	      style = colorful({
	        ...base,
	        recolor: { saturate: -1, invertBrightness: true, blendColor: "#000000", blend: 0.5 }
	      });
	      break;
	    case void 0:
	    case "None":
	      style = { version: 8, sources: {}, layers: [] };
	      break;
	    default:
	      throw new Error(`Unknown background map: ${backgroundMap}`);
	  }
	  style.layers = style.layers?.filter((layer) => {
	    switch (layer.id.split(/[-:]/)[0]) {
	      case "street":
	      case "transport":
	      case "symbol":
	      case "poi":
	      case "bridge":
	      case "way":
	      case "tunnel":
	      case "marking":
	        return false;
	      case "background":
	      case "boundary":
	      case "building":
	      case "label":
	      case "airport":
	      case "site":
	      case "land":
	      case "water":
	        return true;
	    }
	    return true;
	  });
	  return style;
	}

	function createStyleFromConfig(config) {
	  const backgroundStyle = createBackgroundStyle(config.background.style);
	  const overlayTilejson = {
	    ...config.overlay.tilejson,
	    // Override tiles to point to local file via versatiles server
	    tiles: [`{versatiles_url}/${config.overlay.source}/{z}/{x}/{y}`]
	  };
	  const overlayStyle = getChoroplethStyle(overlayTilejson, config.overlay.layer, {
	    field: config.choropleth.field,
	    colorScheme: config.choropleth.colorScheme,
	    min: config.choropleth.min,
	    max: config.choropleth.max
	  });
	  return mergeStyles(backgroundStyle, overlayStyle);
	}
	async function initMap(containerId, configUrl, versatilesTileUrl) {
	  const response = await fetch(configUrl);
	  if (!response.ok) {
	    throw new Error(`Failed to load config: ${response.statusText}`);
	  }
	  const config = await response.json();
	  const backgroundStyle = createBackgroundStyle(config.background.style);
	  const overlayTilejson = {
	    ...config.overlay.tilejson,
	    tiles: [`${versatilesTileUrl}/${config.overlay.source}/{z}/{x}/{y}`]
	  };
	  const overlayStyle = getChoroplethStyle(overlayTilejson, config.overlay.layer, {
	    field: config.choropleth.field,
	    colorScheme: config.choropleth.colorScheme,
	    min: config.choropleth.min,
	    max: config.choropleth.max
	  });
	  const style = mergeStyles(backgroundStyle, overlayStyle);
	  const maplibregl = window.maplibregl;
	  const map = new maplibregl.Map({
	    container: containerId,
	    style
	  });
	  if (config.bounds) {
	    const bounds = [
	      [config.bounds[0], config.bounds[1]],
	      [config.bounds[2], config.bounds[3]]
	    ];
	    map.fitBounds(bounds, { padding: 20 });
	  }
	  return map;
	}

	exports.COLOR_SCHEMES = COLOR_SCHEMES;
	exports.COLOR_SCHEME_NAMES = COLOR_SCHEME_NAMES;
	exports.createBackgroundStyle = createBackgroundStyle;
	exports.createStyleFromConfig = createStyleFromConfig;
	exports.getChoroplethStyle = getChoroplethStyle;
	exports.getColorStops = getColorStops;
	exports.initMap = initMap;
	exports.mergeStyles = mergeStyles;

	return exports;

})({});
