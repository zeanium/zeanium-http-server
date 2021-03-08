var Middleware = require('./Middleware');
var ControllerService = require('./ControllerService');
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
                Middleware.callMiddlewareMethod(Middleware.TYPES.CONTROLLER, "initial", [this, application, context]);
                var Service = this.constructor.getMeta('Service');
                var _mixins = this.constructor.getMeta('mixins') || [], 
                    _service = null,
                    _Service = null,
                    _Services = [];

                _mixins.filter(function (mixin){
                    _Service = mixin.getMeta('Service');
                    if(_Service){
                        if(zn.is(_Service, 'array')){
                            _Services = _Services.concat(_Service);
                        }else if(zn.is(_Service, 'function')){
                            if(_Service._id_){
                                _Services.push(_Service);
                            }else{
                                _Services.push(_Service(this, application, context))
                            }
                        }
                    }
                });

                if(Service){
                    if(zn.is(Service, 'array')){
                        _Services = _Services.concat(Service);
                    }else if(zn.is(Service, 'function')){
                        if(Service._id_){
                            _Services.push(Service);
                        }else{
                            _Services.push(Service(this, application, context))
                        }
                    }
                }

                if(_Services.length){
                    var _ServiceClass = zn.ControllerService({ mixins: _Services });
                    _service = new _ServiceClass(this, application, context);
                }else{
                    _service = new ControllerService(this, application, context);
                }

                this._service = _service;
            }
        }
    }
});

zn.Controller = function (){
    var _args = arguments,
        _name = _args[0],
        _meta = _args[1];

    _meta.controller = _name;
    Middleware.callMiddlewareMethod(Middleware.TYPES.CONTROLLER, "define", [_name, _meta]);
    
    return zn.Class(_name, Controller, _meta);
}

module.exports = Controller;
