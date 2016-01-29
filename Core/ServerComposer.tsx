
import { Express, Request, Response } from 'express';
import { PageEmitInfo, PlatformEmitIndex, emitBindings, ModuleKind, PlatformDetects } from './WebBindingsEmitter';
import { createServer, Server } from 'http';
import * as ts from 'typescript';
import { ComponentInfo, ContentComponentInfo } from './Router';
import { System } from '../Library/Server/Index';
import {
    Debug,
    React,
    Model,
    Collection,
    createTextWriter,
    PageInfo,
    LayoutComponent,
    DocumentComponent,
    ContentComponent,
    RequestInfo,
    HTTPResponse,
    ErrorResponse,
    isArray } from '../Library/Index';

export interface JsonScriptAttributes {
    id: string;
    data: any;
}

interface ImportPathDeclaration {
    importPath: string;
}

type ContentViewClass = (new<P, S, E>(props?:P, children?: Child[]) => ContentComponent<P, S, E>);
type LayoutViewClass = (new<P, S, E>(props?:P, children?: Child[]) => LayoutComponent<P, S, E>);
type DocumentViewClass = (new<P, S, E>(props?:P, children?: Child[]) => DocumentComponent<P, S, E>);
type ContentDataClass = (new<T>() => Model<T> | Collection<Model<T>>);

interface ContentViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: ContentViewClass;
}

interface LayoutViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: LayoutViewClass;
}

interface DocumentViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: DocumentViewClass;
}

interface ContentDataClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: ContentDataClass
}

export interface ContentDeclaration {
    data?: ContentDataClassAndImportPathDeclaration;
    view: ContentViewClassAndImportPathDeclaration;
}

export interface DocumentDeclaration {
    view: DocumentViewClassAndImportPathDeclaration;
}

export interface LayoutDeclaration {
    view: LayoutViewClassAndImportPathDeclaration;
}

interface Content {
    data?: ContentDataClass;
    relations?: string[];
    view: ContentViewClass;
    isStatic?: boolean;
}

interface ProvidedContentDeclarations {
    [index: string]: Content | Content[];
}

interface ContentViewModelClassAndImport {
    view: ContentViewClassAndImportPathDeclaration;
    data?: ContentDataClassAndImportPathDeclaration;
    isStatic?: boolean;
    relations?: string[];
}

interface StoredContentDeclarations {
    [index: string]: ContentViewModelClassAndImport | ContentViewModelClassAndImport[];
}

export interface Pages {
    [page: string]: (page: Page) => void;
}

export interface PlatformDetect {
    name: string;

    /**
     * Specify a function to detect this platform.
     */
    serverDetect(req: Request): boolean;
    clientDetect(): boolean;
}

export interface Contents {
    [region: string]: JSX.Element | JSX.Element[];
}

function getClassName(c: any): string {
    return (c as any).name;
}

function toCamelCase(text: string): string {
    return text[0].toLowerCase() + text.slice(1);
}

interface ComposerOptions {

    /**
     * App name.
     */
    appName?: string;

    /**
     * Module kind.
     */
    moduleKind?: ModuleKind;

    /**
     * Define the output file for client router.
     */
    routerOutput: string,

    /**
     * Define the output file for your bingings.
     */
    bindingsOutput: string,

    /**
     * If you have set the flag `inProduction` to true. You would need to provide
     * a development to production client configuration path mapping for your
     * configuration files.
     */
    devToProdClientConfPath?: { [index: string]: string };

    /**
     * Set this flag to true if you are in production mode. Each page will use
     * production document properties instead of developement document properties.
     */
    inProduction?: boolean;

    /**
     * Add a namespace to your resource URL:s.
     */
    resourceNamespace?: string;

    /**
     * Specify the root path. All you URI:s defined in all your pages will reference
     * this root path.
     */
    rootPath: string;

    /**
     * Set express application.
     */
    app: Express;

    /**
     * Set default document folder. The composer will automatically look for
     * `{folder}/{component}.tsx` and you don't need to provide `importPath`:
     *
     * `.hasDocument({ component: Document, importPath: 'component/path' }, defaultConfigs)`
     *
     * You can simply do:
     *
     * `.hasDocument(Document, defaultConfigs)`
     *
     */
    defaultDocumentFolder?: string;

