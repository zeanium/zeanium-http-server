var Controller = zn.Class({
    properties: {
        serverContext: null,
        application: null,
        service: null
    },
    methods: {
        init: {
            router: null,
            auto: true,
            value: function (serverContext, application){
                this._serverContext = serverContext;
                this._application = application;
                var Service = this.constructor.getMeta('service');
                zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.CONTROLLER, "initial", [this, application, serverContext]);
                if(Service){
                    this._service = new Service(this, application);
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
