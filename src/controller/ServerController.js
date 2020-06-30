module.exports = zn.Controller('_$_', {
    Service: require('./ServerControllerService.js'),
    methods: {
        apps: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                response.success(Object.keys(context._apps));
            }
        },
        apis: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                var _routers = context._routers,
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
                response.success(Object.keys(context._routers));
            }
        },
        redeploy: {
            method: 'GET/POST',
            value: function (request, response, application, context, router){
                context.__deploy();
                response.success('redeploy success');
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