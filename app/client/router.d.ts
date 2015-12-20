
interface Page {
    route: string;
    document: ComponentInfo;
    layout: ComponentInfo;
    contents: ContentComponentInfo[];
}

interface ComponentInfo {
    className: string;
    importPath: string;
}

interface ContentComponentInfo extends ComponentInfo {
    region: string;
}

declare module ComposerRouter {
    export function init(table: Page[]): void;
    export function navigateTo(route: string): void;
}