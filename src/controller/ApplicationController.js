module.exports = zn.Controller('__$__', {
    service: require('./ApplicationControllerService.js'),
    methods: {
        apis: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routers = application._routers,
                    _router = null,
                    _data = [],
                    _meta = {};
                for(var key in _routers){
                    _router = _routers[key];
                    _meta = { router: key };
                    zn.extend(_meta, _router.handler.meta);
                    _data.push(_meta);
                }
                response.success(_data);
            }
        },
        routers: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(Object.keys(application._routers));
            }
        },
        plugins: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(Object.keys(context.apps));
            }
        },
        uploadFiles: {
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
