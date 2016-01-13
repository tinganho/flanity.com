
import { WebDriverTest, getStringOfLength } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/reset-password?token=invalid-token')
        .input('ResetPasswordFormNewPasswordInput', 'password')
        .input('ResetPasswordFormRepeatPasswordInput', 'password')
        .click('ResetPasswordFormSubmitButton');
}
