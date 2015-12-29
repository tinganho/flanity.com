"use strict";
var Index_1 = require('../Library/Index');
var id = 0;
var instantiatedComponents = {};
var nodes = {};
function getNodeLink(id) {
    if (id in nodes)
        return nodes[id];
    var root = document.getElementById(id);
    if (!root) {
        Index_1.Debug.error("Could not bind root element '{0}'.", id);
    }
    (function (id) {
        setTimeout(function () { delete nodes[id]; }, 100);
    })(id);
    return nodes[id] = new Index_1.DOMElement(root);
}
exports.getNodeLink = getNodeLink;
function getRenderId() {
    return id++;
}
exports.getRenderId = getRenderId;
function resetId() {
    id = 0;
}
exports.resetId = resetId;
function unsetInstantiatedComponents(renderId) {
    delete instantiatedComponents[renderId];
}
exports.unsetInstantiatedComponents = unsetInstantiatedComponents;
function getInstantiatedComponents(renderId) {
    return instantiatedComponents[renderId];
}
exports.getInstantiatedComponents = getInstantiatedComponents;
function createElement(element, props) {
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    props = props || {};
    var component;
    var isChildOfRootElement = false;
    function setComponent(c) {
        component = c;
    }
    function markAsChildOfRootElement() {
        isChildOfRootElement = true;
    }
    function handleDOMAction(renderId, handleIntrinsicElement, handleCustomElement) {
        if (!renderId) {
            renderId = getRenderId();
            setTimeout(function () {
                delete instantiatedComponents[renderId];
            }, 0);
        }
        if (typeof element === 'undefined') {
            return renderId;
        }
        if (!instantiatedComponents[renderId]) {
            instantiatedComponents[renderId] = {};
        }
        if (typeof element === 'string') {
            handleIntrinsicElement(element, renderId);
        }
        else {
            handleCustomElement(element, renderId);
        }
        return renderId;
    }
    function toDOM(renderId) {
        var frag = document.createDocumentFragment();
        renderId = handleDOMAction(renderId, function (element, renderId) {
            var root = document.createElement(element);
            if (!component.hasRenderedFirstElement) {
                component.root = new Index_1.DOMElement(root);
                root.setAttribute('id', component.id);
            }
            var innerHTML = null;
            for (var p in props) {
                if (p === 'id' && !component.hasRenderedFirstElement) {
                    continue;
                }
                else if (p === 'ref') {
                    var ref = props[p];
                    if (ref in component.elements) {
                        Index_1.Debug.warn("You are overriding the element reference '{0}'.", ref);
                    }
                    root.setAttribute('data-ref', ref);
                    component.elements[ref] = new Index_1.DOMElement(root);
                }
                else if (p === 'html') {
                    innerHTML = props[p];
                    continue;
                }
                else {
                    root.setAttribute(convertCamelCasesToDashes(p), props[p]);
                }
            }
            component.hasRenderedFirstElement = true;
            if (innerHTML) {
                root.innerHTML = innerHTML;
            }
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                if (!child) {
                    continue;
                }
                if (typeof child === 'string') {
                    root.textContent += child;
                }
                else if (child.nativeElement) {
                    root.appendChild(child.nativeElement);
                }
                else if (child.classList) {
                    root.appendChild(child);
                }
                else if (Index_1.isArray(child)) {
                    for (var _a = 0, child_1 = child; _a < child_1.length; _a++) {
                        var c = child_1[_a];
                        renderChildToDOM(root, c, renderId);
                    }
                }
                else {
                    renderChildToDOM(root, child, renderId);
                }
            }
            frag.appendChild(root);
            if (!isChildOfRootElement) {
                component.hasRenderedFirstElement = false;
            }
        }, function (element, renderId) {
            var elementComponent;
            var elementComponentId = props.id ? props.id : element.name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {
                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new element(props, children);
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }
            frag.appendChild(elementComponent.toDOM());
            if (component) {
                component.components[props.ref || toCamelCase(elementComponent.id)] = elementComponent;
            }
            else {
                component = elementComponent;
            }
        });
        return { renderId: renderId, frag: frag };
        function renderChildToDOM(root, child, renderId) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.markAsChildOfRootElement();
                root.appendChild(child.toDOM(renderId).frag);
            }
            else {
                root.appendChild(child.toDOM(renderId).frag);
                var childComponent = child.getComponent();
                component.components[props.ref || toCamelCase(childComponent.id)] = childComponent;
            }
        }
    }
    function convertCamelCasesToDashes(text) {
        return text.replace(/([A-Z])/g, function (m) {
            return '-' + m.toLowerCase();
        });
    }
    function toString(renderId) {
        var frag = '';
        if (typeof element === 'string') {
            frag = "<" + element;
            if (!component.hasRenderedFirstElement) {
                frag += " id=\"" + component.id + "\"";
            }
            var innerHTML = null;
            for (var p in props) {
                if (typeof props[p] !== 'boolean' && typeof props[p] !== 'string') {
                    continue;
                }
                if (p === 'id' && !component.hasRenderedFirstElement) {
                    continue;
                }
                if (p === 'html') {
                    innerHTML = props[p];
                    continue;
                }
                if (typeof props[p] === 'boolean') {
                    frag += " " + convertCamelCasesToDashes(p);
                }
                else if (p === 'ref') {
                    frag += " data-ref=\"" + props[p] + "\"";
                }
                else {
                    frag += " " + convertCamelCasesToDashes(p) + "=\"" + props[p] + "\"";
                }
            }
            frag += '>';
            if (innerHTML) {
                frag += innerHTML;
            }
            component.hasRenderedFirstElement = true;
            for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
                var child = children_2[_i];
                if (!child) {
                    continue;
                }
                if (typeof child === 'string') {
                    frag += child;
                }
                else if (Index_1.isArray(child)) {
                    for (var _a = 0, child_2 = child; _a < child_2.length; _a++) {
                        var c = child_2[_a];
                        frag += renderChildToString(c);
                    }
                }
                else {
                    frag += renderChildToString(child);
                }
            }
            frag += "</" + element + ">";
            if (!isChildOfRootElement) {
                component.hasRenderedFirstElement = false;
            }
        }
        else {
            var _component;
            var elementComponentId = props.id ? props.id : element.name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {
                _component = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                _component = new element(props, children);
            }
            frag += _component.toString(renderId);
        }
        return frag;
        function renderChildToString(child) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.markAsChildOfRootElement();
            }
            return child.toString();
        }
    }
    function bindDOM(renderId) {
        renderId = handleDOMAction(renderId, function (element, renderId) {
            component.root = getNodeLink(component.id);
            for (var p in props) {
                if (p === 'ref') {
                    var ref = props[p];
                    if (ref in component.elements) {
                        Index_1.Debug.warn("You are overriding the element reference '{0}'.", ref);
                    }
                    var referencedElement = component.root.findOne("[data-ref=\"" + ref + "\"]");
                    if (!referencedElement && component.root.getAttribute('data-ref') === ref) {
                        referencedElement = component.root;
                    }
                    if (!referencedElement) {
                        Index_1.Debug.error("Could not bind referenced element '{0}'.", ref);
                    }
                    component.elements[ref] = new Index_1.DOMElement(referencedElement);
                }
            }
            for (var _i = 0, children_3 = children; _i < children_3.length; _i++) {
                var child = children_3[_i];
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (Index_1.isArray(child)) {
                    for (var _a = 0, child_3 = child; _a < child_3.length; _a++) {
                        var c = child_3[_a];
                        if (!c) {
                            continue;
                        }
                        bindChildDOM(c, renderId);
                    }
                }
                else {
                    bindChildDOM(child, renderId);
                }
            }
        }, function (element, renderId) {
            var elementComponent;
            var elementComponentId = props.id ? props.id : element.name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {
                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new element(props, children);
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }
            if (!elementComponent.hasBoundDOM) {
                elementComponent.bindDOM(renderId);
            }
            if (component) {
                component.components[props.ref || toCamelCase(elementComponent.id)] = elementComponent;
            }
            else {
                component = elementComponent;
            }
        });
        return renderId;
        function bindChildDOM(child, renderId) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.bindDOM(renderId);
            }
            else {
                child.bindDOM(renderId);
                var childComponent = child.getComponent();
                component.components[childComponent.props.ref || toCamelCase(childComponent.id)] = childComponent;
            }
        }
    }
    function instantiateComponents(renderId) {
        renderId = handleDOMAction(renderId, function (element, renderId) {
            for (var _i = 0, children_4 = children; _i < children_4.length; _i++) {
                var child = children_4[_i];
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (Index_1.isArray(child)) {
                    for (var _a = 0, child_4 = child; _a < child_4.length; _a++) {
                        var c = child_4[_a];
                        instantiateChildComponents(c, renderId);
                    }
                }
                else {
                    instantiateChildComponents(child, renderId);
                }
            }
        }, function (element, renderId) {
            var elementComponent = new element(props, children);
            instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            elementComponent.instantiateComponents(renderId);
        });
        return renderId;
        function instantiateChildComponents(child, renderId) {
            if (child.isCustomElement) {
                child.instantiateComponents(renderId);
            }
        }
    }
    function resetComponent() {
        component = undefined;
    }
    return {
        isIntrinsic: typeof element === 'string',
        isCustomElement: typeof element !== 'string',
        getComponent: function () { return component; },
        markAsChildOfRootElement: markAsChildOfRootElement,
        instantiateComponents: instantiateComponents,
        setComponent: setComponent,
        resetComponent: resetComponent,
        toString: toString,
        bindDOM: bindDOM,
        toDOM: toDOM,
    };
}
exports.createElement = createElement;
var _createElement = createElement;
var React;
(function (React) {
    React.createElement = _createElement;
})(React = exports.React || (exports.React = {}));
function toCamelCase(text) {
    return text[0].toLowerCase() + text.substring(1);
}
//# sourceMappingURL=Element.js.map