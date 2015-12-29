"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
var SineWave = (function () {
    function SineWave(canvas, options) {
        this.canvas = canvas;
        this.period = 50;
        this.amplitude = 30;
        this.speed = 1.8;
        this.guassianMultiplier = 50;
        this.startPoint = { x: 0, y: 0 };
        canvas.width = options.width * 2;
        canvas.height = options.height * 2;
        this.gaussian = new Index_1.Gaussian(canvas.width / 2, canvas.width / 6);
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.context.lineWidth = 3;
        this.offset = { x: 0, y: options.height };
    }
    SineWave.prototype.getYCoordinate = function (x, line) {
        var period;
        var xWithOffset = (x + this.offset.x);
        var y = this.amplitude * Math.sin(2 * Math.PI / this.period * xWithOffset);
        return ((y * (this.gaussian.pdf(x) * this.guassianMultiplier) * (line + 1) / 2.5) + this.offset.y);
    };
    SineWave.prototype.start = function () {
        var lastAnimation = new Date().getTime();
        var gradient1 = this.context.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient1.addColorStop(0, 'rgba(124, 128, 157, 0)');
        gradient1.addColorStop(0.2, 'rgba(124, 128, 157, 0.7)');
        gradient1.addColorStop(0.8, 'rgba(124, 128, 157, 0.7)');
        gradient1.addColorStop(1, 'rgba(124, 128, 157, 0)');
        var _this = this;
        function animate() {
            _this.context.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            _this.offset.x += _this.speed * (new Date().getTime() - lastAnimation) / 16;
            if (_this.offset.x >= _this.canvas.width) {
                _this.offset.x = _this.offset.x - 2 * Math.PI / _this.period;
            }
            for (var line = 1; line <= 3; line++) {
                _this.context.beginPath();
                _this.context.strokeStyle = gradient1;
                _this.context.moveTo(_this.startPoint.x, _this.startPoint.y);
                for (var index = 1; index <= _this.canvas.width; index++) {
                    var newX = _this.startPoint.x + index;
                    _this.context.lineTo(newX, _this.getYCoordinate(newX, line));
                }
                _this.context.stroke();
            }
            lastAnimation = new Date().getTime();
            _this.animation = requestAnimationFrame.call(window, animate);
        }
        this.animation = requestAnimationFrame.call(window, animate);
    };
    ;
    SineWave.prototype.stop = function () {
        cancelAnimationFrame(this.animation);
    };
    ;
    return SineWave;
}());
exports.SineWave = SineWave;
var SubmitButton = (function (_super) {
    __extends(SubmitButton, _super);
    function SubmitButton() {
        _super.apply(this, arguments);
    }
    SubmitButton.prototype.render = function () {
        return (Index_1.React.createElement("div", {ref: 'container', class: 'SubmitButtonContainer Idle'}, Index_1.React.createElement("input", {class: 'SubmitButtonButton TextButton', type: 'submit', ref: 'button', value: this.props.buttonText, disabled: true}), Index_1.React.createElement("canvas", {ref: 'loadingCanvas', class: 'SubmitButtonLoadingCanvas'})));
    };
    SubmitButton.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        var container = this.elements.container;
        var height = container.getHeight();
        var width = container.getWidth();
        this.elements.loadingCanvas.setAttribute('style', "height: " + height + "px; width: " + width + "px; display: block;");
        this.sineWave = new SineWave(this.elements.loadingCanvas.nativeElement, { width: width, height: height });
    };
    SubmitButton.prototype.addOnSubmitListener = function (callback) {
        this.elements.container.addEventListener('click', callback);
    };
    SubmitButton.prototype.startLoading = function () {
        this.elements.container.addClass('Loading').removeClass('Idle');
        this.sineWave.start();
    };
    SubmitButton.prototype.stopLoading = function () {
        this.elements.container.addClass('Idle').removeClass('Loading');
        this.sineWave.stop();
    };
    return SubmitButton;
}(Index_1.ContentComponent));
exports.SubmitButton = SubmitButton;
//# sourceMappingURL=SubmitButton.js.map