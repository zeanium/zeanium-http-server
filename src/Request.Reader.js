/**
 * Created by yangyxu on 8/20/14.
 */
var node_fs = require('fs');
var node_path = require('path');
var formidable = require('formidable');
var xml2js = require('xml2js');
var Middleware = require('./Middleware');

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

            this._$params = zn.extend(this._$params, _params || {});
            this._$unmatchs = _unmatchs || [];

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
                return {};
            }
        },
        getValue: function (inName) {
            var _values = zn.extend({}, this._$data, this._$get, this._$post, this._$params);
            if(inName){
                return _values[inName];
            } else {
                return _values;
            }
        },
        getParameter: function (key){
            if(key){
                return this._$params[key];
            } else {
                return zn.deepAssign({}, this._$params);
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
        getFiles: function (name){
            return name ? this._$files[name]: this._$files;
        },
        validateRequestParameters: function (args){
            var _defaultValue = null,
                _newValue = null,
                _args = args || {},
                _values = zn.extend({}, this._$get, this._$post, this._$params);
            for(var _key in _args){
                _defaultValue = _args[_key];
                _newValue = _values[_key];
                if (_defaultValue == null && _newValue == null){
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
                var _return = Middleware.callMiddlewareMethod(Middleware.TYPES.REQUEST, "formParse", [err, fields, files, this]);
                if(_return !== false) {
                    callback && callback(err, fields, files);
                }
            }.bind(this));

            return this;
        },
        __parseFormData: function (clientRequest, callback){
            var _contentType = clientRequest.headers['content-type'] || '';
            if(_contentType.indexOf('/xml') != -1) {
                var _parser = new xml2js.Parser({
                    async: false,
                    explicitArray: false,
                    normalize: true,
                    normalizeTags: true,
                    trim: true
                }), _data = '', _parseValue = {};

                // in case `parseString` callback never was called, ensure response is sent
                _parser.saxParser.onend = function() {
                    if(Object.keys(_parseValue).length){
                        return false;
                    }
                    if (clientRequest.complete && clientRequest.rawBody === undefined) {
                        return callback && callback(null, _parseValue);
                    }
                };

                // explicitly cast incoming to string
                clientRequest.setEncoding('utf-8');
                clientRequest.on('data', function (chunk) {
                    _data += chunk;
                });

                clientRequest.on('end', function () {
                    // invalid xml, length required
                    if (_data.trim().length === 0) {
                        callback && callback(null, _parseValue);
                    }else{
                        _parser.parseString(_data, function (err, data){
                            _parseValue = data.xml;
                            callback && callback(err, _parseValue);
                        });
                    }
                });
            }else{
                var _incomingForm = new formidable.IncomingForm(),
                _config = zn.extend(this.application ? this.application.formidable : this.serverContext.formidable);
                zn.extend(_incomingForm, _config);
                
                return _incomingForm.parse(clientRequest, callback), _incomingForm;
            }
        },
        uploadFile: function (file, options){
            if(zn.is(file, 'string')){
                file = this._$files[file];
            }
            if(!file){
                throw new zn.ERROR.HttpRequestError({
                    code: 500,
                    message: "uploadFile Error.",
                    detail: "File Object is null."
                });
            }
            
            var _options = options || {},
                _config = this._serverContext.__initFileUploadConfig(),
                _tempName = file.path.substring(file.path.lastIndexOf(node_path.sep) + 1);
                _ext = node_path.extname(file.name),
                _name = _tempName,
                _folder = _options.folder || '',
                _savedDir = _config.savedDir;
            if(_options.keepOriginName || _config.keepOriginName){
                _name = file.name;
            }
            if(_options.name) {
                _name = _options.name;
            }
            if(_options.prefix) {
                _name = _options.prefix + _name;
            }
            if(_options.suffix) {
                _name = _name + _options.suffix;
            }
            if(_options.path) {
                var _path = _options.path;
                if(_path.charAt(0) == '/') {
                    _savedDir = _path;
                }else if(_path.charAt(0) == '.'){
                    _savedDir = node_path.resolve(_config.webRoot, _path);
                }
            }

            if(_folder) {
                _savedDir = node_path.join(_savedDir, _folder);
                _folder = '/' + _folder;
            }
            this._serverContext.__initPath(_savedDir);
            var _savedPath = node_path.join(_savedDir, _name + _ext),
                _file = {
                    name: file.name,
                    type: file.type,
                    tempName: _tempName,
                    encoding: _config.encoding,
                    ext: _ext,
                    size: file.size,
                    savedName: _name + _ext,
                    savedDir: _config.savedDir,
                    savedPath: _savedPath,
                    path: _folder + '/' + _name + _ext,
                    lastModifiedDate: file.lastModifiedDate.toISOString()
                };

            if(_options.return) {
                zn.extend(_file, _options.return);
            }

            zn.debug('Upload File Saved: ', _savedPath);
            return node_fs.renameSync(file.path, _savedPath), _file;
        },
        uploadFiles: function (options, eachCallback){
            var _files = [],
                _obj = null;
            zn.each(options.files || this._$files, function (file){
                _obj = this.uploadFile(file, options);
                _obj = (eachCallback && eachCallback(_obj, file)) || _obj;
                _files.push(_obj);
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
