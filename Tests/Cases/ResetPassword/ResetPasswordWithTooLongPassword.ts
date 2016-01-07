
import { WebDriverTest, getStringOfLength } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/reset-password')
        .input('ResetPasswordFormNewPasswordInput', getStringOfLength(101))
        .click('ResetPasswordFormSubmitButton');
}
