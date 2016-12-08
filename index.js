/**
 * Created by timxuan on 2016/11/22.
 */


let fs = require('fs'),
    path = require('path'),
    imagesConfig = require('./imagesConfig');

let class2type = {};

let rStyleScript = /(?:\s*(<link([^>]*?)(stylesheet){1}([^>]*?)(?:\/)?>))/ig,
    linkScript = /(?:(\s*<script([^>]*)>([\s\S]*?)<\/script>))/ig,
    scriptSrc = /(?:\ssrc\s*=\s*)('([^<>']+)'|"([^<>\"]+)")/i,
    styleUrl = /(?:\shref\s*=\s*)('([^'<>]+)'|"([^"<>]+)"|[^\s\/>]+)/i;

"Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function(name){
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

let type = (obj) => {
    return obj == null ? String(obj) :
    class2type[toString.call(obj)] || "object";
};

function mkdirsSync(dirpath, mode){
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            pathtmp = pathtmp ? path.join(pathtmp, dirname) : (dirname?dirname:'/');
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true;
};

function urlMatch(dataArray,test){
    let array = [];
    dataArray.forEach(function(v){
        let src = v.match(test);
        if(src){
            src = RegExp.$1.replace(/\'|\"/ig,'').trim();
            if(src.match(/\.(?:js|css)\s*$/)){
                array.push(src);
            }
        }
    });
    return array;
}

function replaceContent(content,filename){
    content = content.replace(/<(html)[^>]*>/i,function(m,$1){
        if($1){
            return m.replace($1,'html manifest="'+filename+'"');
        }
        return m;
    });
    return content;
}

function writeCacheFile(path,filename,array){
    let srcArray = ['CACHE MANIFEST','# Time: '+ new Date().getTime(),'CACHE:',array.join('\r\n'),"NETWORK:","*"];
    if(mkdirsSync(path)){
        fs.writeFile(path+filename,srcArray.join('\r\n'),(err) => {
            if (err) throw err;
        });
    }
}

function Manifests(options){
    if(type(options) === 'object'){
        for (let i in options) this[i] = options[i];
    }

    this.originImg = {};
    let webP = this.webP || false;

    if(Array.isArray(webP) && webP.length > 0){
        webP = '\\.('+webP.join("|")+')';
        webP = new RegExp(webP,"gi");
    }

    this.webP = webP
}

Manifests.loadImg = path.join(__dirname,'loader.js');

Manifests.prototype.apply = function(compiler) {
    let that = this,
        cacheAdrray = [];
    compiler.plugin("compilation", function (compilation) {
        compilation.plugin('module-asset', function (module, file) {
            module.chunks.forEach(function(chunk){
                let key = path.normalize(chunk.name),
                    value = imagesConfig.imgObj[path.normalize(file)];
                value = value.replace(/__webpack_public_path__/gi,'"' + this.options.output.publicPath + '"');
                if(!Array.isArray(that.originImg[key])){
                    that.originImg[key] = [];
                }
                that.originImg[key].push(eval(value));
            }.bind(this));
        });

        compilation.plugin('html-webpack-plugin-before-html-generation', function(htmlPluginData, callback) {
            let assets = htmlPluginData.assets,
                chunks = assets.chunks,
                array = [];

            let filename = htmlPluginData.plugin.options.filename,
                filePath = path.resolve(filename),
                basname = path.basename(filename),
                manifestsFileName = basname.replace(path.extname(filePath),'.appcache');

            //设置webo格式
            for(let i in chunks){
                if(that.originImg[i]){
                    if(that.webP){
                        that.originImg[i].forEach(function(item){
                            if(item.match(that.webP)){
                                let imgStrArray = item.split('?');
                                imgStrArray[0] += '.webp';
                                array.push(imgStrArray.join('?'));
                            }
                        });
                    }
                    cacheAdrray = that.originImg[i].concat(array);
                }
            }

            //设置manifests
            htmlPluginData.assets.manifest = (() => {
                    let mPath = path.normalize('/' + filename.replace(basname,'') + manifestsFileName);
                    return that.domain ? that.domain + mPath : mPath;
                })();
            callback(null, htmlPluginData);
        });

        compilation.plugin('html-webpack-plugin-after-html-processing', function(htmlPluginData, callback) {
            let filename = htmlPluginData.plugin.options.filename,
                html = htmlPluginData.html,
                linkArray = html.match(rStyleScript),
                scriptArray = html.match(linkScript);

            let filePath = path.resolve(filename),
                basname = path.basename(filename),
                manifestsPath = filePath.replace(basname,''),
                manifestsFileName = basname.replace(path.extname(filePath),'.appcache');

            //css过滤
            if(linkArray){
                cacheAdrray = cacheAdrray.concat(urlMatch(linkArray,styleUrl));
            }

            //js过滤
            if(scriptArray){
                cacheAdrray = cacheAdrray.concat(urlMatch(scriptArray,scriptSrc));
            }

            cacheAdrray = Array.from(new Set(cacheAdrray));

            writeCacheFile(manifestsPath,manifestsFileName,cacheAdrray);
            htmlPluginData.html = html;
            callback(null, htmlPluginData);
        });
    });
};

module.exports = Manifests;