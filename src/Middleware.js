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

zn.Middleware.Class = Middleware;

module.exports = zn.Class({
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
                COOKIE: "COOKIE",
                HTTP_SERVER: "HTTP_SERVER",
                LOGGER: "LOGGER",
                MODEL: "MODEL",
                REQUEST: "REQUEST",
                RESPONSE: "RESPONSE",
                SERVICE: "SERVICE",
                SERVER: "SERVER",
                SERVER_CONTEXT: "SERVER_CONTEXT",
                SERVER_RESPONSE: "SERVER_RESPONSE",
                SESSION: "SESSION",
                SESSION_CONTEXT: "SESSION_CONTEXT"
            };
            this.data = {};
        },
        reset: function (){
            for(var key in this.data){
                var _temps = [];
                for(var middleware of this.data[key]) {
                    if(middleware.constructor.getMeta('reset') === false){
                        _temps.push(middleware);
                    }
                }
                this.data[key] = _temps;
            }

            return this.data;
        },
        use: function (middleware, owner){
            var _type = null;

            if(typeof middleware == 'function') {
                middleware = new middleware(this);
            }

            if(typeof middleware == 'object' && middleware instanceof Middleware){
                _type = middleware.constructor.getMeta('TYPE');
            }else{
                return this;
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
            //zn.trace('Middleware.callMiddlewareMethod: ', TYPE, method, _middlewares.length);
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

            return _return;
        }
    }
});
