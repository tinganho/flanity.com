
/// <reference path='./Library/Component.d.ts'/>

import express = require('express');
import { Document } from './Documents/Document';
import { HeroView } from './Contents/Hero/HeroView';
import { HeroModel } from './Contents/Hero/HeroModel';
import { TopBarView } from './Contents/TopBar/TopBarView';
import { TopBarModel } from './Contents/TopBar/TopBarModel';
import { SignUpFormView } from './Contents/SignUpForm/SignUpFormView';
import { SignUpFormModel } from './Contents/SignUpForm/SignUpFormModel';
import { LogInFormModel } from './Contents/LogInForm/LogInFormModel';
import { LogInFormView } from './Contents/LogInForm/LogInFormView';
import { ForgotPasswordFormModel } from './Contents/ForgotPasswordForm/ForgotPasswordFormModel';
import { ForgotPasswordFormView } from './Contents/ForgotPasswordForm/ForgotPasswordFormView';
import { ResetPasswordFormModel } from './Contents/ResetPasswordForm/ResetPasswordFormModel';
import { ResetPasswordFormView } from './Contents/ResetPasswordForm/ResetPasswordFormView';
import { ServerComposer } from './Core/ServerComposer';
import { ModuleKind } from './Core/WebBindingsEmitter';
import { Body_withHeader } from './Layouts/Body_withHeader';

let serverComposer: ServerComposer;

export function init(app: express.Express) {
    serverComposer = new ServerComposer({
        app,
        rootPath: __dirname,
        routerOutput: 'Public/Scripts/Router.js',
        bindingsOutput: 'Public/Scripts/Bindings.js',
        moduleKind: ModuleKind.CommonJs,
        defaultDocumentFolder: 'Documents',
        defaultLayoutFolder: 'Layouts',
        defaultContentFolder: 'Contents',
    });

    let webPlatform = {
        name: 'web',
        detect: () => true,
    }

    serverComposer.setPages({
        '/': page => {
            page.onPlatform(webPlatform)
                .hasDocument(Document, {})
                .hasLayout(Body_withHeader, {
                    Header: {
                        model: TopBarModel,
                        view: TopBarView,
                    },
                    Body: {
                        model: HeroModel,
                        view: HeroView,
                    },
                })
                .end();
        },

        '/forgot-password': page => {
            page.onPlatform(webPlatform)
                .hasDocument(Document, {})
                .hasLayout(Body_withHeader, {
                    Header: {
                        model: TopBarModel,
                        view: TopBarView,
                    },
                    Body: {
                        model: ForgotPasswordFormModel,
                        view: ForgotPasswordFormView,
                    },
                })
                .end();
        },

        '/login': page => {
            page.onPlatform(webPlatform)
                .hasDocument(Document, {})
                .hasLayout(Body_withHeader, {
                    Header: {
                        model: TopBarModel,
                        view: TopBarView,
                    },
                    Body: {
                        model: LogInFormModel,
                        view: LogInFormView,
                    },
                })
                .end();
        },


        '/reset-password': page => {
            page.onPlatform(webPlatform)
                .hasDocument(Document, {})
                .hasLayout(Body_withHeader, {
                    Header: {
                        model: TopBarModel,
                        view: TopBarView,
                    },
                    Body: {
                        model: ResetPasswordFormModel,
                        view: ResetPasswordFormView,
                    },
                })
                .end();
        },

        '/signup': page => {
            page.onPlatform(webPlatform)
                .hasDocument(Document, {})
                .hasLayout(Body_withHeader, {
                    Header: {
                        model: TopBarModel,
                        view: TopBarView,
                    },
                    Body: {
                        model: SignUpFormModel,
                        view: SignUpFormView,
                    },
                })
                .end();
        },
    });

    return serverComposer;
}
