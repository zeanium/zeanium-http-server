var TIME = {
    s: 1000,
    n: 60000,
    h: 3600000,
    d: 86400000,
    w: 86400000 * 7
}

module.exports = {
    loadDefault: true,
    mode: 'development',     //development, stage, production
    https: false,
    host: '0.0.0.0',
    port: 8888,
    cwd: '/',
    log: {
        dir: './log/',
        file: 'output.log',
        error: 'error.log',
        route: 'route.log'
    },
    restart: {
        timeout: 5000,
        max: 5
    },
    watcher: {
        watching: true,
        cwd: '/src/',
        ignored: /[\/\\]\./,
        interval: 1000,
        deployDelayInterval: 3000,
        binaryInterval: 300,
        depth: 99,
        persistent: true
    },
    formidable: {
        encoding: 'utf-8',
        keepExtensions: false,
        uploadDir: './',
        savedDir: './',
        maxFieldsSize: 20 * 1024 * 1024,
        maxFileSize: 500 * 1024 * 1024,
        maxFields: 1000,
        multiples: true
    },
    timeout: 30000,
    cors: true,
    indexs: ['index.html', 'index.htm', 'default.html', 'default.htm'],
    session: {
        context: null,
        name: 'ZNSESSIONID',
        expires: 60 * 60 * 60 * 24,
        rolling: false,    //每个请求都重新设置一个 cookie，默认为 false
        secret: "www.zeanium.com",     //通过设置的 secret 字符串，来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
        cookie: {
            // cookie maxAge defaults to 14400000, path defaults to '/' and
            // httpOnly defaults to true.
            maxAge: 0,
            //domain: '/',
            path: '/',
            expires: 60 * 60 * 60 * 24,
            httpOnly: true,
            secure: false
        }
    }
};