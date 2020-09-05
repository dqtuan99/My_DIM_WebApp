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

let toolbox_command_undo = $('[data-command="undo"]');
let toolbox_command_redo = $('[data-command="redo"]');
let toolbox_command_restart = $('[data-result="restart"]');

let toolbox_tool_brushSize = $('#brushSize');

let toolbox_result_predict = $('[data-result="predict"]');

let defaultCanvasPosition = draggable.position();
let canvasBgBase64 = '';

$(document).ready(() => {

    draggable.draggable({
        cancel: '#canvas',
        scroll: false,
        disabled: true,
        start: (e, ui) => {
            toolbox_command_restart.addClass('clickable');
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

    toolbox_command_undo.click(() => {
        paint.undoPaint();
    });
    toolbox_command_redo.click(() => {
        paint.redoPaint();
    });

    $('[data-tool]').click((e) => {
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

    toolbox_command_restart.click(() => {
        restartCanvas();
    });

    toolbox_result_predict.click(() => {
        if (canvas_background.attr('src') == '' || paint.isBlankCanvas()) {
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
            canvas_background.attr('src', result);
            paint.clearCanvas();
        })
        .catch(error => console.log(error));
    });

    $('[type="number"]').keypress((e) => {
        e.preventDefault();
    });
    toolbox_tool_brushSize.change(() => {
        canvasCursor.css({
            'width': toolbox_tool_brushSize.val() + 'px',
            'height': toolbox_tool_brushSize.val() + 'px',
        });
        paint.lineWidth = toolbox_tool_brushSize.val();
    });

});

$(document).click(() => {
    activeClickableGUI(toolbox_command_undo, paint.undoStack.length != 0);
    activeClickableGUI(toolbox_command_redo, paint.redoStack.length != 0);
    activeClickableGUI(toolbox_command_restart, !(paint.isBlankCanvas() && defaultCanvasPosition.top == draggable.position().top && defaultCanvasPosition.left == draggable.position().left));
    activeClickableGUI(toolbox_result_predict, !(canvas_background.attr('src') == '' || paint.isBlankCanvas()))
});
$(document).keypress(() => {
    activeClickableGUI(toolbox_command_undo, paint.undoStack.length != 0);
    activeClickableGUI(toolbox_command_redo, paint.redoStack.length != 0);
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
        'width': toolbox_tool_brushSize.val() + 'px',
        'height': toolbox_tool_brushSize.val() + 'px',
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

function activeClickableGUI(query, activeCondition) {
    if (activeCondition) {
        query.addClass('clickable');
    } else {
        query.removeClass('clickable');
    }
}

function restartCanvas() {
    toolbox_command_restart.removeClass('clickable');
    draggable.css({
        'top': defaultCanvasPosition.top + 'px',
        'left': defaultCanvasPosition.left + 'px',
    });
    paint.clearCanvas();
}