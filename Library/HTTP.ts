
'use strict';
let __r = require;
import NodeHttp = require('http');
let nodeHttp: typeof NodeHttp = inServer ? __r('http') : undefined;
import Fs = require('fs');
let fs: typeof Fs = inServer ? __r('fs') : undefined;

export const enum HttpStatusCode {
    Success = 200,
    Created = 201,
    NoContent = 204,

    MovedPermanently = 301,
    NotModified = 304,

    BadRequest = 400,
    UnAuthorized = 401,
    Forbidden = 403,
    NotFound = 404,

    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
}

export const enum HTTPResponseType {
    Error,
    Model,
    Collection,
}

export interface HTTPOptions {
    protocol?: string;
    host?: string;
    port?: number;
    query?: any;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'DELETE' | 'OPTIONS';
    family?: number;
    localAddress?: string;
    socketPath?: string;
    withCredentials?: boolean;
    agent?: NodeHttp.Agent;
    auth?: string;
    headers?: HttpHeaders;

    // Magic property used for testing authenticate handler for handling no authorization headers
    _noAuthorizationHeader?: boolean;

    body?: any;
    bodyType?: BodyType;
    accessToken?: string;
}

export interface ModelResponse<T> {
    type: HTTPResponseType;
    name: string;
    model: T;
}

export interface CollectionResponse<T> {
    type: HTTPResponseType;
    name: string;
    collection: T[];
}

interface FeedbackEntry {
    code: number;
    name: string;
    description: string;
}

interface Feedback {
    all: FeedbackEntry[];
    current: FeedbackEntry;
    domain: string;
}

export interface ErrorResponse {
    type: HTTPResponseType;
    name: string;
    feedback: Feedback;
}

interface DefaultHttpRequestOptions {
    protocol: 'https' | 'http';
    host: string;
    port: number;
}

let defaultHttpRequestOption: DefaultHttpRequestOptions = {
    protocol: 'http',
    host: 'localhost',
    port: 3000,
}

export function setDefaultHttpRequestOptions(options: DefaultHttpRequestOptions): void {
    defaultHttpRequestOption = options;
}

let useXCsrfToken = false;
export function setDefaultXCsrfTokenHeader(): void {
    useXCsrfToken = true;
}
let useCorsCredentials = false;
export function setDefaultCorsCredentials(): void {
    useCorsCredentials = true;
}

export type RequestBody = FormData | Blob | ArrayBuffer | {} | string;

export function get<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'GET';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export function post<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'POST';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export function put<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'PUT';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export function patch<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'PATCH';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export function del<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'DELETE';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export function options<R>(path: string, options?: HTTPOptions): Promise<HTTPResponse<R>> {
    options = options || {};
    options.method = 'OPTIONS';

    let req = new HttpRequest<R>(path, options);
    return req.request();
}

export enum BodyType {
    ApplicationJson,
    ApplicationXWwwFormUrlEncoded,
    MultipartFormData,
}

export var HTTP = {
    get: get,
    post,
    del,
    put,
    patch,
    options,
    BodyType,
}

export type Http = typeof HTTP;

export interface HttpHeaders {
    'Accept'?: string;
    'Accept-Charset'?: string;
    'Accept-Encoding'?: string;
    'Accept-Language'?: string;
    'Accept-Datetime'?: string;
    'Authorization'?: string;
    'Cache-Control'?: string;
    'Connection'?: string;
    'Cookie'?: string;
    'Content-Length'?: string;
    'Content-MD5'?: string;
    'Content-Type'?: string;
    'Date'?: string;
    'Expect'?: string;
    'From'?: string;
    'Host'?: string;
    'If-Match'?: string;
    'If-Modified-Since'?: string;
    'If-None-Match'?: string;
    'If-Range'?: string;
    'If-Unmodified-Since'?: string;
    'Max-Forwards'?: string;
    'Origin'?: string;
    'Pragma'?: string;
    'Proxy-Authorization'?: string;
    'Range'?: string;
    'Referer'?: string;
    'Transfer-Encoding'?: string;
    'User-Agent'?: string;
    'Upgrade'?: string;
    'Via'?: string;
    'Warning'?: string;

    [name: string]: string;
}

export interface HTTPResponse<T> {
    body?: T;
    rawBody?: string;
    headers?: HttpHeaders;
    status?: number;
}

