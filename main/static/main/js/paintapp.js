import { TOOL_BRUSH, TOOL_DRAGGER } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas', '#canvas-background');
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 25;
paint.selectedColor = '#7F7F7F';
paint.init();

let canvasCursor = $('.canvas-cursor');

let draggable = $('#draggable');
let imageLoader = $('#imageLoader');

let loading = $('.loading-animation');

let tools = $('[data-tool]');
let undo = $('[data-command="undo"]');
let redo = $('[data-command="redo"]');
let restart = $('[data-result="restart"]');
let brush_size = $('#brushSize');
let predict = $('[data-result="predict"]');
let download = $('[data-result="download"]');

let defaultCanvasPosition = draggable.position();

let MAX_WIDTH = Math.floor($(window).width() * 0.7);
let MAX_HEIGHT = Math.floor($(window).height() * 0.7);

$(document).ready(() => {
    loading.hide();

    draggable.draggable({
        cancel: '#canvas',
        scroll: false,
        disabled: true,
        start: (e, ui) => {
            restart.addClass('clickable');
        }
    });

    activeDraggableDiv(false);

    imageLoader.change((e) => {
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

    undo.click(() => {
        if (!isClickable(undo)) {
            return;
        }
        paint.undoPaint();
    });
    redo.click(() => {
        if (!isClickable(redo)) {
            return;
        }
        paint.redoPaint();
    });

    tools.click((e) => {
        if (!isClickable($(e.currentTarget))) {
            return;
        }
        $('[data-tool].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let selectedTool = e.currentTarget.getAttribute('data-tool');
        paint.activeTool = selectedTool;
        if (selectedTool == TOOL_DRAGGER) {
            activeDraggableDiv(true);
        } else {
            activeDraggableDiv(false);
        }
    });

    restart.click(() => {
        if (!isClickable(restart)) {
            return;
        }
        if (paint.isFinished) {
            paint.canvas_bg.setImgSource(paint.canvas_bg.input_img);
        }
        restartCanvas();
    });

    predict.click(() => {
        if (!isClickable(predict)) {
            return;
        }
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

            tools.each((idx, elm) => {
                activeClickableGUI($(elm), false);
            });
            activeClickableGUI(download, true);
            activeClickableGUI(predict, false);
            activeClickableGUI(undo, false);
            activeClickableGUI(redo, false);
        })
        .catch(error => console.log(error));
    });

    download.click(() => {
        let link = document.createElement("a");
        link.download = "my-image.png";
        link.href = paint.canvas_bg.bg_extracted_img;
        link.click();
    });

    $('[type="number"]').keypress((e) => {
        e.preventDefault();
    });
    brush_size.change(() => {
        canvasCursor.css({
            'width': brush_size.val() + 'px',
            'height': brush_size.val() + 'px',
        });
        paint.lineWidth = brush_size.val();
    });

});

$(document).click(() => {
    if (paint.isFinished) {
        return;
    }
    activeClickableGUI(undo, paint.undoStack.length != 0);
    activeClickableGUI(redo, paint.redoStack.length != 0);
    activeClickableGUI(restart, !(paint.isBlankCanvas() && defaultCanvasPosition.top == draggable.position().top && defaultCanvasPosition.left == draggable.position().left));
    activeClickableGUI(predict, !(paint.canvas_bg.src == '' || paint.isBlankCanvas()));
});
$(document).keypress(() => {
    if (paint.isFinished) {
        return;
    }
    activeClickableGUI(undo, paint.undoStack.length != 0);
    activeClickableGUI(redo, paint.redoStack.length != 0);
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
            canvasCursor.css({
                'top': '-1000px',
                'left': '-1000px',
            });
            isOutsideWindow = true;
        }
        return;
    }
    canvasCursor.css({
        'width': brush_size.val() + 'px',
        'height': brush_size.val() + 'px',
        'top': e.pageY + 'px',
        'left': e.pageX + 'px',
    });
    isOutsideWindow = false;
});

function activeDraggableDiv(isDraggable) {
    if (isDraggable) {
        draggable.draggable('enable');
        draggable.css({
            'border': 'solid red 1px',
            'cursor': 'grab',
        });
        draggable.mousedown(() => {
            draggable.css({
                'cursor': 'grabbing',
            });
        })
        draggable.mouseup(() => {
            draggable.css({
                'cursor': 'grab',
            });
        })
        $('#canvas').css({
            'cursor': 'not-allowed',
        })
    } else {
        draggable.draggable('disable');
        draggable.css({
            'border': 'none',
            'cursor': 'default',
        });
        $('#canvas').css({
            'cursor': 'none',
        })
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
    draggable.css({
        'top': defaultCanvasPosition.top + 'px',
        'left': defaultCanvasPosition.left + 'px',
    });
    activeClickableGUI(restart, false);
    tools.each((idx, elm) => {
        activeClickableGUI($(elm), true);
    });
    activeClickableGUI(download, false);

    paint.canvas_bg.bg_extracted_img = '';
    paint.clearCanvas();
}