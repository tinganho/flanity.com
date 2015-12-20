
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

export class Hero extends ComposerContent<Props, {}, FooterElements> {
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
                heroDescription: l('HERO->DESCRIPTION'),
                signupButton: l('HERO->SIGNUP_BUTTON'),
            }
        });
    }

    public render() {
        return (
            <div>
                <div id='HeroLogoContainer'>
                    <img id='HeroLogo' src='/public/images/white-logo.png'></img>
                    <p id='HeroDescription' class='HeaderWhite1'>{this.props.l10ns.heroDescription}</p>
                    <a ref='signupButton' id='HeroSignupButton' class='PurpleButton1Wide'>{this.props.l10ns.signupButton}</a>
                </div>
                <div id="HeroImageContainer">
                    <img id='HeroImage' src='/public/images/hero-image.jpg'></img>
                </div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
    }
}