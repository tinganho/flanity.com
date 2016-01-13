
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/login')
        .input('LogInFormUsernameOrEmail', 'wrong-email')
        .input('LogInFormPassword', 'password')
        .click('LogInSubmitButton')
        .waitFor('FinishedLoading');
}