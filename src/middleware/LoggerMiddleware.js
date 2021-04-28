var Middleware = require('../Middleware');
var LoggerMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        error: function (value, logger, context){
            
        },
        route: function (value, logger, context){
            
        },
        request: function (value, logger, context){

        },
        requestcount: function (value, logger, context){

        },
        requeststatus: function (value, logger, context){

        }
    }
});

zn.Middleware.Logger = function (meta){
    meta.TYPE = Middleware.TYPES.LOGGER;
    return zn.Class(LoggerMiddleware, meta);
}

module.exports = LoggerMiddleware;
