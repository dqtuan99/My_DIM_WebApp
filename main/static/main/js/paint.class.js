import { TOOL_PAINT_BUCKET, TOOL_BRUSH, TOOL_ERASER } from './const/tool.js';
import { getMouseCoordsOnCanvas, saveContextDict, restoreContextDict, roundNumber } from './utils.js'
import Fill from './fill.class.js';

export default class Paint {

    constructor(canvasId, canvasBgId) {
        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');

        this.canvas_bg = new Paint.CanvasBackground(canvasBgId);

        this.current_ratio = 1.0;
        this.origin_size = { w: this.canvas.width, h: this.canvas.height };
        this.upload_scaled_size = { w: this.canvas.width, h: this.canvas.height };
    }

    init() {
        this.canvas.onmousedown = e => this.onMouseDown(e);

        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';

        this.undoStack = [];
        this.redoStack = [];
        this.undoLimit = 20;

        this.temp_canvas = document.createElement('canvas');
        this.temp_context = this.temp_canvas.getContext('2d');
        this.temp_canvas.width = this.canvas.width;
        this.temp_canvas.height = this.canvas.height;
    }

    set currentTool(tool) {
        this.tool = tool;
        if (tool == TOOL_ERASER) {
            this.context.globalCompositeOperation = "destination-out";
            this.context.fillStyle = "rgba(255,255,255,1)";
            this.context.strokeStyle = "rgba(255,255,255,1)";
        } else if (tool == TOOL_BRUSH || tool == TOOL_PAINT_BUCKET) {
            this.context.globalCompositeOperation = "source-over";
            this.context.fillStyle = this.styleColor;
            this.context.strokeStyle = this.styleColor;
        }
    }

    get currentTool() {
        return this.tool;
    }

    set lineWidth(width) {
        this.context.lineWidth = width;
    }

    get lineWidth() {
        return this.context.lineWidth;
    }

    set currentStyle(style) {
        this.styleColor = style;
        this.context.strokeStyle = style;
        this.context.fillStyle = style;
    }

    get currentStyle() {
        return this.context.strokeStyle;
    }

    set originSize(size) {
        this.origin_size.w = size.w;
        this.origin_size.h = size.h;
    }

