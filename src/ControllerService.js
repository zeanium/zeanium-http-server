var ControllerService = zn.Class({
    properties: {
        controller: null,
        context: null
    },
    methods: {
        init: {
            router: null,
            auto: true,
            value: function (controller, context){
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
