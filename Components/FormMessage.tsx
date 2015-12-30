
import { ContentComponent, DOMElement, React } from '../Library/Index';

interface FormMessageElements extends Elements {
    container: DOMElement;
    message: DOMElement;
}

export class FormMessage extends ContentComponent<{}, {}, FormMessageElements> {
    public render() {
        return (
            <div ref='container' class='FormMessageContainer Hidden'>
                <span ref='message' class='FormMessage'></span>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
        console.log('woifjfjieijew')
    }

    public showErrorMessage(message: string) {
        this.elements.container
            .addClass('Revealed')
            .addClass('Error')
            .removeClass('Hidden')
            .removeClass('Success');
        this.elements.message.setHtml(message);
    }

    public showSuccessMessage(message: string) {
        this.elements.container
            .addClass('Revealed')
            .addClass('Success')
            .removeClass('Hidden')
            .removeClass('Error');
        this.elements.message.setHtml(message);
    }

    public hideMessage() {
        this.elements.container.addClass('Hidden').removeClass('Revealed');
    }
}
