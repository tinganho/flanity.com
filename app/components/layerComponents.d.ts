
/// <reference path='../../typings/es6-promise/es6-promise.d.ts' />
/// <reference path='./component.d.ts' />

declare interface JsonScriptAttributes {
    id: string;
    data: any;
}

declare interface PageInfo {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    URL?: string;
    lang?: string;
    language?: string;
}

declare interface DocumentProps extends Props {
    confs?: string[];
    title?: string;
    styles?: string[];
    jsonScriptData?: JsonScriptAttributes[];
    layout?: any;
    pageInfo?: PageInfo;
}

declare abstract class ComposerComponent<P extends Props, S, E extends Elements> extends Component<P, S, E> {

    /**
     * This static property is a native readonly JS property and it is automatically set to the
     * constructor's name.
     */
    public static name: string;
    public id: string;
    public remove(): Promise<void>;
}

declare abstract class ComposerDocument<P extends DocumentProps, S, E extends Elements> extends ComposerComponent<P, S, E> {}
declare abstract class ComposerLayout<P extends Props, S, E extends Elements> extends ComposerComponent<P, S, E> {}
declare abstract class ComposerContent<P extends Props, S, E extends Elements> extends ComposerComponent<P, S, E> {
    public static fetch<TRequest, TResult>(request: TRequest): Promise<TResult>;
    public isCompanion: boolean;
    public isMain: boolean;
    public scrollWindowTo(top: number): void;
}

declare interface ComposerComponents {
    [name: string]: ComposerComponent<any, any, any>;
}

declare interface Contents {
    [index: string]: JSX.Element;
}

declare interface PageComponents {
    Document: ComposerComponents;
    Layout: ComposerComponents;
    Content: ComposerComponents;
}