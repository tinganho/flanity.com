
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .input('SignUpFormNameInput', 'User2')
        .input('SignUpFormUsernameInput', 'username2')
        .input('SignUpFormEmailInput', 'username@domain.com')
        .input('SignUpFormPasswordInput', 'passw')
        .click('SignUpSubmitButton')
}
