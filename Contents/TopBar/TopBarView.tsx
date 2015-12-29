
import { DOMElement, ContentComponent, React } from '../../Library/Index';

interface Props {
    changeLangURL: string;
    changeLangText: string;
}

interface FooterElements extends Elements {
    loginButton: DOMElement;
    logoAnchor: DOMElement;
}

interface L10ns {
    login: string;
}

export class TopBarView extends ContentComponent<Props, L10ns, FooterElements> {
    public render() {
        return (
            <div>
                <a ref='logoAnchor' href='/'>
                    <div id='TopBarLogoContainer'>
                        <i id='TopBarLogo'></i>
                    </div>
                </a>
                <div id='TopBarLoginButtonContainer'>
                    <a ref='loginButton' id='TopBarLoginButton'>{this.l10ns.login}</a>
                </div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
    }

    public bindInteractions() {
        this.elements.loginButton.addEventListener('click', this.navigateToLoginPage);
        this.elements.logoAnchor.addEventListener('click', this.navigateToHomePage);
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
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
