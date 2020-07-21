/**
 * Created by yangyxu on 8/20/14.
 */
var RequestReader = require('./Request.Reader');
var Cookie = require('./Cookie');

module.exports = zn.Class({
    mixins: [ RequestReader ],
    properties: {
        application: null,
        clientRequest: null,
        serverContext: null,
        cookies: null
    },
    methods: {
        init: function (clientRequest, application, serverContext){
            this._clientRequest = clientRequest;
            this._application = application,
            this._serverContext = serverContext;
            this.__initCookie();
        },
        getContextPath: function (){
            return this._serverContext._webRoot;
        },
        addClientRequestEventListener: function (event, listener, handler){
            return this._clientRequest.on.call(handler || this._clientRequest, event, listener), this;
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
        sessionVerify: function (){
            var _session = this.getSession();
            if(_session) {
                var _cookies = Array.from(_session._cookies || []);
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
                    return false;
                }else{
                    return true;
                }
            }

            return false;
        },
        hasSession: function (){
            return !!this.getSession();
        },
        hasSessionCookie: function (){
            var _context = this._serverContext._sessionContext,
                _config = _context.config;
            return !!this.getCookie(_config.name);
        },
        getSessionConfig: function (){
            return this._serverContext._sessionContext.config;
        },
        createSession: function (values){
            return this._serverContext._sessionContext.createSession(values);
        },
        getSession: function (values){
            var _context = this._serverContext._sessionContext,
                _session = null;

            var _cookie = this.getCookie(_context.getSessionKey());
            if(_cookie){
                _session = _context.getSession(_cookie.getValue());
                if(_session){
                    _session.setData(values);
                    return _session;
                }
            }

            if(values){
                return _context.createSession(values);
            }
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
                    this._cookies.push(new Cookie(_ary[0].trim(), _ary[1].trim()));
                }
            }.bind(this));
        }
    }
});
