var Middleware = require('../Middleware');
var ControllerMiddleware = zn.Middleware({
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

zn.Middleware.Controller = function (meta){
    meta.TYPE = Middleware.TYPES.CONTROLLER;
    return zn.Class(ControllerMiddleware, meta);
}

module.exports = ControllerMiddleware;
