import {TOOL_BRUSH, TOOL_PAINT_BUCKET, TOOL_ERASER} from './tool.js';
import Paint from './paint.class.js';

let paint = new Paint("canvas");
paint.activeTool = TOOL_BRUSH;
paint.lineWidth = 15;
paint.selectedColor = '#7F7F7F';
paint.init();

// var imageLoader = document.getElementById('imageLoader');
//     imageLoader.addEventListener('change', handleImage, false);
// var canvas = paint.canvas;
// var context = paint.context;
// var canvas2 = paint.canvas2;
// var context2 = paint.context2;
//
// function handleImage(e){
//     paint.addImageToStack();
//     var reader = new FileReader();
//     reader.onload = function(event){
//         var img = new Image();
//         img.onload = function(){
//             canvas.width = img.width;
//             canvas.height = img.height;
//             canvas2.width = img.width;
//             canvas2.height = img.height;
//             context.drawImage(img, 0, 0);
//         }
//         img.src = event.target.result;
//     }
//     reader.readAsDataURL(e.target.files[0]);
// }

let canvasBG = document.getElementById('canvas-background');
let imageLoader = document.getElementById("imageLoader");
imageLoader.addEventListener('change', handleImage, false);
function handleImage(e) {
    let reader = new FileReader();
    reader.onload = function(event) {
        var img = new Image();
        img.onload = function () {
            paint.canvas.width = img.width;
            paint.canvas.height = img.height;
        }
        img.src = event.target.result;
        canvasBG.src = img.src;
    }
    reader.readAsDataURL(e.target.files[0]);
    paint.undoStack = [];
}

// if (window.FileList && window.File && window.FileReader) {
//     document.getElementById('imageLoader').addEventListener('change', event => {
//         canvasBG.src = '';
//         var file = event.target.files[0];
//         if (!file.type) {
//             alert('Error: The File.type property does not appear to be supported on this browser.');
//             return;
//         }
//         if (!file.type.match('image.*')) {
//             alert('Error: The selected file does not appear to be an image.');
//             return;
//         }
//         var reader = new FileReader();
//         reader.addEventListener('load', event => {
//             canvasBG.src = event.target.result;
//             paint.canvas.width = canvasBG.width;
//             paint.canvas.height = canvasBG.height;
//         });
//         reader.readAsDataURL(file);
//     });
// }


document.querySelectorAll("[data-command]").forEach(
    item => {
        item.addEventListener("click", e => {
            // console.log(item.getAttribute("data-command"))
            let command = item.getAttribute("data-command");
            if (command === "undo") {
                paint.undoPaint();
            } else if (command === "download") {
                paint.saveImage();
            }
        });
    }
);

document.querySelectorAll("[data-tool]").forEach(
    item => {
        item.addEventListener("click", e => {
            document.querySelector("[data-tool].active").classList.toggle("active");
            item.classList.toggle("active");

            let selectedTool = item.getAttribute("data-tool");
            // console.log("selectedTool =", selectedTool);
            paint.activeTool = selectedTool;
        });
    }
);

document.querySelectorAll("[data-line-width]").forEach(
    item => {
        item.addEventListener("click", e => {
            document.querySelector("[data-line-width].active").classList.toggle("active");
            item.classList.toggle("active");

            let lineWidth = item.getAttribute("data-line-width");
            paint.lineWidth = lineWidth;
        });
    }
);

document.querySelectorAll("[data-color]").forEach(
    item => {
        item.addEventListener("click", e => {
            document.querySelector("[data-color].active").classList.toggle("active");
            item.classList.toggle("active");

            let color = item.getAttribute("data-color");
            paint.selectedColor = color;

            document.querySelectorAll(".toolbox .group.linewidths .item .linewidth").forEach(
                item => {
                        item.style.backgroundColor = color;
                    }
            );
        });
    }
);
