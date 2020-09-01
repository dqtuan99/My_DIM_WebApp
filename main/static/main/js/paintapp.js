import { TOOL_BRUSH } from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint('canvas');
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 25;
paint.selectedColor = '#7F7F7F';
paint.init();

$('#imageLoader').change( (e) => {
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

$(document).ready( () => {

    $('[data-command="undo"]').click( () => {
        paint.undoPaint();
    });

    $('[data-command="redo"]').click( () => {
        paint.redoPaint();
    });

    $('[data-tool]').click( (e) => {
        $('[data-tool].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        let selectedTool = e.currentTarget.getAttribute('data-tool');
        paint.activeTool = selectedTool;
    });

    $('#brushSize').change( () => {
        $('.canvas-cursor').css({
            'width': $('#brushSize').val() + 'px',
            'height': $('#brushSize').val() + 'px',
        });
        paint.lineWidth = $('#brushSize').val();
    })

    $(window).mousemove( (e) => {
        let isOutsideWindow = false;
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
