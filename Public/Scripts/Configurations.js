window.cf = (function() {
var configs = {
    "DEFAULT_PAGE_TIMEOUT": 30,
    "DEFAULT_HTTP_REQUEST_HOST": "tingan.dev.flanity.com",
    "DEFAULT_HTTP_REQUEST_PORT": "80",
    "DEFAULT_HTTP_REQUEST_HTTPS": false,
    "USERNAME_SYNTAX": "^([a-zA-Z][a-zA-Z0-9_]*)$",
    "EMAIL_SYNTAX": "^[^s@]+@[^s@]+.[^s@]+$",
    "DEFAULT_CLIENT_ID": "web",
    "DEFAULT_CLIENT_SECRET": "web",
    "ORIGIN": "https://flanity.com",
    "DEFAULT_SERVER_PORT": 3000,
    "CLIENT_CONFIGURATION_OUTPUT": "Public/Scripts/Configurations.js",
    "DEFAULT_SCREEN_RESOLUTION": {
        "WIDTH": 1024,
        "HEIGHT": 768
    },
    "DEFAULT_APP_NAME": "Flanity",
    "DEFAULT_WEBDRIVER_SERVER": "http://127.0.0.1:4444/wd/hub",
    "WEBDRIVER_IDLE_TIME": 60000,
    "ACCESS_TOKEN_MAX_AGE": 31104000
};
for(var key in configs) {
    if (/_SYNTAX$/.test(key)) {
        configs[key] = new RegExp(configs[key]);
    }
}
return configs;
})();