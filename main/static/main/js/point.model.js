// export const CURSOR_OFFSET = 4;

export default class Point {
    constructor(x, y) {
        this.x = Math.ceil(x);
        this.y = Math.ceil(y);
    }
}
