"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Index_1 = require('../../Components/Index');
var Index_2 = require('../../Library/Index');
var SignUpFormView = (function (_super) {
    __extends(SignUpFormView, _super);
    function SignUpFormView() {
        _super.apply(this, arguments);
        this.name = '';
        this.username = '';
        this.email = '';
        this.password = '';
        this.invitations = [];
        this.lastUsernameCheckTime = 0;
        this.usernameIsUnique = false;
        this.isRequesting = false;
    }
    SignUpFormView.prototype.render = function () {
        return (Index_2.React.createElement("div", null, Index_2.React.createElement("form", {id: 'SignUpFormForm', class: 'BgWhite'}, Index_2.React.createElement("div", {id: 'SignUpFormFirstRow'}, Index_2.React.createElement("div", {id: 'SignUpProfileImage', ref: 'profileImage'}, Index_2.React.createElement("input", {id: 'SignUpProfileImageInput', ref: 'profileImageInput', name: 'profileImage', type: 'file', accept: 'image/*'})), Index_2.React.createElement("div", {id: 'SignUpNameAndPasswordContainer'}, Index_2.React.createElement("input", {name: 'name', ref: 'name', type: 'text', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.namePlaceholder}), Index_2.React.createElement("input", {name: 'username', ref: 'username', type: 'text', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.usernamePlaceholder}), Index_2.React.createElement("span", {id: 'SignUpUsernameFeedback', ref: 'usernameFeedback', class: 'Hidden'}, " "))), Index_2.React.createElement("input", {name: 'email', ref: 'email', type: 'email', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.emailPlaceholder}), Index_2.React.createElement("input", {name: 'password', ref: 'password', type: 'password', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.passwordPlaceholder}), Index_2.React.createElement("p", {class: 'PromptText'}, this.l10ns.inviteFriendPromptText), Index_2.React.createElement("input", {name: 'friend1Email', ref: 'friend1Email', type: 'email', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.inviteFriendPlaceholder}), Index_2.React.createElement("input", {name: 'friend2Email', ref: 'friend2Email', type: 'email', class: 'TextInput SignUpFormTextInput', placeholder: this.l10ns.inviteFriendPlaceholder}), Index_2.React.createElement(Index_1.SubmitButton, {id: 'SignUpSubmitButton', ref: 'submitButton', buttonText: this.l10ns.submitButtonText}), Index_2.React.createElement(Index_1.FormMessage, {id: 'SignUpFormMessage'}))));
    };
    SignUpFormView.prototype.bindDOM = function () {
        _super.prototype.bindDOM.call(this);
        this.submit = this.submit.bind(this);
        this.inlineCheckUsername = this.inlineCheckUsername.bind(this);
        this.elements.submitButton = this.components.submitButton.elements.container;
        this.bindInteractions();
        this.profileImageHeight = this.elements.profileImage.getHeight();
        this.profileImageWidth = this.elements.profileImage.getWidth();
    };
    SignUpFormView.prototype.bindInteractions = function () {
        var _this = this;
        this.bindProfileImage();
        this.elements.name.addEventListener('change', function () {
            _this.name = _this.elements.name.getValue();
        });
        this.elements.submitButton.removeAttribute('disabled');
        this.elements.submitButton.onClick(this.submit);
        this.elements.username.addEventListener('keyup', this.inlineCheckUsername);
        this.elements.email.addEventListener('change', function () {
            _this.email = _this.elements.email.getValue();
        });
        this.elements.password.addEventListener('change', function () {
            _this.password = _this.elements.password.getValue();
        });
        this.elements.friend1Email.addEventListener('change', function () {
            _this.invitations[0] = _this.elements.friend1Email.getValue();
        });
        this.elements.friend2Email.addEventListener('change', function () {
            _this.invitations[1] = _this.elements.friend2Email.getValue();
        });
    };
    SignUpFormView.prototype.setLocalizations = function (l) {
        this.l10ns = {
            namePlaceholder: l('SIGN_UP->NAME_PLACEHOLDER'),
            usernamePlaceholder: l('SIGN_UP->USERNAME_PLACEHOLDER'),
            passwordPlaceholder: l('SIGN_UP->PASSWORD_PLACEHOLDER'),
            emailPlaceholder: l('SIGN_UP->EMAIL_PLACEHOLDER'),
            inviteFriendPlaceholder: l('SIGN_UP->INVITE_FRIEND_PLACEHOLDER'),
            inviteFriendPromptText: l('SIGN_UP->INVITE_FRIEND_PROMPT_TEXT'),
            submitButtonText: l('SIGN_UP->SUBMIT_BUTTON_TEXT'),
            noNameErrorMessage: l('SIGN_UP->NO_NAME_ERROR_MESSAGE'),
            noUsernameErrorMessage: l('SIGN_UP->NO_USERNAME_ERROR_MESSAGE'),
            noEmailErrorMessage: l('DEFAULT->NO_EMAIL_ERROR_MESSAGE'),
            noPasswordErrorMessage: l('DEFAULT->NO_PASSWORD_ERROR_MESSAGE'),
            invalidUsernameErrorMessage: l('SIGN_UP->INVALID_USERNAME_ERROR_MESSAGE'),
            invalidEmailErrorMessage: l('DEFAULT->INVALID_EMAIL_ERROR_MESSAGE'),
            passwordTooShortErrorMessage: l('DEFAULT->PASSWORD_TOO_SHORT_ERROR_MESSAGE'),
            passwordTooLongErrorMessage: l('DEFAULT->PASSWORD_TOO_LONG_ERROR_MESSAGE'),
            usernameAlreadyTakenErrorMessage: l('SIGN_UP->USERNAME_ALREADY_TAKEN_ERROR_MESSAGE'),
            emailAlreadyTakenErrorMessage: l('SIGN_UP->EMAIL_ALREADY_TAKEN_ERROR_MESSAGE'),
            invalidInvitationTokenErrorMessage: l('SIGN_UP->INVALID_INVITATION_TOKEN_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),
            usernameUniqueSuccessMessage: l('SIGN_UP->USERNAME_UNIQUE_SUCCESS_MESSAGE'),
            signUpSuccessfulMessage: l('SIGN_UP->SUCCESSFUL_SIGN_UP_MESSAGE'),
        };
    };
    SignUpFormView.prototype.bindProfileImage = function () {
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        var fileInput = this.elements.profileImageInput;
        fileInput.addEventListener('change', this.handleFileChange);
        fileInput.addEventListener('dragenter', this.handleDragOver);
        fileInput.addEventListener('dragleave', this.handleDragLeave);
        fileInput.addEventListener('drop', this.handleFileChange);
    };
    SignUpFormView.prototype.handleDragOver = function (event) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        this.elements.profileImage.addClass('DragOver');
    };
    SignUpFormView.prototype.handleDragLeave = function (event) {
        this.elements.profileImage.removeClass('DragOver');
    };
    SignUpFormView.prototype.handleFileChange = function (event) {
        var _this = this;
        var files = event.target.files;
        for (var i = 0, f = void 0; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                continue;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var image = new Image();
                image.src = e.target.result;
                image.onload = function () {
                    var imageCrop = new Index_1.ImageCrop();
                    imageCrop.setDimensions({
                        cropWidth: 300,
                        cropHeight: 300,
                        paddingVertical: 50,
                        paddingHorizontal: 40,
                    })
                        .setImage(image)
                        .whenDone(function (imageBlob, imageUrl) {
                        var input = _this.elements.profileImageInput;
                        var container = _this.elements.profileImage;
                        var clone = input.clone();
                        _this.elements.profileImageInput = clone;
                        clone.addEventListener('change', _this.handleFileChange);
                        clone.appendTo(_this.elements.profileImage);
                        input.remove();
                        var image = new Image();
                        image.src = imageUrl;
                        image.width = _this.profileImageWidth;
                        image.height = _this.profileImageHeight;
                        _this.elements.previewImage = new Index_2.DOMElement(image);
                        _this.elements.previewImage.id = 'SignUpProfileImagePreview';
                        _this.elements.previewImage.appendTo(_this.elements.profileImage);
                        container.addClass('HasPicture');
                        _this.profileImage = imageBlob;
                    })
                        .end();
                };
            };
            reader.readAsDataURL(f);
        }
    };
    SignUpFormView.prototype.showErrorMessage = function (message) {
        this.components.formMessage.showErrorMessage(message);
    };
    SignUpFormView.prototype.hideErrorMessage = function () {
        this.components.formMessage.hideMessage();
    };
    SignUpFormView.prototype.showSuccessMessage = function (message) {
        this.components.formMessage.showSuccessMessage(message);
    };
    SignUpFormView.prototype.inlineCheckUsername = function () {
        var _this = this;
        this.username = this.elements.username.getValue();
        if (Date.now() - this.lastUsernameCheckTime < 700) {
            setTimeout(this.inlineCheckUsername, 1000);
            return;
        }
        if (this.username.length === 0) {
            this.elements.usernameFeedback.setClass('Hidden');
        }
        else if (!cf.USERNAME_SYNTAX.test(this.username)) {
            this.elements.usernameFeedback
                .setHtml(this.l10ns.invalidUsernameErrorMessage)
                .setClass('Error');
        }
        else {
            if (this.username === this.lastUsernameCheck) {
                return;
            }
            (function (currentUsername) {
                Index_2.HTTP.get("/usernames/" + encodeURIComponent(_this.username))
                    .then(function () {
                    if (currentUsername === _this.lastUsernameCheck) {
                        _this.elements.usernameFeedback
                            .setHtml(_this.l10ns.usernameAlreadyTakenErrorMessage)
                            .setClass('Error');
                        _this.usernameIsUnique = false;
                    }
                })
                    .catch(function (err) {
                    if (err) {
                        if (err instanceof Error) {
                            throw err;
                        }
                        else if (err.body && err.body.type === 0 &&
                            err.body.feedback.current.code === 0 &&
                            currentUsername === _this.lastUsernameCheck) {
                            _this.elements.usernameFeedback
                                .setHtml(_this.l10ns.usernameUniqueSuccessMessage)
                                .setClass('Success');
                            _this.usernameIsUnique = true;
                        }
                    }
                });
            })(this.username);
        }
        this.lastUsernameCheck = this.username;
        this.lastUsernameCheckTime = (new Date).getTime();
    };
    SignUpFormView.prototype.validateName = function () {
        if (this.name.length === 0) {
            this.showErrorMessage(this.l10ns.noNameErrorMessage);
            return false;
        }
        return true;
    };
    SignUpFormView.prototype.validateUsername = function () {
        if (this.username.length === 0) {
            this.showErrorMessage(this.l10ns.noUsernameErrorMessage);
            return false;
        }
        cf.USERNAME_SYNTAX.index = 0;
        if (!cf.USERNAME_SYNTAX.test(this.username)) {
            this.showErrorMessage(this.l10ns.invalidUsernameErrorMessage);
            return false;
        }
        if (!this.usernameIsUnique) {
            this.showErrorMessage(this.l10ns.usernameAlreadyTakenErrorMessage);
            return false;
        }
        return true;
    };
    SignUpFormView.prototype.validateEmail = function () {
        if (this.email.length === 0) {
            this.showErrorMessage(this.l10ns.noEmailErrorMessage);
            return false;
        }
        cf.EMAIL_SYNTAX.index = 0;
        if (!cf.EMAIL_SYNTAX.test(this.email)) {
            this.showErrorMessage(this.l10ns.invalidEmailErrorMessage);
            return false;
        }
        return true;
    };
    SignUpFormView.prototype.validatePassword = function () {
        if (this.password.length === 0) {
            this.showErrorMessage(this.l10ns.noPasswordErrorMessage);
            return false;
        }
        if (this.password.length < 6) {
            this.showErrorMessage(this.l10ns.passwordTooShortErrorMessage);
            return false;
        }
        if (this.password.length > 100) {
            this.showErrorMessage(this.l10ns.passwordTooLongErrorMessage);
            return false;
        }
        return true;
    };
    SignUpFormView.prototype.addValidInvitationEmails = function () {
        this.validInvitationEmails = '';
        for (var _i = 0, _a = this.invitations; _i < _a.length; _i++) {
            var i = _a[_i];
            if (cf.EMAIL_SYNTAX.test(i)) {
                this.validInvitationEmails += i + ',';
            }
        }
        this.validInvitationEmails = this.validInvitationEmails
            .substr(0, this.validInvitationEmails.length - 1);
    };
    SignUpFormView.prototype.submit = function (event) {
        var _this = this;
        event.preventDefault();
        if (this.isRequesting) {
            return;
        }
        var isValid = this.validateName() &&
            this.validateUsername() &&
            this.validateEmail() &&
            this.validatePassword();
        if (!isValid) {
            return;
        }
        this.hideErrorMessage();
        this.addValidInvitationEmails();
        var formData = new FormData();
        formData.append('name', this.name);
        formData.append('username', this.username);
        formData.append('profileImage', this.profileImage);
        formData.append('email', this.email);
        formData.append('password', this.password);
        formData.append('invitations', this.validInvitationEmails);
        formData.append('token', App.router.getQueryParam('token'));
        this.components.submitButton.startLoading();
        this.isRequesting = true;
        var callback = new Index_2.DeferredCallback(2000, function () {
            _this.components.submitButton.stopLoading();
        });
        Index_2.HTTP.post('/users', {
            bodyType: Index_2.HTTP.BodyType.MultipartFormData,
            body: formData,
        })
            .then(function () {
            callback.call(function () {
                _this.showSuccessMessage(_this.l10ns.signUpSuccessfulMessage);
                _this.loginUser();
            });
        })
            .catch(function (err) {
            if (err.body &&
                err.body.feedback &&
                err.body.feedback.current &&
                err.body.feedback.current.code >= 0) {
                switch (err.body.feedback.current.code) {
                    case 10:
                        _this.showErrorMessage(_this.l10ns.usernameAlreadyTakenErrorMessage);
                        break;
                    case 9:
                        _this.showErrorMessage(_this.l10ns.emailAlreadyTakenErrorMessage);
                        break;
                    case 14:
                        _this.showErrorMessage(_this.l10ns.invalidInvitationTokenErrorMessage);
                        break;
                    default:
                        _this.showErrorMessage(_this.l10ns.unknownErrorErrorMessage);
                }
                callback.call();
            }
            _this.isRequesting = false;
        });
    };
    SignUpFormView.prototype.loginUser = function () {
    };
    return SignUpFormView;
}(Index_2.ContentComponent));
exports.SignUpFormView = SignUpFormView;
//# sourceMappingURL=SignUpFormView.js.map