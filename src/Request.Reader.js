/**
 * Created by yangyxu on 8/20/14.
 */
var node_fs = require('fs');
var node_path = require('path');
var formidable = require('formidable');

module.exports = zn.Class({
    events: [ 'data', 'end', 'close' ],
    properties: {
        $data: null,
        $post: null,
        $get: null,
        $files: null,
        $params: null,
        $unmatchs: null,
        chain: null
    },
    methods: {
        init: function (){
            this._$data = {};
            this._$post = {};
            this._$get = {};
            this._$files = {};
            this._$params = {};
            this._$unmatchs = [];
        },
        nextReload: function (route){
            if(!route) return;
            var _application = route.application,
                _chain = route.chain,
                _params = route.params, 
                _unmatchs = route.unmatchs;
            if(this._application != _application){
                this._application = _application;
            }
            if(this._chain !== _chain) {
                this._chain = _chain;
            }

            if(this._$params !== _params) {
                this._$params = _params || {};
            }
            if(this._$unmatchs !== _unmatchs) {
                this._$unmatchs = _unmatchs || {};
            }

            return this;
        },
        next: function (response){
            if(this._chain){
                this._chain.next(this, response);
            }

            return this;
        },
        getPathParams: function (){
            return this._$params;
        },
        getPathParamsValue: function (name){
            return this._$params[name];
        },
        getUnmatchs: function (){
            return this._$unmatchs;
        },
        getJSON: function (inName){
            var _value = this.getValue(inName);
            if(typeof _value == 'object'){
                return _value;
            }

            if(_value && typeof _value == 'string'){
                try {
                    return JSON.parse(_value);
                } catch (err) {
                    throw new zn.ERROR.HttpRequestError({
                        code: 400,
                        message: err.message,
                        detail: err.stack
                    });
                }
            }else {
                throw new zn.ERROR.HttpRequestError({
                    code: 400,
                    message: "Data Type Error",
                    detail: "Request parameter '" + inName + "' is '" + this.getValue(inName) + "' is not json data."
                });
            }
        },
        getValue: function (inName) {
            if(inName){
                return this._$data[inName] || this._$params[inName];
            } else {
                return zn.deepAssign({}, this._$data, this._$params);
            }
        },
        setValue: function (inKey, inValue){
            return this._$data[inKey] = inValue, this;
        },
        getInt: function (inName) {
            return +(this.getValue(inName));
        },
        getBoolean: function (inName) {
            return new Boolean(this.getValue(inName)).valueOf();
        },
        validateRequestParameters: function (args){
            var _defaultValue = null,
                _newValue = null,
                _args = args || {},
                _values = zn.extend({}, this._$get, this._$post);
            for(var _key in _args){
                _defaultValue = _args[_key];
                _newValue = _values[_key];

                if (_defaultValue !== undefined && _newValue === undefined){
                    throw new zn.ERROR.HttpRequestError({
                        code: 400,
                        message: "Missing Parameter Error.",
                        detail: "Request parameter '" + _key + "' is required."
                    });
                }

                switch (zn.type(_defaultValue)) {
                    case 'object':
                        var _value = _defaultValue.value,
                            _reg = _defaultValue.regexp;

                        if(_reg && !_reg.test(_value)){
                            throw new zn.ERROR.HttpRequestError({
                                code: 400,
                                message: "Parameter Is Invalid.",
                                detail: "Value of http request parameter('" + _key + "') is Invalid."
                            });
                        }
                        break;
                    case 'function':
                        var _temp = _defaultValue(_newValue, this);
                        if(typeof _temp == 'string'){
                            throw new zn.ERROR.HttpRequestError({
                                code: 400,
                                message: "Bad Request.",
                                detail: _temp
                            });
                        }
                        break;
                }

                if(_newValue === undefined && _defaultValue){
                    _values[_key] = _defaultValue;
                }
            }

            return this._$data = _values, _values;
        },
        parseServerRequest: function (callback, clientRequest){
            var _clientRequest = clientRequest || this._clientRequest;
            this.parseServerRequestQueryString(_clientRequest);
            this.parseServerRequestFromData(_clientRequest, callback);
        },
        parseServerRequestQueryString: function (clientRequest){
            var _query = clientRequest.meta.query;
            for(var _key in _query){
                this._$get[_key] = _query[_key];
            }
            
            return this;
        },
        parseServerRequestFromData: function (clientRequest, callback){
            if(clientRequest.parent && this._parsed){
                return callback && callback(null, this._$post, this._$files), false;
            }
            var _ct = clientRequest.headers['content-type']||'';
            if(_ct.toLowerCase().indexOf('text/xml') != -1){
                return false;
            }
            
            this.__parseFormData(clientRequest, function(err, fields, files){
                if(!err){
                    this._$post = fields;
                    this._$files = files;
                    this._parsed = true;
                }
                clientRequest.data = {
                    data: Object.assign({}, this._$data),
                    post: Object.assign({}, this._$post),
                    get: Object.assign({}, this._$get),
                    files: Object.assign({}, this._$files),
                    params: Object.assign({}, this._$params),
                    unmatchs: Array.from(this._$unmatchs),
                }
                var _return = zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.REQUEST, "formParse", [err, fields, files, this]);
                if(_return !== false) {
                    callback && callback(err, fields, files);
                }
            }.bind(this));

            return this;
        },
        __parseFormData: function (clientRequest, callback){
            var _incomingForm = new formidable.IncomingForm();
            zn.extend(_incomingForm, this.application ? this.application.formidable : this.serverContext.formidable);
            
            return _incomingForm.parse(clientRequest, callback), _incomingForm;
        },
        uploadFile: function (file, config){
            var _config = this._serverContext.__initFileUploadConfig(config),
                _tempName = file.path.substring(file.path.lastIndexOf(node_path.sep) + 1);
                _ext = node_path.extname(file.name),
                _name = _tempName + _ext;
            if(_config.keepOriginName){
                _name = file.name;
            }
            var _savedPath = node_path.join(_config.savedDir, _name);
            node_fs.renameSync(file.path, _savedPath);
            return {
                name: file.name,
                type: file.type,
                tempName: _tempName,
                size: file.size,
                savedName: _name,
                savedPath: _savedPath,
                lastModifiedDate: file.lastModifiedDate.toISOString()
            }
        },
        uploadFiles: function (files, config){
            var _files = [];
            zn.each(files || this._$files, function (file){
                _files.push(this.uploadFile(file, config));
            }, this);

            return _files;
        },
        clearFiles: function (files){
            zn.each(files || this._$files, function (file){
                if(node_fs.existsSync(file.path)){
                    node_fs.unlinkSync(file.path);
                }
            });

            return this;
        }
    }
});
