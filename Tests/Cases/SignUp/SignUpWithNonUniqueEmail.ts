
import { WebDriverTest, HTTP, HTTPResponse, ModelResponse } from '../../../TestHarness/Harness';

interface EmailVerification {
    token: string;
}

interface Session {
    accessToken: string;
}

export function setup() {
    return HTTP.post('/users', {
            body: {
                name: 'User2',
                username: 'username2',
                email: 'username2@domain.com',
                password: 'password',
                token: 'grantme',
            }
        })
        .then(() => {
            return HTTP.post('/sessions', {
                body: {
                    clientId: 'web',
                    clientSecret: 'web',
                    username: 'username2',
                    password: 'password',
                }
            });
        })
        .then((response: HTTPResponse<ModelResponse<Session>>) => {
            return HTTP.get('/users/2/email-verification', {
                accessToken: response.body.model.accessToken,
            });
        })
        .then((response: HTTPResponse<ModelResponse<EmailVerification>>) => {
            return HTTP.del('/users/2/email-verification', {
                body: {
                    token: response.body.model.token
                }
            });
        });
}

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .input('SignUpFormNameInput', 'User3')
        .input('SignUpFormUsernameInput', 'username3')
        .input('SignUpFormEmailInput', 'username2@domain.com')
        .input('SignUpFormPasswordInput', 'password')
        .click('SignUpSubmitButton')
        .waitFor('FinishedLoading')
}
