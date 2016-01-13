
import { System } from '../Library/Server/System';

export let ServerConfigurations = {
    /**
     * Default client id. This should only be used during developmenet.
     *
     * @type string
     */
    DEFAULT_CLIENT_ID: 'web',

    /**
     * Default client secret. This should only be used during developmenet.
     *
     * @type string
     */
    DEFAULT_CLIENT_SECRET: 'web',

    /**
     * Origin.
     *
     * @type string
     */
    PROD_ORIGIN: 'https://flanity.com',
    DEV_ORIGIN: 'http://flanity.local:3000',

    /**
     * Default server port.
     *
     * @type number
     */
    DEFAULT_SERVER_PORT: 3000,

    /**
     * Client configuration output.
     *
     * @type string
     */
    CLIENT_CONFIGURATION_OUTPUT: 'Public/Scripts/Configurations.js',

    /**
     * Dimensions for View port of test page.
     *
     * @type { HEIGHT: number,  WIDTH: number }
     */
    DEFAULT_SCREEN_RESOLUTION: {
        WIDTH: 1500,
        HEIGHT: 1000,
    },

    /**
     * Default app name.
     *
     * @type string
     */
    DEFAULT_APP_NAME: 'Flanity',

    /**
     * Default page timeout in seconds.
     *
     * @type number
     */
    DEFAULT_PAGE_TIMEOUT: 30,

    /**
     * Default selenium server.
     *
     * @type string
     */
    DEFAULT_WEBDRIVER_SERVER: 'http://localhost:4444/wd/hub',

    /**
     * Specify the idle time for your webdriver tests.
     *
     * @type string
     */
    WEBDRIVER_IDLE_TIME: 60000,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_HOST: System.config.backend.host,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_PORT: System.config.backend.port,

    /**
     * Default page timeout in seconds.
     *
     * @import
     */
    DEFAULT_HTTP_REQUEST_HTTPS: System.config.backend.https,

    /**
     * Default HTTP request timeout.
     *
     * @type number
     */
    DEFAULT_HTTP_REQUEST_TIMEOUT: process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 5 * 60 * 1000,

    /**
     * Access token max age.
     *
     * @type number
     */
    ACCESS_TOKEN_MAX_AGE: 12 * 30 * 24 * 3600,

    /**
     * Flag for deciding if runtime is in image test.
     *
     * @type boolean
     */
    IN_IMAGE_TEST: process.env.IN_IMAGE_TEST,
}
