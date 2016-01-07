
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/forgot-password')
        .input('ForgotPasswordEmailInput', '1')
        .click('ForgotPasswordFormSubmitButton');
}
