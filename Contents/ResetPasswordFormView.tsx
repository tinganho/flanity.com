
import {
    SubmitButton,
    FormMessage } from '../Components/Index';
import {
    React,
    ContentComponent,
    DOMElement,
    HTTP,
    HTTPResponse,
    HTTPResponseType,
    ModelResponse,
    ErrorResponse,
    TimedCallback,
    PageInfo } from '../Library/Index';

interface Text {
    sendButtonText: string;

    resetPasswordDescription: string;
    newPasswordPlaceholderText: string;
    repeatPasswordPlaceholderText: string;

    noPasswordErrorMessage: string;
    passwordTooShortErrorMessage: string;
    passwordTooLongErrorMessage: string;
    wrongRepeatPasswordErrorMessage: string;
    invalidResetPasswordErrorMessage: string;
    unknownErrorErrorMessage: string;

    successfulMessage: string;

    [index: string]: string;
}

interface Props {
}

interface HeroElements {
    signupButton: DOMElement;
    newPasswordInput: DOMElement;
    repeatPasswordInput: DOMElement;
}

interface Components {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

const enum ResetPasswordRequestFeedback {
    MissingToken,
    ForgotPasswordTokenNotFound,
}

export class ResetPasswordFormView extends ContentComponent<Props, Text, HeroElements> {

    public static setPageInfo(l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('RESET_PASSWORD_FORM->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('RESET_PASSWORD_FORM->PAGE_DESCRIPTION'), pageInfo);
    }

    private newPassword: string;
    private repeatPassword: string;

    private isRequesting: boolean;

    components: Components;

    public render() {
        return (
            <div>
                <form id='ResetPasswordFormForm' class='CentralForm BgWhite2'>
                    <p id='ResetPasswordFormDescription' class='PromptText'>{this.text.resetPasswordDescription}</p>
                    <input id='ResetPasswordFormNewPasswordInput' name='newPassword' ref='newPasswordInput' type='password' class='TextInput ResetPasswordFormTextInput' placeholder={this.text.newPasswordPlaceholderText}/>
                    <input id='ResetPasswordFormRepeatPasswordInput' name='repeatPassword' ref='repeatPasswordInput' type='password' class='TextInput ResetPasswordFormTextInput' placeholder={this.text.repeatPasswordPlaceholderText}/>
                    <FormMessage/>
                    <SubmitButton id='ResetPasswordFormSubmitButton' ref='submitButton' buttonText={this.text.sendButtonText}/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
    }

    public bindInteractions() {
        this.onSubmit = this.onSubmit.bind(this);
        this.onNewPasswordInputChange = this.onNewPasswordInputChange.bind(this);
        this.onRepeatPasswordInputChange = this.onRepeatPasswordInputChange.bind(this);

        this.onNewPasswordInputChange();
        this.elements.newPasswordInput.addEventListener('change', this.onNewPasswordInputChange);
        this.onRepeatPasswordInputChange();
        this.elements.repeatPasswordInput.addEventListener('change', this.onRepeatPasswordInputChange);

        this.components.submitButton.addOnSubmitListener(this.onSubmit);
    }

    public setText(l: GetLocalization) {
        this.text = {
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

    private onNewPasswordInputChange() {
        this.newPassword = this.elements.newPasswordInput.getValue();
    }

    private onRepeatPasswordInputChange() {
        this.repeatPassword = this.elements.repeatPasswordInput.getValue();
    }

    private validateNewPassword(): boolean {
        if (this.newPassword.length === 0) {
            this.showErrorMessage(this.text.noPasswordErrorMessage);
            return false;
        }
        if (this.newPassword.length < 6) {
            this.showErrorMessage(this.text.passwordTooShortErrorMessage);
            return false;
        }
        if (this.newPassword.length > 100) {
            this.showErrorMessage(this.text.passwordTooLongErrorMessage);
            return false;
        }
        return true;
    }

    private validateRepeatPassword(): boolean {
        if (this.newPassword !== this.repeatPassword) {
            this.showErrorMessage(this.text.wrongRepeatPasswordErrorMessage);
            return false;
        }
        return true;
    }

    private onSubmit(event: Event) {
        let isValid = this.validateNewPassword() && this.validateRepeatPassword();
        if (!isValid) {
            return;
        }

        if (this.isRequesting) {
            return;
        }

        this.isRequesting = true;
        this.components.submitButton.startLoading();
        let callback = new TimedCallback(2000, () => {
            this.components.submitButton.stopLoading();
        });

        unmarkLoadFinished();
        HTTP.put<string>('/users/me/password', {
                body: {
                    token: App.router.getQueryParam('token'),
                    password: this.newPassword,
                }
            })
            .then(() => {
                callback.stop(() => {
                    this.showSuccessMessage(this.text.successfulMessage);
                    markLoadFinished();
                });
            })
            .catch((err: HTTPResponse<ErrorResponse> | Error) => {
                this.isRequesting = false;
                if (err instanceof Error) {
                    callback.stop(() => {
                        this.showErrorMessage(this.text.unknownErrorErrorMessage);
                        markLoadFinished();
                    });
                    throw err;
                }
                else {
                    callback.stop(() => {
                        if (err.body.feedback.current.code === ResetPasswordRequestFeedback.ForgotPasswordTokenNotFound) {
                            this.showErrorMessage(this.text.invalidResetPasswordErrorMessage);
                        }
                        else {
                            this.showErrorMessage(this.text.unknownErrorErrorMessage);
                        }
                        markLoadFinished();
                    });
                }
            });
    }
}
