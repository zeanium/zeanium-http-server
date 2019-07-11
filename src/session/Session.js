/**
 * Created by yangyxu on 7/14/15.
 */
var node_crypto = require('crypto');
module.exports = zn.Class({
    properties: {
        id: null,
        name: null,
        cookie: null
    },
    methods: {
        init: function (name, cookie){
            this._createdTime = new Date();
            this._name = name;
            this._cookie = cookie||{};
            this._data = {};
            this._id = this.generateId();
        },
        clear: function (){
            this._data = {};
            this._cookie.expires = this._expiresTime = this._createdTime.getTime() - 1;
        },
        setCookie: function (key, value){
            this._cookie[key] = value;
        },
        getCreatedTime: function (){
            return this._createdTime;
        },
        getLastAccessedTime: function (){
            return this._updatedTime;
        },
        getExpiresTime: function (){
            return this._expiresTime;
        },
        getId: function (){
            return this._id;
        },
        setAttribute: function () {

        },
        getAttribute: function (){

        },
        setItem: function (name, value){
            this._data[name] = value;
        },
        getItem: function (name){
            return this._data[name];
        },
        getItems: function (){
            return this._data;
        },
        getKeys: function (){
            return Object.keys(this._data);
        },
        hasItem: function (){
            return !!this.getKeys().length;
        },
        isNew: function (){
            return !!!this._updatedTime;
        },
        generateId: function (){
            var _currDate = (new Date()).valueOf().toString(),
                _random = Math.random().toString();
            if(this._cookie.maxAge){
                this._expiresTime = (new Date()).getTime() + this._cookie.maxAge;
            }

            return node_crypto.createHash('sha1').update(_currDate + _random).digest('hex');
        },
        updateId: function (){
            this._id = this.generateId();
            this._updatedTime = new Date();
        }
    }
});
