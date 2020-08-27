var Middleware = require('../Middleware');
var ApplicationMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (application, config, context){
            
        },
        loaded: function (application, config, context){
            
        },
        initControllers: function (application, controllers){

        },
        initRoutes: function (application, routers){

        }
    }
});

zn.Middleware.Application = function (meta){
    meta.TYPE = Middleware.TYPES.APPLICATION;
    return zn.Class(ApplicationMiddleware, meta);
}

module.exports = ApplicationMiddleware;
