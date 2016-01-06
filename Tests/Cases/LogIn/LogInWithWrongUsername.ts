
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/login')
        .input('LogInFormUsernameOrEmail', 'wrong-username')
        .input('LogInFormPassword', 'password')
        .click('LogInSubmitButton')
        .waitFor('FinishedLoading');
}