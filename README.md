# cvszoom
瓦片图，分级，用canvas逐级放大

//create by 栾树崇

//瓦片图放大效果

//带缩略图定位效果

//自知应鼠标和触摸设备

//双击放大，滚轮缩放

//拖动动量加速度，快速拖动后会继续运动

//divide为阿里云图片服务分片器


		self.defaults = {
			'fullWidth': imgLevels[0][0][0].w,
			'fullHeight': imgLevels[0][0][0].h,
			'initSize': 0.8, //相对容器的比例
			'scaleNum': 1.8, //每级相对上一级的单边放大倍数
			'overScaleTimes': 3, //放大到全分辨率后，可以继续放大的倍数
			'whiteBorderSize': 100, //图片边缘与容器边缘的最大间隙
			'thumbnail': true,//是否显示缩略图
			'thumbnailSize': 160,
		};
