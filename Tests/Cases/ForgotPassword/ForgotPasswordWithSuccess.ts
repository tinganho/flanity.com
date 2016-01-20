
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/forgot-password')
        .input('ForgotPasswordEmailInput', 'username1@domain.com')
        .click('ForgotPasswordFormSubmitButton')
        .waitFor('FinishedLoading')
}
