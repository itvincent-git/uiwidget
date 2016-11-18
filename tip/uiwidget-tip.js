/**
* Tip 小提示
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @data 2009-06-08
* @version 1.0.0
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.Tip = function(el, cfg){
		if(typeof cfg == 'string'){
			cfg = {html: cfg}; 
		}
		$.extend(this, cfg);
		this.el = el;
		this.init();
	};
	
	$.uiwidget.Tip.prototype = {
		showDelay: 500
    	,hideDelay: 500
		,init : function(){
			var t = this;
			if(this.traceMouse){
				this.el.mousemove(function(e){
					t.showAt(e.clientX, e.clientY);
				});
			}else{
				this.el.mouseover(function(e){
					t.showAt(e.clientX, e.clientY);
				});
			}
			this.el.mouseleave(function(e){
				t.hide();
			});
		}
		,showAt : function(x, y){
			if(!this.tip){
				this.render();
			}
			this.tip.css('left', x+10);
			this.tip.css('top', y+10);
			this.show();			
		}
		,isVisible : function(){
			return this.tip && this.tip.is(':visible');
		}
		,show : function(){
	        clearTimeout(this.hideTimer);
	        delete this.hideTimer;
	        if(this.tip && !this.isVisible()){
		        if(!this.showTimer){
		            this.showTimer = $.defer(this.deferShow, this.showDelay, this);
		        }
	        }
	    }
	
	    // private
	    ,deferShow : function(){
	        delete this.showTimer;
	        this.tip.show();
	    }
		,hide : function(immediately){
	        clearTimeout(this.showTimer);
	        delete this.showTimer;
	        if(this.tip && this.isVisible()){
		        if(!this.hideTimer){
		            this.hideTimer = $.defer(this.deferHide, this.hideDelay, this);
		        }
	        }
	    }
	    // private
	    ,deferHide : function(){
	        delete this.hideTimer;
	        this.tip.hide();
	    }
		,render : function(){
			$(document.body).append(this.tip = $('<div class="tip"></div>'));
			if(this.html){
				this.tip.html(this.html);
			}
			if(this.width){
				this.tip.width(this.width);
			}
			if(this.height){
				this.tip.height(this.height);
			}
		}
	};	
	$.fn.tip = function(cfg){
		return new $.uiwidget.Tip(this, cfg);
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