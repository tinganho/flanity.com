
/// <reference path='./Library/Component.d.ts'/>

import { Express, Request, Response } from 'express';
import { Document } from './Documents/Document';
import { ServerComposer, PlatformDetect } from './Core/ServerComposer';
import { ModuleKind } from './Core/WebBindingsEmitter';

import { WebLandingPage } from './Layouts/WebLandingPage';
import { WebApp } from './Layouts/WebApp';

import { AppTopBarView } from './Contents/AppTopBarView';
import { EmailVerification } from './Contents/EmailVerification';
import { EmailVerificationView } from './Contents/EmailVerificationView';
import { ForgotPasswordFormView } from './Contents/ForgotPasswordFormView';
import { HeroView } from './Contents/HeroView';
import { HomeContentView } from './Contents/HomeContentView';
import { HomeContent } from './Contents/HomeContent';
import { LandingPageTopBarView } from './Contents/LandingPageTopBarView';
import { LogInFormView } from './Contents/LogInFormView';
import { ResetPasswordFormView } from './Contents/ResetPasswordFormView';
import { SignUpFormView } from './Contents/SignUpFormView';
import { TopicsView } from './Contents/TopicsView';
import { User } from './Contents/User';
import { UserMe } from './Contents/UserMe';

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
                        data: UserMe,
                        relations: ['topics'],
                        view: AppTopBarView,
                        isStatic: true,
                    },
                    Body: [
                        {
                            data: HomeContent,
                            relations: ['posts', 'user'],
                            view: HomeContentView,
                        },
                    ],
                })
                .onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        view: LandingPageTopBarView,
                    },
                    Body: {
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
                        data: UserMe,
                        relations: ['topics'],
                        view: AppTopBarView,
                        isStatic: true,
                    },
                    Body: [
                        {
                            view: HomeContentView,
                        },
                        {
                            data: User,
                            relations: ['topics'],
                            view: TopicsView,
                        }
                    ],
                })
                .end()
        },

        '/forgot-password': page => {
            page.onPlatform(OfflineWeb)
                .hasDocument(Document, {})
                .hasLayout(WebLandingPage, {
                    Header: {
                        view: LandingPageTopBarView,
                        isStatic: true,
                    },
                    Body: {
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
                        view: LandingPageTopBarView,
                        isStatic: true,
                    },
                    Body: {
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
                        view: LandingPageTopBarView,
                        isStatic: true,
                    },
                    Body: {
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
                        view: LandingPageTopBarView,
                        isStatic: true,
                    },
                    Body: {
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
                        view: LandingPageTopBarView,
                        isStatic: true,
                    },
                    Body: {
                        data: EmailVerification,
                        view: EmailVerificationView,
                    },
                })
                .end();
        },
    });

    return serverComposer;
}
