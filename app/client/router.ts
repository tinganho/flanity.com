
/// <reference path='./router.d.ts'/>
/// <reference path='../components/component.d.ts'/>
/// <reference path='../components/layerComponents.d.ts'/>
/// <reference path='../../typings/es6-promise/es6-promise.d.ts'/>

declare function l(name: string, data: any): string;
declare function requireLocalizations(locale: string): typeof l;
(window as any).localizations = requireLocalizations(document.documentElement.getAttribute('lang'));

declare function require(path: string): any;
import ReactMod = require('../components/element');
let React: typeof ReactMod = require('components/element');

interface Map {
   [entity: string]: string;
}

interface Route {
    matcher: RegExp;
    path: string;
}

interface CurrentContents {
    [content: string]: ComposerContent<any, any, any>;
}

export class Router {
    public layoutRegion: HTMLElement;
    public currentLayoutComponent: ComposerLayout<any, any, any>;
    public currentContents: CurrentContents;
    public inInitialPageLoad = true;
    public hasPushState = window.history && !!window.history.pushState;
    public routingInfoIndex: { [index: string]: Page } = {};
    public routes: Route[] = [];
    public currentRegions: string[] = [];
    public onPushState: (route: string) => void;

    constructor(public appName: string, pages: Page[], public pageComponents: PageComponents) {

        for (let page of pages) {
            let routePattern = '^' + page.route
                .replace(/:(\w+)\//, (match, param) => `(${param})`)
                .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$';

            let route: Route = {
                matcher: new RegExp(routePattern),
                path: page.route,
            }

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
            let jsonElement = document.getElementById(`composer-content-json-${content.className.toLowerCase()}`);
            if (!jsonElement) {
                throw new Error(
`Could not find JSON file ${content.className}. Are you sure
this component is properly named?`);
            }
            try {
                this.currentRegions.push(content.region);
                placeholderContents[content.region] = React.createElement((window as any)[this.appName].Component.Content[content.className], jsonElement.innerHTML !== '' ? JSON.parse(jsonElement.innerHTML).data : {}, null);
            }
            catch(err) {
                console.log(jsonElement.innerHTML)
                throw new Error(`Could not parse JSON for ${content.className}.\n ${err.message}`)
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
        this.currentLayoutComponent = new (this as any).pageComponents.Layout[page.layout.className](contents);
        this.currentLayoutComponent.bindDOM();
        this.currentContents = this.currentLayoutComponent.customElements as any;
    }

    private renderLayoutAndContents(page: Page, contents: Contents) {
    }

    private showErrorDialog(err: Error): void {

    }

    private loopThroughIrrelevantCurrentContentsAndExec(nextPage: Page, method: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let currentNumberOfRemoves = 0;
            let expectedNumberOfRemoves = 0;
            let usedRegions: string[] = [];

            if (!this.currentContents || Object.keys(this.currentContents).length === 0) {
                return reject(new Error('You have not set any content for the current page.'));
            }
            for (var currentContent in this.currentContents) {
                if (!this.currentContents.hasOwnProperty(currentContent)) return;

                var removeCurrentContent = true;
                for (let nextContent of nextPage.contents) {
                    if (nextContent.className === (this as any).currentContents[currentContent].constructor.name) {
                        removeCurrentContent = false;
                        usedRegions.push(nextContent.region);
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
                                        if (usedRegions.indexOf(r) === -1) {
                                            this.currentLayoutComponent.unsetProp(r);
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
        return this.loopThroughIrrelevantCurrentContentsAndExec(nextPage, 'remove');
    }

    private hideIrrelevantCurrentContents(nextPage: Page): Promise<void> {
        return this.loopThroughIrrelevantCurrentContentsAndExec(nextPage, 'hide');
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
        let contents: Contents = {};
        let currentNumberOfNetworkRequests = 0;
        let expectedNumberOfNetworkRequest = 0;

        this.hideIrrelevantCurrentContents(page).then(() => {
            let contentClassNames: string[] = [];
            for (var content of page.contents) {
                var ContentComponent = (window as any)[this.appName].Component.Content[content.className];

                // Filter those which are not going to fetch content from network
                if (this.currentContents.hasOwnProperty(content.className)) {
                    continue;
                }

                expectedNumberOfNetworkRequest++;

                // Is only used below to get all content instances of the layout component
                contentClassNames.push(content.className);

                ((contentInfo: ContentComponentInfo, ContentComponent: typeof ComposerContent) => {
                    if (typeof ContentComponent.fetch !== 'function') {
                        throw Error(`You have not implemented a static fetch function on your component ${contentInfo.className}`);
                    }
                    else {
                        ContentComponent.fetch(page.route)
                            .then((result: any) => {
                                contents[contentInfo.region] = React.createElement((window as any)[this.appName].Component.Content[contentInfo.className], result, null);

                                currentNumberOfNetworkRequests++;
                                if (currentNumberOfNetworkRequests === expectedNumberOfNetworkRequest) {
                                    let LayoutComponentClass = (this as any).pageComponents.Layout[page.layout.className];
                                    if (LayoutComponentClass.name !== this.currentLayoutComponent.id) {
                                        let layoutComponent = new LayoutComponentClass(contents);
                                        this.currentLayoutComponent.remove();
                                        document.getElementById('LayoutRegion').appendChild(layoutComponent.toDOM());
                                        layoutComponent.whenShow();
                                        this.currentLayoutComponent = layoutComponent;
                                    }
                                    else {
                                        this.removeIrrelevantCurrentContents(page).then(() => {
                                            for (let c in contents) {
                                                let content = (contents as any)[c];
                                                let region = document.getElementById(c);
                                                if (!region) {
                                                    throw new Error('Region \'' + c + '\' is missing.');
                                                }
                                                this.currentLayoutComponent.setProp(c, content);
                                                region.appendChild(content.toDOM().frag);

                                                // We must reset the component created by the `toDOM()` method above.
                                                // Because children custom element should not have component reference
                                                // in their create element closure. If we don't reset the component
                                                // reference there will be a custom element property referencing itself.
                                                content.resetComponent();
                                            }

                                            this.currentLayoutComponent.hasBoundDOM = false;
                                            this.currentLayoutComponent.bindDOM();
                                            this.currentContents = this.currentLayoutComponent.customElements as CurrentContents;

                                            for (let c in this.currentContents) {
                                                this.currentContents[c].recursivelyCallMethod('show');
                                            }
                                        });
                                    }
                                }
                            })
                            .catch((err: Error) => {

                            });
                    }
                })(content, ContentComponent);
            }
        });
    }
}

export default Router;