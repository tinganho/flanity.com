
import {
    ImageCrop,
    SubmitButton,
    FormMessage } from '../Components/Index';
import {
    TimedCallback,
    HTTP,
    HTTPResponseType,
    HTTPResponse,
    ModelResponse,
    DOMElement,
    ContentComponent,
    React,
    PageInfo,
    autobind } from '../Library/Index';

interface Text {
    namePlaceholder: string;
    usernamePlaceholder: string;
    passwordPlaceholder: string;
    emailPlaceholder: string;
    inviteFriendPlaceholder: string;
    inviteFriendPromptText: string;
    submitButtonText: string;

    noNameErrorMessage: string;
    noUsernameErrorMessage: string;
    noEmailErrorMessage: string;
    noPasswordErrorMessage: string;

    invalidUsernameErrorMessage: string;
    invalidEmailErrorMessage: string;
    passwordTooShortErrorMessage: string;
    passwordTooLongErrorMessage: string;
    usernameAlreadyTakenErrorMessage: string;
    emailAlreadyTakenErrorMessage: string;
    invalidInvitationTokenErrorMessage: string;
    unknownErrorErrorMessage: string;
    usernameUniqueSuccessMessage: string;
    signUpSuccessfulMessage: string;
}

interface Props {
}

interface FormElements {
    submitButton: DOMElement;
    profileImage: DOMElement;
    profileImageInput: DOMElement;
    previewImage: DOMElement;
    name: DOMElement;
    username: DOMElement;
    email: DOMElement;
    password: DOMElement;
    friend1Email: DOMElement;
    friend2Email: DOMElement;
    usernameFeedback: DOMElement;
}

interface Session {
    accessToken: string;
    renewalToken: string;
    expiry: string;
    userId: string;
}

interface User {
    username: string;
}

interface FileReadResult extends File {
    result: string;
}

interface FileEventTarget extends EventTarget {
    files: FileReadResult[];
}

interface FileChangeEvent extends Event {
    target: FileEventTarget;
}

interface FileReadEventTarget extends EventTarget {
    result: string;
}

interface FileReadOnloadEvent extends Event {
    target: FileReadEventTarget;
}

const enum UsernameRequestFeedback {
    UsernameNotFound,
}

const enum CreateUserFeedback {
    MissingName,
    NameTooLong,
    MissingPassword,
    PasswordTooShort,
    PasswordTooLong,
    MissingUsername,
    UsernameTooLong,
	InvalidUsername,
    MissingEmail,
    EmailAlreadyTaken,
    UsernameAlreadyTaken,
    NonSquareProfileImage,
    ProfileImageTooSmall,
    MissingInvitationToken,
    InvalidInvitationToken,
}

interface SignUpSubmitButtonElements {
    container: DOMElement;
}

interface SignUpComponents {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

export class SignUpFormView extends ContentComponent<Props, Text, FormElements> {

