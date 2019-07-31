var SessionMiddleware = zn.Middleware({
    methods: {
        init: function (argv){
            this.super(argv);
        },
        initial: function (context, values, session){
            
        },
        generateId: function (id, session){
            
        }
    }
});

zn.Middleware.Session = function (meta){
    meta.TYPE = zn.middleware.TYPES.SESSION;
    return zn.Class(SessionMiddleware, meta);
}

module.exports = SessionMiddleware;