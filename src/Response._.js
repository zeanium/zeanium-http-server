/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var ResponseWriter = require('./Response.Writer.js');
var VARS = require("./static/VARS");
var Cookie = require('./Cookie');

module.exports = zn.Class({
    mixins: [ ResponseWriter ],
    properties: {
        cookies: null,
        request: null,
        serverResponse: null
    },
    methods: {
        init: function (serverResponse, request){
            this._cookies = [];
            this._serverResponse = serverResponse;
            this._request = request;
            serverResponse.on('close', function (){
                request.clearFiles();
            });
        },
        createSession: function (props, cookies, success, error){
            return this._request.createSession(props, function (session){
                var _sessionKey = this._request._serverContext._sessionContext.getSessionKey();
                session.bindCookie(_sessionKey);
                this.createCookie(_sessionKey, session.getId());
                if(zn.is(cookies, 'object')){
                    for(var key in cookies){
                        session.bindCookie(key);
                        this.createCookie(key, cookies[key]);
                    }
                }else if(zn.is(cookies, 'array')){
                    for(var cookie of cookies){
                        session.bindCookie(cookie.name);
                        this.createCookie(cookie.name, cookie.value, cookie);
                    }
                }
                session.save();
                success && success(session);
            }.bind(this), error), this;
        },
        invalidateSession: function (success, error){
            return this._request.getSession(function (session){
                session.invalidate();
                var _cookies = session._cookies;
                var _cookie = this._request._clientRequest.headers.cookie || this._request._clientRequest.headers.Cookie||'',
                    _ary = null;
                for(var item of _cookie.split(';')){
                    if(item.trim()){
                        _ary = item.trim().split('=');
                        if(_cookies.indexOf(_ary[0].trim())!=-1){
                            this._cookies.push(new Cookie(_ary[0].trim(), '-', { expires: -1 }));
                        }
                    }
                }

                success && success(session);
            }.bind(this), error), this;
        },
        createCookie: function (name, value, options){
            var _cookie = new Cookie(name, value, zn.overwrite(options, this._request.getSessionConfig().cookie));

            return this._cookies.push(_cookie), _cookie;
        },
        removeCookie: function (name){
            var _cookie = this._request._clientRequest.headers.cookie || this._request._clientRequest.headers.Cookie || '',
                _ary = null;
            _cookie.split(';').forEach(function (item){
                if(item.trim()){
                    _ary = item.trim().split('=');
                    if(_ary[0].trim() == name) {
                        this._cookies.push(new Cookie(_ary[0].trim(), '-', { expires: -1 }));
                    }
                }
            }.bind(this));

            return this;
        },
        clearCookie: function (){
            var _cookie = this._request._clientRequest.headers.cookie || this._request._clientRequest.headers.Cookie || '',
                _ary = null;
            _cookie.split(';').forEach(function (item, index){
                if(item.trim()){
                    _ary = item.trim().split('=');
                    this._cookies.push(new Cookie(_ary[0].trim(), '-', { expires: -1 }));
                }
            }.bind(this));

            return this;
        },
        addCookie: function (cookie){
            if(cookie instanceof Cookie){
                this._cookies.push(cookie);
            }else if(typeof cookie == 'object'){
                this._cookies.push(new Cookie(cookie.name, cookie.value, cookie));
            }

            if(arguments.length > 1) {
                this._cookies.push(new Cookie(arguments[0], arguments[1], arguments[3]));
            }
            
            return this;
        },
        getCookies: function (){
            return this._cookies;
        },
        getCookiesValue: function (){
            return this._cookies.map(function (cookie){
                return cookie.serialize();
            });
        },
        addServerResponseEventListener: function (event, listener, handler){
            return this._serverResponse.on.call(handler || this, event, listener), this;
        },
        getTimestamp: function (){
            this._serverResponse.currentTimestamp - this._request._clientRequest.currentTimestamp;
        },
        setContentType: function (contentType){
            this.setHeader("Content-Type", contentType);
        },
        getContentType: function (contentType, encoding){
            return VARS.CONTENT_TYPE[contentType||"JSON"] + ";charset=" + (encoding||"utf-8");
        },
        setTimeout: function (msecs, callback){
            if(this._serverResponse.finished) return this;
            return this._serverResponse.setTimeout(msecs, callback), this;
        },
        forword: function (url, isInternal){
            if(this._serverResponse.finished) return this;

            var _clientRequest = this._request._clientRequest,
                _serverResponse = this._serverResponse;
            if(isInternal){
                url = node_path.join(this._request._application.config.deploy, url);
            }
            _clientRequest.url = node_path.normalize(url);

            return this._request._application._serverContext.accept(_clientRequest, _serverResponse), this;
        },
        redirect: function (url){
            if(this._serverResponse.finished) return this;
            this._serverResponse.statusCode = 302;
            this._serverResponse.setHeader("Location", url);
            this._serverResponse.end();
        },
        setStatus: function (code, message){
            if(this._serverResponse.finished) return this;

            var _message = message;
            if(code){
                _message = _message || VARS.HTTP_MESSAGE[code];
                this._serverResponse.statusCode = code;
            }
            if(_message){
                this._serverResponse.statusMessage = _message;
            }
            
            return this;
        },
        hasHeader: function (){
            if(this._serverResponse.finished) return;
            return this._serverResponse.hasHeader(name);
        },
        removeHeader: function (name){
            if(this._serverResponse.finished) return this;
            return this._serverResponse.removeHeader(name), this;
        },
        setHeader: function (name, value) {
            if(this._serverResponse.finished) return this;
            return this._serverResponse.setHeader(name, value), this;
        },
        setHeaders: function (headers){
            if(this._serverResponse.finished) return this;
            var _headers = headers || {};
            for(var key in _headers){
                this._serverResponse.setHeader(key, _headers[key]);
            }

            return this;
        },
        setCommonHeaders: function (){
            var _cookie = this.getCookiesValue();
            if(_cookie) {
                zn.info('[ Set-Cookie ]: ', _cookie);
                this._serverResponse.setHeader('Set-Cookie', _cookie);
            }

            return this._request._serverContext.initHttpHeaderCommonSetting(this._request._clientRequest, this._serverResponse), this;
        },
        getHeader: function (name) {
            if(this._serverResponse.finished) return;
            return this._serverResponse.getHeader(name);
        },
        getHeaders: function (){
            if(this._serverResponse.finished) return null;
            return this._serverResponse.getHeaders();
        },
        getHeaderNames: function (){
            if(this._serverResponse.finished) return null;
            return this._serverResponse.getHeaderNames();
        },
        addTrailers: function (headers){
            if(this._serverResponse.finished) return this;
            return this._serverResponse.addTrailers(headers), this;
        },
        end: function (data, encoding, callback){
            if(this._serverResponse.finished) return this;
            return this._serverResponse.end(data, encoding, callback), this;
        }
    }
});
