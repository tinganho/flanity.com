"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
var Link = (function (_super) {
    __extends(Link, _super);
    function Link() {
        _super.apply(this, arguments);
    }
    Link.prototype.navigateTo = function (event) {
        event.preventDefault();
        __Router.navigateTo(this.props.to);
    };
    Link.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.root.onClick(this.navigateTo.bind(this));
    };
    Link.prototype.render = function () {
        return (Index_1.React.createElement("a", {class: this.props.class}, this.children));
    };
    return Link;
}(Index_1.ContentComponent));
exports.Link = Link;
//# sourceMappingURL=Link.js.map