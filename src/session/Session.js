/**
 * Created by yangyxu on 7/14/15.
 */
var Middleware = require('../Middleware');
var DURATION = 60 * 60 * 24;
module.exports = zn.Class({
    properties: {
        id: null,
        key: null,
        isNew: true,
        values: null,
        attributes: null,
        cookies: null,
        context: null,
        expires: DURATION,
        interval: 30 * 1000,
        createdTime: null,
        expiresTime: null,
        lastAccessedTime: null
    },
    methods: {
        init: function (props, context){
            this._values = {};
            this._attributes = {};
            this._cookies = [];
            this.sets(props);
            if(context){
                this._context = context;
                this._expires = (context._config.expires || DURATION) * 1000;
            }
            
            Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "initial", [context, this]);
        },
        initialize: function (){
            this._id = this.generateId();
            this._isNew = true;
            this._createdTime = (new Date()).getTime();
            this._expiresTime = this._createdTime + this._expires;
        },
        save: function (){
            return this._context.saveSession(this), this;
        },
        setSessionContext: function(context){
            return this._context = context;
        },
        getSessionContext: function(){
            return this._context;
        },
        setProps: function (props){
            this.sets(props);
        },
        getProps: function (){
            return {
                id: this._id,
                key: this._key,
                isNew: this._isNew,
                cookies: this._cookies,
                values: this._values,
                attributes: this._attributes,
                createdTime: this._createdTime,
                expiresTime: this._expiresTime,
                lastAccessedTime: this._lastAccessedTime
            };
        },
        bindCookie: function (name){
            if(this._cookies.indexOf(name) == -1){
                this._cookies.push(name)
            }

            return this;
        },
        unbindCookie: function (name){
            if(this._cookies.indexOf(name) != -1){
                this._cookies = this._cookies.filter((cookie)=>!cookie==name);
            }

            return this;
        },
        setId: function (id){
            if(id) {
                this._id = id;
            }

            return this;
        },
        getId: function (){
            return this._id;
        },
        setKey: function (key){
            if(key) {
                this._key = key;
            }

            return this;
        },
        getKey: function (){
            return this._key;
        },
        getCreatedTime: function (){
            return this._createdTime;
        },
        getLastAccessedTime: function (){
            return this._lastAccessedTime;
        },
        putValue: function (name, value){
            return this._values[name] = value, this;
        },
        setValues: function (values){
            for(var key in values){
                this._values[key] = values[key];
            }

            return this;
        },
        getValue: function (name){
            return this._values[name];
        },
        getValueNames: function (){
            return Object.keys(this._values);
        },
        getValues: function (){
            return this._values;
        },
        removeValue: function (name){
            this._values[name] = null;
            delete this._values[name];
            return this;
        },
        setAttribute: function (name, value) {
            return this._attributes[name] = value, this;
        },
        setAttributes: function (data){
            for(var key in data){
                this._attributes[key] = data[key];
            }

            return this;
        },
        getAttribute: function (name){
            return this._attributes[name];
        },
        getAttributes: function (){
            return this._attributes;
        },
        getAttributeNames: function (){
            return Object.keys(this._attributes);
        },
        getAttributeValues: function (){
            return Object.values(this._attributes);
        },
        removeAttribute: function (name){
            this._attributes[name] = null;
            delete this._attributes[name];
            return this;
        },
        setMaxInactiveInterval: function (interval){
            return this._interval = interval, this;
        },
        getMaxInactiveInterval: function (){
            return this._interval;
        },
        generateId: function (key){
            var _token = this._context.sign(key || this._key);
            zn.trace('[ Session Token ]: ', {
                id: _token,
                key: this._key
            });

            return Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "generateId", [_token, this]) || _token;
        },
        updateId: function (){
            var _id = this.generateId();
            this._isNew = false;
            this._lastAccessedTime = (new Date()).getTime();
            this._id = Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "updateId", [_id, this]) || _id;

            return this._id;
        },
        updateExpiresTime: function (){
            var _date = (new Date()).getTime(),
                _time = _date + this._expires;
            this._isNew = false;
            this._lastAccessedTime = _date;
            this._expiresTime = Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "updateExpiresTime", [_time, this]) || _time;

            return this._expiresTime;
        },
        invalidate: function (){
            this._expiresTime = (new Date()).getTime() - 1;
            this._context.removeSession(this);
            Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "invalidate", [this]);
        },
        isNew: function (){
            return this._isNew;
        },
        serialize: function (){
            var _value = JSON.stringify(this.getProps());
            return Middleware.callMiddlewareMethod(Middleware.TYPES.SESSION, "serialize", [_value, this]) || _value;
        },
        destory: function (){
            this.invalidate();
            this.super();
        }
    }
});