const multipartBoundary = 'iojeoijefoiewfmultipartefboundary';

function buildAccessorString(accessors: string[]): string {
    let accessorString = '';
    for (let i = 0; i < accessors.length; i++) {
        if (i === 0) {
            accessorString += accessors[i];
        }
        else {
            accessorString += `[${accessors[i]}]`;
        }
    }

    return accessorString;
}

function buildUriEncodedString(object: any, accessors?: string[], objectString?: string): string {
    let str = objectString || '';
    accessors = accessors || []

    for (let p in object) {
        accessors.push(p);
        let accessorString = buildAccessorString(accessors);
        let value = (object as any)[p];
        if (typeof value === 'string' || typeof object[p] === 'number' || typeof object[p] === 'boolean') {
            str += encodeURIComponent(accessorString) + `=${encodeURIComponent(value)}&`;
        }
        else if (Object.prototype.toString.call(value) === '[object Object]') {
            str += buildUriEncodedString(value, accessors, objectString);
        }
        else {
            throw new TypeError('Cannot build object string from array.');
        }
        accessors.pop();
    }

    str = str.substring(0, str.length - 1);

    return str;
}

function buildMultipartChunkedRequest(object: any, request: NodeHttp.ClientRequest) {
    let str = '';
    for (let p in object) {
        if (typeof object[p] === 'string' || typeof object[p] === 'number' || typeof object[p] === 'boolean') {
            str += '\r\n--' + multipartBoundary + '\r\n';
            str += `Content-Disposition: form-data; name="${p}"\r\n\r\n${object[p]}`;
            delete object[p];
        }
    }
    request.write(str);
    str = undefined;

    function writeNextFile() {
        let traversedObject = false;
        for (let p in object) {
            if (typeof object[p].filename === 'string' && typeof object[p].path === 'string') {
                let str = '\r\n--' + multipartBoundary + '\r\n';
                str += `Content-Disposition: form-data; name="${p}" filename="${object[p].filename}"\r\n`;
                str += 'Content-Type: application/octet-stream\r\n\r\n';
                request.write(str);
                str = undefined;

                let readStream = fs.createReadStream(object[p].path);
                delete object[p];

                readStream.on('data', (chunk: string) => {
                    request.write(chunk);
                });
                readStream.on('end', () => {
                    writeNextFile();
                });

                traversedObject = true;
                break;
            }
        }

        if (!traversedObject) {
            request.write('\r\n--' + multipartBoundary + '--');
            request.end();
        }
    }
    writeNextFile();
}

export class HttpRequest<R> {
    public response: HTTPResponse<R>;
    public clientRequest: NodeHttp.ClientRequest;
    public requestHeaders: HttpHeaders = {};
    private serializedBody: string;

    public constructor(public path: string, public options: HTTPOptions) {
        this.response = {};

        if (options.method !== 'GET' && !options.bodyType) {
            options.bodyType = BodyType.ApplicationXWwwFormUrlEncoded;
        }

        if (!options.protocol) {
            options.protocol = defaultHttpRequestOption.protocol;
        }

        if (!options.host) {
            options.host = defaultHttpRequestOption.host;
        }

        if (!options.port) {
            options.port = defaultHttpRequestOption.port;
        }

        if (this.options.body && typeof this.options.body !== 'string') {
            if (this.options.bodyType === BodyType.ApplicationJson) {
                this.serializedBody = JSON.stringify(this.options.body);
            }
            else if (this.options.bodyType === BodyType.ApplicationXWwwFormUrlEncoded) {
                this.serializedBody = buildUriEncodedString(this.options.body);
            }
        }
    }

