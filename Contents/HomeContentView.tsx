
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';
import { Feed } from './Feed';

interface Props {
}

interface Elements {
}

interface Text {
}

export class HomeContentView extends ContentComponent<Props, Text, Elements> {

    public static setPageInfo(l: GetLocalization, pageInfo: PageInfo) {
        this.setPageTitle(l('HOME_CONTENT->PAGE_TITLE'), pageInfo);
    }

    public render() {
        return (
            <div>
                <Feed.Component id='Feed' data={this.data} l={this.props.l}/>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
