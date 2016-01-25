
import { DOMElement, ContentComponent, React } from '../Library/Index';

interface Props {
    changeLangURL: string;
    changeLangText: string;
}

interface FooterElements {
    logInButton: DOMElement;
    logoAnchor: DOMElement;
}

interface Text {
    login: string;
}

export class LandingPageTopBarView extends ContentComponent<Props, Text, FooterElements> {
    public render() {
        return (
            <div>
                <a ref='logoAnchor' href='/'>
                    <div id='LandingPageTopBarLogoContainer'>
                        <i id='LandingPageTopBarLogo'></i>
                    </div>
                </a>
                <div ref='logInButton' id='LandingPageTopBarLogInButtonContainer'>
                    <a id='LandingPageTopBarLogInButton'>{this.text.login}</a>
                </div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
    }

    public bindInteractions() {
        this.elements.logInButton.addEventListener('click', this.navigateToLoginPage);
        this.elements.logoAnchor.addEventListener('click', this.navigateToHomePage);
    }

    public setText(l: GetLocalization) {
        this.text = {
            login: l('DEFAULT->LOGIN'),
        }
    }

    private navigateToHomePage(event: Event) {
        event.preventDefault();
        App.router.navigateTo('/');
    }

    private navigateToLoginPage(event: Event) {
        event.preventDefault();
        App.router.navigateTo('/login');
    }
}
