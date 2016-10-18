实现图片瓦片图放大效果 

create by 栾树崇   
version 1.5 
瓦片图放大效果 
带缩略图定位效果    
自适应鼠标和触摸设备  
双击放大，滚轮缩放   
拖动动量加速度，快速拖动后会继续运动  
splitBlock为阿里云图片服务分片器   
'img','canvas'//img模式现在效果比较理想，canvas模式不够平滑有时闪，还没想到办法解决  

		
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

阿里云图片的js
				
		<script type="text/javascript"> 
            var imgurl = 图片地址   
            $.get(imgurl + '@info', function (data) {   
                var d = splitBlock(imgurl, data, { fbl0: 800,scaleNum:1.8, src000: imgurl + '_small01' });  
                var temp=$('body').cvszoom(d, { thumbnail: true,scaleNum:1.8 });
								temp.closed = function() {  
                   console.log('closed');  
                }
            }); 
	 </script> 
	 
如果是事先切好的图应该自己生成一个三维数组做为cvszoom的参数，一维指的是放大级别，二维是横向第几张瓦片图，三维是竖向第几张瓦片图，.x.y指的是在最大级别时的坐标，.w.h是最大级别时的宽高，.src指的是图片地址，可以看一下cvszoom中splitBlock的注释已经比较清楚了.
