
/// <reference path='../es6-promise/es6-promise.d.ts'/>

declare module 'selenium-webdriver' {

    export interface Hash {
        id?: string;
        className?: string;
        js?: string;
        linkText?: string;
        name?: string;
        css?: string;
        partialLinkText?: string;
        tagName?: string;
        xpath?: string;
    }

    interface Key {
        NULL: string;
        CANCEL: string;  // ^break
        HELP: string;
        BACK_SPACE: string;
        TAB: string;
        CLEAR: string;
        RETURN: string;
        ENTER: string;
        SHIFT: string;
        CONTROL: string;
        ALT: string;
        PAUSE: string;
        ESCAPE: string;
        SPACE: string;
        PAGE_UP: string;
        PAGE_DOWN: string;
        END: string;
        HOME: string;
        ARROW_LEFT: string;
        LEFT: string;
        ARROW_UP: string;
        UP: string;
        ARROW_RIGHT: string;
        RIGHT: string;
        ARROW_DOWN: string;
        DOWN: string;
        INSERT: string;
        DELETE: string;
        SEMICOLON: string;
        EQUALS: string;

        NUMPAD0: string;  // number pad keys
        NUMPAD1: string;
        NUMPAD2: string;
        NUMPAD3: string;
        NUMPAD4: string;
        NUMPAD5: string;
        NUMPAD6: string;
        NUMPAD7: string;
        NUMPAD8: string;
        NUMPAD9: string;
        MULTIPLY: string;
        ADD: string;
        SEPARATOR: string;
        SUBTRACT: string;
        DECIMAL: string;
        DIVIDE: string;

        F1: string;  // function keys
        F2: string;
        F3: string;
        F4: string;
        F5: string;
        F6: string;
        F7: string;
        F8: string;
        F9: string;
        F10: string;
        F11: string;
        F12: string;

        COMMAND: string;  // Apple command key
        META: string;   // alias for Windows key
    }
    export var Key: Key;

    export interface Capabilities {
        [capability: string]: any;
    }

    class Locator {}

    interface Id {
        ELEMENT: string;
    }

    export type ElementQuery<T> = Hash | Locator | Condition<T>;

    class WebElement {
        public static equals(a: WebElement, b: WebElement): Promise<boolean>;
        public static Id: Id;
        public static ELEMENT_KEY: string;

        constructor(driver: WebDriver, id: string);

        public clear(): Promise<void>;
        public click(): Promise<void>;
        public findElement(locator: Locator | Hash): WebElement;
        public findElements(locator: Locator | Hash): Promise<WebElement[]>;
        public getAttribute(attributeName: string): Promise<string>;
        public getCssValue(cssStyleProperty: string): Promise<string>;
        public getDriver(): WebDriver;
        public getId(): Promise<Object>;
        public getInnerHtml(): Promise<string>;
        public getLocation(): Promise<Position>;
        public getOuterHtml(): Promise<string>;
        public getRawId(): Promise<string>;
        public getSize(): Promise<Size>;
        public getTagName(): Promise<string>;
        public getText(): Promise<string>;
        public isDisplayed(): Promise<boolean>;
        public isElementPresent(): Promise<boolean>;
        public isEnabled(): Promise<boolean>;
        public isSelected(): Promise<boolean>;
        public sendKeys(keys: string): Promise<void>;
        public serialize(): Id;
        public clear(): Promise<void>;
        public submit(): Promise<void>;
    }

    interface Cookie {
        name: string;
        value: string;
        path?: string;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;

        /**
         * When the cookie expires, specified in seconds since midnight, January 1, 1970 UTC.
         */
        expiry?: number;
    }

    interface Log {
        timestamp: number;
        level: string;
        message: string;
    }

    interface Position {
        x: number;
        y: number;
    }

    interface Size {
        width: number;
        height: number;
    }

    interface Speed {
        xspeed: number;
        yspeed: number;
    }

