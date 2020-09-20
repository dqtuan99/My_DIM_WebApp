import { 
    TOOL_BRUSH, TOOL_DRAGGER, 
    TOOL_ERASER, TOOL_PAINT_BUCKET,
} from './const/tool.js';
import { COLOR_UNCERTAIN } from './const/color.js';
import { TOGGLE_OFF_URL, TOGGLE_ON_URL } from './const/icon.url.js';
import Paint from './paint.class.js';
import { getMouseCoordsOnCanvas, roundNumber } from './utils.js';

let paint = new Paint('canvas', '#canvas-background');
let paint2 = new Paint('canvas2', '#canvas-background2');

let $draggable;
let $draggable2;

let defaultCanvasPosition;

let $loading = $('.loading-animation');
let $main_app = $('.main-app');


$(window).load(() => {

    // Setup some elements init state
    //====================================================
    defaultCanvasPosition = $draggable.position();
    defaultCanvasPosition.top = Math.floor(defaultCanvasPosition.top) + 50;
    defaultCanvasPosition.left = Math.floor(defaultCanvasPosition.left);

    $draggable.css({
        'top': defaultCanvasPosition.top,
        'left': defaultCanvasPosition.left
    });

    $draggable2.css({
        'top': defaultCanvasPosition.top,
        'left': defaultCanvasPosition.left
    });

    $main_app.hide();
    $loading.hide()
    //====================================================

})

