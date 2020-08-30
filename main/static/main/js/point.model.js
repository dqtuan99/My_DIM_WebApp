export default class Point {
    constructor(x, y) {
        this.x = Math.ceil(x) - 8;
        this.y = Math.ceil(y) - 8;
    }
}