    /**
     * Set default layout folder. The composer will automatically look for
     * `{folder}/{component}.tsx` and you don't need to provide `importPath`:
     *
     * `.hasLayout({ component: Body_withTopBar_withFooter, importPath: 'component/path' }, contents)`
     *
     * You can simply do:
     *
     * `.hasLayout(Body_withTopBar_withFooter, contents)`
     *
     */
    defaultLayoutFolder?: string;

    /**
     * Set default content folder. The composer will automatically look for
     * `{folder}/{component}.tsx` and you don't need to provide `importPath`:
     *
     * `.hasLayout(Body_withTopBar_withFooter, {
     *     topBar: { component: NavigationBar, importPath: 'component/path' },
     *     body: { component: Feed, importPath: 'component/path' },
     * })`
     *
     * You can simply do:
     *
     * `.hasLayout(Body_withTopBar_withFooter, {
     *     topBar: NavigationBar,
     *     body: Feed,
     * })`
     *
     */
    defaultContentFolder?: string;

    [index: string]: any;
}

let serverComposer: ServerComposer;
export class ServerComposer {
    public commandLineOptions: any;
    public options: ComposerOptions;
    public pageCount: number;
    public server: Server;
    public defaultDocument: DocumentDeclaration;
    public defaultDocumentProps: DocumentProps;
    public platformDetects: PlatformDetects = {};

    /**
     * Storage for all page emit infos.
     */
    public pageEmitInfos: PageEmitInfo[] = [];

    /**
     * Page emit info output file.
     */
    public pageEmitInfoOutput: string;

    /**
     * A flag for not open the server.
     */
    public noServer: boolean = false;

    /**
     * Output file for client composer.
     */
    public clientComposerOutput: string;

    constructor(options: ComposerOptions, commandLineOptions?: any) {
        if (serverComposer) {
            Debug.error('Only one instance of the Composer class is allowed');
        }
        if (!options.appName) {
            options.appName = cf.DEFAULT_APP_NAME;
        }
        if (!options.moduleKind) {
            options.moduleKind = ModuleKind.Amd;
        }
        if (commandLineOptions) {
            this.commandLineOptions = commandLineOptions;
        }
        else {
            this.commandLineOptions = {};
        }
        this.options = options;
        this.options.routerOutput = this.options.routerOutput;
        this.options.bindingsOutput = this.options.bindingsOutput;
    }

    public set<T>(setting: string, value: T): void {
        this.options[setting] = value;
    }

    public setPages(routes: Pages): void {
        let count = 0;
        for (let url in routes) {
            routes[url](new Page(url, this));

            count++;
        }
        this.pageCount = count;
        this.emitBindings();
        this.emitClientRouter();
    }

    public setDefaultDocument<T extends DocumentProps>(document: (new() => DocumentComponent<any, any, any>), documentProps: T): void {
        if (!this.options.defaultDocumentFolder) {
            Debug.error('You have not defined a default document folder.');
        }
        this.defaultDocument = {
            view: {
                class: document as any,
                importPath: System.joinPaths(this.options.defaultDocumentFolder, getClassName(document)),
            },
        }

        this.defaultDocumentProps = documentProps;
    }

    public start(callback?: (err?: Error) => void): void {
        this.server = createServer(this.options.app);
        let hasCalled = false;
            this.server.listen(process.env.PORT || cf.DEFAULT_SERVER_PORT, () => {
                setTimeout(() => {
                    if (!hasCalled) {
                        callback();
                    }
                }, 1500);
            });
            this.server.on('error', (err: Error) => {
                if (!hasCalled) {
                    callback(err);
                    hasCalled = true;
                }
            });
    }

    public stop(callback?: (err?: Error) => void): void {
        this.server.close((err?: Error) => {
            callback && callback(err);
            this.server = undefined;
            serverComposer = undefined;
        });
    }

