var node_os = require('os');
module.exports = zn.Controller('_$_', {
    Service: require('./ServerControllerService.js'),
    methods: {
        config: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(context._config);
            }
        },
        internalUrl: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _config = context._config;
                var _interfaces = node_os.networkInterfaces(),
                    _interface = null,
                    _host = null;
                for(var key in _interfaces){
                    _interface = _interfaces[key];
                    _interface.forEach(function (value){
                        if(value.address && value.family == 'IPv4' && value.internal){
                            _host = value.address;
                        }
                    });
                }
                response.success((_config.https?'https':'http') + "://" + _host + ":" + _config.port);
            }
        },
        externalUrl: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _config = context._config;
                var _interfaces = node_os.networkInterfaces(),
                    _interface = null,
                    _host = null;
                for(var key in _interfaces){
                    _interface = _interfaces[key];
                    _interface.forEach(function (value){
                        if(value.address && value.family == 'IPv4' && !value.internal){
                            _host = value.address;
                        }
                    });
                }
                response.success((_config.https?'https':'http') + "://" + _host + ":" + _config.port);
            }
        },
        port: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(context._config.port);
            }
        },
        hosts: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _interfaces = node_os.networkInterfaces(),
                    _interface = null,
                    _hosts = [];
                for(var key in _interfaces){
                    _interface = _interfaces[key];
                    _interface.forEach(function (value, index){
                        console.log(value, index);
                        if(value.address && value.family == 'IPv4'){
                            _hosts.push(value);
                        }
                    });
                }
                response.success(_hosts);
            }
        },
        apis: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routes = context._routes.reverse(),
                    _data = [];
                for(var route of _routes){
                    _data.push({
                        validate: route.validate,
                        deploy: route.meta.deploy,
                        path: route.path,
                        method: route.handler.meta.method,
                        controller: route.meta.controller,
                        action: route.action,
                        argv: route.handler.meta.argv,
                        comment: route.handler.meta.comment,
                    });
                }

                response.success(_data);
            }
        },
        routes: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routes = context._routes.reverse(),
                    _data = [];
                for(var route of _routes){
                    _data.push(route.path);
                }
                response.success(_data);
            }
        },
        plugins: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(Object.keys(context.apps));
            }
        },
        redeploy: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                context.__deploy();
                response.success('redeploy success');
            }
        },
        uploads: {
            method: 'POST',
            value: function (request, response, application, context, router){
                var _files = request.$files, _result = [];
                zn.each(_files, function (file, key){
                    _result.push(request.uploadFile(file));
                });

                response.success(_result);
            }
        }
    }
});