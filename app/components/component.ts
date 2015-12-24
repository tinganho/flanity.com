
/// <reference path='../../typings/es6-promise/es6-promise.d.ts' />
/// <reference path='../../typings/express/express.d.ts' />
/// <reference path='./component.d.ts' />

import { Platform, getPlatform } from './platform';
import { DOMElement } from './DOMElement';
import { unsetInstantiatedComponents, getInstantiatedComponents } from './element';
import * as u from './utils';

export abstract class Component<P extends Props, S, E extends Elements> {

    /**
     * Get element by id.
     */
    static getElement(id: string) {
        let el = document.getElementById(id);
        return new DOMElement(el);
    }

    /**
     * Root element of the component view.
     */
    public root: DOMElement;

    /**
     * Properties.
     */
    public props: P;

    /**
     * Referenced elements from component.
     */
    public elements: E;

    /**
     * Current state of component.
     */
    public states: S;

    /**
     * Put your localization strings here.
     */
    public l10ns: any;

    /* @internal */
    public hasRenderedFirstElement = false;

    /* @internal */
    public children: Child[];

    /* @internal */
    public hasBoundDOM = false;

    public customElements: Components = {};

    /* @internal */
    public instantiatedComponents: Components;

    public lastRenderId: number;

    constructor(
        props?: P,
        children?: Child[]) {

        this.props = u.extend({}, u.extend(props || {}, this.props)) as P;

        this.children = children;
        (this as any).elements = {}
    }

    /**
     * Define you render with JSX elements.
     */
    public abstract render(): JSX.Element;

    public setProps(props: P): void {
        this.props = props;
    }

    public setProp(name: string, value: any): void {
        if (this.props) {
            this.props[name] = value;
        }
        else {
            (this as any).props = {
                [name]: value
            }
        }
    }

    public unsetProp(name: string): void {
        delete this.props[name];
    }

    public get id() {
        return this.props.id ? this.props.id : (this as any).constructor.name;
    }

    /**
     * Remove is called be the router whenever we switch pages and
     * want to remove some components. This remove function is called immediately
     * after fetching of the new page is finished.
     */
    public remove(): Promise<void> {
        this.root.remove();
        return Promise.resolve(undefined);
    }

    /**
     * Hide is called immediately after a route have been matched and the current
     * component does not belong to the next page. This function is suitable to do
     * some hiding animation or display loadbars before next page is being rendered.
     */
    public hide(): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * Show is called during initial page load or directly after having switched to
     * a new page. If your component are hidden with styles during initial page load
     * it is now suitable to show them with this function. Show is also called whenever
     * a page request failed to unhide components.
     */
    public show(): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * Call method recursively over all `customElements`. The method is called with no arguments.
     */
    public recursivelyCallMethod(method: string): Promise<void> {
        return new Promise<void>((resolve) => {
            let promises: Promise<void>[] = [];
            if ((this as any)[method]) {
                promises.push((this as any)[method]());
            }
            this.recurseMethodCalls(this, method, promises);
            Promise.all(promises).then(() => {
                resolve(undefined);
            });
        });
    }

    public recurseMethodCalls(target: any, method: string, promises: Promise<void>[]): void {
        if (!target) {
            return;
        }
        for (let c in target['customElements']) {
            if (target['customElements'][c][method]) {
                promises.push(target['customElements'][c][method]());
            }
        }
        this.recurseMethodCalls(target['customElements'], method, promises);
    }

    /**
     * Fetch is called everytime we switch to a new page. Each component on each page
     * needs to be finished loading before the new page is showned.
     */
    public fetch<R>(req: Express.Request): Promise<R> {
        return Promise.resolve(undefined);
    }

    public bindDOM(renderId?: number): void {
        if (!this.hasBoundDOM) {
            this.customElements = {};
            this.lastRenderId = this.renderAndSetComponent().bindDOM(renderId);
            this.hasBoundDOM = true;
        }
    }

    /**
     * Find specific node using id.
     */
    public findNode(id: string): IDOMElement {
        return new DOMElement(document.getElementById(id));
    }

    /**
     * Append to
     */
    public appendTo(id: string): Component<P, S, E> {
        let element = document.getElementById(id);
        if (!element) {
            throw new Error('Element not found: ' + id);
        }
        element.appendChild(this.toDOM());
        return this;
    }

    /**
     * Bind Interactions is the first function to be called during all page loads to bind the
     * component interactions with the DOM. All elements are already binded so there is no need
     * to bind them. Please bind any interactions that you find suitable.
     */
    public bindInteractions(): void {

    }

    /**
     * Get instances of components before they are rendered.
     */
    public getInstancesOf(...components: string[]): Components {
        let componentBuilder: Components = {};
        this.lastRenderId = this.renderAndSetComponent().instantiateComponents();
        let instantiatedComponents = getInstantiatedComponents(this.lastRenderId);
        for (let c of components) {
            componentBuilder[c] = instantiatedComponents[c];
        }
        return componentBuilder;
    }

    /* @internal */
    public instantiateComponents(renderId: number): void {
        this.renderAndSetComponent().instantiateComponents(renderId);
    }

    /* @internal */
    public toString(renderId?: number): string {
        let s =  this.renderAndSetComponent().toString(renderId || this.lastRenderId);
        return s;
    }

    /* @internal */
    public toDOM(renderId?: number): DocumentFragment {
        let DOMRender = this.renderAndSetComponent().toDOM(renderId || this.lastRenderId);
        this.lastRenderId = DOMRender.renderId;
        return DOMRender.frag;
    }

    /* @internal */
    public renderAndSetComponent(): JSX.Element {
        let rootElement = this.render();
        rootElement.setComponent(this);
        return rootElement;
    }
}

export default Component;