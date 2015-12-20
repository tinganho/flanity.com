
/// <reference path='../typings/express/express.d.ts' />
/// <reference path='../typings/morgan/morgan.d.ts' />
/// <reference path='../typings/cookie-parser/cookie-parser.d.ts' />
/// <reference path='../typings/compression/compression.d.ts' />
/// <reference path='../typings/express-request-language/express-request-language.d.ts' />

(global as any).inServer = true;
(global as any).inClient = false;

if (process.env.NODE_ENV !== 'production') {
    require('source-map-support').install();
}
let localizations = require('./localizations/output/all');

import cf from '../conf/conf';
import express = require('express');
import * as path from 'path';
import logger = require('morgan');
import Debug from './debug';
import compression = require('compression');
import requestLanguage = require('express-request-language');
import cookieParser = require('cookie-parser');
import { init as initPages } from './pages';
import {
    ComposerDocument,
    DocumentDeclaration,
    LayoutDeclaration,
    ContentDeclaration,
    ComposerContent } from './components/layerComponents';

let app = express();
app.use(compression());
app.use(logger('dev'));
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if(req.url.indexOf('/public/') === 0) {
            res.setHeader('Cache-Control', 'public, max-age=31536000000');
            res.setHeader('Expires', new Date(Date.now() + 365*24*3600*1000).toUTCString());
        }
        return next();
    });
}
app.use('/public', express.static(path.join(__dirname, 'public'), { etag: false }));
app.use('/', express.static(__dirname));
app.use(cookieParser());
app.use(requestLanguage({
    languages: ['en-US', 'zh-CN'],
    cookie: {
        name: 'language',
        options: { maxAge: 24*3600*1000 },
        url: '/languages/{language}'
    },
    localizations,
}));

let serverComposer = initPages(app);

export function start() {
    serverComposer.start((err) => {
        if (err) {
            throw err;
        }
        Debug.prompt(`Server started at port ${process.env.PORT || cf.DEFAULT_PORT}. Press CTRL + C to exit.`);
    });
}

export function emitBindingsAndRouterFiles() {
    serverComposer.emitBindings();
    serverComposer.emitClientRouter();
}
