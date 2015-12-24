
/// <reference path='../../typings/es6-promise/es6-promise.d.ts'/>
/// <reference path='./layerComponents.d.ts' />
/// <reference path='./component.d.ts' />

import React = require('./element');
import express = require('express');
import { Component } from './component';
let __r = require;
import Sys from '../sys';
let sys: typeof Sys = inServer ? __r('../sys').default : undefined;
import Path = require('path');
let path: typeof Path = inServer ? __r('path') : undefined;
import Conf = require('../conf/server');
let cf: typeof Conf.default = inServer ? __r('../conf/server').default : undefined;

export interface PageLayerDeclaration {
    importPath: string;
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => Component<P, S, E>;
}

export interface DocumentDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerDocument<P, S, E>;
}

export interface LayoutDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerLayout<P, S, E>;
}

export interface ContentDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerContent<P, S, E>;
}

export interface StoredContentDeclarations {
    [index: string]: ContentDeclaration;
}

export interface ProvidedContentDeclarations {
    [index: string]: ContentDeclaration | (new<P extends Props, S, E extends Elements>(props?:P, children?: Child[]) => ComposerContent<P, S, E>);
}

export abstract class ComposerComponent<P extends Props, S, E extends Elements> extends Component<P, S, E> {

    /**
     * This static property is a native readonly JS property and it is automatically set to the
     * constructor's name.
     */
    public static name: string;
}

export abstract class ComposerDocument<P extends DocumentProps, S, E extends Elements> extends ComposerComponent<P, S, E> {
    public manifestExists: boolean;

    constructor (
        props?: P,
        children?: Child[]) {

        super(props, children);
        this.manifestExists = sys.fileExists(path.join(__dirname, '../public/rev-manifest.json'));
    }
}
export abstract class ComposerLayout<P extends Props, S, E extends Elements> extends ComposerComponent<P, S, E> {}

export abstract class ComposerContent<P extends Props, S, E extends Elements> extends ComposerComponent<P, S, E> {
    public static fetch<TRequest, TResult>(routeOrRequest: string | express.Request): Promise<TResult> { return }
    public static pendingPageTitle: string;
    public static pendingPageDescription: string;
    public static pendingPageKeywords: string;

    public static setPageInfo(props: any, pageInfo: PageInfo) {}

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

interface LinkProps extends Props {
    to: string;
    class: string;
}

interface E extends Elements {
    anchor: IDOMElement;
}

declare let __Router: any;

export class Link extends Component<LinkProps, any, any> {
    public navigateTo(event: Event) {
        event.preventDefault();

        __Router.navigateTo(this.props.to);
    }

    public bindDOM() {
        super.bindDOM();
        this.root.onClick(this.navigateTo.bind(this));
    }

    public render() {
        return (
            <a class={this.props.class}>{this.children}</a>
        );
    }
}
