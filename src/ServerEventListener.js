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
        __onCheckContinue: function (clientRequest, serverResponse){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "checkContinue", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onCheckExpectation: function (clientRequest, serverResponse){
            this._server._context.logger.writeError(zn.date.asString(new Date()), 'Error [', err.name, err.message, ']', err.stack);
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "checkExpectation", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onClientError: function (err, socket){
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            this._server._context.logger.writeError(zn.date.asString(new Date()), 'Error [', err.name, err.message, ']', err.stack);
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "clientError", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onConnect: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "connect", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onConnection: function (socket){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "connection", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onRequest: function (clientRequest, serverResponse){
            try{
                zn.debug(clientRequest.url);
                clientRequest.url = node_path.normalize(clientRequest.url);
                clientRequest.currentTimestamp = (new Date()).getTime();
                if(clientRequest.method == 'OPTIONS'){
                    return this.__handlerOptionsMethod(clientRequest, serverResponse), false;
                }
                var _return = zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "request", [clientRequest, serverResponse, this._server]);
                if(_return !== false){
                    this._server._context.accept(clientRequest, serverResponse);
                }
            } catch (err){
                this._server._context.doHttpError(clientRequest, serverResponse, err);
            }
        },
        __handlerOptionsMethod: function (clientRequest, serverResponse){
            var _package = require('../package.json');
            serverResponse.writeHead(200, {
                'Access-Control-Allow-Origin': (clientRequest.headers.origin || clientRequest.headers.host || clientRequest.headers.Host || ''),
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
                'Access-Control-Allow-Headers': 'Accept,Accept-Charset,Accept-Encoding,Accept-Language,Connection,Content-Type,Cookie,DNT,Host,Keep-Alive,Origin,Referer,User-Agent,X-CSRF-Token,X-Requested-With',
                "Access-Control-Allow-Credentials": true,
                'Access-Control-Max-Age': '3600',//一个小时时间
                'X-Powered-By': (_package.name + '@' + _package.version),
                'Content-Type': 'text/html;charset=utf-8',
                'Trailer': 'Content-MD5'
            });
            serverResponse.write('<a href="https://github.com/zeanium/zeanium-http-server">' + _package.name + '</a>');
            serverResponse.addTrailers({ 'Content-MD5': zn.uuid().toLocaleLowerCase() });
            serverResponse.end();
        },
        __onUpgrade: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "upgrade", Array.prototype.slice.call(arguments).concat([this]));
        },
        __onError: function (err){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "error", [err, this._server]);
            zn.error(err);
        },
        __onListening: function (){
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "listening", Array.prototype.slice.call(arguments).concat([this]));
            zn.info('Listening in ', this._httpServer.address());
        },
        __onClose: function (){
            console.log('server -- close');
            zn.middleware.callMiddlewareMethod(MIDDLEWARE_KEY, "close", Array.prototype.slice.call(arguments).concat([this]));
        }
    }
});