"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../Library/Index');
var FormMessage = (function (_super) {
    __extends(FormMessage, _super);
    function FormMessage() {
        _super.apply(this, arguments);
    }
    FormMessage.prototype.render = function () {
        return (Index_1.React.createElement("div", {ref: 'container', class: 'FormMessageContainer Hidden'}, Index_1.React.createElement("span", {ref: 'message', class: 'FormMessage'})));
    };
    FormMessage.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
    };
    FormMessage.prototype.showErrorMessage = function (message) {
        this.elements.container
            .addClass('Revealed')
            .addClass('Error')
            .removeClass('Hidden')
            .removeClass('Success');
        this.elements.message.setHtml(message);
    };
    FormMessage.prototype.showSuccessMessage = function (message) {
        this.elements.container
            .addClass('Revealed')
            .addClass('Success')
            .removeClass('Hidden')
            .removeClass('Error');
        this.elements.message.setHtml(message);
    };
    FormMessage.prototype.hideMessage = function () {
        this.elements.container.addClass('Hidden').removeClass('Revealed');
    };
    return FormMessage;
}(Index_1.ContentComponent));
exports.FormMessage = FormMessage;
//# sourceMappingURL=FormMessage.js.map