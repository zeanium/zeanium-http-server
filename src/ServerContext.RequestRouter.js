/**
 * Created by yangyxu on 8/20/14.
 */
var Request = require('./Request._.js');
var Response = require('./Response._.js');
var RouteChain = require('./RouteChain');

module.exports = zn.Class({
    methods: {
        getRouteChain: function (path, routes, clientRequest) {
            var _routes = this._pathMatcher.matchRoutes(path, routes || this._routes, clientRequest);
            if(_routes.length) {
                return new RouteChain(_routes, this);
            }
        },
        acceptDispatcherRequest: function (route, clientRequest, serverResponse){
            if(!route) return;
            var _request = null,
                _response = null;
            if(clientRequest.parent){
                _request = clientRequest.parent;
            } else {
                _request = new Request(clientRequest, route.route.application, this);
                clientRequest.parent = _request;
            }

            if(serverResponse.parent) {
                _response = serverResponse.parent;
            } else {
                _response = new Response(serverResponse, _request);
                serverResponse.parent = _response;
            }

            return _request.parseServerRequest(function (err, fields, files){
                if(err){
                    return this.doHttpError(clientRequest, serverResponse, err), false;
                }
                this.doRoute(route, _request, _response);
            }.bind(this)), this;
        },
        doRoute: function (route, request, response){
            try {
                if(zn.middleware.callMiddlewareMethod(zn.middleware.TYPES.SERVER_CONTEXT, "doRoute", [route, request, response, this]) === false){
                    return false;
                };
                var _route = route.route,
                    _application = _route.application,
                    _validate = _route.validate,
                    _controller = _route.controller,
                    _action = _route.action,
                    _meta = _controller.member(_action).meta || {};
                
                request.nextReload(route);
                if(!this.__validateRouteMeta(_meta, request, response)) return;
                if(_validate === undefined){
                    _validate = _controller.constructor.getMate('validate');
                }
                var _argv = [request, response, _application, this, _route];
                if(_validate === undefined) {
                    return _controller[_action].apply(_controller, _argv);
                }

                if(_validate === false){
                    return _controller[_action].apply(_controller, _argv);
                }

                if(_validate === true){
                    return request.sessionVerify(()=>_controller[_action].apply(_controller, _argv), (err)=>this.doHttpError(request.clientRequest, response.serverResponse, err));
                }

                if(typeof _validate == 'function' && _validate.call(_controller, request, response, _route) !== false){
                    return _controller[_action].apply(_controller, _argv);
                }

                throw new zn.ERROR.HttpRequestError({
                    code: 401,
                    message: "Unauthorized.",
                    detail: "Unauthorized, You Need Login Into System First."
                });
            } catch (err) {
                this.doHttpError(request.clientRequest, response.serverResponse, err);
            }
        },
        __validateRouteMeta: function (meta, request, response){
            try {
                if(meta){
                    var _requestMethod = request.clientRequest.method,
                        _method = meta.method || 'GET&POST';
    
                    if(_method.indexOf(_requestMethod) === -1){
                        throw new zn.ERROR.HttpRequestError({
                            code: 405,
                            message: "Method Not Allowed.",
                            detail: "The Resource Only Allow [ " + _method + " ] Method, But The Method Of Request Is " + _requestMethod + "."
                        });
                    }
    
                    return request.validateRequestParameters(meta.argv);
                }
    
                return request.validateRequestParameters({});
            } catch (err) {
                this.doHttpError(request.clientRequest, response.serverResponse, err);
            }

            return false;
        }
    }
});