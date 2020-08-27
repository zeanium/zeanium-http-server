var Middleware = require('../Middleware');
var SessionMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (context, values, session){
            
        },
        generateId: function (id, session){
            
        },
        updateId: function (id, session){

        },
        updateExpiresTime: function (time, session){
            
        },
        invalidate: function (session){

        }
    }
});

zn.Middleware.Session = function (meta){
    meta.TYPE = Middleware.TYPES.SESSION;
    return zn.Class(SessionMiddleware, meta);
}

module.exports = SessionMiddleware;