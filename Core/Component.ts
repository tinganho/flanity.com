
import {
    React,
    extend,
    getInstantiatedComponents,
    DOMElement,
    Model,
    Collection } from '../Library/Index';

export interface Props {
    id?: string | number;

    [prop: string]: any;
}

interface Hooks {
    [event: string]: Hook[];
}
type Hook = () => void;

export interface Component {
    /**
     * Set the text life cycle method.
     */
    setText(l: GetLocalization): void;

    /**
     * Bind Interactions is the first function to be called during all page loads to bind the
     * component interactions with the DOM. All elements are already binded so there is no need
     * to bind them. Please bind any interactions that you find suitable.
     */
    bindInteractions(): void;

    /**
     * Show is fired everytime when you append an external content with `appendRelationComponent`.
     */
    show(): void;
}

export abstract class Component<P extends Props, T, E> {
    private removeHooks: Hook[] = [];
    private hooks: Hooks = {};

    /**
     * Get element by id.
     */
    public static getElement(id: string) {
        let el = document.getElementById(id);
        return new DOMElement(el);
    }

    public parentComponent: Component<any, any, any>;

    public localizations: GetLocalization;

    /**
     * Root element of the component view.
     */
    public root: DOMElement;

    /**
     * Properties.
     */
    public props: P & { l?: GetLocalization, data?: Model<any> & Collection<Model<any>> };

    /**
     * Referenced elements from component.
     */
    public elements: E;

    /**
     * Localization strings storage.
     */
    public text = {} as T;

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

        this.props = extend({}, extend(props || {}, this.props)) as P & { l: GetLocalization, model: Model<any> };

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
    public onRemove(): Promise<void> {
        this.root.remove();
        this.hookDownOnce(this.removeHooks);
        return Promise.resolve(undefined);
    }

    /**
     * Hide is called immediately after a route have been matched and the current
     * component does not belong to the next page. This function is suitable to do
     * some hiding animation or display loadbars before next page is being rendered.
     */
    public onHide(): Promise<void> {
        return Promise.resolve(undefined);
    }

    /**
     * Show is called during initial page load or directly after having switched to
     * a new page. If your component are hidden with styles during initial page load
     * it is now suitable to show them with this function. Show is also called whenever
     * a page request failed to unhide components.
     */
    public onShow(): Promise<void> {
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

    public bindDOM(renderId?: number): void {
        if (!this.hasBoundDOM) {
            if (this.setText) {
                this.setText(this.props.l);
            }
            if (this.props.data) {
                this.props.data.on('change', () => {
                    this.setText(this.props.l);
                    this.hookDown(this.hooks['change:text']);
                });
            }

            this.components = {};
            this.lastRenderId = this.renderAndSetComponent().bindDOM(renderId);
            this.hasBoundDOM = true;
        }
    }

    public getElement(id: string) {
        let el = this.root.nativeElement.querySelector('#' + id);
        if (!el) {
            throw new Error('Element not found: ' + id);
        }
        return new DOMElement(el as HTMLElement);
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
    public appendTo(id: string): Component<P, T, E> {
        let element = document.getElementById(id);
        if (!element) {
            throw new Error('Element not found: ' + id);
        }
        element.appendChild(this.toDOM());
        return this;
    }

    /**
     * Append a relation component to element. Omit id if you want it to append to the root element.
     */
    public appendRelationComponent(c: new() => Component<any, any, any>, relation: string, id?: string) {
        let view = React.createElement(c, { l: this.props.l, data: this.props.data.get(relation)});
        view.setComponent(this);
        let element: DOMElement;
        if (!id) {
            element = this.root;
        }
        else {
            element = this.root.getElement(id);
        }
        element.append(view);


        let component = view.getComponent() as Component<any, any, any>;
        component.bindDOM();
        component.root.setHeight(element.getHeight());
        component.root.setWidth(element.getWidth());
        component.root.addStyle('position', 'absolute');
        component.root.addStyle('top', '0');
        component.root.addStyle('left', '0');
        setTimeout(() => {
            component.root.addClass('Revealed').removeClass('Hidden');
        }, 0);
        return component;
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
        if (this.setText) {
            this.setText(this.props.l);
        }
        let s =  this.renderAndSetComponent().toString(renderId || this.lastRenderId);
        return s;
    }

    /* @internal */
    public toDOM(renderId?: number): DocumentFragment {
        if (this.setText) {
            this.setText(this.props.l);
        }
        if (this.props.data) {
            this.props.data.on('change', () => {
                this.setText(this.props.l);
                this.hookDown(this.hooks['change:text']);
            });
        }
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
     * Call hooks using FIFO order and removes the callback.
     */
    private hookDownOnce(hooks: Hook[]) {
        let hook = hooks.shift();
        hook && hook();
    }

    /**
     * Call hooks using FIFO order.
     */
    public hookDown(hooks: Hook[]) {
        for (let i = hooks.length - 1; i >= 0; i--) {
            hooks[i]();
        }
    }

    public on(event: string, callback: (...args: any[]) => void): void {
        if (!this.hooks[event]) {
            this.hooks[event] = [];
        }
        this.hooks[event].push(callback);
    }
}