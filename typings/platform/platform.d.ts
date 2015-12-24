
declare var inServer: boolean;
declare var inClient: boolean;
declare var cf: any;

interface Router {
    getQueryParam(name: string): string;
}

declare module App {
    export let router: Router;
}
