# flexible+adaptive
基于淘宝适配方案flexible + 翻屏h5 适配方案adaptive
## flexible解读及应用

原文: http://www.w3cplus.com/mobile/lib-flexible-for-html5-layout.html

大漠的文章（简洁）：https://github.com/amfe/article/issues/17

giuhub：https://github.com/amfe/lib-flexible

本文主要介绍的是如何使用Flexible库来完成H5页面的终端适配。为什么推荐使用Flexible库来做H5页面的终端设备适配呢？主要因为这个库在手淘已经使用了近一年，而且已达到了较为稳定的状态。
其实H5适配的方案有很多种，网上有关于这方面的教程也非常的多。移动端适配原理大同小异，大部分是通过控制根元素<html>的font-size值实现设备宽度的适配（通常是宽度）。

**方案一：浏览器缩放viewport**
>简单方便，像素失真

```javascript
	var phoneScale = parseInt(window.screen.width)/640;
	document.write('<meta name="viewport" content="width=640, initial-scale = '+phoneScale+', maximum-scale = '+phoneScale+', maximum-scale = '+phoneScale+', target-densitydpi=device-dpi">');
	}
```
**方案二：CSS MediaQuery**
>易理解，断点区间，安卓机型问题多，需特殊照顾

```css
	@media (min-width:340px) and (max-width: 359px) {
	    html,body{font-size: 66%;}
	}
	@media (min-width:360px) and (max-width: 374px) {
	    html,body{font-size: 70%;}
	}
	...
	
```
**方案三：淘宝flexible**
>市面流行，经受的住数亿网民的考验


### 源码解读
**实际上：flexible计算dpr，通过width和dpr计算fontSize；对于dpr不等于1的设备，则通过viewport缩小，fontSize放大，达到设配高清屏的目的。**
flexible目前最新也是最稳定版本-0.3.2，实现很简单，主要做以下三件事：

>1.计算dpr，rem值
>2.动态改写meta-viewport标签
>3.动态改写html元素font-size的值

2、3点基于1的计算结果，那么问题就转化为计算dpr、rem，上源码：
**计算dpr核心代码**
```javascript
	var isIPhone = win.navigator.appVersion.match(/iphone/gi);
	var devicePixelRatio = win.devicePixelRatio;
	if (isIPhone) {
	    if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {                
	        dpr = 3;
	    } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)){
	        dpr = 2;
	    } else {
	        dpr = 1;
	    }
	} else {
	    // 其他设备下，仍旧使用1倍的方案
	    dpr = 1;
	}
```
>IOS下：dpr>=3 ==> 3,dpr>=2 ==> 2; 
>Android下：dpr === 1（有点无语）

**计算rem核心代码**
```javascript
	function refreshRem(){
	    var width = docEl.getBoundingClientRect().width;
	    if (width / dpr > 540) {
	        width = 540 * dpr;
	    }
	    var rem = width / 10;
	    docEl.style.fontSize = rem + 'px';
	    flexible.rem = win.rem = rem;
	}
```

**如果已有viewport或flexible标签则以此计算dpr（优先配置功能）**
```javascript
	var metaEl = doc.querySelector('meta[name="viewport"]');
    var flexibleEl = doc.querySelector('meta[name="flexible"]');
    if (metaEl) {
        //console.warn('将根据已有的meta标签来设置缩放比例');
        var match = metaEl.getAttribute('content').match(/initial\-scale=([\d\.]+)/);
        if (match) {
            scale = parseFloat(match[1]);
            dpr = parseInt(1 / scale);
        }
    } else if (flexibleEl) {
        var content = flexibleEl.getAttribute('content');
        if (content) {
            var initialDpr = content.match(/initial\-dpr=([\d\.]+)/);
            var maximumDpr = content.match(/maximum\-dpr=([\d\.]+)/);
            if (initialDpr) {
                dpr = parseFloat(initialDpr[1]);
                scale = parseFloat((1 / dpr).toFixed(2));
            }
            if (maximumDpr) {
                dpr = parseFloat(maximumDpr[1]);
                scale = parseFloat((1 / dpr).toFixed(2));
            }
        }
    }
```

**动态改写meta-viewport、html的data-dpr属性（默认配置）**
```javascript
	docEl.setAttribute('data-dpr', dpr);
	if (!metaEl) {
	    metaEl = doc.createElement('meta');
	    metaEl.setAttribute('name', 'viewport');
	    metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
	    if (docEl.firstElementChild) {
	        docEl.firstElementChild.appendChild(metaEl);
	    } else {
	        var wrap = doc.createElement('div');
	        wrap.appendChild(metaEl);
	        doc.write(wrap.innerHTML);
	    }
	}
```

