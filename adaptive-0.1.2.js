/*
** 移动端翻屏适配方案 FROM chess
** Update【2017年02月16日】
*/

(function(win,doc){
    var docEl = doc.documentElement;
    var tid;
    var autoScale = function(){
        win.scrollTo(0,0);                               //解决android首次加载会截去标题栏高度
        var designW = 640,                               //设计稿宽
            designH = 1136,                              //设计稿高
            winW = win.innerWidth,                       //实际可视区宽
            winH = win.innerHeight,                      //实际可视区高
            idealFs = parseFloat(docEl.style.fontSize),  //理想基准字号（既flexible计算字号）
            idealH = winW * designH / designW,           //理想可视区高（根据设计稿等比缩放计算高度）
            exactFs = winH * idealFs / idealH,           //准确基准字号（最终结果）
            viewportEle = doc.querySelector('meta[name="viewport"]'),
            initialScale = parseFloat(viewportEle.getAttribute('content').match(/initial\-scale=([\d\.]+)/)[1]),
            exactscale = initialScale*exactFs/idealFs;   //准确viewport scale
            
        //方案一：校准基准字号
        docEl.style.fontSize = exactFs + 'px';
    };

    function refreshFs(){
        clearTimeout(tid);
        tid = setTimeout(autoScale, 300);
    }

    win.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            refreshFs();
        }
    }, false);

    refreshFs();

    var mask = doc.createElement('div');
    var maskChild = doc.createElement('div');
    mask.setAttribute('role','landdScapeMask');
    mask.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.9);z-index:99999;text-align:center;padding-top:120px;color:#fff;-webkit-transition: all 0.5s linear;transition: all 0.5s linear;';
    mask.innerHTML = '为保持最佳体验，请使用竖屏浏览 : )';
    mask.appendChild(maskChild);

    //横竖屏提示
    win.addEventListener('onorientationchange' in win ? 'orientationchange' : 'resize',function(){
        // 原orientation属性已被废弃
        var isLandscape = window.innerWidth > window.innerHeight
        var maskEle = doc.querySelector('div[role="landdScapeMask"]');
        if(isLandscape){
            if (!maskEle) docEl.appendChild(mask);
        }else{
          if (maskEle) docEl.removeChild(maskEle);
        }
    },false);

})(window,document);
