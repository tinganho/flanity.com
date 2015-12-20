
export var cf = {

    /**
     * Port of your web application.
     *
     * @type number
     */
    DEFAULT_PORT: 3000,

    /**
     * App origin.
     *
     * @type string
     */
    ORIGIN: 'http://www.nalie.co',

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
    DEFAULT_APP_NAME: 'App',

    /**
     * Default page timeout in seconds.
     *
     * @type number
     */
    DEFAULT_PAGE_TIMEOUT: 30,

    /**
     * Default new line for output files.
     *
     * @type string
     */
    DEFAULT_NEW_LINE: '\n',

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

export default cf;