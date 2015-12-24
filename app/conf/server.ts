
export let serverConf = {

    /**
     * Origin.
     *
     * @type string
     */

    ORIGIN: 'https://flanity.com',
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
    CLIENT_CONFIGURATION_OUTPUT: 'public/scripts/conf.js',

    /**
     * Dimensions for View port of test page.
     *
     * @type { HEIGHT: number,  WIDTH: number }
     */
    DEFAULT_SCREEN_RESOLUTION: {
        WIDTH: 1024,
        HEIGHT: 768,
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
    DEFAULT_WEBDRIVER_SERVER: 'http://127.0.0.1:4444/wd/hub',

    /**
     * Specify the idle time for your webdriver tests.
     *
     * @type string
     */
    WEBDRIVER_IDLE_TIME: 60000,
}

export default serverConf;