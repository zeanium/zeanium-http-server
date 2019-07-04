var Controller = zn.Class({
    properties: {
        application: null,
        service: null
    },
    methods: {
        init: {
            router: null,
            auto: true,
            value: function (application){
                this._application = application;
                var Service = this.constructor.getMeta('service');
                zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.CONTROLLER, "init", [this, application]);
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
    _meta = zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.CONTROLLER, "define", [_name, _meta]) || _meta;
    return zn.Class(_name, Controller, _meta);
}

module.exports = Controller;
