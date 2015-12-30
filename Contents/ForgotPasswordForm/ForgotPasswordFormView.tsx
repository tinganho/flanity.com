
import { SubmitButton, FormMessage } from '../../Components/Index';
import {
    DOMElement,
    ContentComponent,
    React,
    HTTP,
    HTTPResponseType,
    HTTPResponse,
    ModelResponse,
    ErrorResponse,
    DeferredCallback } from '../../Library/Index';

interface L10ns {
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

export class ForgotPasswordFormView extends ContentComponent<Props, L10ns, HeroElements> {
    private email: string;
    private isRequesting: boolean;
    public components: Components;

    public render() {
        return (
            <div>
                <form id='ForgotPasswordFormForm' class='CentralForm BgWhite'>
                    <p id='ForgotPasswordFormDescription' class='PromptText'>{this.l10ns.forgotPasswordDescription}</p>
                    <input name='email' ref='emailInput' type='text' class='TextInput ForgotPasswordFormTextInput' placeholder={this.l10ns.emailPlaceholderText}/>
                    <FormMessage/>
                    <SubmitButton id='ForgotPasswordFormSubmitButton' ref='submitButton' buttonText={this.l10ns.sendButtonText}/>
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
        this.onEmailInputChange = this.onEmailInputChange.bind(this);

        this.onEmailInputChange();
        this.elements.emailInput.addEventListener('change', this.onEmailInputChange);
        this.components.submitButton.addOnSubmitListener(this.onSubmit);
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
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

    private onEmailInputChange() {
        this.email = this.elements.emailInput.getValue();
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

        HTTP.post<string>('/forgot-password-tokens', {
                body: {
                    email: this.email,
                }
            })
            .then(() => {
                callback.call(() => {
                    this.showSuccessMessage(this.l10ns.successfulMessage);
                });
            })
            .catch((err: HTTPResponse<ErrorResponse> | Error) => {
                if (err instanceof Error) {
                    callback.call(() => {
                        this.showErrorMessage(this.l10ns.unknownErrorErrorMessage);
                    });
                    throw err;
                }
                else {
                    callback.call(() => {
                        if (err.body.feedback.current.code === ForgotPasswordRequestFeedback.UserNotFound) {
                            this.showErrorMessage(this.l10ns.userNotFoundErrorMessage);
                        }
                        else {
                            this.showErrorMessage(this.l10ns.unknownErrorErrorMessage);
                        }
                    });
                }
            });
    }
}
