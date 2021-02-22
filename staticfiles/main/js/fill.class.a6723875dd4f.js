export default class Fill {
    constructor(canvas, point, color) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        let fillColor = this.hexToRgba(color);
        this.floodFill(point.x, point.y, fillColor)
    }

    floodFill(startX, startY, fillColor) {
        var dstImg = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var dstData = dstImg.data;

        var startPos = this.getPixelPos(startX, startY);
        var startColor = {
            r: dstData[startPos],
            g: dstData[startPos + 1],
            b: dstData[startPos + 2],
            a: dstData[startPos + 3]
        };
        if (this.isMatchingColor(startColor, fillColor)) return;
        var todo = [[startX, startY]];

        while (todo.length) {
            var pos = todo.pop();
            var x = pos[0];
            var y = pos[1];
            var currentPos = this.getPixelPos(x, y);

            while ((y-- >= 0) && this.matchStartColor(dstData, currentPos, startColor)) {
                currentPos -= canvas.width * 4;
            }

            currentPos += canvas.width * 4;
            ++y;
            var reachLeft = false;
            var reachRight = false;

            while ((y++ < canvas.height - 1) && this.matchStartColor(dstData, currentPos, startColor)) {

                this.colorPixel(dstData, currentPos, fillColor);

                if (x > 0) {
                    if (this.matchStartColor(dstData, currentPos - 4, startColor)) {
                        if (!reachLeft) {
                            todo.push([x - 1, y]);
                            reachLeft = true;
                        }
                    }
                    else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < canvas.width - 1) {
                    if (this.matchStartColor(dstData, currentPos + 4, startColor)) {
                        if (!reachRight) {
                            todo.push([x + 1, y]);
                            reachRight = true;
                        }
                    }
                    else if (reachRight) {
                        reachRight = false;
                    }
                }

                currentPos += canvas.width * 4;
            }
        }

        this.context.putImageData(dstImg, 0, 0);
    }

    getPixelPos(x, y) {
        return (y * this.canvas.width + x) * 4;
    }

    matchStartColor(data, pos, startColor) {
        return (data[pos] === startColor.r &&
            data[pos + 1] === startColor.g &&
            data[pos + 2] === startColor.b &&
            data[pos + 3] === startColor.a);
    }

    isMatchingColor(colorA, colorB) {
        return colorA.r === colorB.r && colorA.g === colorB.g &&
            colorA.b === colorB.b && colorA.a === colorB.a;
    }

    colorPixel(data, pos, color) {
        data[pos] = color.r || 0;
        data[pos + 1] = color.g || 0;
        data[pos + 2] = color.b || 0;
        data[pos + 3] = color.a;
        // data[pos + 3] = color.hasOwnProperty("a") ? color.a : 255;
    }

    hexToRgba(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 255
        } : null;
    }
}
