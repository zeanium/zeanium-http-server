var Middleware = require('../Middleware');
var HttpServerMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (server){
            
        },
        checkContinue: function (server){
            
        },
        checkExpectation: function (server){
            
        },
        clientError: function (server){
            
        },
        connect: function (server){
            
        },
        connection: function (server){
            
        },
        request: function (clientRequest, serverResponse, server){
            
        },
        upgrade: function (server){
            
        },
        error: function (err){
            
        },
        listening: function (){
            
        },
        close: function (server){
            
        }
    }
});

zn.Middleware.HttpServer = function (meta){
    meta.TYPE = Middleware.TYPES.HTTP_SERVER;
    return zn.Class(HttpServerMiddleware, meta);
}

module.exports = HttpServerMiddleware;
