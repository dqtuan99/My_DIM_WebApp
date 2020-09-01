import { TOOL_BRUSH, TOOL_PAINT_BUCKET, TOOL_ERASER } from './tool.js';
import getMouseCoordsOnCanvas from './utils.js'

export default class Paint {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.context = canvas.getContext("2d");
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';

        this.undoStack = [];
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
        this.addImageToStack();

        this.canvas.onmousemove = e => this.onMouseMove(e);
        document.onmouseup = e => this.onMouseUp(e);

        this.startPos = getMouseCoordsOnCanvas(e, this.canvas);
        console.log("\n===================================");
        console.log("onMouseDown, this.startPos =", this.startPos);
        console.log("onMouseDown, this.tool =", this.tool);
        console.log("===================================\n");
        if (this.tool == TOOL_BRUSH) {
            // console.log("onMouseDown, TOOL_BRUSH branch");
            // this.context.beginPath();
            // this.context.moveTo(this.startPos.x, this.startPos.y);            
            // this.context.strokeStyle = this.color;

            this.context.beginPath();
            this.context.arc(this.startPos.x, this.startPos.y, this.context.lineWidth / 2, 0, 2 * Math.PI);
            this.context.fillStyle = this.color;
            this.context.fill();

            this.context.beginPath();
            this.context.moveTo(this.startPos.x, this.startPos.y);
            this.context.strokeStyle = this.color;

        } else if (this.tool == TOOL_ERASER) {
            this.context.clearRect(
                this.startPos.x, this.startPos.y,
                this._lineWidth, this._lineWidth);
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
            // console.log("onMouseMove, not TOOL_BRUSH branch");
            this.context.clearRect(
                this.currentPos.x, this.currentPos.y,
                this._lineWidth, this._lineWidth);
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

    addImageToStack() {
        this.savedData = this.context.getImageData(
            0,
            0,
            this.canvas.clientWidth,
            this.canvas.clientHeight
        )
        if (this.undoStack.length >= this.undoLimit) {
            this.undoStack.shift();
        }
        this.undoStack.push(this.savedData);
    }

    undoPaint() {
        if (this.undoStack.length > 0) {
            let latestImage = this.undoStack[this.undoStack.length - 1];
            console.log("latestImage = ", latestImage);
            this.canvas.width = latestImage.width;
            this.canvas.height = latestImage.height;
            this.context.putImageData(latestImage, 0, 0);
            this.undoStack.pop();
        }
        else {
            console.log("undoStack empty");
        }
    }

    saveImage() {
        let image = this.canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
        let link = document.createElement("a");
        link.download = "my-image.png";
        link.href = image;
        link.click();
    }
}
