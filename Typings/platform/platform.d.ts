
declare var inServer: boolean;
declare var inClient: boolean;
declare var cf: any;

declare type GetLocalization = (key: string, data?: any) => string;

interface Router {
    getQueryParam(name: string): string;
    navigateTo(route: string, state?: any): void;
}

declare module App {
    export let router: Router;
}

/**
 * Mark page as loaded. The test harness will directly proceed the test after this mark.
 */
declare function markPageAsLoaded(): void;

/**
 * Unmark page as loaded. Useful during testing when the application requires a waiting time.
 */
declare function unmarkPageAsLoaded(): void;