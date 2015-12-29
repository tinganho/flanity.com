"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HTTP_1 = require('./HTTP');
var ModelEventEmitter = (function () {
    function ModelEventEmitter() {
        this.eventCallbackStore = {
            'change': [],
            'add': [],
            'remove': [],
        };
    }
    ModelEventEmitter.prototype.addEventListener = function (event, callback) {
        this.eventCallbackStore[event].push(callback);
    };
    ModelEventEmitter.prototype.removeEventListener = function (event, callback) {
        for (var p in this.eventCallbackStore[event]) {
            if (this.eventCallbackStore[event][p] === callback) {
                this.eventCallbackStore[event].splice(p, 1);
            }
        }
    };
    ModelEventEmitter.prototype.emitEvent = function (event, args) {
        for (var _i = 0, _a = this.eventCallbackStore[event]; _i < _a.length; _i++) {
            var callback = _a[_i];
            callback.apply(null, args);
        }
    };
    return ModelEventEmitter;
}());
var Model = (function (_super) {
    __extends(Model, _super);
    function Model(props) {
        _super.call(this);
        this.HTTPSaveOptions = {};
        this.HTTPFetchOptions = {};
        this.primaryKey = 'id';
        this.props = {};
        if (this.defaultProps) {
            this.props = this.defaultProps;
        }
        if (props) {
            this.props = props;
        }
        if (this.relations) {
            this.addRelatedModelProps();
        }
    }
    Model.prototype.addRelatedModelProps = function () {
        for (var property in this.relations) {
            if (this.relations.hasOwnProperty(property)) {
                var relation = this.relations[property];
                if (relation.type === 0) {
                    this.props[property] = {};
                }
                else if (relation.type === 1) {
                    this.props[property] = [];
                }
                else {
                    throw Error('Wrong \'relationType\' in model \'' + property + '\'');
                }
            }
        }
    };
    Model.prototype.getProp = function (prop) {
        return this.props[prop];
    };
    Model.prototype.setProp = function (prop, value) {
        this.props[prop] = value;
        this.emitEvent('change:' + prop, [this, value]);
        if (prop in this.relations) {
            var relation = this.relations[prop];
            this.props[prop][relation.reverseProperty] = this;
        }
    };
    Model.prototype.setProps = function (props) {
        for (var p in props) {
            if (props.hasOwnProperty(p)) {
                this.props[p] = props[p];
                this.emitEvent('change:' + p, [this, props[p]]);
                if (p in this.relations) {
                    var relation = this.relations[p];
                    this.props[p][relation.reverseProperty] = this;
                }
            }
        }
        this.emitEvent('change', [this]);
    };
    Model.prototype.fetch = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.url || _this.url === '') {
                return resolve();
            }
            HTTP_1.HTTP.get(_this.url, _this.HTTPFetchOptions)
                .then(function (response) {
                _this.setProps(response.body.model);
            })
                .catch(function (err) {
                reject(err);
            });
        });
    };
    Model.prototype.save = function () {
        var _this = this;
        var options = this.HTTPSaveOptions;
        options.bodyType = HTTP_1.HTTP.BodyType.MultipartFormData;
        options.body = this.toData();
        HTTP_1.HTTP.post(this.url, options)
            .then(function (response) {
            _this.setProps(response.body.model);
        })
            .catch(function (err) {
        });
    };
    Model.prototype.toData = function (props) {
        var result = {};
        for (var p in this.props) {
            if (this.props.hasOwnProperty(p)) {
                var value = this.props[p];
                if (typeof value !== 'function') {
                    if (p in this.relations) {
                        result[p] = this.props[p].toObjectLiteral(this.relations[p].includeProperties);
                    }
                    else {
                        result[p] = this.props[p];
                    }
                }
            }
        }
        return result;
    };
    return Model;
}(ModelEventEmitter));
exports.Model = Model;
//# sourceMappingURL=Model.js.map