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
				for (var yi = 0; yi < imgLevers[i][wi][yi].length; yi++) {
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
		self.kgb = self.canvas.width / self.canvas.height;
		containkgb = $(el).width() / $(el).height();
		self.kgb > containkgb ? (ww = $(el).width() * self.options.initSize, hh = ww / self.kgb) : (hh = $(el).height() * self.options.initSize, ww = hh * self.kgb);
		self.top = ($(el).height() - hh) / 2;
		self.left = ($(el).width() - ww) / 2;
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
					self.lever[0].w += self.imgLevers[0][wi][yi].w;
					self.lever[0].h += self.imgLevers[0][wi][yi].h;
					self.imgload(0, wi, yi, function(img) {
						self.imgs[0][0]
						self.ctx.drawImage(img, self.imgLevers[0][wi][yi].x, self.imgLevers[0][wi][yi].y, self.imgLevers[0][wi][yi].w, self.imgLevers[0][wi][yi].h);
					})
				})(wi, yi)
			}
		}
	};
	cvszoom.prototype.imgload = function(i, wi, yi, done) {
		var self = this;
		if (typeof self.imgs[i][wi][yi].complete != 'undefined' && self.imgs[i][wi][yi].complete != true) {
			self.imgs[i][wi][yi] = new Image();
			(function(i) {
				self.imgs[i][wi][yi].onload = function() {
					done(this);
					self.lever[i].compelte = true;
					for (var wi = 0; wi < imgLevers[i].length; wi++) {
						if (self.lever[i].compelte == false) break;
						for (var yi = 0; yi < imgLevers[i][wi][yi].length; yi++) {
							if (!self.imgs[i][wi][yi].complete) {
								self.lever[i].compelte = false;
								break;
							}
						}
					}
				};
			})(i)
			self.imgs[i][wi][yi].src = self.imgLevers[i][wi][yi].src;
		} else {
			done(self.imgs[i][wi][yi]);
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
			var c = center || { x: $(self.$element).width() / 2, y: $(self.$element).height() / 2 };
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
		//绘图
	cvszoom.prototype.draw = function(leverNew) {
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

		var left = layerwh.w * layerScale / 2 - $container.width() / 2 - layerX; //container，在放大后的layer，上的left
		var top = layerwh.h * layerScale / 2 - $container.height() / 2 - layerY;
		var widthClient = $container.width();
		var heightClient = $container.height();
		var f = floorLever;
		var temp = tooljisuan(f);
		if (typeof(fnew) != "undefined") { //解决layer层大小与floor层不一样大小的问题。
			var w = temp.ww * temp.wBlockNumF;
			var h = temp.hh * temp.hBlockNumF;
			$layer.css({ width: w + 'px', height: h + 'px' });
		}
		PreviewMove();
		var wBlockPx = layerScale * temp.ww;
		var hBlockPx = layerScale * temp.hh;
		var image;
		var src;
		var alreadyhave = 0;
		var fij
		for (var i = 0; i < temp.wBlockNumF; i++) {
			for (var j = 0; j < temp.hBlockNumF; j++) {
				if (i * wBlockPx < left + widthClient + 100 && (i + 1) * wBlockPx > left - 100 && j * hBlockPx < top + heightClient + 100 && (j + 1) * hBlockPx > top - 100)
				//imgLayer[f][i][j].attr('src', imgLayer[f][i][j].attr('data-original')).show();
				{
					fij = imgLayer[f][i][j];
					//console.log(f + ',' + i + ',' + j);
					src = imgLayer[f][i][j].attr('data-original');
					for (var k = 0; k < tempimage.length; k++) {
						alreadyhave = 0;
						if (tempimage[k].src == src) {
							alreadyhave = 1;
							break;
						}
					}
					(function() {
						var arg = fij;
						var src = arg.attr('data-original');
						if (alreadyhave == 0) {
							image = new Image();
							image.onload = function() {
								for (var k = 0; k < tempimage.length; k++) {
									if (tempimage[k] == this) {
										tempimage.splice(k, 1);
										break;
									}
								}
								arg.attr('src', src);
								setTimeout(function() { arg.show(); }, 50); //否则会引起safari灰框
								if (tempimage.length == 0) $layer.css('cursor', 'pointer');
							};
							image.src = arg.attr('data-original');
							$layer.css('cursor', 'progress');
							tempimage.push(image);
						}
					})();
				}
				////以上加载提示会引起抖动
			}
		}
		this.ctx.drawImage(imgObject.img, 0, 0, this.canvas.width, this.canvas.height);
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

	splitBlock({ height: 4200, size: 481200, width: 4800 }, done);

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
		//levers[0][0][0].w = kgb > 1 ? this.diviOptions.fbl0 : this.diviOptions.fbl0 / kgb;
		//levers[0][0][0].h = kgb < 1 ? this.diviOptions.fbl0 : this.diviOptions.fbl0 * kgb;
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