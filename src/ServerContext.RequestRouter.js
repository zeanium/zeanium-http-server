/**
 * Created by yangyxu on 8/20/14.
 */
var node_fs = require('fs');
var node_path = require('path');

var Request = require('./Request._.js');
var Response = require('./Response._.js');

module.exports = zn.Class({
    methods: {
        getRouter: function (path) {
            return this._routers[path];
        },
        acceptDispatcherRequest: function (clientRequest, serverResponse){
            var _router = clientRequest.router;
            if(!_router){return;}
            var _request,
                _response;
            if(clientRequest.parent){
                _request = clientRequest.parent;
            } else {
                _request = new Request(clientRequest, _router.application, this);
                clientRequest.parent = _request;
            }

            if(serverResponse.parent) {
                _response = serverResponse.parent;
            } else {
                _response = new Response(serverResponse, _request);
                serverResponse.parent = _response;
            }

            return _request.parseServerRequest(()=>this.doRouter(_router, _request, _response)), this;
        },
        doRouter: function (router, request, response){
            try {
                zn.extend(request._$get, router.pathArgv);
                var _controller = router.controller,
                    _action = router.action,
                    _meta = _controller.member(_action).meta || {},
                    _values = this.__validateRouterMeta(_meta, request);

                if(!_values){
                    return false;
                }
                if(!!router.validate){
                    
                }
                
                _controller[_action].call(_controller, request, response, this);
            } catch (error) {
                throw error;
            }
        },
        __validateRouterMeta: function (meta, request){
            if(meta){
                var _requestMethod = request.clientRequest.method,
                    _method = meta.method || 'GET&POST';

                if(_method.indexOf(_requestMethod) === -1){
                    throw new zn.ERROR.HttpRequestError({
                        code: 405,
                        message: "Method Not Allowed.",
                        details: "The Resource Only Allow [ " + _method + " ] Method, But The Method Of Request Is " + _requestMethod + "."
                    });
                }

                return request.validateRequestParameters(meta.argv);
            }

            return request.validateRequestParameters({});
        }
    }
});