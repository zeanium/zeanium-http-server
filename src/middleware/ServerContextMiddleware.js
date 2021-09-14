var Middleware = require('../Middleware');
var ServerContextMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (config, serverContext){ 

        },
        loaded: function (config, server, serverContext){ 

        },
        initSessionContexts: function (sessionContexts, configs, context){

        },
        fileChanged: function (){
            
        },
        requestAcceptBefore: function (serverRequest, serverResponse){
            
        },
        accept: function (serverRequest, serverResponse){
            
        },
        requestAccept: function (serverRequest, serverResponse){
            
        },
        responseTimeout: function (serverRequest, serverResponse){
            
        },
        responseClose: function (serverRequest, serverResponse){
            
        },
        responseFinish: function (serverRequest, serverResponse){

        },
        loaded: function (route, request, response){
            
        },
        loadCompleted: function (timestamp, urls, contenxt){
            
        },
        doRoute: function (route, request, response){
            
        },
        sessionVerified: function (session, request, response){

        },
        doError: function (){

        }
    }
});

zn.Middleware.ServerContext = function (meta){
    meta.TYPE = Middleware.TYPES.SERVER_CONTEXT;
    return zn.Class(ServerContextMiddleware, meta);
}

module.exports = ServerContextMiddleware;