
declare let FontLoader: any;
declare function require(path: string): any;
declare function l(name: string, data: any): string;
declare function requireLocalizations(locale: string): typeof l;
(window as any).localizations = requireLocalizations(document.documentElement.getAttribute('lang'));


import { Contents, } from '../Core/ServerComposer';
import { Model, } from '../Library/Model';
import ReactMod = require('../Library/Element');
let React: typeof ReactMod = require('/Library/Element');
import {
    setDefaultHttpRequestOptions as setOption,
    setDefaultXCSRFTokenHeader as setDefaultXCSRFTokenHeaderType,
    setDefaultCORSCredentials as setDefaultCORSCredentialsType } from '../Library/HTTP';
let setDefaultHttpRequestOptions: typeof setOption = require('/Library/HTTP').setDefaultHttpRequestOptions;
let setDefaultXCSRFTokenHeader: typeof setDefaultXCSRFTokenHeaderType = require('/Library/HTTP').setDefaultXCSRFTokenHeader;
let setDefaultCORSCredentials: typeof setDefaultCORSCredentialsType = require('/Library/HTTP').setDefaultCORSCredentials;
import { ContentComponent as ContentComponentType, LayoutComponent, PageInfo } from '../Library/LayerComponents';
let ContentComponent: typeof ContentComponentType = require('/Library/LayerComponents');
import { DOMElement as DOMElementType } from '../Library/DOMElement';
let DOMElement: typeof DOMElementType = require('/Library/DOMElement').DOMElement;

interface Page {
    route: string;
    document: ComponentInfo;
    layout: ComponentInfo;
    contents: ContentComponentInfo[];
}

export interface ClassInfo {
    className: string;
    importPath: string;
}

export interface ComponentInfo {
    model?: ClassInfo;
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
    matcher: RegExp;
    path: string;
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

    constructor(public appName: string, pages: Page[], public pageComponents: any) {
        for (let page of pages) {
            let routePattern = '^' + page.route
                .replace(/:(\w+)\//, (match, param) => `(${param})`)
                .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$';

            let route: Route = {
                matcher: new RegExp(routePattern),
                path: page.route,
            }
            setDefaultXCSRFTokenHeader();
            setDefaultCORSCredentials();
            setDefaultHttpRequestOptions({
                protocol: cf.DEFAULT_HTTP_REQUEST_HTTPS ? 'https' : 'http',
                host: cf.DEFAULT_HTTP_REQUEST_HOST,
                port: cf.DEFAULT_HTTP_REQUEST_PORT,
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
            window.onpopstate = () => {
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
            if (route.matcher.test(currentRoute)) {
                this.renderPage(this.routingInfoIndex[route.path]);
                return true;
            }
            return false;
        });
    }

    private loadContentFromJsonScripts(placeholderContents: Contents, page: Page): void {
        for (let content of page.contents) {
            let jsonElement = document.getElementById(`composer-content-json-${content.model.className.toLowerCase()}`);
            if (!jsonElement) {
                throw new Error(
`Could not find JSON file ${content.name}. Are you sure
this component is properly named?`);
            }
            try {
                this.currentRegions.push(content.region);
                let props = jsonElement.innerHTML !== '' ? JSON.parse(jsonElement.innerHTML).data : {};
                props.l = (window as any).localizations;
                placeholderContents[content.region] = React.createElement(this.pageComponents.Contents[content.view.className], props, null);
            }
            catch(err) {
                console.log(jsonElement.innerHTML)
                throw new Error(`Could not parse JSON for ${content.name}.\n ${err.message}`)
            }
            if (jsonElement.remove) {
                jsonElement.remove();
            }
            else {
                jsonElement.parentElement.removeChild(jsonElement);
            }
        }
    }

    private bindLayoutAndContents(page: Page, contents: Contents): void {
        this.currentLayoutView = new this.pageComponents.Layout[page.layout.view.className](contents);
        this.currentLayoutView.bindDOM();
        this.currentContents = this.currentLayoutView.components as any;
    }

    private renderPage(page: Page): void {
        let contents: Contents = {};
        if (this.inInitialPageLoad) {
            this.loadContentFromJsonScripts(contents, page);
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

        for (let content of nextPage.contents) {

            // Filter the content that will propogate to the next page.
            if (this.currentContents.hasOwnProperty(toCamelCase(content.view.className))) {
                continue;
            }

            let ContentView = this.pageComponents.Contents[content.view.className];
            let ContentModel = this.pageComponents.Contents[content.model.className];

            expectedNumberOfFetches++;

            ((contentInfo: ContentComponentInfo, ContentModel: typeof Model, ContentView: typeof ContentComponent) => {
                let model = new ContentModel;
                model.fetch().then(() => {

                    let ViewClass = this.pageComponents.Contents[contentInfo.view.className];
                    (model.props as any).l = (window as any).localizations;
                    (model.props as any).model = model;
                    ViewClass.setPageInfo(model.props, (model.props as any).l, pageInfo);

                    changePageTitle(pageInfo.title || 'NO_PAGE_TITLE');
                    changePageDescription(pageInfo.description);
                    changePageImage(pageInfo.image);

                    newContents[contentInfo.region] = React.createElement(ViewClass, model.props, null);

                    currentNumberOfFetches++;
                    if (currentNumberOfFetches === expectedNumberOfFetches) {
                        let LayoutComponentClass = (this as any).pageComponents.Layout[nextPage.layout.view.className];

                        // If we are not in the same layout, we will replace the current layout region with a new one.
                        if (LayoutComponentClass.name !== this.currentLayoutView.id) {
                            let layoutComponent = new LayoutComponentClass(newContents);
                            this.currentLayoutView.remove();
                            document.getElementById('LayoutRegion').appendChild(layoutComponent.toDOM());
                            layoutComponent.bindDOM();
                            layoutComponent.show();
                            this.currentLayoutView = layoutComponent;
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
                                let outgoingComponent = this.currentLayoutView.props[r].getComponent();
                                this.currentLayoutView.setProp(r, content);
                                content.setComponent(this.currentLayoutView);
                                region.appendChild(content.toDOM().frag);

                                // Component after rendering the DOM, becomes the content component.
                                let ingoingComponent = content.getComponent();
                                ingoingComponent.root.addClass('Ingoing');
                                outgoingComponent.root.addClass('Outgoing').removeClass('Final');

                                ((componentId: string) => {
                                    let hasOutgoingTransition = false;
                                    outgoingComponent.root.onTransitionEnd(() => {
                                        if (outgoingComponent.isOutgoing()) {
                                            outgoingComponent.remove();
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
                                        }
                                    });
                                })(outgoingComponent.id);

                                setTimeout(() => {
                                    ingoingComponent.root.addClass('Final').removeClass('Ingoing');
                                }, 0);
                                this.currentLayoutView.components[toCamelCase(ingoingComponent.id)] = ingoingComponent;

                                // We must reset the component created by the `toDOM()` method above.
                                // Because children component should not have component reference
                                // in their create element closure. If we don't reset the component
                                // reference there will be a component property referencing itself.
                                // content.resetComponent();
                                ingoingComponent.bindDOM();
                            }

                        }
                    }
                })
                .catch((err: Error) => {
                    console.log(err.stack);
                });

            })(content, ContentView, ContentModel);
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

export default Router;