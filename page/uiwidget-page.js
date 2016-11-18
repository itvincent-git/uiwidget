/**
* Page
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @data 2010-01-17
* @version 1.1.0-SNAPSHOT
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.Page = function(el, cfg){
		if(typeof cfg == 'string'){
			cfg = {url: cfg}; 
		}
		$.extend(this, cfg);
		this.el = el;
		this.load();
	};
	
	$.uiwidget.Page.prototype = {
		cache : false
		,load : function(){
			$.ajaxSetup({cache : this.cache});
			this.el.load(this.url, this.data, this.callback);
		}
	};	
	$.fn.page = function(cfg){
		return new $.uiwidget.Page(this, cfg);
	};
})(jQuery);	