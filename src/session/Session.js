/**
 * Created by yangyxu on 7/14/15.
 */
var __deepCopy = function (source, target){
    for(var key in source){
        if(zn.is(source[key], 'plain')){
            target[key] = __deepCopy(source[key], target[key]);
        } else {
            if(source[key] !== undefined){
                target[key] = source[key];
            }
        }
    }
    return target
}
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
        interval: null,
        context: null
    },
    methods: {
        init: function (context, values){
            this._context = context;
            this.sets(zn.overwrite(values, {
                values: {},
                attributes: {},
                interval: 30 * 1000
            }));

            this._id = this.generateId();
            this._cookies = [];
            this._isNew = true;
            this._createdTime = (new Date()).getTime();
            this._expiresTime = this._createdTime + ((context.config.expires || 1800 )*1000);
            if(context){
                this._cookies.push(context.getSessionKey());
            }
            zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "initial", [context, values, this]);
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
        getData: function (){
            var _data = this.gets();
            _data.context = null;
            delete _data.context;
            return _data;
        },
        isNew: function (){
            return this._isNew;
        },
        serialize: function (){
            var _value = JSON.stringify({
                id: this._id,
                isNew: this._isNew,
                createdTime: this._createdTime,
                expiresTime: this._expiresTime,
                lastAccessedTime: this._lastAccessedTime,
                values: this._values,
                attributes: this._attributes,
                interval: this._interval,
            });
            return zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "serialize", [_value, this]) || _value;
        },
        setData: function (data){
            for(var key in data){
                if(this['_' + key] === undefined){
                    this['_' + key] = data[key];
                }else{
                    if(zn.is(this['_' + key], 'plain') && zn.is(data[key], 'plain')){
                        this['_' + key] = __deepCopy(data[key], this['_' + key]);
                    } else {
                        this['_' + key] = data[key];
                    }
                }
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
        flush: function (){

        },
        removeValue: function (name){
            this._values[name] = null;
            delete this._values;
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
        getSessionContext: function(){
            return this._context;
        },
        generateId: function (){
            var _token = this._context.sign();
            zn.trace('Session Token: ', _token);
            return zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SESSION, "generateId", [_token, this]) || _token;
        },
        updateId: function (){
            var _id = this.generateId();
            this._isNew = false;
            this._lastAccessedTime = new Date();
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
        destory: function (){
            this.invalidate();
            this.super();
        }
    }
});
