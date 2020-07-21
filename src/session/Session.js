/**
 * Created by yangyxu on 7/14/15.
 */
module.exports = zn.Class({
    properties: {
        id: null,
        isNew: null,
        createdTime: null,
        expiresTime: null,
        lastAccessedTime: null,
        values: null,
        attributes: null,
        cookies: null,
        interval: 30 * 1000,
        context: null
    },
    methods: {
        init: function (context){
            this._values = {};
            this._attributes = {};
            this._cookies = [];
            this._context = context;
            if(context){
                this._cookies.push(context.getSessionKey());
            }
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "initial", [context, this]);
        },
        initialize: function (){
            this._id = this.generateId();
            this._isNew = true;
            this._createdTime = (new Date()).getTime();
            this._expiresTime = this._createdTime + ((this._context.config.expires || 1800 ) * 1000);
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
                isNew: this._isNew,
                cookies: this._cookies,
                createdTime: this._createdTime,
                expiresTime: this._expiresTime,
                lastAccessedTime: this._lastAccessedTime,
                values: this._values,
                attributes: this._attributes,
                interval: this._interval,
            };
        },
        bindCookie: function (name){
            if(!this._isNew) return this;
            if(this._cookies.indexOf(name) == -1){
                this._cookies.push(name)
            }

            return this;
        },
        unbindCookie: function (name){
            if(!this._isNew) return this;
            if(this._cookies.indexOf(name) != -1){
                this._cookies = this._cookies.filter((cookie)=>!cookie==name);
            }

            return this;
        },
        getId: function (){
            return this._id;
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
        generateId: function (){
            var _token = this._context.sign();
            zn.trace('Session Token: ', _token);
            return zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "generateId", [_token, this]) || _token;
        },
        updateId: function (){
            var _id = this.generateId();
            this._isNew = false;
            this._lastAccessedTime = (new Date()).getTime();
            this._id = zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "updateId", [_id, this]) || _id;

            return this._id;
        },
        updateExpiresTime: function (){
            var _date = (new Date()).getTime(),
                _time = _date + (this._context._config.timeout * 1000);
            this._isNew = false;
            this._lastAccessedTime = _date;
            this._expiresTime = zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "updateExpiresTime", [_time, this]) || _time;
            return this._expiresTime;
        },
        invalidate: function (){
            this._expiresTime = (new Date()).getTime() - 1;
            this._context.removeSession(this._id);
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "invalidate", [this]);
        },
        isNew: function (){
            return this._isNew;
        },
        serialize: function (){
            var _value = JSON.stringify(this.getProps());
            return zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "serialize", [_value, this]) || _value;
        },
        destory: function (){
            this.invalidate();
            this.super();
        }
    }
});
