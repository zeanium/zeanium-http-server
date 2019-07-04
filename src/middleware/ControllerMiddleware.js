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
    meta.TYPE = zn.middleware.TYPES.CONTROLLER;
    return zn.Class(ControllerMiddleware, meta);
}

module.exports = ControllerMiddleware;
