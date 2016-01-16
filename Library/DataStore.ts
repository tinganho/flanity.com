
'use strict';

import { HTTP, HTTPOptions, ModelResponse, CollectionResponse } from './HTTP';
import { isArray, extend, deepEqual, clone, autobind } from './Utils';

type Callback = (...args: any[]) => any;

interface EventCallbackStore {
    [event: string]: Callback[];
}

interface Map { [index: string]: string; }

interface Cookies {
    accessToken: string;
    renewalToken: string;

    [name: string]: string;
}

export interface RequestInfo<P, Q> {
    params: P;
    query: Q;
    cookies?: Cookies,
}

class DataEventEmitter {
    private eventCallbackStore: EventCallbackStore = {}

    public on(event: string, callback: Callback) {
        if (!this.eventCallbackStore[event]) {
            this.eventCallbackStore[event] = [];
        }
        this.eventCallbackStore[event].push(callback);
    }

    public off(event: string, callback: Callback): void {
        for (let p in this.eventCallbackStore[event]) {
            if (this.eventCallbackStore[event][p] === callback) {
                this.eventCallbackStore[event].splice(p, 1);
            }
        }
    }

    public emit(event: string, args: any[]) {
        if (this.eventCallbackStore[event]) {
            for (let callback of this.eventCallbackStore[event]) {
                callback.apply(null, args);
            }
        }
    }
}

export const enum RelationType {
    HasOne,
    HasMany,
}

interface ModelRelation {
    type?: RelationType;
    includeProps?: string[];
    reverseProp: string;
    model: new(props?: ModelData) => Model<any>;
    collection?: new(collectionData?: any) => Collection<any>;
}

export interface ModelRelations {
    [property: string]: ModelRelation;
}

export function URL(URL: string) {
    return function(Ctor: Function) {
        (Ctor as any).URL = URL;
    }
}

export function relations(r: ModelRelations) {
    return function(Ctor: Function) {
        (Ctor as any).relations = r;
    }
}

export function defaultId(id: string) {
    return function(Ctor: Function) {
        (Ctor as any).defaultId = id;
    }
}

export function noParentURL(Ctor: Function) {
    (Ctor as any).noParentURL = true;
}

export abstract class DataStore extends DataEventEmitter {
    public url: string;
    public HTTPSaveOptions: HTTPOptions;
    public HTTPFetchOptions: HTTPOptions;
    public HTTPDeleteOptions: HTTPOptions;

    public setFetchOptions(options: HTTPOptions) {
        this.HTTPFetchOptions = options;
    }

    public onFetch(requestInfo: RequestInfo<any, any>) {

    }

    public onSave(options: HTTPOptions) {

    }
}

export interface Model {
    onFetch(requestInfo: RequestInfo<any, any>): void;
}

export abstract class Model<P> extends DataStore {
    "constructor": {
        noParentURL: boolean;
        relations: ModelRelations;
    }

    public collection: Collection<Model<any>>
    private _isNew = true;
    private _hasChanged: boolean;
    public props = {} as P & { id?: string, [index: string]: any };
    public previousProps = {} as P & { id?: string, [index: string]: any };

    constructor(props?: P) {
        super();
        if (props) {
            this.setProps(props);
        }
    }

    public get hasChanged(): boolean {
        return this._hasChanged;
    }

    public get isNew(): boolean {
        return this._isNew;
    }

    public get(prop: string): any {
        let props = prop.split('.');
        if (props.length === 1) {
            return (this.props as any)[prop];
        }
        else {
            if (props.length > 2) {
                throw new TypeError('Property can not have more than two dots');
            }
            return (this.props as any)[props[0]].get(props[1]);
        }
    }

    private setRelations(prop: string, value: any) {
        let relation = this.constructor.relations[prop];
        (this.props as any)[prop].on('add', (model: any) => {
            this.emit('add:' + prop, model);
        });
        (this.props as any)[prop].on('delete', (model: any) => {
            this.emit('delete:' + prop, model);
        });
        (this.props as any)[prop].on('remove', (model: any) => {
            this.emit('remove:' + prop, model);
        });
        (this.props as any)[prop][relation.reverseProp] = this;
    }

    public set(props: any): this;
    public set(prop: string, value: any): this;
    public set(prop: any, value?: any): this {
        if (typeof prop === 'string') {
            let relations = this.constructor.relations;
            if (prop === 'id') {
                this._isNew = false;
            }
            if (relations && prop in relations) {
                if (relations[prop].type === RelationType.HasOne) {
                    let Model = relations[prop].model;
                    if (value instanceof Model) {
                        this.props[prop] = value;
                    }
                    else {
                        this.props[prop] = new Model(value);
                    }
                    this.setRelations(prop, value);
                }
                else {
                    let Collection = relations[prop].collection;
                    if (value instanceof Model) {
                        this.props[prop] = value;
                    }
                    else {
                        this.props[prop] = new Collection(value);
                    }
                    this.setRelations(prop, value);
                }
            }
            else {
                (this.props as any)[prop] = value;
            }

            if (!this.previousProps[prop] || this.previousProps[prop] !== this.props[prop]) {
                this.emit('change:' + prop, [this, value]);
                this.emit('change', [this, prop, value]);
                this._hasChanged = true;
            }

            if (!this._isNew) {
                this.previousProps = this.props;
            }
        }
        else {
            this.setProps(prop);
        }

        return this;
    }

