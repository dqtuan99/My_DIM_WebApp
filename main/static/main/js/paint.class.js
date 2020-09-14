import { TOOL_PAINT_BUCKET, TOOL_BRUSH, TOOL_ERASER } from './tool.js';
import { getMouseCoordsOnCanvas, saveContextDict, restoreContextDict } from './utils.js'
import Fill from './fill.class.js';

export default class Paint {

    constructor(canvasId, canvasBgId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');

        this.canvas_bg = new Paint.CanvasBackground(canvasBgId);

        this.current_ratio = 1.0;
        this.origin_size = { w: this.canvas.width, h: this.canvas.height };
        this.upload_scaled_size = { w: this.canvas.width, h: this.canvas.height };
        this.current_size = { w: this.canvas.width, h: this.canvas.height };

        this.delay_zoom;
    }

    init() {
        this.canvas.onmousedown = e => this.onMouseDown(e);

        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';

        this.undoStack = [];
        this.redoStack = [];
        this.undoLimit = 20;

        this.isFinished = false;

        this.temp_canvas = document.createElement('canvas');
        this.temp_context = this.temp_canvas.getContext('2d');
        this.temp_canvas.width = this.current_size.w;
        this.temp_canvas.height = this.current_size.h;
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

    set originSize(size) {
        this.origin_size.w = size.w;
        this.origin_size.h = size.h;
    }

    calculateUploadScale(max_size) {
        let upload_scale = 1.0;
        let scaled = false;
        let scale = { w: 1.0, h: 1.0 };
        if (this.origin_size.w > max_size.w) {
            scale.w = this.origin_size.w / max_size.w;
            scaled = true;
        }
        if (this.origin_size.h > max_size.h) {
            scale.h = this.origin_size.h / max_size.h;
            scaled = true;
        }
        if (scaled) {
            upload_scale = scale.w > scale.h ? scale.w : scale.h;
        }

        return upload_scale;
    }

    scaleCanvasAfterUpload(max_size) {
        let upload_scale = this.calculateUploadScale(max_size);
        this.upload_scaled_size = {
            w: this.origin_size.w / upload_scale,
            h: this.origin_size.h / upload_scale
        };
        this.current_size = this.upload_scaled_size;
        this.updateCurrentSize();
        
        if (typeof this.temp_canvas != 'undefined') {
            this.temp_canvas.width = this.current_size.w;
            this.temp_canvas.height = this.current_size.h;
        }
    }

    zoomCanvas(step) {
        if (this.current_ratio + step <= 0.4) {
            return;
        } else if (this.current_ratio + step >= 2.5) {
            return;
        }
        this.current_ratio += step;
        this.current_ratio = Math.round((this.current_ratio + Number.EPSILON) * 100) / 100;
        let new_w = this.current_ratio * this.upload_scaled_size.w;
        let new_h = this.current_ratio * this.upload_scaled_size.h;
        this.current_size = { w: new_w, h: new_h };
        this.updateCurrentSize();
    }

    updateCurrentSize() {
        let state = saveContextDict(this.context);

        this.canvas.width = this.current_size.w;
        this.canvas.height = this.current_size.h;
        if (typeof this.temp_canvas != 'undefined') {
            this.context.drawImage(this.temp_canvas, 0, 0, this.canvas.width, this.canvas.height);
        }
        // if (typeof this.undoStack != 'undefined') {
        //     if (this.undoStack.length > 0) {
        //         this.context.drawImage(
        //             this.current_canvas_data, 
        //             0, 
        //             0, 
        //             this.current_size.w, 
        //             this.current_size.h
        //         );
        //     }
        // }

        restoreContextDict(this.context, state);
        this.canvas_bg.query.css({
            'width': this.current_size.w,
            'height': this.current_size.h
        });
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
            this.context.arc(
                this.startPos.x, 
                this.startPos.y, 
                this.context.lineWidth / 2, 0, 2 * Math.PI
            );
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

        if (typeof this.temp_canvas != 'undefined') {
            this.temp_context.drawImage(this.canvas, 0, 0, this.temp_canvas.width, this.temp_canvas.height);
        }
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
        this.current_ratio = 1.0;
        this.temp_context.clearRect(0, 0, this.temp_canvas.width, this.temp_canvas.height);
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

    set currentSrc(src) {
        this.current_src = src;
        this.query.attr('src', src);
    }

}
