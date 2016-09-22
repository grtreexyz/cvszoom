;(function($,window,document,undefined){
    function cvszoom(el,imgurl,options){
    	    this.$element = el,
    	    this.imgurl=imgurl,
	    this.defaults = {
	        'toolbar': true,
	    },
	    this.options = $.extend({}, this.defaults, opt)
    }
    $.fn.cvszoom=function(imgurl,options){
    	var t=new cvszoom(this,imgurl,options);
    }
})(jQuery,window,document);