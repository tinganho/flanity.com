
import { WebDriverTest } from '../../../TestHarness/WebDriverTest';

export function test(test: WebDriverTest) {
    return test.get('/signup')
        .input('SignUpFormUsernameInput', 'username1')
        .waitFor('PageFinishedLoading')
        .clearInput('SignUpFormUsernameInput');
}
