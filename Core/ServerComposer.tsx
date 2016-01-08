
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
    createTextWriter,
    PageInfo,
    LayoutComponent,
    DocumentComponent,
    ContentComponent,
    RequestInfo } from '../Library/Index';

export interface JsonScriptAttributes {
    id: string;
    data: any;
}

interface ImportPathDeclaration {
    importPath: string;

}

type ContentViewClass = (new<P extends Props, S, E extends Elements>(props?:P, children?: Child[]) => ContentComponent<P, S, E>);
type LayoutViewClass = (new<P extends Props, S, E extends Elements>(props?:P, children?: Child[]) => LayoutComponent<P, S, E>);
type DocumentViewClass = (new<P extends Props, S, E extends Elements>(props?:P, children?: Child[]) => DocumentComponent<P, S, E>);
type ContentModelClass = (new<T>() => Model<T>);

interface ContentViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: ContentViewClass;
}

interface LayoutViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: LayoutViewClass;
}

interface DocumentViewClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: DocumentViewClass;
}

interface ContentModelClassAndImportPathDeclaration extends ImportPathDeclaration {
    class: ContentModelClass
}

export interface ContentDeclaration {
    model: ContentModelClassAndImportPathDeclaration;
    view: ContentViewClassAndImportPathDeclaration;
}

export interface DocumentDeclaration {
    view: DocumentViewClassAndImportPathDeclaration;
}

export interface LayoutDeclaration {
    view: LayoutViewClassAndImportPathDeclaration;
}

interface Content {
    model: ContentModelClass;
    view: ContentViewClass;
}

interface ProvidedContentDeclarations {
    [index: string]: Content;
}

interface ContentViewModelClassAndImport {
    view: ContentViewClassAndImportPathDeclaration;
    model?: ContentModelClassAndImportPathDeclaration;
}

interface StoredContentDeclarations {
    [index: string]: ContentViewModelClassAndImport;
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
    [region: string]: JSX.Element;
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
        this.options.bindingsOutput =this.options.bindingsOutput;
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
        document
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
                    if (classNames.indexOf(contentEmitInfo.model.className) === -1) {
                        componentEmitInfos.push({
                            model: {
                                className: contentEmitInfo.model.className,
                                importPath: contentEmitInfo.model.importPath,
                            },
                            view: {
                                className: contentEmitInfo.view.className,
                                importPath: contentEmitInfo.view.importPath,
                            },
                            name: getNormalizedNameFromViewClassName(contentEmitInfo.view.className),
                        });
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

export interface DocumentProps extends Props {
    confs?: string[];
    title?: string;
    styles?: string[];
    jsonScriptData?: JsonScriptAttributes[];
    layout?: any;
    pageInfo?: PageInfo;
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
            let content = providedContentDeclarations[region];
            if (!this.serverComposer.options.defaultContentFolder) {
                Debug.error('You have not defined a default content folder.');
            }
            newContents[region] = {} as ContentViewModelClassAndImport;
            if (content.model) {
                newContents[region].model = {
                    class: content.model,
                    importPath: System.joinPaths(this.serverComposer.options.defaultContentFolder, `/${getClassName(content.model)}`),
                }
            }
            newContents[region].view = {
                class: content.view,
                importPath: System.joinPaths(this.serverComposer.options.defaultContentFolder, `/${getClassName(content.view)}`),
            }
        }
        this.currentPlatform.contents = newContents;

        return this;
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
                let content = contents[region];

                let contentEmitInfo: ContentComponentInfo = {
                    view: {
                        className: getClassName(content.view.class),
                        importPath: content.view.importPath,
                    },
                    name: getNormalizedNameFromViewClass(content.view.class),
                    region: region,
                }
                if (content.model) {
                    contentEmitInfo.model = {
                        className: getClassName(content.model.class),
                        importPath: content.model.importPath,
                    }
                }
                contentEmitInfos.push(contentEmitInfo);
            }

            platformEmitInfo[currentPlatform.name] = {
                document: {
                    view: {
                        className: getClassName(document.view.class),
                        importPath: document.view.importPath,
                    },
                    name: getNormalizedNameFromViewClass(document.view.class),
                },
                layout: {
                    view: {
                        className: getClassName(layout.view.class),
                        importPath: layout.view.importPath,
                    },
                    name: getNormalizedNameFromViewClass(layout.view.class),
                },
                contents: contentEmitInfos,
            }
        }

        this.serverComposer.pageEmitInfos.push({
            route: this.route,
            platforms: platformEmitInfo,
        });
    }

    private handlePageRequest(req: Request, res: Response, next: () => void): void {
        this.getContents(req, res, (contents, jsonScriptData) => {
            console.log(this.currentPlatform.name)
            this.currentPlatform.documentProps.pageInfo = req.pageInfo;
            this.currentPlatform.documentProps.jsonScriptData = jsonScriptData;
            this.currentPlatform.documentProps.layout = new this.currentPlatform.layout.view.class(contents);
            let document = new this.currentPlatform.document.view.class(this.currentPlatform.documentProps);
            res.send('<!DOCTYPE html>' + document.toString());
        });
    }

    private getContents(req: Request, res: Response, next: (contents: Contents, jsonScriptData: JsonScriptAttributes[]) => void): void {
        for (let i in this.platforms) {
            if (this.platforms[i].serverDetect(req)) {
                this.currentPlatform = this.platforms[i];
                break;
            }
        }
        let contents = this.currentPlatform.contents;
        let resultContents: Contents = {};
        let resultJSONScriptData: JsonScriptAttributes[] = [];
        let numberOfContentFetchings = 0;
        let finishedContentFetchings = 0;
        let requestInfo: RequestInfo<any, any> = {
            params: req.params,
            query: req.query,
        }

        req.pageInfo = {
            lang: req.language.slice(0, req.language.length - 3),
            language: req.language,
        }

        for (let region in contents) {
            numberOfContentFetchings++;
            (function(region: string, ContentModel: typeof Model, ContentView: typeof ContentComponent) {

                if (ContentModel) {
                    let contentModel = new ContentModel();
                    contentModel.fetch(requestInfo).then(() => {
                            (contentModel.props as any).l = req.localizations;
                            ContentView.setPageInfo(contentModel.props, (contentModel.props as any).l, req.pageInfo);

                            resultContents[region] = React.createElement(ContentView as any, contentModel.props, null);
                            resultJSONScriptData.push({
                                id: `composer-content-json-${getClassName(contents[region].model.class).toLowerCase()}`,
                                data: contentModel.toData(),
                            });

                            finishedContentFetchings++;

                            if (numberOfContentFetchings === finishedContentFetchings) {
                                next(resultContents, resultJSONScriptData);
                            }
                        })
                        .catch((err: Error) => {
                            console.log(err.stack);
                            if (process.env.NODE_ENV === 'development') {
                                res.status(500).send(err.stack);
                            }
                            else {
                                res.status(500).send('');
                            }
                        });
                }
                else {
                    ContentView.setPageInfo({}, req.localizations, req.pageInfo);
                    resultContents[region] = React.createElement(ContentView as any, { l: req.localizations }, null);

                    finishedContentFetchings++;

                    if (numberOfContentFetchings === finishedContentFetchings) {
                        next(resultContents, resultJSONScriptData);
                    }
                }

            })(region, contents[region].model && contents[region].model.class, contents[region].view.class as any);
        }
    }
}
