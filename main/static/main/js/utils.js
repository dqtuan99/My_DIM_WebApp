import Point from './point.model.js';

export default function getMouseCoordsOnCanvas(e, canvas) {
    let rect = canvas.getBoundingClientRect();
    // console.log(rect);
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return new Point(x, y); // {x:x, y:y}
}
