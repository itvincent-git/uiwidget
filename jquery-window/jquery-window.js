/**
* jquery-window
*
* @author Vincent (itvincent@gmail.com)
* @date 2011-09-01
* @version 1.0.0
*/

;(function($){
	$.uiwidget = $.uiwidget || {};
	
	//类定义
	$.uiwidget.Class = $.uiwidget.Class || {
		create : function() {

			function klass() {
				this.initialize.apply(this, arguments);
			}

			$.extend(klass.prototype, arguments[0]);

			if (!klass.prototype.initialize)
				klass.prototype.initialize = function() {};

			klass.prototype.constructor = klass;

			return klass;
		}
	};
	
	$.uiwidget.isIE = !!window.ActiveXObject;   
	$.uiwidget.isIE6 = $.uiwidget.isIE && !window.XMLHttpRequest;
	$.uiwidget.isIE8 = $.uiwidget.isIE && !!document.documentMode;   
	$.uiwidget.isIE7 = $.uiwidget.isIE && !$.uiwidget.isIE6 && !$.uiwidget.isIE8;  
	
	$.uiwidget.Window = function(target, cfg){
		$.extend(this, cfg);
		this.grid = target;
		this.init();
		this.render();
	};
	
	$.uiwidget.Window.prototype = {
		pageNumberText  : ""
		
		,init : function(){
			
		}
	
		,render : function(){
			var _this = this;
			this.panel = $(['<div class="w-panel"><table cellspacing="0" cellpadding="0" class="w-table"><tbody><tr class="w-header"><td class="left"></td><td class="mid w_dragTitle" style="cursor: move;"><span class="w_itemTitle">', this.title,'</span><a title="关闭" class="w_close" href="javascript:void(0)"></a></td><td class="right"></td></tr>',
			         '<tr class="w-body"><td class="left">&nbsp;</td><td><div class="w_body"><div id="wContent" class="w_content"><iframe frameborder="0" scrolling="auto" id="iframe_iframe" name="wIframe" src="', this.url,'" style="height: 450px; width: 750px;"></iframe></div></div></td><td class="right"><div>&nbsp;</div></td></tr>',
			         '<tr class="w-bottom"><td class="left"></td><td class="mid"></td><td class="right"></td></tr></tbody></table></div>',
			         ].join(''));
			this.mask = $('<div id="w_overlay" class="w_overlayBG" style="opacity: 0.5;"></div>');
			$(document.body).append(this.panel);
			$(document.body).append(this.mask);
			
			this.mask.width($(window).width());
			this.mask.height($(window).height());
			
//			console.debug(this.panel);
//			console.debug(this.panel.outerHeight())
			this.panel.css({
				left : ($(window).width() - this.panel.outerWidth()) / 2
				,top : ($(window).height() - this.panel.outerHeight()) /2
			});
			
			this.close = this.panel.find('.w_close');
			this.close.click(function(e){
//				console.debug('close click');
				_this.destory();
			});
			
			this.panel.drag({handler : this.panel.find('.w-header')});
		}
		
		,destory : function(){
//			console.debug('close');
			this.panel.remove();
			this.mask.remove();
		}
	};
	
	$.window = function(cfg){
		return new $.uiwidget.Window(this, cfg);
	};
	
	$.createDelegate = function(method, obj, args, appendArgs){
        return function() {
            var callArgs = args || arguments;
            if(appendArgs === true){
                callArgs = Array.prototype.slice.call(arguments, 0);
                callArgs = callArgs.concat(args);
            }else if(typeof appendArgs == "number"){
                callArgs = Array.prototype.slice.call(arguments, 0); 
                var applyArgs = [appendArgs, 0].concat(args); 
                Array.prototype.splice.apply(callArgs, applyArgs); 
            }
            return method.apply(obj || window, callArgs);
        };
    };
    
	$.defer = function(method, millis, obj, args, appendArgs){
        var fn = $.createDelegate(method, obj, args, appendArgs);
        if(millis){
            return setTimeout(fn, millis);
        }
        fn();
        return 0;
    };
	
})(jQuery);	