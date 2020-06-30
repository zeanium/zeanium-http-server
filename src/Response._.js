/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var ResponseWriter = require('./Response.Writer.js');
var PACKAGE = require("../package.json");
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
        createSession: function (values, options){
            var _session = this._request.getSession(values);
            this.createCookie(this._request.getSessionConfig().name, _session.getId(), options);
            return _session;
        },
        invalidateSession: function (){
            var _session = this._request.getSession();
            if(_session) {
                _session.invalidate();
                this._cookies.push(new Cookie(this._request.getSessionConfig().name, '----', {
                    expires: -1
                }));
            }

            return this;
        },
        createCookie: function (name, value, options){
            var _config = this._request.getSessionConfig().cookie;
            var _cookie = new Cookie(name, value, zn.overwrite(options, _config));
            return this._cookies.push(_cookie), _cookie;
        },
        addCookie: function (cookie){
            if(cookie instanceof Cookie){
                this._cookies.push(cookie);
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
        getCORSHTTPHeadersSetting: function (config){
            var _headers = this._request._clientRequest.headers,
                _origin = _headers.origin || _headers.host || _headers.Host,
                _cors = config || {};
            if(this._request.application) {
                if(this._request.application.serverContext.config.cors) {
                    _cors = zn.extend({}, this._request.application.serverContext.config.cors, _cors);
                }
                if(this._request.application.config.cors){
                    _cors = zn.extend({}, this._request.application.config.cors, _cors);
                }
            }

            return zn.overwrite({
                'Access-Control-Allow-Origin': _origin,
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
                'Access-Control-Allow-Headers': 'Accept,Accept-Charset,Accept-Encoding,Accept-Language,Connection,Content-Type,Cookie,DNT,Host,Keep-Alive,Origin,Referer,User-Agent,X-CSRF-Token,X-Requested-With',
                "Access-Control-Allow-Credentials": true,
                'Access-Control-Max-Age': '3600'    //一个小时时间
            }, _cors);
        },
        getBasicHTTPHeadersSetting: function (setting){
            var _headers = this._request._clientRequest.headers,
                _cookies = this.getCookiesValue(),
                _basic = {
                    'X-Powered-By': PACKAGE.name,
                    'Server': PACKAGE.name,
                    'Server-Version': PACKAGE.version,
                    'Content-Type': (_headers["Content-Type"]||"application/json") + ';charset=' + (_headers["encoding"]||"utf-8")
                };
            if(_cookies){
                _basic['Set-Cookie'] = _cookies;
            }
            
            return zn.overwrite(_basic, setting);
        },
        setContentType: function (contentType){
            this.setHeader("Content-Type", contentType);
        },
        getContentType: function (contentType, encoding){
            return VARS.CONTENT_TYPE[contentType||"JSON"] + ";charset=" + (encoding||"utf-8");
        },
        getResponseHTTPHeaders: function (config){
            var _headers = {};
            if(this._request.serverContext.config.cors || (this._request.application && this._request.application.config.cors)){
                zn.overwrite(_headers, this.getCORSHTTPHeadersSetting());
            }
            zn.overwrite(_headers, this.getBasicHTTPHeadersSetting(), config);

            return _headers;
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
