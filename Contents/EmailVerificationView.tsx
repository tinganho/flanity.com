
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';

interface Props {
    isVerified: boolean;
}

interface Elements {
    signupButton: DOMElement;
}

interface Text {
    successTitle: string;
    errorTitle: string;
    successDescription: string;
    errorDescription: string;
}

export class EmailVerificationView extends ContentComponent<Props, Text, Elements> {

    public static setPageInfo(props: Props, l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('EMAIL_VERIFICATION->PAGE_TITLE'), pageInfo);
        this.setPageDescription(l('EMAIL_VERIFICATION->PAGE_DESCRIPTION'), pageInfo);
    }

    public render() {
        let title = this.props.isVerified ? this.text.successTitle : this.text.errorTitle;
        let description = this.props.isVerified ? this.text.successDescription : this.text.errorDescription;
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

    public setText(l: GetLocalization) {
        this.text = {
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
