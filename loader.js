/**
 * Created by timxuan on 2016/11/22.
 */

'use strict';

let path = require('path'),
    loaderUtils = require("loader-utils"),
    imagesConfig = require('./imagesConfig');

function checkNum(num,len){
    return num >= len ? 0: (num < 0 ? (len - 1):num);
}

module.exports = function(content){
    this.cacheable && this.cacheable();
    let query = loaderUtils.parseQuery(this.query),
        domain = query.domain;

    let num = 0,len = 0,
        isArray = Array.isArray(domain);

    if(isArray){
        len = domain.length;
        if(len > 0){
            num = Math.floor(Math.random() / (1 / len));
            num = checkNum(num, len);
            domain = domain[num]
        }
    }

    if(domain){
        domain = domain.trim();

        if(!domain.charAt(domain.length - 1).match(/\\|\//gi)){
            domain += '/';
        }

        content = content.replace('__webpack_public_path__','\"'+domain+'\"');
    }

    let imgArray = content.match(/\"([^"]+)\";$/),
        domainArray = content.match(/module.exports\s*=\s*([^;]+);$/);

    if(imgArray && domainArray){
        imagesConfig.imgObj[path.normalize(imgArray[1])] = domainArray[1];
    }

    return content;
};