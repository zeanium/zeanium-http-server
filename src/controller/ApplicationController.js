module.exports = zn.Controller('__$__', {
    Service: require('./ApplicationControllerService.js'),
    methods: {
        info: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success({
                    config: application._config,
                    package: require(application._config.root + "package.json")
                });
            }
        },
        package: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(require(application._config.root + "package.json"));
            }
        },
        config: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(application._config);
            }
        },
        apis: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routes = application._routes,
                    _data = [];
                for(var route of _routes){
                    _data.push({
                        action: route.action,
                        method: route.handler.meta.method,
                        validate: route.validate,
                        path: route.path,
                        deploy: route.meta.deploy,
                        controller: route.meta.controller
                    });
                }
                response.success(_data);
            }
        },
        routes: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routes = application._routes,
                    _data = [];
                for(var route of _routes){
                    _data.push(route.path);
                }
                response.success(_data);
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
