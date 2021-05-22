/**
 * Created by yangyxu on 7/14/15.
 */
module.exports = zn.SessionContext('ZNSession-Memory', {
    methods: {
        init: function (config, serverContext){
            this._sessions = {};
        },
        cleanUp: function (){
            var _sessions = this._sessions,
                _session = null,
                _now = (new Date()).getTime();
            for(var key in _sessions){
                _session = _sessions[key];
                if(_session._expiresTime < _now){
                    this._sessions[_session._id] = null;
                    delete this._sessions[_session._id];
                }
            }

            return this;
        },
        getIds: function (success, error){
            return success && success(Object.keys(this._sessions)), this;
        },
        getSession: function (sessionId, success, error){
            this.cleanUp();
            var _session = this._sessions[sessionId];
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

            return this;
        },
        removeSession: function (session){
            var _sessionId = session.getId();
            var _session = this._sessions[_sessionId];
            if(_session){
                this._sessions[_sessionId] = null;
                delete this._sessions[_sessionId];
            }

            return this;
        },
        saveSession: function (session){
            return this._sessions[session.getId()] = session, this;
        },
        empty: function (){
            return this._sessions = {}, this;
        },
        size: function (success, error){
            return success && success(Object.keys(this._sessions).length), this;
        }
    }
});