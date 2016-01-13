
import { WebDriverTest, HTTP, HTTPResponse, ModelResponse } from '../../../TestHarness/Harness';

interface EmailVerificationToken {
    token: string;
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
            return HTTP.get('/users/2/email-verification')
        });
}

export function test(test: WebDriverTest, response: HTTPResponse<ModelResponse<EmailVerificationToken>>) {
    return test.get('/email-verification?userId=2&token=' + response.body.model.token);
}
