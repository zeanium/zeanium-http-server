var Middleware = require('./Middleware');
var Service = zn.Class({
    properties: {
        context: null,
        application: null
    },
    methods: {
        init: {
            router: null,
            auto: true,
            value: function (context, application){
                this._context = context;
                this._application = application;
                Middleware.callMiddlewareMethod(Middleware.TYPES.SERVICE, "initial", [this, application, context]);
            }
        }
    }
});

zn.Service = function (){
    var _args = arguments,
        _name = _args[0],
        _meta = _args[1];

    _meta.service = _name;
    Middleware.callMiddlewareMethod(Middleware.TYPES.SERVICE, "define", [_name, _meta]);
    
    return zn.Class(Service, _meta);
}

module.exports = Service;
