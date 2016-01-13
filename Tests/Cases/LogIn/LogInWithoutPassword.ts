
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/login')
        .input('LogInFormUsernameOrEmail', 'email')
        .click('LogInSubmitButton');
}