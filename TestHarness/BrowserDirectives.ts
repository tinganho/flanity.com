
import { WebDriverTest } from './WebDriverTest';
import {
    Pages,
    PlatformDetect,
    ContentDeclaration,
    LayoutDeclaration,
    DocumentDeclaration,
    DocumentProps } from '../Core/ServerComposer';

export interface BrowserDirectives {
    componentFolderPath: string;
    initialRoute: string;
    useBrowserActions?: (webdriver: WebDriverTest) => WebDriverTest;
    pages: Pages;
    useDefaultDocument: () => DocumentDeclaration;
    useDefaultLayout: () => LayoutDeclaration;
    useDefaultContent: (content: string) => ContentDeclaration;
    defaultConfigs: DocumentProps;
    defaultPlatform: PlatformDetect;
}
