module.exports = zn.Controller('api',{
    methods: {
        list: function (request, response) {
            /*
            response.viewModel('_api', {
                data: 'xxx'
            });*/

            response.redirect('http://www.google.com.hk/');
            //response.forword('/__zn__/api/test');
        },
        test: function(request, response){
            response.success('list   >>>      test');
        }
    }
});
