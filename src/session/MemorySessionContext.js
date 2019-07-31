/**
 * Created by yangyxu on 7/14/15.
 */
module.exports = zn.SessionContext({
    methods: {
        init: function (config, serverContext){
            this._sessions = {};
            this.super(config, serverContext);
        },
        createSession: function (values){
            var _session = this.__newSession(values);
            this._sessions[_session.getId()] = _session;
            return _session;
        },
        getIds: function (){
            return Object.keys(this._sessions);
        },
        getSession: function (sessionId){
            this.cleanUp();
            var _session = this._sessions[sessionId];
            if(_session){
                _session.updateExpiresTime();
            }

            return _session;
        },
        removeSession: function (sessionId){
            var _session = this._sessions[sessionId];
            if(_session){
                this._sessions[sessionId] = null;
                delete this._sessions[sessionId];
            }
            return _session;
        },
        updateSessionId: function (sessionId){
            var _session = this.getSession(sessionId);
            if(_session){
                _session.updateId();
            }

            return _session;
        },
        updateSessionExpiresTime: function (sessionId){
            var _session = this.getSession(sessionId);
            if(_session){
                _session.updateExpiresTime();
            }

            return _session;
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
        },
        empty: function (){
            this._sessions = {};
        },
        size: function (){
            Object.keys(this._sessions).length;
        }
    }
});