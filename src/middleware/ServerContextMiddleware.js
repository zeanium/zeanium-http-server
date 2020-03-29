var ServerContextMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        fileChanged: function (){
            
        },
        requestAcceptBefore: function (serverRequest, serverResponse){
            
        },
        requestAccept: function (serverRequest, serverResponse){
            
        },
        doRoute: function (route, request, response){
            
        },
        loaded: function (route, request, response){
            
        },
        loadCompleted: function (timestamp, urls, contenxt){
            
        }
    }
});

zn.Middleware.ServerContext = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER_CONTEXT;
    return zn.Class(ServerContextMiddleware, meta);
}

module.exports = ServerContextMiddleware;
