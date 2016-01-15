
import { DOMElement, Debug, isArray, Map, HTMLEncode } from '../Library/Index';
import { Component, Props } from '../Core/Component';

let id = 0;
let instantiatedComponents: { [renderId: string]: Map<Component<any, any, any>> } = {};
let nodes: { [node: string]: DOMElement } = {};

export function getNodeLink(id: string) {
    if (id in nodes) return nodes[id];

    let root = document.getElementById(id);
    if (!root) {
        Debug.error(`Could not bind root element '{0}'.`, id);
    }

    // Defer delete of node link
    ((id: string) => {
        setTimeout(() => { delete nodes[id]; }, 0);
    })(id);

    return nodes[id] = new DOMElement(root);
}

export function getRenderId(): number {
    return id++;
}

export function resetId(): void {
    id = 0;
}

export function getInstantiatedComponents(renderId: number): Map<Component<any, any, any>> {
    return instantiatedComponents[renderId];
}

export type ComponentConstruct = (new<P extends Props, S, E>(props: Props, children: Child[]) => Component<P, S, E>);

export function createElement(
    element: string | ComponentConstruct,
    props: any,
    ...children: Child[]): JSX.Element {

    props = props || {};

    let component: Component<any, any, any>;
    let childComponent: Component<any, any, any>
    let isChildOfRootElement = false;

    function setComponent(c: Component<any, any, any>): void {
        component = c;
    }

    function markAsChildOfRootElement(): void {
        isChildOfRootElement = true;
    }

    function handleDOMAction(
        renderId: number,
        handleIntrinsicElement: (element: string, renderId: number) => void,
        handleCustomElement: (element: new(props: Props, children: Child[]) => Component<any, any, any>, renderId: number) => void): number {

        if (!renderId) {
            renderId = getRenderId();

            // Remove this render on next tick.
            ((renderId: number) => {
                setTimeout(() => {
                    delete instantiatedComponents[renderId];
                }, 0);
            })(renderId);
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
            handleCustomElement(element as any, renderId);
        }

        return renderId;
    }

    function toDOM(renderId?: number): { renderId: number, frag: DocumentFragment } {
        let frag = document.createDocumentFragment();
        renderId = handleDOMAction(renderId, (element, renderId) => {
            let root = document.createElement(element);

            if (!component.hasRenderedFirstElement) {
                component.root = new DOMElement(root);
                root.setAttribute('id', component.id);
            }

            let innerHTML: string = null;

            for (let p in props) {
                if (p === 'id' && !component.hasRenderedFirstElement) {
                    continue;
                }
                else if (p === 'ref') {
                    let ref = props[p];
                    if (ref in component.elements) {
                        Debug.warn(`You are overriding the element reference '{0}'.`, ref);
                    }
                    root.setAttribute('data-ref', ref);
                    component.elements[ref] = new DOMElement(root);
                }

                else if (p === 'bindText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        component.on('change:text', () => {
                            let element = component.root.findOne(`[data-b-t=${value}]`);
                            if (attr) {
                                element.setAttribute(attr, HTMLEncode(component.text[value]));
                            }
                            else {
                                element.setHTML(HTMLEncode(component.text[value]));
                            }
                        });
                    })(props[p]);
                }
                else if (p === 'bindUnsafeText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        component.on('change:text', () => {
                            let element = component.root.findOne(`[data-b-t=${value}]`);
                            if (attr) {
                                element.setAttribute(attr, component.text[value]);
                            }
                            else {
                                element.setHTML(component.text[value]);
                            }
                        });
                    })(props[p]);
                }
                else if (p === 'bindText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        root.setAttribute('data-b-t', value);
                        component.on('change:text', () => {
                            if (attr) {
                                root.setAttribute(attr, HTMLEncode(component.text[value]));
                            }
                            else {
                                root.innerHTML = HTMLEncode(component.text[value]);
                            }
                        });
                    })(props[p]);
                }
                else if (p === 'bindUnsafeText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        root.setAttribute('data-b-t', value);
                        component.on('change:text', () => {
                            if (attr) {
                                root.setAttribute(attr, component.text[value]);
                            }
                            else {
                                root.innerHTML = component.text[value];
                            }
                        });
                    })(props[p]);
                }
                else if (p === 'html') {
                    innerHTML = props[p] || '';
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

            for (let child of children) {
                if (!child) {
                    continue;
                }
                if (typeof child === 'string') {
                    root.textContent += child;
                }
                else if ((child as DOMElement).nativeElement) {
                    root.appendChild((child as DOMElement).nativeElement);
                }
                else if((child as HTMLElement).classList) {
                    root.appendChild(child as HTMLElement);
                }
                else if (isArray<Child[]>(child)) {
                    for (let c of child) {
                        renderChildToDOM(root, c, renderId);
                    }
                }
                else {
                    renderChildToDOM(root, child as JSX.Element, renderId);
                }
            }

            frag.appendChild(root);

            // If the current element is root element of a component. Then we want to
            // reset the first rendered element flag. Otherwise, child of root
            // elements can cause some the next sibling child to render the id
            // attribute. And we don't want that to happen. Only the root element
            // should render an id by default.
            if (!isChildOfRootElement) {

                // Reset rendered first element flag so we can render the id again.
                component.hasRenderedFirstElement = false;
            }
        },
        (element, renderId) => {
            let elementComponent: Component<any, any, any>;
            let elementComponentId = props.id ? props.id : (element as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {

                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new element(props, children);

                if (props.data) {
                    elementComponent.data = props.data;
                }
                if (props.l) {
                    elementComponent.l = props.l;
                }
                else if (component.l) {
                    elementComponent.l = component.l;
                }
                else if (inClient) {
                    elementComponent.l = (window as any).localizations;
                }
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }

            // Add element component's root element to parent component.
            if (component) {
                elementComponent.parentComponent = component;
                component.components[props.ref || toCamelCase(elementComponent.id)] = elementComponent;
            }
            component = elementComponent;

            frag.appendChild(elementComponent.toDOM());
        });

        return { renderId, frag }

        function renderChildToDOM(root: HTMLElement, child: JSX.Element, renderId: number) {
            child.setComponent(component);
            if (child.isIntrinsic) {
                child.markAsChildOfRootElement();
                root.appendChild(child.toDOM(renderId).frag);
            }
            else {
                root.appendChild(child.toDOM(renderId).frag);
            }
        }
    }

    function convertCamelCasesToDashes(text: string) {
        return text.replace(/([A-Z])/g, (m) => {
            return '-' + m.toLowerCase();
        });
    }

    function toString(renderId?: number): string {
        let frag = '';
        if (typeof element === 'string') {
            frag = `<${element}`;

            if (!component.hasRenderedFirstElement) {
                frag += ` id="${component.id}"`;
            }

            let innerHTML: string = '';

            for (let p in props) {
                if (typeof props[p] !== 'boolean' && typeof props[p] !== 'string') {
                    continue;
                }
                if (p === 'id' && !component.hasRenderedFirstElement) {
                    continue;
                }
                if (p === 'html') {
                    innerHTML += props[p] || '';
                    continue;
                }
                if (typeof props[p] === 'boolean') {
                    frag += ` ${convertCamelCasesToDashes(p)}`;
                }
                else if (p === 'ref') {
                    frag += ` data-ref="${props[p]}"`;
                }
                else if (p === 'bindText') {
                    let [attr, value] = (props[p] as string).split(':');
                    if (!value) {
                        innerHTML += HTMLEncode(component.text[attr] || '');
                    }
                    else {
                        frag += ` ${attr}="${HTMLEncode(component.text[value])}"`;
                    }
                    frag += ` data-b-t="${value || attr}"`;
                }
                else if (p === 'bindUnsafeText') {
                    let [attr, value] = (props[p] as string).split(':');
                    if (!value) {
                        innerHTML += component.text[attr] || '';
                    }
                    else {
                        frag += ` ${attr}="${component.text[value]}"`;
                    }
                    frag += ` data-b-t="${value || attr}"`;
                }
                else {
                    frag += ` ${convertCamelCasesToDashes(p)}="${props[p]}"`;
                }
            }

            frag += '>';

            if (innerHTML) {
                frag += innerHTML;
            }

            component.hasRenderedFirstElement = true;

            for (let child of children) {
                if (!child) {
                    continue;
                }
                if (typeof child === 'string') {
                    frag += HTMLEncode(child);
                }
                else if (isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        frag += renderChildToString(c);
                    }
                }
                else {
                    frag += renderChildToString(child as JSX.Element);
                }
            }

            frag += `</${element}>`;

            // If the current element is root element of a component. Then we want to
            // reset the first rendered element flag. Otherwise, child of root
            // elements can cause some the next sibling child to render the id
            // attribute. And we don't want that to happen. Only the root element
            // should render an id by default.
            if (!isChildOfRootElement) {

                // Reset rendered first element flag so we can render the id again.
                component.hasRenderedFirstElement = false;
            }
        }
        else {
            let elementComponent: Component<any, any, any>;
            let elementComponentId = props.id ? props.id : (element as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {

                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new (element as ComponentConstruct)(props, children);

                if (props.data) {
                    elementComponent.data = props.data;
                }
                if (props.l) {
                    elementComponent.l = props.l;
                }
                else if (component.l) {
                    elementComponent.l = component.l;
                }
            }
            frag += elementComponent.toString(renderId);
        }

        return frag;

        function renderChildToString(child: JSX.Element): string {
            child.setComponent(component);
            if (child.isIntrinsic) {
                child.markAsChildOfRootElement();
            }
            return child.toString();
        }
    }

    /**
     * Set references by binding the elements to the component. Should only
     * be called by the composer router.
     */
    function bindDOM(renderId?: number): number {
        renderId = handleDOMAction(renderId, (element, renderId) => {
            if (component.parentComponent) {
                component.root = component.parentComponent.getElement(component.id);
            }
            else {
                component.root = Component.getElement(component.id);
            }

            for (let p in props) {
                if (p === 'ref') {
                    let ref = props[p];
                    if (ref in component.elements) {
                        Debug.warn(`You are overriding the element reference '{0}'.`, ref);
                    }

                    let referencedElement = component.root.findOne(`[data-ref="${ref}"]`);
                    if (!referencedElement) {
                        if (component.root.getAttribute('data-ref') === ref) {
                            referencedElement = component.root;
                        }
                        else {
                            Debug.error(`Could not bind referenced element '{0}'.`, ref);
                        }
                    }
                    component.elements[ref] = new DOMElement(referencedElement);
                }
                else if (p === 'bindText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        component.on('change:text', () => {
                            let element = component.root.findOne(`[data-b-t=${value}]`);
                            if (attr) {
                                element.setAttribute(attr, HTMLEncode(component.text[value]));
                            }
                            else {
                                element.setHTML(HTMLEncode(component.text[value]));
                            }
                        });
                    })(props[p]);
                }
                else if (p === 'bindUnsafeText') {
                    ((text: string) => {
                        let [attr, value] = text.split(':');
                        if (!value) {
                            value = attr;
                            attr = undefined;
                        }
                        component.on('change:text', () => {
                            let element = component.root.findOne(`[data-b-t=${value}]`);
                            if (attr) {
                                element.setAttribute(attr, component.text[value]);
                            }
                            else {
                                element.setHTML(component.text[value]);
                            }
                        });
                    })(props[p]);
                }
            }

            for (let child of children) {
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        if(!c) {
                            continue;
                        }
                        bindChildDOM(c, renderId);
                    }
                }
                else {
                    bindChildDOM(child as JSX.Element, renderId);
                }
            }
        },
        (ElementComponent, renderId) => {
            let elementComponent: Component<any, any, any>;
            let elementComponentId = props.id ? props.id : (ElementComponent as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {

                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new ElementComponent(props, children);

                if (props.data) {
                    elementComponent.data = props.data;
                }
                if (props.l) {
                    elementComponent.l = props.l;
                }
                else if (component.l) {
                    elementComponent.l = component.l;
                }
                else if (inClient) {
                    elementComponent.l = (window as any).localizations;
                }
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }

            // Add root custom element. There is no component injected for non-root
            // custom element.
            if (component) {
                elementComponent.parentComponent = component;
                component.components[props.ref || toCamelCase(elementComponent.id)] = elementComponent;
            }
            component = elementComponent;
            if (!elementComponent.hasBoundDOM) {
                elementComponent.bindDOM(renderId);
            }
        });

        return renderId;

        function bindChildDOM(child: JSX.Element, renderId: number) {
            child.setComponent(component);
            if (child.isIntrinsic) {
                child.bindDOM(renderId);
            }
            else {
                child.bindDOM(renderId);
            }
        }
    }

    function instantiateComponents(renderId?: number): number {
        renderId = handleDOMAction(renderId, (element, renderId) => {
            for (let child of children) {
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (isArray<JSX.Element[]>(child)) {
                    for (let c of child) {
                        instantiateChildComponents(c, renderId);
                    }
                }
                else {
                    instantiateChildComponents(child as JSX.Element, renderId);
                }
            }
        },
        (element, renderId) => {
            let elementComponent = new element(props, children);
            instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            elementComponent.instantiateComponents(renderId);
        });

        return renderId;

        function instantiateChildComponents(child: JSX.Element, renderId: number): void {
            if (child.isCustomElement) {
                child.instantiateComponents(renderId);
            }
        }
    }

    function resetComponent() {
        component = undefined;
    }

    return {
        name: typeof element === 'string' ? element : (element as any).name,
        isIntrinsic: typeof element === 'string',
        isCustomElement: typeof element !== 'string',
        getComponent: () => component,
        getChildComponent: () => childComponent,
        markAsChildOfRootElement,
        instantiateComponents,
        setComponent,
        resetComponent,
        toString,
        bindDOM,
        toDOM,
    }
}
var _createElement = createElement;

export namespace React {
    export var createElement = _createElement;
}

function toCamelCase(text: string): string {
    return text[0].toLowerCase() + text.substring(1);
}