### viewport知识补充

如果你对视窗viewport不是很了解，建议读读[《消除viewport的疑惑-移动网页开发》](https://www.zybuluo.com/gongzhen/note/170557)，写的非常好！
通常的，移动端页面会写上这么一句：
```html
	<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1, maximum-scale=1, user-scalable=no" />
```
flexible的viewport是这样写的：
```javascript
	metaEl.setAttribute('content', 'initial-scale=' + scale + ', maximum-scale=' + scale + ', minimum-scale=' + scale + ', user-scalable=no');
```
读到这里寂寞的读者会发现，flexible没有直接定义device-width？好吧，上文挑重点说：
```html
	<meta name="viewport" content="initial-scale=1">
	<meta name="viewport" content="width=device-width">
```
>这两句代码能达到一样的效果，也可以把当前的的viewport变为 ideal viewport。缩放是相对于什么来缩放的？因为这里的缩放值是1，也就是没缩放，但却达到了 ideal viewport 的效果，所以，那答案就只有一个了，缩放是相对于 ideal viewport来进行缩放的，当对ideal viewport进行100%的缩放，也就是缩放值为1的时候，不就得到了 ideal viewport吗？事实证明，的确是这样的。当两者同时存在时取其最大值。

**附：**
```javascript
	device-width      ==> win.screen.width                      始终是竖屏结果
	ideal-viewport    ==> docEle.getBoundingClientRect().width  横竖屏结果不一样
	initial-scale = 1 ==> 100% * ideal-viewport
```
<hr>
### 使用
在head引入flexible.js
>使用flexible就不要设置metaviewport了，因为会阻断后面的执行，详情看源码；除非你想自定义dpr

```html
	//直接加载cdn文件（其中css文件非必须）
	<script src="http://g.tbcdn.cn/mtb/lib-flexible/0.3.4/??flexible_css.js,flexible.js"></script>
	//或下载到项目目录下
	<script src="/local-assets/js/flexible/flexible-0.3.2.js"></script>
```
其他的事都是css的事，根据你的PSD尺寸，如640px宽，那么rem基准就是640/10=64px，有一个64px高的div就是：height:1rem;
推荐 [sublimeText3 cssrem插件](https://github.com/flashlizi/cssrem) 自动完成计算

## adaptive解读及应用

adaptive是基于flexible的h5翻屏适配解决方案，是对flexible的dpr和fontSize的计算结果，进一步精准计算并动态改写。简言之：flexible适配设备宽度，adaptive适配设备高度。

### 怎么样算适配好
一个场景：一副满屏的背景图片，怎么样才是适配到各个设备？长宽比不同的设备，总要有所取舍，你想 background-size: 100% | contain | cover; 100%会拉伸，contain会留白，cover会裁切。这时候傻逼运营来了：这页面有bug，图片显示不全balabala。我就问你what are you fucking doing？
回到正题，估计做翻屏遇到最多的问题就是页面元素显示不全了吧，因为往往浏览器五花八门的标题栏和功能区会占据可视区域。
以本工厂单屏设计稿为例： 640 * 1136（i5，ISUX给的宽高比则比较合理：320 * 504，减去了标题栏高度），
另一个极端机子MX4 可视区是384 * 518，问你死了没
![极端](http://images.vrm.cn/2017/02/07/p1.jpg "设计稿")
那么这种情况下，这样显示比较合理？显然，信息肯定要显示全，排版不能乱。要满足此需求，估计只有缩小元素了吧，如果有更好的点子还望不吝赐教。
![排版](http://images.vrm.cn/2017/02/07/p2.jpg "设计稿")

### 如何用高度计算fontSize
使用rem的好处就是只需关心根元素fontSize，flexible已经计算好宽度的fontSize了，以下计算校准值：

```javascript
	var autoScale = function(){
	    var designW = 640,                               //设计稿宽
	        designH = 1136,                              //设计稿高
	        winW = docEl.clientWidth,                    //实际可视区宽
	        winH = docEl.clientHeight,                   //实际可视区高
	        idealFs = parseFloat(docEl.style.fontSize),  //理想基准字号（既flexible计算字号）
	        idealH = winW * designH / designW,           //理想可视区高（根据设计稿等比缩放计算高度）
	        exactFs = winH * idealFs / idealH,           //准确基准字号（最终结果）
	        
	    docEl.style.fontSize = exactFs + 'px';
	};
```
上码定义了设计稿宽高，实际可视区宽高，理想情况下：这两组数据的比值相等，那么也就没这里什么事了。然鹅这是不可能滴，实际上，iphone5 640 * 1136 的宽高比是比较极端的了，相比绝大部分机子是比较“高”的，所以计算出最终fs结果是变小的。
分析一下以上函数：
>1.根据设计稿宽高（已知）和实际可视宽度计算出理想可视区高idealH，所谓理想，既是上文提到的理想宽高比值与设计稿的相等
>2.根据理想可视区高idealH计算出准确基准字号exactFs
>3.把exactFs赋值给根元素就可以了

以下为UC的测试数据，可视宽度（window.innerWidth）可视高度(window.innerHeight)

| |可视宽度|可视高度（含导航栏）|可视高度（不含导航栏）|dpr|
|---|---|---|---|---|
|iphone6|	375|	   559 |   	       628|                   2|
|Snote4|	 360|	   519|	           567|	                  4|
|MI4|	    360|	   514|	           564|	                  4|
|P8|	     360|	   470|	           519|	                  2|
|Honor3C|	350|	   518|	           567|	                  2|
|Mnote2|	 360|	   519|	           567|	                  3|
|MX4|	    384|	   518|	           567|	                  3|

### 生产中遇到的坑
**坑1：安卓机获取可视区高前后不一致**
测试中发现，“前后”具体体现在滚动过页面，首次加载的高度比滚动后二次加载的高度小，得益于之前调研上表时做了大量测试，原因是滚动后浏览器会收起标题栏释放了占有的高度，这就导致了页面元素太大而溢出可视区，不信？试试。那么既然问题出在滚动上，以其人之道还治其人之身：
```javascript
	//以i6 uc为例
	alert(docEl.clientHeight);//559
	win.scrollTo(0,0);
	alert(docEl.clientHeight);//585，不错，是我要的结果
```

在autoScale函数前加入 win.scrollTo(0,0); 哼哼，这把该可以了吧
```javascript
	var autoScale = function(){
		win.scrollTo(0,0);
		...
	}
```

什么！还是不行？![bq](http://images.vrm.cn/2017/02/10/bq.png "bq")。。。
long long after 我又回头看了flexible的源码，才发现
```javascript
	win.addEventListener('resize', function() {
       clearTimeout(tid);
       tid = setTimeout(refreshRem, 300);
    }, false);
```

天了噜，win.scrollTo(0,0); 解决的问题，resize又让他一夜回到解放前。考虑到手机端resize的情况很少见，不像pc可以拖拽，于是为了配合adaptive，我把resize监听注释了。问题解决！

**坑2：浏览器回退**
之前没考虑到浏览器回退的情况，展哥提供的bug，发现会有放大情况。曾老师提供思路，于是问题很快解决。浏览器回退不会触发onload但会触发pageshow，之前adaptive没有监听pageshow，而flexible有，于是。。。  加了监听事件，大功告成。

### 优化
0.1.2版本加入了横竖屏判断和提示，横屏会添加遮罩，提示“请使用竖屏浏览”。

### 使用
example：http://70.vrm.cn/8

在head引入flexible.js，adaptive.js，有前后依赖关系
```html
	<script src="/local-assets/js/flexible/flexible-0.3.2.js"></script>
	<script src="/local-assets/js/flexible/adaptive-0.1.2.js"></script>
```

在flexible基础上无痛修改，其他该怎么写怎么写，请参照前文。
另外：如有设计稿尺寸不一致，只需修改 designW，designH的值即可。

等等，wap页面还要兼容pc？
好吧，pc怎么排版合适？想了想：高度满屏，宽度自适应可以不
pc，wap代码分管的，直接在pc以上js文件后插入；如果用一份代码，判断ua去吧~
```javascript
	<script>
        (function(win,doc){
            var wh = win.innerHeight;
            var dh = 1136;
            var dw = 640;
            var h = wh;
            var w = dw * wh / dh;
            var docEl = doc.documentElement;
            setTimeout(function(){
                docEl.style.cssText = 'width:'+ w +'px;height:'+ h +'px;margin:0 auto;font-size:'+ w/10 + 'px';},300);
        })(window,document);
    </script>
```

### 结语
本文到此结束，开发中遇到的问题均已修复，如发现任何bug或可优化的地方欢迎随时回复交流
