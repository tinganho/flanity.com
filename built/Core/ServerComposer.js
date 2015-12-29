"use strict";
var WebBindingsEmitter_1 = require('./WebBindingsEmitter');
var http_1 = require('http');
var ts = require('typescript');
var Index_1 = require('../Library/Server/Index');
var Index_2 = require('../Library/Index');
function getClassName(c) {
    return c.name;
}
function toCamelCase(text) {
    return text[0].toLowerCase() + text.slice(1);
}
var serverComposer;
var ServerComposer = (function () {
    function ServerComposer(options, commandLineOptions) {
        this.pageEmitInfos = [];
        this.noServer = false;
        if (serverComposer) {
            Index_2.Debug.error('Only one instance of the Composer class is allowed');
        }
        if (!options.appName) {
            options.appName = cf.DEFAULT_APP_NAME;
        }
        if (!options.moduleKind) {
            options.moduleKind = 1;
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
    ServerComposer.prototype.set = function (setting, value) {
        this.options[setting] = value;
    };
    ServerComposer.prototype.setPages = function (routes) {
        var count = 0;
        for (var url in routes) {
            routes[url](new Page(url, this));
            count++;
        }
        this.pageCount = count;
        this.emitBindings();
        this.emitClientRouter();
    };
    ServerComposer.prototype.setDefaultDocument = function (document, documentProps) {
        if (!this.options.defaultDocumentFolder) {
            Index_2.Debug.error('You have not defined a default document folder.');
        }
        document;
        this.defaultDocument = {
            view: {
                class: document,
                importPath: Index_1.System.joinPaths(this.options.defaultDocumentFolder, getClassName(document)),
            },
        };
        this.defaultDocumentProps = documentProps;
    };
    ServerComposer.prototype.setDefaultPlatform = function (platform) {
        this.defaultPlatform = platform;
    };
    ServerComposer.prototype.start = function (callback) {
        this.server = http_1.createServer(this.options.app);
        var hasCalled = false;
        this.server.listen(process.env.PORT || cf.DEFAULT_SERVER_PORT, function () {
            setTimeout(function () {
                if (!hasCalled) {
                    callback();
                }
            }, 1500);
        });
        this.server.on('error', function (err) {
            if (!hasCalled) {
                callback(err);
                hasCalled = true;
            }
        });
    };
    ServerComposer.prototype.stop = function (callback) {
        var _this = this;
        this.server.close(function (err) {
            callback(err);
            _this.server = undefined;
            serverComposer = undefined;
        });
    };
    ServerComposer.prototype.emitBindings = function () {
        if (this.pageEmitInfos.length === this.pageCount) {
            var writer = Index_2.createTextWriter('\n');
            WebBindingsEmitter_1.emitBindings(this.options.routerOutput, this.getAllImportPaths(this.pageEmitInfos), this.pageEmitInfos, writer, { moduleKind: this.options.moduleKind });
            var text = writer.getText();
            Index_1.System.writeFile(Index_1.System.joinPaths(this.options.rootPath, this.options.bindingsOutput), text);
            if (this.commandLineOptions.showEmitBindings) {
                Index_2.Debug.debug(text);
            }
        }
    };
    ServerComposer.prototype.moduleKindToTsModuleKind = function (moduleKind) {
        switch (moduleKind) {
            case 1:
                return ts.ModuleKind.AMD;
            case 2:
                return ts.ModuleKind.CommonJS;
            default:
                return ts.ModuleKind.None;
        }
    };
    ServerComposer.prototype.emitClientRouter = function () {
        var routerSource = Index_1.System.readFile(Index_1.System.joinPaths(__dirname, '../Core/Router.js'));
        Index_1.System.writeFile(Index_1.System.joinPaths(this.options.rootPath, this.options.routerOutput), routerSource);
    };
    ServerComposer.prototype.getAllImportPaths = function (pageEmitInfos) {
        var componentEmitInfos = [];
        var classNames = [];
        for (var _i = 0, pageEmitInfos_1 = pageEmitInfos; _i < pageEmitInfos_1.length; _i++) {
            var pageEmitInfo = pageEmitInfos_1[_i];
            if (classNames.indexOf(pageEmitInfo.document.view.className) === -1) {
                componentEmitInfos.push(pageEmitInfo.document);
            }
            if (classNames.indexOf(pageEmitInfo.layout.view.className) === -1) {
                componentEmitInfos.push(pageEmitInfo.layout);
            }
            for (var _a = 0, _b = pageEmitInfo.contents; _a < _b.length; _a++) {
                var contentEmitInfo = _b[_a];
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
        return componentEmitInfos;
    };
    return ServerComposer;
}());
exports.ServerComposer = ServerComposer;
function getNormalizedNameFromViewClass(ctor) {
    return ctor.name.replace('View', '');
}
function getNormalizedNameFromViewClassName(ctorName) {
    return ctorName.replace('View', '');
}
var Page = (function () {
    function Page(route, serverComposer) {
        this.attachedUrlHandler = false;
        this.platforms = {};
        this.route = route;
        this.serverComposer = serverComposer;
        if (this.serverComposer.defaultPlatform) {
            this.setPlatform(this.serverComposer.defaultPlatform);
        }
        if (this.serverComposer.defaultDocument) {
            this.currentPlatform.document = this.serverComposer.defaultDocument;
            this.currentPlatform.documentProps = this.serverComposer.defaultDocumentProps;
        }
    }
    Page.prototype.onPlatform = function (platform) {
        this.setPlatform(platform);
        return this;
    };
    Page.prototype.setPlatform = function (platform) {
        this.platforms[platform.name] = {
            imports: [],
            importNames: [],
            detect: platform.detect
        };
        this.currentPlatform = this.platforms[platform.name];
    };
    Page.prototype.hasDocument = function (document, documentProps) {
        if (!this.currentPlatform) {
            Index_2.Debug.error("You must define a platform with 'onPlatform(...)' method before you call 'hasDocument(...)'.");
        }
        if (!this.serverComposer.options.defaultDocumentFolder) {
            Index_2.Debug.error('You have not defined a default document folder.');
        }
        this.currentPlatform.document = {
            view: {
                class: document,
                importPath: Index_1.System.joinPaths(this.serverComposer.options.defaultDocumentFolder, getClassName(document)),
            }
        };
        this.currentPlatform.documentProps = documentProps;
        return this;
    };
    Page.prototype.hasLayout = function (layout, providedContentDeclarations) {
        if (!this.serverComposer.options.defaultLayoutFolder) {
            Index_2.Debug.error('You have not defined a default layout folder.');
        }
        this.currentPlatform.layout = {
            view: {
                class: layout,
                importPath: Index_1.System.joinPaths(this.serverComposer.options.defaultLayoutFolder, getClassName(layout)),
            }
        };
        var newContents = {};
        for (var region in providedContentDeclarations) {
            var newContent = {};
            var content = providedContentDeclarations[region];
            if (!this.serverComposer.options.defaultContentFolder) {
                Index_2.Debug.error('You have not defined a default content folder.');
            }
            var modelClassName = getClassName(content.model);
            var viewClassName = getClassName(content.view);
            newContents[region] = {
                model: {
                    class: content.model,
                    importPath: Index_1.System.joinPaths(this.serverComposer.options.defaultContentFolder, modelClassName.replace('Model', '') + "/" + modelClassName),
                },
                view: {
                    class: content.view,
                    importPath: Index_1.System.joinPaths(this.serverComposer.options.defaultContentFolder, viewClassName.replace('View', '') + "/" + viewClassName),
                },
            };
        }
        this.currentPlatform.contents = newContents;
        return this;
    };
    Page.prototype.end = function () {
        this.registerPage();
        if (!this.attachedUrlHandler && !this.serverComposer.noServer) {
            this.serverComposer.options.app.get(this.route, this.handlePageRequest.bind(this));
            this.attachedUrlHandler = true;
        }
    };
    Page.prototype.registerPage = function () {
        var contentEmitInfos = [];
        var document = this.currentPlatform.document;
        var layout = this.currentPlatform.layout;
        var contents = this.currentPlatform.contents;
        for (var region in contents) {
            var content = contents[region];
            contentEmitInfos.push({
                model: {
                    className: getClassName(content.model.class),
                    importPath: content.model.importPath,
                },
                view: {
                    className: getClassName(content.view.class),
                    importPath: content.view.importPath,
                },
                name: getNormalizedNameFromViewClass(content.view.class),
                region: region,
            });
        }
        this.serverComposer.pageEmitInfos.push({
            route: this.route,
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
        });
    };
    Page.prototype.handlePageRequest = function (req, res, next) {
        var _this = this;
        this.getContents(req, res, function (contents, jsonScriptData) {
            _this.currentPlatform.documentProps.pageInfo = req.pageInfo;
            _this.currentPlatform.documentProps.jsonScriptData = jsonScriptData;
            _this.currentPlatform.documentProps.layout = new _this.currentPlatform.layout.view.class(contents);
            var document = new _this.currentPlatform.document.view.class(_this.currentPlatform.documentProps);
            res.send('<!DOCTYPE html>' + document.toString());
        });
    };
    Page.prototype.getContents = function (req, res, next) {
        var contents = this.currentPlatform.contents;
        var resultContents = {};
        var resultJsonScriptData = [];
        var numberOfContentFetchings = 0;
        var finishedContentFetchings = 0;
        req.pageInfo = {
            lang: req.language.slice(0, req.language.length - 3),
            language: req.language,
        };
        for (var region in contents) {
            numberOfContentFetchings++;
            (function (region, ContentModel, ContentView) {
                var model = new Index_2.Model();
                model.fetch().then(function () {
                    ContentView.setPageInfo(model, req.pageInfo);
                    model.props.l = req.localizations;
                    resultContents[region] = Index_2.React.createElement(ContentView, model.props, null);
                    resultJsonScriptData.push({
                        id: "composer-content-json-" + getClassName(contents[region].model.class).toLowerCase(),
                        data: model.toData(),
                    });
                    finishedContentFetchings++;
                    if (numberOfContentFetchings === finishedContentFetchings) {
                        next(resultContents, resultJsonScriptData);
                    }
                })
                    .catch(function (err) {
                    console.log(err.stack);
                    if (process.env.NODE_ENV === 'development') {
                        res.status(500).send(err.stack);
                    }
                    else {
                        res.status(500).send('');
                    }
                });
            })(region, contents[region].model.class, contents[region].view.class);
        }
    };
    return Page;
}());
exports.Page = Page;
//# sourceMappingURL=ServerComposer.js.map