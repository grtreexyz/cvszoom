;
//create by 栾树崇
//version 1.5
//瓦片图放大效果
//带缩略图定位效果
//自适应鼠标和触摸设备
//双击放大，滚轮缩放
//拖动动量加速度，快速拖动后会继续运动
//splitBlock为阿里云图片服务分片器
//'img','canvas'//img模式现在效果比较理想，canvas模式不够平滑有时闪，还没想到办法解决

// splitBlock('阿里云图片服务地址/201607080042354133d66e4e4.jpg',{
//     "height": 3689,
//     "size": 6180319,
//     "width": 4924},null,function(data) {
//     console.log(data)
//     temp = $('#contain').cvszoom(data);
//     temp.closed = function() {
//         console.log('closed');
//     }
// });

// <script type="text/javascript">
//     var $container = $('body');
//     var imgurl = 图片地址
//     $.get(imgurl + '@info', function (data) {
//         var d = splitBlock(imgurl, data, { fbl0: 800,scaleNum:1.8, src000: imgurl + '_small01' });
//         var temp=$container.cvszoom(d, { thumbnail: true,scaleNum:1.8 });
//     });
// </script>
(function($, window, document, undefined) {
    $.fn.cvszoom = function(imgLevels, options) {
        var t = new cvszoom(this, imgLevels, options);
        return t;
    }

    function cvszoom(el, imgLevels, options) {
        var self = this;
        self.$layer = $(el);
        self.imgLevels = imgLevels;
        self.defaults = {
            'fullWidth': imgLevels[0][0][0].w,
            'fullHeight': imgLevels[0][0][0].h,
            'initSize': 0.8, //初始显示时相对容器的比例
            'scaleNum': 1.8, //每次放大相对上一级的单边放大倍数
            'overScaleTimes': 2, //放大到全分辨率后，可以继续放大的倍数
            'whiteBorderSize': 100, //图片边缘与容器边缘的最大间隙
            'thumbnail': true, //是否显示缩略图
            'thumbnailSize': 160,//缩略图的大小
            'mode': 'img' //'img','canvas'//img模式现在效果比较理想，canvas模式不够平滑有时闪，还没想到办法解决
        };
        if ('MozTransform' in document.documentElement.style || 'WebkitTransform' in document.documentElement.style || 'OTransform' in document.documentElement.style || 'msTransform' in document.documentElement.style) {
            self.canTransform = true;
        } else {
            self.canTransform = false;
        }
        self.options = $.extend({}, self.defaults, options);
        //初始化canvas
        if (self.options.mode == 'canvas') {
            try {
                self.canvas = document.createElement("canvas");
                self.canvas.crossOrigin = 'anonymous';
                self.ctx = self.canvas.getContext('2d');
            } catch (e) {
                imgmodeinit();
            }
        } else {
            imgmodeinit();
        }

        function imgmodeinit() {
            self.options.mode = 'img';
            self.canvas = document.createElement('div');
            self.canvas.style.backgroundImage = 'url(' + imgLevels[0][0][0].src + ')';
            self.canvas.style.backgroundSize = '100% 100%';
        }
        self.imgs = [];
        for (var i = 0; i < imgLevels.length; i++) {
            self.imgs[i] = [];
            for (var wi = 0; wi < imgLevels[i].length; wi++) {
                self.imgs[i][wi] = [];
                for (var yi = 0; yi < imgLevels[i][wi].length; yi++) {
                    self.imgs[i][wi][yi] = {};
                }
            }
        }
        i--;
        self.LevelMax = i;
        var ww, hh;
        self.containW = self.$layer.width(); //容器宽
        self.containH = self.$layer.height(); //容器高
        if (self.options.mode != 'img') {
            self.canvas.width = self.containW;
            self.canvas.height = self.containH;
        } else {
            self.canvas.style.width = self.options.fullWidth + 'px';
            self.canvas.style.height = self.options.fullHeight + 'px';
        }
        self.kgb = self.options.fullWidth / self.options.fullHeight; //图片宽高比
        containkgb = self.containW / self.containH; //容器宽高比
        self.kgb > containkgb ? (ww = self.containW * self.options.initSize, hh = ww / self.kgb) : (hh = self.containH * self.options.initSize, ww = hh * self.kgb);
        self.top = (self.containH - hh) / 2; //canvas相对容器位置
        self.left = (self.containW - ww) / 2; //canvas相对容器位置
        self.width = ww; //canvas显示的大小,
        self.height = hh; //canvas显示的大小
        self.canvas.style.position = 'absolute';
        self.canvas.style.top = 0;
        self.canvas.style.left = 0;
        self.$layer.css('overflow', 'hidden');
        if (self.$layer.css('position') == 'static') self.$layer.css('position', 'relative');


        self.scale = 1;
        var maxWH = Math.max(self.options.fullWidth, self.options.fullHeight);
        self.maxScaleNum = Math.ceil(Math.max(self.options.fullWidth / self.containW, self.options.fullHeight / self.containH) * self.options.overScaleTimes);
        self.curLevel = 0;
        //self.curLevelAllDraw = false;
        self.initdraw();
        self.$layer.append(self.canvas);
        self.$canvas = $(self.canvas);
        self.$canvas.css({ '-moz-transform-origin': '0 0', '-webkit-transform-origin': '0 0', '-ms-transform-origin': '0 0', 'transform-origin': '0 0' });
        self.$canvas.on('mousedown touchstart', function(e) {
            self.imgMove(e, self);
        });
        self.$layer.on('touchstart', function(ev) {
            var touchs = ev.originalEvent.touches;
            if (touchs.length != 2) return;
            ev.preventDefault();
            var x00 = touchs[0].clientX;
            var y00 = touchs[0].clientY;
            var x10 = touchs[1].clientX;
            var y10 = touchs[1].clientY;
            var dis = Math.sqrt((x10 - x00) * (x10 - x00) + (y10 - y00) * (y10 - y00));
            self.$layer.off('touchmove').on('touchmove', function(ev) {
                ev.preventDefault();
                var touchs = ev.originalEvent.touches;
                if (touchs.length != 2) {
                    self.$layer.off('touchmove');
                    return;
                }
                x00 = touchs[0].clientX;
                y00 = touchs[0].clientY;
                x10 = touchs[1].clientX;
                y10 = touchs[1].clientY;
                var dis2 = Math.sqrt((x10 - x00) * (x10 - x00) + (y10 - y00) * (y10 - y00));
                if (dis2 - dis > 2) {
                    self.Scale(1.05);
                    dis = dis2;
                } else if (dis2 - dis < -2) {
                    self.Scale(0.93);
                    dis = dis2;
                }
            });
            self.$layer.on('touchend', function(ev) {
                ev.preventDefault();
                self.$layer.off('touchmove touchend');
            });
        });
        //滚轮事件
        self.$layer.on('mousewheel DOMMouseScroll', function(e) {
            e.preventDefault();
            var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
            if (typeof e.pageX != 'undefined')
                delta > 0 ? self.Scale(1.1, { x: e.pageX - self.$layer.offset().left, y: e.pageY - self.$layer.offset().top }) : self.Scale(0.9, { x: e.pageX - self.$layer.offset().left, y: e.pageY - self.$layer.offset().top });
            else
                delta > 0 ? self.Scale(1.1) : self.Scale(0.9);
        });
        self.$canvas.dblclick(function(e) {
            e.preventDefault();
            if (typeof e.pageX != 'undefined')
                self.Scale(self.options.scaleNum, { x: e.pageX - self.$layer.offset().left, y: e.pageY - self.$layer.offset().top });
            else
                self.Scale(self.options.scaleNum);
        });
        window.onorientationchange = function() {
            setTimeout(function() { self.resize(self); }, 100);
        }
        self.floorLevelTimeout = 'undefined';
        //缩略图
        if (self.options.thumbnail) {
            var str = '<div class="cvs_thumbnail" >';
            str += '<div class="huidi"></div>';
            str += '<div class="shang"></div>';
            str += '<div class="xia"></div>';
            str += '<div class="previewbox">';
            str += '<img src="" draggable="false" />';
            str += '<div class="brightbox"></div>';
            str += '<div class="dimbox top"></div>';
            str += '<div class="dimbox left"></div>';
            str += '<div class="dimbox right"></div>';
            str += '<div class="dimbox bottom"></div>';
            str += '</div>';
            str += '<span class="btn scalebrightbox"></span>';
            str += '<span class="btn closeButton">✕</span>';
            str += '<span class="btn smallButton">-</span>';
            str += '<span class="btn bigButton">+</span>';
            str += '</div>';
            self.$thumbnail = $(str);
            self.$layer.append(self.$thumbnail);
            self.$preview = self.$thumbnail.find('.previewbox');
            self.$scalebrightbox = self.$thumbnail.find('.scalebrightbox');
            var $brightbox = self.$thumbnail.find('.brightbox');
            initPreview();

            function initPreview() {
                self.$thumbnail.css({ width: self.options.thumbnailSize + 'px', height: self.options.thumbnailSize + 'px' });
                self.$thumbnail.find('.previewbox>img').attr('src', self.imgLevels[0][0][0].src);
                if (self.kgb > 1) {
                    self.$preview.h = (self.options.thumbnailSize / self.kgb).toFixed(2);
                    self.$thumbnail.find('.previewbox').css({ width: self.options.thumbnailSize + 'px', height: self.$preview.h + 'px' });
                    self.$preview.w = self.options.thumbnailSize;
                    $brightbox.css('width', self.$preview.w + 'px');
                    $brightbox.css('height', self.$preview.h + 'px');
                } else {
                    self.$preview.w = (self.options.thumbnailSize * self.kgb).toFixed(2);
                    self.$thumbnail.find('.previewbox').css({ width: self.$preview.w + 'px', height: self.options.thumbnailSize + 'px' });
                    self.$preview.h = self.options.thumbnailSize;
                    $brightbox.css('width', self.$preview.w + 'px');
                    $brightbox.css('height', self.$preview.h + 'px');
                }
                self.$scalebrightbox.mw = self.options.thumbnailSize - self.$scalebrightbox.width() - 60;


            };
            self.$thumbnail.find('.shang').on('mousedown touchstart', function(e) { //放大缩小条
                e.preventDefault();
                var xy = self.getxy(e);
                var x0 = xy.x;
                var y0 = xy.y;
                $(document).off('mousemove touchmove').on('mousemove touchmove', function(e) {
                    e.preventDefault();
                    var xy = self.getxy(e);
                    var x1 = xy.x;
                    var y1 = xy.y;
                    var right = parseFloat(self.$thumbnail.css('right')) - x1 + x0;
                    var top = parseFloat(self.$thumbnail.css('top')) + y1 - y0;
                    self.$thumbnail.css({ right: right + 'px', top: top + 'px' });
                    x0 = x1;
                    y0 = y1;
                });
                //鼠标弹起
                $(document).off("mouseup touchend").on("mouseup touchend", function(e) {
                    e.preventDefault();
                    $(document).off('mousemove mouseup touchmove touchend');
                });
            });
            self.$thumbnail.find('.xia,.scalebrightbox').on('mousedown touchstart', function(e) { //放大缩小条
                if (self.$scalebrightbox.setCapture) {
                    self.$scalebrightbox.setCapture();
                } else if (window.captureEvents) {
                    window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                }
                e.preventDefault();
                var x1 = self.$thumbnail.position().left;
                var x0 = self.getxy(e).x;
                var left = x0 - x1;
                if (left < 30) left = 30;
                else if (left > self.$scalebrightbox.mw + 30) left = self.$scalebrightbox.mw + 30;
                self.$scalebrightbox.css('left', left + 'px');
                s = 1 + (self.maxScaleNum - 1) * (left - 30) / self.$scalebrightbox.mw;
                self.Scale(s / self.scale);
                $(document).off('mousemove touchmove').on('mousemove touchmove', function(e) {
                    e.preventDefault();
                    var x1 = self.getxy(e).x;
                    var left = parseFloat(self.$scalebrightbox.css('left')) - 30 + x1 - x0;
                    if (left < 0) left = 0;
                    else if (left > self.$scalebrightbox.mw) left = self.$scalebrightbox.mw;
                    self.$scalebrightbox.css('left', left + 30 + 'px');
                    s = 1 + (self.maxScaleNum - 1) * left / self.$scalebrightbox.mw;
                    self.Scale(s / self.scale);
                    x0 = x1;
                });
                //鼠标弹起
                $(document).off("mouseup touchend").on("mouseup touchend", function(e) {
                    e.preventDefault();
                    if (self.$scalebrightbox.releaseCapture) self.$scalebrightbox.releaseCapture();
                    else if (window.captureEvents) {
                        window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                    }
                    $(document).off('mousemove mouseup touchmove touchend');
                });
            });
            self.$thumbnail.find('.previewbox').on('mousedown touchstart', function(e) {
                //console.log(e);
                var bbw = parseFloat($brightbox[0].style.width);
                var bbh = parseFloat($brightbox[0].style.height);
                var xy = self.getxy(e);
                var x0 = xy.x,
                    y0 = xy.y;
                var $self = $(this);
                if (self.width < self.containW && self.height < self.containH) return;
                var thsxy = $self.offset();
                var left = x0 - thsxy.left - bbw / 2;
                var top = y0 - thsxy.top - bbh / 2;
                var oleft = left;
                var otop = top;
                //限制白框不出范围
                self.left = -self.width * left / self.$preview.w;
                self.top = -self.height * top / self.$preview.h;
                if (left <= 0) {
                    left = 0;
                    self.left = -self.width * left / self.$preview.w + self.options.whiteBorderSize;
                } else if (bbw + left >= self.$preview.w) {
                    left = self.$preview.w - bbw;
                    self.left = -self.width * left / self.$preview.w - self.options.whiteBorderSize;
                }
                if (top <= 0) {
                    top = 0;
                    self.top = -self.height * top / self.$preview.h + self.options.whiteBorderSize;
                } else if (bbh + top >= self.$preview.h) {
                    top = self.$preview.h - bbh;
                    self.top = -self.height * top / self.$preview.h - self.options.whiteBorderSize;
                }
                $brightbox.css({ top: top + 'px', left: left + 'px' });
                self.setCss();
                self.draw();
                $(document).off('mousemove touchmove').on('mousemove touchmove', function(e) {
                    e.preventDefault();
                    if (self.width < self.containW && self.height < self.containH) return;
                    var xy = self.getxy(e);
                    var x1 = xy.x,
                        y1 = xy.y;
                    var left = oleft + x1 - x0;
                    var top = otop + y1 - y0;
                    //限制白框不出范围

                    if (left <= 0) {
                        left = -1;
                        self.left = self.options.whiteBorderSize;
                    } else if (bbw + left >= self.$preview.w) {
                        left = self.$preview.w - bbw + 1;
                        self.left = -self.width + self.containW - self.options.whiteBorderSize;
                    } else {
                        self.left = -self.width * left / self.$preview.w;
                    }
                    if (top <= 0) {
                        top = -1;
                        self.top = self.options.whiteBorderSize;
                    } else if (bbh + top >= self.$preview.h) {
                        top = self.$preview.h - bbh + 1;
                        self.top = -self.height + self.containH - self.options.whiteBorderSize;
                    } else {
                        self.top = -self.height * top / self.$preview.h;
                    }
                    $brightbox.css({ top: top + 'px', left: left + 'px' });
                    self.setCss();
                    self.draw();
                });
                //鼠标弹起
                $(document).off("mouseup touchend").on("mouseup touchend", function(e) {
                    e.preventDefault();
                    if ($brightbox.releaseCapture) $brightbox.releaseCapture();
                    else if (window.captureEvents) {
                        window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                    }
                    $(document).off('mousemove mouseup touchmove touchend');
                });
            });

            self.setThumbnail = function() {
                scalebrightboxMove();
                brightboxScale();
                brightboxMove();

                function scalebrightboxMove() {
                    var left = (self.scale - 1) * self.$scalebrightbox.mw / (self.maxScaleNum - 1);
                    self.$scalebrightbox.css({ left: left + 30 + 'px' });
                    //console.log(left);
                }

                function brightboxScale() {
                    var PWS = self.containW / self.width;
                    if (PWS > 1) PWS = 1;
                    var PHS = self.containH / self.height;
                    if (PHS > 1) PHS = 1;
                    $('.brightbox').css({ width: self.$preview.w * PWS + 'px', height: self.$preview.h * PHS + 'px' });
                    //console.log(self.$preview.w * PWS,self.$preview.h * PHS);
                }

                function brightboxMove() {
                    var bbw = parseFloat($brightbox[0].style.width);
                    var bbh = parseFloat($brightbox[0].style.height);
                    var left = -self.$preview.w * self.left / self.width;
                    var top = -self.$preview.h * self.top / self.height;
                    if (left <= 0) left = 0;
                    else if (bbw + left >= self.$preview.w) left = self.$preview.w - bbw;
                    if (top <= 0) top = 0;
                    else if (bbh + top >= self.$preview.h) top = self.$preview.h - bbh;
                    $brightbox.css({ left: left + 'px', top: top + 'px' });
                    //console.log(left,top);
                    DimLayerResize();
                }

            }

            function DimLayerResize() { //改变其他灰框大小
                var bbw = parseFloat($brightbox[0].style.width);
                var bbh = parseFloat($brightbox[0].style.height);
                var rl = (parseFloat($brightbox.css('left')) + bbw) + 'px';
                var rt = $brightbox.css('top');
                var rw = (self.$preview.w - (parseFloat($brightbox.css('left')) + bbw)) + 'px';
                var rh = $brightbox[0].style.height;
                var ll = $brightbox.css('left');
                var bt = (parseFloat($brightbox.css('top')) + bbh) + 'px';
                var bh = (self.$preview.h - (parseFloat($brightbox.css('top')) + bbh)) + 'px';
                //console.log(rl, rt, rw, rh, ll, bt, bh);
                self.$thumbnail.find(".dimbox.top").css({ left: 0, top: 0, width: '100%', height: rt });
                self.$thumbnail.find(".dimbox.left").css({ left: 0, top: rt, width: ll, height: rh });
                self.$thumbnail.find(".dimbox.right").css({ left: rl, top: rt, width: rw, height: rh });
                self.$thumbnail.find(".dimbox.bottom").css({ left: 0, top: bt, width: '100%', height: bh });
            }

            $('.bigButton').click(function() {
                self.Scale(self.options.scaleNum);
            });
            $('.smallButton').click(function() {
                self.Scale(1 / self.options.scaleNum)
            });
            $('.closeButton').click(function() {
                self.destroy();
            });
            //以上是缩略图视窗相关
        }
        self.setCss();

    }
    cvszoom.prototype.setCss = function() {
        var self = this;
        //图片不允许超出边界,左右上下留白
        if (self.width < self.containW) //图片宽度没容器大
        {
            var temp = self.containW - self.width;
            self.left < 0 ? self.left = 0 : (self.left > temp ? self.left = temp : 1);
        } else { //图片宽度比容器大
            var temp = self.width - self.containW + self.options.whiteBorderSize;
            self.left > self.options.whiteBorderSize ? self.left = self.options.whiteBorderSize : (self.left < -temp ? self.left = -temp : 1);
        }
        if (self.height < self.containH) //图片高度没容器大
        {
            var temp = self.containH - self.height;
            self.top < 0 ? self.top = 0 : (self.top > temp ? self.top = temp : 1);
        } else { //图片高度比容器大
            var temp = self.height - self.containH + self.options.whiteBorderSize;
            self.top > self.options.whiteBorderSize ? self.top = self.options.whiteBorderSize : (self.top < -temp ? self.top = -temp : 1);
        }

        if (self.options.mode == 'img') {
            if (self.canTransform) {
                transform(self.$canvas, 'matrix(' + self.width / self.options.fullWidth + ',0,0,' + self.height / self.options.fullHeight + ',' + self.left + ',' + self.top + ')');
            } else {
                self.canvas.style.width = self.width + 'px';
                self.canvas.style.height = self.height + 'px';
                self.canvas.style.top = self.top + 'px';
                self.canvas.style.left = self.left + 'px';
            }
        }

        function transform($elem, str) {
            $elem.css('transform', str);
            $elem.css('-ms-transform', str);
            $elem.css('-webkit-transform', str);
            $elem.css('-moz-transform', str);
        }

        if (self.options.thumbnail) self.setThumbnail();
    };
    //绘图
    cvszoom.prototype.draw = function(LevelNew) {
        var self = this;
        var bl = self.options.fullWidth / self.width;
        var LN = LevelNew || self.curLevel;
        if (self.options.mode == 'canvas') {
            if (LN <= self.curLevel)
                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        }
        self.curLevel = LN;
        for (var wi = 0; wi < self.imgLevels[LN].length; wi++) {
            for (var yi = 0; yi < self.imgLevels[LN][wi].length; yi++) {
                if (self.rectTest(self.imgLevels[LN][wi][yi], {
                        x: -self.left * bl,
                        y: -self.top * bl,
                        w: self.containW * bl,
                        h: self.containH * bl
                    })) {
                    self.imgload(LN, wi, yi);
                }
            }
        }
    };

    cvszoom.prototype.initdraw = function() {
        var self = this;
        for (var wi = 0; wi < self.imgLevels[0].length; wi++) {
            for (var yi = 0; yi < self.imgLevels[0][wi].length; yi++) {
                (function(wi, yi) {
                    self.imgload(0, wi, yi);
                })(wi, yi)
            }
        }
    };
    cvszoom.prototype.imgload = function(i, wi, yi) {
        var self = this;
        if (typeof self.imgs[i][wi][yi].complete == 'undefined') {
            self.imgs[i][wi][yi] = new Image();
            self.imgs[i][wi][yi].onload = function() {
                if (self.options.mode == 'canvas') {
                    var bl = self.width / self.options.fullWidth;
                    self.ctx.drawImage(this, (self.imgLevels[i][wi][yi].x * bl + self.left), (self.imgLevels[i][wi][yi].y * bl + self.top), self.imgLevels[i][wi][yi].w * bl, self.imgLevels[i][wi][yi].h * bl);
                } else {
                    this.style.position = 'absolute';
                    this.style.width = self.imgLevels[i][wi][yi].w + 'px';
                    this.style.height = self.imgLevels[i][wi][yi].h + 'px';
                    this.style.top = self.imgLevels[i][wi][yi].y + 'px';
                    this.style.left = self.imgLevels[i][wi][yi].x + 'px';
                    this.style.zIndex = i;
                    self.canvas.appendChild(this);
                }
            };
            self.imgs[i][wi][yi].src = self.imgLevels[i][wi][yi].src;
        } else if (self.imgs[i][wi][yi].complete == true) {
            if (self.options.mode != 'img') {
                self.imgs[i][wi][yi].onload();
            }
        }
    };
    //缩放、判断瓦片级别变化
    cvszoom.prototype.Scale = function(ScaleNew, center) {
            var self = this;
            self.scale * ScaleNew > self.maxScaleNum ? ScaleNew = self.maxScaleNum / self.scale : (self.scale * ScaleNew < 1 ? ScaleNew = 1 / self.scale : 1);
            var c = center || {
                x: self.containW / 2,
                y: self.containH / 2
            };
            var newleft = c.x - self.width * ScaleNew * (c.x - self.left) / self.width;
            var newtop = c.y - self.height * ScaleNew * (c.y - self.top) / self.height;
            self.width = self.width * ScaleNew;
            self.height = self.height * ScaleNew;
            self.scale = self.scale * ScaleNew;
            var LevelNew = Math.ceil(Math.log(self.scale) / Math.log(self.options.scaleNum));
            if (LevelNew > self.LevelMax) LevelNew = self.LevelMax;
            else if (LevelNew < 0) LevelNew = 0;
            if (self.options.mode == 'canvas' && LevelNew >= self.curLevel && ScaleNew > 1) {
                //var x=self.canvas.width * (1-ScaleNew)/2;
                //var y=self.canvas.height * (1-ScaleNew)/2;
                //var temp = self.canvas;
                //self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                self.ctx.drawImage(self.canvas, c.x - c.x * ScaleNew, c.y - c.y * ScaleNew, self.canvas.width * ScaleNew, self.canvas.height * ScaleNew);
            }
            self.left = newleft;
            self.top = newtop;
            self.setCss();

            if (self.floorLevelTimeout != 'undefined') {
                clearTimeout(self.floorLevelTimeout);
                self.floorLevelTimeout = 'undefined';
            }
            self.floorLevelTimeout = setTimeout(function() {
                self.draw(LevelNew);
            }, 300); //利用延迟解决连续变级太快，浪费流量读取低级图层的问题
        }
        //判断两个矩形有没有相交
    cvszoom.prototype.rectTest = function(rect1, rect2) {
            return rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x && rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.y;
        }
        //图片的拖拽
    cvszoom.prototype.imgMove = function(e, self) {
        e.preventDefault();
        var vInterval = "undefined";
        this.setCapture ? this.setCapture() : window.captureEvents && window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        if (vInterval != "undefined") {
            clearInterval(vInterval);
            vInterval = "undefined";
        }
        if (typeof e.originalEvent.touches !== 'undefined' && e.originalEvent.touches.length > 1) {
            $(document).off('touchmove touchend');
            return;
        }
        //鼠标mousedown时的坐标；
        var xy = self.getxy(e);
        var x0 = xy.x,
            y0 = xy.y;
        //console.log(x0+","+y0+"|");
        var x1 = x0,
            y1 = y0,
            ox0 = x0,
            oy0 = y0;
        var starttime = new Date().getTime();
        //鼠标移动
        $(document).on('mousemove touchmove', function(e) {

            e.preventDefault();
            //不断的获取mousemove的坐标值
            var xy = self.getxy(e);
            var x1 = xy.x,
                y1 = xy.y;
            self.left = self.left + x1 - x0;
            self.top = self.top + y1 - y0;
            self.setCss();
            self.draw();
            x0 = x1;
            y0 = y1;

        });
        //鼠标弹起
        $(document).on("mouseup touchend", function(e) {
            //拖拽加速度
            e.preventDefault();
            var stoptime = new Date().getTime();
            var v = Math.abs(Math.round(Math.sqrt((x0 - ox0) * (x0 - ox0) + (y0 - oy0) * (y0 - oy0)))) / (stoptime - starttime);
            if (v > 2) {
                vx = (x0 - ox0) / (stoptime - starttime);
                vy = (y0 - oy0) / (stoptime - starttime);
                v = v / 2;
                vx = vx / 2;
                vy = vy / 2;
                var i = 0,
                    max = 10;
                var a = v / max;
                ax = Math.sqrt(a * a * vx * vx / v / v);
                ay = Math.sqrt(a * a * vy * vy / v / v);
                vInterval = setInterval(function() {
                    //var oldtime = new Date().getTime();
                    i++;
                    if (i >= max) {
                        clearInterval(vInterval);
                        self.draw();
                    };
                    x = vx * 40;
                    y = vy * 40;
                    vx > 0 ? vx -= ax * 0.04 : vx += ax * 0.04;
                    vy > 0 ? vy -= ay * 0.04 : vy += ax * 0.04;

                    self.left += x;
                    self.top += y;
                    self.setCss();
                    //console.log(new Date().getTime() - oldtime);
                }, 40);
            }

            if (self.$layer.releaseCapture) { self.$layer.releaseCapture(); } else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            $(document).off('mousemove mouseup touchmove touchend');
            flag = false;
        });
    };
    cvszoom.prototype.resize = function(self) {
        if (self.options.mode == 'img') {
            var newW = self.$layer.width();
            var newH = self.$layer.height();
            var bl = self.containW / newW;
            self.width = self.width * bl;
            self.height = self.height * bl;
            self.left = self.left + (newW - self.containW) / 2 - (self.width - self.width / bl) / 2;
            self.top = self.top + (newH - self.containH) / 2 - (self.height - self.height / bl) / 2;
            self.containW = newW //容器宽
            self.containH = newH; //容器高
            self.setCss();
            self.draw();
        } else {}
    }
    cvszoom.prototype.destroy = function() {
        var self = this;
        self.$layer.off('mousedown touchstart mousewheel DOMMouseScroll');
        self.$canvas.remove();
        if (self.options.thumbnail) self.$thumbnail.remove();
        self.closed();
    }
    cvszoom.prototype.closed = function() {
        console.log('closed');
    }
    cvszoom.prototype.getxy = function(event) {
        if (typeof event.originalEvent !== 'undefined')
            event = event.originalEvent;

        if (typeof event.targetTouches !== 'undefined') {
            return {
                x: event.targetTouches[0].clientX,
                y: event.targetTouches[0].clientY
            };
        }

        if (typeof event.targetTouches === 'undefined') {
            if (typeof event.clientX !== 'undefined') {
                return {
                    x: event.clientX,
                    y: event.clientY
                };
            } else if (typeof event.pageX !== 'undefined') {
                return {
                    x: event.pageX,
                    y: event.pageY
                };
            }

        }
    }
})(jQuery, window, document);

