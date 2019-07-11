/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var ResponseWriter = require('./Response.Writer.js');
var PACKAGE = require("../package.json");
var VARS = require("./static/VARS");
var Cookie = require('./session/Cookie');


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
            serverResponse.on('finish', function (){
                request.clearFiles();
            });
        },
        addCookie: function (cookie){
            if(cookie instanceof Cookie){
                this._cookies.push(cookie);
            }
            
            return this;
        },
        addServerResponseEventListener: function (event, listener, handler){
            return this._serverResponse.on.call(handler || this, event, listener), this;
        },
        getTimestamp: function (){
            this._serverResponse.currentTimestamp - this._request._clientRequest.currentTimestamp;
        },
        getCORSHTTPHeadersSetting: function (config){
            var _headers = this._request._clientRequest.headers,
                _origin = _headers.origin || _headers.host || _headers.Host;

            return zn.overwrite({
                'Access-Control-Allow-Origin': _origin,
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
                'Access-Control-Allow-Headers': 'Accept,Accept-Charset,Accept-Encoding,Accept-Language,Connection,Content-Type,Cookie,DNT,Host,Keep-Alive,Origin,Referer,User-Agent,X-CSRF-Token,X-Requested-With',
                "Access-Control-Allow-Credentials": true,
                'Access-Control-Max-Age': '3600'    //一个小时时间
            }, this._request.application.serverContext.config.cors, this._request.application.config.cors, config);
        },
        getBasicHTTPHeadersSetting: function (setting){
            var _headers = this._request._clientRequest.headers;
            return zn.overwrite({
                'X-Powered-By': PACKAGE.name,
                'Server-Version': PACKAGE.version,
                'Content-Type': (_headers["Content-Type"]||"application/json") + ';charset=' + (_headers["encoding"]||"utf-8")
            }, setting);
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
