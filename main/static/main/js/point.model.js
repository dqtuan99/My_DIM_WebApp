export const CURSOR_OFFSET = 4;

export default class Point {
    constructor(x, y) {
        this.x = Math.ceil(x) - CURSOR_OFFSET;
        this.y = Math.ceil(y) - CURSOR_OFFSET;
    }
}
