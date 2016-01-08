
import { SubmitButton, FormMessage } from '../../Components/Index';
import {
    React,
    DOMElement,
    ContentComponent,
    HTTP,
    HTTPResponseType,
    HTTPResponse,
    ModelResponse,
    ErrorResponse,
    DeferredCallback,
    Feedback,
    PageInfo } from '../../Library/Index';

interface L10ns {
    usernameOrEmailPlaceholder: string;
    passwordPlaceholder: string;
    submitButtonText: string;

    noUsernameOrEmailErrorMessage: string;
    noPasswordErrorMessage: string;
    userNotFoundErrorMessage: string;
    unknownErrorErrorMessage: string;

    forgotPassword: string;

    [index: string]: string;
}

interface Props {
}

interface LogInFormElements extends Elements {
    usernameOrEmail: DOMElement;
    password: DOMElement;
    passwordLink: DOMElement;
    signupButton: DOMElement;
    submitButton: DOMElement;
}

interface LogInFormComponents {
    submitButton: SubmitButton;
    formMessage: FormMessage;

    [index: string]: Component<any, any, any>;
}

const enum LoginRequestFeedback {
    ClientIdNotProvided,
    ClientSecretNotProvided,
    ClientNotFound,
    UserNotFound,
    PasswordNotProvided,
    EmailAndUsernameNotProvided,
    OldSessionNotFound,
}

interface Session {
    accessToken: string;
    renewalToken: string;
    expiry: string;
}

export class LogInFormView extends ContentComponent<Props, L10ns, LogInFormElements> {

    public static setPageInfo(props: Props, l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('LOG_IN_FORM->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('LOG_IN_FORM->PAGE_DESCRIPTION'), pageInfo);
    }

    public components: LogInFormComponents;

    private usernameOrEmail = '';
    private password = '';

    private isRequesting = false;

    public render() {
        return (
            <div>
                <form id='LogInFormForm' class='CentralForm BgWhite2'>
                    <input id='LogInFormUsernameOrEmail' name='usernameOrEmail' ref='usernameOrEmail' type='text' class='TextInput LogInFormTextInput' placeholder={this.l10ns.usernameOrEmailPlaceholder}/>
                    <input id='LogInFormPassword' name='password' ref='password' type='password' class='TextInput LogInFormTextInput' placeholder={this.l10ns.passwordPlaceholder}/>
                    <FormMessage/>
                    <a id='LogInFormForgotPasswordLink' ref='passwordLink' class='TextLink1'>{this.l10ns.forgotPassword}</a>
                    <SubmitButton id='LogInSubmitButton' ref='submitButton' buttonText={this.l10ns.submitButtonText}/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.submit = this.submit.bind(this);
        this.elements.submitButton = this.components.submitButton.elements.container;

        this.bindInteractions();
    }

    public bindInteractions() {
        this.elements.submitButton.addEventListener('click', this.submit);

        this.usernameOrEmail = this.elements.usernameOrEmail.getValue();
        this.elements.usernameOrEmail.addEventListener('change', () => {
            this.usernameOrEmail = this.elements.usernameOrEmail.getValue();
        });
        this.password = this.elements.password.getValue();
        this.elements.password.addEventListener('change', () => {
            this.password = this.elements.password.getValue();
        });
        this.elements.passwordLink.addEventListener('click', this.navigateToForgotPasswordPage);
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
            usernameOrEmailPlaceholder: l('LOG_IN_FORM->USERNAME_OR_EMAIL_PLACEHOLDER'),
            passwordPlaceholder: l('LOG_IN_FORM->PASSWORD_PLACEHOLDER'),
            submitButtonText: l('LOG_IN_FORM->SUBMIT_BUTTON'),

            noUsernameOrEmailErrorMessage: l('LOG_IN_FORM->NO_USERNAME_OR_EMAIL_ERROR_MESSAGE'),
            noPasswordErrorMessage: l('LOG_IN_FORM->NO_PASSWORD_ERROR_MESSAGE'),
            userNotFoundErrorMessage: l('LOG_IN_FORM->USER_NOT_FOUND_ERROR_MESSAGE'),
            unknownErrorErrorMessage: l('DEFAULT->UNKNOW_ERROR_MESSAGE'),

            forgotPassword: l('LOG_IN_FORM->FORGOT_PASSWORD_LINK_TEXT'),
        }
    }

    private showErrorMessage(message: string) {
        this.components.formMessage.showErrorMessage(message);
    }

    private navigateToForgotPasswordPage() {
        App.router.navigateTo('/forgot-password');
    }

    private validateUsernameOrEmail(): boolean {
        if (this.usernameOrEmail.length === 0) {
            this.showErrorMessage(this.l10ns.noUsernameOrEmailErrorMessage);
            return false;
        }

        return true;
    }

    private validatePassword(): boolean {
        if (this.password.length === 0) {
            this.showErrorMessage(this.l10ns.noPasswordErrorMessage);
            return false;
        }

        return true;
    }

    private submit(event: Event) {
        event.preventDefault();

        if (this.isRequesting) {
            return;
        }

        let isValid = this.validateUsernameOrEmail() && this.validatePassword();
        if (!isValid) {
            return;
        }

        this.isRequesting = true;

        this.components.submitButton.startLoading();
        let callback = new DeferredCallback(2000, () => {
            this.components.submitButton.stopLoading();
        });
        this.components.formMessage.hideMessage();

        unmarkLoadFinished();
        HTTP.post<ModelResponse<Session>>('/login', {
                host: window.location.hostname,
                port: parseInt(window.location.port),
                body: {
                    email: this.usernameOrEmail,
                    username: this.usernameOrEmail,
                    password: this.password,
                },
            })
            .then((response) => {
                callback.call(() => {
                    let session = response.body.model;
                    document.cookie = 'hasAccessToken=1; expires=' + session.expiry;
                    HTTP.post('/session/cookies', {
                            body: {
                                accessToken: session.accessToken,
                                renewalToken: session.renewalToken,
                                expiry: session.expiry,
                            }
                        })
                        .then(() => {
                            markLoadFinished();
                        })
                        .catch((err: HTTPResponse<ErrorResponse> | Error) => {
                            this.showErrorMessage(this.l10ns.unknownErrorErrorMessage);
                        });
                });
            })
            .catch((err: HTTPResponse<ErrorResponse> | Error) => {
                this.isRequesting = false;
                if (err instanceof Error) {
                    throw err;
                }
                else {
                    let body = err.body;
                    callback.call(() => {
                        switch (body.feedback.current.code) {
                            case LoginRequestFeedback.UserNotFound:
                                this.showErrorMessage(this.l10ns.userNotFoundErrorMessage);
                                break;
                        }
                        markLoadFinished();
                    });
                }
            });
    }
}
