"use strict";
global.inServer = true;
global.inClient = false;
if (process.env.NODE_ENV !== 'production') {
    require('source-map-support').install();
}
var localizations = require('./Public/Scripts/Localizations/all');
var Server_1 = require('./Configurations/Server');
global.cf = Server_1.ServerConfigurations;
var express = require('express');
var logger = require('morgan');
var compression = require('compression');
var requestLanguage = require('express-request-language');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var LogInAPI_1 = require('./Contents/LogInForm/LogInAPI');
var Pages_1 = require('./Pages');
var Index_1 = require('./Library/Server/Index');
var Index_2 = require('./Library/Index');
var Server = express();
Server.use(compression());
Server.use(logger('dev'));
if (process.env.NODE_ENV === 'production') {
    Server.use(function (req, res, next) {
        if (req.url.indexOf('/Public/') === 0) {
            res.setHeader('Cache-Control', 'public, max-age=31536000000');
            res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString());
        }
        return next();
    });
}
Server.use(bodyParser.urlencoded({ extended: true }));
Server.use('/Public', express.static(Index_1.System.joinPaths(__dirname, 'Public'), { etag: false }));
Server.use('/', express.static(__dirname));
Server.use(cookieParser());
Server.use(requestLanguage({
    languages: ['en-US', 'zh-CN'],
    cookie: {
        name: 'language',
        options: { maxAge: 24 * 3600 * 1000 },
        url: '/languages/{language}'
    },
    localizations: localizations,
}));
Index_2.setDefaultHttpRequestOptions({
    host: Server_1.ServerConfigurations.DEFAULT_HTTP_REQUEST_HOST,
    port: parseInt(Server_1.ServerConfigurations.DEFAULT_HTTP_REQUEST_PORT),
    protocol: Server_1.ServerConfigurations.DEFAULT_HTTP_REQUEST_HTTPS ? 'https' : 'http',
});
Server.post('/login', LogInAPI_1.login);
var serverComposer = Pages_1.init(Server);
function start() {
    Index_1.writeClientConfigurations();
    serverComposer.start(function (err) {
        if (err) {
            throw err;
        }
        Index_2.Debug.prompt("Server started at port " + (process.env.PORT || Server_1.ServerConfigurations.DEFAULT_SERVER_PORT) + ". Press CTRL + C to exit.");
    });
}
exports.start = start;
function emitClientFiles() {
    serverComposer.emitBindings();
    Index_1.writeClientConfigurations();
    serverComposer.emitClientRouter();
}
exports.emitClientFiles = emitClientFiles;
//# sourceMappingURL=Server.js.map