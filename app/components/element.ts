
/// <reference path='./component.d.ts' />

import { DOMElement } from './DOMElement';
import Debug from '../debug';
import * as u from './utils';

let id = 0;
let instantiatedComponents: { [renderId: string]: u.Map<Component<any, any, any>> } = {};
let nodes: { [node: string]: IDOMElement } = {};

export function getNodeLink(id: string) {
    if (id in nodes) return nodes[id];

    let root = document.getElementById(id);
    if (!root) {
        Debug.error(`Could not bind root element '{0}'.`, id);
    }

    // Defer delete of node link
    ((id: string) => {
        setTimeout(() => { delete nodes[id]; }, 100);
    })(id);

    return nodes[id] = new DOMElement(root);
}

export function getRenderId(): number {
    return id++;
}

export function resetId(): void {
    id = 0;
}

export function unsetInstantiatedComponents(renderId: number): void {
    delete instantiatedComponents[renderId];
}

export function getInstantiatedComponents(renderId: number): u.Map<Component<any, any, any>> {
    return instantiatedComponents[renderId];
}

export type ElementConstruct = (new<P extends Props, S, E extends Elements>(props: Props, children: Child[]) => Component<P, S, E>);

export function createElement(
    element: string | ElementConstruct,
    props: any,
    ...children: Child[]): JSX.Element {

    let component: Component<any, any, any>;
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
            setTimeout(() => {
                delete instantiatedComponents[renderId];
            }, 50);
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

            for (let child of children) {
                if (!child) {
                    continue;
                }
                if (typeof child === 'string') {
                    root.textContent += child;
                }
                else if ((child as IDOMElement).nativeElement) {
                    root.appendChild((child as IDOMElement).nativeElement);
                }
                else if((child as HTMLElement).classList) {
                    root.appendChild(child as HTMLElement);
                }
                else if (u.isArray<Child[]>(child)) {
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
            let elementComponentId = props.id ? (element as any).name + props.id : (element as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {

                elementComponent = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                elementComponent = new element(props, children);
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }
            frag.appendChild(elementComponent.toDOM());

            // Add root custom element. There is no component injected for non-root
            // custom element.
            if (component) {
                component.customElements[elementComponent.id] = elementComponent;
            }
            else {
                component = elementComponent;
            }
        });

        return { renderId, frag }

        function renderChildToDOM(root: HTMLElement, child: JSX.Element, renderId: number) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.markAsChildOfRootElement();
                root.appendChild(child.toDOM(renderId).frag);
            }
            else {
                root.appendChild(child.toDOM(renderId).frag);
                let childComponent = child.getComponent();
                component.customElements[childComponent.id] = childComponent;
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

            let innerHTML: string = null;

            for (let p in props) {
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
                    frag += ` ${convertCamelCasesToDashes(p)}`;
                }
                else if (p === 'ref') {
                    frag += ` data-ref="${props[p]}"`;
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
                    frag += child;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
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
            let customElement: Component<any, any, any>;
            let elementComponentId = props.id ? (element as any).name + props.id : (element as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {

                customElement = instantiatedComponents[renderId][elementComponentId];
            }
            else {
                customElement = new (element as ElementConstruct)(props, children);
            }
            frag += customElement.toString(renderId);
        }

        return frag;

        function renderChildToString(child: JSX.Element): string {
            if (child.isIntrinsic) {
                child.setComponent(component);
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
            component.root = getNodeLink(component.id);

            for (let p in props) {
                if (p === 'ref') {
                    let ref = props[p];
                    if (ref in component.elements) {
                        Debug.warn(`You are overriding the element reference '{0}'.`, ref);
                    }

                    let referencedElement = component.root.findOne(`[data-ref="${ref}"]`);
                    if (!referencedElement) {
                        Debug.error(`Could not bind referenced element '{0}'.`, ref);
                    }
                    component.elements[ref] = new DOMElement(referencedElement);
                }
            }

            for (let child of children) {
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
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
        (element, renderId) => {
            let elementComponent: Component<any, any, any>;
            let elementComponentId = props.id ? (element as any).name + props.id : (element as any).name;
            if (instantiatedComponents[renderId] &&
                instantiatedComponents[renderId][elementComponentId]) {
                elementComponent = instantiatedComponents[renderId][elementComponentId]
            }
            else {
                elementComponent = new element(props, children);
                instantiatedComponents[renderId][elementComponent.id] = elementComponent;
            }
            elementComponent.bindDOM(renderId);

            // Add root custom element. There is no component injected for non-root
            // custom element.
            if (component) {
                component.customElements[elementComponent.id] = elementComponent;
            }
            else {
                component = elementComponent;
            }
        });

        return renderId;

        function bindChildDOM(child: JSX.Element, renderId: number) {
            if (child.isIntrinsic) {
                child.setComponent(component);
                child.bindDOM(renderId);
            }
            else {
                child.bindDOM(renderId);
                let childComponent = child.getComponent();
                component.customElements[childComponent.id] = childComponent;
            }
        }
    }

    function instantiateComponents(renderId?: number): number {
        renderId = handleDOMAction(renderId, (element, renderId) => {
            for (let child of children) {
                if (!child || typeof child === 'string') {
                    continue;
                }
                else if (u.isArray<JSX.Element[]>(child)) {
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
        isIntrinsic: typeof element === 'string',
        isCustomElement: typeof element !== 'string',
        getComponent: () => component,
        markAsChildOfRootElement,
        instantiateComponents,
        setComponent,
        resetComponent,
        toString,
        bindDOM,
        toDOM,
    }
}