    class Window {
        getPosition(): Promise<Position>;
        setPosition(x: number, y: number): Promise<void>;
        getSize(): Promise<Size>;
        setSize(width: number, height: number): Promise<void>;
        maximize(): Promise<void>;
    }

    class TouchSequence {
        constructor(driver: WebDriver);

        public doubleTap(element: WebElement): TouchSequence;
        public flick(speed: Speed): TouchSequence;
        public flickElement(element: WebElement, offset: Position, speed: Speed): TouchSequence;
        public longPress(element: WebElement): TouchSequence;
        public move(location: Position): TouchSequence;
        public perform(): Promise<void>;
        public release(location: Position): TouchSequence;
        public scroll(offset: Position): TouchSequence;
        public scrollFromElement(element: WebElement, offset: Position): TouchSequence;
        public tap(element: WebElement): TouchSequence;
        public tapAndHold(element: WebElement): TouchSequence;
    }

    class Options {
        public addCookie(name: string, value: string, path?: string, domain?: string, isSecure?: boolean, expiry?: number): Promise<void>;
        public deleteCookie(name: string): Promise<void>;
        public deleteAllCookies(): Promise<void>;
        public getCookie(name: string): Promise<Cookie>;
        public getCookies(): Promise<Cookie[]>;
        public window(): Window;
    }

    class WebDriver {
        public get(url: string): Promise<void>;
        public getTitle(): Promise<string>;
        public takeScreenshot(): Promise<string>;
        public findElement<T>(query: ElementQuery<T>): WebElement;
        public isElementPresent<T>(query: ElementQuery<T>): Promise<void>;
        public quit(): Promise<void>;
        public manage(): Options;
        public executeScript(script: (...args: any[]) => void): Promise<any>;
        public executeAsyncScript(script: (...args: any[]) => void): Promise<any>;
        public wait<T>(condition: Condition<T>, timeout?: number, message?: string): Promise<void>;
    }

    class Alert {
        constructor(driver: WebDriver, text: string);

        public accept(): Promise<void>;
        public dismiss(): Promise<void>;
        public getText(): Promise<string>;
        public sendKeys(text: string): Promise<void>;
    }

    class Condition<T> {
        constructor(message: string, fn: (...arg: any[]) => any);
        description(): string;
    }

    export class Builder {
        public usingServer(url: string): Builder;
        public withCapabilities(capabilities: Capabilities): Builder;
        public forBrowser(name: string): Builder;
        public build(): WebDriver;
    }

    class _By {
        name: (name: string) => Locator;
        id: (id: string) => Locator;
        className: (className: string) => Locator;
        css: (css: string) => Locator;
        linkText: (text: string) => Locator;
        js: (script: string, args: any) => Promise<any>;
        partialLinkText: (text: string) => Locator;
        tagName: (tagName: string) => Locator;
        xpath: (xpath: string) => Locator;
    }

    export var By: _By;

    class _Until {
        alertIsPresent(): Condition<Alert>;
        elementIsDisabled(element: WebElement): Condition<boolean>;
        elementIsEnabled(element: WebElement): Condition<boolean>;
        elementIsNotSelected(element: WebElement): Condition<boolean>;
        elementIsNotVisible(element: WebElement): Condition<boolean>;
        elementIsSelected(element: WebElement): Condition<boolean>;
        elementIsVisible(element: WebElement): Condition<boolean>;
        elementLocated(element: Locator | Hash): Condition<WebElement>;
        elementTextContains(element: WebElement, substr: string): Condition<boolean>;
        elementTextIs(element: WebElement, text: string): Condition<boolean>;
        elementTextMatches(element: WebElement, regex: RegExp): Condition<boolean>;
        elementsLocated(element: Locator): Condition<WebElement[]>;
        stalenessOf(element: WebElement): Condition<boolean>;
        titleContains(substr: string): Condition<boolean>;
        titleIs(title: string): Condition<boolean>;
        titleMatches(regex: RegExp): Condition<boolean>;
    }

    export var until: _Until;
}