var ServerMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (server){
            
        },
        loaded: function (server){
            
        }
    }
});

zn.Middleware.Server = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER;
    return zn.Class(ServerMiddleware, meta);
}

module.exports = ServerMiddleware;
