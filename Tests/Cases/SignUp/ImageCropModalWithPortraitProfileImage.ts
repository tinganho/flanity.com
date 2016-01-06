
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/signup?token=grantme')
        .upload('SignUpProfileImageInput', 'Tests/Resources/PortraitProfileImage.jpg');
}
