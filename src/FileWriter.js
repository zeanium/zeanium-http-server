/**
 * Created by yangyxu on 8/20/14.
 */
var node_path = require('path');
var node_fs = require('fs');

module.exports = zn.Class({
    properties: {
        dir: './',
        separator: '/',
        rowSeparator: '\n\n',
        byYear: {
            value: true
        },
        byMonth: {
            value: true
        },
        byDate: {
            value: true
        }
    },
    methods: {
        init: function (argv){
            this.sets(argv);
            this.dir = node_path.resolve(process.cwd(), this.dir);
            this.mkdir(this.dir);
        },
        mkdir: function (dir){
            if(dir && !node_fs.existsSync(dir)){
                node_fs.mkdirSync(dir, { recursive: true });
            }
        },
        getSubPath: function (){
            var _now = new Date(), _paths = [];
            if(this.byYear){
                _paths.push(_now.getFullYear());
            }
            if(this.byMonth){
                _paths.push(_now.getMonth() + 1);
            }
            if(this.byDate){
                _paths.push(_now.getDate());
            }

            return _paths.join(this.separator || '/');
        },
        getFilePath: function (fileName){
            var _path = node_path.join(this.dir, '/' + this.getSubPath() + '/');
            this.mkdir(_path);

            return node_path.join(_path, fileName);
        },
        appendText: function (fileName, text, oneRow){
            if(!fileName) return false;
            if(oneRow){
                text = text + this.rowSeparator;
            }
            var _filePath = this.getFilePath(fileName);
            if(!node_fs.existsSync(_filePath)){
                node_fs.writeFileSync(_filePath, text);
            }else{
                node_fs.appendFileSync(_filePath, text);
            }

            return this;
        },
        writeText: function (fileName, text){
            if(!fileName) return false;
            if(oneRow){
                text = text + this.rowSeparator;
            }

            return node_fs.writeFileSync(this.getFilePath(fileName), text), this;
        },
        writeJSON: function (fileName, jsonContent){
            if(!fileName) return false;
            return node_fs.writeFileSync(this.getFilePath(fileName), JSON.stringify(jsonContent, null, 4)), this;
        },
        writeJSONFilePath: function (filePath, jsonContent){
            if(!filePath) return false;
            return node_fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 4)), this;
        }
    }
});
