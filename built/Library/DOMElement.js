"use strict";
var Utils_1 = require('../Library/Utils');
function isComposerDOMElement(element) {
    return !!element.findOne;
}
var DOMElement = (function () {
    function DOMElement(element) {
        if (isComposerDOMElement(element)) {
            this.nativeElement = element.nativeElement;
        }
        else {
            this.nativeElement = element;
        }
    }
    DOMElement.getElement = function (id) {
        var el = document.getElementById(id);
        return new DOMElement(el);
    };
    Object.defineProperty(DOMElement.prototype, "id", {
        get: function () {
            return this.nativeElement.id;
        },
        set: function (id) {
            this.nativeElement.id = id;
        },
        enumerable: true,
        configurable: true
    });
    DOMElement.prototype.findOne = function (query) {
        var el = this.nativeElement.querySelector(query);
        return el ? new DOMElement(el) : null;
    };
    DOMElement.prototype.findAll = function (query) {
        var elements = this.nativeElement.querySelectorAll(query);
        return Utils_1.map(elements, function (element) {
            return new DOMElement(element);
        });
    };
    DOMElement.prototype.position = function () {
        var _a = this.nativeElement.getBoundingClientRect(), left = _a.left, top = _a.top;
        top = top + window.pageYOffset - this.nativeElement.ownerDocument.documentElement.clientTop;
        left = left + window.pageXOffset - this.nativeElement.ownerDocument.documentElement.clientLeft;
        return { left: left, top: top };
    };
    DOMElement.prototype.getHeight = function () {
        var height = this.nativeElement.getBoundingClientRect().height;
        return height;
    };
    DOMElement.prototype.getWidth = function () {
        var width = this.nativeElement.getBoundingClientRect().width;
        return width;
    };
    DOMElement.prototype.getText = function () {
        return this.nativeElement.textContent;
    };
    DOMElement.prototype.getAttribute = function (name) {
        return this.nativeElement.getAttribute(name);
    };
    DOMElement.prototype.setAttribute = function (name, value) {
        this.nativeElement.setAttribute(name, value);
        return this;
    };
    DOMElement.prototype.removeAttribute = function (name) {
        this.nativeElement.removeAttribute(name);
        return this;
    };
    DOMElement.prototype.getHtml = function () {
        return this.nativeElement.innerHTML;
    };
    DOMElement.prototype.setHtml = function (html) {
        this.nativeElement.innerHTML = html;
        return this;
    };
    DOMElement.prototype.append = function (element) {
        this.nativeElement.appendChild(element.nativeElement);
        return this;
    };
    DOMElement.prototype.prepend = function (element) {
        this.nativeElement.insertBefore(element.nativeElement, this.nativeElement.firstChild);
        return this;
    };
    DOMElement.prototype.before = function (element) {
        this.nativeElement.parentNode.insertBefore(element.nativeElement, this.nativeElement);
        return this;
    };
    DOMElement.prototype.after = function (element) {
        this.nativeElement.parentNode.insertBefore(element.nativeElement, this.nativeElement.parentNode.lastChild);
        return this;
    };
    DOMElement.prototype.hide = function () {
        this.nativeElement.style.display = 'none';
        return this;
    };
    DOMElement.prototype.show = function () {
        this.nativeElement.style.display = '';
        return this;
    };
    DOMElement.prototype.remove = function () {
        this.nativeElement.parentNode.removeChild(this.nativeElement);
    };
    DOMElement.prototype.addClass = function (className) {
        this.nativeElement.classList.add(className);
        return this;
    };
    DOMElement.prototype.removeClass = function (className) {
        this.nativeElement.classList.remove(className);
        return this;
    };
    DOMElement.prototype.setClass = function (className) {
        this.nativeElement.className = className;
        return this;
    };
    DOMElement.prototype.addEventListener = function (event, listener) {
        this.nativeElement.addEventListener(event, listener, false);
        return this;
    };
    DOMElement.prototype.removeEventListener = function (event, listener) {
        this.nativeElement.removeEventListener(event, listener);
        return this;
    };
    DOMElement.prototype.getClasses = function () {
        return this.nativeElement.className.split(' ');
    };
    DOMElement.prototype.onClick = function (listener) {
        this.nativeElement.addEventListener('click', listener, false);
        return this;
    };
    DOMElement.prototype.onDbClick = function (listener) {
        this.nativeElement.addEventListener('dbclick', listener, false);
        return this;
    };
    DOMElement.prototype.onSubmit = function (listener) {
        this.nativeElement.addEventListener('submit', listener, false);
        return this;
    };
    DOMElement.prototype.onFocus = function (listener) {
        this.nativeElement.addEventListener('focus', listener, false);
        return this;
    };
    DOMElement.prototype.onBlur = function (listener) {
        this.nativeElement.addEventListener('blur', listener, false);
        return this;
    };
    DOMElement.prototype.whenTransitionEnd = function (callback) {
        var _this = this;
        var finish = function () {
            _this.removeEventListener('transitionend', finish);
            _this.removeEventListener('webkitTransitionEnd', finish);
            _this.removeEventListener('oTransitionEnd', finish);
            _this.removeEventListener('MSTransitionEnd', finish);
            callback();
        };
        this.addEventListener('transitionend', finish);
        this.addEventListener('webkitTransitionEnd', finish);
        this.addEventListener('oTransitionEnd', finish);
        this.addEventListener('MSTransitionEnd', finish);
        return this;
    };
    DOMElement.prototype.clone = function () {
        return new DOMElement(this.nativeElement.cloneNode(true));
    };
    DOMElement.prototype.appendTo = function (target) {
        if (typeof target === 'string') {
            var element = DOMElement.getElement(target);
            element.append(this);
        }
        else {
            target.append(this);
        }
        return this;
    };
    DOMElement.prototype.getValue = function () {
        return this.nativeElement.value;
    };
    return DOMElement;
}());
exports.DOMElement = DOMElement;
//# sourceMappingURL=DOMElement.js.map