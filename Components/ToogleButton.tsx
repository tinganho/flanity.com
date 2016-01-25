
import { ContentComponent, DOMElement, React, autobind } from '../Library/Index';

interface Props {
    class?: string;
    state?: 'on' | 'off';
    onButtonText?: string;
    offButtonText?: string;
    toggleOffButtonText?: string;

    onToogleOn?: (...args: any[]) => any;
    onToogleOff?: (...args: any[]) => any;
}

interface Text {
}

interface Elements {
    onButton: DOMElement;
    offButton: DOMElement;
    toogleOffButton: DOMElement;
}

export class ToogleButton extends ContentComponent<Props, Text, Elements> {
    private overlay: DOMElement;
    private onToogleOnCallback: ((...args: any[]) => any);
    private onToogleOffCallback: ((...args: any[]) => any);

    public render() {
        return (
            <div class={'ToogleButtonContainer ' + (this.props.state.charAt(0).toUpperCase() + this.props.state.slice(1)) + (this.props.class ? ' ' + this.props.class : '')}>
                <div ref='onButton' class='ToogleOnButton ToogleButton'>{this.props.onButtonText}</div>
                <div ref='toogleOffButton' class='ToogleToogleOffButton ToogleButton'>{this.props.toggleOffButtonText}</div>
                <div ref='offButton' class='ToogleOffButton ToogleButton'>{this.props.offButtonText}</div>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.elements.offButton.addEventListener('click', () => {
            this.root.addClass('On').addClass('NoToogleOffButton').removeClass('Off');
            if (this.props.onToogleOn) {
                this.props.onToogleOn();
            }

            let self = this;
            setTimeout(() => {
                this.elements.onButton.addEventListener('mouseout', function removeNoToogleClass() {
                    self.root.removeClass('NoToogleOffButton');
                    setTimeout(() => {
                        self.elements.onButton.removeEventListener('mouseout', removeNoToogleClass);
                    }, 0);
                });
            }, 0);
        });
        this.elements.toogleOffButton.addEventListener('click', () => {
            this.root.addClass('Off').removeClass('On');
            if (this.props.onToogleOff) {
                this.props.onToogleOff();
            }
        });
    }

    public onToogleOn(callback: (...args: any[]) => any) {
        this.onToogleOnCallback = callback;
    }

    public onToogleOff(callback: (...args: any[]) => any) {
        this.onToogleOffCallback = callback;
    }

    public setOn() {
        this.root.addClass('On').removeClass('Off');
    }

    public setOff() {
        this.root.addClass('Off').removeClass('On');
    }
}
