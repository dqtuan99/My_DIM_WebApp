import { TOOL_BRUSH, TOOL_DRAGGER, TOOL_PAINT_BUCKET } from './tool.js';
import { COLOR_UNCERTAIN } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas', '#canvas-background');
let $draggable;
let $draggable2;

let defaultCanvasPosition;

let MAX_WIDTH = screen.availWidth * 0.7;
let MAX_HEIGHT = screen.availHeight * 0.7;

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
        scrool: false,
        containment: '.left .containment-area',
        start: (e, ui) => {
            $restart.addClass('clickable');
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
        scrool: false,
        containment: '.right .containment-area',
        start: (e, ui) => {
            $restart.addClass('clickable');
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
                paint.canvas_bg.setOriginSize(img.width, img.height);
                paint.canvas_bg.setScale(MAX_WIDTH, MAX_HEIGHT);
                paint.canvas_bg.scaleDownImg(img.width, img.height);
                paint.resizeCanvas(img.width, img.height);
                restartCanvas();
            }
            img.src = event.target.result;
            paint.canvas_bg.input_img = img.src;
            paint.canvas_bg.setImgSource(img.src);
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
            $('#canvas').css({
                'cursor': 'url("static/main/image/paint-bucket-cursor.svg") 32 32, auto',
            });
            $brush_size.val(7);
        } else {
            activeDraggableDiv(false);
            $brush_size.prop('disabled', false);
            $brush_size.val(paint._lineWidth);
        }
    });

    $colors.click((e) => {
        if (!isClickable($colors)) {
            return;
        }
        $('[data-color].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let currentColor = e.currentTarget.getAttribute('data-color');
        paint.selectedColor = currentColor;
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
                });
                activeClickableGUI($download, true);
                activeClickableGUI($predict, false);

                $loading.hide();
            })
            .catch(error => {
                alert(error);
                $loading.hide()
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
        $canvasCursor2.css({
            'top': e.pageY + 'px',
            'left': e.pageX + screen.availWidth * 0.5 + 'px',
        });
        isOutsideWindow = false;
    });

    function activeDraggableDiv(isDraggable) {
        let $all_draggable_elements = $('#draggable, #draggable2');
        let $all_canvas_elements = $('#canvas, #canvas2');
        let $both = $('#draggable, #draggable2, #canvas, #canvas2');
        if (isDraggable) {
            $all_draggable_elements.draggable('enable');
            $both.css('cursor', 'grab');
            $both.mousedown(() => {
                $both.css('cursor', 'grabbing');
            });
            $both.mouseup(() => {
                $both.css('cursor', 'grab');
            });
        } else {
            $all_draggable_elements.draggable('disable');
            $all_draggable_elements.css('cursor', 'default');
            $all_draggable_elements.mousedown(() => {
                $all_draggable_elements.css('cursor', 'default');
            });
            $all_draggable_elements.mouseup(() => {
                $all_draggable_elements.css('cursor', 'default');
            });
            $all_canvas_elements.css('cursor', 'none');
            $all_canvas_elements.mousedown(() => {
                $all_canvas_elements.css('cursor', 'none');
            });
            $all_canvas_elements.mouseup(() => {
                $all_canvas_elements.css('cursor', 'none');
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
        });
        activeClickableGUI($download, false);

        paint.canvas_bg.bg_extracted_img = '';
        paint.clearCanvas();
        $draggable.css({
            'top': defaultCanvasPosition.top + 'px',
            'left': defaultCanvasPosition.left + 'px'
        });
    }

});

