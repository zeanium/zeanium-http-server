/**
 * Created by yangyxu on 3/29/20.
 */

module.exports = zn.Class({
    properties: {
        routes: null,
        serverContext: null
    },
    methods: {
        init: function (routes, serverContext){
            this._routes = routes;
            this._serverContext = serverContext;
        },
        begin: function (clientRequest, serverResponse){
            if(!clientRequest || !serverResponse) return;
            var _data = null;
            if(this._routes.length){
                _data = this._routes.shift();
                if(_data){
                    _data.chain = this;
                    this._serverContext.acceptDispatcherRequest(_data, clientRequest, serverResponse);
                }
            }
            
            return _data;
        },
        next: function (request, response){
            if(!request || !response) return;
            var _data = null;
            if(this._routes.length){
                _data = this._routes.shift();
                if(_data) {
                    _data.chain = this;
                    this._serverContext.doRoute(_data, request, response);
                }
            }

            return _data;
        }
    }
});
