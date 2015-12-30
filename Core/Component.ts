
import {
    extend,
    getInstantiatedComponents,
    DOMElement } from '../Library/Index';

export interface Props {
    id?: string | number;

    [prop: string]: any;
}

type Hook = () => void;

export abstract class Component<P extends Props, L, E> {
    private removeHooks: Hook[] = [];

    /**
     * Get element by id.
     */
    public static getElement(id: string) {
        let el = document.getElementById(id);
        return new DOMElement(el);
    }

    public localizations: GetLocalization;

    /**
     * Root element of the component view.
     */
    public root: DOMElement;

    /**
     * Properties.
     */
    public props: P & { l?: GetLocalization };

    /**
     * Referenced elements from component.
     */
    public elements: E;

    /**
     * Localization strings storage.
     */
    public l10ns = {} as L;

    /* @internal */
    public hasRenderedFirstElement = false;

    /* @internal */
    public children: Child[];

    /* @internal */
    public hasBoundDOM = false;

    public components: Components = {};

    /* @internal */
    public instantiatedComponents: Components;

    public lastRenderId: number;

    constructor(
        props?: P,
        children?: Child[]) {

        this.props = extend({}, extend(props || {}, this.props)) as P & { l: GetLocalization };

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
     * Check if component is outgoing.
     */
    public isOutgoing(): boolean {
        return this.root.hasClass('Outgoing');
    }

    /**
     * Remove is called be the router whenever we switch pages and
     * want to remove some components. This remove function is called immediately
     * after fetching of the new page is finished.
     */
    public remove(): Promise<void> {
        this.root.remove();
        this.hookDown(this.removeHooks);
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
        for (let c in target['components']) {
            if (target['components'][c][method]) {
                promises.push(target['components'][c][method]());
            }
        }
        this.recurseMethodCalls(target['components'], method, promises);
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
            this.setLocalizations(this.props.l);
            this.components = {};
            this.lastRenderId = this.renderAndSetComponent().bindDOM(renderId);
            this.hasBoundDOM = true;
        }
    }

    /**
     * Find specific node using id.
     */
    public findElement(id: string): DOMElement {
        return new DOMElement(document.getElementById(id));
    }

    /**
     * Append to
     */
    public appendTo(id: string): Component<P, L, E> {
        let element = document.getElementById(id);
        if (!element) {
            throw new Error('Element not found: ' + id);
        }
        element.appendChild(this.toDOM());
        return this;
    }

    /**
     * This hook will be invoked before the render. Put all your localizations in here.
     */
    public setLocalizations(l: GetLocalization) {
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
        this.setLocalizations(this.props.l);
        let s =  this.renderAndSetComponent().toString(renderId || this.lastRenderId);
        return s;
    }

    /* @internal */
    public toDOM(renderId?: number): DocumentFragment {
        this.setLocalizations(this.props.l);
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

    public onRemoval(hook: Hook) {
        this.removeHooks.push(hook);
    }

    /**
     * Call callbacks using FIFO order.
     */
    private hookDown(hooks: Hook[]) {
        let hook = hooks.shift();
        hook && hook();
    }
}