function splitBlock(imgurl, data, options, done) {
    //针对阿里云图片服务的分层切片器
    //复杂模式，根据大小分块，根据边长分放大级别
    var self = this;
    var Levels = []; //下标1放大级别,下标2相应级别w方向块坐标，下标3相应级别h方向块坐标
    this.diviDefaults = {
        'fbl0': 800, //初始获取图片的单边最大分辩率
        'blockSize': 50000, //块的大约大小，单位字节
        'scaleNum': 1.8, //每级相对上一级的单边放大倍数
        //'src000':imgurl + '@' + this.diviOptions.fbl0 + 'h_' + this.diviOptions.fbl0 + 'w_0e_1l.src'
    };
    this.diviOptions = $.extend({}, this.diviDefaults, options);
    if (typeof this.diviOptions.src000 == 'undefined')
        this.diviOptions.src000 = imgurl + '@' + this.diviOptions.fbl0 + 'h_' + this.diviOptions.fbl0 + 'w_0e_1l.src';
    var maxBlockNum = Math.round(data.size / this.diviOptions.blockSize); //最大分块数
    var maxWH = Math.max(data.width, data.height);
    var minWH = Math.min(data.width, data.height);
    var maxScaleTimes = Math.round(Math.log(maxWH / this.diviOptions.fbl0) / Math.log(this.diviOptions.scaleNum)); //根据单边放大倍数算单边最大放大次数
    maxScaleTimes < 1 && (maxScaleTimes = 1);
    var kgb = data.width / data.height;
    var bl = Math.round(maxWH / minWH); //图片比
    var wDh = data.width > data.height ? true : false; //宽大于高
    var hbn; //高，当前级别块数
    var wbn; //宽，当前级别块数
    var bn = Math.round(Math.sqrt(maxBlockNum / bl)); //高，当前级别块数
    for (var i = maxScaleTimes; i >= 1; i--) {
        Levels[i] = [];
        var p = Math.ceil(100 / (Math.pow(1.8, maxScaleTimes - i)));
        bn < 1 && (bn = 1);
        wDh ? (hbn = bn, wbn = hbn * kgb, wbn < 1 ? wbn = 1 : wbn = Math.ceil(wbn)) : (wbn = bn, hbn = wbn / kgb, hbn < 1 ? hbn = 1 : hbn = Math.ceil(hbn));
        for (var wi = 0; wi < wbn; wi++) {
            Levels[i][wi] = [];
            for (var yi = 0; yi < hbn; yi++) {
                wBlockPx = Math.ceil(data.width / wbn);
                hBlockPx = Math.ceil(data.height / hbn);
                Levels[i][wi][yi] = {};
                Levels[i][wi][yi].src = imgurl + '@' + wi * wBlockPx + '-' + yi * hBlockPx + '-' + wBlockPx + '-' + hBlockPx + 'a_' + p + 'p_100q.src';
                Levels[i][wi][yi].x = wi * wBlockPx;
                Levels[i][wi][yi].y = yi * hBlockPx;
                if (wi == wbn - 1) //最后一块的大小会小一些
                    Levels[i][wi][yi].w = data.width - wBlockPx * wi;
                else
                    Levels[i][wi][yi].w = wBlockPx;

                if (yi == hbn - 1)
                    Levels[i][wi][yi].h = data.height - hBlockPx * yi;
                else
                    Levels[i][wi][yi].h = hBlockPx;

            }
        }
        bn = Math.round(bn / this.diviOptions.scaleNum);
    }
    Levels[0] = [];
    Levels[0][0] = [];
    Levels[0][0][0] = {};
    Levels[0][0][0].src = this.diviOptions.src000;
    Levels[0][0][0].x = 0;
    Levels[0][0][0].y = 0;
    Levels[0][0][0].w = data.width;
    Levels[0][0][0].h = data.height;
    Levels[0][0][0].maxScaleTimes = maxScaleTimes;
    Levels[0][0][0].originalURL = imgurl;
    console.log(Levels);
    done && done(Levels);
    return Levels;
}
