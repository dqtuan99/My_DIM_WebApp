import { TOOL_BRUSH, TOOL_DRAGGER } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas');
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 25;
paint.selectedColor = '#7F7F7F';
paint.init();

$('#imageLoader').change((e) => {
    let reader = new FileReader();
    reader.onload = (event) => {
        let img = new Image();
        img.onload = () => {
            paint.resizeCanvas(img.width, img.height);
            paint.undoStack = [];
        }
        img.src = event.target.result;
        $('#canvas-background').attr('src', img.src);
    }
    reader.readAsDataURL(e.target.files[0]);
});

$(document).ready(() => {

    console.log($(document).width());

    let defaultCanvasPosition = $('#draggable').position();

    updateDraggableDiv(false);

    $('[data-command="undo"]').click(() => {
        paint.undoPaint();
    });

    $('[data-command="redo"]').click(() => {
        paint.redoPaint();
    });

    $('[data-tool]').click((e) => {
        $('[data-tool].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let selectedTool = e.currentTarget.getAttribute('data-tool');
        paint.activeTool = selectedTool;
        if (selectedTool == TOOL_DRAGGER) {
            updateDraggableDiv(true);
        } else {
            updateDraggableDiv(false);
        }
    });

    $('[data-result="restart"]').click( (e) => {
        $('#draggable').css({
            'top': defaultCanvasPosition.top + 'px',
            'left': defaultCanvasPosition.left + 'px',
        });
        paint.clearCanvas();
    });

    $('#brushSize').change(() => {
        $('.canvas-cursor').css({
            'width': $('#brushSize').val() + 'px',
            'height': $('#brushSize').val() + 'px',
        });
        paint.lineWidth = $('#brushSize').val();
    })
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

    $('[type="number"]').keypress(function (evt) {
        evt.preventDefault();
    });

});

function updateDraggableDiv(isDraggable) {
    if (isDraggable) {
        $('#draggable').draggable({
            cancel: '#canvas',
            scroll: false,
            disabled: false,
        });
        $('#draggable').css({
            'border': 'solid red 1px',
            'cursor': 'move',
        });
    } else {
        $('#draggable').draggable({
            cancel: '#canvas',
            scroll: false,
            disabled: true,
        });
        $('#draggable').css({
            'border': 'none',
            'cursor': 'default',
        });
    }
}