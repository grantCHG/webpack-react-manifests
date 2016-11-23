### 安装

```javascript
   npm install webpack-react-manifests --save
```

### 使用

```
	webpack.config.js
    
	let Manifests = require('webpack-react-manifests');
	
	let imageCDN = manifestsCDN = "http://localhost:4000";

	module: {
            loaders: [
                {
                    test: /\.(jpe?g|png|gif|svg)$/,
                    loaders:[
				        Manifests.loadImg + '?'+JSON.stringify({domain: imageCDN}),	//截取所用到的资源文件，并且可以添加域名
				        'file-loader?'+JSON.stringify({name : imagePath+imgName+'.[ext]'}),
				    ]
                }
            ]
        },
   
    plugins: [
		new HtmlWebpackPlugin({	//html-webpack-plugin 必须装，因为在这个插件上拓展
            filename: xxx.html,
            template: xxx.html,
            inject:true,
            hash: false,
            cache: true,
            minify:{    //压缩HTML文件
                removeComments:true,    //移除HTML中的注释
                collapseWhitespace:true,    //删除空白符与换行符
            }
        }),
        new Manifests({
            domain: manifestsCDN,	//为manifest文件添加域名
            webP:['jpg', 'png', 'jpeg']	//过滤添加webP支持的图片
        })
	]
```


功能：

1、载取打包时，该目录下用到的图片资源，并且添加资源域名<br/>
```
	manifest="http://localhost:4000\xxxx\index.appcache"
```

2、为manifest文件添加域名；

3、支持为图片资源后面添加.webp功能；

(欢迎反馈BUG，方便提升插件的质量)