
import { ContentComponent, React, DOMElement, autobind } from '../Library/Index';

interface Props {
    contentListClass: string;
}

interface Text {
}

interface Elements {
    cursor: DOMElement;
}

export class HorizontalScrollBar extends ContentComponent<Props, any, Elements> {
    private container: DOMElement;

    private containerWidth: number;
    private contentWidth: number;
    private cursorWidth: number;
    private cursorPosition = 0;
    private contentPosition = 0;
    private firstContentElement: DOMElement;

    public render() {
        return (
            <div class='HorizontalScrollBar'>
                <div ref='cursor' class='HorizontalScrollBarCursor'/>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();

        this.container = this.root.getParentElement();
        this.setScrollBarCursorDimensions();

        window.addEventListener('resize',() => {
            this.setScrollBarCursorDimensions();

        });
    }

    @autobind
    private scroll(event: MouseWheelEvent) {
        event.stopPropagation();
        event.preventDefault();

        // Positive x direction is right direction. The native wheelDeltaX
        // is inverted, thus we need to correct it.
        let deltaX = -event.wheelDeltaX;

        this.contentPosition += deltaX;
        if (this.contentPosition < 0) {
            this.contentPosition = 0;
        }
        if (this.contentPosition > this.contentWidth - this.containerWidth) {
            this.contentPosition = this.contentWidth - this.containerWidth;
        }
        let contentPercentagePosition =  this.contentPosition / this.contentWidth
        this.cursorPosition = contentPercentagePosition * this.containerWidth;

        this.firstContentElement.addStyle('margin-left', -this.contentPosition + 'px');
        this.elements.cursor.addStyle('margin-left', this.cursorPosition + 'px');
    }

    @autobind
    private setScrollBarCursorDimensions(): void {
        let content = this.container.getFirstChildElement();

        this.containerWidth = this.container.getWidth();
        let contentListElements = this.container.findAll('.' + this.props.contentListClass);
        if (contentListElements.length === 0) {
            this.root.hide();
            return;
        }
        this.contentWidth = 0;
        this.firstContentElement = contentListElements[0];
        let marginRight = contentListElements[0].getStyleInPixels('marginRight');
        for (let e of contentListElements) {
            this.contentWidth += e.getWidth() + marginRight;
        }
        this.contentWidth -= marginRight;

        if (this.contentWidth <= this.containerWidth) {
            this.root.hide();
            return;
        }
        this.root.show();

        this.container.removeEventListener('wheel', this.scroll);
        this.container.addEventListener('wheel', this.scroll);

        let cursor = this.elements.cursor;

        let containerWidthPercentageOfContent = this.containerWidth / this.contentWidth;
        this.cursorWidth = containerWidthPercentageOfContent * this.containerWidth;

        cursor.setWidth(this.cursorWidth);
    }
}
