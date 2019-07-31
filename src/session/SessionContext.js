/**
 * Created by yangyxu on 7/14/15.
 */
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
                this._serverContext = serverContext;
            }
        },
        getIds: function (){
            throw new Error("The Method Has's Implement.");
        },
        getSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        createSession: function (){
            throw new Error("The Method Has's Implement.");
        },
        removeSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        updateSession: function (sessionId){
            throw new Error("The Method Has's Implement.");
        },
        cleanUp: function (){
            throw new Error("The Method Has's Implement.");
        },
        empty: function (){
            throw new Error("The Method Has's Implement.");
        },
        size: function (){
            throw new Error("The Method Has's Implement.");
        },
        __newSession: function (values){
            return this._current = new Session(this, values), this._current;
        }
    }
});

zn.SessionContext = function (meta){
    return zn.Class(SessionContext, meta);
}

module.exports = SessionContext;
