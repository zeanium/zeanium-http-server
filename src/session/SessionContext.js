/**
 * Created by yangyxu on 7/14/15.
 */
var node_crypto = require('crypto');
var node_jwt = require('jsonwebtoken');
var Session = require('./Session');
var SessionContext = zn.Class({
    properties: {
        config: null,
        current: null,
        serverContext: null
    },
    methods: {
        init: {
            auto: true,
            value: function (config, serverContext){
                this._config = config;
                this._secret = this._config.secret || 'zeanium-http-server';
                this._serverContext = serverContext;
            }
        },
        getSessionKey: function (){
            var _key = this._config.name;
            if(!_key) {
                _key = this.constructor.getMeta('sessionKey');
            }

            return _key;
        },
        setServerContext: function (serverContext){
            return this._serverContext = serverContext, this;
        },
        setConfig: function (config){
            return this._config = config, this;
        },
        jwtSign: function (data, expiresIn, secret){
            var _secret = secret || this._secret,
                _expires = expiresIn || this._config.expires || 60 * 60 * 60 * 24;
            return node_jwt.sign({
                data: data
            }, _secret, { 
                expiresIn: _expires 
            });
        },
        jwtVerifyToken: function (token, secret){
            return node_jwt.verify(token, secret || this._secret);
        },
        cryptoSign: function (data, secret){
            var _secret = secret || this._secret,
                _currDate = (new Date()).valueOf().toString(),
                _random = Math.random().toString();
            return node_crypto.createHash('sha1').update(_currDate + _random + _secret + (typeof data == 'object' ? JSON.stringify(data) : data.toString())).digest('hex');
        },
        sign: function (data, expiresIn){
            var _token = '',
                _type = this._config.signature || 'jwt',
                _data = data || this.getSessionKey();
            if(_type=='crypto_hash'){
                _token = this.cryptoSign(_data);
            }else if(_type == 'jwt'){
                _token = this.jwtSign(_data, expiresIn);
            }

            return _token;
        },
        newSession: function (){
            return this._current = new Session(this), this._current;
        },
        createSession: function (props, callback){
            var _session = this.newSession();
            _session.setProps(props);
            _session.initialize();
            return callback && callback(_session), _session;
        },
        getIds: function (){
            throw new Error("The Method Has's Implement.");
        },
        getSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        removeSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        updateSessionId: function (sessionId, success, error){
            this.getSession(sessionId, function (session){
                session.updateId();
                session.save();
                success && success(session);
            }, error);

            return this;
        },
        updateSessionExpiresTime: function (sessionId, success, error){
            this.getSession(sessionId, function (session){
                session.updateExpiresTime();
                session.save();
                success && success(session);
            }, error);

            return this;
        },
        validateSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        saveSession: function (){
            throw new Error("The Method Has's Implement.");
        },
        empty: function (){
            throw new Error("The Method Has's Implement.");
        },
        size: function (){
            throw new Error("The Method Has's Implement.");
        }
    }
});

zn.SessionContext = function (){
    var _args = arguments,
        _meta = {};
    if(_args.length == 1){
        _meta = _args[0];
    }

    if(_args.length == 2){
        _meta = _args[1] || {};
        _meta.sessionKey = _args[0];
    }

    return zn.Class(SessionContext, _meta);
}

module.exports = SessionContext;