    public emitBindings(): void {
        if (this.pageEmitInfos.length === this.pageCount) {
            let writer = createTextWriter('\n');
            emitBindings(
                this.options.routerOutput,
                this.getAllImportPaths(this.pageEmitInfos),
                this.pageEmitInfos,
                this.platformDetects,
                writer,
                { moduleKind: this.options.moduleKind }
            );
            let text = writer.getText();
            System.writeFile(System.joinPaths(this.options.rootPath, this.options.bindingsOutput), text);
            if (this.commandLineOptions.showEmitBindings) {
                Debug.debug(text);
            }
        }
    }

    private moduleKindToTsModuleKind(moduleKind: ModuleKind): ts.ModuleKind {
        switch (moduleKind) {
            case ModuleKind.Amd:
                return ts.ModuleKind.AMD;
            case ModuleKind.CommonJs:
                return ts.ModuleKind.CommonJS;
            default:
                return ts.ModuleKind.None;
        }
    }

    public emitClientRouter(): void {
        let routerSource = System.readFile(System.joinPaths(__dirname, '../Core/Router.js'));
        System.writeFile(System.joinPaths(this.options.rootPath, this.options.routerOutput), routerSource)
    }

    private getAllImportPaths(pageEmitInfos: PageEmitInfo[]): ComponentInfo[] {
        let componentEmitInfos: ComponentInfo[] = [];
        let classNames: string[] = []
        for (let pageEmitInfo of pageEmitInfos) {
            for (let i in pageEmitInfo.platforms) {
                if (classNames.indexOf(pageEmitInfo.platforms[i].document.view.className) === -1) {
                    componentEmitInfos.push(pageEmitInfo.platforms[i].document);
                }

                if (classNames.indexOf(pageEmitInfo.platforms[i].layout.view.className) === -1) {
                    componentEmitInfos.push(pageEmitInfo.platforms[i].layout);
                }

                for (let contentEmitInfo of pageEmitInfo.platforms[i].contents) {
                    if (contentEmitInfo.stack) {
                        for (let stackedContentEmitInfo of contentEmitInfo.stack) {
                            let componentEmitInfo: ComponentInfo = {
                                view: {
                                    className: stackedContentEmitInfo.view.className,
                                    importPath: stackedContentEmitInfo.view.importPath,
                                },
                            }
                            if (stackedContentEmitInfo.data) {
                                componentEmitInfo.data = {
                                    className: stackedContentEmitInfo.data.className,
                                    importPath: stackedContentEmitInfo.data.importPath,
                                }
                            }
                            componentEmitInfos.push(stackedContentEmitInfo);
                        }
                    }
                    else {
                        let className = getNormalizedNameFromViewClassName(contentEmitInfo.view.className);
                        if (classNames.indexOf(className) === -1) {
                            let componentEmitInfo: ComponentInfo = {
                                view: {
                                    className: contentEmitInfo.view.className,
                                    importPath: contentEmitInfo.view.importPath,
                                },
                            }
                            if (contentEmitInfo.data) {
                                componentEmitInfo.data = {
                                    className: contentEmitInfo.data.className,
                                    importPath: contentEmitInfo.data.importPath,
                                }
                            }
                            componentEmitInfos.push(contentEmitInfo);
                        }
                    }
                }
            }
        }

        return componentEmitInfos;
    }
}

function getNormalizedNameFromViewClass(ctor: any): string {
    return ctor.name.replace('View', '');
}

function getNormalizedNameFromViewClassName(ctorName: string): string {
    return ctorName.replace('View', '');
}

export interface DocumentProps {
    confs?: string[];
    title?: string;
    styles?: string[];
    jsonScriptData?: JsonScriptAttributes[];
    layout?: any;
    pageInfo?: PageInfo;
}

const enum AutenticationError {
    AuthorizationHeaderNotProvided,
    AccessTokenExpired,
    InvalidAccessToken,
    NoXCsrfToken,
}

interface Platform {
    name: string;
    imports: string[];
    importNames: string[];
    document?: DocumentDeclaration;
    documentProps?: DocumentProps;
    layout?: LayoutDeclaration;
    contents?: StoredContentDeclarations;
    serverDetect(req: Request): boolean;
    clientDetect(): boolean;
}

/**
 * The Page class builds up the whole HTML for your website.
 * You can specify document, layout, module and components to
 * customize the html you waant
 */
export class Page {

    /**
     * Route of this page.
     */
    public route: string;

