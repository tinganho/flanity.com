
/// <reference path='./layerComponents.d.ts' />
/// <reference path='./component.d.ts' />

declare interface PageLayerDeclaration {
    importPath: string;
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => Component<P, S, E>;
}

declare interface DocumentDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerDocument<P, S, E>;
}

declare interface LayoutDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerLayout<P, S, E>;
}

declare interface ContentDeclaration extends PageLayerDeclaration {
    component: new<P extends Props, S, E extends Elements>(props?: P, children?: Child[]) => ComposerContent<P, S, E>;
}

declare interface StoredContentDeclarations {
    [index: string]: ContentDeclaration;
}

declare interface ProvidedContentDeclarations {
    [index: string]: ContentDeclaration | (new<P extends Props, S, E extends Elements>(props?:P, children?: Child[]) => ComposerContent<P, S, E>);
}