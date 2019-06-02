/**
 * 布局插件——Arrangement
 */

(function (win, doc) {
    "use strict";

    var defaults = {  //默认配置参数
        shell: "shell",  //默认外层盒子id
        region: "region",  //默认里层盒子class
        gap: 10,  //regions之间的间距，单位px,
        callback: null  //拖放结束后的回调
    };
    var shell = null;  //最外层盒子
    var regions = [];  //全部region
    var curRegion = null;  //当前要拖动的region
    var column = 0;  //总列数

    /**
     * 将用户定义的参数与默认参数进行合并(深拷贝)
     * @param cus  //用户传入的参数--object
     * @param def  //插件默认的参数--object
     * @returns {{}}
     */
    function comParams(cus, def) {
        var res = {};  //需要返回的结果
        if (cus === undefined) {
            cus = {};
        }

        //判断参数是否为object,返回true或false
        function isObject(o) {
            return Object.prototype.toString.call(o) === '[object Object]';
        }

        for (var key in def) {
            if (def.hasOwnProperty(key)) {  //默认参数是否具有key属性
                if (cus.hasOwnProperty(key)) {  //自定义参数是否具有key属性
                    if (isObject(def[key]) && isObject(cus[key])) {  //默认参数与自定义参数的key属性是否都是object
                        comParams(cus[key], def[key]);  //key属性都为object就进行递归
                    } else {
                        res[key] = {};  //如果其中一个key属性不是object,那就赋值为{}
                    }
                    res[key] = cus[key];  //如果key属性都不为object就赋值为自定义参数的key属性
                } else {
                    res[key] = def[key];  //如果自定义参数没有key属性,就赋值为默认参数的key属性
                }
            }
        }
        return res;
    }

    win.Arrangement = (function () {

        /**
         * 插件构造函数
         * @param options
         * @constructor
         */
        function Arrangement(options) {
            var me = this;

            me.config = comParams(options, defaults);  //默认参数与用户自定义参数合并

            //---------------------------------获取最外层盒子
            shell = document.getElementById(me.config.shell);
            if (shell === null) {
                alert("没有获取到这个ID的外盒子！");
                return;
            }
            shell.style.position = "relative";

            //---------------------------------获取shell的所有里层盒子
            for (var i = 0; i < shell.childNodes.length; i++) {
                if (shell.childNodes[i].nodeType === 1 && shell.childNodes[i].tagName.toLowerCase() === "div" && shell.childNodes[i].className.indexOf(me.config.region) !== -1) {
                    regions.push(shell.childNodes[i]);
                    regions[regions.length - 1].style.position = "absolute";
                    regions[regions.length - 1].style.zIndex = 0;
                }
            }

            shell.style.minWidth = regions[0].offsetWidth + me.config.gap * 2 + 'px';  //设置shell最小宽度

            me.init();  //插件初始化
            me._bindE();  //插件绑定事件
        }

        Arrangement.prototype = {

            /**
             * 插件初始化
             */
            init: function () {
                var me = this;
                me.arrange();
            },

            /**
             * 排列每个region
             */
            arrange: function () {
                var me = this;
                var gap = me.config.gap;  //盒子间距
                var shellW = me.getSW();  //当前shell的宽度
                var regionsW = 0;  //一横行regions的当前总宽度
                var regionsH = 0;  //一竖行regions的当前总高度
                column = Math.floor((shellW - gap) / (regions[0].offsetWidth + gap));  //region列数

                for (var i = 0; i < regions.length; i++) {
                    if (i !== 0 && i % column === 0) {
                        regionsW = 0;  //换行后第一个region左边距重置为0
                        regionsH += regions[i].offsetHeight + gap;  //重新设置当前行region的上边距
                    }
                    regions[i].style.top = regionsH + gap + 'px';
                    regions[i].style.left = regionsW + gap + 'px';
                    regions[i].style.transition = 'ease 0.4s';
                    regionsW += regions[i].offsetWidth + gap;  //重新设置下一个region左边距
                }

                shell.style.height = regionsH + regions[0].offsetHeight + gap * 2 + 'px';  //shell盒子自适应的高度
            },

            /**
             * 绑定事件
             * @private
             */
            _bindE: function () {
                var me = this;
                var isDrag = false;  //是否可以拖动
                var m_offset = [];  //鼠标按下时相对于region左上角的坐标
                var origin_pos = [];  //鼠标按下时reigion原始坐标
                var shellW = me.getSW();  //当前shell的宽度
                var shellH = me.getSH();  //当前shell的高度
                var singleW = regions[0].offsetWidth + me.config.gap;  //单个region宽度
                var singleH = regions[0].offsetHeight + me.config.gap;  //单个region高度
                var coordinate = [];  //要插入的位置坐标
                var origin_index = 0;  //当前reigon原始数组索引
                var new_pos = 0;  //当前reigon新数组索引
                var curRegionClone = null;  //curRegion的克隆体

                shell.addEventListener("mousedown", function (e) {  //绑定鼠标按下事件
                    if (e.target.tagName.toLowerCase() === "div" && e.target.className.indexOf(me.config.region) !== -1) {
                        curRegion = e.target;
                        curRegionClone = curRegion.cloneNode(true);
                        shell.appendChild(curRegionClone);
                        curRegionClone.style.opacity = 0;
                        curRegion.style.opacity = 0.5;
                        curRegion.style.transition = null;
                        curRegion.style.zIndex = "9999";
                        origin_index = regions.indexOf(curRegion);  //获取当前索引
                        regions.splice(origin_index, 1);  //从数组中删除该region
                        regions.splice(origin_index, 0, curRegionClone);  //将克隆体添加到改索引下
                        m_offset = [
                            e.pageX - curRegion.offsetLeft,
                            e.pageY - curRegion.offsetTop
                        ];
                        origin_pos = [curRegion.offsetLeft, curRegion.offsetTop];
                        isDrag = true;
                    }
                });

                doc.addEventListener("mousemove", function (e) {  //绑定鼠标拖动事件
                    var mousePos = [e.pageX, e.pageY];  //鼠标当前相对于页面的坐标
                    var regionPos = [0, 0];  //region新的坐标
                    if (isDrag) {
                        regionPos = [
                            mousePos[0] - m_offset[0],
                            mousePos[1] - m_offset[1]
                        ];

                        curRegion.style.left = regionPos[0] + "px";
                        curRegion.style.top = regionPos[1] + "px";

                        if (curRegion.offsetTop + curRegion.offsetHeight <= 0 || curRegion.offsetTop >= shell.offsetHeight || curRegion.offsetLeft >= shellW || curRegion.offsetLeft + curRegion.offsetWidth <= 0) {
                            regions.splice(regions.indexOf(curRegionClone), 1);  //从数组中删除该克隆体
                            new_pos = regions.length - 1;
                            regions.splice(new_pos + 1, 0, curRegionClone);  //添加回克隆体
                            me.arrange();
                            return false;
                        }

                        coordinate[0] = Math.ceil(curRegion.offsetLeft / singleW);
                        coordinate[1] = Math.floor((curRegion.offsetTop + curRegion.offsetHeight / 2) / singleH);
                        if (shellW - curRegion.offsetLeft < curRegion.offsetWidth / 2 && curRegion.offsetLeft < shellW) {
                            coordinate[0] -= 1;
                        }
                        if (shellH - curRegion.offsetTop < curRegion.offsetHeight / 2 && curRegion.offsetTop < shellH) {
                            coordinate[1] -= 1;
                        }
                        if (coordinate[0] < 0) {  //负数时归零
                            coordinate[0] = 0;
                        }
                        if (coordinate[1] < 0) {  //负数时归零
                            coordinate[1] = 0;
                        }

                        //-------------------判断是从小索引到大索引还是相反，因为方向不同坐标值不同（算法问题）
                        if (new_pos > origin_index) {
                            coordinate[0] -= 1;
                        }

                        new_pos = coordinate[0] + (coordinate[1] * column);  //克隆体新的索引位置

                        if (new_pos > regions.length - 1) {
                            new_pos = regions.length - 1;
                        }

                        regions.splice(regions.indexOf(curRegionClone), 1);  //从数组中删除该克隆体
                        regions.splice(new_pos, 0, curRegionClone);  //添加回克隆体

                        me.arrange();

                    }
                });

                doc.addEventListener("mouseup", function () {  //绑定鼠标松开事件
                    if (isDrag) {
                        curRegion.style.opacity = 1;
                        curRegion.style.backgroundColor = "#e28b41";
                        curRegion.style.transition = 'ease 0.4s';


                        regions.splice(regions.indexOf(curRegionClone), 1);  //从数组中删除该克隆体
                        regions.splice(new_pos, 0, curRegion);  //将本体添加回该索引下

                        if (curRegion.offsetTop + curRegion.offsetHeight <= 0 || curRegion.offsetTop >= shell.offsetHeight || curRegion.offsetLeft >= shellW || curRegion.offsetLeft + curRegion.offsetWidth <= 0) {
                            regions.splice(new_pos, 1);
                            regions.splice(regions.length, 0, curRegion);
                        }

                        curRegion.style.left = curRegionClone.offsetLeft;
                        curRegion.style.top = curRegionClone.offsetTop;
                        shell.removeChild(curRegionClone);
                        me.arrange();
                        curRegion.style.zIndex = 0;

                        //---------------------------执行回调
                        if (me.config.callback && typeof me.config.callback === "function") {
                            setTimeout(function () {
                                me.config.callback();
                            }, 400);
                        }
                    }

                    isDrag = false;
                });

                win.addEventListener("resize", function () {  //绑定窗口大小变化事件
                    me.arrange();
                });
            },

            /**
             * 获取当前shell盒子宽度
             * @private
             */
            getSW: function () {
                return Number(shell.clientWidth);
            },

            /**
             * 获取当前shell盒子高度
             * @private
             */
            getSH: function () {
                return Number(shell.clientHeight);
            }
        };

        return Arrangement;
    })();


})(window, document);