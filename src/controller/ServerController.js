module.exports = zn.Controller('$', {
    service: require('./ServerControllerService.js'),
    methods: {
        redeploy: {
            method: 'GET/POST',
            value: function (request, response){
                this._serverContext.__delayDeploy();
                response.success('redeploy success');
            }
        },
        apps: {
            method: 'GET/POST',
            value: function (request, response){
                response.success(Object.keys(this._serverContext._apps));
            }
        },
        uploadFiles: {
            method: 'POST',
            value: function (request, response, chain){
                var _files = request.$files, _result = [];
                zn.each(_files, function (file, key){
                    _result.push(request.uploadFile(file));
                });

                response.success(_result);
            }
        }
    }
});
