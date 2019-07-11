module.exports = zn.Class({
    properties: {
        name: null,
        value: null,
        domain: null,
        path: '/',
        expires: null,
        maxAge: null,
        size: null,
        HTTP: false,
        httpOnly: false,
        secure: false,
        sameSite: null,
        comment: null
    },
    methods: {
        init: function (name, value, options){
            this._name = name;
            this._value = value;
            this.sets(options);
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
        setHTTP: function (HTTP){
            return this._HTTP = HTTP, this;
        },
        getHTTP: function (){
            return this._HTTP;
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
        setComment: function (comment){
            return this._comment = comment, this;
        },
        getComment: function (){
            return this._comment;
        },
        serialize: function (){
            var _pairs = [this._name + '=' + encodeURIComponent(this._value)];
            
            if (this._domain) _pairs.push('Domain=' + this._domain);
            if (this._path) _pairs.push('Path=' + this._path);
            if (this._expires) _pairs.push('Expires=' + (new Date(this._expires).toISOString()));
            if (this._maxAge) _pairs.push('Max-Age=' + this._maxAge);
            if (this._size) _pairs.push('Size=' + this._size);
            if (this._HTTP) _pairs.push('HTTP');
            if (this._httpOnly) _pairs.push('HttpOnly');
            if (this._secure) _pairs.push('Secure');
            if (this._sameSite) _pairs.push('SameSite=' + this._sameSite);
            if (this._comment) _pairs.push('Comment=' + this._comment);

            return _pairs.join('; ');
        }
    }
});