$(document).ready(() => {

    // Initialize
    //=======================================================
    paint.currentTool = TOOL_BRUSH;
    paint.lineWidth = 25;
    paint.currentStyle = COLOR_UNCERTAIN;
    paint.init();

    let $drop_zone = $('.drop-zone');
    let $image_uploader = $('.drop-zone input');

    let $canvasCursor = $('.canvas-cursor');

    let $tools = $('[data-tool]');
    let $colors = $('[data-color]');

    let $clear = $('[data-result="clear"');
    let $restart = $('[data-result="restart"]');
    let $brush_size = $('#brushSize');
    let $predict = $('[data-result="predict"]');
    let $toggle_original = $('[data-result="toggle"]');
    let $download = $('[data-result="download"]');

    let MAX_WIDTH = $(window).width() * 0.7;
    let MAX_HEIGHT = $(window).height() * 0.7;

    let translateX = 0;
    let translateY = 0;

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

    let cursor_type = {
        css: 'grab',
        mousedown: 'grabbing',
        mouseup: 'grab'
    };
    setup_cursor_click_effect($draggable2, cursor_type);
    setup_cursor_click_effect($(paint2.canvas), cursor_type);

    activeDraggableDiv(false);

    $canvasCursor.css({
        'width': $brush_size.val() + 'px',
        'height': $brush_size.val() + 'px',
    });
    //=======================================================

    // Drag and drop upload handler
    //====================================================
    $drop_zone.on("dragenter dragstart dragend dragleave dragover drag drop", (e) => {
        e.preventDefault();
    });

    $drop_zone.on('dragenter', (e) => {
        $drop_zone.addClass('drop-zone--over');
    });

    $drop_zone.on('dragleave', (e) => {
        $drop_zone.removeClass('drop-zone--over');
    });

    $drop_zone.on('drop', (e) => {
        $drop_zone.removeClass('drop-zone--over');

        let dropped_files = e.originalEvent.dataTransfer.files;
        if (dropped_files.length) {
            if (dropped_files[0].type.startsWith('image/')) {
                handle_image_upload(dropped_files[0]);
            }
        }
    });

    $drop_zone.click(() => {
        $image_uploader[0].click();
    });

    $image_uploader.change((e) => {
        handle_image_upload(e.target.files[0]);
    })

    function handle_image_upload(file) {
        let reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                paint.origin_size = { w: img.width, h: img.height };
                paint.scaleCanvasAfterUpload({ w: MAX_WIDTH, h: MAX_HEIGHT });
                paint2.origin_size = paint.origin_size;
                paint2.scaleCanvasAfterUpload({ w: MAX_WIDTH, h: MAX_HEIGHT });
                restartCanvas();
            }
            img.src = event.target.result;            
            paint.canvas_bg.source = img.src;
            paint2.canvas_bg.source = img.src;
        }
        reader.readAsDataURL(file);

        $main_app.show();
        $drop_zone.hide();
    }
    //====================================================

    // Selected tools handler
    //====================================================
    $tools.click((e) => {
        if (!isClickable($(e.currentTarget))) {
            return;
        }

        $('[data-tool].active').removeClass('active');
        $(e.currentTarget).addClass('active');

        let selectedTool = e.currentTarget.getAttribute('data-tool');
        paint.currentTool = selectedTool;

        if (selectedTool == TOOL_DRAGGER) {
            activeDraggableDiv(true);
            $brush_size.prop('disabled', true);
        } else if (selectedTool == TOOL_PAINT_BUCKET) {
            activeDraggableDiv(false);
            $brush_size.prop('disabled', true);

            setup_cursor_click_effect($(paint.canvas), {
                css: 'url("static/main/image/paint-bucket-cursor.svg") 32 32, auto',
                mousedown: 'none',
                mouseup: 'url("static/main/image/paint-bucket-cursor.svg") 32 32, auto'
            });

            $canvasCursor.css({
                'background-color': paint.currentStyle,
                'filter': '',
                'mix-blend-mode': '',
                'width': '10px',
                'height': '10px',
            });
        } else {
            activeDraggableDiv(false);
            $brush_size.prop('disabled', false);

            setup_cursor_click_effect($(paint.canvas), {
                css: 'none',
                mousedown: 'none',
                mouseup: 'none'
            });

            $canvasCursor.css({
                'width': $brush_size.val() + 'px',
                'height': $brush_size.val() + 'px',
            });

            if (selectedTool == TOOL_ERASER) {
                $canvasCursor.css({
                    'background-color': '#808080',
                    'filter': 'invert(0.8)',
                    'mix-blend-mode': 'difference'
                });
            } else if (selectedTool == TOOL_BRUSH) {
                $canvasCursor.css({
                    'background-color': paint.currentStyle,
                    'filter': '',
                    'mix-blend-mode': ''
                });
            }
        }
        
        $colors.each((idx, elm) => {
            activeClickableGUI($(elm), selectedTool == TOOL_BRUSH ||  selectedTool == TOOL_PAINT_BUCKET);
        });
    });

    function activeDraggableDiv(isDraggable) {
        if (isDraggable) {
            $draggable.draggable('enable');

            let cursor_type = {
                css: 'grab',
                mousedown: 'grabbing',
                mouseup: 'grab'
            };
            setup_cursor_click_effect($draggable, cursor_type);
            setup_cursor_click_effect($(paint.canvas), cursor_type);
        } else {
            $draggable.draggable('disable');

            let cursor_type = {
                css: 'default',
                mousedown: 'default',
                mouseup: 'default'
            };
            setup_cursor_click_effect($draggable, cursor_type);

            cursor_type = {
                css: 'none',
                mousedown: 'none',
                mouseup: 'none'
            };
            setup_cursor_click_effect($(paint.canvas), cursor_type);
        }
    }

    function setup_cursor_click_effect($query, cursor_type) {
        $query.css('cursor', cursor_type.css);
        $query.mousedown(() => {
            $query.css('cursor', cursor_type.mousedown);
        });
        $query.mouseup(() => {
            $query.css('cursor', cursor_type.mouseup);
        });
    }

    //====================================================

    // Selected color handler
    //====================================================
    $colors.click((e) => {
        if (!isClickable($(e.currentTarget))) {
            return;
        }

        $('[data-color].active').removeClass('active');
        $(e.currentTarget).addClass('active');
        
        let currentColor = e.currentTarget.getAttribute('data-color');
        paint.currentStyle = currentColor;

        if (paint.currentTool == TOOL_ERASER) {
            return;
        }

        $canvasCursor.css('background-color', currentColor);
    });
    //====================================================

    // Clear mask handler
    //====================================================
    $clear.click(() => {
        if (!isClickable($clear)) {
            return;
        }

        paint.clear_canvas();
        paint.undoStack.push(paint.get_current_canvas_data());
    });
    //====================================================

    // Restart all handler
    //====================================================
    $restart.click(() => {
        if (!isClickable($restart)) {
            return;
        }

        paint2.canvas_bg.source = paint.canvas_bg.source;
        restartCanvas();
    });

    function restartCanvas() {
        activeClickableGUI($restart, false);
        activeClickableGUI($download, false);
        activeClickableGUI($toggle_original, false);
        handle_toggle_original(true);

        // paint2.canvas_bg.source = paint.canvas_bg.source;
        paint.restartCanvas();
        paint2.restartCanvas();

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
            'transform', 'translate(0px, 0px)'
        );
    }
    //====================================================

    // Show/hide original handler
    //====================================================
    $toggle_original.click(() => {
        if (!isClickable($toggle_original)) {
            return;
        }
        $toggle_original.toggleClass('active');
        let is_showing_original = $toggle_original.hasClass('active');
        handle_toggle_original(is_showing_original);
    });

    function handle_toggle_original(is_showing_original) {
        toggle_original_icon(is_showing_original);
        toggle_screen_label(is_showing_original);
        toggle_canvas_visibility(is_showing_original);
        toggle_canvas2_source(is_showing_original);
    }


    function toggle_original_icon(is_showing_original) {
        if (is_showing_original) {
            var icon_src = TOGGLE_ON_URL;
        } else {
            var icon_src = TOGGLE_OFF_URL;
        }
        $toggle_original.children(0)[0].src = icon_src;
    }

    function toggle_screen_label(is_showing_original) {
        if (is_showing_original) {
            $('.split-screen.left .label')[0].innerHTML = 'Original + Masks';
            $('.split-screen.right .label')[0].innerHTML = 'Result';
        } else {
            $('.split-screen.left .label')[0].innerHTML = 'Original';
            $('.split-screen.right .label')[0].innerHTML = 'Original';
        }
    }

    function toggle_canvas_visibility(is_showing_original) {
        if (is_showing_original) {
            $(paint.canvas).show();
        } else {
            $(paint.canvas).hide();
        }
    }

    function toggle_canvas2_source(is_showing_original) {
        if (is_showing_original) {
            var img_src = paint2.canvas_bg.output_img;
        } else {
            var img_src = paint.canvas_bg.source;
            $(paint.canvas).hide();
        }
        paint2.canvas_bg.source = img_src;
    }
    //====================================================


    // Predict background handler
    //====================================================
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
                'input_image': paint.canvas_bg.source,
                'input_trimap': paint.getCanvasDataURL(),
            })
        })
            .then(response => response.json())
            .then(result => {
                // console.log(result);
                paint2.canvas_bg.source = result;
                paint2.canvas_bg.output_img = result;

                activeClickableGUI($download, true);
                activeClickableGUI($toggle_original, true);

                $loading.hide();
            })
            .catch(error => {
                alert(error);
                $loading.hide();
            });
    });
    //====================================================

    // Download handler
    //====================================================
    $download.click(() => {
        let link = document.createElement("a");
        link.download = "my-image.png";
        link.href = paint2.canvas_bg.output_img;
        link.click();
    });

    // Brush size handler
    //====================================================
    $('[type="number"]').keypress((e) => {
        e.preventDefault();
    });

    $brush_size.change(() => {
        $canvasCursor.css({
            'width': $brush_size.val() + 'px',
            'height': $brush_size.val() + 'px',
        });
        paint.lineWidth = $brush_size.val();
    });
    //====================================================

    // Toolbox button state handler
    //====================================================
    $(document).click(() => {
        activeClickableGUI($clear, !paint.isBlankCanvas());
        activeClickableGUI($restart, !(paint.isBlankCanvas() && Number($draggable.css('top').split('px')[0]) == defaultCanvasPosition.top && Number($draggable.css('left').split('px')[0]) == defaultCanvasPosition.left));
        activeClickableGUI($predict, !(paint.canvas_bg.source == '' || paint.isBlankCanvas()));
    });
    //====================================================

    // Shortcut handler
    //====================================================
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
    //====================================================

    // Canvas zoom handler
    //====================================================
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
        // console.log('-------------------------------------');
        if (e.currentTarget.id == 'draggable') {
            var current_paint = paint;
            var current_draggable = $draggable;
            // console.log('paint1');
        } else if (e.currentTarget.id == 'draggable2') {
            var current_paint = paint2;
            var current_draggable = $draggable2;
            // console.log('paint2');
        }

        let current_canvas_pos = getMouseCoordsOnCanvas(e, current_paint.canvas);
        let currentX = current_canvas_pos.x;
        let currentY = current_canvas_pos.y;

        let originX = current_paint.canvas.width / 2;
        let originY = current_paint.canvas.height / 2;
        // console.log('current pos and origin:',currentX, currentY, originX, originY);

        let dx = currentX - originX;
        let dy = currentY - originY;

        let scale = current_paint.current_ratio / previous_ratio;

        let dy_prime = dy * scale;
        let dx_prime = dx * scale;

        let correctionX = dx - dx_prime;
        let correctionY = dy - dy_prime;
        // console.log('dx dy and dx_p dy_p',dx, dy, dx_prime, dy_prime);
        // console.log('correction:', correctionX, correctionY);

        let overflowX = 0;
        let overflowY = 0;

        let afterzoom_pos = {
            x: current_draggable.position().left + correctionX,
            y: current_draggable.position().top + correctionY
        };
        // console.log('afterzoom pos:', afterzoom_pos.x, afterzoom_pos.y);

        if (afterzoom_pos.x < 0) {
            overflowX = afterzoom_pos.x;
        } else if (afterzoom_pos.x > $(window).width() / 2) {
            overflowX = afterzoom_pos.x - $(window).width() / 2;
        }
        if (afterzoom_pos.y < 0) {
            overflowY = afterzoom_pos.y;
        } else if (afterzoom_pos.y > $(window).height()) {
            overflowY = afterzoom_pos.y - $(window).height();
        }
        // console.log('overflow:', overflowX, overflowY);

        correctionX = roundNumber(correctionX - overflowX, 0);
        correctionY = roundNumber(correctionY - overflowY, 0);

        translateX += correctionX;
        translateY += correctionY;
        // console.log('-------------------------------------');

        $('.drag-area').css(
            'transform', `translate(${translateX}px, ${translateY}px)`
        );
    });
    //====================================================

    // Canvas custom cursor handler
    //====================================================
    $(paint.canvas).mousemove((e) => {
        if (paint.currentTool == TOOL_DRAGGER) {
            return;
        }
        $($canvasCursor[0]).css({
            'top': e.pageY + 'px',
            'left': e.pageX + 'px',
        });
        $($canvasCursor[1]).css({
            'top': e.pageY + 'px',
            'left': e.pageX + $(window).width() / 2 + 'px',
        });
    });
    $(paint.canvas).mouseleave(() => {
        $canvasCursor.css({
            'top': '-1000px',
            'left': '-1000px',
        });
    });
    //====================================================

    function isClickable($query) {
        if ($query.hasClass('clickable')) {
            return true;
        } else {
            return false;
        }
    }

    function activeClickableGUI($query, activeCondition) {
        if (activeCondition) {
            $query.addClass('clickable');
        } else {
            $query.removeClass('clickable');
        }
    }

});

