var Middleware = require('../Middleware');
var ModelMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        define: function (meta){
            
        },
        initial: function (model){
            
        },
        loaded: function (key, model, application, context){
            
        }
    }
});

zn.Middleware.Model = function (meta){
    meta.TYPE = Middleware.TYPES.MODEL;
    return zn.Class(ModelMiddleware, meta);
}

module.exports = ModelMiddleware;