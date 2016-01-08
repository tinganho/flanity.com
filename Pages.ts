
/// <reference path='./Library/Component.d.ts'/>

import { Express, Request, Response } from 'express';
import { Document } from './Documents/Document';
import { ServerComposer, PlatformDetect } from './Core/ServerComposer';
import { ModuleKind } from './Core/WebBindingsEmitter';

import { WebLandingPage } from './Layouts/WebLandingPage';
import { WebApp } from './Layouts/WebApp';

import { AppTopBarModel } from './Contents/AppTopBar/AppTopBarModel';
import { AppTopBarView } from './Contents/AppTopBar/AppTopBarView';
import { EmailVerificationModel } from './Contents/EmailVerification/EmailVerificationModel';
import { EmailVerificationView } from './Contents/EmailVerification/EmailVerificationView';
import { ForgotPasswordFormModel } from './Contents/ForgotPasswordForm/ForgotPasswordFormModel';
import { ForgotPasswordFormView } from './Contents/ForgotPasswordForm/ForgotPasswordFormView';
import { HeroView } from './Contents/Hero/HeroView';
import { HeroModel } from './Contents/Hero/HeroModel';
import { LogInFormModel } from './Contents/LogInForm/LogInFormModel';
import { LogInFormView } from './Contents/LogInForm/LogInFormView';
import { ResetPasswordFormModel } from './Contents/ResetPasswordForm/ResetPasswordFormModel';
import { ResetPasswordFormView } from './Contents/ResetPasswordForm/ResetPasswordFormView';
import { SignUpFormView } from './Contents/SignUpForm/SignUpFormView';
import { SignUpFormModel } from './Contents/SignUpForm/SignUpFormModel';
import { LandingPageTopBarView } from './Contents/LandingPageTopBar/LandingPageTopBarView';
import { LandingPageTopBarModel } from './Contents/LandingPageTopBar/LandingPageTopBarModel';

let serverComposer: ServerComposer;

export function init(app: Express) {
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

    let onlineServerDetect = (req: Request) => {
        if (/^\/signup/.test(req.url) ||
            /^\/login/.test(req.url) ||
            /^\/reset-password/.test(req.url) ||
            /^\/forgot-password/.test(req.url)) {

            return false
        }
        if (req.cookies.hasAccessToken) {
            return true;
        }
        return false;
    }
    let OfflineWeb: PlatformDetect = {
        name: 'OfflineWeb',
        serverDetect: (req: Request) => true,
        clientDetect: () => true,
    }
    let OnlineWeb: PlatformDetect = {
        name: 'OnlineWeb',
        serverDetect: onlineServerDetect,
        clientDetect: () => {
            let URL = window.location.pathname;
            if (/^\/signup/.test(URL) ||
                /^\/login/.test(URL) ||
                /^\/reset-password/.test(URL) ||
                /^\/forgot-password/.test(URL)) {

                return false;
            }
            if (/hasAccessToken/.test(document.cookie)) {
                return true;
            }
            return false;
        },
    }

    serverComposer.setPages({
        '/': page => {
            page.onPlatform(OnlineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebApp, {
                    Header: {
                        model: AppTopBarModel,
                        view: AppTopBarView,
                    },
                })
                .onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: HeroModel,
                        view: HeroView,
                    },
                })
                .end()
        },

        '/@:username': page => {
            page.onPlatform(OnlineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebApp, {
                    Header: {
                        model: AppTopBarModel,
                        view: AppTopBarView,
                    },
                })
                .end()
        },

        '/forgot-password': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: ForgotPasswordFormModel,
                        view: ForgotPasswordFormView,
                    },
                })
                .end();
        },

        '/login': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: LogInFormModel,
                        view: LogInFormView,
                    },
                })
                .end();
        },


        '/reset-password': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: ResetPasswordFormModel,
                        view: ResetPasswordFormView,
                    },
                })
                .end();
        },

        '/signup': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: SignUpFormModel,
                        view: SignUpFormView,
                    },
                })
                .end();
        },

        '/email-verification': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        model: LandingPageTopBarModel,
                        view: LandingPageTopBarView,
                    },
                    Body: {
                        model: EmailVerificationModel,
                        view: EmailVerificationView,
                    },
                })
                .end();
        },
    });

    return serverComposer;
}
