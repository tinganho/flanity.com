
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .input('SignUpFormUsernameInput', 'username2')
        .input('SignUpFormEmailInput', 'username2@domain.com')
        .input('SignUpFormPasswordInput', 'password')
        .click('SignUpSubmitButton');
}
