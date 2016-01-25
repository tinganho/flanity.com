
declare let FontLoader: any;
declare function require(path: string): any;
declare function l(name: string, data: any): string;
declare function requireLocalizations(locale: string): typeof l;
(window as any).localizations = requireLocalizations(document.documentElement.getAttribute('lang'));


import { Contents, } from '../Core/ServerComposer';
import { Model, Collection, RequestInfo } from '../Library/DataStore';
import ReactMod = require('../Library/Element');
let React: typeof ReactMod = require('/Library/Element');
import {
    setDefaultHttpRequestOptions as setDefaultHttpRequestOptionsType,
    setDefaultXCSRFTokenHeader as setDefaultXCSRFTokenHeaderType,
    setDefaultCORSCredentials as setDefaultCORSCredentialsType,
    HTTPResponse,
    ErrorResponse,
    HTTP as HTTPType,
    HTTPError as HTTPErrorType } from '../Library/HTTP';
let setDefaultHttpRequestOptions: typeof setDefaultHttpRequestOptionsType = require('/Library/HTTP').setDefaultHttpRequestOptions;
let setDefaultXCSRFTokenHeader: typeof setDefaultXCSRFTokenHeaderType = require('/Library/HTTP').setDefaultXCSRFTokenHeader;
let setDefaultCORSCredentials: typeof setDefaultCORSCredentialsType = require('/Library/HTTP').setDefaultCORSCredentials;
let HTTP: typeof HTTPType = require('/Library/HTTP').HTTP;
let HTTPError: typeof HTTPErrorType = require('/Library/HTTP').HTTPError;

import { ContentComponent as ContentComponentType, LayoutComponent, PageInfo } from '../Library/LayerComponents';
let ContentComponent: typeof ContentComponentType = require('/Library/LayerComponents');
import { DOMElement as DOMElementType } from '../Library/DOMElement';
let DOMElement: typeof DOMElementType = require('/Library/DOMElement').DOMElement;

interface PlatformInfo {
    document: ComponentInfo;
    layout: ComponentInfo;
    contents: ContentComponentInfo[];
    detect(): boolean;
}

interface PlatformInfoIndex {
    [key: string]: PlatformInfo;
}

interface Page {
    route: string;
    platforms: PlatformInfoIndex;
}

export interface ClassInfo {
    className: string;
    importPath: string;
}

export interface ComponentInfo {
    data?: ClassInfo;
    relations?: string[];
    view: ClassInfo;
    name: string;
}

export interface ContentComponentInfo extends ComponentInfo {
    region: string;
}

interface Map {
   [entity: string]: string;
}

interface Route {
    pattern: RegExp;
    path: string;
    params: string[];
}

const enum AutenticationError {
    AuthorizationHeaderNotProvided,
    AccessTokenExpired,
    InvalidAccessToken,
    NoXCsrfToken,
}

interface CurrentContents {
    [content: string]: ContentComponentType<any, any, any>;
}

export class Router {
    public layoutRegion: HTMLElement;
    public currentLayoutView: LayoutComponent<any, any, any>;
    public currentContents: CurrentContents;
    public inInitialPageLoad = true;
    public hasPushState = window.history && !!window.history.pushState;
    public routingInfoIndex: { [index: string]: Page } = {};
    public routes: Route[] = [];
    public currentRegions: string[] = [];
    public onPushState: (route: string) => void;

    private currentParams: any = {};
    private currentPlatform: string;

    constructor(public appName: string, pages: Page[], public pageComponents: any, public platformDetects: any) {
        for (let page of pages) {
            let routeParams: string[] = [];
            let routePattern = '^' + page.route
                .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
                .replace(/:(\w+)(\/?)/, (match, param, end) => {
                    routeParams.push(param);
                    let lastChar = match.charAt(match.length - 1);
                    return '(.+)' + (end || '');
                }) + '$';

            let route: Route = {
                pattern: new RegExp(routePattern),
                path: page.route,
                params: routeParams,
            }
            setDefaultXCSRFTokenHeader();
            setDefaultCORSCredentials();
            setDefaultHttpRequestOptions({
                protocol: cf.DEFAULT_HTTP_REQUEST_HTTPS ? 'https' : 'http',
                host: cf.DEFAULT_HTTP_REQUEST_HOST,
                port: cf.DEFAULT_HTTP_REQUEST_PORT,
                timeout: cf.DEFAULT_HTTP_REQUEST_TIMEOUT,
            });

            this.routes.push(route);
            this.routingInfoIndex[route.path] = page;
            this.layoutRegion = document.getElementById('LayoutRegion');
        }

        if (cf.IN_IMAGE_TEST) {
            let fontLoader = new FontLoader(['Roboto'], {
                complete: (error: any) => {
                    markFontsAsLoaded();
                }
            }, 3000);
            fontLoader.loadFonts();
        }

        this.checkRouteAndRenderIfMatch(document.location.pathname);

        if (this.hasPushState) {
            window.onpopstate = (event) => {
                this.checkRouteAndRenderIfMatch(document.location.pathname);
            }
            this.onPushState = this.checkRouteAndRenderIfMatch;
        }
    }

