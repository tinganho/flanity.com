"use strict";
window.localizations = requireLocalizations(document.documentElement.getAttribute('lang'));
var React = require('Core/Element');
var setDefaultHttpRequestOptions = require('/lib/http').setDefaultHttpRequestOptions;
var setDefaultXCsrfTokenHeader = require('/lib/http').setDefaultXCsrfTokenHeader;
var setDefaultCorsCredentials = require('/lib/http').setDefaultCorsCredentials;
var Router = (function () {
    function Router(appName, pages, pageComponents) {
        var _this = this;
        this.appName = appName;
        this.pageComponents = pageComponents;
        this.inInitialPageLoad = true;
        this.hasPushState = window.history && !!window.history.pushState;
        this.routingInfoIndex = {};
        this.routes = [];
        this.currentRegions = [];
        for (var _i = 0, pages_1 = pages; _i < pages_1.length; _i++) {
            var page = pages_1[_i];
            var routePattern = '^' + page.route
                .replace(/:(\w+)\//, function (match, param) { return ("(" + param + ")"); })
                .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$';
            var route = {
                matcher: new RegExp(routePattern),
                path: page.route,
            };
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
            window.onpopstate = function () {
                _this.checkRouteAndRenderIfMatch(document.location.pathname);
            };
            this.onPushState = this.checkRouteAndRenderIfMatch;
        }
    }
    Router.prototype.getQueryParam = function (name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regExp = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regExp.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };
    Router.prototype.navigateTo = function (route, state) {
        if (this.hasPushState) {
            window.history.pushState(state, null, route);
        }
        else {
            window.location.pathname = route;
        }
        this.onPushState(route);
    };
    Router.prototype.checkRouteAndRenderIfMatch = function (currentRoute) {
        var _this = this;
        this.routes.some(function (route) {
            if (route.matcher.test(currentRoute)) {
                _this.renderPage(_this.routingInfoIndex[route.path]);
                return true;
            }
            return false;
        });
    };
    Router.prototype.loadContentFromJsonScripts = function (placeholderContents, page) {
        for (var _i = 0, _a = page.contents; _i < _a.length; _i++) {
            var content = _a[_i];
            var jsonElement = document.getElementById("composer-content-json-" + content.model.className.toLowerCase());
            if (!jsonElement) {
                throw new Error("Could not find JSON file " + content.name + ". Are you sure\nthis component is properly named?");
            }
            try {
                this.currentRegions.push(content.region);
                var props = jsonElement.innerHTML !== '' ? JSON.parse(jsonElement.innerHTML).data : {};
                props.l = window.localizations;
                placeholderContents[content.region] = React.createElement(this.pageComponents.Contents[content.view.className], props, null);
            }
            catch (err) {
                console.log(jsonElement.innerHTML);
                throw new Error("Could not parse JSON for " + content.name + ".\n " + err.message);
            }
            if (jsonElement.remove) {
                jsonElement.remove();
            }
            else {
                jsonElement.parentElement.removeChild(jsonElement);
            }
        }
    };
    Router.prototype.bindLayoutAndContents = function (page, contents) {
        this.currentLayoutView = new this.pageComponents.Layout[page.layout.view.className](contents);
        this.currentLayoutView.bindDOM();
        this.currentContents = this.currentLayoutView.components;
    };
    Router.prototype.loopThroughIrrelevantCurrentContentsAndExecMethod = function (nextPage, method) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var currentNumberOfRemoves = 0;
            var expectedNumberOfRemoves = 0;
            var reuseRegions = [];
            if (!_this.currentContents || Object.keys(_this.currentContents).length === 0) {
                return reject(new Error('You have not set any content for the current page.'));
            }
            var _loop_1 = function(currentContent) {
                if (!_this.currentContents.hasOwnProperty(currentContent))
                    return { value: void 0 };
                var removeCurrentContent = true;
                for (var _i = 0, _a = nextPage.contents; _i < _a.length; _i++) {
                    var nextContent = _a[_i];
                    if (nextContent.view.className === _this.currentContents[currentContent].constructor.name) {
                        removeCurrentContent = false;
                        reuseRegions.push(nextContent.region);
                    }
                }
                if (!_this.currentContents[currentContent][method]) {
                    return { value: reject(new Error('You have not implemented a hide or remove method for \'' + currentContent.constructor.name + '\'')) };
                }
                (function (currentContent) {
                    if (removeCurrentContent) {
                        expectedNumberOfRemoves++;
                        _this.currentContents[currentContent].recursivelyCallMethod(method)
                            .then(function () {
                            currentNumberOfRemoves++;
                            if (method === 'remove') {
                                for (var _i = 0, _a = _this.currentRegions; _i < _a.length; _i++) {
                                    var r = _a[_i];
                                    if (reuseRegions.indexOf(r) === -1) {
                                        _this.currentLayoutView.unsetProp(r);
                                    }
                                }
                            }
                            if (currentNumberOfRemoves === expectedNumberOfRemoves) {
                                resolve(undefined);
                            }
                        });
                    }
                })(currentContent);
            };
            for (var currentContent in _this.currentContents) {
                var state_1 = _loop_1(currentContent);
                if (typeof state_1 === "object") return state_1.value
            }
        });
    };
    Router.prototype.removeIrrelevantCurrentContents = function (nextPage) {
        return this.loopThroughIrrelevantCurrentContentsAndExecMethod(nextPage, 'remove');
    };
    Router.prototype.hideIrrelevantCurrentContents = function (nextPage) {
        return this.loopThroughIrrelevantCurrentContentsAndExecMethod(nextPage, 'hide');
    };
    Router.prototype.renderPage = function (page) {
        var contents = {};
        if (this.inInitialPageLoad) {
            this.loadContentFromJsonScripts(contents, page);
            this.bindLayoutAndContents(page, contents);
            this.inInitialPageLoad = false;
        }
        else {
            this.handleClientPageRequest(page);
        }
    };
    Router.prototype.handleClientPageRequest = function (page) {
        var _this = this;
        var newContents = {};
        var currentNumberOfFetches = 0;
        var expectedNumberOfFetches = 0;
        this.hideIrrelevantCurrentContents(page).then(function () {
            for (var _i = 0, _a = page.contents; _i < _a.length; _i++) {
                var content = _a[_i];
                if (_this.currentContents.hasOwnProperty(toCamelCase(content.view.className))) {
                    continue;
                }
                var ContentView = _this.pageComponents.Contents[content.view.className];
                var ContentModel = _this.pageComponents.Contents[content.model.className];
                expectedNumberOfFetches++;
                (function (contentInfo, ContentModel, ContentView) {
                    var model = new ContentModel;
                    model.fetch().then(function () {
                        model.props.l = window.localizations;
                        model.props.model = model;
                        newContents[contentInfo.region] = React.createElement(_this.pageComponents.Contents[contentInfo.view.className], model.props, null);
                        currentNumberOfFetches++;
                        if (currentNumberOfFetches === expectedNumberOfFetches) {
                            var LayoutComponentClass = _this.pageComponents.Layout[page.layout.view.className];
                            if (LayoutComponentClass.name !== _this.currentLayoutView.id) {
                                var layoutComponent = new LayoutComponentClass(newContents);
                                _this.currentLayoutView.remove();
                                document.getElementById('LayoutRegion').appendChild(layoutComponent.toDOM());
                                layoutComponent.show();
                                _this.currentLayoutView = layoutComponent;
                            }
                            else {
                                _this.removeIrrelevantCurrentContents(page).then(function () {
                                    for (var c in newContents) {
                                        var content_1 = newContents[c];
                                        var region = document.getElementById(c);
                                        if (!region) {
                                            throw new Error('Region \'' + c + '\' is missing.');
                                        }
                                        _this.currentLayoutView.setProp(c, content_1);
                                        region.appendChild(content_1.toDOM().frag);
                                        content_1.resetComponent();
                                    }
                                    _this.currentLayoutView.hasBoundDOM = false;
                                    _this.currentLayoutView.bindDOM();
                                    _this.currentContents = _this.currentLayoutView.components;
                                    for (var c in _this.currentContents) {
                                        _this.currentContents[c].recursivelyCallMethod('show');
                                    }
                                });
                            }
                        }
                    })
                        .catch(function (err) {
                        console.log(err.stack);
                    });
                })(content, ContentView, ContentModel);
            }
        });
    };
    return Router;
}());
exports.Router = Router;
function toCamelCase(text) {
    return text[0].toLowerCase() + text.substring(1);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Router;
//# sourceMappingURL=Router.js.map