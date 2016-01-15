
import { ContentComponent, DOMElement, React } from '../Library/Index';

interface Props {
}

interface Text {
}

interface Elements {
}

export class FormMessage extends ContentComponent<{}, {}, Elements> {
    public render() {
        return (
            <div ref='container' class='FormMessageContainer Hidden'>
                <span ref='message' class='FormMessage'></span>
            </div>
        );
    }
}
