
import { React, ContentComponent, DOMElement, autobind } from '../Library/Index';
import { ProfileButton } from './ProfileButtonView';

interface Props {
    isVerified: boolean;
}

interface Elements {
    input: DOMElement;
}

interface Text {
    inputTextPlaceholder: string;
}

export class Search extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div>
                <div id='SearchInputContainer'>
                    <input ref='input' id='SearchInput' type='text' placeholder={this.text.inputTextPlaceholder}/>
                </div>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
            inputTextPlaceholder: l('SEARCH->INPUT_TEXT_PLACEHOLDER'),
        }
    }

    public bindDOM() {
        super.bindDOM();
        this.elements.input.addEventListener('keyup', this.search);
    }

    @autobind
    private search() {
        let inputElement = this.elements.input;
        let query = this.elements.input.getValue();
        if (query.length > 0) {
            inputElement.addClass('HasText');
        }
        else {
            inputElement.removeClass('HasText');
        }
    }
}