    public serverComposer: ServerComposer;

    /**
     * A flag for checking if this page have attached a URL handler.
     */
    private attachedUrlHandler: boolean = false;
    private platforms: { [index: string]: Platform } = {};
    private currentPlatform: Platform;
    private currentPlatformName: string;

    constructor(route: string, serverComposer: ServerComposer) {
        this.route = route;
        this.serverComposer = serverComposer;

        if (this.serverComposer.defaultDocument) {
            this.currentPlatform.document = this.serverComposer.defaultDocument;
            this.currentPlatform.documentProps = this.serverComposer.defaultDocumentProps;
        }
    }

    /**
     * Specify a platform with a PlatformDetect.
     */
    public onPlatform(platform: PlatformDetect): Page {
        this.setPlatform(platform);

        return this;
    }

    private setPlatform(platform: PlatformDetect): void {
        this.platforms[platform.name] = {
            name: platform.name,
            imports: [],
            importNames: [],
            serverDetect: platform.serverDetect,
            clientDetect: platform.clientDetect,
        }
        if (!this.serverComposer.platformDetects[platform.name]) {
            this.serverComposer.platformDetects[platform.name] = platform.clientDetect;
        }
        this.currentPlatform = this.platforms[platform.name];
    }

    /**
     * Define which document this page should have along with document properties.
     */
    public hasDocument<P extends DocumentProps>(document: (new() => DocumentComponent<any, any, any>), documentProps: P): Page {
        if (!this.currentPlatform) {
            Debug.error(`You must define a platform with 'onPlatform(...)' method before you call 'hasDocument(...)'.`);
        }
        if (!this.serverComposer.options.defaultDocumentFolder) {
            Debug.error('You have not defined a default document folder.');
        }

        this.currentPlatform.document = {
            view: {
                class: document as any,
                importPath: System.joinPaths(this.serverComposer.options.defaultDocumentFolder, getClassName(document)),
            }
        }

        this.currentPlatform.documentProps = documentProps;

        return this;
    }

    /**
     * Define which layout this page should have.
     */
    public hasLayout<C extends ProvidedContentDeclarations>(layout: (new() => LayoutComponent<any, any, any>), providedContentDeclarations: C): Page {
        let self = this;

        if (!this.serverComposer.options.defaultLayoutFolder) {
            Debug.error('You have not defined a default layout folder.');
        }
        this.currentPlatform.layout = {
            view: {
                class: layout,
                importPath: System.joinPaths(this.serverComposer.options.defaultLayoutFolder, getClassName(layout)),
            }
        }

        let newContents: StoredContentDeclarations = {};
        for (let region in providedContentDeclarations) {
            let newContent = {};
            let providedContentDeclaration = providedContentDeclarations[region];

            if (Array.isArray(providedContentDeclaration)) {
                if (providedContentDeclaration.length > 2) {
                    throw new TypeError('A stacked region cannot be longer than 2 in your page manifestation.');
                }
                newContents[region] = [] as ContentViewModelClassAndImport[];
                for (let c of providedContentDeclaration) {
                    let contentEmitInfo = {} as ContentViewModelClassAndImport;
                    setContent(c, contentEmitInfo);
                    (newContents[region] as ContentViewModelClassAndImport[]).push(contentEmitInfo);
                }
            }
            else {
                if (!this.serverComposer.options.defaultContentFolder) {
                    Debug.error('You have not defined a default content folder.');
                }
                newContents[region] = {} as ContentViewModelClassAndImport;
                setContent(providedContentDeclaration as Content, newContents[region] as ContentViewModelClassAndImport);
            }
        }
        this.currentPlatform.contents = newContents;

        return this;

        function setContent(providedContentDeclaration: Content, contentEmitInfo: ContentViewModelClassAndImport) {
            if (providedContentDeclaration.data) {
                contentEmitInfo.data = {
                    class: providedContentDeclaration.data,
                    importPath: System.joinPaths(self.serverComposer.options.defaultContentFolder, `/${getClassName(providedContentDeclaration.data)}`),
                }
            }
            if (providedContentDeclaration.relations) {

                // Check if relations are in content declarationn
                for (let r of providedContentDeclaration.relations) {
                    if (!(r in (providedContentDeclaration.data as any)._relations)) {
                        throw new TypeError(`No relation '${r}' in '${providedContentDeclaration.data.name}'`);
                    }
                }
                contentEmitInfo.relations = providedContentDeclaration.relations;
            }
            contentEmitInfo.view = {
                class: providedContentDeclaration.view,
                importPath: System.joinPaths(self.serverComposer.options.defaultContentFolder, `/${getClassName(providedContentDeclaration.view)}`),
            }
            contentEmitInfo.isStatic = providedContentDeclaration.isStatic;
        }
    }

