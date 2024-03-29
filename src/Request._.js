/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');
var RequestReader = require('./Request.Reader');
var Cookie = require('./Cookie');

module.exports = zn.Class({
    mixins: [ RequestReader ],
    properties: {
        application: null,
        clientRequest: null,
        serverContext: null,
        session: null,
        cookies: null,
        formidableConfig: null
    },
    methods: {
        init: function (clientRequest, application, serverContext){
            this._clientRequest = clientRequest;
            this._application = application,
            this._serverContext = serverContext;
            this._formidableConfig = this._application ? this._application.formidable : this._serverContext.formidable;
            this.__initCookie();
        },
        getFormidableConfig: function (){
            return this._formidableConfig;
        },
        readSavedFileContent: function (){
            var _data = {};
            var _savedConfig = this._formidableConfig;
            var _savedJSONPath = node_path.resolve(_savedConfig.webRoot, _savedConfig.savedMapping);
            if(node_fs.existsSync(_savedJSONPath)){
                _data = require(_savedJSONPath);
            }

            return _data;
        },
        getSavedFilByKey: function (fileKey){
            if(!fileKey) return;
            var _data = this.readSavedFileContent() || {};
            var _path = _data[fileKey];
            if(!_path) return;
            var _ext = node_path.extname(_path);

            return {
                key: fileKey,
                path: _path,
                ext: _ext
            };
        },
        getSavedFilesByKeys: function (fileKeys){
            if(!fileKeys) return;
            var _data = this.readSavedFileContent() || [],
                _return  = [];

            fileKeys.map(function (key){
                if(key && _data[key]) {
                    _return.push({
                        key: key,
                        path: _data[key],
                        ext: node_path.extname(_data[key])
                    });
                }
            });

            return _return;
        },
        getContextPath: function (){
            return this._serverContext._webRoot;
        },
        addClientRequestEventListener: function (event, listener, handler){
            return this._clientRequest.on.call(handler || this._clientRequest, event, listener), this;
        },
        containCookies: function (names){
            if(!names) return false;
            var _size = names.length;
            if(!_size){
                return false;
            }
            for(var i = 0, _len = this._cookies.length;  i < _len; i++){
                if(names.indexOf(this._cookies[i].name) != -1){
                    _size = _size - 1;
                }
            }

            if(_size){
                return false;
            }else{
                return true;
            }
        },
        getCookie: function (name){
            if(!name) return;
            for(var i = 0, _len = this._cookies.length;  i < _len; i++){
                if(this._cookies[i].name == name){
                    return this._cookies[i];
                }
            }
        },
        getCookies: function (){
            return this._cookies;
        },
        getCookieNames: function (){
            return this._cookies.map(function (cookie){
                return cookie.name;
            });
        },
        getCookieValues: function (){
            return this._cookies.map(function (cookie){
                return cookie.value;
            });
        },
        getCookieObjects: function (){
            return this._cookies.map(function (cookie){
                return {
                    name: cookie.name,
                    value: cookie.value
                }
            });
        },
        xsrfTokenIdVerify: function (success, error){
            var _token = this._clientRequest.headers["x-csrf-token"] || this.getCookie('CSRF-Token');
            if(zn.isZNObject(_token)){
                _token = _token.getValue();
            }
            if(!_token){
                return error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "401.1 XSRFToken失效",
                    detail: "登录XSRFToken已经过期失效。"
                })), false;
            }

            var _value = this._serverContext._sessionContext.jwtVerifyToken(_token);
            zn.debug('CSRF-Token: ', _value);
            if(_value.exp > Date.now()){
                return error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "401.1 XSRFToken失效",
                    detail: "登录XSRFToken已经过期失效。"
                })), false;
            }else{
                return success && success(_value.data), _value.data;
            }
        },
        xsrfTokenKeyVerify: function (success, error){
            var _token = this._clientRequest.headers["x-csrf-token"] || this.getCookie('CSRF-Token');
            if(zn.isZNObject(_token)){
                _token = _token.getValue();
            }
            if(!_token){
                return error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "401.1 XSRFToken失效",
                    detail: "登录XSRFToken已经过期失效。"
                })), false;
            }

            var _value = this._serverContext._sessionContext.jwtVerifyToken(_token);
            zn.debug('CSRF-Token: ', _value);
            if(_value.exp > Date.now()){
                return error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "401.1 XSRFToken失效",
                    detail: "登录XSRFToken已经过期失效。"
                })), false;
            }else{
                return success && success(_value.data), _value.data;
            }
        },
        sessionVerify: function (success, error){
            var _key = this.xsrfTokenKeyVerify();
            zn.debug('Request sessionVerify session key: ', _key);
            if(_key){
                this._serverContext._sessionContext.getSessionByKey(_key, function (session){
                    this._session = session;
                    success && success(session);
                }.bind(this), error);
            }else{
                this.getSession(function (session){
                    var _cookies = Array.from(session._cookies || []);
                    var _cookie = this._clientRequest.headers.cookie || this._clientRequest.headers.Cookie||'',
                        _ary = null;
                    for(var item of _cookie.split(';')){
                        if(item.trim()){
                            _ary = item.trim().split('=');
                            if(_cookies.indexOf(_ary[0].trim()) != -1){
                                _cookies.splice(_cookies.indexOf(_ary[0].trim()), 1);
                            }
                        }
                    }
                    if(_cookies.length){
                        error && error(new zn.ERROR.HttpRequestError({
                            code: 401,
                            message: "会话验证错误",
                            detail: "请重新登录系统。"
                        }));
                    }else{
                        this._session = session;
                        success && success(session);
                    }
                }.bind(this), function (err){
                    error && error(err || new zn.ERROR.HttpRequestError({
                        code: 405,
                        message: "401.1 未经授权",
                        detail: "访问由于凭据无效被拒绝，请先登录系统。"
                    }));
                });
            }

            return this;
        },
        hasSession: function (success, error){
            return this.getSession(success, error), this;
        },
        hasSessionCookie: function (){
            return !!this.getCookie(this._serverContext._sessionContext.getSessionKey());
        },
        getSessionConfig: function (){
            return this._serverContext._sessionContext.config;
        },
        setSession: function (session){
            return this._session = session, this;
        },
        getSession: function (success, error){
            var _context = this._serverContext._sessionContext;
            var _cookie = this.getCookie(_context.getKey());
            if(_cookie){
                _context.getSession(_cookie.getValue(), function (session){
                    this._session = session;
                    success && success(session);
                }.bind(this), error);
            }else{
                error && error();
            }

            return this;
        },
        getHeaders: function (){
            return this._clientRequest.headers;
        },
        getClientIp: function (){
            if (this._clientRequest) {
                return this._serverContext.getClientIp(this._clientRequest);
            }
        },
        __parseCookie: function (cookie){
            var _data = {},
                _temp = null,
                _cookie = cookie || '';

            _cookie && _cookie.split(';').forEach(function(temp) {
                _temp = temp.split('=');
                _data[_temp.shift().trim()] = decodeURI(_temp.join('='));
            });

            return _data;  
        },
        __initCookie: function (){
            this._cookies = [];
            var _cookie = this._clientRequest.headers.cookie || this._clientRequest.headers.Cookie||'',
                _ary = null;
            _cookie.split(';').forEach(function (item, index){
                if(item.trim()){
                    _ary = item.trim().split('=');
                    _ary[1] = (_ary[1] == null && _ary[0] != null) ? true : _ary[1];
                    this._cookies.push(new Cookie(_ary[0].trim(), _ary[1] || true));
                }
            }.bind(this));
        }
    }
});
