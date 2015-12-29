
import { React, ContentComponent, DOMElement } from '../../Library/Index';

interface Props {
    changeLangURL: string;
    changeLangText: string;
}

interface HeroElements {
    signupButton: DOMElement;
}

interface L10ns {
    heroDescription: string;
    signUpButtonText: string;
}

export class HeroView extends ContentComponent<Props, L10ns, HeroElements> {
    public render() {
        return (
            <div>
                <div id='HeroLogoContainer'>
                    <img id='HeroLogo' src='/Public/Images/WhiteLogo.png'></img>
                    <p id='HeroDescription' class='HeaderWhite1'>{this.l10ns.heroDescription}</p>
                    <a ref='signupButton' id='HeroSignupButton' class='PurpleButton1Wide'>{this.l10ns.signUpButtonText}</a>
                </div>
                <div id="HeroImageContainer">
                    <img id='HeroImage' src='/Public/Images/HeroImage.jpg'></img>
                </div>
            </div>
        );
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
            heroDescription: l('HERO->DESCRIPTION'),
            signUpButtonText: l('HERO->SIGN_UP_BUTTON_TEXT'),
        }
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
    }

    public bindInteractions() {
        this.elements.signupButton.addEventListener('click', this.navigateToSignUpPage);
    }

    public navigateToSignUpPage() {
        App.router.navigateTo('/signup');
    }
}