    public request(): Promise<HTTPResponse<R>> {
        return new Promise<HTTPResponse<R>>((resolve, reject) => {
            let response = this.response;
            response.rawBody = '';

            if (!this.options.headers) {
                this.options.headers = {};
            }

            if (this.options.method !== 'GET' && this.options.body) {
                if (this.options.bodyType === BodyType.ApplicationJson) {
                    this.options.headers['Content-Type'] = 'application/json';
                    if (inServer) {
                        this.options.headers['Content-Length'] = Buffer.byteLength(this.serializedBody) + '';
                    }
                }
                else if(this.options.bodyType === BodyType.ApplicationXWwwFormUrlEncoded) {
                    this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    if (inServer) {
                        this.options.headers['Content-Length'] = Buffer.byteLength(this.serializedBody) + '';
                    }
                }
                else if(inServer && this.options.bodyType === BodyType.MultipartFormData) {
                    this.options.headers['Content-Type'] = `multipart/form-data; boundary=${multipartBoundary}`;
                    this.options.headers['Transfer-Encoding'] = 'chunked';
                }
            }

            if (this.options.accessToken) {
                this.options.headers['Authorization'] = `Bearer ${this.options.accessToken}`;
            }

            if (this.options.query) {
                if (this.path.indexOf('?') === -1) {
                    this.path += '?'
                }
                this.path += buildUriEncodedString(this.options.query);
            }

            if (inClient) {
                let xhr = new XMLHttpRequest();
                xhr.withCredentials = this.options.withCredentials || useCorsCredentials;
                xhr.onload = () => {
                    response.status = xhr.status;
                    response.headers = {};
                    xhr.getAllResponseHeaders().split('\r\n').forEach((header) => {
                        if (header !== '') {
                            let headerSegments = header.split(': ');
                            response.headers[headerSegments[0]] = headerSegments[1];
                        }
                    });
                    try {
                        response.body = JSON.parse(xhr.responseText);
                    }
                    catch(err) {}
                    finally {
                        if (response.status >= HttpStatusCode.BadRequest /* 400 */) {
                            reject(response);
                        }
                        else {
                            resolve(response);
                        }
                    }
                }
                xhr.onerror = (event) => {
                    reject(event);
                }
                let url = `${this.options.protocol}://${this.options.host}`;
                if (this.options.port !== 80) {
                    url += ':' + this.options.port;
                }
                url += this.path;
                xhr.open(this.options.method, url, true);

                // Set request header. We must set headers after the XHR has been opened.
                for (let h in this.options.headers) {
                    xhr.setRequestHeader(h, this.options.headers[h]);
                }
                if (useXCsrfToken) {
                    xhr.setRequestHeader('Accept', 'Content-Type:application/json; X-CSRF-Token=1');
                }

                if (this.options.body instanceof FormData ||
                    this.options.body instanceof Blob ||
                    this.options.body instanceof ArrayBuffer) {

                    xhr.send(this.options.body);
                }
                else {
                    xhr.send(this.serializedBody);
                }
            }
            else {
                this.clientRequest = nodeHttp.request(
                    {
                        protocol: this.options.protocol + ':',
                        path: this.path,
                        host: this.options.host,
                        port: this.options.port as number,
                        method: this.options.method,
                        headers: this.options.headers,
                        family: this.options.family,
                        localAddress: this.options.localAddress,
                        socketPath: this.options.socketPath,
                        auth: this.options.auth,
                        agent: this.options.agent,
                    },
                    (nodeResponse) => {
                        nodeResponse.setEncoding('utf8');
                        nodeResponse.on('data', (chunk: string) => {
                            response.rawBody += chunk;
                        });
                        nodeResponse.on('end', () => {
                            response.status = nodeResponse.statusCode;
                            response.headers = nodeResponse.headers;
                            try {
                                response.body = JSON.parse(response.rawBody) as R;
                            }
                            catch(err) {}
                            finally {
                                if (response.status >= HttpStatusCode.BadRequest /* 400 */) {
                                    reject(response);
                                }
                                else {
                                    resolve(response);
                                }
                            }
                        });
                    }
                );

                this.clientRequest.on('error', (err: any) => {
                    reject(err);
                });

                let useChunkedRequest = false;
                if (this.options.body && typeof this.options.body !== 'string') {
                    if (this.options.bodyType === BodyType.MultipartFormData){
                        useChunkedRequest = true;
                        buildMultipartChunkedRequest(this.options.body, this.clientRequest);
                    }
                }

                if (!useChunkedRequest) {
                    if (this.options.body) {
                        this.clientRequest.write(this.serializedBody);
                    }
                    this.clientRequest.end();
                }
            }
        });
    }
}

function extend<T1, T2>(obj1: T1, obj2: T2): T1 & T2 {
    let obj3: any = {};

    for(let p in obj1) {
        obj3[p] = (obj1 as any)[p];
    }

    for(let p in obj2) {
        obj3[p] = (obj2 as any)[p];
    }

    return obj3;
}