    public getQueryParam(name: string): string {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        let regExp = new RegExp(`[\\?&]${name}=([^&#]*)`);
        let results = regExp.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    public navigateTo(route: string, state?: Object): void {
        if (this.hasPushState) {
            window.history.pushState(state, null, route);
        }
        else {
            window.location.pathname = route;
        }
        this.onPushState(route);
    }

    private checkRouteAndRenderIfMatch(currentRoute: string): void {
        this.routes.some(route => {
            if (route.pattern.test(currentRoute)) {
                let matches = route.pattern.exec(currentRoute);
                for (let i = 0; i < route.params.length; i++) {
                    this.currentParams[route.params[i]] = matches[i + 1];
                }
                for (let i in this.routingInfoIndex[route.path].platforms) {
                    if (this.platformDetects[i]()) {
                        this.currentPlatform = i;
                        break;
                    }
                }
                this.renderPage(this.routingInfoIndex[route.path]);
                return true;
            }
            return false;
        });
    }

    private loadContentFromJSONScripts(placeholderContents: Contents, page: Page): void {
        for (let content of page.platforms[this.currentPlatform].contents) {
            if (content.data) {
                let jsonElement = document.getElementById(`bd-${content.region}`);
                if (!jsonElement) {
                    throw new Error(
`Could not find JSON file ${content.name}. Are you sure
this component is properly named?`);
                }
                try {
                    this.currentRegions.push(content.region);
                    let data = jsonElement.innerHTML !== '' ? JSON.parse(jsonElement.innerHTML).data : {};
                    let props = {
                        data: new this.pageComponents.Contents[content.data.className](data, getCookie('userId')),
                        l: (window as any).localizations,
                    }
                    placeholderContents[content.region] = React.createElement(this.pageComponents.Contents[content.view.className], props, null);
                }
                catch(err) {
                    console.log(jsonElement.innerHTML);
                    throw new Error(`Could not parse JSON for ${content.name}.\n ${err.message}`)
                }
                if (jsonElement.remove) {
                    jsonElement.remove();
                }
                else {
                    jsonElement.parentElement.removeChild(jsonElement);
                }
            }
            else {
                placeholderContents[content.region] = React.createElement(this.pageComponents.Contents[content.view.className], { l: (window as any).localizations }, null);
            }
        }
    }

    private bindLayoutAndContents(page: Page, contents: Contents): void {
        this.currentLayoutView = new this.pageComponents.Layout[page.platforms[this.currentPlatform].layout.view.className](contents);
        this.currentLayoutView.bindDOM();
        this.currentContents = this.currentLayoutView.components as any;
    }

    private renderPage(page: Page): void {
        let contents: Contents = {};
        if (this.inInitialPageLoad) {
            this.loadContentFromJSONScripts(contents, page);
            this.bindLayoutAndContents(page, contents);
            this.inInitialPageLoad = false;
        }
        else {
            this.handleClientPageRequest(page);
        }
    }

    private handleClientPageRequest(nextPage: Page) {
        let pageInfo: PageInfo = {};
        let newContents: Contents = {};
        let currentNumberOfFetches = 0;
        let expectedNumberOfFetches = 0;

        unmarkLoadFinished();

        for (let content of nextPage.platforms[this.currentPlatform].contents) {

            // Filter the content that will propogate to the next page.
            if (this.currentContents.hasOwnProperty(toCamelCase(content.view.className))) {
                continue;
            }

            let ContentView = this.pageComponents.Contents[content.view.className];
            let ContentData = content.data ? this.pageComponents.Contents[content.data.className] : undefined;
            let requestInfo: RequestInfo<any, any> = {
                params: this.currentParams,
                query: location.search,
                cookies: {
                    userId: getCookie('userId'),
                }
            }
            expectedNumberOfFetches++;

            ((contentInfo: ContentComponentInfo, ContentData: new() => Model<any> | Collection<Model<any>>, ContentView: typeof ContentComponent) => {
                let ViewClass = this.pageComponents.Contents[contentInfo.view.className];

                let render = () => {
                    changePageTitle(pageInfo.title || 'NO_PAGE_TITLE');
                    changePageDescription(pageInfo.description);
                    changePageImage(pageInfo.image);

                    if (currentNumberOfFetches === expectedNumberOfFetches) {
                        let LayoutComponentClass = (this as any).pageComponents.Layout[nextPage.platforms[this.currentPlatform].layout.view.className];

                        // If we are not in the same layout, we will replace the current layout region with a new one.
                        if (LayoutComponentClass.name !== this.currentLayoutView.id) {
                            this.currentLayoutView.root.addStyle('z-index', '10000000');
                            this.currentLayoutView.onRemove();
                            let layoutComponent = new LayoutComponentClass(newContents);
                            document.getElementById('LayoutRegion').appendChild(layoutComponent.toDOM());
                            layoutComponent.bindDOM();
                            layoutComponent.onShow();
                            setTimeout(() => {
                                layoutComponent.root.addClass('Final').removeClass('Ingoing')
                                    .onTransitionEnd(() => {
                                        this.currentContents = layoutComponent.components as CurrentContents;
                                        this.currentLayoutView = layoutComponent;
                                        markLoadFinished();
                                    });
                            }, 0);
                        }

                        // If we are in the same layout, we will remove irrelevant content and bind the new content.
                        else {
                            let currentRemovals = 0;
                            let expectedRemovals = 0;
                            for (let r in newContents) {
                                expectedRemovals++;

                                let content = (newContents as any)[r];
                                let region = document.getElementById(r);
                                if (!region) {
                                    throw new Error('Region \'' + r + '\' is missing.');
                                }
                                let hasOutgoingComponent = typeof this.currentLayoutView.props[r] !== 'undefined';
                                let outgoingComponent: any;
                                if (hasOutgoingComponent) {
                                    outgoingComponent = this.currentLayoutView.props[r].getComponent();
                                }
                                this.currentLayoutView.setProp(r, content);
                                content.setComponent(this.currentLayoutView);
                                region.appendChild(content.toDOM().frag);

                                // Component after rendering the DOM, becomes the content component.
                                let ingoingComponent = content.getComponent();
                                ingoingComponent.root.addClass('Ingoing');
                                if (outgoingComponent) {
                                    outgoingComponent.root.addClass('Outgoing').removeClass('Final');

                                    ((componentId: string) => {
                                        let hasOutgoingTransition = false;
                                        outgoingComponent.root.onTransitionEnd(() => {
                                            if (outgoingComponent.isOutgoing()) {
                                                outgoingComponent.onRemove();
                                            }
                                            hasOutgoingTransition = true;
                                        });

                                        // Give developer a warning that he has not implemented an outgoing transition.
                                        setTimeout(() => {
                                            if (!hasOutgoingTransition) {
                                                console.warn(`You do not have an outgoing transition for component '${componentId}'.`);
                                            }
                                        }, 3000);

                                        outgoingComponent.onRemoval(() => {
                                            delete this.currentLayoutView.components[toCamelCase(componentId)];

                                            currentRemovals++;
                                            if (currentRemovals === expectedRemovals) {
                                                this.currentContents = this.currentLayoutView.components as CurrentContents;
                                                markLoadFinished();
                                            }
                                        });
                                    })(outgoingComponent.id);
                                }

                                setTimeout(() => {
                                    ingoingComponent.root.addClass('Final').removeClass('Ingoing');
                                }, 0);
                                this.currentLayoutView.components[toCamelCase(ingoingComponent.id)] = ingoingComponent;

                                // We must reset the component created by the `toDOM()` method above.
                                // Because children component should not have component reference
                                // in their create element closure. If we don't reset the component
                                // reference there will be a component property referencing itself.
                                ingoingComponent.bindDOM();

                            }
                        }
                    }
                }

                if (ContentData) {
                    let data = new ContentData;
                    data.fetch(requestInfo, contentInfo.relations).then(() => {
                        ViewClass.setPageInfo(data, (window as any).localizations, pageInfo);

                        let props = {
                            l: (window as any).localizations,
                            data,
                        }
                        newContents[contentInfo.region] = React.createElement(ViewClass, props, null);
                        currentNumberOfFetches++;
                        render();
                    })
                    .catch((error: Error | HTTPResponse<ErrorResponse>) => {
                        if (error instanceof Error) {
                            console.log(error.stack || error);
                        }
                        else {
                            let HTTPErrorCode = error.body.code;
                            if (HTTPErrorCode === HTTPError.UnAuthorizedAccessError) {
                                let errorCode = error.body.feedback.current.code;
                                if (errorCode === AutenticationError.InvalidAccessToken
                                || errorCode === AutenticationError.AccessTokenExpired) {
                                    this.navigateTo('/');
                                }
                            }

                            else if (HTTPErrorCode === HTTPError.NotFoundError) {

                            }
                        }
                    });
                }
                else {
                    newContents[contentInfo.region] = React.createElement(ViewClass, { l: (window as any).localizations }, null);
                    ViewClass.setPageInfo({}, (window as any).localizations, pageInfo);

                    // Add timeout so 'currentNumberOfFetches' doesn't equal 'expectedNumberOfFetches' more than once.
                    setTimeout(() => {
                        currentNumberOfFetches++;
                        render();
                    }, 0);
                }


            })(content, ContentData, ContentView);
        }
    }
}

function toCamelCase(text: string): string {
    return text[0].toLowerCase() + text.substring(1);
}

function changePageTitle(title: string): void {
    document.title = title;
    DOMElement.getElement('OGTitle').setHTML(title);
}

function changePageDescription(description: string) {
    let pageDescriptionElement = DOMElement.getElement('PageDescription');
    let OGDescriptionElement = DOMElement.getElement('OGDescription');

    if (!description) {
        if (pageDescriptionElement) {
            pageDescriptionElement.remove();
        }
        if (OGDescriptionElement) {
            OGDescriptionElement.remove();
        }
        return;
    }

    if (pageDescriptionElement) {
        pageDescriptionElement.setAttribute('content', description);
    }
    else {
        let el = DOMElement.createElement('meta');
        el.setAttribute('id', 'PageDescription');
        el.setAttribute('property', 'description');
        el.setAttribute('content', description);
        el.appendTo(document.head);
    }

    if (OGDescriptionElement) {
        OGDescriptionElement.setAttribute('content', description);
    }
    else {
        let el = DOMElement.createElement('meta');
        el.setAttribute('id', 'OGDescription');
        el.setAttribute('property', 'og:description');
        el.setAttribute('content', description);
        el.appendTo(document.head);
    }
}

function changePageImage(imagePath: string): void {
    let OGImageElement = DOMElement.getElement('OGImage');
    if (!imagePath) {
        if (OGImageElement) {
            OGImageElement.remove();
        }
        return;
    }

    if (OGImageElement) {
        OGImageElement.setAttribute('content', imagePath);
    }
    else {
        let el = DOMElement.createElement('meta');
        el.setAttribute('id', 'OGImage');
        el.setAttribute('property', 'og:image');
        el.setAttribute('content', imagePath);
        el.appendTo(document.head);
    }
}

function markFontsAsLoaded() {
    let el = DOMElement.createElement('div');
    el.setAttribute('style', 'display: none;');
    el.setAttribute('id', 'FontFinishedLoading');
    el.appendTo('LayoutRegion');
}

let marks = 0;
function markLoadFinished() {
    marks += 1;
    if (marks !== 0) {
        return;
    }
    let el = DOMElement.createElement('div');
    el.setAttribute('style', 'display: none;');
    el.setAttribute('id', 'FinishedLoading');
    el.appendTo('LayoutRegion');
}
(window as any).markLoadFinished = markLoadFinished;

function unmarkLoadFinished() {
    marks -= 1;
    let el = DOMElement.getElement('FinishedLoading');
    if (el) {
        el.remove();
    }
}
(window as any).unmarkLoadFinished = unmarkLoadFinished;

function getCookie(name: string) {
    let nameAndEqual = name + '=';
    let cookieSegments = document.cookie.split(';');
    for (let i = 0; i < cookieSegments.length; i++) {
        let c = cookieSegments[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(nameAndEqual) === 0) {
             return c.substring(nameAndEqual.length, c.length);
        }
    }
    return '';
}

window.onerror = (error) => {
    document.body.setAttribute('data-error', (error as any).stack || error);
}

export default Router;
