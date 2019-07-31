var TIME = {
    s: 1000,
    n: 60000,
    h: 3600000,
    d: 86400000,
    w: 86400000 * 7
}

module.exports = {
    host: '0.0.0.0',
    port: 8888,
    catalog: '/',
    watcher: {
        cwd: '/src/',
        ignored: /[\/\\]\./,
        interval: 100,
        binaryInterval: 300,
        depth: 99,
        persistent: true
    },
    formidable: {
        encoding: 'utf-8',
        keepExtensions: false,
        uploadDir: './web/www/upload/temp',
        savedDir: './web/www/upload/saved',
        maxFieldsSize: 20 * 1024 * 1024,
        maxFileSize: 500 * 1024 * 1024,
        maxFields: 1000,
        multiples: true
    },
    views: {
        path: '/src/view/',
        suffix: 'html'
    },
    timeout: 12000,
    reDeployDelay: 3000,
    CORS: true,
    mode: 'release',     //release, debug, view,
    indexs: ['index.html', 'index.htm', 'default.html', 'default.htm'],
    session: {
        context: null,
        name: 'ZNSESSIONID',
        timeout: 60*30,
        rolling: false,    //每个请求都重新设置一个 cookie，默认为 false
        secret: "www.zeanium.com",     //通过设置的 secret 字符串，来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
        cookie: {
            // cookie maxAge defaults to 14400000, path defaults to '/' and
            // httpOnly defaults to true.
            maxAge: 0,
            //domain: '/',
            path: '/',
            expires: 1800,
            httpOnly: true,
            secure: false
        }
    }
};