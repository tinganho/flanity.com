
import { ContentComponent, DOMElement, React, autobind } from '../Library/Index';
import { SubmitButton } from './SubmitButton';

interface Props {
    title: string;
    description: string;
}

interface Text {
    cancelButtonText: string;
    confirmButtonText: string;
}

interface Elements {
    cancelButton: DOMElement;
}

interface Components {
    submitButton: SubmitButton;

    [component: string]: Component<any, any, any>;
}

let dialog: ConfirmDialog;
export class ConfirmDialog extends ContentComponent<Props, Text, Elements> {
    public static confirm(title: string, description: string, onConfirm: (dialog: ConfirmDialog) => Promise<any>): ConfirmDialog {
        if (dialog) {
            throw new TypeError('A dialog window is already open.');
        }
        dialog = new ConfirmDialog({ title, description })
        dialog.onConfirm(onConfirm);
        return dialog;
    }

    public components: Components;

    private overlay: DOMElement;
    private confirmCallback: (dialog: this) => Promise<any>;
    private removeOverlay: boolean;
    private overlayElements: DOMElement[];
    public isRequesting = false;

    public render() {
        return (
            <div class='Dialog BgWhite1 Hidden'>
                <div class='DialogTitleContainer'>
                    <h1 class='DialogTitle'>{this.props.title}</h1>
                </div>
                <hr class='Horizontal'/>
                <div class='DialogDescriptionContainer'>
                    <p class='DialogText'>{this.props.description}</p>
                </div>
                <div class='DialogActionContainer'>
                    <button class='DialogCancelButton TextButton' ref='cancelButton'>{this.text.cancelButtonText}</button>
                    <SubmitButton class='DialogSubmitButton' ref='submitButton' buttonText={this.text.confirmButtonText}/>
                </div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.components.submitButton.root.addEventListener('click', this.confirm);
        this.elements.cancelButton.addEventListener('click', this.cancel);
    }

    public setText(l: GetLocalization) {
        this.text = {
            cancelButtonText: l('DEFAULT->CANCEL_BUTTON_TEXT'),
            confirmButtonText: l('DEFAULT->CONFIRM_BUTTON_TEXT'),
        }
    }

    public onConfirm(callback: (dialog: ConfirmDialog) => Promise<any>): this {
        this.confirmCallback = callback;
        return this;
    }

    public end() {
        this.overlay = ContentComponent.getElement('Overlay');
        this.overlayElements = this.overlay.getChildren();
        for (let c of this.overlayElements) {
            c.addClass('Hidden');
        }
        this.appendTo('Overlay');
        setTimeout(() => {
            this.root.addClass('Revealed').removeClass('Hidden');
        }, 0);
        if (this.overlay.hasClass('Hidden')) {
            this.overlay.show().addClass('Revealed').removeClass('Hidden');
            this.removeOverlay = true;
        }
    }

    @autobind
    private confirm() {
        this.isRequesting = true;
        this.components.submitButton.startLoading();
        this.confirmCallback(this);
    }

    @autobind
    public stopLoading() {
        this.components.submitButton.stopLoading();
    }

    @autobind
    public remove(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.root.addClass('Hidden').removeClass('Revealed')
                .onTransitionEnd(() => {
                    super.remove();
                    dialog = undefined;
                    resolve();
                });
        });
    }

    @autobind
    private cancel(event: Event) {
        event.preventDefault();

        if (this.isRequesting) {
            return;
        }

        this.root.addClass('Hidden').removeClass('Revealed')
            .onTransitionEnd(() => {
                for (let e of this.overlayElements) {
                    e.removeClass('Hidden');
                }
                super.remove();
                dialog = undefined;
            });
    }
}
