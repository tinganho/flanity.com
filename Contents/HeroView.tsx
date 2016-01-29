
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';

interface Props {
}

interface HeroElements {
    signupButton: DOMElement;
}

interface Text {
    heroDescription: string;
    signUpButtonText: string;
}

export class HeroView extends ContentComponent<Props, Text, HeroElements> {

    public static setPageInfo(l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('DEFAULT->APP_TITLE'), pageInfo);
        this.setPageDescription(l('HERO->DESCRIPTION'), pageInfo);
        this.setPageImage('/Public/Images/HeroImage.jpg', pageInfo);
    }

    public render() {
        return (
            <div>
                <div id='HeroLogoContainer'>
                    <img id='HeroLogo' src='/Public/Images/WhiteLogo.png'></img>
                    <p id='HeroDescription' class='HeaderWhite1'>{this.text.heroDescription}</p>
                    <a ref='signupButton' id='HeroSignupButton' class='PurpleButton1Wide'>{this.text.signUpButtonText}</a>
                </div>
                <div id="HeroImageContainer">
                    <img id='HeroImage' src='/Public/Images/HeroImage.jpg' bindText='heroDescription'></img>
                </div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
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
