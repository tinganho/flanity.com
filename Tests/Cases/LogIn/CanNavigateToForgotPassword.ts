
import { WebDriverTest } from '../../../TestHarness/WebDriverTest';

export function test(test: WebDriverTest) {
    return test.get('/login')
        .click('LogInFormForgotPasswordLink');
}
