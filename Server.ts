
/// <reference path='Typings/tsd.d.ts' />

(global as any).inServer = true;
(global as any).inClient = false;

if (process.env.NODE_ENV !== 'production') {
    require('source-map-support').install();
}
let localizations = require('./Public/Scripts/Localizations/all');

import { ServerConfigurations as cf } from './Configurations/Server';
(global as any).cf = cf;
import express = require('express');
import logger = require('morgan');
import compression = require('compression');
import requestLanguage = require('express-request-language');
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');
import { login } from './Contents/LogInForm/LogInAPI';
import { init as initPages } from './Pages';
import { System, writeClientConfigurations } from './Library/Server/Index';
import { setDefaultHttpRequestOptions, Debug } from './Library/Index';

let Server = express();
Server.use(compression());
Server.use(logger('dev'));
if (process.env.NODE_ENV === 'production') {
    Server.use((req, res, next) => {
        if(req.url.indexOf('/Public/') === 0) {
            res.setHeader('Cache-Control', 'public, max-age=31536000000');
            res.setHeader('Expires', new Date(Date.now() + 365 * 24 * 3600 * 1000).toUTCString());
        }
        return next();
    });
}
Server.use(bodyParser.urlencoded({ extended: true }));
Server.use('/Public', express.static(System.joinPaths(__dirname, 'Public'), { etag: false }));
Server.use('/', express.static(__dirname));
Server.use(cookieParser());
Server.use(requestLanguage({
    languages: ['en-US', 'zh-CN'],
    cookie: {
        name: 'language',
        options: { maxAge: 24*3600*1000 },
        url: '/languages/{language}'
    },
    localizations,
}));

setDefaultHttpRequestOptions({
    host: cf.DEFAULT_HTTP_REQUEST_HOST,
    port: parseInt(cf.DEFAULT_HTTP_REQUEST_PORT),
    protocol: cf.DEFAULT_HTTP_REQUEST_HTTPS ? 'https' : 'http',
});

Server.post('/login', login);

let serverComposer = initPages(Server);

export function start() {
    writeClientConfigurations();
    serverComposer.start((err: any) => {
        if (err) {
            throw err;
        }
        Debug.prompt(`Server started at port ${process.env.PORT || cf.DEFAULT_SERVER_PORT}. Press CTRL + C to exit.`);
    });
}

export function emitClientFiles() {
    serverComposer.emitBindings();
    writeClientConfigurations();
    serverComposer.emitClientRouter();
}

