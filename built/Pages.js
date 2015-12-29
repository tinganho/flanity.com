"use strict";
var Document_1 = require('./Documents/Document');
var HeroView_1 = require('./Contents/Hero/HeroView');
var HeroModel_1 = require('./Contents/Hero/HeroModel');
var TopBarView_1 = require('./Contents/TopBar/TopBarView');
var TopBarModel_1 = require('./Contents/TopBar/TopBarModel');
var SignUpFormView_1 = require('./Contents/SignUpForm/SignUpFormView');
var SignUpFormModel_1 = require('./Contents/SignUpForm/SignUpFormModel');
var LogInFormModel_1 = require('./Contents/LogInForm/LogInFormModel');
var LogInFormView_1 = require('./Contents/LogInForm/LogInFormView');
var ForgotPasswordFormModel_1 = require('./Contents/ForgotPasswordForm/ForgotPasswordFormModel');
var ForgotPasswordFormView_1 = require('./Contents/ForgotPasswordForm/ForgotPasswordFormView');
var ResetPasswordFormModel_1 = require('./Contents/ResetPasswordForm/ResetPasswordFormModel');
var ResetPasswordFormView_1 = require('./Contents/ResetPasswordForm/ResetPasswordFormView');
var ServerComposer_1 = require('./Core/ServerComposer');
var Body_withHeader_1 = require('./Layouts/Body_withHeader');
var serverComposer;
function init(app) {
    serverComposer = new ServerComposer_1.ServerComposer({
        app: app,
        rootPath: __dirname,
        routerOutput: 'Public/Scripts/Router.js',
        bindingsOutput: 'Public/Scripts/Bindings.js',
        moduleKind: 2,
        defaultDocumentFolder: 'Documents',
        defaultLayoutFolder: 'Layouts',
        defaultContentFolder: 'Contents',
    });
    var webPlatform = {
        name: 'web',
        detect: function () { return true; },
    };
    serverComposer.setPages({
        '/': function (page) {
            page.onPlatform(webPlatform)
                .hasDocument(Document_1.Document, {})
                .hasLayout(Body_withHeader_1.Body_withHeader, {
                Header: {
                    model: TopBarModel_1.TopBarModel,
                    view: TopBarView_1.TopBarView,
                },
                Body: {
                    model: HeroModel_1.HeroModel,
                    view: HeroView_1.HeroView,
                },
            })
                .end();
        },
        '/forgot-password': function (page) {
            page.onPlatform(webPlatform)
                .hasDocument(Document_1.Document, {})
                .hasLayout(Body_withHeader_1.Body_withHeader, {
                Header: {
                    model: TopBarModel_1.TopBarModel,
                    view: TopBarView_1.TopBarView,
                },
                Body: {
                    model: ForgotPasswordFormModel_1.ForgotPasswordFormModel,
                    view: ForgotPasswordFormView_1.ForgotPasswordFormView,
                },
            })
                .end();
        },
        '/login': function (page) {
            page.onPlatform(webPlatform)
                .hasDocument(Document_1.Document, {})
                .hasLayout(Body_withHeader_1.Body_withHeader, {
                Header: {
                    model: TopBarModel_1.TopBarModel,
                    view: TopBarView_1.TopBarView,
                },
                Body: {
                    model: LogInFormModel_1.LogInFormModel,
                    view: LogInFormView_1.LogInFormView,
                },
            })
                .end();
        },
        '/reset-password': function (page) {
            page.onPlatform(webPlatform)
                .hasDocument(Document_1.Document, {})
                .hasLayout(Body_withHeader_1.Body_withHeader, {
                Header: {
                    model: TopBarModel_1.TopBarModel,
                    view: TopBarView_1.TopBarView,
                },
                Body: {
                    model: ResetPasswordFormModel_1.ResetPasswordFormModel,
                    view: ResetPasswordFormView_1.ResetPasswordFormView,
                },
            })
                .end();
        },
        '/signup': function (page) {
            page.onPlatform(webPlatform)
                .hasDocument(Document_1.Document, {})
                .hasLayout(Body_withHeader_1.Body_withHeader, {
                Header: {
                    model: TopBarModel_1.TopBarModel,
                    view: TopBarView_1.TopBarView,
                },
                Body: {
                    model: SignUpFormModel_1.SignUpFormModel,
                    view: SignUpFormView_1.SignUpFormView,
                },
            })
                .end();
        },
    });
    return serverComposer;
}
exports.init = init;
//# sourceMappingURL=Pages.js.map