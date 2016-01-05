
import {
    ImageCrop,
    SubmitButton,
    FormMessage } from '../../Components/Index';
import {
    DeferredCallback,
    HTTP,
    HTTPResponseType,
    DOMElement,
    ContentComponent,
    React,
    PageInfo } from '../../Library/Index';

interface L10ns {
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

interface FormElements extends Elements {
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

export class SignUpFormView extends ContentComponent<Props, L10ns, FormElements> {

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
    private usernameIsUnique = false;

    private isRequesting = false;

    public components: SignUpComponents;

    public render() {
        return (
            <div>
                <form id='SignUpFormForm' class='CentralForm BgWhite'>
                    <div id='SignUpFormFirstRow'>
                        <div id='SignUpProfileImage' ref='profileImage'>
                            <input id='SignUpProfileImageInput' ref='profileImageInput' name='profileImage' type='file' accept='image/*'/>
                        </div>
                        <div id='SignUpNameAndPasswordContainer'>
                            <input name='name' ref='name' type='text' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.namePlaceholder}/>
                            <input id='SignUpFormUsernameInput' name='username' ref='username' type='text' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.usernamePlaceholder}/>
                            <span id='SignUpUsernameFeedback' ref='usernameFeedback' class='Hidden'>&nbsp;</span>
                        </div>
                    </div>
                    <input name='email' ref='email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.emailPlaceholder}/>
                    <input name='password' ref='password' type='password' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.passwordPlaceholder}/>
                    <p class='PromptText'>{this.l10ns.inviteFriendPromptText}</p>
                    <input name='friend1Email' ref='friend1Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.inviteFriendPlaceholder}/>
                    <input name='friend2Email' ref='friend2Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.l10ns.inviteFriendPlaceholder}/>
                    <SubmitButton id='SignUpSubmitButton' ref='submitButton' buttonText={this.l10ns.submitButtonText}/>
                    <FormMessage id='SignUpFormMessage' ref='formMessage'/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.submit = this.submit.bind(this);
        this.inlineCheckUsername = this.inlineCheckUsername.bind(this);

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

    public setLocalizations(l: GetLocalization) {
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
        }
    }

    public bindProfileImage() {
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);

        let fileInput = this.elements.profileImageInput;
        fileInput.addEventListener('change', this.handleFileChange);
        fileInput.addEventListener('dragenter', this.handleDragOver);
        fileInput.addEventListener('dragleave', this.handleDragLeave);
        fileInput.addEventListener('drop', this.handleFileChange);
    }

    private handleDragOver(event: DragEvent) {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        this.elements.profileImage.addClass('DragOver');
    }

    private handleDragLeave(event: DragEvent) {
        this.elements.profileImage.removeClass('DragOver');
    }

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
                    .whenDone((imageBlob, imageUrl) => {

                        // Copy and replace input so that we can use the same image.
                        let input = this.elements.profileImageInput;
                        let container = this.elements.profileImage;
                        let clone = input.clone();
                        this.elements.profileImageInput = clone;
                        clone.addEventListener('change', this.handleFileChange);
                        clone.appendTo(this.elements.profileImage);
                        input.remove();

                        let image = new Image();
                        image.src = imageUrl;
                        image.width = this.profileImageWidth;
                        image.height = this.profileImageHeight;
                        this.elements.previewImage = new DOMElement(image);
                        this.elements.previewImage.id = 'SignUpProfileImagePreview';
                        this.elements.previewImage.appendTo(this.elements.profileImage);
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

    private inlineCheckUsername() {
        unmarkPageAsLoaded();

        this.username = this.elements.username.getValue();

        if (Date.now() - this.lastUsernameCheckTime < 700) {
            setTimeout(this.inlineCheckUsername, 1000);
            return;
        }
        if (this.username === this.lastUsernameCheck) {
            return;
        }
        if (this.username.length === 0) {
            markPageAsLoaded();
            this.elements.usernameFeedback.setClass('Hidden');
        }
        else if (!cf.USERNAME_SYNTAX.test(this.username)) {
            markPageAsLoaded();
            this.elements.usernameFeedback
                .setHTML(this.l10ns.invalidUsernameErrorMessage)
                .setClass('Error');
        }
        else {
            ((currentUsername: string) => {
                HTTP.get(`/usernames/${encodeURIComponent(this.username)}`)
                    .then(() => {
                        if (currentUsername === this.username) {
                            this.elements.usernameFeedback
                                .setHTML(this.l10ns.usernameAlreadyTakenErrorMessage)
                                .setClass('Error');
                            this.usernameIsUnique = false;
                            markPageAsLoaded();
                        }
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
                                    .setHTML(this.l10ns.usernameUniqueSuccessMessage)
                                    .setClass('Success');

                                this.usernameIsUnique = true;

                                markPageAsLoaded();
                            }
                        }
                    });
            })(this.username);
        }

        this.lastUsernameCheck = this.username;
        this.lastUsernameCheckTime = (new Date).getTime();
    }

    private validateName(): boolean {
        if (this.name.length === 0) {
            this.showErrorMessage(this.l10ns.noNameErrorMessage);
            return false;
        }
        return true;
    }

    private validateUsername(): boolean {
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
    }

    private validateEmail(): boolean {
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
    }

    private validatePassword(): boolean {
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

        let callback = new DeferredCallback(2000, () => {
            this.components.submitButton.stopLoading();
        });

        HTTP.post('/users',
            {
                bodyType: HTTP.BodyType.MultipartFormData,
                body: formData,
            })
            .then(() => {
                callback.call(() => {
                    this.showSuccessMessage(this.l10ns.signUpSuccessfulMessage);
                    this.loginUser();
                });
            })
            .catch((err) => {
                if (err.body &&
                    err.body.feedback &&
                    err.body.feedback.current &&
                    err.body.feedback.current.code >= 0) {

                    callback.call(() => {
                        switch (err.body.feedback.current.code) {
                            case CreateUserFeedback.UsernameAlreadyTaken:
                                this.showErrorMessage(this.l10ns.usernameAlreadyTakenErrorMessage);
                                break;
                            case CreateUserFeedback.EmailAlreadyTaken:
                                this.showErrorMessage(this.l10ns.emailAlreadyTakenErrorMessage);
                                break;
                            case CreateUserFeedback.MissingInvitationToken:
                            case CreateUserFeedback.InvalidInvitationToken:
                                this.showErrorMessage(this.l10ns.invalidInvitationTokenErrorMessage);
                                break;
                            default:
                                this.showErrorMessage(this.l10ns.unknownErrorErrorMessage);
                        }
                    });
               }
               this.isRequesting = false;
            });
    }

    private loginUser() {

    }
}
