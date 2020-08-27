import Point from './point.model.js';

export default class Fill {
    constructor(canvas, point, color) {
        this.context = canvas.getContext("2d");
        this.imageData = this.context.getImageData(
            0,
            0,
            this.context.canvas.width,
            this.context.canvas.height);
        const targetColor = this.getPixelColor(point);
        console.log(targetColor);
        const fillColor = this.hexToRgba(color);

        this.fillStack = [];
        this.floodFill(point, targetColor, fillColor);
        this.fillColor();
    }

    floodFill(point, targetColor, fillColor) {
        if (this.isMatchingColor(targetColor, fillColor)) return;

        const currentColor = this.getPixelColor(point);
        if (this.isMatchingColor(currentColor, targetColor)) {
            this.setPixelColor(point, fillColor);
            this.fillStack.push([new Point(point.x + 1, point.y), targetColor, fillColor])
            this.fillStack.push([new Point(point.x - 1, point.y), targetColor, fillColor])
            this.fillStack.push([new Point(point.x, point.y + 1), targetColor, fillColor])
            this.fillStack.push([new Point(point.x, point.y - 1), targetColor, fillColor])
        }
    }

    fillColor() {
        if (this.fillStack.length) {
            let len = this.fillStack.length;
            for (let i = 0; i < len; ++i) {
                this.floodFill(this.fillStack[i][0], this.fillStack[i][1], this.fillStack[i][2]);
            }

            this.fillStack.splice(0, len);
            this.fillColor();
        } else {
            this.context.putImageData(this.imageData, 0, 0);
            this.fillStack = [];
        }
    }

    isMatchingColor(colorA, colorB) {
        return colorA[0] === colorB[0] && colorA[1] === colorB[1] &&
               colorA[2] === colorB[2] && colorA[3] === colorB[3];
    }

    getPixelColor(point) {
        if (point.x < 0 ||
            point.y < 0 ||
            point.x >= this.imageData.width,
            point.y >= this.imageData.height) {
            return [-1, -1, -1, -1];
        } else {
            const index = (point.y * this.imageData.width + point.x) * 4;

            return [
                this.imageData.data[index + 0],
                this.imageData.data[index + 1],
                this.imageData.data[index + 2],
                this.imageData.data[index + 3]
            ]
        }
    }

    setPixelColor(point, fillColor) {
        const index = (point.y * this.imageData.width + point.x) * 4;
        this.imageData.data[index + 0] = fillColor[0]; // r
        this.imageData.data[index + 1] = fillColor[1]; // g
        this.imageData.data[index + 2] = fillColor[2]; // b
        this.imageData.data[index + 3] = fillColor[3]; // alpha
    }

    hexToRgba(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
            255,
        ];
    }
}
