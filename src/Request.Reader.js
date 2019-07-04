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
        $files: null
    },
    methods: {
        init: function (){
            this._$data = {};
            this._$post = {};
            this._$get = {};
            this._$files = {};
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
                    zn.error(new SyntaxError(err.message));
                }
            }else {
                zn.error(new TypeError("The value of http request parameter('" + inName + "') is " + this.getValue(inName) + ", but it is not json format."));
                return {};
            }
        },
        getValue: function (inName) {
            if(inName){
                return this._$data[inName];
            } else {
                return this._$data;
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

                if (_defaultValue == undefined && _newValue === undefined){
                    throw new Error("Value of http request parameter('" + _key + "') is Required.");
                }

                switch (zn.type(_defaultValue)) {
                    case 'object':
                        var _value = _defaultValue.value,
                            _reg = _defaultValue.regexp;

                        if(_reg && !_reg.test(_value)){
                            throw new Error("Value of http request parameter('" + _key + "') is Invalid.");
                        }
                        break;
                    case 'function':
                        var _temp = _defaultValue(_newValue, this);
                        if(typeof _temp == 'string'){
                            throw new Error(_temp);
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
            if(clientRequest.parent){
                return callback && callback(null, this._$post, this._$files), false;
            }
            var _ct = clientRequest.headers['content-type']||'';
            if(_ct.toLowerCase().indexOf('text/xml')!=-1){
                return false;
            }
            
            this.__parseFormData(clientRequest, function(error, fields, files){
                if(error){
                    throw error;
                } else {
                    this._$post = fields;
                    this._$files = files;
                }
                callback && callback(error, fields, files);
            }.bind(this));

            return this;
        },
        __parseFormData: function (clientRequest, callback){
            var _incomingForm = new formidable.IncomingForm();
            zn.extend(_incomingForm, this.application.formidable);

            return _incomingForm.parse(clientRequest, callback), _incomingForm;
        },
        uploadFile: function (file, config){
            var _config = this.application.__initFileUploadConfig(config),
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
