
import * as React from '../../components/element';
import { ComposerContent } from '../../components/layerComponents';
import express = require('express');

interface Props {
    l10ns: any;
    changeLangURL: string;
    changeLangText: string;
}

interface FooterElements extends Elements {
    signupButton: IDOMElement;
}

export class TopBar extends ComposerContent<Props, {}, FooterElements> {
    public static fetch(routeOrRequest: string | express.Request): Promise<Props> {
        let l: any;
        if (typeof routeOrRequest !== 'string') {
            l = routeOrRequest.localizations;
        }
        else {
            l = (window as any).localizations;
        }
        return Promise.resolve({
            l10ns: {
                login: l('DEFAULT->LOGIN'),
            }
        });
    }

    public render() {
        return (
            <div>
                <div id='TopBarLogoContainer'>
                    <i id='TopBarLogo'></i>
                </div>
                <div id='TopBarLoginButtonContainer'>
                    <a ref='login' id='TopBarLoginButton'>{this.props.l10ns.login}</a>
                </div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
    }
}
