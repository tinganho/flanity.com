"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Components/Index');
var Index_2 = require('../../Library/Index');
var LogInFormView = (function (_super) {
    __extends(LogInFormView, _super);
    function LogInFormView() {
        _super.apply(this, arguments);
        this.usernameOrEmail = '';
        this.password = '';
        this.isRequesting = false;
    }
    LogInFormView.prototype.render = function () {
        return (Index_2.React.createElement("div", null, Index_2.React.createElement("form", {id: 'LogInFormForm', class: 'BgWhite'}, Index_2.React.createElement("input", {name: 'usernameOrEmail', ref: 'usernameOrEmail', type: 'text', class: 'TextInput LogInFormTextInput', placeholder: this.l10ns.usernameOrEmailPlaceholder}), Index_2.React.createElement("input", {name: 'password', ref: 'password', type: 'password', class: 'TextInput LogInFormTextInput', placeholder: this.l10ns.passwordPlaceholder}), Index_2.React.createElement(Index_1.FormMessage, null), Index_2.React.createElement("a", {id: 'LogInFormForgotPasswordLink', ref: 'passwordLink', class: 'TextLink'}, this.l10ns.forgotPassword), Index_2.React.createElement(Index_1.SubmitButton, {id: 'LogInSubmitButton', ref: 'submitButton', buttonText: this.l10ns.submitButtonText}))));
    };
    LogInFormView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.submit = this.submit.bind(this);
        this.elements.submitButton = this.components.submitButton.elements.container;
        this.bindInteractions();
    };
    LogInFormView.prototype.bindInteractions = function () {
        var _this = this;
        this.elements.submitButton.addEventListener('click', this.submit);
        this.usernameOrEmail = this.elements.usernameOrEmail.getValue();
        this.elements.usernameOrEmail.addEventListener('change', function () {
            _this.usernameOrEmail = _this.elements.usernameOrEmail.getValue();
        });
        this.password = this.elements.password.getValue();
        this.elements.password.addEventListener('change', function () {
            _this.password = _this.elements.password.getValue();
        });
        this.elements.passwordLink.addEventListener('click', this.navigateToForgotPasswordPage);
    };
    LogInFormView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            usernameOrEmailPlaceholder: l('LOG_IN_FORM->USERNAME_OR_EMAIL_PLACEHOLDER'),
            passwordPlaceholder: l('LOG_IN_FORM->PASSWORD_PLACEHOLDER'),
            submitButtonText: l('LOG_IN_FORM->SUBMIT_BUTTON'),
            noUsernameOrEmailErrorMessage: l('LOG_IN_FORM->NO_USERNAME_OR_EMAIL_ERROR_MESSAGE'),
            noPasswordErrorMessage: l('LOG_IN_FORM->NO_PASSWORD_ERROR_MESSAGE'),
            userNotFoundErrorMessage: l('LOG_IN_FORM->USER_NOT_FOUND_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
            forgotPassword: l('LOG_IN_FORM->FORGOT_PASSWORD_LINK_TEXT'),
        };
    };
    LogInFormView.prototype.showErrorMessage = function (message) {
        this.components.formMessage.showErrorMessage(message);
    };
    LogInFormView.prototype.navigateToForgotPasswordPage = function () {
        App.router.navigateTo('/forgot-password');
    };
    LogInFormView.prototype.validateUsernameOrEmail = function () {
        if (this.usernameOrEmail.length === 0) {
            this.showErrorMessage(this.l10ns.noUsernameOrEmailErrorMessage);
            return false;
        }
        return true;
    };
    LogInFormView.prototype.validatePassword = function () {
        if (this.password.length === 0) {
            this.showErrorMessage(this.l10ns.noPasswordErrorMessage);
            return false;
        }
        return true;
    };
    LogInFormView.prototype.submit = function (event) {
        var _this = this;
        event.preventDefault();
        if (this.isRequesting) {
            return;
        }
        var isValid = this.validateUsernameOrEmail() && this.validatePassword();
        if (!isValid) {
            return;
        }
        this.isRequesting = true;
        this.components.submitButton.startLoading();
        var callback = new Index_2.DeferredCallback(2000, function () {
            _this.components.submitButton.stopLoading();
        });
        this.components.formMessage.hideMessage();
        Index_2.HTTP.post('/login', {
            host: window.location.hostname,
            port: parseInt(window.location.port),
            body: {
                email: this.usernameOrEmail,
                username: this.usernameOrEmail,
                password: this.password,
            },
        })
            .then(function (response) {
            callback.call(function () {
                var session = response.body.model;
                Index_2.HTTP.post('/session/cookies', {
                    body: {
                        accessToken: session.accessToken,
                        renewalToken: session.renewalToken,
                        expiry: session.expiry,
                    }
                })
                    .then(function () {
                })
                    .catch(function (err) {
                    _this.showErrorMessage(_this.l10ns.unknownErrorErrorMessage);
                });
            });
        })
            .catch(function (err) {
            _this.isRequesting = false;
            if (err instanceof Error) {
                throw err;
            }
            else {
                var body = err.body;
                callback.call(function () {
                    switch (body.feedback.current.code) {
                        case 3:
                            _this.showErrorMessage(_this.l10ns.userNotFoundErrorMessage);
                            break;
                    }
                });
            }
        });
    };
    return LogInFormView;
}(Index_2.ContentComponent));
exports.LogInFormView = LogInFormView;
//# sourceMappingURL=LogInFormView.js.map