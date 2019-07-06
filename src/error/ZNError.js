var ZNError = zn.Class({
    properties: {
        code: null,
        message: null,
        details: null,
        stack: null
    },
    methods: {
        init: {
            auto: true,
            value: function (argv){
                this.sets(argv);
                this.stack = (new Error()).stack;
            }
        }
    }
});

zn.Error = function (){
    var _args = arguments,
        _meta = _args[0];

    return zn.Class(ZNError, _meta);
}

module.exports = ZNError;
