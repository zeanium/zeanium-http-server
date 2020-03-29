var ZNError = zn.Class({
    properties: {
        name: null,
        code: null,
        message: null,
        details: null,
        stack: null
    },
    methods: {
        init: {
            auto: true,
            value: function (argv){
                this.name = argv.name || this.constructor.getMeta('name');
                this.code = argv.code;
                this.message = argv.message;
                this.details = argv.details;
                this.stack = (new Error()).stack;
            }
        }
    }
});

zn.Error = function (){
    var _args = arguments,
        _name = _args[0],
        _meta = _args[1];
    _meta.name = _name;
    return zn.Class(ZNError, _meta);
}

module.exports = ZNError;
