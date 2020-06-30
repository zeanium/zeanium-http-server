var ResponseMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        }
    }
});

zn.Middleware.Response = function (meta){
    meta.TYPE = zn.middleware.TYPES.RESPONSE;
    return zn.Class(ResponseMiddleware, meta);
}

module.exports = ResponseMiddleware;
