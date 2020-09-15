import Point from './point.model.js';

export const getMouseCoordsOnCanvas = (e, canvas) => {
    let rect = canvas.getBoundingClientRect();
    // console.log(rect);
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    return new Point(x, y); // {x:x, y:y}
};

export const saveContextDict = (context) => {
    let props = ['strokeStyle', 'fillStyle', 'globalAlpha', 'lineWidth',
    'lineCap', 'lineJoin', 'miterLimit', 'lineDashOffset', 'shadowOffsetX',
    'shadowOffsetY', 'shadowBlur', 'shadowColor', 'globalCompositeOperation',
    'font', 'textAlign', 'textBaseline', 'direction', 'imageSmoothingEnabled'];
    let state = {}
    for (let prop of props) {
        state[prop] = context[prop];
    }

    return state;
};

export const restoreContextDict = (context, state) => {
    for (let prop in state) {
        context[prop] = state[prop];
    }
};

export const roundNumber = (number, decimal) => {
    return Math.round((number + Number.EPSILON) * 10**decimal) / 10**decimal;
}