module.exports = zn.Controller('', {
    service: require('./ApplicationControllerService.js'),
    methods: {
        init: function (serverContext, application){
            this._serverContext = serverContext;
            this._application = application;
        },
        apis: {
            method: 'GET/POST',
            value: function (request, response){
                var _routers = this._serverContext._routers,
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
            value: function (request, response){
                response.success(Object.keys(request._context._routers));
            }
        },
        plugins: {
            method: 'GET/POST',
            value: function (request, response){
                response.success(Object.keys(this._context._appContexts));
            }
        }
    }
});
