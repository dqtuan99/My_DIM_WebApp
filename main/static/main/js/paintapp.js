import { TOOL_BRUSH, TOOL_DRAGGER } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas');
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 25;
paint.selectedColor = '#7F7F7F';
paint.init();

let canvasCursor = $('.canvas-cursor');

let draggable = $('#draggable');
let imageLoader = $('#imageLoader');
let canvas_background = $('#canvas-background');

let tools = $('[data-tool]');
let command_undo = $('[data-command="undo"]');
let command_redo = $('[data-command="redo"]');
let command_restart = $('[data-result="restart"]');
let brush_size = $('#brushSize');
let predict = $('[data-result="predict"]');
let download = $('[data-result="download"]');

let defaultCanvasPosition = draggable.position();
let canvasBgBase64 = '';
let finalResult = '';

$(document).ready(() => {

    draggable.draggable({
        cancel: '#canvas',
        scroll: false,
        disabled: true,
        start: (e, ui) => {
            command_restart.addClass('clickable');
        }
    });

    activeDraggableDiv(false);

    imageLoader.change((e) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                paint.resizeCanvas(img.width, img.height);
                restartCanvas();
            }
            img.src = event.target.result;
            canvasBgBase64 = event.target.result;
            canvas_background.attr('src', img.src);
        }
        reader.readAsDataURL(e.target.files[0]);
    });

    command_undo.click(() => {
        if (!isClickable(command_undo)) {
            return;
        }
        paint.undoPaint();
    });
    command_redo.click(() => {
        if (!isClickable(command_redo)) {
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

    command_restart.click(() => {
        if (!isClickable(command_restart)) {
            return;
        }
        if (paint.isFinished) {
            canvas_background.attr('src', canvasBgBase64);
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
                'input_image': canvasBgBase64,
                'input_trimap': paint.getCanvasDataURL(),
            })
        })
        .then(response => response.json())
        .then(result => {
            // console.log(result);
            finalResult = result;
            canvas_background.attr('src', result);
            paint.clearCanvas();
            paint.finishedDrawing = true;
            tools.each((idx, elm) => {
                activeClickableGUI($(elm), finalResult == '');
            });
            activeClickableGUI(download, finalResult != '');
            activeClickableGUI(predict, false);
            activeClickableGUI(command_undo, false);
            activeClickableGUI(command_redo, false);
        })
        .catch(error => console.log(error));
    });

    download.click(() => {
        let link = document.createElement("a");
        link.download = "my-image.png";
        link.href = finalResult;
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
    activeClickableGUI(command_undo, paint.undoStack.length != 0);
    activeClickableGUI(command_redo, paint.redoStack.length != 0);
    activeClickableGUI(command_restart, !(paint.isBlankCanvas() && defaultCanvasPosition.top == draggable.position().top && defaultCanvasPosition.left == draggable.position().left));
    activeClickableGUI(predict, !(canvas_background.attr('src') == '' || paint.isBlankCanvas()));
});
$(document).keypress(() => {
    if (paint.isFinished) {
        return;
    }
    activeClickableGUI(command_undo, paint.undoStack.length != 0);
    activeClickableGUI(command_redo, paint.redoStack.length != 0);
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
    command_restart.removeClass('clickable');
    draggable.css({
        'top': defaultCanvasPosition.top + 'px',
        'left': defaultCanvasPosition.left + 'px',
    });
    paint.clearCanvas();
    finalResult = '';
    tools.each((idx, elm) => {
        activeClickableGUI($(elm), true);
    });
    activeClickableGUI(download, true);
}