    public static setPageInfo(props: Props, l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('SIGN_UP_FORM->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('SIGN_UP_FORM->PAGE_DESCRIPTION'), pageInfo);
    }

    private profileImageHeight: number;
    private profileImageWidth: number;

    private profileImage: Blob;
    private name = '';
    private username = '';
    private email = '';
    private password = '';
    private invitations: string[] = [];
    private validInvitationEmails: string;

    private lastUsernameCheck: string;
    private lastUsernameCheckTime = 0;

    private isRequesting = false;

    public components: SignUpComponents;

    public render() {
        return (
            <div>
                <form id='SignUpFormForm' class='CentralForm BgWhite2'>
                    <div id='SignUpFormFirstRow'>
                        <div id='SignUpProfileImage' ref='profileImage'>
                            <input id='SignUpProfileImageInput' ref='profileImageInput' name='profileImage' type='file' accept='image/*' class='FileInput'/>
                        </div>
                        <div id='SignUpNameAndPasswordContainer'>
                            <input id='SignUpFormNameInput' name='name' ref='name' type='text' class='TextInput SignUpFormTextInput' placeholder={this.text.namePlaceholder}/>
                            <input id='SignUpFormUsernameInput' name='username' ref='username' type='text' class='TextInput SignUpFormTextInput' placeholder={this.text.usernamePlaceholder}/>
                            <span id='SignUpUsernameFeedback' ref='usernameFeedback' class='Hidden'>&nbsp;</span>
                        </div>
                    </div>
                    <input id='SignUpFormEmailInput' name='email' ref='email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.text.emailPlaceholder}/>
                    <input id='SignUpFormPasswordInput' name='password' ref='password' type='password' class='TextInput SignUpFormTextInput' placeholder={this.text.passwordPlaceholder}/>
                    <p class='PromptText'>{this.text.inviteFriendPromptText}</p>
                    <input name='friend1Email' ref='friend1Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.text.inviteFriendPlaceholder}/>
                    <input name='friend2Email' ref='friend2Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.text.inviteFriendPlaceholder}/>
                    <SubmitButton id='SignUpSubmitButton' ref='submitButton' buttonText={this.text.submitButtonText}/>
                    <FormMessage id='SignUpFormMessage' ref='formMessage'/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.elements.submitButton = this.components.submitButton.elements.container;
        this.bindInteractions();

        this.profileImageHeight = this.elements.profileImage.getHeight();
        this.profileImageWidth = this.elements.profileImage.getWidth();
    }

    public bindInteractions() {
        this.bindProfileImage();
        this.elements.name.addEventListener('change', () => {
            this.name = this.elements.name.getValue();
        });
        this.elements.submitButton.removeAttribute('disabled');
        this.elements.submitButton.onClick(this.submit);
        this.elements.username.addEventListener('keyup', this.inlineCheckUsername);
        this.elements.email.addEventListener('change', () => {
            this.email = this.elements.email.getValue();
        });
        this.elements.password.addEventListener('change', () => {
            this.password = this.elements.password.getValue();
        });
        this.elements.friend1Email.addEventListener('change', () => {
            this.invitations[0] = this.elements.friend1Email.getValue();
        });
        this.elements.friend2Email.addEventListener('change', () => {
            this.invitations[1] = this.elements.friend2Email.getValue();
        });
    }

    public setText(l: GetLocalization) {
        this.text = {
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
        }
    }

    public bindProfileImage() {
        let fileInput = this.elements.profileImageInput;
        fileInput.addEventListener('change', this.handleFileChange);
        fileInput.addEventListener('dragenter', this.handleDragOver);
        fileInput.addEventListener('dragleave', this.handleDragLeave);
        fileInput.addEventListener('drop', this.handleFileChange);
    }

    @autobind
    private handleDragOver(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        this.elements.profileImage.addClass('DragOver');
    }

    @autobind
    private handleDragLeave(event: DragEvent) {
        this.elements.profileImage.removeClass('DragOver');
    }

    @autobind
    private handleFileChange(event: FileChangeEvent) {
        let files = event.target.files;
        for (let i = 0, f: any; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                continue;
            }

            let reader = new FileReader();
            reader.onload = (e: FileReadOnloadEvent) => {
                let image = new Image();
                image.src = e.target.result;
                image.onload = () => {
                    let imageCrop = new ImageCrop();
                    imageCrop.setDimensions({
                        cropWidth: 300,
                        cropHeight: 300,
                        paddingVertical: 50,
                        paddingHorizontal: 40,
                    })
                    .setImage(image)
                    .onDone((imageBlob, imageUrl) => {

                        if (this.elements.previewImage) {
                            this.elements.previewImage.remove();
                        }

                        let image = new Image();
                        image.src = imageUrl;
                        image.width = this.profileImageWidth;
                        image.height = this.profileImageHeight;
                        this.elements.previewImage = new DOMElement(image);
                        this.elements.previewImage.id = 'SignUpProfileImagePreview';
                        this.elements.previewImage.appendTo(this.elements.profileImage);

                        // Copy and replace input so that we can use the same image.
                        let input = this.elements.profileImageInput;
                        let container = this.elements.profileImage;
                        let clone = input.clone();
                        this.elements.profileImageInput = clone;
                        clone.addEventListener('change', this.handleFileChange);
                        clone.appendTo(this.elements.profileImage);
                        input.remove();

                        container.addClass('HasPicture');

                        this.profileImage = imageBlob;
                    })
                    .end();
                }
            }
            reader.readAsDataURL(f);
        }
    }

    private showErrorMessage(message: string) {
        this.components.formMessage.showErrorMessage(message);
    }

    private hideErrorMessage() {
        this.components.formMessage.hideMessage();
    }

    private showSuccessMessage(message: string) {
        this.components.formMessage.showSuccessMessage(message);
    }

    @autobind
    private inlineCheckUsername() {
        this.username = this.elements.username.getValue();

        if (Date.now() - this.lastUsernameCheckTime < 700) {
            setTimeout(this.inlineCheckUsername, 1000);
            return;
        }
        if (this.username === this.lastUsernameCheck) {
            return;
        }
        if (this.username.length === 0) {
            this.elements.usernameFeedback.setClass('Hidden');
        }
        else if (!cf.USERNAME_SYNTAX.test(this.username)) {
            this.elements.usernameFeedback
                .setHTML(this.text.invalidUsernameErrorMessage)
                .setClass('Error');
        }
        else {
            unmarkLoadFinished();
            ((currentUsername: string) => {
                HTTP.get(`/usernames/${encodeURIComponent(this.username)}`)
                    .then(() => {
                        if (currentUsername === this.username) {
                            this.elements.usernameFeedback
                                .setHTML(this.text.usernameAlreadyTakenErrorMessage)
                                .setClass('Error');
                        }
                        markLoadFinished();
                    })
                    .catch((err) => {
                        if (err) {
                            if (err instanceof Error) {
                                throw err;
                            }
                            else if (err.body && err.body.type === HTTPResponseType.Error &&
                                err.body.feedback.current.code === UsernameRequestFeedback.UsernameNotFound &&
                                currentUsername === this.username) {

                                this.elements.usernameFeedback
                                    .setHTML(this.text.usernameUniqueSuccessMessage)
                                    .setClass('Success');
                            }
                        }
                        markLoadFinished();
                    });
            })(this.username);
        }

        this.lastUsernameCheck = this.username;
        this.lastUsernameCheckTime = (new Date).getTime();
    }

    private validateName(): boolean {
        if (this.name.length === 0) {
            this.showErrorMessage(this.text.noNameErrorMessage);
            return false;
        }
        return true;
    }

    private validateUsername(): boolean {
        if (this.username.length === 0) {
            this.showErrorMessage(this.text.noUsernameErrorMessage);
            return false;
        }

        cf.USERNAME_SYNTAX.index = 0;
        if (!cf.USERNAME_SYNTAX.test(this.username)) {
            this.showErrorMessage(this.text.invalidUsernameErrorMessage);
            return false;
        }

        return true;
    }

    private validateEmail(): boolean {
        if (this.email.length === 0) {
            this.showErrorMessage(this.text.noEmailErrorMessage);
            return false;
        }

        cf.EMAIL_SYNTAX.index = 0;
        if (!cf.EMAIL_SYNTAX.test(this.email)) {
            this.showErrorMessage(this.text.invalidEmailErrorMessage);
            return false;
        }
        return true;
    }

    private validatePassword(): boolean {
        if (this.password.length === 0) {
            this.showErrorMessage(this.text.noPasswordErrorMessage);
            return false;
        }
        if (this.password.length < 6) {
            this.showErrorMessage(this.text.passwordTooShortErrorMessage);
            return false;
        }
        if (this.password.length > 100) {
            this.showErrorMessage(this.text.passwordTooLongErrorMessage);
            return false;
        }
        return true;
    }

    private addValidInvitationEmails() {
        this.validInvitationEmails = '';
        for (let i of this.invitations) {
            if (cf.EMAIL_SYNTAX.test(i)) {
                this.validInvitationEmails += i + ',';
            }
        }
        this.validInvitationEmails = this.validInvitationEmails
            .substr(0, this.validInvitationEmails.length - 1);
    }

    @autobind
    private submit(event: Event) {
        event.preventDefault();

        if (this.isRequesting) {
            return;
        }

        let isValid = this.validateName() &&
        this.validateUsername() &&
        this.validateEmail() &&
        this.validatePassword();

        if (!isValid) {
            return;
        }

        this.hideErrorMessage();
        this.addValidInvitationEmails();

        let formData = new FormData();
        formData.append('name', this.name);
        formData.append('username', this.username);
        formData.append('profileImage', this.profileImage);
        formData.append('email', this.email);
        formData.append('password', this.password);
        formData.append('invitations', this.validInvitationEmails);
        formData.append('token', App.router.getQueryParam('token'));

        this.components.submitButton.startLoading();
        this.isRequesting = true;

        let callback = new TimedCallback(2000, () => {
            this.components.submitButton.stopLoading();
        });

        unmarkLoadFinished();
        HTTP.post<ModelResponse<User>>('/users',
            {
                bodyType: HTTP.BodyType.MultipartFormData,
                body: formData,
            })
            .then((response) => {
                callback.stop(() => {
                    this.showSuccessMessage(this.text.signUpSuccessfulMessage);

                    let callback = new TimedCallback(2000);
                    HTTP.post<ModelResponse<Session>>('/login', {
                            host: window.location.hostname,
                            port: parseInt(window.location.port),
                            body: {
                                username: this.username,
                                password: this.password,
                            },
                        })
                        .then((response) => {
                            callback.stop(() => {
                                let session = response.body.model;
                                document.cookie = 'hasAccessToken=1; expires=' + session.expiry;
                                document.cookie = `userId=${session.userId}; expires=${session.expiry}`;
                                App.router.navigateTo('/@' + this.username);
                                markLoadFinished();
                                this.isRequesting = false;
                            })
                        })
                        .catch((err) => {
                            this.showErrorMessage(this.text.unknownErrorErrorMessage);
                        })
                });
            })
            .catch((err) => {
                if (err.body &&
                    err.body.feedback &&
                    err.body.feedback.current &&
                    err.body.feedback.current.code >= 0) {

                    callback.stop(() => {
                        switch (err.body.feedback.current.code) {
                            case CreateUserFeedback.UsernameAlreadyTaken:
                                this.showErrorMessage(this.text.usernameAlreadyTakenErrorMessage);
                                break;
                            case CreateUserFeedback.EmailAlreadyTaken:
                                this.showErrorMessage(this.text.emailAlreadyTakenErrorMessage);
                                break;
                            case CreateUserFeedback.MissingInvitationToken:
                            case CreateUserFeedback.InvalidInvitationToken:
                                this.showErrorMessage(this.text.invalidInvitationTokenErrorMessage);
                                break;
                            default:
                                this.showErrorMessage(this.text.unknownErrorErrorMessage);
                        }

                        markLoadFinished();
                    });
               }
               this.isRequesting = false;
            });
    }
}
