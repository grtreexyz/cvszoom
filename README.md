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

splitBlock('阿里云图片服务地址/201607080042354133d66e4e4.jpg',{  
        "height": 3689, 
        "size": 6180319,    
        "width": 4924},null,function(data) {    
        console.log(data)   
        temp = $('#contain').cvszoom(data); 
        temp.closed = function() {  
           console.log('closed');  
        }
}); 

script type="text/javascript"> 
        var $container = $('body'); 
        var imgurl = 图片地址   
        $.get(imgurl + '@info', function (data) {   
            var d = splitBlock(imgurl, data, { fbl0: 800,scaleNum:1.8, src000: imgurl + '_small01' });  
           var temp=$container.cvszoom(d, { thumbnail: true,scaleNum:1.8 });   
       }); 
/script>   

