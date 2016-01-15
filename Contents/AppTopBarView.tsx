
import { React, ContentComponent, DOMElement, PageInfo } from '../Library/Index';
import { ProfileButton } from './ProfileButtonView';
import { Search } from './SearchView';

interface Props {
}

interface Elements {
}

interface Text {
    home: string;
    notifications: string;
}

export class AppTopBarView extends ContentComponent<Props, Text, Elements> {
    public render() {
        return (
            <div class='BgWhite1'>
                <div id='AppTopBarLogoContainer'>
                    <i id='AppTopBarLogo'/>
                </div>
                <div id='AppTopBarCenterContainer'>
                    <Search/>
                    <ul id='AppTopBarMenu'>
                        <li class='AppTopBarMenuItem'>
                            <a class='AppTopBarMenuItemAnchor'>
                                <span class='AppTopBarMenuItemText Bold1'>{this.text.home}</span>
                            </a>
                        </li>
                        <li class='AppTopBarMenuItem'>
                            <a class='AppTopBarMenuItemAnchor'>
                                <span class='AppTopBarMenuItemText Bold1'>{this.text.notifications}</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <ProfileButton data={this.data}/>
            </div>
        );
    }

    public setText(l: GetLocalization) {
        this.text = {
            home: l('APP_TOP_BAR->HOME'),
            notifications: l('APP_TOP_BAR->NOTIFCATIONS'),
        }
    }

    public bindDOM() {
        super.bindDOM();
    }
}
