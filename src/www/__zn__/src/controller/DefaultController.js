module.exports = zn.Controller('default',{
    methods: {
        index: function (request, response) {
            //request.uploadFiles();
            setTimeout(function (){
                response.error({
                    name: 'yangyxu',
                    age: 30
                }, 403);
            }, 3000);
            response.HTTPError(302);
        }
    }
});
