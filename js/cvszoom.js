;
(function($, window, document, undefined) {
	function cvszoom(el, imgLevers, options) {
		var self = this;
		self.$element = el;
		self.imgLevers = imgLevers;
		self.lever = [];
		self.imgs = [];
		for (var i = 0; i < imgLevers.length; i++) {
			self.imgs[i] = [];
			self.lever[i] = {};
			self.lever[i].w = 0;
			self.lever[i].h = 0;
			self.lever[i].compelte = false;
			for (var wi = 0; wi < imgLevers[i].length; wi++) {
				self.imgs[i][wi] = [];
				self.lever[i].w += imgLevers[i][wi][0].w;
				for (var yi = 0; yi < imgLevers[i][wi].length; yi++) {
					self.imgs[i][wi][yi] = {};
				}
			}
			for (var yi = 0; yi < imgLevers[i][0].length; yi++) {
				self.lever[i].h += imgLevers[i][0][yi].h;
			}
		}
		i--;
		self.leverMax = i;
		self.defaults = {
			'fullWidth': self.lever[0].w,
			'fullHeight': self.lever[0].h,
			'thumbnail': true,
			'initSize': 0.8, //相对容器的比例
			'scaleNum': 1.8, //每级相对上一级的单边放大倍数
			'overScaleTimes': 2, //放大到全分辨率后，可以继续放大的倍数
		};
		self.options = $.extend({}, self.defaults, options);

		//初始化canvas
		self.canvas = document.createElement("canvas");
		self.canvas.width = self.options.fullWidth;
		self.canvas.height = self.options.fullHeight;
		var ww, hh;
		self.containW = $(el).width();
		self.containH = $(el).height();
		self.kgb = self.canvas.width / self.canvas.height;
		containkgb = self.containW / self.containH;
		self.kgb > containkgb ? (ww = self.containW * self.options.initSize, hh = ww / self.kgb) : (hh = self.containH * self.options.initSize, ww = hh * self.kgb);
		self.top = (self.containH - hh) / 2;
		self.left = (self.containW - ww) / 2;
		self.width = ww;
		self.height = hh;
		self.setCss();
		self.canvas.style.position = 'absolute';
		if ($(el).css('position') == 'static') $(el).css('position', 'relative');


		self.ctx = self.canvas.getContext('2d');
		self.scale = 1;
		var maxWH = Math.max(self.options.fullWidth, self.options.fullHeight);
		self.maxScaleNum = Math.ceil(Math.max(self.options.fullWidth, self.options.fullHeight) / Math.max($(el).width(), $(el).height()) * self.options.overScaleTimes);
		self.curLever = 0;
		self.initdraw();

		$(el).append(this.canvas);
	}
	cvszoom.prototype.initdraw = function() {
		var self = this;
		for (var wi = 0; wi < self.imgLevers[0].length; wi++) {
			for (var yi = 0; yi < self.imgLevers[0][wi].length; yi++) {
				(function(wi, yi) {
					self.imgload(0, wi, yi);
				})(wi, yi)
			}
		}
	};
	cvszoom.prototype.imgload = function(i, wi, yi) {
		var self = this;
		if ((typeof self.imgs[i][wi][yi].complete == 'undefined') || (self.imgs[i][wi][yi].complete != true)) {
			//(function(i, wi, yi) {
				self.imgs[i][wi][yi] = new Image();
				self.imgs[i][wi][yi].onload = function() {
					self.ctx.drawImage(this, self.imgLevers[i][wi][yi].x, self.imgLevers[i][wi][yi].y, self.imgLevers[i][wi][yi].w, self.imgLevers[i][wi][yi].h);
					self.lever[i].compelte = true;
					for (var wwi = 0; wwi < self.imgLevers[i].length; wwi++) {
						if (self.lever[i].compelte == false) break;
						for (var yyi = 0; yi < self.imgLevers[i][wwi][yyi].length; yyi++) {
							if (!self.imgs[i][wwi][yyi].complete) {
								self.lever[i].compelte = false;
								break;
							}
						}
					}
				};
				self.imgs[i][wi][yi].src = self.imgLevers[i][wi][yi].src;
			//})(i, wi, yi)
		}
	};
	cvszoom.prototype.setCss = function() {
		var self = this;
		self.canvas.style.width = self.width + 'px';
		self.canvas.style.height = self.height + 'px';
		self.canvas.style.top = self.top + 'px';
		self.canvas.style.left = self.left + 'px';
	};
	cvszoom.prototype.addLever = function(scaleNum, center) {
		var self = this;
		var sn = scaleNum || self.options.scaleNum;
		if (self.scale >= self.maxScaleNum) {
			return;
		}
		var ScaleNew = sn * self.scale;
		if (ScaleNew > self.maxScaleNum) {
			ScaleNew = self.maxScaleNum;
		}
		self.floor(ScaleNew, center);
	};
	//缩小
	cvszoom.prototype.subLevel = function(scaleNum, center) {
		var self = this;
		var sn = scaleNum || self.options.scaleNum;
		if (self.scale <= 1) {
			return;
		}
		var ScaleNew = self.scale / sn;
		if (ScaleNew < 1) {
			ScaleNew = 1;
		}
		self.floor(ScaleNew, center);
	};
	//缩放、判断瓦片级别变化
	cvszoom.prototype.floor = function(ScaleNew, center) {
			var self = this;
			var c = center || {
				x: $(self.$element).width() / 2,
				y: $(self.$element).height() / 2
			};
			self.left = c.x - self.width * ScaleNew * (c.x - self.left) / self.width;
			self.top = c.y - self.height * ScaleNew * (c.y - self.top) / self.height;
			self.width = self.width * ScaleNew;
			self.height = self.height * ScaleNew;
			self.setCss();
			self.scale = self.scale * ScaleNew;
			//self.xianzhi();
			//scalebrightboxMove();
			//PreviewScale();
			//setThumbnail()
			var leverNew = Math.ceil(Math.log(self.scale) / Math.log(self.options.scaleNum));
			if (leverNew != self.curLever) {
				if (leverNew > self.leverMax) leverNew = self.leverMax;
				//self.curLever=leverNew;
				var floorLeverTimeout
				clearTimeout(floorLeverTimeout);
				floorLeverTimeout = setTimeout(function() {
					self.draw(leverNew);
				}, 300);
			}
		}
		//判断两个矩形有没有相交
	cvszoom.prototype.rectTest = function(rect1, rect2) {
			return rect1.x < rect2.x + rect2.w && rect1.x + rect1.w > rect2.x && rect1.y < rect2.y + rect2.h && rect1.y + rect1.h > rect2.x;
		}
		//绘图
	cvszoom.prototype.draw = function(leverNew) {
		var self=this;
		var allload = true;
		if (leverNew <= self.curLever) {
			var i = self.curLever;
			for (var wi = 0; wi < imgLevers[i].length; wi++) {
				if (allload == false) break;
				for (var yi = 0; yi < imgLevers[i][wi][yi].length; yi++) {
					if (!self.imgs[i][wi][yi].complete) {
						allload = false;
						break;
					}
				}
			}
			if (allload == true) return;
		}
		//PreviewMove();
		var bl = self.options.fullWidth/ self.width;
		for (var i = 0; i < self.imgLevers.length; i++) {
			for (var wi = 0; wi < self.imgLevers[i].length; wi++) {
				for (var yi = 0; yi < self.imgLevers[i][wi][yi].length; yi++) {
					if (rectTest(self.imgLevers[i][wi][yi], {
							x: self.left * bl,
							y: self.top * bl,
							w: self.containW * bl,
							h: self.containH * bl
						})) {
						self.imgload(i, wi, yi);
					}
				}
			}
		}

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
	var levers = []; //下标1放大级别,下标2相应级别w方向块坐标，下标3相应级别h方向块坐标
	this.diviDefaults = {
		'fbl0': 800, //初始获取图片的单边最大分辩率
		'blockSize': 50000, //块的大小，单位字节
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
		height: 4200,
		size: 481200,
		width: 4800
	}, done);

	function splitBlock(data, done) {
		var maxBlockNum = Math.ceil(data.size / this.diviOptions.blockSize); //最大分块数
		var maxWH = Math.max(data.width, data.height);
		var minWH = Math.min(data.width, data.height);
		var maxScaleTimes = Math.round(Math.log(maxWH / this.diviOptions.fbl0) / Math.log(this.diviOptions.scaleNum)); //根据单边放大倍数算单边最大放大次数
		maxScaleTimes < 1 && (maxScaleTimes = 1);
		var kgb = Math.round(maxWH / minWH); //图片宽高比
		var wDh = data.width > data.height ? true : false; //宽大于高
		var bn = Math.round(maxBlockNum / kgb); //当前级别块数
		bn > 1 ? (bn = Math.round(Math.sqrt(bn))) : bn = 1;
		var wbn; //w方向块数
		var hbn; //h方向块数
		for (var i = maxScaleTimes; i >= 1; i--) {
			levers[i] = [];
			var p = Math.ceil(100 / (Math.pow(1.8, maxScaleTimes - i)));
			wbn = wDh ? bn * kgb : bn; //w方向块数
			hbn = wDh ? bn : bn * kgb; //h方向块数
			for (var wi = 0; wi < wbn; wi++) {
				levers[i][wi] = [];
				for (var yi = 0; yi < hbn; yi++) {
					wBlockPx = Math.ceil(data.width / wbn);
					hBlockPx = Math.ceil(data.height / hbn);
					levers[i][wi][yi] = {};
					levers[i][wi][yi].src = imgurl + '@' + wi * wBlockPx + '-' + yi * hBlockPx + '-' + wBlockPx + '-' + hBlockPx + 'a_' + p + 'p.src';
					levers[i][wi][yi].x = wi * wBlockPx;
					levers[i][wi][yi].y = yi * hBlockPx;
					levers[i][wi][yi].w = wBlockPx;
					levers[i][wi][yi].h = hBlockPx;
				}
			}
			bn > 1 ? (bn = Math.round(bn / 1.8)) : bn = 1;
		}
		levers[0] = [];
		levers[0][0] = [];
		levers[0][0][0] = {};
		levers[0][0][0].src = imgurl + '@' + this.diviOptions.fbl0 + 'h_' + this.diviOptions.fbl0 + 'w_0e_1l.src';
		levers[0][0][0].x = 0;
		levers[0][0][0].y = 0;
		levers[0][0][0].w = data.width;
		levers[0][0][0].h = data.height;
		levers[0][0][0].maxScaleTimes = maxScaleTimes;
		done(levers);
	}

}
divide('https://cdn.ywart.com/material/topic_cover/dirt.jpg', null, function(data) {
	console.log(data)
	window.temp = $('#contain').cvszoom(data);
});