    /**
     * Call this method to mark the end of your page declaration.
     */
    public end(): void {
        this.registerPage();

        if (!this.attachedUrlHandler && !this.serverComposer.noServer) {
            this.serverComposer.options.app.get(this.route, this.handlePageRequest.bind(this));
            this.attachedUrlHandler = true;
        }
    }

    private registerPage(): void {
        let platformEmitInfo: PlatformEmitIndex = {};
        for (let i in this.platforms) {
            let currentPlatform = this.platforms[i];

            let contentEmitInfos: ContentComponentInfo[] = [];
            let document = currentPlatform.document;
            let layout = currentPlatform.layout;
            let contents = currentPlatform.contents;

            for (let region in contents) {
                let content = contents[region]

                if (Array.isArray(content)) {
                    let contentEmitInfo = {
                        region: region,
                    } as ContentComponentInfo;

                    let stackedContentEmitInfos: ContentComponentInfo[] = [];
                    for (let stackedContent of content) {
                        stackedContentEmitInfos.push(getContentEmitInfo(stackedContent, true));
                    }
                    contentEmitInfo.stack = stackedContentEmitInfos;
                    contentEmitInfos.push(contentEmitInfo);
                }
                else {
                    contentEmitInfos.push(getContentEmitInfo(content, false, region));
                }
            }

            platformEmitInfo[currentPlatform.name] = {
                document: {
                    view: {
                        className: getClassName(document.view.class),
                        importPath: document.view.importPath,
                    },
                },
                layout: {
                    view: {
                        className: getClassName(layout.view.class),
                        importPath: layout.view.importPath,
                    },
                },
                contents: contentEmitInfos,
            }
        }

        this.serverComposer.pageEmitInfos.push({
            route: this.route,
            platforms: platformEmitInfo,
        });

        function getContentEmitInfo(content: ContentViewModelClassAndImport, isStack: boolean, region?: string): ContentComponentInfo {
            let contentEmitInfo: ContentComponentInfo = {
                view: {
                    className: getClassName(content.view.class),
                    importPath: content.view.importPath,
                },
            } as ContentComponentInfo;

            if (!isStack) {
                contentEmitInfo.isStatic = content.isStatic;
                contentEmitInfo.region = region;
            }

            if (content.data) {
                contentEmitInfo.data = {
                    className: getClassName(content.data.class),
                    importPath: content.data.importPath,
                }
            }
            if (content.relations) {
                contentEmitInfo.relations = content.relations;
            }
            return contentEmitInfo;
        }
    }

    private handlePageRequest(req: Request, res: Response, next: () => void): void {
        this.getContents(req, res, (err, requestedPlatform, contents, jsonScriptData) => {
            if (err) {
                return;
            }
            req.pageInfo.title = req.pageInfo.title || 'NO_PAGE_TITLE';
            requestedPlatform.documentProps.pageInfo = req.pageInfo;
            requestedPlatform.documentProps.jsonScriptData = jsonScriptData;
            requestedPlatform.documentProps.layout = React.createElement(requestedPlatform.layout.view.class, contents);
            let document = new requestedPlatform.document.view.class(requestedPlatform.documentProps);
            res.send('<!DOCTYPE html>' + document.toString());
        });
    }

