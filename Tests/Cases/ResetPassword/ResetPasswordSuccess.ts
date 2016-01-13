
import {
    WebDriverTest,
    HTTP,
    HTTPResponse,
    ModelResponse } from '../../../TestHarness/Harness';

interface ForgotPasswordToken {
    token: string;
}

export function setup() {
    return HTTP.post('/forgot-password-tokens', {
            body: {
                email: 'username1@domain.com',
            }
        })
        .then(() => {
            return HTTP.get('/users/1/forgot-password-token');
        });
}

export function test(test: WebDriverTest, response: HTTPResponse<ModelResponse<ForgotPasswordToken>>) {
    return test.get('/reset-password?token=' + response.body.model.token)
        .input('ResetPasswordFormNewPasswordInput', 'password')
        .input('ResetPasswordFormRepeatPasswordInput', 'password')
        .click('ResetPasswordFormSubmitButton');
}
