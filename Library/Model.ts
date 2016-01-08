
import { HTTP, HTTPOptions, ModelResponse } from './HTTP';

type Callback = (...args: any[]) => any;

interface EventCallbackStore {
    [event: string]: Callback[];
}


interface Map { [index: string]: string; }
export interface RequestInfo<P, Q> {
    params: P;
    query: Q;
}

class ModelEventEmitter {
    private eventCallbackStore: EventCallbackStore = {
        'change': [],
        'add': [],
        'remove': [],
    }

    public addEventListener(event: string, callback: Callback) {
        if (!this.eventCallbackStore[event]) {
            this.eventCallbackStore[event] = [];
        }
        this.eventCallbackStore[event].push(callback);
    }

    public removeEventListener(event: string, callback: Callback): void {
        for (let p in this.eventCallbackStore[event]) {
            if (this.eventCallbackStore[event][p] === callback) {
                this.eventCallbackStore[event].splice(p, 1);
            }
        }
    }

    public emitEvent(event: string, args: any[]) {
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
    type: RelationType;
    reverseProperty: string;
    includeProperties: string[];
    model: Model<any>;
}

interface ModelRelations {
    [property: string]: ModelRelation;
}

export class Model<T> extends ModelEventEmitter {
    public url: string;
    public fetchMapping: any;
    public saveMapping: any;
    public relations: ModelRelations = {};
    public HTTPSaveOptions: HTTPOptions = {};
    public HTTPFetchOptions: HTTPOptions = {};
    public primaryKey = 'id';
    public props = {} as T;
    public defaultProps: T;

    constructor(props?: T) {
        super();
        if (this.defaultProps) {
            this.props = this.defaultProps;
        }
        if (props) {
            this.props = props;
        }

        if(this.relations) {
            this.addRelatedModelProps();
        }
    }

    private addRelatedModelProps() {
        for (let property in this.relations) {
            if (this.relations.hasOwnProperty(property)) {
                let relation = this.relations[property];
                if (relation.type === RelationType.HasOne) {
                    (this.props as any)[property] = {};
                }
                else if (relation.type === RelationType.HasMany) {
                    (this.props as any)[property] = [];
                }
                else {
                    throw Error('Wrong \'relationType\' in model \'' + property + '\'');
                }
            }
        }
    }

    public getProp(prop: string): any {
        return (this.props as any)[prop];
    }

    public setProp(prop: string, value: any) {
        (this.props as any)[prop] = value;
        this.emitEvent('change:' + prop, [this, value]);
        if (prop in this.relations) {
            let relation = this.relations[prop];
            (this.props as any)[prop][relation.reverseProperty] = this;
        }
    }

    public setProps(props: any) {
        for (let p in props) {
            if (props.hasOwnProperty(p)) {
                (this.props as any)[p] = props[p];
                this.emitEvent('change:' + p, [this, props[p]]);

                if (p in this.relations) {
                    let relation = this.relations[p];
                    (this.props as any)[p][relation.reverseProperty] = this;
                }
            }
        }

        this.emitEvent('change', [this]);
    }

    public fetch(requestInfo: RequestInfo<any, any>): Promise<any> {
        return new Promise<T>((resolve, reject) => {
            if (!this.url || this.url === '') {
                return resolve();
            }
            HTTP.get<ModelResponse<any>>(this.url, this.HTTPFetchOptions)
                .then((response) => {
                    this.setProps(response.body.model);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    public save() {
        let options = this.HTTPSaveOptions;
        options.bodyType = HTTP.BodyType.MultipartFormData;
        options.body = this.toData();

        HTTP.post<any>(this.url, options)
            .then((response) => {
                this.setProps(response.body.model);
            })
            .catch((err) => {

            });
    }

    public toData(props?: string[]): any {
        let result = {};
        for (let p in this.props) {
            if (this.props.hasOwnProperty(p)) {
                let value = (this.props as any)[p];
                if (typeof value !== 'function') {
                    if (p in this.relations) {
                        (result as any)[p] = (this.props as any)[p].toObjectLiteral(this.relations[p].includeProperties);
                    }
                    else {
                        (result as any)[p] = (this.props as any)[p];
                    }

                }
            }
        }

        return result;
    }
}
