/*
ported from https://github.com/Dens49/blurhash-js

MIT License

Copyright (c) 2020 Dennis Bystrow
Copyright (c) 2022 superilu@yahoo.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var digitCharacters = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F",
    "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
    "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
    "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "#", "$",
    "%", "*", "+", ",", "-", ".", ":", ";", "=", "?", "@", "[", "]", "^", "_", "{",
    "|", "}", "~"
];

function decode83(str) {
    var value = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str[i];
        var digit = digitCharacters.indexOf(c);
        value = value * 83 + digit;
    }
    return value;
}

function validateBlurhash(blurhash) {
    if (!blurhash || blurhash.length < 6) {
        throw new Error(
            "The blurhash string must be at least 6 characters"
        );
    }

    var sizeFlag = decode83(blurhash[0]);
    var numY = Math.floor(sizeFlag / 9) + 1;
    var numX = (sizeFlag % 9) + 1;

    if (blurhash.length !== 4 + 2 * numX * numY) {
        throw new Error("blurhash length mismatch: length is " + blurhash.length + " but it should be " + (4 + 2 * numX * numY));
    }
}

function sign(n) { return (n < 0 ? -1 : 1); }

function signPow(val, exp) { return sign(val) * Math.pow(Math.abs(val), exp); }

function sRGBToLinear(value) {
    var v = value / 255;
    if (v <= 0.04045) {
        return v / 12.92;
    } else {
        return Math.pow((v + 0.055) / 1.055, 2.4);
    }
};

function linearTosRGB(value) {
    var v = Math.max(0, Math.min(1, value));
    if (v <= 0.0031308) {
        return Math.round(v * 12.92 * 255 + 0.5);
    } else {
        return Math.round(
            (1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5
        );
    }
};

function decodeDC(value) {
    var intR = value >> 16;
    var intG = (value >> 8) & 255;
    var intB = value & 255;
    return [sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB)];
};

function decodeAC(value, maximumValue) {
    var quantR = Math.floor(value / (19 * 19));
    var quantG = Math.floor(value / 19) % 19;
    var quantB = value % 19;

    var rgb = [
        signPow((quantR - 9) / 9, 2.0) * maximumValue,
        signPow((quantG - 9) / 9, 2.0) * maximumValue,
        signPow((quantB - 9) / 9, 2.0) * maximumValue
    ];

    return rgb;
};

/**
 * @param {String} blurhash
 * @param {Number} width
 * @param {Number} height
 * @param {Number} punch
 * @returns {Bitmap}
 */
function BluhashDecode(blurhash, width, height, punch) {
    validateBlurhash(blurhash);

    punch = punch | 1;

    var sizeFlag = decode83(blurhash[0]);
    var numY = Math.floor(sizeFlag / 9) + 1;
    var numX = (sizeFlag % 9) + 1;

    var quantisedMaximumValue = decode83(blurhash[1]);
    var maximumValue = (quantisedMaximumValue + 1) / 166;

    var colors = new Array(numX * numY);

    for (var i = 0; i < colors.length; i++) {
        if (i === 0) {
            var value = decode83(blurhash.substring(2, 6));
            colors[i] = decodeDC(value);
        } else {
            var value = decode83(
                blurhash.substring(4 + i * 2, 6 + i * 2)
            );
            colors[i] = decodeAC(value, maximumValue * punch);
        }
    }

    var img = new Bitmap(width, height);
    SetRenderBitmap(img);
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var r = 0;
            var g = 0;
            var b = 0;

            for (var j = 0; j < numY; j++) {
                for (var i = 0; i < numX; i++) {
                    var basis =
                        Math.cos((Math.PI * x * i) / width) *
                        Math.cos((Math.PI * y * j) / height);
                    var color = colors[i + j * numX];
                    r += color[0] * basis;
                    g += color[1] * basis;
                    b += color[2] * basis;
                }
            }

            var intR = linearTosRGB(r);
            var intG = linearTosRGB(g);
            var intB = linearTosRGB(b);

            Plot(x, y, Color(intR, intG, intB));
        }
    }
    SetRenderBitmap(null);
    return img;
};


// export functions and version
exports.__VERSION__ = 1;
exports.BluhashDecode = BluhashDecode;
