
import { React, LayoutComponent, ContentComponent, DOMElement } from '../Library/Index';

interface Regions {
    Header: new(props: any, children: any) => ContentComponent<any, any, any>;
    Body: new(props: any, children: any) => ContentComponent<any, any, any>;
    Stack: new(props: any, children: any) => ContentComponent<any, any, any>;
    Overlay: new(props: any, children: any) => ContentComponent<any, any, any>;
}

interface LayoutElements {
    canvasWave: DOMElement;
}

export class WebApp extends LayoutComponent<Regions, {}, LayoutElements> {
    public render() {
        return (
            <div class={'FillParentLayout BgWhiteBlue' + (inServer ? ' Final' : ' Ingoing')}>
                <header id='Header'>
                    {this.props.Header}
                </header>
                <section id='Body'>
                    {this.props.Body}
                </section>
            </div>
        );
    }

    public bindDOM() {
        super.bindDOM();
    }

    public onRemove(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.root.addClass('Outgoing').removeClass('Final')
                .onTransitionEnd(() => {
                    resolve();
                    super.onRemove();
                });
        });
    }
}