    private getContents(req: Request, res: Response, next: (err: any, currentPlatform?: Platform, contents?: Contents, jsonScriptData?: JsonScriptAttributes[]) => void): void {
        let requestedPlatform: Platform;
        for (let i in this.platforms) {
            if (this.platforms[i].serverDetect(req)) {
                requestedPlatform = this.platforms[i];
                break;
            }
        }
        let contents = requestedPlatform.contents;
        let resultContents: Contents = {};
        let resultJSONScriptData: JsonScriptAttributes[] = [];
        let numberOfContentFetchings = 0;
        let finishedContentFetchings = 0;
        let requestInfo: RequestInfo<any, any> = {
            params: req.params,
            query: req.query,
            cookies: req.cookies,
        }
        req.pageInfo = {
            lang: req.language.split('-')[0],
            language: req.language,
        }

        for (let region in contents) {
            let content = contents[region];
            if (Array.isArray(content)) {
                for (let stackedContent of content) {
                    fetch(
                        region,
                        stackedContent.data && stackedContent.data.class,
                        stackedContent.relations,
                        stackedContent.view.class as any,
                        true
                    );
                }
            }
            else {
                fetch(
                    region,
                    (contents[region] as ContentViewModelClassAndImport).data && (contents[region] as ContentViewModelClassAndImport).data.class,
                    (contents[region] as ContentViewModelClassAndImport).relations,
                    (contents[region] as ContentViewModelClassAndImport).view.class as any,
                    false
                );
            }
        }

        function fetch(region: string, ContentData: new() => Model<any> | Collection<Model<any>>, relations: string[], ContentView: typeof ContentComponent, isStack: boolean) {
            numberOfContentFetchings++;

            if (ContentData) {
                let contentData = new ContentData();
                contentData.fetch(requestInfo, relations).then(() => {
                        ContentView.setPageInfo(req.localizations, req.pageInfo, contentData);

                        let props = {
                            l: req.localizations,
                            data: contentData,
                        }
                        let content = React.createElement(ContentView as any, props, null);
                        if (isStack) {
                            if (!resultContents[region]) {
                                resultContents[region] = [];
                            }
                            (resultContents[region] as JSX.Element[]).push(content);
                        }
                        else {
                            resultContents[region] = content;
                        }
                        resultJSONScriptData.push({
                            id: `bd-${region.toLowerCase()}-${ContentData.name.toLowerCase()}`,
                            data: contentData.toData(),
                        });

                        finishedContentFetchings++;

                        if (numberOfContentFetchings === finishedContentFetchings) {
                            next(null, requestedPlatform, resultContents, resultJSONScriptData);
                        }
                    })
                    .catch((error: Error | HTTPResponse<ErrorResponse>) => {
                        if (error instanceof Error) {
                            console.log(error.stack || error);
                            if (process.env.NODE_ENV === 'development') {
                                res.status(500).send(error.stack ? error.stack.replace('\n', '<br>') : error);
                            }
                            else {
                                res.status(500).send('');
                            }
                        }
                        else {
                            let errorCode = error.body.feedback.current.code;
                            if (errorCode === AutenticationError.InvalidAccessToken
                            || errorCode === AutenticationError.AccessTokenExpired) {

                                res.clearCookie('accessToken');
                                res.clearCookie('renewalToken');
                                res.clearCookie('hasAccessToken');
                                res.redirect('/');
                            }
                            else {
                                console.log(requestInfo);
                                console.log(error.body);
                                if (process.env.NODE_ENV === 'development') {
                                    res.status(500).json(error.body);
                                }
                                else {
                                    res.status(500).send('');
                                }
                            }
                        }

                        next(error);
                    });
            }
            else {

                // We need to put a timeout here because the 'numberOfContentFetchings' will equal
                // 'finishedContentFetchings' mulitple times. we want 'numberOfContentFetchings' to
                // increment all increments first and then let 'finishedContentFetchings' increment.
                setTimeout(() => {
                    ContentView.setPageInfo(req.localizations, req.pageInfo);
                    let content = React.createElement(ContentView as any, { l: req.localizations, data: undefined }, null);
                    if (isStack) {
                        if (!resultContents[region]) {
                            resultContents[region] = [];
                        }
                        (resultContents[region] as JSX.Element[]).push(content);
                    }
                    else {
                        resultContents[region] = content;
                    }

                    finishedContentFetchings++;

                    if (numberOfContentFetchings === finishedContentFetchings) {
                        next(null, requestedPlatform, resultContents, resultJSONScriptData);
                    }
                }, 0);
            }
        }
    }
}
