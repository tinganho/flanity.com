
import { SubmitButton, FormMessage } from '../Components/Index';
import {
    DOMElement,
    ContentComponent,
    React,
    HTTP,
    HTTPResponseType,
    HTTPResponse,
    ModelResponse,
    ErrorResponse,
    DeferredCallback,
    PageInfo,
    autobind } from '../Library/Index';

interface Text {
    forgotPasswordDescription: string;
    emailPlaceholderText: string;
    sendButtonText: string;

    noEmailErrorMessage: string;
    invalidEmailErrorMessage: string;
    userNotFoundErrorMessage: string;
    unknownErrorErrorMessage: string;

    successfulMessage: string;

    [index: string]: string;
}

interface Props {
}

interface HeroElements extends Elements {
    signupButton: DOMElement;
    emailInput: DOMElement;
}

interface Components {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

const enum ForgotPasswordRequestFeedback {
    MissingEmail,
    UserNotFound,
}

export class ForgotPasswordFormView extends ContentComponent<Props, Text, HeroElements> {

    public static setPageInfo(props: Props, l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('FORGOT_PASSWORD_FORM->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('FORGOT_PASSWORD_FORM->PAGE_DESCRIPTION'), pageInfo);
    }

    private email: string;
    private isRequesting: boolean;
    public components: Components;

    public render() {
        return (
            <div>
                <form id='ForgotPasswordFormForm' class='CentralForm BgWhite2'>
                    <p id='ForgotPasswordFormDescription' class='PromptText'>{this.text.forgotPasswordDescription}</p>
                    <input id='ForgotPasswordEmailInput' name='email' ref='emailInput' type='text' class='TextInput ForgotPasswordFormTextInput' placeholder={this.text.emailPlaceholderText}/>
                    <FormMessage/>
                    <SubmitButton id='ForgotPasswordFormSubmitButton' ref='submitButton' buttonText={this.text.sendButtonText}/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
    }

    public bindInteractions() {
        this.onEmailInputChange();
        this.elements.emailInput.addEventListener('change', this.onEmailInputChange);
        this.components.submitButton.addOnSubmitListener(this.onSubmit);
    }

    public setText(l: GetLocalization): void {
        this.text = {
            forgotPasswordDescription: l('FORGOT_PASSWORD_FORM->FORGOT_PASSWORD_DESCRIPTION'),
            emailPlaceholderText: l('DEFAULT->EMAIL_PLACEHOLDER_TEXT'),
            sendButtonText: l('DEFAULT->SEND_BUTTON_TEXT'),

            noEmailErrorMessage: l('DEFAULT->NO_EMAIL_ERROR_MESSAGE'),
            invalidEmailErrorMessage: l('DEFAULT->INVALID_EMAIL_ERROR_MESSAGE'),
            userNotFoundErrorMessage: l('FORGOT_PASSWORD_FORM->USER_NOT_FOUND_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),

            successfulMessage: l('FORGOT_PASSWORD_FORM->SUCCESSFUL_MESSAGE'),
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
    private onEmailInputChange() {
        this.email = this.elements.emailInput.getValue();
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

    @autobind
    private onSubmit(event: Event) {
        if (this.isRequesting) {
            return;
        }

        let isValid = this.validateEmail();
        if (!isValid) {
            return;
        }

        this.isRequesting = true;
        this.components.submitButton.startLoading();
        let callback = new DeferredCallback(2000, () => {
            this.components.submitButton.stopLoading();
        });

        unmarkLoadFinished();
        HTTP.post<string>('/forgot-password-tokens', {
                body: {
                    email: this.email,
                }
            })
            .then(() => {
                callback.call(() => {
                    this.showSuccessMessage(this.text.successfulMessage);
                    markLoadFinished();
                });
            })
            .catch((err: HTTPResponse<ErrorResponse> | Error) => {
                if (err instanceof Error) {
                    callback.call(() => {
                        markLoadFinished();
                        this.showErrorMessage(this.text.unknownErrorErrorMessage);
                    });
                    throw err;
                }
                else {
                    callback.call(() => {
                        markLoadFinished();
                        if (err.body.feedback.current.code === ForgotPasswordRequestFeedback.UserNotFound) {
                            this.showErrorMessage(this.text.userNotFoundErrorMessage);
                        }
                        else {
                            this.showErrorMessage(this.text.unknownErrorErrorMessage);
                        }
                    });
                }
            });
    }
}
