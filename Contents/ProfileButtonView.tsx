
import { React, ContentComponent, DOMElement, PageInfo, Model } from '../Library/Index';

interface Props {
}

interface Elements {
    signupButton: DOMElement;
}

interface Text {
    name: string;
    image: string;
}

export class ProfileButton extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div class='BgWhite1'>
                <a id='ProfileButtonAnchor'>
                    <div id='ProfileButtonContainer'>
                        <img id='ProfileButtonImage' src={this.text.image}/>
                        <span id='ProfileButtonName' bindText='name' class='Thin1'></span>
                    </div>
                </a>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let data = this.props.data;
        this.text = {
            image: data.get('image') ? data.get('image').tiny.url : '/Public/Images/ProfileImagePlaceholder.png',
            name: data.get('name'),
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
