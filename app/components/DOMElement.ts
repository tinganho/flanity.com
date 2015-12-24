
/// <reference path='./component.d.ts' />

import * as u from './utils';

export class DOMElement implements IDOMElement {
    public nativeElement: HTMLElement;

    /**
     * Get element by id.
     */
    static getElement(id: string) {
        let el = document.getElementById(id);
        return new DOMElement(el);
    }

    constructor(element: HTMLElement | IDOMElement) {
        if (this.isComposerDOMElement(element)) {
            this.nativeElement = element.nativeElement;
        }
        else {
            this.nativeElement = element;
        }
    }

    public get id() {
        return this.nativeElement.id;
    }

    public set id(id: string) {
        this.nativeElement.id = id;
    }

    private isComposerDOMElement(element: HTMLElement | IDOMElement): element is IDOMElement {
        return !!(element as DOMElement).findOne;
    }

    public findOne(query: string): DOMElement {
        let el = this.nativeElement.querySelector(query);
        return el ? new DOMElement(el as HTMLElement) : null;
    }

    public findAll(query: string): DOMElement[] {
        let elements = this.nativeElement.querySelectorAll(query) as any;
        return u.map(elements as any,element => {
            return new DOMElement(element as HTMLElement);
        });
    }

    public position(): { left: number, top: number } {
        let { left, top } = this.nativeElement.getBoundingClientRect();
        top = top + window.pageYOffset - this.nativeElement.ownerDocument.documentElement.clientTop;
        left = left + window.pageXOffset - this.nativeElement.ownerDocument.documentElement.clientLeft;
        return { left, top };
    }

    public getHeight(): number {
        let { height } = this.nativeElement.getBoundingClientRect();
        return height;
    }

    public getWidth(): number {
        let { width } = this.nativeElement.getBoundingClientRect();
        return width;
    }

    public getText(): string {
        return this.nativeElement.textContent;
    }

    public getAttribute(name: string): string {
        return this.nativeElement.getAttribute(name);
    }

    public setAttribute(name: string, value?: string): this {
        this.nativeElement.setAttribute(name, value);
        return this;
    }

    public removeAttribute(name: string): this {
        this.nativeElement.removeAttribute(name);
        return this;
    }

    public getHtml(): string {
        return this.nativeElement.innerHTML;
    }

    public setHtml(html: string): this {
        this.nativeElement.innerHTML = html;
        return this;
    }

    public append(element: DOMElement): this {
        this.nativeElement.appendChild(element.nativeElement);
        return this;
    }

    public prepend(element: DOMElement): this {
        this.nativeElement.insertBefore(element.nativeElement, this.nativeElement.firstChild);
        return this;
    }

    public before(element: DOMElement): this {
        this.nativeElement.parentNode.insertBefore(element.nativeElement, this.nativeElement);
        return this;
    }

    public after(element: DOMElement): this {
        this.nativeElement.parentNode.insertBefore(element.nativeElement, this.nativeElement.parentNode.lastChild);
        return this;
    }

    public hide(): this {
        this.nativeElement.style.display = 'none';
        return this;
    }

    public show(): this {
        this.nativeElement.style.display = '';
        return this;
    }

    public remove(): void {
        this.nativeElement.parentNode.removeChild(this.nativeElement);
    }

    public addClass(className: string): this {
        this.nativeElement.classList.add(className);
        return this;
    }

    public removeClass(className: string): this {
        this.nativeElement.classList.remove(className);
        return this;
    }

    public setClass(className: string): this {
        this.nativeElement.className = className;
        return this;
    }

    public addEventListener(event: string, listener: EventListener): this {
        this.nativeElement.addEventListener(event, listener, false);
        return this;
    }

    public removeEventListener(event: string, listener: EventListener): this {
        this.nativeElement.removeEventListener(event, listener);
        return this;
    }

    public getClasses(): string[] {
        return this.nativeElement.className.split(' ');
    }

    public onClick(listener: EventListener): this {
        this.nativeElement.addEventListener('click', listener, false);
        return this;
    }

    public onDbClick(listener: EventListener): this {
        this.nativeElement.addEventListener('dbclick', listener, false);
        return this;
    }

    public onSubmit(listener: EventListener): this {
        this.nativeElement.addEventListener('submit', listener, false);
        return this;
    }

    public onFocus(listener: EventListener): this {
        this.nativeElement.addEventListener('focus', listener, false);
        return this;
    }

    public onBlur(listener: EventListener): this {
        this.nativeElement.addEventListener('blur', listener, false);
        return this;
    }

    public whenTransitionEnd(callback: (...args: any[]) => any): this {
        let finish = () => {
            this.removeEventListener('transitionend', finish);
            this.removeEventListener('webkitTransitionEnd', finish);
            this.removeEventListener('oTransitionEnd', finish);
            this.removeEventListener('MSTransitionEnd', finish);
            callback();
        }
        this.addEventListener('transitionend', finish);
        this.addEventListener('webkitTransitionEnd', finish);
        this.addEventListener('oTransitionEnd', finish);
        this.addEventListener('MSTransitionEnd', finish);

        return this;
    }

    public clone(): DOMElement {
        return new DOMElement(this.nativeElement.cloneNode(true) as any);
    }

    public appendTo(target: DOMElement | string): this {
        if (typeof target === 'string') {
            let element = DOMElement.getElement(target);
            element.append(this);
        }
        else {
            target.append(this);
        }

        return this;
    }

    public getValue(): string {
        return (this.nativeElement as any).value;
    }
}