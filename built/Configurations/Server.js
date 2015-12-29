"use strict";
var System_1 = require('../Library/Server/System');
exports.ServerConfigurations = {
    DEFAULT_CLIENT_ID: 'web',
    DEFAULT_CLIENT_SECRET: 'web',
    ORIGIN: 'https://flanity.com',
    DEFAULT_SERVER_PORT: 3000,
    CLIENT_CONFIGURATION_OUTPUT: 'Public/Scripts/Configurations.js',
    DEFAULT_SCREEN_RESOLUTION: {
        WIDTH: 1024,
        HEIGHT: 768,
    },
    DEFAULT_APP_NAME: 'Flanity',
    DEFAULT_PAGE_TIMEOUT: 30,
    DEFAULT_WEBDRIVER_SERVER: 'http://127.0.0.1:4444/wd/hub',
    WEBDRIVER_IDLE_TIME: 60000,
    DEFAULT_HTTP_REQUEST_HOST: System_1.System.config.backend.host,
    DEFAULT_HTTP_REQUEST_PORT: System_1.System.config.backend.port,
    DEFAULT_HTTP_REQUEST_HTTPS: System_1.System.config.backend.https,
    ACCESS_TOKEN_MAX_AGE: 12 * 30 * 24 * 3600,
};
//# sourceMappingURL=Server.js.map