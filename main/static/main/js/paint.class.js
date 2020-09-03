import { TOOL_BRUSH, TOOL_ERASER } from './tool.js';
import getMouseCoordsOnCanvas from './utils.js'

export default class Paint {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = canvas.getContext("2d");
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';

        this.undoStack = [];
        this.redoStack = [];
        this.undoLimit = 10;

        console.log("Paint constructed, canvasId =", canvasId);
    }

    set activeTool(tool) {
        this.tool = tool;
        console.log("Paint set activeTool, this.tool =", this.tool);
    }

    set lineWidth(lineWidth) {
        this._lineWidth = lineWidth;
        this.context.lineWidth = this._lineWidth;
        console.log("Paint set lineWidth, this._lineWidth =", this._lineWidth);
    }

    set selectedColor(color) {
        this.color = color;
        this.context.strokeStyle = this.color;
        console.log("Paint set selectedColor, this.color =", this.color);
    }

    init() {
        this.canvas.onmousedown = e => this.onMouseDown(e);
        // console.log("\n===================================");
        // console.log("Paint mouse listener init");
        // console.log("===================================\n");
    }

    saveContextDict() {
        let props = ['strokeStyle', 'fillStyle', 'globalAlpha', 'lineWidth',
            'lineCap', 'lineJoin', 'miterLimit', 'lineDashOffset', 'shadowOffsetX',
            'shadowOffsetY', 'shadowBlur', 'shadowColor', 'globalCompositeOperation',
            'font', 'textAlign', 'textBaseline', 'direction', 'imageSmoothingEnabled'];
        let state = {}
        for (let prop of props) {
            state[prop] = this.context[prop];
        }

        return state;
    }

    restoreContextDict(state) {
        for (let prop in state) {
            this.context[prop] = state[prop];
        }
    }

    resizeCanvas(width, height) {
        let state = this.saveContextDict();
        this.context.canvas.width = width || canvas.width;
        this.context.canvas.height = height || canvas.height;
        this.restoreContextDict(state);
    }

    onMouseDown(e) {
        let currentCanvas = this.getCurrentCanvas();
        this.undoStack.push(currentCanvas);

        this.canvas.onmousemove = e => this.onMouseMove(e);
        document.onmouseup = e => this.onMouseUp(e);

        this.startPos = getMouseCoordsOnCanvas(e, this.canvas);
        // console.log("\n===================================");
        // console.log("onMouseDown, this.startPos =", this.startPos);
        // console.log("onMouseDown, this.tool =", this.tool);
        // console.log("===================================\n");
        if (this.tool == TOOL_BRUSH) {
            this.context.beginPath();
            this.context.arc(this.startPos.x, this.startPos.y, this.context.lineWidth / 2, 0, 2 * Math.PI);
            this.context.fillStyle = this.color;
            this.context.fill();

            this.context.beginPath();
            this.context.moveTo(this.startPos.x, this.startPos.y);
            this.context.strokeStyle = this.color;

        } else if (this.tool == TOOL_ERASER) {
            this.clearCircle(this.startPos.x, this.startPos.y);
        }
    }

    onMouseMove(e) {
        this.currentPos = getMouseCoordsOnCanvas(e, this.canvas);
        // console.log("\n===================================");
        // console.log("onMouseMove, this.currentPos =", this.currentPos, this);
        // console.log("onMouseMove, this.tool =", this.tool);
        // console.log("===================================\n");
        if (this.tool == TOOL_BRUSH) {
            // console.log("onMouseMove, TOOL_BRUSH branch");        
            this.drawFreeLine(this._lineWidth);
        } else if (this.tool == TOOL_ERASER) {
            this.clearCircle(this.currentPos.x, this.currentPos.y);
        }
    }

    onMouseUp(e) {
        this.canvas.onmousemove = null;
        document.onmouseup = null;
        // console.log("\n===================================");
        // console.log("onMouseUp, this.canvas.onmousemove =", this.canvas.onmousemove);
        // console.log("onMouseUp, document.onmouseup =", document.onmouseup);
        // console.log("===================================\n");
    }

    drawFreeLine(lineWidth) {
        this.context.lineWidth = lineWidth;
        this.context.lineTo(this.currentPos.x, this.currentPos.y);
        this.context.stroke();
        // console.log("\n===================================");
        // console.log("drawFreeLine, lineTo(", this.currentPos.x, ",", this.currentPos.y);
        // console.log("===================================\n");
    }

    clearCircle(x, y) {
        let radius = this.context.lineWidth / 2;
        this.context.save();
        this.context.beginPath();
        this.context.arc(x, y, radius, 0, 2 * Math.PI, true);
        this.context.clip();
        this.context.clearRect(x - radius, y - radius, radius * 2, radius * 2);
        this.context.restore();
    }

    getCurrentCanvas() {
        let currentCanvas = this.context.getImageData(
            0,
            0,
            this.canvas.clientWidth,
            this.canvas.clientHeight
        )
        if (this.undoStack.length >= this.undoLimit) {
            this.undoStack.shift();
        }
        // console.log("undoStack length =", this.undoStack.length);
        // console.log(this.undoStack);

        return currentCanvas;
    }

    undoPaint() {
        if (this.undoStack.length > 0) {
            let currentCanvas = this.getCurrentCanvas();
            this.redoStack.push(currentCanvas);
            let latestImage = this.undoStack.pop();
            this.context.putImageData(latestImage, 0, 0);
            // console.log("undoStack length =", this.undoStack.length);
            // console.log(this.undoStack);
            // console.log("redoStack length =", this.redoStack.length);
            // console.log(this.redoStack);
        }
        else {
            console.log("undoStack empty");
        }
    }

    redoPaint() {
        if (this.redoStack.length > 0) {
            let currentCanvas = this.getCurrentCanvas();
            this.undoStack.push(currentCanvas);
            let latestImage = this.redoStack.pop();
            this.context.putImageData(latestImage, 0, 0);
            // console.log("undoStack length =", this.undoStack.length);
            // console.log(this.undoStack);
            // console.log("redoStack length =", this.redoStack.length);
            // console.log(this.redoStack);
        }
        else {
            console.log("redoStack empty");
        }
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    saveImage() {
        let image = this.canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
        let link = document.createElement("a");
        link.download = "my-image.png";
        link.href = image;
        link.click();
    }
}
