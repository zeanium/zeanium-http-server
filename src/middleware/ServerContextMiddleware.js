var ServerContextMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        fileChanged: function (server){
            
        },
        requestAccept: function (serverRequest, serverResponse){
            
        }
    }
});

zn.Middleware.ServerContext = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER_CONTEXT;
    return zn.Class(ServerContextMiddleware, meta);
}

module.exports = ServerContextMiddleware;
