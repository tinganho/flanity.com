
import * as React from '../../components/element';
import { ComposerContent } from '../../components/layerComponents';
import { DOMElement } from '../../components/DOMElement';
import { ImageCrop } from '../../components/imageCrop';
import express = require('express');

interface Props {
    l10ns: any;
}

interface FormElements extends Elements {
    submitButton: IDOMElement;
    profileImage: IDOMElement;
    profileImageInput: IDOMElement;
    previewImage: IDOMElement;
}

interface FileReadResult extends File {
    result: string;
}

interface FileEventTarget extends EventTarget {
    files: FileReadResult[];
}

interface FileChangeEvent extends Event {
    target: FileEventTarget;
}

interface FileReadEventTarget extends EventTarget {
    result: string;
}

interface FileReadOnloadEvent extends Event {
    target: FileReadEventTarget;
}

export class SignUpForm extends ComposerContent<Props, {}, FormElements> {
    private profileImageHeight: number;
    private profileImageWidth: number;

    public static fetch(routeOrRequest: string | express.Request): Promise<Props> {
        let l: any;
        if (typeof routeOrRequest !== 'string') {
            l = routeOrRequest.localizations;
        }
        else {
            l = (window as any).localizations;
        }
        return Promise.resolve({
            l10ns: {
                namePlaceholder: l('SIGN_UP->NAME_PLACEHOLDER'),
                usernamePlaceholder: l('SIGN_UP->USERNAME_PLACEHOLDER'),
                passwordPlaceholder: l('SIGN_UP->PASSWORD_PLACEHOLDER'),
                emailPlaceholder: l('SIGN_UP->EMAIL_PLACEHOLDER'),
                inviteFriendPlaceholder: l('SIGN_UP->INVITE_FRIEND_PLACEHOLDER'),
                inviteFriendPromptText: l('SIGN_UP->INVITE_FRIEND_PROMPT_TEXT'),
                submitButton: l('SIGN_UP->SUBMIT_BUTTON'),
            }
        });
    }

    public render() {
        return (
            <div>
                <form id='SignUpFormForm' class='BgWhite'>
                    <div id='SignUpFormFirstRow'>
                        <div id='SignUpProfileImage' ref='profileImage'>
                            <input id='SignUpProfileImageInput' ref='profileImageInput' name='profileImage' type='file'/>
                        </div>
                        <div id='SignUpNameAndPasswordContainer'>
                            <input name='name' ref='name' type='text' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.namePlaceholder}/>
                            <input name='username' ref='username' type='text' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.usernamePlaceholder}/>
                        </div>
                    </div>
                    <input name='profileImageBinary' ref='profileImageBinary' type='hidden'/>
                    <input name='email' ref='email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.emailPlaceholder}/>
                    <input name='password' ref='password' type='password' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.passwordPlaceholder}/>
                    <p class='PromptText'>{this.props.l10ns.inviteFriendPromptText}</p>
                    <input name='friend1Email' ref='friend1Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.inviteFriendPlaceholder}/>
                    <input name='friend2Email' ref='friend2Email' type='email' class='TextInput SignUpFormTextInput' placeholder={this.props.l10ns.inviteFriendPlaceholder}/>
                    <input id='SignUpSubmitButton' type='submit' ref='submitButton' class='PurpleButton2' value={this.props.l10ns.submitButton} disabled/>
                </form>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        this.bindInteractions();
        this.elements.submitButton.onClick(this.submit);
        this.elements.submitButton.removeAttribute('disabled');
        this.profileImageHeight = this.elements.profileImage.getHeight();
        this.profileImageWidth = this.elements.profileImage.getWidth();
    }

    public bindInteractions() {
        this.bindProfileImage();
    }

    public bindProfileImage() {
        this.handleFileChange = this.handleFileChange.bind(this);
        this.elements.profileImageInput.addEventListener('change', this.handleFileChange);
    }

    private handleFileChange(event: FileChangeEvent) {
        let files = event.target.files;
        for (let i = 0, f: any; f = files[i]; i++) {
            if (!f.type.match('image.*')) {
                continue;
            }

            let reader = new FileReader();
            reader.onload = (e: FileReadOnloadEvent) => {
                let image = new Image();
                image.src = e.target.result;
                image.onload = () => {
                    let imageCrop = new ImageCrop();
                    imageCrop.setDimensions({
                        cropWidth: 300,
                        cropHeight: 300,
                        paddingVertical: 50,
                        paddingHorizontal: 40,
                    })
                    .setImage(image)
                    .whenDone((imageBlob, imageUrl) => {

                        // Copy and replace input so that we can use the same image.
                        let input = this.elements.profileImageInput;
                        let clone = input.clone();
                        this.elements.profileImageInput = clone;
                        clone.addEventListener('change', this.handleFileChange);
                        clone.appendTo(this.elements.profileImage);
                        input.remove();

                        let image = new Image();
                        image.src = imageUrl;
                        image.width = this.profileImageWidth;
                        image.height = this.profileImageHeight;
                        this.elements.previewImage = new DOMElement(image);
                        this.elements.previewImage.id = 'SignUpProfileImagePreview';
                        this.elements.previewImage.appendTo(this.elements.profileImage);
                    })
                    .end();
                }

            }
            reader.readAsDataURL(f);
        }
    }

    private submit(event: Event) {
        event.preventDefault();
    }
}
