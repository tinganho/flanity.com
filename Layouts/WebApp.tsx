
import { React, LayoutComponent, ContentComponent, DOMElement } from '../Library/Index';

interface Regions {
    Header: new(props: any, children: any) => ContentComponent<any, any, any>;
    Body: new(props: any, children: any) => ContentComponent<any, any, any>;
    Overlay: new(props: any, children: any) => ContentComponent<any, any, any>;
}

interface LayoutElements extends Elements {
    canvasWave: DOMElement;
}

export class WebApp extends LayoutComponent<Regions, {}, LayoutElements> {
    public render() {
        return (
            <div class='FillParentLayout BgWhiteBlue'>
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
}