    private setProps(props: any) {
        let hasChanges = false;
        for (let p in props) {
            if (props.hasOwnProperty(p)) {
                let relations = this.constructor.relations;
                if (relations && p in relations) {
                    let value = props[p];
                    if (relations[p].type === RelationType.HasOne) {
                        let Model = relations[p].model;
                        if (value instanceof Model) {
                            this.props[p] = value;
                        }
                        else {
                            this.props[p] = new Model(value);
                        }
                    }
                    else {
                        let Collection = relations[p].collection;
                        if (value instanceof Collection) {
                            this.props[p] = value;
                        }
                        else {
                            this.props[p] = new Collection(value);
                        }
                    }
                    this.setRelations(p, props[p]);
                }
                else {
                    (this.props as any)[p] = props[p];
                }

                if (!this.previousProps[p] || !deepEqual(this.previousProps[p], props[p])) {
                    this.emit('change:' + p, [this, props[p]]);
                    hasChanges = true;
                    this._hasChanged = true;
                }
            }
        }

        if (hasChanges) {
            this.emit('change', [this]);
        }

        if (props.id) {
            this.previousProps = clone(this.props);
            this._hasChanged = false;
            this._isNew = false;
        }
        else {
            this._isNew = true;
        }

        return this;
    }

    public setSaveOptions(options: HTTPOptions) {
        this.HTTPSaveOptions = options;
    }

    private getModelURL() {
        let URL: string;
        let constructor = this.constructor as any;
        let modelName = constructor.name.toLowerCase();
        if (constructor.URL) {
            URL = constructor.URL.replace(':id', this.props.id || constructor.defaultId);
        }
        else {
            URL = '/' + modelName + 's/' + (this.props.id || constructor.defaultId);
        }
        return URL;
    }

    public add(relation: string, props: any): this {
        let URL = this.getModelURL();

        let collection = this.props[relation] as Collection<Model<any>>;
        collection.add(props);
        return this;
    }

    public fetch(requestInfo?: RequestInfo<any, any>, relations?: string[], parentURL?: string): Promise<any> {
        return new Promise<P>((resolve, reject) => {
            let constructor = this.constructor as any;
            let URL = this.getModelURL();
            if (!constructor.noParentURL && parentURL) {
                URL = parentURL + URL;
            }
            this.onFetch(requestInfo);
            if (inServer && requestInfo.cookies.accessToken) {
                if (!this.HTTPFetchOptions) {
                    this.HTTPFetchOptions = {};
                }
                this.HTTPFetchOptions.accessToken = requestInfo.cookies.accessToken;
            }
            let promises: Promise<any>[] = [];
            let relationData: any[] = [];
            let promise = HTTP.get<ModelResponse<any>>(URL, this.HTTPFetchOptions);
            promises.push(promise);

            if (relations) {
                for (let r of relations) {
                    let props = {};
                    let data: any;
                    let dataType: string;
                    if (constructor.relations[r].type === RelationType.HasOne) {
                        data = new constructor.relations[r].model(props);
                    }
                    else {
                        data = new constructor.relations[r].collection(props);
                    }
                    relationData.push(data);
                    promises.push(data.fetch(requestInfo, null, URL));
                }
            }

            Promise.all(promises).then((results) => {
                let data = results[0].body.model;
                if (relations) {
                    for (let i = 0; i < relations.length; i++) {
                        data[relations[i]] = relationData[i];
                    }
                }
                this.setProps(data);
                resolve();
            })
            .catch(reject);
        });
    }

    public save(): Promise<any>;
    public save(parentURL: string): Promise<any>;
    public save(newProps: Object): Promise<any>;
    public save(newProps: Object, parentURL: string): Promise<any>;
    public save(propsOrURL?: string | Object, parentURL?: string): Promise<any> {

        let newProps: Object;
        if (typeof propsOrURL === 'string') {
            parentURL = propsOrURL;
        }
        else {
            newProps = propsOrURL;
        }

        let promises: Promise<any>[] = [];
        if (this._isNew || newProps) {
            let options = this.HTTPSaveOptions || {};
            if (!options.bodyType) {
                options.bodyType = HTTP.BodyType.MultipartFormData;
            }
            if (!options.body) {
                if (newProps) {
                    options.body = extend(newProps, this.toData());
                }
                else {
                    options.body = this.toData();
                }
            }
            this.onSave(options);
            let constructor = this.constructor as any;
            let modelName = constructor.name.toLowerCase();
            if (this._isNew) {
                let URL: string;
                if (constructor.URL) {
                    URL = constructor.URL;
                }
                else {
                    URL = '/' + modelName + 's';
                }
                if (!constructor.noParentURL && parentURL) {
                    URL = parentURL + URL;
                }

                promises.push(HTTP.post<any>(URL, options)
                    .then((response) => {
                        this.setProps(response.body.model);
                    }));
            }
            else {
                let URL = this.getModelURL();
                if (!constructor.noParentURL && parentURL) {
                    URL = parentURL + URL;
                }

                promises.push(HTTP.put<any>(URL, options)
                    .then((response) => {
                        this.setProps(response.body.model);
                    }));
            }
        }

        let relations = this.constructor.relations;
        for (let r in relations) {
            if (relations.hasOwnProperty(r)) {
                promises.push(this.props[r].save(this.getModelURL()));
            }
        }

        return Promise.all(promises);
    }

