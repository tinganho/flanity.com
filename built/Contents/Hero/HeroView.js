"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Library/Index');
var HeroView = (function (_super) {
    __extends(HeroView, _super);
    function HeroView() {
        _super.apply(this, arguments);
    }
    HeroView.prototype.render = function () {
        return (Index_1.React.createElement("div", null, Index_1.React.createElement("div", {id: 'HeroLogoContainer'}, Index_1.React.createElement("img", {id: 'HeroLogo', src: '/Public/Images/WhiteLogo.png'}), Index_1.React.createElement("p", {id: 'HeroDescription', class: 'HeaderWhite1'}, this.l10ns.heroDescription), Index_1.React.createElement("a", {ref: 'signupButton', id: 'HeroSignupButton', class: 'PurpleButton1Wide'}, this.l10ns.signUpButtonText)), Index_1.React.createElement("div", {id: "HeroImageContainer"}, Index_1.React.createElement("img", {id: 'HeroImage', src: '/Public/Images/HeroImage.jpg'}))));
    };
    HeroView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            heroDescription: l('HERO->DESCRIPTION'),
            signUpButtonText: l('HERO->SIGN_UP_BUTTON_TEXT'),
        };
    };
    HeroView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.bindInteractions();
    };
    HeroView.prototype.bindInteractions = function () {
        this.elements.signupButton.addEventListener('click', this.navigateToSignUpPage);
    };
    HeroView.prototype.navigateToSignUpPage = function () {
        App.router.navigateTo('/signup');
    };
    return HeroView;
}(Index_1.ContentComponent));
exports.HeroView = HeroView;
//# sourceMappingURL=HeroView.js.map