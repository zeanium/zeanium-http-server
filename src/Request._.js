/**
 * Created by yangyxu on 8/20/14.
 */
var RequestReader = require('./Request.Reader');

module.exports = zn.Class({
    mixins: [ RequestReader ],
    properties: {
        application: null,
        serverContext: null,
        clientRequest: null
    },
    methods: {
        init: function (clientRequest, application, serverContext){
            this._clientRequest = clientRequest;
            this._application = application;
            this._serverContext = serverContext;
        },
        addClientRequestEventListener: function (event, listener, handler){
            return this._clientRequest.on.call(handler || this._clientRequest, event, listener), this;
        }
    }
});
