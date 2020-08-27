var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
var Middleware = require('./Middleware');
module.exports = zn.Class({
    properties: {
        name: null,
        value: null,
        domain: null,
        path: '/',
        expires: 1800,
        maxAge: 0,
        size: null,
        httpOnly: true,
        secure: false,
        sameSite: null,
        priority: 'Medium',
        comment: null,
        data: null
    },
    methods: {
        init: function (name, value, options){
            this._name = name;
            this._value = value;
            this.sets(options);
            Middleware.callMiddlewareMethod(Middleware.TYPES.COOKIE, "initial", [name, value, options, this]);
        },
        setName: function (name){
            return this._name = name, this;
        },
        getName: function (){
            return this._name;
        },
        setValue: function (value){
            return this._value = value, this;
        },
        getValue: function (){
            return this._value;
        },
        setDomain: function (domain){
            return this._domain = domain, this;
        },
        getDomain: function (){
            return this._domain;
        },
        setPath: function (path){
            return this._path = path, this;
        },
        getPath: function (){
            return this._path;
        },
        setExpires: function (expires){
            return this._expires = expires, this;
        },
        getExpires: function (){
            return this._expires;
        },
        setMaxAge: function (maxAge){
            return this._maxAge = maxAge, this;
        },
        getMaxAge: function (){
            return this._maxAge;
        },
        setSize: function (size){
            return this._size = size, this;
        },
        getSize: function (){
            return this._size;
        },
        setHttpOnly: function (httpOnly){
            return this._httpOnly = httpOnly, this;
        },
        getHttpOnly: function (){
            return this._httpOnly;
        },
        setSecure: function (secure){
            return this._secure = secure, this;
        },
        getSecure: function (){
            return this._secure;
        },
        setSameSite: function (sameSite){
            return this._sameSite = sameSite, this;
        },
        getSameSite: function (){
            return this._sameSite;
        },
        setPriority: function (priority){
            return this._priority = priority, this;
        },
        getPriority: function (){
            return this._priority;
        },
        setComment: function (comment){
            return this._comment = comment, this;
        },
        getComment: function (){
            return this._comment;
        },
        setData: function (data){
            return this._data = data, this;
        },
        getData: function (){
            return this._data;
        },
        __getSameSite: function (sameSite){
            var _sameSite = typeof sameSite === 'string' ? sameSite.toLowerCase() : sameSite;
            switch(_sameSite){
                case true:
                    return 'SameSite=Strict';
                case 'lax':
                    return 'SameSite=Lax';
                case 'strict':
                    return 'SameSite=Strict';
                case 'none':
                    return 'SameSite=None';
                default:
                    return '';
            }
        },
        invalid: function (){
            this._value = '';
            this._expires = new Date(0);
        },
        serialize: function (){
            var _props = this.gets();
            Middleware.callMiddlewareMethod(Middleware.TYPES.COOKIE, "serialize", [_props, this]);
            var _pairs = [_props.name + '=' + encodeURIComponent(_props.value)];
            if (_props.data) {
                zn.each(_props.data, function (value, key){
                    _pairs.push(key + "=" + value);
                });
            }
            if(_props.expires) {
                var _now = new Date();
                _now.setTime(_now.getTime() + (Math.floor(_props.expires) * 1000));
                _props.expires = _now;
            }
            if (_props.domain) _pairs.push('Domain=' + _props.domain);
            if (_props.path) _pairs.push('Path=' + _props.path);
            if (_props.expires) _pairs.push('Expires=' + _props.expires.toGMTString());
            if (_props.maxAge) _pairs.push('Max-Age=' + Math.floor(_props.maxAge));
            if (_props.size) _pairs.push('Size=' + _props.size);
            if (_props.httpOnly) _pairs.push('HttpOnly');
            if (_props.secure) _pairs.push('Secure');
            if (_props.sameSite) _pairs.push(this.__getSameSite(_props.sameSite));
            if (_props.priority) _pairs.push('Priority=' + _props.priority);
            if (_props.comment) _pairs.push('Comment=' + _props.comment);

            return Middleware.callMiddlewareMethod(Middleware.TYPES.COOKIE, "serialized", [_pairs, _props, this]) || _pairs.join('; ');
        }
    }
});
