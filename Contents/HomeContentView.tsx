
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';

interface Props {
}

interface Elements {
}

interface Text {
}

export class HomeContentView extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
