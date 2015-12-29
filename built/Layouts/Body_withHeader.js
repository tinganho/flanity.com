"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
var Gaussian = (function () {
    function Gaussian(mean, variance) {
        this.mean = mean;
        this.variance = variance;
        this.standardDeviation = Math.sqrt(variance);
    }
    Gaussian.prototype.pdf = function (x) {
        var m = this.standardDeviation * Math.sqrt(2 * Math.PI);
        var e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * this.variance));
        return e / m;
    };
    return Gaussian;
}());
var requestAnimationFrame = (function () {
    if (typeof window !== 'undefined') {
        return function (callback) {
            return setTimeout(callback, 1000 / 30);
        };
    }
})();
var cancelAnimationFrame = (function () {
    if (typeof window !== 'undefined') {
        return function (id) {
            clearTimeout(id);
        };
    }
})();
var SineWave = (function () {
    function SineWave(canvas, width, height) {
        this.canvas = canvas;
        this.period = 500;
        this.amplitude = 100;
        this.startPoint = { x: 0, y: 0 };
        canvas.width = width * 2;
        canvas.height = height * 2;
        this.gaussian = new Gaussian(canvas.width / 4, canvas.width * 70);
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.context.scale(2, 2);
        this.context.lineWidth = 4;
        this.offset = { x: 0, y: height / 2 };
    }
    SineWave.prototype.getYCoordinate = function (x, line) {
        var period;
        var xWithOffset = (x + this.offset.x);
        switch (line) {
            case 2:
                xWithOffset += 100;
                break;
            case 3:
                xWithOffset += 200;
                break;
        }
        var y = this.amplitude * Math.sin(1 * Math.PI / this.period * xWithOffset);
        return ((y - (line * 60)) * this.gaussian.pdf(x) * this.canvas.height * 0.6 + this.offset.y);
    };
    SineWave.prototype.start = function () {
        var lastAnimation = new Date().getTime();
        var _this = this;
        function animate() {
            _this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            _this.offset.x += 0.4 * (new Date().getTime() - lastAnimation) / 16;
            if (_this.offset.x >= _this.canvas.width) {
                _this.offset.x = _this.offset.x - 2 * Math.PI / _this.period;
            }
            for (var line = 1; line <= 3; line++) {
                _this.context.beginPath();
                _this.context.strokeStyle = '#FAFAFC';
                _this.context.moveTo(_this.startPoint.x, _this.startPoint.y);
                for (var index = 1; index <= _this.canvas.width; index++) {
                    var newX = _this.startPoint.x + index;
                    _this.context.lineTo(newX, _this.getYCoordinate(newX, line));
                }
                _this.context.stroke();
            }
            lastAnimation = new Date().getTime();
        }
        this.animation = requestAnimationFrame(animate);
    };
    ;
    SineWave.prototype.stop = function () {
        cancelAnimationFrame(this.animation);
    };
    ;
    return SineWave;
}());
var Body_withHeader = (function (_super) {
    __extends(Body_withHeader, _super);
    function Body_withHeader() {
        _super.apply(this, arguments);
    }
    Body_withHeader.prototype.render = function () {
        return (Index_1.React.createElement("div", {class: 'FillParentLayout BgLightGrey'}, Index_1.React.createElement("header", {id: 'Header'}, this.props.Header), Index_1.React.createElement("section", {id: 'Body'}, this.props.Body), Index_1.React.createElement("footer", {id: 'Footer'}, this.props.Footer), Index_1.React.createElement("canvas", {ref: 'canvasWave', id: 'CanvasWave'}), Index_1.React.createElement("div", {id: 'Overlay', style: 'display: none;'}, this.props.Overlay)));
    };
    Body_withHeader.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        var canvas = this.elements.canvasWave;
        var sinusWave = new SineWave(this.elements.canvasWave.nativeElement, canvas.getWidth(), canvas.getHeight());
        sinusWave.start();
    };
    return Body_withHeader;
}(Index_1.LayoutComponent));
exports.Body_withHeader = Body_withHeader;
//# sourceMappingURL=Body_withHeader.js.map