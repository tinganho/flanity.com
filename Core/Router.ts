
declare function l(name: string, data: any): string;
declare function requireLocalizations(locale: string): typeof l;
(window as any).localizations = requireLocalizations(document.documentElement.getAttribute('lang'));

declare function require(path: string): any;
import ReactMod = require('../Library/Element');
let React: typeof ReactMod = require('Core/Element');

import {
    setDefaultHttpRequestOptions as setOption,
    setDefaultXCsrfTokenHeader as setXCsrfToken,
    setDefaultCorsCredentials as setCorsCredentials } from '../Library/HTTP';
let setDefaultHttpRequestOptions: typeof setOption = require('/Library/HTTP').setDefaultHttpRequestOptions;
let setDefaultXCsrfTokenHeader: typeof setXCsrfToken = require('/Library/HTTP').setDefaultXCsrfTokenHeader;
let setDefaultCorsCredentials: typeof setCorsCredentials = require('/Library/HTTP').setDefaultCorsCredentials;
import { ContentComponent, LayoutComponent, } from '../Library/LayerComponents';
import { Contents, } from '../Core/ServerComposer';
import { Model, } from '../Library/Model';

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
    [content: string]: ContentComponent<any, any, any>;
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
            setDefaultXCsrfTokenHeader();
            setDefaultCorsCredentials();
            setDefaultHttpRequestOptions({
                protocol: cf.DEFAULT_HTTP_REQUEST_HTTPS ? 'https' : 'http',
                host: cf.DEFAULT_HTTP_REQUEST_HOST,
                port: cf.DEFAULT_HTTP_REQUEST_PORT,
            });

            this.routes.push(route);
            this.routingInfoIndex[route.path] = page;
            this.layoutRegion = document.getElementById('LayoutRegion');
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

    private bindLayoutAndContents(page: Page, contents: Contents) {
        this.currentLayoutView = new this.pageComponents.Layout[page.layout.view.className](contents);
        this.currentLayoutView.bindDOM();
        this.currentContents = this.currentLayoutView.components as any;
    }

    private loopThroughIrrelevantCurrentContentsAndExecMethod(nextPage: Page, method: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let currentNumberOfRemoves = 0;
            let expectedNumberOfRemoves = 0;
            let reuseRegions: string[] = [];

            if (!this.currentContents || Object.keys(this.currentContents).length === 0) {
                return reject(new Error('You have not set any content for the current page.'));
            }

            for (let currentContent in this.currentContents) {
                if (!this.currentContents.hasOwnProperty(currentContent)) return;

                let removeCurrentContent = true;
                for (let nextContent of nextPage.contents) {
                    if (nextContent.view.className === (this as any).currentContents[currentContent].constructor.name) {
                        removeCurrentContent = false;
                        reuseRegions.push(nextContent.region);
                    }
                }

                if (!(this as any).currentContents[currentContent][method]) {
                    return reject(new Error('You have not implemented a hide or remove method for \'' + currentContent.constructor.name + '\''))
                }

                ((currentContent: string) => {
                    if (removeCurrentContent) {
                        expectedNumberOfRemoves++;
                        this.currentContents[currentContent].recursivelyCallMethod(method)
                            .then(() => {
                                currentNumberOfRemoves++;
                                if (method === 'remove') {
                                    for (let r of this.currentRegions) {

                                        // Dispose current regions which are not used on the next page.
                                        // We need dispose them because layout needs to call bindDOM correctly.
                                        if (reuseRegions.indexOf(r) === -1) {
                                            this.currentLayoutView.unsetProp(r);
                                        }
                                    }
                                }
                                if (currentNumberOfRemoves === expectedNumberOfRemoves) {
                                    resolve(undefined);
                                }
                            });
                    }
                })(currentContent);
            }
        });
    }

    private removeIrrelevantCurrentContents(nextPage: Page): Promise<void> {
        return this.loopThroughIrrelevantCurrentContentsAndExecMethod(nextPage, 'remove');
    }

    private hideIrrelevantCurrentContents(nextPage: Page): Promise<void> {
        return this.loopThroughIrrelevantCurrentContentsAndExecMethod(nextPage, 'hide');
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

    private handleClientPageRequest(page: Page) {
        let newContents: Contents = {};
        let currentNumberOfFetches = 0;
        let expectedNumberOfFetches = 0;

        this.hideIrrelevantCurrentContents(page).then(() => {
            for (let content of page.contents) {

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

                        (model.props as any).l = (window as any).localizations;
                        (model.props as any).model = model;

                        newContents[contentInfo.region] = React.createElement(this.pageComponents.Contents[contentInfo.view.className], model.props, null);

                        currentNumberOfFetches++;
                        if (currentNumberOfFetches === expectedNumberOfFetches) {
                            let LayoutComponentClass = (this as any).pageComponents.Layout[page.layout.view.className];

                            // If we are not in the same layout, we will replace the current layout region with a new one.
                            if (LayoutComponentClass.name !== this.currentLayoutView.id) {
                                let layoutComponent = new LayoutComponentClass(newContents);
                                this.currentLayoutView.remove();
                                document.getElementById('LayoutRegion').appendChild(layoutComponent.toDOM());
                                layoutComponent.show();
                                this.currentLayoutView = layoutComponent;
                            }

                            // If we are in the same layout, we will remove irrelevant content and bind the new content.
                            else {
                                this.removeIrrelevantCurrentContents(page).then(() => {
                                    for (let c in newContents) {
                                        let content = (newContents as any)[c];
                                        let region = document.getElementById(c);
                                        if (!region) {
                                            throw new Error('Region \'' + c + '\' is missing.');
                                        }
                                        this.currentLayoutView.setProp(c, content);
                                        region.appendChild(content.toDOM().frag);

                                        // We must reset the component created by the `toDOM()` method above.
                                        // Because children custom element should not have component reference
                                        // in their create element closure. If we don't reset the component
                                        // reference there will be a custom element property referencing itself.
                                        content.resetComponent();
                                    }

                                    this.currentLayoutView.hasBoundDOM = false;
                                    this.currentLayoutView.bindDOM();
                                    this.currentContents = this.currentLayoutView.components as CurrentContents;

                                    for (let c in this.currentContents) {
                                        this.currentContents[c].recursivelyCallMethod('show');
                                    }
                                });
                            }
                        }
                    })
                    .catch((err: Error) => {
                        console.log(err.stack);
                    });

                })(content, ContentView, ContentModel);
            }
        });
    }
}

function toCamelCase(text: string): string {
    return text[0].toLowerCase() + text.substring(1);
}

export default Router;