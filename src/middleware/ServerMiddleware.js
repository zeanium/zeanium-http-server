var ServerMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (config, server){
            
        },
        started: function (config, server){
            
        }
    }
});

zn.Middleware.Server = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER;
    return zn.Class(ServerMiddleware, meta);
}

module.exports = ServerMiddleware;
