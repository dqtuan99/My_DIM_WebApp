import { TOOL_BRUSH, TOOL_DRAGGER } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas');
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 25;
paint.selectedColor = '#7F7F7F';
paint.init();



$(document).ready(() => {

    $('#draggable').draggable({
        cancel: '#canvas',
        scroll: false,
        disabled: true,
        start: (e, ui) => {
            $('[data-result="restart"]').addClass('clickable');
        }
    });

    activeDraggableDiv(false);

    $(window).click(() => {
        activeClickableGUI($('[data-command="undo"]'), paint.undoStack.length != 0);
        activeClickableGUI($('[data-command="redo"]'), paint.redoStack.length != 0);
        activeClickableGUI($('[data-result="restart"]'), !isBlankCanvas(paint.context));
    });
    $(window).keypress(() => {
        activeClickableGUI($('[data-command="undo"]'), paint.undoStack.length != 0);
        activeClickableGUI($('[data-command="redo"]'), paint.redoStack.length != 0);
    });

    $('#imageLoader').change((e) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                paint.resizeCanvas(img.width, img.height);
            }
            img.src = event.target.result;
            $('#canvas-background').attr('src', img.src);
        }
        reader.readAsDataURL(e.target.files[0]);
        $('[data-result="predict"]').addClass('clickable');
    });

    $('[data-command="undo"]').click(() => {
        paint.undoPaint();
    });
    $('[data-command="redo"]').click(() => {
        paint.redoPaint();
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

    let defaultCanvasPosition = $('#draggable').position();
    $('[data-result="restart"]').click((e) => {
        $('[data-result="restart"]').removeClass('clickable');
        $('#draggable').css({
            'top': defaultCanvasPosition.top + 'px',
            'left': defaultCanvasPosition.left + 'px',
        });
        paint.clearCanvas();
    });

    $('[data-result="predict"]').click((e) => {
        if ($('#canvas-background').attr('src') == "") {
            return;
        }
        fetch('http://127.0.0.1:8000/API/test/', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'canvas': paint.getCanvasDataURL(),
            })
        }).then(res => res.json())
            .then(res => console.log(res));
    });

    $('[type="number"]').keypress((e) => {
        e.preventDefault();
    });
    $('#brushSize').change(() => {
        $('.canvas-cursor').css({
            'width': $('#brushSize').val() + 'px',
            'height': $('#brushSize').val() + 'px',
        });
        paint.lineWidth = $('#brushSize').val();
    });

    $(window).mousemove((e) => {
        let isOutsideWindow = false;
        if (paint.tool == TOOL_DRAGGER) {
            return;
        }
        if (e.target.id != 'canvas') {
            if (!isOutsideWindow) {
                $('.canvas-cursor').css({
                    'top': '-1000px',
                    'left': '-1000px',
                });
                isOutsideWindow = true;
            }
            return;
        }
        $('.canvas-cursor').css({
            'width': $('#brushSize').val() + 'px',
            'height': $('#brushSize').val() + 'px',
            'top': e.pageY + 'px',
            'left': e.pageX + 'px',
        });
        isOutsideWindow = false;
    });

});

function activeDraggableDiv(isDraggable) {
    if (isDraggable) {
        $('#draggable').draggable('enable');
        $('#draggable').css({
            'border': 'solid red 1px',
            'cursor': 'move',
        });
    } else {
        $('#draggable').draggable('disable');
        $('#draggable').css({
            'border': 'none',
            'cursor': 'default',
        });
    }
}

function activeClickableGUI(query, activeCondition) {
    if (activeCondition) {
        query.addClass('clickable');
    } else {
        query.removeClass('clickable');
    }
}

function isBlankCanvas(canvasContext) {
    const pixelBuffer = new Uint32Array(
        canvasContext.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );

    return !pixelBuffer.some(color => color !== 0);
}