var ControllerService = zn.Class({
    properties: {
        application: null,
        controller: null,
        context: null
    },
    methods: {
        init: {
            auto: true,
            value: function (controller, application, context){
                this._application = application;
                this._controller = controller;
                this._context = context;
            }
        }
    }
});

zn.ControllerService = function (){
    var _args = arguments,
        _meta = _args[0];

    return zn.Class(ControllerService, _meta);
}

module.exports = ControllerService;
