var ServerContextMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        fileChanged: function (){
            
        },
        requestAccept: function (serverRequest, serverResponse){
            
        },
        doRouter: function (router, request, response){
            
        }
    }
});

zn.Middleware.ServerContext = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER_CONTEXT;
    return zn.Class(ServerContextMiddleware, meta);
}

module.exports = ServerContextMiddleware;
