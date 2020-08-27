var Middleware = require('../Middleware');
var CookieMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (name, value, options, cookie){
            
        },
        serialize: function (props, cookie){
            
        },
        serialized: function (pairs, props, cookie){
            
        }
    }
});

zn.Middleware.Cookie = function (meta){
    meta.TYPE = Middleware.TYPES.COOKIE;
    return zn.Class(CookieMiddleware, meta);
}

module.exports = CookieMiddleware;