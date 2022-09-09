/**
 * Created by yangyxu on 7/14/15.
 */
module.exports = zn.SessionContext('ZNSession-Memory', {
    methods: {
        init: function (config, serverContext){
            this._sessions = {};
            setInterval(()=>this.cleanUp(), 1000 * 60 * 10);
        },
        cleanUp: function (success, error){
            var _sessions = this._sessions,
                _session = null,
                _now = (new Date()).getTime();
            for(var key in _sessions){
                _session = _sessions[key];
                if(_session._expiresTime < _now){
                    this._sessions[key] = null;
                    delete this._sessions[key];
                }
            }

            success && success();

            return this;
        },
        removeSession: function (session){
            var _sessionKey = session.getKey();
            var _session = this._sessions[_sessionKey];
            if(_session){
                this._sessions[_sessionKey] = null;
                delete this._sessions[_sessionKey];
            }

            return this;
        },
        saveSession: function (session){
            return this._sessions[session.getKey()] = session, this;
        },
        getIds: function (success, error){
            var _ids = [];
            for(var key in this._sessions) {
                _ids.push(this._sessions[key]._id);
            }
            return success && success(_ids), _ids;
        },
        getKeys: function (success, error){
            var _keys = Object.keys(this._sessions);

            return success && success(_keys), _keys;
        },
        getSession: function (sessionKey, success, error){
            var _session = this._sessions[sessionKey];
            if(_session){
                _session.updateExpiresTime();
                _session.save();
                success && success(_session);
            }else{
                error && error(new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "401.1 Token失效",
                    detail: "登录Token已经过期失效。"
                }));
            }

            return _session;
        },
        getSessionByKey: function (sessionKey, success, error){
            var _session = this._sessions[sessionKey];
            if(_session){
                _session.updateExpiresTime();
                _session.save();
                success && success(_session);
            }else{
                error && error(new Error('session key : ' + sessionKey + ' is not exist!'));
            }
        },
        getSessionById: function (sessionId, success, error){
            var _session = null;
            for(var _key in this._sessions) {
                _session = this._sessions[_key];
                if(_session && _session._id == sessionId) {
                    return success && success(_session), _session;
                }
            }
            
            error && error(new Error('session id : ' + sessionId + ' is not exist!'));
        },
        validateSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        empty: function (){
            return this._sessions = {}, this;
        },
        size: function (success, error){
            return success && success(Object.keys(this._sessions).length), this;
        }
    }
});