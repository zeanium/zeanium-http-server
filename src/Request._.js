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
        session: null,
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
        sessionVerify: function (success, error){
            this.getSession(null, function (session){
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
                        code: 403,
                        message: "Session Verify Error.",
                        detail: "Session Verify Error, You Need Relogin."
                    }));
                }else{
                    this._session = session;
                    success && success(session);
                }
            }.bind(this), function (){
                error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "Unauthorized.",
                    detail: "Unauthorized, You Need Login Into System First."
                }));
            });

            return this;
        },
        hasSession: function (success, error){
            return this.getSession(null, success, error), this;
        },
        hasSessionCookie: function (){
            return !!this.getCookie(this._serverContext._sessionContext.getSessionKey());
        },
        getSessionConfig: function (){
            return this._serverContext._sessionContext.config;
        },
        getSession: function (props, success, error){
            var _context = this._serverContext._sessionContext;
            var _cookie = this.getCookie(_context.getSessionKey());
            if(_cookie){
                _context.getSession(_cookie.getValue(), function (session){
                    if(session && props) {
                        session.setProps(props);
                    }
                    this._session = session;
                    success && success(session);
                }.bind(this), error);
            }else if(props){
                this._session = _context.createSession(props, success, error);
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
                    this._cookies.push(new Cookie(_ary[0].trim(), _ary[1].trim()));
                }
            }.bind(this));
        }
    }
});
