/**
 * Created by yangyxu on 8/20/14.
 */
var node_url = require('url');
var node_fs = require('fs');
var node_path = require('path');
var MIMES = require('./static/MIMES');

module.exports = zn.Class({
    properties: {
        
    },
    methods: {
        __initAccept: function (clientRequest, serverResponse){
            if(clientRequest.meta) return;
            clientRequest.meta = node_url.parse(clientRequest.url, true);
            clientRequest.currentTimestamp = (new Date()).getTime();

            if(this._config.timeout){
                serverResponse.setTimeout(this._config.timeout, ()=>this.__doTimeout(clientRequest, serverResponse));
            }
            serverResponse.on('finish', ()=>this.__doFinished(clientRequest, serverResponse));
                
            /*
            if(this.config.session){
                clientRequest.session = new Session(clientRequest, serverResponse, this);
                if(clientRequest.session.validate() === false) return;
            }*/
        },
        __doTimeout: function (clientRequest, serverResponse){
            this.__doFinished(clientRequest, serverResponse);
        },
        __doFinished: function (clientRequest, serverResponse){
            serverResponse.currentTimestamp = (new Date()).getTime();
            var _timestamp = serverResponse.currentTimestamp - clientRequest.currentTimestamp,
                _code = serverResponse.statusCode;
            if(_code > 199 && _code < 300){
                zn.debug('[', clientRequest.method, _code, ']', clientRequest.url, _timestamp + 'ms');
            }else{
                zn.error('[', clientRequest.method, _code, ']', clientRequest.url, _timestamp + 'ms', serverResponse.statusMessage);
            }
        },
        execMiddleware: function (method, clientRequest, serverResponse){
            var _middlewares = zn.middleware.getMiddlewares(zn.middleware.TYPES.SERVER_CONTEXT),
                _middleware = null,
                _method = null,
                _return;
            for(var i = 0, _len = _middlewares.length; i<_len; i++){
                if(serverResponse.finished){ return false; }
                _middleware = _middlewares[i];
                _method = _middleware[method];
                if( _method && typeof _method == 'function'){
                    _return = _method.apply(_middleware, [clientRequest, serverResponse, this]);
                    if(_return == -1){
                        continue;
                    }
                    if(_return === false){
                        return this.doError(serverResponse, 503, "Service unavailable."), false;
                    }
                }
            }
            
            return this;
        },
        accept: function (clientRequest, serverResponse){
            if(this.execMiddleware("requestAcceptBefore", clientRequest, serverResponse) === false) return;
            this.__initAccept(clientRequest, serverResponse);
            if(this.execMiddleware("requestAccept", clientRequest, serverResponse) === false) return;
            this.doRequest(clientRequest, serverResponse);
        },
        doRequest: function (clientRequest, serverResponse){
            var _return = this.execMiddleware("doRequest", clientRequest, serverResponse);
            if(_return === false){ return false; }
            var _pathname = clientRequest.meta.pathname,
                _path = this.formatToAbsolutePath(_pathname);

            if(node_fs.existsSync(_path)){
                clientRequest.root = _path;
                clientRequest.stats = node_fs.statSync(_path);
                return this.doStatic(clientRequest, serverResponse);
            }
            var _chain = this.getRouteChain(_pathname);
            if(_chain){
                return _chain.begin(clientRequest, serverResponse);
            }

            var _fragments = _pathname.split(node_path.sep);
            _fragments = _fragments.filter(fragment=>fragment.length);
            var _appName = _fragments.shift(),
                _application = this._apps[_appName];
            if(_application){
                var _path = node_path.join(_application._webRoot, _fragments.join(node_path.sep));
                if(node_fs.existsSync(_path)){
                    clientRequest.root = _path;
                    clientRequest.stats = node_fs.statSync(_path);
                    return this.doStatic(clientRequest, serverResponse);
                }
            }

            this.doError(serverResponse, 404, "Not Found Error.");
            /*
            this.doHttpError(clientRequest, serverResponse, new zn.ERROR.HttpRequestError({
                code: 404,
                message: 'Not Found Error.',
                details: "[ " + clientRequest.method + " ]: " + clientRequest.url + " can’t be found."
            }));*/
        },
        doStatic: function (clientRequest, serverResponse){
            var _stats = clientRequest.stats;
            if(!_stats){
                _stats = node_fs.statSync(clientRequest.root);
            }
            if(_stats.isDirectory()){
                this.doStaticDirectory(clientRequest, serverResponse);
            }else if(_stats.isFile()){
                this.doStaticFile(clientRequest, serverResponse);
            }
        },
        doStaticFile: function (clientRequest, serverResponse){
            var _root = clientRequest.root,
                _extname = node_path.extname(_root).toLowerCase(),
                _mime = MIMES[_extname] || {
                    contentType: 'text/plain',
                    encoding: 'binary'
                };
            if(typeof _mime == 'string'){
                _mime = {
                    contentType: _mime,
                    encoding: 'binary'
                };
            }
            if(!node_fs.existsSync(_root)){ return false; }
            var _content = node_fs.readFileSync(_root, {
                encoding: _mime.encoding,
                flag: 'r'
            });

            serverResponse.setHeader('Content-Type', _mime.contentType + ";charset=" + _mime.encoding);
            serverResponse.setHeader('Content-Length', Buffer.byteLength(_content, _mime.encoding));
            serverResponse.writeHead(200, "OK");
            serverResponse.end(_content, _mime.encoding);
        },
        doStaticDirectory: function (clientRequest, serverResponse){
            var _indexs = this._config.indexs || [],
                _index = null;
            for(var i = 0, _size = _indexs.length; i < _size; i++){
                _index = _indexs[i];
                if(node_fs.existsSync(node_path.join(clientRequest.root, _index))){
                    clientRequest.root = node_path.join(clientRequest.root, _index);
                    return this.doStaticFile(clientRequest, serverResponse);
                }
            }

            this.doError(serverResponse, 403, "You are not authorized to view this directory or page using the credentials provided.");
            /*
            this.doHttpError(clientRequest, serverResponse, new zn.ERROR.HttpRequestError({
                code: 403,
                message: 'HTTP/1.1 401 Unauthorized.',
                details: "You are not authorized to view this directory or page using the credentials provided."
            }));*/
        },
        doError: function (serverResponse, code, message){
            serverResponse.writeHead(code, message);
            serverResponse.end();
        },
        doHttpError: function (clientRequest, serverResponse, err){
            if(!serverResponse.writable || serverResponse.finished){
                return;
            }

            var _contentType = clientRequest.headers['content-type'];
            if(_contentType && _contentType.toLowerCase().indexOf('application/json') != -1){
                serverResponse.write(JSON.stringify({
                    name: err._name,
                    code: err._code,
                    message: err._message,
                    details:  err._details
                }));
            }else {
                if(err._details){
                    serverResponse.write(err._name + ': ' + err._details);
                }
            }
            
            if(err._message){
                serverResponse.statusMessage = err._message;
            }
            if(err._code){
                serverResponse.statusCode = err._code;
            }

            /*
            if(err._code && err._message){
                serverResponse.writeHead(err._code, err._message);
            }*/
            
            serverResponse.end();
        }
    }
});
