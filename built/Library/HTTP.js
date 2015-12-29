'use strict';
var __r = require;
var nodeHttp = inServer ? __r('http') : undefined;
var fs = inServer ? __r('fs') : undefined;
var defaultHttpRequestOption = {
    protocol: 'http',
    host: 'localhost',
    port: 3000,
};
function setDefaultHttpRequestOptions(options) {
    defaultHttpRequestOption = options;
}
exports.setDefaultHttpRequestOptions = setDefaultHttpRequestOptions;
var useXCsrfToken = false;
function setDefaultXCsrfTokenHeader() {
    useXCsrfToken = true;
}
exports.setDefaultXCsrfTokenHeader = setDefaultXCsrfTokenHeader;
var useCorsCredentials = false;
function setDefaultCorsCredentials() {
    useCorsCredentials = true;
}
exports.setDefaultCorsCredentials = setDefaultCorsCredentials;
function get(path, options) {
    options = options || {};
    options.method = 'GET';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.get = get;
function post(path, options) {
    options = options || {};
    options.method = 'POST';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.post = post;
function put(path, options) {
    options = options || {};
    options.method = 'PUT';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.put = put;
function patch(path, options) {
    options = options || {};
    options.method = 'PATCH';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.patch = patch;
function del(path, options) {
    options = options || {};
    options.method = 'DELETE';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.del = del;
function options(path, options) {
    options = options || {};
    options.method = 'OPTIONS';
    var req = new HttpRequest(path, options);
    return req.request();
}
exports.options = options;
(function (BodyType) {
    BodyType[BodyType["ApplicationJson"] = 0] = "ApplicationJson";
    BodyType[BodyType["ApplicationXWwwFormUrlEncoded"] = 1] = "ApplicationXWwwFormUrlEncoded";
    BodyType[BodyType["MultipartFormData"] = 2] = "MultipartFormData";
})(exports.BodyType || (exports.BodyType = {}));
var BodyType = exports.BodyType;
exports.HTTP = {
    get: get,
    post: post,
    del: del,
    put: put,
    patch: patch,
    options: options,
    BodyType: BodyType,
};
var multipartBoundary = 'iojeoijefoiewfmultipartefboundary';
function buildAccessorString(accessors) {
    var accessorString = '';
    for (var i = 0; i < accessors.length; i++) {
        if (i === 0) {
            accessorString += accessors[i];
        }
        else {
            accessorString += "[" + accessors[i] + "]";
        }
    }
    return accessorString;
}
function buildUriEncodedString(object, accessors, objectString) {
    var str = objectString || '';
    accessors = accessors || [];
    for (var p in object) {
        accessors.push(p);
        var accessorString = buildAccessorString(accessors);
        var value = object[p];
        if (typeof value === 'string' || typeof object[p] === 'number' || typeof object[p] === 'boolean') {
            str += encodeURIComponent(accessorString) + ("=" + encodeURIComponent(value) + "&");
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
function buildMultipartChunkedRequest(object, request) {
    var str = '';
    for (var p in object) {
        if (typeof object[p] === 'string' || typeof object[p] === 'number' || typeof object[p] === 'boolean') {
            str += '\r\n--' + multipartBoundary + '\r\n';
            str += "Content-Disposition: form-data; name=\"" + p + "\"\r\n\r\n" + object[p];
            delete object[p];
        }
    }
    request.write(str);
    str = undefined;
    function writeNextFile() {
        var traversedObject = false;
        for (var p in object) {
            if (typeof object[p].filename === 'string' && typeof object[p].path === 'string') {
                var str_1 = '\r\n--' + multipartBoundary + '\r\n';
                str_1 += "Content-Disposition: form-data; name=\"" + p + "\" filename=\"" + object[p].filename + "\"\r\n";
                str_1 += 'Content-Type: application/octet-stream\r\n\r\n';
                request.write(str_1);
                str_1 = undefined;
                var readStream = fs.createReadStream(object[p].path);
                delete object[p];
                readStream.on('data', function (chunk) {
                    request.write(chunk);
                });
                readStream.on('end', function () {
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
var HttpRequest = (function () {
    function HttpRequest(path, options) {
        this.path = path;
        this.options = options;
        this.requestHeaders = {};
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
    HttpRequest.prototype.request = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var response = _this.response;
            response.rawBody = '';
            if (!_this.options.headers) {
                _this.options.headers = {};
            }
            if (_this.options.method !== 'GET' && _this.options.body) {
                if (_this.options.bodyType === BodyType.ApplicationJson) {
                    _this.options.headers['Content-Type'] = 'application/json';
                    if (inServer) {
                        _this.options.headers['Content-Length'] = Buffer.byteLength(_this.serializedBody) + '';
                    }
                }
                else if (_this.options.bodyType === BodyType.ApplicationXWwwFormUrlEncoded) {
                    _this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    if (inServer) {
                        _this.options.headers['Content-Length'] = Buffer.byteLength(_this.serializedBody) + '';
                    }
                }
                else if (inServer && _this.options.bodyType === BodyType.MultipartFormData) {
                    _this.options.headers['Content-Type'] = "multipart/form-data; boundary=" + multipartBoundary;
                    _this.options.headers['Transfer-Encoding'] = 'chunked';
                }
            }
            if (_this.options.accessToken) {
                _this.options.headers['Authorization'] = "Bearer " + _this.options.accessToken;
            }
            if (_this.options.query) {
                if (_this.path.indexOf('?') === -1) {
                    _this.path += '?';
                }
                _this.path += buildUriEncodedString(_this.options.query);
            }
            if (inClient) {
                var xhr = new XMLHttpRequest();
                xhr.withCredentials = _this.options.withCredentials || useCorsCredentials;
                xhr.onload = function () {
                    response.status = xhr.status;
                    response.headers = {};
                    xhr.getAllResponseHeaders().split('\r\n').forEach(function (header) {
                        if (header !== '') {
                            var headerSegments = header.split(': ');
                            response.headers[headerSegments[0]] = headerSegments[1];
                        }
                    });
                    try {
                        response.body = JSON.parse(xhr.responseText);
                    }
                    catch (err) { }
                    finally {
                        if (response.status >= 400) {
                            reject(response);
                        }
                        else {
                            resolve(response);
                        }
                    }
                };
                xhr.onerror = function (event) {
                    reject(event);
                };
                var url = _this.options.protocol + "://" + _this.options.host;
                if (_this.options.port !== 80) {
                    url += ':' + _this.options.port;
                }
                url += _this.path;
                xhr.open(_this.options.method, url, true);
                for (var h in _this.options.headers) {
                    xhr.setRequestHeader(h, _this.options.headers[h]);
                }
                if (useXCsrfToken) {
                    xhr.setRequestHeader('Accept', 'Content-Type:application/json; X-CSRF-Token=1');
                }
                if (_this.options.body instanceof FormData ||
                    _this.options.body instanceof Blob ||
                    _this.options.body instanceof ArrayBuffer) {
                    xhr.send(_this.options.body);
                }
                else {
                    xhr.send(_this.serializedBody);
                }
            }
            else {
                _this.clientRequest = nodeHttp.request({
                    protocol: _this.options.protocol + ':',
                    path: _this.path,
                    host: _this.options.host,
                    port: _this.options.port,
                    method: _this.options.method,
                    headers: _this.options.headers,
                    family: _this.options.family,
                    localAddress: _this.options.localAddress,
                    socketPath: _this.options.socketPath,
                    auth: _this.options.auth,
                    agent: _this.options.agent,
                }, function (nodeResponse) {
                    nodeResponse.setEncoding('utf8');
                    nodeResponse.on('data', function (chunk) {
                        response.rawBody += chunk;
                    });
                    nodeResponse.on('end', function () {
                        response.status = nodeResponse.statusCode;
                        response.headers = nodeResponse.headers;
                        try {
                            response.body = JSON.parse(response.rawBody);
                        }
                        catch (err) { }
                        finally {
                            if (response.status >= 400) {
                                reject(response);
                            }
                            else {
                                resolve(response);
                            }
                        }
                    });
                });
                _this.clientRequest.on('error', function (err) {
                    reject(err);
                });
                var useChunkedRequest = false;
                if (_this.options.body && typeof _this.options.body !== 'string') {
                    if (_this.options.bodyType === BodyType.MultipartFormData) {
                        useChunkedRequest = true;
                        buildMultipartChunkedRequest(_this.options.body, _this.clientRequest);
                    }
                }
                if (!useChunkedRequest) {
                    if (_this.options.body) {
                        _this.clientRequest.write(_this.serializedBody);
                    }
                    _this.clientRequest.end();
                }
            }
        });
    };
    return HttpRequest;
}());
exports.HttpRequest = HttpRequest;
function extend(obj1, obj2) {
    var obj3 = {};
    for (var p in obj1) {
        obj3[p] = obj1[p];
    }
    for (var p in obj2) {
        obj3[p] = obj2[p];
    }
    return obj3;
}
//# sourceMappingURL=HTTP.js.map