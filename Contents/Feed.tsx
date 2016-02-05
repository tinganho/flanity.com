
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';
import { PostForm } from './PostForm';

export namespace Feed {
    interface Props {
    }

    interface Elements {
    }

    interface Text {
        title: string;
    }

    export class Component extends ContentComponent<Props, Text, Elements> {
        public render() {
            return (
                <div id='Feed'>
                    <h1 id='FeedTitle' class='HeaderBlack1 HomeContentTitle'>{this.text.title}</h1>
                    <PostForm id='PostForm' data={this.data.get('user')} l={this.props.l}/>
                </div>
            );
        }

        public setText(l: GetLocalization) {
            this.text = {
                title: l('FEED->TITLE'),
            }
        }

        public bindDOM() {
            super.bindDOM();
        }
    }
}