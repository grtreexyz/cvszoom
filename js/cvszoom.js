;
(function($, window, document, undefined) {
	function cvszoom(el, imgLevels, options) {
		var self = this;
		self.$layer = $(el);
		self.imgLevels = imgLevels;
		self.level = [];
		self.imgs = [];
		for (var i = 0; i < imgLevels.length; i++) {
			self.imgs[i] = [];
			self.level[i] = {};
			self.level[i].w = 0;
			self.level[i].h = 0;
			self.level[i].compelte = false;
			for (var wi = 0; wi < imgLevels[i].length; wi++) {
				self.imgs[i][wi] = [];
				self.level[i].w += imgLevels[i][wi][0].w;
				for (var yi = 0; yi < imgLevels[i][wi].length; yi++) {
					self.imgs[i][wi][yi] = {};
				}
			}
			for (var yi = 0; yi < imgLevels[i][0].length; yi++) {
				self.level[i].h += imgLevels[i][0][yi].h;
			}
		}
		i--;
		self.LevelMax = i;
		self.defaults = {
			'fullWidth': self.level[0].w,
			'fullHeight': self.level[0].h,
			'thumbnail': true,
			'initSize': 0.8, //相对容器的比例
			'scaleNum': 1.8, //每级相对上一级的单边放大倍数
			'overScaleTimes': 2, //放大到全分辨率后，可以继续放大的倍数
			'whiteBorderSize': 100, //图片边缘与容器边缘的最大间隙
		};
		self.options = $.extend({}, self.defaults, options);

		//初始化canvas
		// try {
		// 	self.canvas = document.createElement("canvas");
		// 	self.ctx = self.canvas.getContext('2d');
		// } catch(e) {
		//	console.log(e);
			self.Compatibility=true;
			self.canvas = document.createElement('img');
			self.canvas.src=imgLevels[0][0][0].src;
		// }
		self.canvas.width = self.options.fullWidth;
		self.canvas.height = self.options.fullHeight;
		var ww, hh;
		self.containW = self.$layer.width(); //容器宽
		self.containH = self.$layer.height(); //容器高
		self.kgb = self.canvas.width / self.canvas.height; //图片宽高比
		containkgb = self.containW / self.containH; //容器宽高比
		self.kgb > containkgb ? (ww = self.containW * self.options.initSize, hh = ww / self.kgb) : (hh = self.containH * self.options.initSize, ww = hh * self.kgb);
		self.top = (self.containH - hh) / 2; //canvas相对容器位置
		self.left = (self.containW - ww) / 2; //canvas相对容器位置
		self.width = ww; //canvas显示的大小,
		self.height = hh; //canvas显示的大小
		self.canvas.style.position = 'absolute';
		self.$layer.css('overflow', 'hidden');
		if (self.$layer.css('position') == 'static') self.$layer.css('position', 'relative');


		self.scale = 1;
		var maxWH = Math.max(self.options.fullWidth, self.options.fullHeight);
		self.maxScaleNum = Math.ceil(Math.max(self.options.fullWidth, self.options.fullHeight) / Math.max($(el).width(), $(el).height()) * self.options.overScaleTimes);
		self.curLevel = 0;
		self.curLevelAllDraw = false;
		self.initdraw();
		self.$layer.append(self.canvas);
		self.$canvas = $(self.canvas);
		self.$canvas.css({ '-moz-transform-origin': '0 0', '-webkit-transform-origin': '0 0', '-ms-transform-origin': '0 0', 'transform-origin': '0 0' });
		self.setCss();
		self.$layer.on('mousedown', function(e) {
			self.imgMove(e, self);
		});
		//滚轮事件
		self.$layer.on('mousewheel DOMMouseScroll', function(e) {
			e.preventDefault();
			var delta = (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));
			delta > 0 ? self.Scale(1.1) : self.Scale(0.9);
		});
		self.floorLevelTimeout='undefined';
	}
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
				if(i>=self.curLevel && !self.Compatibility)
					self.ctx.drawImage(this, self.imgLevels[i][wi][yi].x, self.imgLevels[i][wi][yi].y, self.imgLevels[i][wi][yi].w, self.imgLevels[i][wi][yi].h);
				// self.level[i].compelte = true;
				// for (var wwi = 0; wwi < self.imgLevels[i].length; wwi++) {
				// 	if (self.level[i].compelte == false) break;
				// 	for (var yyi = 0; yi < self.imgLevels[i][wwi][yyi].length; yyi++) {
				// 		if (!self.imgs[i][wwi][yyi].complete) {
				// 			self.level[i].compelte = false;
				// 			break;
				// 		}
				// 	}
				// }
			};
			self.imgs[i][wi][yi].src = self.imgLevels[i][wi][yi].src;
		} else if(self.imgs[i][wi][yi].complete==true) {
			self.imgs[i][wi][yi].onload();
		}
	};
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
		// self.canvas.style.width = self.width + 'px';
		// self.canvas.style.height = self.height + 'px';
		// self.canvas.style.top = self.top + 'px';
		// self.canvas.style.left = self.left + 'px';
		transform(self.$canvas, 'matrix(' + self.width / self.options.fullWidth + ',0,0,' + self.height / self.options.fullHeight + ',' + self.left + ',' + self.top + ')');

		function transform($elem, str) {
			$elem.css('transform', str);
			$elem.css('-ms-transform', str);
			$elem.css('-webkit-transform', str);
			$elem.css('-moz-transform', str);
		}
	};

	//缩放、判断瓦片级别变化
	cvszoom.prototype.Scale = function(ScaleNew, center) {
			var self = this;
			self.scale * ScaleNew > self.maxScaleNum ? ScaleNew = self.maxScaleNum / self.scale : (self.scale * ScaleNew < 1 ? ScaleNew = 1 / self.scale : 1);
			var c = center || {
				x: self.$layer.width() / 2,
				y: self.$layer.height() / 2
			};
			self.left = c.x - self.width * ScaleNew * (c.x - self.left) / self.width;
			self.top = c.y - self.height * ScaleNew * (c.y - self.top) / self.height;
			self.width = self.width * ScaleNew;
			self.height = self.height * ScaleNew;
			self.setCss();
			self.scale = self.scale * ScaleNew;
			var LevelNew = Math.round(Math.log(self.scale) / Math.log(self.options.scaleNum));
			if (LevelNew != self.curLevel) {
				if (LevelNew > self.LevelMax) LevelNew = self.LevelMax;
				if(typeof self.floorLevelTimeout!='undefined'){
					clearTimeout(self.floorLevelTimeout);
					self.floorLevelTimeout='undefined';
				}
				self.floorLevelTimeout = setTimeout(function() {
					self.draw(LevelNew);
				}, 300);
			}
		}
		//判断两个矩形有没有相交
	cvszoom.prototype.rectTest = function(rect1, rect2) {
			return rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x && rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.y;
		}
		//绘图
	cvszoom.prototype.draw = function(LevelNew) {
		var self = this;
		var allLoad = true;
		var LN = LevelNew || self.curLevel;
		//放大后的获取全部瓦片后不再向下级draw瓦片，但缩小后效果并不好
		if (LN <= self.curLevel) {
			if (self.curLevelAllDraw) return; //当前级别全部draw,缩小不变
			var i = self.curLevel;
			for (var wi = 0; wi < self.imgLevels[i].length; wi++) {
				if (allLoad == false) break;
				for (var yi = 0; yi < self.imgLevels[i][wi].length; yi++) {
					if (!self.imgs[i][wi][yi].complete) {
						allLoad = false;
						break;
					}
				}
			}
			if (allLoad == true) {
				for (var wi = 0; wi < self.imgLevels[i].length; wi++) {
					for (var yi = 0; yi < self.imgLevels[i][wi].length; yi++) {
						self.ctx.drawImage(self.imgs[i][wi][yi], self.imgLevels[i][wi][yi].x, self.imgLevels[i][wi][yi].y, self.imgLevels[i][wi][yi].w, self.imgLevels[i][wi][yi].h);
					}
				}
				self.curLevelAllDraw = true;
				return;
			}
		} 
		var bl = self.options.fullWidth / self.width;
		var i = LN;
		self.curLevel = LN;
		for (var wi = 0; wi < self.imgLevels[i].length; wi++) {
			for (var yi = 0; yi < self.imgLevels[i][wi].length; yi++) {
				if (self.rectTest(self.imgLevels[i][wi][yi], {
						x: -self.left * bl,
						y: -self.top * bl,
						w: self.containW * bl,
						h: self.containH * bl
					})) {
					self.imgload(i, wi, yi);
					self.curLevelAllDraw=false;
				}
			}
		}
	};
	//图片的拖拽
	cvszoom.prototype.imgMove = function(e, self) {
		this.setCapture ? this.setCapture() : window.captureEvents && window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
		if (typeof(vInterval) != "undefined")
			clearInterval(vInterval);
		//鼠标mousedown时的坐标；
		var x0 = e.clientX,
			y0 = e.clientY;
		//console.log(x0+","+y0+"|");
		var x1 = x0,
			y1 = y0,
			x00 = x0,
			y00 = y0;
		var starttime = new Date().getTime();

		//鼠标移动
		$(document).on('mousemove', function(e) {
			e.preventDefault();
			//不断的获取mousemove的坐标值
			x1 = e.clientX;
			y1 = e.clientY;
			self.left = self.left + x1 - x0;
			self.top = self.top + y1 - y0;
			self.setCss();
			self.draw();
			x0 = x1;
			y0 = y1;
		});
		//鼠标弹起
		$(document).on("mouseup", function(e) {
			//拖拽加速度
			var stoptime = new Date().getTime();
			var v = Math.abs(Math.round(Math.sqrt((x0 - x00) * (x0 - x00) + (y0 - y00) * (y0 - y00)))) / (stoptime - starttime);
			if (v > 2) {
				//console.log(v);
				//console.log((layerX + x0 - x00) + ',' + (layerY + y0 - y00));
				vx = (x0 - x00) / (stoptime - starttime);
				vy = (y0 - y00) / (stoptime - starttime);
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
			e.preventDefault();
			$(document).off('mousemove mouseup');
		});
	};
	cvszoom.prototype.destroy = function() {
		this.canvas.parentNode.removeChild(this.canvas);
		return delete this;
	}
	$.fn.cvszoom = function(imgurl, options) {
		var t = new cvszoom(this, imgurl, options);
		return t;
	}
})(jQuery, window, document);

