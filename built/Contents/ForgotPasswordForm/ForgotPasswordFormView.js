"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Components/Index');
var Index_2 = require('../../Library/Index');
var ForgotPasswordFormView = (function (_super) {
    __extends(ForgotPasswordFormView, _super);
    function ForgotPasswordFormView() {
        _super.apply(this, arguments);
    }
    ForgotPasswordFormView.prototype.render = function () {
        return (Index_2.React.createElement("div", null, Index_2.React.createElement("form", {id: 'ForgotPasswordFormForm', class: 'CentralForm BgWhite'}, Index_2.React.createElement("p", {id: 'ForgotPasswordFormDescription', class: 'PromptText'}, this.props.l10ns.forgotPasswordDescription), Index_2.React.createElement("input", {name: 'email', ref: 'emailInput', type: 'text', class: 'TextInput ForgotPasswordFormTextInput', placeholder: this.props.l10ns.emailPlaceholderText}), Index_2.React.createElement(Index_1.FormMessage, null), Index_2.React.createElement(Index_1.SubmitButton, {id: 'ForgotPasswordFormSubmitButton', ref: 'submitButton', buttonText: this.props.l10ns.sendButtonText}))));
    };
    ForgotPasswordFormView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.bindInteractions();
    };
    ForgotPasswordFormView.prototype.bindInteractions = function () {
        this.onSubmit = this.onSubmit.bind(this);
        this.onEmailInputChange = this.onEmailInputChange.bind(this);
        this.onEmailInputChange();
        this.elements.emailInput.addEventListener('change', this.onEmailInputChange);
        this.components.submitButton.addOnSubmitListener(this.onSubmit);
    };
    ForgotPasswordFormView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            forgotPasswordDescription: l('FORGOT_PASSWORD_FORM->FORGOT_PASSWORD_DESCRIPTION'),
            emailPlaceholderText: l('DEFAULT->EMAIL_PLACEHOLDER_TEXT'),
            sendButtonText: l('DEFAULT->SEND_BUTTON_TEXT'),
            noEmailErrorMessage: l('DEFAULT->NO_EMAIL_ERROR_MESSAGE'),
            invalidEmailErrorMessage: l('DEFAULT->INVALID_EMAIL_ERROR_MESSAGE'),
            userNotFoundErrorMessage: l('FORGOT_PASSWORD_FORM->USER_NOT_FOUND_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
            successfulMessage: l('FORGOT_PASSWORD_FORM->SUCCESSFUL_MESSAGE'),
        };
    };
    ForgotPasswordFormView.prototype.showErrorMessage = function (message) {
        this.components.formMessage.showErrorMessage(message);
    };
    ForgotPasswordFormView.prototype.hideErrorMessage = function () {
        this.components.formMessage.hideMessage();
    };
    ForgotPasswordFormView.prototype.showSuccessMessage = function (message) {
        this.components.formMessage.showSuccessMessage(message);
    };
    ForgotPasswordFormView.prototype.onEmailInputChange = function () {
        this.email = this.elements.emailInput.getValue();
    };
    ForgotPasswordFormView.prototype.validateEmail = function () {
        if (this.email.length === 0) {
            this.showErrorMessage(this.props.l10ns.noEmailErrorMessage);
            return false;
        }
        cf.EMAIL_SYNTAX.index = 0;
        if (!cf.EMAIL_SYNTAX.test(this.email)) {
            this.showErrorMessage(this.props.l10ns.invalidEmailErrorMessage);
            return false;
        }
        return true;
    };
    ForgotPasswordFormView.prototype.onSubmit = function (event) {
        var _this = this;
        var isValid = this.validateEmail();
        if (!isValid) {
            return;
        }
        this.isRequesting = true;
        this.components.submitButton.startLoading();
        var callback = new Index_2.DeferredCallback(2000, function () {
            _this.components.submitButton.stopLoading();
        });
        var body = { email: this.email };
        Index_2.HTTP.post('/forgot-password-tokens', {
            body: {
                email: this.email,
            }
        })
            .then(function () {
            callback.call(function () {
                _this.showSuccessMessage(_this.props.l10ns.successfulMessage);
            });
        })
            .catch(function (err) {
            if (err instanceof Error) {
                callback.call(function () {
                    _this.showErrorMessage(_this.props.l10ns.unknownErrorErrorMessage);
                });
                throw err;
            }
            else {
                callback.call(function () {
                    if (err.body.feedback.current.code === 1) {
                        _this.showErrorMessage(_this.props.l10ns.userNotFoundErrorMessage);
                    }
                    else {
                        _this.showErrorMessage(_this.props.l10ns.unknownErrorErrorMessage);
                    }
                });
            }
        });
    };
    return ForgotPasswordFormView;
}(Index_2.ContentComponent));
exports.ForgotPasswordFormView = ForgotPasswordFormView;
//# sourceMappingURL=ForgotPasswordFormView.js.map