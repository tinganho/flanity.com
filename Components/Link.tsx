
import { ContentComponent, React } from '../Library/Index';

declare let __Router: any;

interface LinkProps {
    to: string;
    class: string;
}

export class Link extends ContentComponent<LinkProps, any, any> {
    public navigateTo(event: Event) {
        event.preventDefault();

        __Router.navigateTo(this.props.to);
    }

    public bindDOM() {
        super.bindDOM();
        this.root.onClick(this.navigateTo.bind(this));
    }

    public render() {
        return (
            <a class={this.props.class}>{this.children}</a>
        );
    }
}
