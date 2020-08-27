var Middleware = require('../Middleware');
var ResponseMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        }
    }
});

zn.Middleware.Response = function (meta){
    meta.TYPE = Middleware.TYPES.RESPONSE;
    return zn.Class(ResponseMiddleware, meta);
}

module.exports = ResponseMiddleware;
