var node_path = require('path');
module.exports = zn.Class({
    events: ['routeMatch', 'routeMatched'],
    properties:{ 
        pathSeparator: null,
        pathParameterSymbol: null
    },
    methods: {
        init: function (argv, events){
            this.__initEvents(events);
            this._pathSeparator = node_path.sep || argv.pathSeparator || '/';
            this._pathParameterSymbol = argv.pathParameterSymbol || ':';
        },
        __initEvents: function (events){
            if(events && typeof events == 'object'){
                for(var event in events){
                    this.on(event, events[event], this);
                }
            }
        },
        matchRoutes: function (requestPath, routes, clientRequest){
            routes = routes || [];
            var _routes = [],
                _route = null,
                _data = null,
                _method = clientRequest.method.toLocaleLowerCase();
            for(var i = 0, _len = routes.length; i < _len; i++){
                _route = routes[i];
                if((_route.handler.meta.method||"GET").toLocaleLowerCase().indexOf(_method) == -1){
                    continue;
                }
                _data = this.__matchRoute(_route, requestPath);
                if(_data){
                    _routes.push({
                        route: _route,
                        params: _data.params,
                        unmatchs: _data.unmatchs
                    });
                }
            }

            return _routes;
        },
        matchRouteByRequestPathAndRoutes: function (requestPath, routes){
            var _routes = routes || [],
                _route = null,
                _data = null;
            for(var i = 0, _len = _routes.length; i < _len; i++){
                _route = _routes[i];
                _data = this.__matchRoute(_route, requestPath);
                if(_data){
                    break;
                }
            }
            
            if(_route && _data){
                return {
                    route: _route,
                    params: _data.params,
                    unmatchs: _data.unmatchs
                };
            }
        },
        __matchRoute: function (route, requestPath){
            var _paths = route.paths,
                _path = null,
                _params = {},
                _unmatchs = [],
                _hasChecked = false,
                _temp = null,
                _temps = [];
            if(requestPath.indexOf(this._pathSeparator) != -1) {
                _temps = requestPath.split(this._pathSeparator);
            } else if (requestPath.indexOf('/') != -1) {
                _temps = requestPath.split('/');
            } else if (requestPath.indexOf('\\') != -1) {
                _temps = requestPath.split('\\');
            }

            if(route.exact) {
                if(_temps.length !== _paths.length){
                    return false;
                }

                if(route.path && requestPath && route.path.trim() === requestPath.trim()) {
                    return {
                        params: _params,
                        unmatchs: _unmatchs
                    };
                }
            }

            for(var i = 0, _len = _temps.length; i < _len; i++) {
                _temp = _temps[i];
                if(!_temp) {
                    continue;
                }
                _path = _paths[i];
                _hasChecked = true;
                if(!_path){
                    _unmatchs.push(_temp);
                    continue;
                }
                if(!_path.isParameter && _temp !== _path.key){
                    return false
                }
                if(_path.isParameter){
                    _params[_path.key] = _temp;
                }
            }
            if(!_hasChecked) {
                return false;
            }

            return {
                params: _params,
                unmatchs: _unmatchs
            };
        },
        parseRoutePath: function (path){
            var _paths = [],
                _temp = null,
                _temps = [];
            if(path.indexOf(this._pathSeparator) != -1) {
                _temps = path.split(this._pathSeparator);
            } else if (path.indexOf('/') != -1) {
                _temps = path.split('/');
            } else if (path.indexOf('\\') != -1) {
                _temps = path.split('\\');
            }
            
            for(var i = 0, _len = _temps.length; i < _len; i++) {
                _temp = _temps[i];
                if(!_temp) {
                    continue;
                }
                if (/^:\w[\w\d]*$/.test(_temp)) {
                    _temp = _temp.replace(/^:/, '');
                    _paths[i] = {
                        key: _temp,
                        isParameter: true
                    };
                }else{
                    _paths[i] = {
                        key: _temp
                    };
                }
            }

            return _paths;
        }
    }
});