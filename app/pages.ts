
import express = require('express');
import { Document } from './documents/document';
import { Hero } from './contents/hero/hero';
import { TopBar } from './contents/topBar/topBar';
import { SignUpForm } from './contents/signUp/signUp';
import { ServerComposer, PlatformDetect } from './composer/serverComposer';
import { ModuleKind } from './composer/webBindingsEmitter';
import { Body_withTopBar } from './layouts/body_withTopBar';

let serverComposer: ServerComposer;

export function init(app: express.Express) {
    serverComposer = new ServerComposer({
        app,
        rootPath: __dirname,
        routerOutput: 'public/scripts/router.js',
        bindingsOutput: 'public/scripts/bindings.js',
        clientConfigurationPath: './client/*.js',
        moduleKind: ModuleKind.CommonJs,
        defaultDocumentFolder: 'documents',
        defaultLayoutFolder: 'layouts',
        defaultContentFolder: 'contents',
    });

    serverComposer.setPages({
        '/': page => {
            page.onPlatform({
                    name: 'web',
                    detect: () => true,
                })
                .hasDocument(Document, {})
                .hasLayout(Body_withTopBar, {
                    TopBar: {
                        importPath: 'contents/topBar/topBar',
                        component: TopBar,
                    },
                    Body: {
                        importPath: 'contents/hero/hero',
                        component: Hero,
                    },
                })
                .end();
        },

        '/signup': page => {
            page.onPlatform({
                    name: 'web',
                    detect: () => true,
                })
                .hasDocument(Document, {})
                .hasLayout(Body_withTopBar, {
                    TopBar: {
                        importPath: 'contents/topBar/topBar',
                        component: TopBar,
                    },
                    Body: {
                        importPath: 'contents/signUp/signUp',
                        component: SignUpForm,
                    }
                })
                .end();
        }
    });

    return serverComposer;
}
