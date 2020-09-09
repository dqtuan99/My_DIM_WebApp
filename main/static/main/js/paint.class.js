import { TOOL_PAINT_BUCKET ,TOOL_BRUSH, TOOL_ERASER } from './tool.js';
import getMouseCoordsOnCanvas from './utils.js'
import Fill from './fill.class.js';

export default class Paint {
    
    constructor(canvasId, canvasBgId) {
        this.canvas = document.getElementById(canvasId);
        this.context = canvas.getContext('2d');
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';

        this.canvas_bg = new Paint.CanvasBackground(canvasBgId);

        this.undoStack = [];
        this.redoStack = [];
        this.undoLimit = 20;

        this.isFinished = false;
    }

    set activeTool(tool) {
        this.tool = tool;
    }

    set lineWidth(lineWidth) {
        this._lineWidth = lineWidth;
        this.context.lineWidth = this._lineWidth;
    }

    set selectedColor(color) {
        this.color = color;
        this.context.strokeStyle = this.color;
    }

    set finishedDrawing(isFinished) {
        this.isFinished = isFinished;
    }

    init() {
        this.canvas.onmousedown = e => this.onMouseDown(e);
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
        let scale = this.canvas_bg.scale;
        let state = this.saveContextDict();
        this.context.canvas.width = width / scale;
        this.context.canvas.height = height / scale;
        this.restoreContextDict(state);
        this.undoStack = [];
        this.redoStack = [];
    }

    onMouseDown(e) {
        if (e.which == 3 || this.isFinished) {
            return;
        }

        this.undoStack.push(this.getCurrentCanvas());

        if (this.tool != TOOL_PAINT_BUCKET) {
            this.canvas.onmousemove = e => this.onMouseMove(e);
        }
        document.onmouseup = e => this.onMouseUp(e);

        this.startPos = getMouseCoordsOnCanvas(e, this.canvas);
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
        } else if (this.tool == TOOL_PAINT_BUCKET) {
            // new Fill(this.canvas, this.startPos, {r:127,g:252,b:3});
            new Fill(this.canvas, this.startPos, this.color);
        }
    }

    onMouseMove(e) {
        this.currentPos = getMouseCoordsOnCanvas(e, this.canvas);
        if (this.tool == TOOL_BRUSH) {     
            this.drawFreeLine(this._lineWidth);
        } else if (this.tool == TOOL_ERASER) {
            this.clearCircle(this.currentPos.x, this.currentPos.y);
        }
    }

    onMouseUp(e) {
        this.canvas.onmousemove = null;
        document.onmouseup = null;
    }

    drawFreeLine(lineWidth) {
        this.context.lineWidth = lineWidth;
        this.context.lineTo(this.currentPos.x, this.currentPos.y);
        this.context.stroke();
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

        return currentCanvas;
    }

    undoPaint() {
        if (this.undoStack.length <= 0) {
            return;
        }
        this.redoStack.push(this.getCurrentCanvas());
        let latestImage = this.undoStack.pop();
        this.context.putImageData(latestImage, 0, 0);
    }

    redoPaint() {
        if (this.redoStack.length <= 0) {
            return;
        }
        this.undoStack.push(this.getCurrentCanvas());
        let latestImage = this.redoStack.pop();
        this.context.putImageData(latestImage, 0, 0);
    }

    clearCanvas() {
        this.undoStack = [];
        this.redoStack = [];
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.isFinished = false;
    }

    isBlankCanvas() {
        const pixelBuffer = new Uint32Array(
            this.context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        );
    
        return !pixelBuffer.some(color => color !== 0);
    }

    getCanvasDataURL() {
        let w = this.canvas_bg.origin_w;
        let h = this.canvas_bg.origin_h;
        let scaledUpCanvas = document.createElement('canvas');
        scaledUpCanvas.width = w;
        scaledUpCanvas.height = h;
        let scaledUpContext = scaledUpCanvas.getContext('2d');
        scaledUpContext.drawImage(this.canvas, 0, 0, w, h);
        let image = scaledUpCanvas.toDataURL("image/png", 1.0);

        return image;
    }

}

Paint.CanvasBackground = class _ {

    constructor(canvasBgId) {
        this.query = $(canvasBgId);
        this.input_img_b64 = '';
        this.bg_extracted_img_b64 = '';
        this.current_src = this.query.attr('src');
        this.scale = 1.0;
    }

    get input_img() {
        return this.input_img_b64;
    }

    set input_img(input_img) {
        this.input_img_b64 = input_img;
    }

    get bg_extracted_img() {
        return this.bg_extracted_img_b64;
    }

    set bg_extracted_img(bg_extracted_img) {
        this.bg_extracted_img_b64 = bg_extracted_img;
    }

    get src() {
        return this.current_src;
    }

    setOriginSize(w, h) {
        this.origin_w = w;
        this.origin_h = h;
    }

    setImgSource(src) {
        this.current_src = src;
        this.query.attr('src', src);
    }

    scaleDownImg(origin_w, origin_h) {  
        this.query.css({            
            'width': origin_w / this.scale + 'px',
            'height': origin_h / this.scale + 'px',  
        });
    }

    setScale(max_w, max_h) {
        this.scale = 1.0;
        let resized = false;
        if (this.origin_w > max_w) {
            var w_scale = this.origin_w / max_w;
            resized = true;
        }
        if (this.origin_h > max_h) {
            var h_scale = this.origin_h / max_h;
            resized = true;
        }
        if (resized) {
            this.scale = w_scale > h_scale ? w_scale : h_scale;
        }
    }
}
