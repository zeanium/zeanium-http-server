var ApplicationMiddleware = zn.Middleware({
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

zn.Middleware.Application = function (meta){
    meta.TYPE = zn.middleware.TYPES.APPLICATION;
    return zn.Class(ApplicationMiddleware, meta);
}

module.exports = ApplicationMiddleware;
