
import React = require('./Element');
import { Component } from './Component';
import { JsonScriptAttributes } from '../Core/ServerComposer';
let __r = require;
import SystemType from './Server/System';
let System: typeof SystemType = inServer ? __r('./Server/System').System : undefined;

export abstract class ComposerComponent<P, L, E> extends Component<P, L, E> {

    /**
     * This static property is a native readonly JS property and it is automatically set to the
     * constructor's name.
     */
    public static name: string;
}

export interface PageInfo {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    URL?: string;
    lang?: string;
    language?: string;
}

export interface DocumentProps {
    confs?: string[];
    title?: string;
    styles?: string[];
    jsonScriptData?: JsonScriptAttributes[];
    layout?: any;
    pageInfo?: PageInfo;
}

export abstract class DocumentComponent<P, L, E> extends ComposerComponent<P, L, E> {
    public manifestExists: boolean;

    constructor (
        props?: P & { data?: any },
        children?: Child[]) {

        super(props, children);
        this.manifestExists = System.fileExists(System.joinPaths(__dirname, '../Public/rev-manifest.json'));
    }
}

export abstract class LayoutComponent<P, L, E> extends ComposerComponent<P, L, E> {}

export abstract class ContentComponent<P, L, E> extends ComposerComponent<P, L, E> {
    public static pendingPageTitle: string;
    public static pendingPageDescription: string;
    public static pendingPageKeywords: string;

    public static setPageInfo(l: GetLocalization, pageInfo: PageInfo, props?: any) {}

    public static setPageTitle(title: string, pageInfo: PageInfo) {
        pageInfo.title = title;
    }

    public static setPageDescription(description: string, pageInfo: PageInfo) {
        pageInfo.description = description;
    }

    public static setPageImage(path: string, pageInfo: PageInfo) {
        pageInfo.image = cf.ORIGIN + path;
    }

    public static setPageKeyword(keywords: string, pageInfo: PageInfo) {
        pageInfo.keywords = keywords;
    }

    public static setPageURL(path: string, pageInfo: PageInfo) {
        pageInfo.URL = cf.ORIGIN + path;
    }

    public scrollWindowTo(to: number, duration: number): void {
        let start = window.scrollY;
        let change = to - start;
        let increment = 15;
        let originalTime = Date.now();
        let elapsedTime: number;

        function animateScroll() {
            elapsedTime = Date.now() - originalTime;
            window.scrollTo(0, easeInOut(elapsedTime, start, change, duration));
            if (elapsedTime < duration) {
                requestAnimationFrame(animateScroll);
            }
        }

        function easeInOut(currentTime: number, start: number, change: number, duration: number) {
            currentTime /= duration / 2;
            if (currentTime < 1) {
                return change / 2 * currentTime * currentTime + start;
            }
            currentTime -= 1;
            return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
        }

        requestAnimationFrame(animateScroll);
    }
}
