var Controller = zn.Class({
    properties: {
        context: null,
        application: null,
        service: null
    },
    methods: {
        init: {
            router: null,
            auto: true,
            value: function (context, application){
                this._context = context;
                this._application = application;
                zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.CONTROLLER, "initial", [this, application, context]);
                var Service = this.constructor.getMeta('service');
                if(Service){
                    this._service = new Service(this, application, context);
                }
            }
        }
    }
});

zn.Controller = function (){
    var _args = arguments,
        _name = _args[0],
        _meta = _args[1];

    _meta.controller = _name;
    zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.CONTROLLER, "define", [_name, _meta]);
    
    return zn.Class(_name, Controller, _meta);
}

module.exports = Controller;
