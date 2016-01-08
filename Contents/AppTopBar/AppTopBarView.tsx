
import { React, ContentComponent, DOMElement, PageInfo } from '../../Library/Index';

interface Props {
    isVerified: boolean;
}

interface Elements {
    signupButton: DOMElement;
}

interface L10ns {
}

export class AppTopBarView extends ContentComponent<Props, L10ns, Elements> {
    public render() {
        return (
            <div class='BgWhite1'>
            </div>
        );
    }

    public setLocalizations(l: GetLocalization) {
        this.l10ns = {
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
