"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Component_1 = require('../Core/Component');
var __r = require;
var System = inServer ? __r('./System').System : undefined;
var ComposerComponent = (function (_super) {
    __extends(ComposerComponent, _super);
    function ComposerComponent() {
        _super.apply(this, arguments);
    }
    return ComposerComponent;
}(Component_1.Component));
exports.ComposerComponent = ComposerComponent;
var DocumentComponent = (function (_super) {
    __extends(DocumentComponent, _super);
    function DocumentComponent(props, children) {
        _super.call(this, props, children);
        this.manifestExists = System.exists(System.joinPaths(__dirname, '../Public/rev-manifest.json'));
    }
    return DocumentComponent;
}(ComposerComponent));
exports.DocumentComponent = DocumentComponent;
var LayoutComponent = (function (_super) {
    __extends(LayoutComponent, _super);
    function LayoutComponent() {
        _super.apply(this, arguments);
    }
    return LayoutComponent;
}(ComposerComponent));
exports.LayoutComponent = LayoutComponent;
var ContentComponent = (function (_super) {
    __extends(ContentComponent, _super);
    function ContentComponent() {
        _super.apply(this, arguments);
    }
    ContentComponent.setPageInfo = function (props, pageInfo) { };
    ContentComponent.setPageTitle = function (title, pageInfo) {
        pageInfo.title = title;
    };
    ContentComponent.setPageDescription = function (description, pageInfo) {
        pageInfo.description = description;
    };
    ContentComponent.setPageImage = function (path, pageInfo) {
        pageInfo.image = cf.ORIGIN + path;
    };
    ContentComponent.setPageKeyword = function (keywords, pageInfo) {
        pageInfo.keywords = keywords;
    };
    ContentComponent.setPageURL = function (path, pageInfo) {
        pageInfo.URL = cf.ORIGIN + path;
    };
    ContentComponent.prototype.scrollWindowTo = function (to, duration) {
        var start = window.scrollY;
        var change = to - start;
        var increment = 15;
        var originalTime = Date.now();
        var elapsedTime;
        function animateScroll() {
            elapsedTime = Date.now() - originalTime;
            window.scrollTo(0, easeInOut(elapsedTime, start, change, duration));
            if (elapsedTime < duration) {
                requestAnimationFrame(animateScroll);
            }
        }
        function easeInOut(currentTime, start, change, duration) {
            currentTime /= duration / 2;
            if (currentTime < 1) {
                return change / 2 * currentTime * currentTime + start;
            }
            currentTime -= 1;
            return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
        }
        requestAnimationFrame(animateScroll);
    };
    return ContentComponent;
}(ComposerComponent));
exports.ContentComponent = ContentComponent;
//# sourceMappingURL=LayerComponents.js.map