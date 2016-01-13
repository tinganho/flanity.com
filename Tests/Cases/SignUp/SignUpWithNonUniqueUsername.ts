
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .input('SignUpFormNameInput', 'User2')
        .input('SignUpFormUsernameInput', 'username1')
        .input('SignUpFormEmailInput', 'username2@domain.com')
        .input('SignUpFormPasswordInput', 'password')
        .click('SignUpSubmitButton')
        .waitFor('FinishedLoading')
}
