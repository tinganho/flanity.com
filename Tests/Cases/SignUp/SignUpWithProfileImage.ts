
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .input('SignUpFormNameInput', 'User2')
        .input('SignUpFormUsernameInput', 'username2')
        .input('SignUpFormEmailInput', 'username2@domain.com')
        .input('SignUpFormPasswordInput', 'password')
        .upload('SignUpProfileImageInput', 'Tests/Resources/250x250.png')
        .sleep(3000)
        .click('ImageCropDoneButton')
        .sleep(1000)
        .click('SignUpSubmitButton')
        .waitFor('FinishedLoading')
}
