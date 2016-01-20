
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup')
        .input('SignUpFormUsernameInput', 'username')
        .waitFor('FinishedLoading')
}