    scaleCanvasAfterUpload(max_size) {
        let upload_scale = this.calculateUploadScale(max_size);
        this.upload_scaled_size = {
            w: this.origin_size.w / upload_scale,
            h: this.origin_size.h / upload_scale
        };
        let new_size = this.upload_scaled_size;
        this.resizeCanvas(new_size);

        if (typeof this.temp_canvas != 'undefined') {
            this.temp_canvas.width = new_size.w;
            this.temp_canvas.height = new_size.h;
        }
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

    zoomCanvas(step) {
        if (this.current_ratio + step <= 0.5) {
            return;
        } else if (this.current_ratio + step >= 3) {
            return;
        }
        this.current_ratio += step;
        this.current_ratio = roundNumber(this.current_ratio, 2);
        let new_w = this.current_ratio * this.upload_scaled_size.w;
        let new_h = this.current_ratio * this.upload_scaled_size.h;
        let new_size = { w: new_w, h: new_h };
        this.resizeCanvas(new_size);
    }

    resizeCanvas(new_size) {
        let state = saveContextDict(this.context);

        this.canvas.width = new_size.w;
        this.canvas.height = new_size.h;
        if (typeof this.temp_canvas != 'undefined') {
            this.context.drawImage(this.temp_canvas, 0, 0, this.canvas.width, this.canvas.height);
        }

        restoreContextDict(this.context, state);
        this.canvas_bg.query.css({
            'width': new_size.w,
            'height': new_size.h
        });
    }

    onMouseDown(e) {
        if (e.which == 3) {
            return;
        }
        this.undoStack.push(this.get_current_canvas_data());

        if (this.tool != TOOL_PAINT_BUCKET) {
            this.canvas.onmousemove = e => this.onMouseMove(e);
        }
        document.onmouseup = e => this.onMouseUp(e);

        this.startPos = getMouseCoordsOnCanvas(e, this.canvas);
        if (this.tool == TOOL_BRUSH || this.tool == TOOL_ERASER) {
            this.context.beginPath();
            this.context.arc(
                this.startPos.x,
                this.startPos.y,
                this.context.lineWidth / 2, 0, 2 * Math.PI
            );
            this.context.fill();

            this.context.beginPath();
            this.context.moveTo(this.startPos.x, this.startPos.y);

        } else if (this.tool == TOOL_PAINT_BUCKET) {
            new Fill(this.canvas, this.startPos, this.context.strokeStyle);
        }
    }

    onMouseMove(e) {
        this.currentPos = getMouseCoordsOnCanvas(e, this.canvas);
        if (this.tool == TOOL_BRUSH || this.tool == TOOL_ERASER) {
            this.drawFreeLine();
        }
    }

    onMouseUp(e) {
        this.canvas.onmousemove = null;
        document.onmouseup = null;

        this.context.closePath();

        this.update_temp_canvas();
    }

    drawFreeLine() {
        this.context.lineTo(this.currentPos.x, this.currentPos.y);
        this.context.stroke();
    }

    get_current_canvas_data() {
        let temp_canvas = document.createElement('canvas');
        temp_canvas.width = this.canvas.width;
        temp_canvas.height = this.canvas.height;
        temp_canvas.getContext('2d').drawImage(this.canvas, 0, 0);

        if (this.undoStack.length >= this.undoLimit) {
            this.undoStack.shift();
        }

        return temp_canvas;
    }

    put_current_canvas_data(src_canvas) {
        this.clear_canvas();
        this.context.drawImage(src_canvas, 0, 0, this.canvas.width, this.canvas.height);
    }

    undoPaint() {
        if (this.undoStack.length <= 0) {
            return;
        }
        this.redoStack.push(this.get_current_canvas_data());
        let lastest_canvas = this.undoStack.pop();
        this.put_current_canvas_data(lastest_canvas);
        this.update_temp_canvas();
    }

    redoPaint() {
        if (this.redoStack.length <= 0) {
            return;
        }
        this.undoStack.push(this.get_current_canvas_data());
        let lastest_canvas = this.redoStack.pop();
        this.put_current_canvas_data(lastest_canvas);
        this.update_temp_canvas();
    }

    update_temp_canvas() {
        if (typeof this.temp_canvas != 'undefined') {
            this.temp_canvas.width = this.temp_canvas.width;
            this.temp_context.drawImage(this.canvas, 0, 0, this.temp_canvas.width, this.temp_canvas.height);
        }
    }

    clear_canvas() {
        let state = saveContextDict(this.context);
        this.canvas.width = this.canvas.width;
        restoreContextDict(this.context, state);
    }

    restartCanvas() {
        if (typeof this.temp_canvas != 'undefined') {
            this.temp_canvas.width = this.temp_canvas.width;
            this.undoStack = [];
            this.redoStack = [];
        }
        this.current_ratio = 1.0;
        this.resizeCanvas(this.upload_scaled_size);
    }

    isBlankCanvas() {
        const pixelBuffer = new Uint32Array(
            this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data.buffer
        );

        return !pixelBuffer.some(color => color !== 0);
    }

    getCanvasDataURL() {
        let w = this.origin_size.w;
        let h = this.origin_size.h;
        let scaledUpCanvas = document.createElement('canvas');
        scaledUpCanvas.width = w;
        scaledUpCanvas.height = h;
        scaledUpCanvas.getContext('2d').drawImage(this.canvas, 0, 0, w, h);
        let image_b64 = scaledUpCanvas.toDataURL("image/png", 1.0);

        return image_b64;
    }

}

Paint.CanvasBackground = class _ {

    constructor(canvasBgId) {
        this.query = $(canvasBgId);
        this.current_src = this.query.attr('src');
    }

    get source() {
        return this.current_src;
    }

    set source(src) {
        this.current_src = src;
        this.query.attr('src', src);
    }

    get output_img() {
        return this.extracted_img;
    }

    set output_img(img) {
        this.extracted_img = img;
    }
}
