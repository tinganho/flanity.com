"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
var __r = require;
var System = inServer ? __r('../Library/Server/System').System : undefined;
var Document = (function (_super) {
    __extends(Document, _super);
    function Document(props, children) {
        _super.call(this, props, children);
        if (inServer) {
            this.weixinShare = System.readFile(System.joinPaths(__dirname, '../Public/Scripts/Vendor/weixin-share.js'));
            if (process.env.NODE_ENV === 'production') {
                this.googleAnalytics = System.readFile(System.joinPaths(__dirname, '../Public/Scripts/Vendor/google-analytics.js'));
            }
        }
    }
    Document.prototype.render = function () {
        var _this = this;
        return (Index_1.React.createElement("html", {lang: this.props.pageInfo.language}, Index_1.React.createElement("head", null, Index_1.React.createElement("title", null, this.props.pageInfo.title), Index_1.React.createElement("meta", {property: 'og:title', content: this.props.pageInfo.title}), Index_1.React.createElement("meta", {property: 'og:locale', content: this.props.pageInfo.language}), Index_1.React.createElement("meta", {"http-equiv": 'content-language', content: this.props.pageInfo.language}), Index_1.React.createElement("meta", {charset: 'utf-8'}), Index_1.React.createElement("meta", {"http-equiv": 'X-UA-Compatible', content: 'IE=edge,chrome=1'}), Index_1.React.createElement("meta", {property: 'og:type', content: 'website'}), Index_1.React.createElement("meta", {name: 'twitter:card', content: 'summary_large_image'}), (function () {
            if (_this.props.pageInfo.description) {
                return [
                    Index_1.React.createElement("meta", {name: 'description', content: _this.props.pageInfo.description}),
                    Index_1.React.createElement("meta", {property: 'og:description', content: _this.props.pageInfo.description})
                ];
            }
        })(), (function () {
            if (_this.props.pageInfo.image) {
                return Index_1.React.createElement("meta", {property: 'og:image', content: _this.props.pageInfo.image});
            }
        })(), (function () {
            if (_this.props.pageInfo.URL) {
                return [
                    Index_1.React.createElement("link", {rel: 'canonical', href: _this.props.pageInfo.URL}),
                    Index_1.React.createElement("meta", {property: 'og:url', content: _this.props.pageInfo.URL})
                ];
            }
        })(), Index_1.React.createElement("link", {rel: 'mask-icon', href: '/Public/Images/Nalie.svg', color: 'red'}), Index_1.React.createElement("link", {rel: 'icon', sizes: 'any', mask: true, href: '/Public/Images/Nalie.svg'}), Index_1.React.createElement("link", {rel: 'icon', type: 'image/x-icon', href: '/Public/Images/Nalie.ico'}), Index_1.React.createElement("link", {rel: 'shortcut icon', sizes: '196x196', href: '/Public/Images/Nalie.svg'}), Index_1.React.createElement("link", {rel: 'shortcut icon', type: 'image/x-icon', href: '/Public/Images/Nalie.ico'}), Index_1.React.createElement("link", {rel: 'stylesheet', href: '/Public/Styles/Index.css'}), Index_1.React.createElement("meta", {name: 'viewport', content: 'user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height'}), Index_1.React.createElement("meta", {property: 'og:site_name', content: 'Nalie'}), Index_1.React.createElement("script", {type: 'text/javascript', html: this.weixinShare}), Index_1.React.createElement("script", {type: 'text/javascript', html: 'window.inServer = false; window.inClient = true;'}), Index_1.React.createElement("script", {type: 'text/javascript', html: 'document.addEventListener("touchstart", function(){}, true);'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Vendor/modernizr.js'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Vendor/promise.js'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Vendor/promise.prototype.finally.js'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Vendor/system.js'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Localizations/all.js'}), Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Configurations.js'}), Index_1.React.createElement("script", {html: this.googleAnalytics}), this.props.jsonScriptData.map(function (attr) {
            return (Index_1.React.createElement("script", {type: 'application/json', id: attr.id}, JSON.stringify(attr)));
        })), Index_1.React.createElement("body", {id: "LayoutRegion"}, this.props.layout, (function () {
            if (_this.manifestExists) {
                return Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/App.js'});
            }
            else {
                return Index_1.React.createElement("script", {type: 'text/javascript', src: '/Public/Scripts/Startup.js'});
            }
        })())));
    };
    return Document;
}(Index_1.DocumentComponent));
exports.Document = Document;
//# sourceMappingURL=Document.js.map