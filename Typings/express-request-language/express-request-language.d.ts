// Type definitions for chai 2.0.0
// Definitions by: Tingan Ho <https://github.com/tinganho/>,
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path='../express/express.d.ts' />

declare module 'express-request-language' {
    import express = require('express');

    interface Cookie {
        name: string;
        options?: express.CookieOptions;
        url: string;
    }

    interface Options {
        languages: string[];
        cookie: Cookie;
        localizations: any;
    }

    function requestLanguage(options: Options): express.RequestHandler

    export = requestLanguage;
}