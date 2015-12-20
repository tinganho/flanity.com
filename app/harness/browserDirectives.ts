
import { WebdriverTest } from './webdriverTest';
import { Pages, PlatformDetect } from '../../app/composer/serverComposer';
import { DocumentDeclaration, LayoutDeclaration, ContentDeclaration } from '../../app/components/layerComponents';

export interface BrowserDirectives {
    componentFolderPath: string;
    initialRoute: string;
    useBrowserActions?: (webdriver: WebdriverTest) => WebdriverTest;
    pages: Pages;
    useDefaultDocument: () => DocumentDeclaration;
    useDefaultLayout: () => LayoutDeclaration;
    useDefaultContent: (content: string) => ContentDeclaration;
    defaultConfigs: DocumentProps;
    defaultPlatform: PlatformDetect;
}