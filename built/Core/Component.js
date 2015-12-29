"use strict";
var Index_1 = require('../Library/Index');
var Component = (function () {
    function Component(props, children) {
        this.l10ns = {};
        this.hasRenderedFirstElement = false;
        this.hasBoundDOM = false;
        this.components = {};
        this.props = Index_1.extend({}, Index_1.extend(props || {}, this.props));
        this.children = children;
        this.elements = {};
    }
    Component.getElement = function (id) {
        var el = document.getElementById(id);
        return new Index_1.DOMElement(el);
    };
    Component.prototype.setProps = function (props) {
        this.props = props;
    };
    Component.prototype.setProp = function (name, value) {
        if (this.props) {
            this.props[name] = value;
        }
        else {
            this.props = (_a = {},
                _a[name] = value,
                _a
            );
        }
        var _a;
    };
    Component.prototype.unsetProp = function (name) {
        delete this.props[name];
    };
    Object.defineProperty(Component.prototype, "id", {
        get: function () {
            return this.props.id ? this.props.id : this.constructor.name;
        },
        enumerable: true,
        configurable: true
    });
    Component.prototype.remove = function () {
        this.root.remove();
        return Promise.resolve(undefined);
    };
    Component.prototype.hide = function () {
        return Promise.resolve(undefined);
    };
    Component.prototype.show = function () {
        return Promise.resolve(undefined);
    };
    Component.prototype.recursivelyCallMethod = function (method) {
        var _this = this;
        return new Promise(function (resolve) {
            var promises = [];
            if (_this[method]) {
                promises.push(_this[method]());
            }
            _this.recurseMethodCalls(_this, method, promises);
            Promise.all(promises).then(function () {
                resolve(undefined);
            });
        });
    };
    Component.prototype.recurseMethodCalls = function (target, method, promises) {
        if (!target) {
            return;
        }
        for (var c in target['components']) {
            if (target['components'][c][method]) {
                promises.push(target['components'][c][method]());
            }
        }
        this.recurseMethodCalls(target['components'], method, promises);
    };
    Component.prototype.fetch = function (req) {
        return Promise.resolve(undefined);
    };
    Component.prototype.bindDOM = function (renderId) {
        this.setLocalizations(this.props.l);
        if (!this.hasBoundDOM) {
            this.components = {};
            this.lastRenderId = this.renderAndSetComponent().bindDOM(renderId);
            this.hasBoundDOM = true;
        }
    };
    Component.prototype.findNode = function (id) {
        return new Index_1.DOMElement(document.getElementById(id));
    };
    Component.prototype.appendTo = function (id) {
        var element = document.getElementById(id);
        if (!element) {
            throw new Error('Element not found: ' + id);
        }
        element.appendChild(this.toDOM());
        return this;
    };
    Component.prototype.setLocalizations = function (l) {
    };
    Component.prototype.bindInteractions = function () {
    };
    Component.prototype.getInstancesOf = function () {
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i - 0] = arguments[_i];
        }
        var componentBuilder = {};
        this.lastRenderId = this.renderAndSetComponent().instantiateComponents();
        var instantiatedComponents = Index_1.getInstantiatedComponents(this.lastRenderId);
        for (var _a = 0, components_1 = components; _a < components_1.length; _a++) {
            var c = components_1[_a];
            componentBuilder[c] = instantiatedComponents[c];
        }
        return componentBuilder;
    };
    Component.prototype.instantiateComponents = function (renderId) {
        this.renderAndSetComponent().instantiateComponents(renderId);
    };
    Component.prototype.toString = function (renderId) {
        this.setLocalizations(this.props.l);
        var s = this.renderAndSetComponent().toString(renderId || this.lastRenderId);
        return s;
    };
    Component.prototype.toDOM = function (renderId) {
        this.setLocalizations(this.props.l);
        var DOMRender = this.renderAndSetComponent().toDOM(renderId || this.lastRenderId);
        this.lastRenderId = DOMRender.renderId;
        return DOMRender.frag;
    };
    Component.prototype.renderAndSetComponent = function () {
        var rootElement = this.render();
        rootElement.setComponent(this);
        return rootElement;
    };
    return Component;
}());
exports.Component = Component;
//# sourceMappingURL=Component.js.map