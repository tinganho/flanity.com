
'use strict';

import { React, ContentComponent, DOMElement, PageInfo, charToHTMLEntity } from '../Library/Index';
import { TextFormatInput } from './TextFormatInput';

interface Props {
}

interface Elements {
    textInput: DOMElement;
}

interface Text {
}

export class PostForm extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div>
                <img id='PostFormProfileImage' bindText='src:image'/>
                <form id='PostFormForm'>
                    <div id='PostFormInputContainer'>
                        <TextFormatInput data={this.data} l={this.props.l}/>
                    </div>
                </form>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let user = this.data;
        this.text = {
            image: user.get('image') ? user.get('image').tiny.url : '/Public/Images/ProfileImagePlaceholder.png',
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}