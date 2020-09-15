import { TOOL_BRUSH, TOOL_DRAGGER, TOOL_ERASER, TOOL_PAINT_BUCKET } from './tool.js';
import { COLOR_UNCERTAIN } from './tool.js';
import Paint from './paint.class.js';
import { getMouseCoordsOnCanvas, roundNumber } from './utils.js';

let paint = new Paint('canvas', '#canvas-background');
let paint2 = new Paint('canvas2', '#canvas-background2');

let $draggable;
let $draggable2;

let defaultCanvasPosition;

let MAX_WIDTH = $(window).width() * 0.7;
let MAX_HEIGHT = $(window).height() * 0.7;

let translateX = 0;
let translateY = 0;

$(window).load(() => {
    defaultCanvasPosition = $draggable.position();
    defaultCanvasPosition.top = Math.floor(defaultCanvasPosition.top);
    defaultCanvasPosition.left = Math.floor(defaultCanvasPosition.left);

    $draggable.css({
        'top': defaultCanvasPosition.top,
        'left': defaultCanvasPosition.left
    });

    $draggable2.css({
        'top': defaultCanvasPosition.top,
        'left': defaultCanvasPosition.left
    });
})

$(document).ready(() => {

    paint.activeTool = TOOL_BRUSH;
    paint.lineWidth = 25;
    paint.selectedColor = COLOR_UNCERTAIN;
    paint.init();

    let $canvasCursor = $('.canvas-cursor');
    let $canvasCursor2 = $('.canvas-cursor2');

    let $loading = $('.loading-animation');
    $loading.hide();

    let $tools = $('[data-tool]');
    let $colors = $('[data-color]');

    let $restart = $('[data-result="restart"]');
    let $brush_size = $('#brushSize');
    let $predict = $('[data-result="predict"]');
    let $download = $('[data-result="download"]');

    $draggable = $('#draggable');
    $draggable2 = $('#draggable2');

    let draggableOptions = {
        disabled: true,
        scroll: false,
        containment: '.left .containment-area',
        start: (e, ui) => {
            activeClickableGUI($restart, true);
        },
        drag: (e, ui) => {
            $draggable2.css({
                'top': ui.position.top,
                'left': ui.position.left
            });
        }
    }
    let draggable2Options = {
        disabled: false,
        scroll: false,
        containment: '.right .containment-area',
        start: (e, ui) => {
            activeClickableGUI($restart, true);
        },
        drag: (e, ui) => {
            $draggable.css({
                'top': ui.position.top,
                'left': ui.position.left
            });
        }
    }

    $draggable.draggable(draggableOptions);
    $draggable2.draggable(draggable2Options);

    $draggable2.css('cursor', 'grab');
    $draggable2.mousedown(() => {
        $draggable.css('cursor', 'grabbing');
    });
    $draggable2.mouseup(() => {
        $draggable.css('cursor', 'grab');
    });
    $(paint2.canvas).css('cursor', 'grab');
    $(paint2.canvas).mousedown(() => {
        $(paint2.canvas).css('cursor', 'grabbing');
    });
    $(paint2.canvas).mouseup(() => {
        $(paint2.canvas).css('cursor', 'grab');
    });

    activeDraggableDiv(false);

    $canvasCursor.css({
        'width': $brush_size.val() + 'px',
        'height': $brush_size.val() + 'px',
    });
    $canvasCursor2.css({
        'width': $brush_size.val() + 'px',
        'height': $brush_size.val() + 'px',
    });

    $('#imageLoader').change((e) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                paint.originSize = { w: img.width, h: img.height };
                paint.scaleCanvasAfterUpload({ w: MAX_WIDTH, h: MAX_HEIGHT });

                paint2.origin_size = paint.origin_size;
                paint2.scaleCanvasAfterUpload({ w: MAX_WIDTH, h: MAX_HEIGHT });

                restartCanvas();
            }
            img.src = event.target.result;

            paint.canvas_bg.input_img = img.src;
            paint.canvas_bg.currentSrc = img.src;

            paint2.canvas_bg.input_img = img.src;
            paint2.canvas_bg.currentSrc = img.src;
        }
        reader.readAsDataURL(e.target.files[0]);
    });

    $tools.click((e) => {
        if (!isClickable($(e.currentTarget))) {
            return;
        }
        $('[data-tool].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let selectedTool = e.currentTarget.getAttribute('data-tool');
        paint.activeTool = selectedTool;
        if (selectedTool == TOOL_DRAGGER) {
            activeDraggableDiv(true);
            $brush_size.prop('disabled', true);
        } else if (selectedTool == TOOL_PAINT_BUCKET) {
            activeDraggableDiv(false);

            $brush_size.prop('disabled', true);

            $(paint.canvas).css('cursor', 'url("static/main/image/paint-bucket-cursor.svg") 32 32, auto');
            $(paint.canvas).click(() => {
                $(paint.canvas).css('cursor', 'url("static/main/image/paint-bucket-cursor.svg") 32 32, auto');
            });
            $canvasCursor.css({
                'width': '10px',
                'height': '10px',
            });
            $canvasCursor2.css({
                'width': '10px',
                'height': '10px',
            });
        } else {
            activeDraggableDiv(false);

            $brush_size.prop('disabled', false);

            $(paint.canvas).css('cursor', 'none');
            $(paint.canvas).click(() => {
                $(paint.canvas).css('cursor', 'none');
            });
            $canvasCursor.css({
                'width': $brush_size.val() + 'px',
                'height': $brush_size.val() + 'px',
            });
            $canvasCursor2.css({
                'width': $brush_size.val() + 'px',
                'height': $brush_size.val() + 'px',
            });

            if (selectedTool == TOOL_ERASER) {
                $canvasCursor.css('background-color', 'transparent');
                $canvasCursor2.css('background-color', 'transparent');
            } else if (selectedTool == TOOL_BRUSH) {            
                $canvasCursor.css('background-color', paint.color);
                $canvasCursor2.css('background-color', paint.color);
            }
        }
    });

    $colors.click((e) => {
        if (!isClickable($(e.currentTarget))) {
            return;
        }
        $('[data-color].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let currentColor = e.currentTarget.getAttribute('data-color');
        paint.selectedColor = currentColor;
        if (paint.tool == TOOL_ERASER) {
            return;
        }
        $canvasCursor.css('background-color', currentColor);
        $canvasCursor2.css('background-color', currentColor);
    });

    $restart.click(() => {
        if (!isClickable($restart)) {
            return;
        }
        if (paint.isFinished) {
            paint.canvas_bg.setImgSource(paint.canvas_bg.input_img);
        }
        restartCanvas();
    });

    $predict.click(() => {
        if (!isClickable($predict)) {
            return;
        }
        $loading.show();

        fetch('http://127.0.0.1:8000/API/predict-bg2/', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'input_image': paint.canvas_bg.input_img,
                'input_trimap': paint.getCanvasDataURL(),
            })
        })
            .then(response => response.json())
            .then(result => {
                // console.log(result);
                paint.canvas_bg.bg_extracted_img = result;
                paint.canvas_bg.setImgSource(result);
                paint.clearCanvas();
                paint.finishedDrawing = true;

                $tools.each((idx, elm) => {
                    activeClickableGUI($(elm), false);
                }); // TODO
                activeClickableGUI($download, true);
                activeClickableGUI($predict, false);

                $loading.hide();
            })
            .catch(error => {
                $loading.hide();
                alert(error);
            });
    });

    $download.click(() => {
        let link = document.createElement("a");
        link.$download = "my-image.png";
        link.href = paint.canvas_bg.bg_extracted_img;
        link.click();
    });

    $('[type="number"]').keypress((e) => {
        e.preventDefault();
    });
    $brush_size.change(() => {
        $canvasCursor.css({
            'width': $brush_size.val() + 'px',
            'height': $brush_size.val() + 'px',
        });
        $canvasCursor2.css({
            'width': $brush_size.val() + 'px',
            'height': $brush_size.val() + 'px',
        });
        paint.lineWidth = $brush_size.val();
    });

    $(document).click(() => {
        if (paint.isFinished) {
            return;
        }
        activeClickableGUI($restart, !(paint.isBlankCanvas() && Number($draggable.css('top').split('px')[0]) == defaultCanvasPosition.top && Number($draggable.css('left').split('px')[0]) == defaultCanvasPosition.left));
        activeClickableGUI($predict, !(paint.canvas_bg.src == '' || paint.isBlankCanvas()));
        $colors.each((idx, elm) => {
            activeClickableGUI($(elm), paint.tool != TOOL_ERASER);
        }); 
    });

    $(document).bind('keypress', (e) => {
        // console.log(e.which);
        if (e.which === 26) {
            // ctrl z
            paint.undoPaint();
        } else if (e.which === 25) {
            // ctrl y
            paint.redoPaint();
        }
    });

    $('#draggable, #draggable2').bind('mousewheel', (e) => {
        activeClickableGUI($restart, true);
        var step = 0.1;
        let previous_ratio = paint.current_ratio;
        if (e.originalEvent.wheelDelta / 120 > 0) {
            // console.log('left scrolling up !');
            paint.zoomCanvas(step);
            paint2.zoomCanvas(step);
        }
        else {
            // console.log('left scrolling down !');
            paint.zoomCanvas(-step);
            paint2.zoomCanvas(-step);
        }

        if (previous_ratio == paint.current_ratio) {
            return;
        }

        let current_canvas_pos = getMouseCoordsOnCanvas(e, paint.canvas);
        let currentX = current_canvas_pos.x;
        let currentY = current_canvas_pos.y;
        let originX = paint.canvas.width / 2;
        let originY = paint.canvas.height / 2;

        let dx = currentX - originX;
        let dy = currentY - originY;

        let scale = paint.current_ratio / previous_ratio;

        let dy_prime = dy * scale;
        let dx_prime = dx * scale;
        let correctionX = dx - dx_prime;
        let correctionY = dy - dy_prime;
    
        let overflowX = 0;
        let overflowY = 0;

        let afterzoom_pos = {
            x: $draggable.position().left + correctionX,
            y: $draggable.position().top + correctionY
        };

        if (afterzoom_pos.x < 0) {
            overflowX = afterzoom_pos.x;
        } else if (afterzoom_pos.x > $(window).width()/2) {
            overflowX = afterzoom_pos.x - $(window).width()/2;
        }
        if (afterzoom_pos.y < 0) {
            overflowY = afterzoom_pos.y;
        } else if (afterzoom_pos.y > $(window).height()) {
            overflowY = afterzoom_pos.y - $(window).height();
        }

        // console.log('==========================================================');
        // console.log('afterzoom position =', afterzoom_pos.x, afterzoom_pos.y);
        // console.log('window size = ',$(window).width()/2, $(window).height()/2);
        // console.log('overflow = ', overflowX, overflowY);

        correctionX = roundNumber(correctionX - overflowX, 0);
        correctionY = roundNumber(correctionY - overflowY, 0);

        translateX += correctionX;
        translateY += correctionY;

        $('.drag-area').css(
            'transform', `translate(${translateX}px, ${translateY}px)`
        );

        // console.log('correction = ', correctionX, correctionY);
        // console.log('==========================================================');
    });

    $(document).mousemove((e) => {
        if (paint.tool == TOOL_DRAGGER) {
            return;
        }
        let isOutsideWindow = false;
        if (e.target.id != 'canvas') {
            if (!isOutsideWindow) {
                $canvasCursor.css({
                    'top': '-1000px',
                    'left': '-1000px',
                });
                $canvasCursor2.css({
                    'top': '-1000px',
                    'left': '-1000px',
                });
                isOutsideWindow = true;
            }
            return;
        }
        $canvasCursor.css({
            'top': e.pageY + 'px',
            'left': e.pageX + 'px',
        });
        if (e.target.id == 'canvas') {
            $canvasCursor2.css({
                'top': e.pageY + 'px',
                'left': e.pageX + $(window).width()/2 + 'px',
            });
        }
        isOutsideWindow = false;
    });

    function activeDraggableDiv(isDraggable) {
        if (isDraggable) {
            $draggable.draggable('enable');

            $draggable.css('cursor', 'grab');
            $draggable.mousedown(() => {
                $draggable.css('cursor', 'grabbing');
            });
            $draggable.mouseup(() => {
                $draggable.css('cursor', 'grab');
            });

            $(paint.canvas).css('cursor', 'grab');
            $(paint.canvas).mousedown(() => {
                $(paint.canvas).css('cursor', 'grabbing');
            });
            $(paint.canvas).mouseup(() => {
                $(paint.canvas).css('cursor', 'grab');
            });
        } else {
            $draggable.draggable('disable');

            $draggable.css('cursor', 'default');
            $draggable.mousedown(() => {
                $draggable.css('cursor', 'default');
            });
            $draggable.mouseup(() => {
                $draggable.css('cursor', 'default');
            });

            $(paint.canvas).css('cursor', 'none');
            $(paint.canvas).mousedown(() => {
                $(paint.canvas).css('cursor', 'none');
            });
            $(paint.canvas).mouseup(() => {
                $(paint.canvas).css('cursor', 'none');
            });
        }
    }

    function isClickable(query) {
        if (query.attr('class').split(' ').includes('clickable')) {
            return true;
        } else {
            return false;
        }
    }

    function activeClickableGUI(query, activeCondition) {
        if (activeCondition) {
            query.addClass('clickable');
        } else {
            query.removeClass('clickable');
        }
    }

    function restartCanvas() {
        activeClickableGUI($restart, false);
        $tools.each((idx, elm) => {
            activeClickableGUI($(elm), true);
        }); // TODO
        activeClickableGUI($download, false);

        paint.canvas_bg.bg_extracted_img = ''; // TODO
        paint.clearCanvas();
        paint2.clearCanvas();
        $draggable.css({
            'top': defaultCanvasPosition.top + 'px',
            'left': defaultCanvasPosition.left + 'px'
        });
        $draggable2.css({
            'top': defaultCanvasPosition.top + 'px',
            'left': defaultCanvasPosition.left + 'px'
        });
        translateX = 0.0;
        translateY = 0.0;
        $('.drag-area').css(
            'transform', `translate(0px, 0px)`
        );
    }

});

