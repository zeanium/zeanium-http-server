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
            serverResponse.setTimeout(this._config.timeout || 20000, ()=>this.__doTimeout(clientRequest, serverResponse));
            serverResponse.on('close', ()=>this.__doClose(clientRequest, serverResponse));
            serverResponse.on('finish', ()=>this.__doFinished(clientRequest, serverResponse));
            return this.execMiddleware("accept", clientRequest, serverResponse);
        },
        __doClose: function (clientRequest, serverResponse){
            serverResponse.currentTimestamp = (new Date()).getTime();
            var _timestamp = serverResponse.currentTimestamp - clientRequest.currentTimestamp,
                _code = serverResponse.statusCode,
                _clientIp = this.getClientIp(clientRequest),
                _nowString = zn.date.asString(new Date());
            this._logger.requestStatus(clientRequest.url, {
                method: clientRequest.method,
                data: clientRequest.data,
                code: _code,
                time: _nowString,
                timestamp: _timestamp + 'ms'
            });
            this._logger.writeRequest(_nowString, '[', _clientIp, clientRequest.method, _code, _timestamp + 'ms', ']', clientRequest.url);
            if(_code > 199 && _code < 300){
                zn.debug('[', _clientIp, clientRequest.method, _code, _timestamp + 'ms', ']', clientRequest.url);
            }else{
                this._logger.writeError(_nowString, '[', clientRequest.method, _code, _timestamp + 'ms', ']', clientRequest.url);
                zn.error('[', _clientIp, clientRequest.method, _code, _timestamp + 'ms', ']', clientRequest.url);
            }

            this.execMiddleware("responseClose", clientRequest, serverResponse);
        },
        __doTimeout: function (clientRequest, serverResponse){
            if(this.execMiddleware("responseTimeout", clientRequest, serverResponse) === false) return;
            this.doHttpError(clientRequest, serverResponse, new zn.ERROR.HttpResponseError({
                code: 408,
                message: "Request Timeout.",
                detail: "Request Timeout"
            }));
        },
        __doFinished: function (clientRequest, serverResponse){
            if(this.execMiddleware("responseFinish", clientRequest, serverResponse) === false) return;
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
                        return this.doHttpError(clientRequest, serverResponse, new zn.ERROR.HttpRequestError({
                            code: 503,
                            message: "Service unavailable.",
                            detail: "Service unavailable."
                        })), false;
                    }
                }
            }
            
            return this;
        },
        accept: function (clientRequest, serverResponse){
            try {
                if(this.execMiddleware("requestAcceptBefore", clientRequest, serverResponse) === false) return;
                this.__initAccept(clientRequest, serverResponse);
                if(this.execMiddleware("requestAccept", clientRequest, serverResponse) === false) return;
                this.doRequest(clientRequest, serverResponse);
            } catch (error) {
                this.doHttpError(clientRequest, serverResponse, error);
            }
        },
        existPath: function (path){
            return node_fs.existsSync(node_path.join(this._webRoot, path));
        },
        resolvePath: function (path){
            return node_path.join(this._webRoot, path);
        },
        doRequest: function (clientRequest, serverResponse){
            var _return = this.execMiddleware("doRequest", clientRequest, serverResponse);
            if(_return === false){ return false; }
            var _pathname = clientRequest.meta.pathname,
                _path = this.formatToAbsolutePath(_pathname);

            this._logger.requestCount(clientRequest.url);
            if(node_fs.existsSync(_path)){
                clientRequest.root = _path;
                clientRequest.stats = node_fs.statSync(_path);
                return this.doStatic(clientRequest, serverResponse);
            }
            var _chain = this.getRouteChain(_pathname, null, clientRequest);
            if(_chain){
                this._logger.writeRoute(zn.date.asString(new Date()), '[', clientRequest.method, _pathname, ']', clientRequest.url);
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

            throw new zn.ERROR.HttpRequestError({
                code: 404,
                message: 'Not Found Error.',
                detail: "[ " + clientRequest.method + " ]: " + clientRequest.url + " can not be found."
            });
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

            throw new zn.ERROR.HttpRequestError({
                code: 403,
                message: 'Unauthorized.',
                detail: "You are not authorized to view this directory or page using the credentials provided."
            });
        },
        doJSON: function (clientRequest, serverResponse, content){
            var _encoding = 'utf-8';
            serverResponse.setHeader('Content-Type', "application/json;charset=" + _encoding);
            serverResponse.setHeader('Content-Length', Buffer.byteLength(content, _encoding));
            serverResponse.writeHead(200, "OK");
            serverResponse.end(content, _encoding);
        },
        doHttpError: function (clientRequest, serverResponse, err){
            if(!clientRequest || !serverResponse || serverResponse.finished || !serverResponse.writable){
                return;
            }
            zn.error(err);
            this._logger.writeError(zn.date.asString(new Date()), 'Error [', err.name, err.code, err.message, ']', err.detail, err.stack);

            var _data = err.gets?err.gets():err,
                _contentType = clientRequest.headers['content-type'] || '',
                _content = JSON.stringify(_data);

            if(_contentType.toLowerCase().indexOf('application/json') != -1){
                return this.doJSON(clientRequest, serverResponse, _content);
            }

            if(process.env.NODE_ENV == 'development' || this._config.mode == 'development'){
                serverResponse.write(_content);
            } else {
                serverResponse.write(_data.message + ': ' + _data.detail);
            }
            
            if(err.message){
                serverResponse.statusMessage = err.message;
            }

            if(err.code){
                serverResponse.statusCode = err.code;
            }

            if(this._config.headers){
                for(var key in this._config.headers){
                    serverResponse.setHeader(key, this._config.headers[key]);
                }
            }
            
            serverResponse.end();
        }
    }
});
