
import { React, ContentComponent, DOMElement, PageInfo } from '../../Library/Index';

interface Props {
    isVerified: boolean;
}

interface HeroElements {
    signupButton: DOMElement;
}

interface L10ns {
    successTitle: string;
    errorTitle: string;
    successDescription: string;
    errorDescription: string;
}

export class EmailVerificationView extends ContentComponent<Props, L10ns, HeroElements> {

    public static setPageInfo(props: Props, l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('EMAIL_VERIFICATION->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('EMAIL_VERIFICATION->PAGE_DESCRIPTION'), pageInfo);
    }

    public render() {
        let title = this.props.isVerified ? this.l10ns.successTitle : this.l10ns.errorTitle;
        let description = this.props.isVerified ? this.l10ns.successDescription : this.l10ns.errorDescription;
        return (
            <div>
                <div id='EmailVerificationDialog' class='BgWhite2'>
                    <div>
                        <h1 class='DialogTitle'>{title}</h1>
                    </div>
                    <hr class='Horizontal'/>
                    <p class='DialogText' html={description}></p>
                </div>
            </div>
        );
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
            successTitle: l('EMAIL_VERIFICATION->SUCCESS_TITLE'),
            errorTitle: l('EMAIL_VERIFICATION->ERROR_TITLE'),
            successDescription: l('EMAIL_VERIFICATION->SUCCESS_DESCRIPTION'),
            errorDescription: l('EMAIL_VERIFICATION->ERROR_DESCRIPTION'),
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
