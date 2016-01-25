
import { React, ContentComponent, DOMElement, PageInfo, Model } from '../Library/Index';

interface Props {
}

interface Elements {
    anchor: DOMElement;
}

interface Text {
    name: string;
    image: string;
}

export class ProfileButton extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div class='BgWhite1'>
                <a ref='anchor' id='ProfileButtonAnchor'>
                    <div id='ProfileButtonContainer'>
                        <img id='ProfileButtonImage' bindText='src:image'/>
                        <span id='ProfileButtonName' bindText='name' class='Thin1'></span>
                    </div>
                </a>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let user = this.data;
        this.text = {
            image: user.get('image') ? user.get('image').tiny.url : '/Public/Images/ProfileImagePlaceholder.png',
            name: user.get('name'),
        }
    }

    public bindDOM() {
        super.bindDOM();
        let user = this.data;

        this.elements.anchor.onClick(() => {
            App.router.navigateTo('/@' + user.get('username'));
        });
    }
}
