var RequestMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        formParse: function (err, fields, files, request){
            
        }
    }
});

zn.Middleware.Request = function (meta){
    meta.TYPE = zn.middleware.TYPES.REQUEST;
    return zn.Class(RequestMiddleware, meta);
}

module.exports = RequestMiddleware;
