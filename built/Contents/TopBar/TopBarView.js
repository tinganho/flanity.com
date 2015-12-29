"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Library/Index');
var TopBarView = (function (_super) {
    __extends(TopBarView, _super);
    function TopBarView() {
        _super.apply(this, arguments);
    }
    TopBarView.prototype.render = function () {
        return (Index_1.React.createElement("div", null, Index_1.React.createElement("a", {ref: 'logoAnchor', href: '/'}, Index_1.React.createElement("div", {id: 'TopBarLogoContainer'}, Index_1.React.createElement("i", {id: 'TopBarLogo'}))), Index_1.React.createElement("div", {id: 'TopBarLoginButtonContainer'}, Index_1.React.createElement("a", {ref: 'loginButton', id: 'TopBarLoginButton'}, this.l10ns.login))));
    };
    TopBarView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.bindInteractions();
    };
    TopBarView.prototype.bindInteractions = function () {
        this.elements.loginButton.addEventListener('click', this.navigateToLoginPage);
        this.elements.logoAnchor.addEventListener('click', this.navigateToHomePage);
    };
    TopBarView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            login: l('DEFAULT->LOGIN'),
        };
    };
    TopBarView.prototype.navigateToHomePage = function (event) {
        event.preventDefault();
        App.router.navigateTo('/');
    };
    TopBarView.prototype.navigateToLoginPage = function (event) {
        event.preventDefault();
        App.router.navigateTo('/login');
    };
    return TopBarView;
}(Index_1.ContentComponent));
exports.TopBarView = TopBarView;
//# sourceMappingURL=TopBarView.js.map