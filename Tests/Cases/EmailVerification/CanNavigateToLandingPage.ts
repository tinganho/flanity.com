
import { WebDriverTest } from '../../../TestHarness/Harness';

export function test(test: WebDriverTest) {
    return test.get('/email-verification?userId=2&token=1')
        .click('LandingPageTopBarLogoContainer');
}
