/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var MIDDLEWARE_KEY = zn.middleware.TYPES.HTTP_SERVER;
module.exports = zn.Class({
    properties: {
        httpServer: null, 
        server: null
    },
    methods: {
        init: function (httpServer, server){
            this._httpServer = httpServer;
            this._server = server;
            httpServer.on('checkContinue', this.__onCheckContinue.bind(this));
            httpServer.on('checkExpectation', this.__onCheckExpectation.bind(this));
            httpServer.on('clientError', this.__onClientError.bind(this));
            httpServer.on("connect", this.__onConnect.bind(this));
            httpServer.on("connection", this.__onConnection.bind(this));
            httpServer.on('request', this.__onRequest.bind(this));
            httpServer.on('upgrade', this.__onUpgrade.bind(this));
            httpServer.on('error', this.__onError.bind(this));
            httpServer.on('listening', this.__onListening.bind(this));
            httpServer.on("close", this.__onClose.bind(this));
        },
        __onCheckContinue: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "checkContinue", Array.prototype.slice.call(arguments));
        },
        __onCheckExpectation: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "checkExpectation", Array.prototype.slice.call(arguments));
        },
        __onClientError: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "clientError", Array.prototype.slice.call(arguments));
        },
        __onConnect: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "connect", Array.prototype.slice.call(arguments));
        },
        __onConnection: function (socket){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "connection", Array.prototype.slice.call(arguments));
        },
        __onRequest: function (clientRequest, serverResponse){
            try{
                clientRequest.url = node_path.normalize(clientRequest.url);
                var _return = zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "request", [clientRequest, serverResponse, this._server]);
                if(_return !== false){
                    this._server._context.accept(clientRequest, serverResponse);
                }
            } catch (err){
                zn.error(err.stack);
                this._server._context.doHttpError(clientRequest, serverResponse, err);
            }
        },
        __onUpgrade: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "upgrade", Array.prototype.slice.call(arguments));
        },
        __onError: function (err){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "error", [err, this._server]);
            zn.error(err);
        },
        __onListening: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "listening", Array.prototype.slice.call(arguments));
            zn.info('Listening in ', this._httpServer.address());
        },
        __onClose: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "close", Array.prototype.slice.call(arguments));
        }
    }
});