    public delete(): Promise<void> {
        if (!this.isNew) {
            let options = this.HTTPDeleteOptions || {};
            return HTTP.del(this.getModelURL(), options).then((response) => {
                this.emit('delete', [this.props.id]);
            });
        }
        else {
            this.emit('delete', [this.props.id]);
            return Promise.resolve<void>();
        }
    }

    public toData(props?: string[]): P {
        let result = {} as P;
        for (let p in this.props) {
            if (this.props.hasOwnProperty(p)) {
                if (props && !(props.indexOf(p) === -1)) {
                    continue;
                }
                let value = (this.props as any)[p];
                let relations = (this.constructor as any).relations;
                if (relations && p in relations) {
                    (result as any)[p] = value.toData(relations[p].includeProps);
                }
                else {
                    (result as any)[p] = value;
                }
            }
        }
        return result;
    }
}

export function model<T>(model: new() => Model<T>) {
    return function(Ctor: Function) {
        (Ctor as any).Model = model;
    }
}

interface ModelData {
    id?: string;

    [index: string]: any;
}

function isModelInstance<T>(m: Model<T> | ModelData): m is Model<T> {
    return !!(m as Model<T>).props;
}

function isArrayOfModels(x: any): x is ModelData[] | Model<any>[] {
    return x instanceof Array;
}

export class Collection<M extends Model<any>> extends DataStore {
    "constructor": {
        Model: new(props?: ModelData) => M,
        URL: string;
        noParentURL: boolean;
        name: string;
    }

    private ids: string[] = [];
    private store: M[] = [];

    constructor(collection?: M[]) {
        super();
        if (collection) {
            for (let m of collection) {
                this.add(m);
            }
        }
    }

    public add(model: M | M[] | ModelData | ModelData[]) {
        if (isArrayOfModels(model)) {
            for (let m of model) {
                this.addModel(m);
            }
        }
        else {
            this.addModel(model as M | ModelData);
        }
    }

    private addModel(model: M | ModelData) {
        let id: string;
        if ((model as M).get) {
            id = (model as M).get('id');
        }
        else {
            id = (model as any).id;
        }
        if (id && this.ids.indexOf(id) !== -1) {
            throw new TypeError(`Model with id '${id}'' is already added`);
        }
        this.ids.push(id);
        if (!isModelInstance(model)) {
            model = new this.constructor.Model(model);
        }
        (model as M).collection = this;
        let m = model as M;
        this.store.push(m);
        m.on('change', (model, prop, value) => {
            this.emit('change', [model, prop, value]);
        });
        m.on('delete', this.remove);
        this.emit('add', [m]);
    }

    public get(id: string) {
        let index = this.ids.indexOf(id);
        if (index === -1) {
            throw new TypeError(`Could not get model with id '${id}'.`);
        }
        return this.store[index];
    }

    public at(index: number): M {
        return this.store[index];
    }

    @autobind
    public remove(id: string) {
        let index = this.ids.indexOf(id);
        this.ids.splice(index, 1);
        let model = this.store.splice(index, 1);
        this.emit('remove', [model]);
    }

    public fetch(requestInfo?: RequestInfo<any, any>, relations?: string[], parentURL?: string): Promise<M[]> {
        return new Promise<M[]>((resolve, reject) => {
            let URL: string;
            if (this.constructor.URL) {
                URL = this.constructor.URL;
            }
            else {
                URL = '/' + this.constructor.name.toLowerCase();
            }
            if (!this.constructor.noParentURL && parentURL) {
                URL = parentURL + URL;
            }
            this.onFetch(requestInfo);
            HTTP.get<CollectionResponse<any>>(URL, this.HTTPFetchOptions)
                .then((response) => {
                    this.add(response.body.collection);
                    resolve();
                })
                .catch(reject);
        });
    }

    public save(parentURL?: string): Promise<any>{
        let promises: Promise<any>[] = [];
        for (let model of this.store) {
            if (model.isNew) {
                promises.push(model.save(parentURL));
            }
        }

        return Promise.all(promises);
    }

    public get length() {
        return this.store.length;
    }

    public toData(props?: string[]): any[] {
        let collection: any[] = [];
        for (let m of this.store) {
            collection.push(m.toData())
        }

        return collection;
    }
}
