var SessionContextMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        loadControllers: function (Controllers, context){
            
        }
    }
});

zn.Middleware.SessionContext = function (meta){
    meta.TYPE = zn.middleware.TYPES.SESSION_CONTEXT;
    return zn.Class(SessionContextMiddleware, meta);
}

module.exports = SessionContextMiddleware;