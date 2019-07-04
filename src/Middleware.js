var Middleware = zn.Class({
    methods: {
        init: function (){
             
        },
        willMount: function (){

        },
        didMount: function (){

        },
        willUnmount: function (){

        },
        didUnmount: function (){

        }
    }
});

zn.Middleware = function (meta){
    return zn.Class(Middleware, meta);
}

zn.middleware = zn.Class({
    static: true,
    properties: {
        TYPES: null,
        data: null
    },
    methods: {
        init: function (){
            this.TYPES = {
                APPLICATION: "APPLICATION",
                CLIENT_REQUEST: "CLIENT_REQUEST",
                CONTROLLER: "CONTROLLER",
                HTTP_SERVER: "HTTP_SERVER",
                SERVER: "SERVER",
                SERVER_CONTEXT: "SERVER_CONTEXT",
                SERVER_RESPONSE: "SERVER_RESPONSE"
            };
            this.data = {};
        },
        use: function (middleware, owner){
            var _typeof = typeof middleware,
                _type = null;
            if(_typeof == 'function') {
                _type = middleware.getMeta('TYPE');
                middleware = new middleware(this);
            }else if(_typeof == 'object'){
                _type = middleware.constructor.getMeta('TYPE');
            }
            
            if(!this.data[_type]){
                this.data[_type] = [];
            }
            middleware.willMount.call(middleware, owner);
            return this.data[_type].push(middleware), this;
        },
        getMiddlewares: function (TYPE){
            return this.data[TYPE||'']||[];
        },
        callMiddlewareMethod: function (TYPE, method, argv){
            var _middlewares = this.getMiddlewares(TYPE),
                _middleware = null,
                _return;
            for(var i = 0, _len = _middlewares.length; i < _len; i++){
                _middleware = _middlewares[i];
                if(_middleware[method] && typeof _middleware[method] == 'function'){
                    _return = _middleware[method].apply(_middleware, argv);
                    if(_return == -1){
                        continue;
                    }
                    if(_return === false){
                        return false;
                    }
                }
            }
            
            return this;
        }
    }
});

module.exports = Middleware;
