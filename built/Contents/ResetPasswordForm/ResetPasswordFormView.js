"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Components/Index');
var Index_2 = require('../../Library/Index');
var ResetPasswordFormView = (function (_super) {
    __extends(ResetPasswordFormView, _super);
    function ResetPasswordFormView() {
        _super.apply(this, arguments);
    }
    ResetPasswordFormView.prototype.render = function () {
        return (Index_2.React.createElement("div", null, Index_2.React.createElement("form", {id: 'ResetPasswordFormForm', class: 'CentralForm BgWhite'}, Index_2.React.createElement("p", {id: 'ResetPasswordFormDescription', class: 'PromptText'}, this.l10ns.resetPasswordDescription), Index_2.React.createElement("input", {name: 'newPassword', ref: 'newPasswordInput', type: 'password', class: 'TextInput ResetPasswordFormTextInput', placeholder: this.l10ns.newPasswordPlaceholderText}), Index_2.React.createElement("input", {name: 'repeatPassword', ref: 'repeatPasswordInput', type: 'password', class: 'TextInput ResetPasswordFormTextInput', placeholder: this.l10ns.repeatPasswordPlaceholderText}), Index_2.React.createElement(Index_1.FormMessage, null), Index_2.React.createElement(Index_1.SubmitButton, {id: 'ResetPasswordFormSubmitButton', ref: 'submitButton', buttonText: this.l10ns.sendButtonText}))));
    };
    ResetPasswordFormView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.bindInteractions();
    };
    ResetPasswordFormView.prototype.bindInteractions = function () {
        this.onSubmit = this.onSubmit.bind(this);
        this.onNewPasswordInputChange = this.onNewPasswordInputChange.bind(this);
        this.onRepeatPasswordInputChange = this.onRepeatPasswordInputChange.bind(this);
        this.onNewPasswordInputChange();
        this.elements.newPasswordInput.addEventListener('change', this.onNewPasswordInputChange);
        this.onRepeatPasswordInputChange();
        this.elements.repeatPasswordInput.addEventListener('change', this.onRepeatPasswordInputChange);
        this.components.submitButton.addOnSubmitListener(this.onSubmit);
    };
    ResetPasswordFormView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            resetPasswordDescription: l('RESET_PASSWORD_FORM->RESET_PASSWORD_DESCRIPTION'),
            sendButtonText: l('DEFAULT->SEND_BUTTON_TEXT'),
            newPasswordPlaceholderText: l('RESET_PASSWORD_FORM->NEW_PASSWORD_PLACEHOLDER_TEXT'),
            repeatPasswordPlaceholderText: l('RESET_PASSWORD_FORM->REPEAT_PASSWORD_PLACEHOLDER_TEXT'),
            noPasswordErrorMessage: l('DEFAULT->NO_PASSWORD_ERROR_MESSAGE'),
            passwordTooShortErrorMessage: l('DEFAULT->PASSWORD_TOO_SHORT_ERROR_MESSAGE'),
            passwordTooLongErrorMessage: l('DEFAULT->PASSWORD_TOO_LONG_ERROR_MESSAGE'),
            wrongRepeatPasswordErrorMessage: l('RESET_PASSWORD_FORM->WRONG_REPEAT_PASSWORD_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
            invalidResetPasswordErrorMessage: l('RESET_PASSWORD_FORM->INVALID_RESET_PASSWORD_REQUEST_ERROR_MESSAGE'),
            successfulMessage: l('RESET_PASSWORD_FORM->SUCCESSFUL_MESSAGE'),
        };
    };
    ResetPasswordFormView.prototype.showErrorMessage = function (message) {
        this.components.formMessage.showErrorMessage(message);
    };
    ResetPasswordFormView.prototype.hideErrorMessage = function () {
        this.components.formMessage.hideMessage();
    };
    ResetPasswordFormView.prototype.showSuccessMessage = function (message) {
        this.components.formMessage.showSuccessMessage(message);
    };
    ResetPasswordFormView.prototype.onNewPasswordInputChange = function () {
        this.newPassword = this.elements.newPasswordInput.getValue();
    };
    ResetPasswordFormView.prototype.onRepeatPasswordInputChange = function () {
        this.repeatPassword = this.elements.repeatPasswordInput.getValue();
    };
    ResetPasswordFormView.prototype.validateNewPassword = function () {
        if (this.newPassword.length === 0) {
            this.showErrorMessage(this.l10ns.noPasswordErrorMessage);
            return false;
        }
        if (this.newPassword.length < 6) {
            this.showErrorMessage(this.l10ns.passwordTooShortErrorMessage);
            return false;
        }
        if (this.newPassword.length > 100) {
            this.showErrorMessage(this.l10ns.passwordTooLongErrorMessage);
            return false;
        }
        return true;
    };
    ResetPasswordFormView.prototype.validateRepeatPassword = function () {
        if (this.newPassword !== this.repeatPassword) {
            this.showErrorMessage(this.l10ns.wrongRepeatPasswordErrorMessage);
            return false;
        }
        return true;
    };
    ResetPasswordFormView.prototype.onSubmit = function (event) {
        var _this = this;
        var isValid = this.validateNewPassword() && this.validateRepeatPassword();
        if (!isValid) {
            return;
        }
        if (this.isRequesting) {
            return;
        }
        this.isRequesting = true;
        this.components.submitButton.startLoading();
        var callback = new Index_2.DeferredCallback(2000, function () {
            _this.components.submitButton.stopLoading();
        });
        Index_2.HTTP.put('/users/me/password', {
            body: {
                token: App.router.getQueryParam('token'),
                password: this.newPassword,
            }
        })
            .then(function () {
            callback.call(function () {
                _this.showSuccessMessage(_this.l10ns.successfulMessage);
            });
        })
            .catch(function (err) {
            _this.isRequesting = false;
            if (err instanceof Error) {
                callback.call(function () {
                    _this.showErrorMessage(_this.l10ns.unknownErrorErrorMessage);
                });
                throw err;
            }
            else {
                callback.call(function () {
                    if (err.body.feedback.current.code === 1) {
                        _this.showErrorMessage(_this.l10ns.invalidResetPasswordErrorMessage);
                    }
                    else {
                        _this.showErrorMessage(_this.l10ns.unknownErrorErrorMessage);
                    }
                });
            }
        });
    };
    return ResetPasswordFormView;
}(Index_2.ContentComponent));
exports.ResetPasswordFormView = ResetPasswordFormView;
//# sourceMappingURL=ResetPasswordFormView.js.map