function divide(imgurl, options, done) {
	//针对阿里云图片服务的分层切片器
	//复杂模式，根据大小分块，根据边长分放大级别
	var self = this;
	var Levels = []; //下标1放大级别,下标2相应级别w方向块坐标，下标3相应级别h方向块坐标
	this.diviDefaults = {
		'fbl0': 800, //初始获取图片的单边最大分辩率
		'blockSize': 50000, //块的大约大小，单位字节
		'scaleNum': 1.8, //每级相对上一级的单边放大倍数
	};
	this.diviOptions = $.extend({}, this.diviDefaults, options);
	// $.get(imgurl + '@info', function(data) {
	// 	if (data) {
	// 		splitBlock(data,done);
	// 	} else
	// 		return false;
	// });

	splitBlock({
		height: 804,
		size: 6492450,
		width: 18893
	}, done);

	function splitBlock(data, done) {
		var maxBlockNum = Math.round(data.size / this.diviOptions.blockSize); //最大分块数
		var maxWH = Math.max(data.width, data.height);
		var minWH = Math.min(data.width, data.height);
		var maxScaleTimes = Math.round(Math.log(maxWH / this.diviOptions.fbl0) / Math.log(this.diviOptions.scaleNum)); //根据单边放大倍数算单边最大放大次数
		maxScaleTimes < 1 && (maxScaleTimes = 1);
		var kgb = Math.round(maxWH / minWH); //图片宽高比
		var wDh = data.width > data.height ? true : false; //宽大于高
		var hbn; //高，当前级别块数
		var wbn; //宽，当前级别块数
		for (var i = maxScaleTimes; i >= 1; i--) {
			Levels[i] = [];
			var p = Math.ceil(100 / (Math.pow(1.8, maxScaleTimes - i)));
			hbn = Math.round(Math.sqrt(maxBlockNum / kgb)); //高，当前级别块数
			hbn < 1 ? hbn = 1 : 1;
			wbn = hbn * kgb; //宽，当前级别块数
			wbn < 1 ? wbn = 1 : 1;
			for (var wi = 0; wi < wbn; wi++) {
				Levels[i][wi] = [];
				for (var yi = 0; yi < hbn; yi++) {
					wBlockPx = Math.ceil(data.width / wbn);
					hBlockPx = Math.ceil(data.height / hbn);
					Levels[i][wi][yi] = {};
					Levels[i][wi][yi].src = imgurl + '@' + wi * wBlockPx + '-' + yi * hBlockPx + '-' + wBlockPx + '-' + hBlockPx + 'a_' + p + 'p.src';
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
		}
		Levels[0] = [];
		Levels[0][0] = [];
		Levels[0][0][0] = {};
		Levels[0][0][0].src = imgurl + '@' + this.diviOptions.fbl0 + 'h_' + this.diviOptions.fbl0 + 'w_0e_1l.src';
		Levels[0][0][0].x = 0;
		Levels[0][0][0].y = 0;
		Levels[0][0][0].w = data.width;
		Levels[0][0][0].h = data.height;
		Levels[0][0][0].maxScaleTimes = maxScaleTimes;
		Levels[0][0][0].originalURL = maxScaleTimes;
		done(Levels);
	}

}
divide('https://cdn.ywart.com/yw/20160902133828342599863b1.jpg', null, function(data) {
	console.log(data)
	window.temp = $('#contain').cvszoom(data);
});