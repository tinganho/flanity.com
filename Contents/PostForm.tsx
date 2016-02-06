
'use strict';

import { React, ContentComponent, DOMElement, PageInfo, charToHTMLEntity } from '../Library/Index';
import { TextFormatInput } from './TextFormatInput';

interface Props {
}

interface Elements {
    textInput: DOMElement;
    chooseTopic: DOMElement;
    uploadImage: DOMElement;
}

interface Text {
    chooseTopicButtonText: string;
    uploadImageButtonText: string;
    image: string;
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
                    <div id='PostFormBottom'>
                        <ul id='PostFormActions'>
                            <li ref='chooseTopic' class='PostFormAction'>
                                <a class='HeaderBlack4'>{this.text.chooseTopicButtonText}</a>
                            </li>
                            <li ref='chooseTopic' class='PostFormAction'>
                                <a ref='uploadImage' class='HeaderBlack4'>{this.text.uploadImageButtonText}</a>
                            </li>
                        </ul>
                    </div>
                </form>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        let user = this.data;
        console.log(user);
        this.text = {
            chooseTopicButtonText: l('POST_FORM->CHOOSE_TOPIC_BUTTON_TEXT'),
            uploadImageButtonText: l('POST_FORM->UPLOAD_IMAGE_BUTTON_TEXT'),
            image: user.get('image') ? user.get('image').tiny.url : '/Public/Images/ProfileImagePlaceholder.png',
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}