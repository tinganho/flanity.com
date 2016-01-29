
declare var inServer: boolean;
declare var inClient: boolean;
declare var cf: any;

declare type GetLocalization = (key: string, data?: any) => string;
declare let localizations: GetLocalization;

interface Router {
    getQueryParam(name: string): string;
    navigateTo(route: string, state?: any): void;
}

declare module App {
    export let userId: string;
    export let router: Router;
}

declare function markLoadFinished(): void;
declare function unmarkLoadFinished(): void;
declare let platformDetects: any;

interface Function {
    name: string;
}
