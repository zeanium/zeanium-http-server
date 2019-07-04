var ServerResponseMiddleware = zn.Middleware({
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
        request: function (server){
            
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

zn.Middleware.ServerResponse = function (meta){
    meta.TYPE = zn.middleware.TYPES.SERVER_RESPONSE;
    return zn.Class(ServerResponseMiddleware, meta);
}

module.exports = ServerResponseMiddleware;
