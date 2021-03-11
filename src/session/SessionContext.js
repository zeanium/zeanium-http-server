/**
 * Created by yangyxu on 7/14/15.
 */
var node_crypto = require('crypto');
var node_jwt = require('jsonwebtoken');
var Session = require('./Session');
var SessionContext = zn.Class({
    properties: {
        key: null,
        config: null,
        serverContext: null
    },
    methods: {
        init: {
            auto: true,
            value: function (config, serverContext){
                this._key = config.key ? config.key : this.constructor.getMeta('key');
                this._config = config;
                this._secret = this._config.secret || 'zeanium-http-server';
                this._serverContext = serverContext;
            }
        },
        setKey: function (key){
            return this._key = key, this;
        },
        getKey: function (){
            return this._key;
        },
        setServerContext: function (serverContext){
            return this._serverContext = serverContext, this;
        },
        setConfig: function (config){
            return this._config = config, this;
        },
        jwtSign: function (data, secret, options, callback){
            var _secret = secret || this._secret;
            return node_jwt.sign({
                data: data
            }, _secret, zn.extend({ 
                expiresIn: this._config.expires || 60 * 60 * 60 * 24 
            }, options), callback);
        },
        jwtVerifyToken: function (token, secret, options, callback){
            return node_jwt.verify(token, secret || this._secret, zn.extend({ typ: 'JWT' }, options), callback);
        },
        jwtDecode: function (token){
            return node_jwt.decode(token);
        },
        cryptoSign: function (data, options){
            var _options = zn.extend({ secret: this._secret }, options),
                _nowstring = (new Date()).valueOf().toString(),
                _random = Math.random().toString();
            return node_crypto.createHash('sha1').update(_nowstring + _random + _options.secret + (typeof data == 'object' ? JSON.stringify(data) : data.toString())).digest('hex');
        },
        sign: function (data, options){
            if(!data){
                throw new Error('SessionContext sign method, the data is not exist.');
            }
            var _token = '',
                _type = this._config.signature || 'jwt';
            switch(_type) {
                case 'crypto_hash':
                    _token = this.cryptoSign(data, options);
                    break;
                case 'jwt':
                    _token = this.jwtSign(data, options);
                    break;
            }

            return _token;
        },
        newSession: function (props){
            return new Session(props, this);
        },
        createSession: function (props, callback){
            var _session = this.newSession(props);
            _session.initialize();
            return callback && callback(_session), _session;
        },
        getIds: function (){
            throw new Error("The Method Has's Implement.");
        },
        getSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        getSessionByKey: function (sessionKey){
            throw new Error("The Method Has's Implement.");
        },
        removeSession: function (session){
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
        _meta.key = _args[0];
    }

    return zn.Class(SessionContext, _meta);
}

module.exports = SessionContext;
