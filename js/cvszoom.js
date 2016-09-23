;
(function($, window, document, undefined) {
	function cvszoom(el, imgLevers, options) {
		var self = this;
		this.$element = el;
		this.imgurl = imgurl;
		this.img = new Image();
		this.img.onload = function() {
			self.draw();
		};
		this.img.src = this.imgurl;
		this.defaults = {
			'fullWidth': 4096,
			'fullHeight': 4096,
			'toolbar': true,
			'scaleNum': 1.8, //每级相对上一级的单边放大倍数
			'overScaleTimes': 2, //放大到全分辨率后，可以继续放大的倍数
		};
		this.options = $.extend({}, this.defaults, options);
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.options.fullWidth;
		this.canvas.height = this.options.fullHeight;
		this.canvas.style.width = '100%';
		this.canvas.style.height = 'auto';
		this.ctx = this.canvas.getContext('2d');
		this.scale = 1;
		$(el).append(this.canvas);

	}
	cvszoom.prototype.draw = function(rect) {
		this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
	};

	cvszoom.prototype.init = function(rect) {
		this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
	};



	$.fn.cvszoom = function(imgurl, options) {
		var t = new cvszoom(this, imgurl, options);
	}
})(jQuery, window, document);

//https://cdn.ywart.com/material/topic_cover/dirt.jpg@info
function divide(imgurl, options, done) { //针对阿里云图片服务的分层切片器
	var self = this;
	var levers=[]; //下标1放大级别,下标2相应级别w方向块坐标，下标3相应级别h方向块坐标
	this.diviDefaults = {
		'fbl0': 800, //初始获取图片的单边最大分辩率
		'blockSize': 5000, //块的大小，单位字节
		'scaleNum': 1.8, //每级相对上一级的单边放大倍数
	};
	this.diviOptions = $.extend({}, this.diviDefaults, options);
	// $.get(imgurl + '@info', function(data) {
	// 	if (data) {
	// 		splitBlock(data,done);
	// 	} else
	// 		return false;
	// });

	splitBlock({height:4200,size:5425,width:4800},done);

	function splitBlock(data,done) {
		var maxBlockNum = Math.ceil(data.size / this.diviOptions.blockSize); //最大分块数
		var maxWH = Math.max(data.width, data.height);
		var minWH = Math.min(data.width, data.height);
		var maxLeverNum = Math.round(Math.log(maxWH / this.diviOptions.fbl0) / Math.log(this.diviOptions.scaleNum));
		maxLeverNum < 1 && (maxLeverNum = 1);
		var kgb = Math.round(maxWH / minWH); //图片宽高比
		var wDh = data.width > data.height ? true : false; //宽大于高
		var bn = Math.round(maxBlockNum / kgb); //当前级别块数
		bn > 1 ? (bn = Math.round(Math.sqrt(bn))) : bn=1;
		var wbn;//w方向块数
		var hbn;//h方向块数
		for (var i = maxLeverNum; i >= 1; i--) {
			levers[i]=[];
			var p=Math.ceil(100/(Math.pow(1.8,maxLeverNum-i)));
			wbn= wDh ? bn * kgb : bn;//w方向块数
			hbn= wDh ? bn  : bn* kgb;//h方向块数
			for (var wi = 0; wi <wbn;wi++) {
				levers[i][wi]=[];
				for (var yi = 0; yi < hbn; yi++) {
					wBlockPx=Math.ceil(data.width/wbn);
					hBlockPx=Math.ceil(data.height/hbn);
					levers[i][wi][yi] = imgurl + '@' + wi * wBlockPx + '-' + yi * hBlockPx + '-' + wBlockPx + '-' + hBlockPx + 'a_' + p + 'p.src';
				}
			}
			bn > 1 ? (bn = Math.round(bn/1.8)) : bn=1;
		}
		levers[0]=[];
		levers[0][0]=[];
		levers[0][0][0] = imgurl + '@' + this.diviOptions.fbl0 + 'h_' + this.diviOptions.fbl0 + 'w_0e_1l.src';
		done(levers);
	}

}
divide('https://cdn.ywart.com/material/topic_cover/dirt.jpg',null,function(data){
	console.log(data)
});