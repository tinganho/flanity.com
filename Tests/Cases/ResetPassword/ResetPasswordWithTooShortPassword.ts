
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/reset-password')
        .input('ResetPasswordFormNewPasswordInput', 'passw')
        .click('ResetPasswordFormSubmitButton');
}
