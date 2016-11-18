/**
* Menu 菜单组件
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2011-04-25
* @version 1.2.2
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.menuItemIdGenerator = 0;
	/**
	* Menu
	*/
	$.uiwidget.Menu = function(cfg){
		if($.isArray(cfg)){
			cfg = {items: cfg}; 
		}
		$.extend(this, cfg);
		this.init();		
	};
	$.uiwidget.Menu.prototype = {
		/*默认宽度*/
		width : 110
		,init : function(){
			
			//菜单项
			this.menuItems=[];
			if(this.items){
				for(var i =0; i < this.items.length; i++){
					this.addMenuItem(this.items[i]);
				}
			}
		}
		,render : function(){
			var t = this;
			this.el = $('<div class="uiwidget-menu"></div>');
			this.ul = $('<ul></ul>');
			this.el.append(this.ul);
			this.el.width(this.width);
			this.ghost = $('<div class="uiwidget-menu-ghost"><iframe height=100% width=100% frameborder=0></iframe></div>');
			$(document.body).append(this.el);
			$(document.body).append(this.ghost);
			this.addMenuEvent();	
			for(var i =0; i < this.menuItems.length; i++){
				this.ul.append(this.menuItems[i].render());
			}
			$(document).mousedown(function(){
				t.hide();
			});
		}
		,addMenuItem : function(cfg){
			var item;
			if(typeof cfg == 'object'){
				item = new $.uiwidget.TextMenuItem(this, cfg);
			}else if (typeof cfg == 'string'){
				item = new $.uiwidget.SeparatorMenuItem(this, cfg);
			} 
			if(this.ul){
				item.render();
				this.ul.append(item.el);
			}	
			this.menuItems.push(item);
			return item;
		}
		,removeItem : function(item){
			for(var i = 0, len = this.menuItems.length; i < len; i++){
				if(this.menuItems[i].id == item.id) {
					this.menuItems[i].destroy();
					this.menuItems.splice(i, 1);
					return;
				}
			}
		}
		,findTargetItem : function(e){
			var target = $(e.target);
			var itemEl;
			if(target.is('.uiwidget-menu-item')){
				itemEl =  target;
			}else{ 
				var mitem =  target.parent('.uiwidget-menu-item');
				if(mitem.length > 0)
					itemEl = mitem;
			}
			if(itemEl)
				return  this.getMenuItem(itemEl.attr('itemId'));
		}
		,findTargetItemForLeave : function(e){
			var target = $(e.target);
			var itemEl;
			var mitem;
			if(target.is('.uiwidget-menu-item')){
				itemEl =  target;
			}else if((mitem = target.parent('.uiwidget-menu-item')).length>0){ 
				itemEl = mitem;
			}
			else if((mitem = target.find('.uiwidget-menuitem-hover')).length>0){ 
				itemEl = mitem;
			}
			if(itemEl)
				return  this.getMenuItem(itemEl.attr('itemId'));
		}
		,setActiveItem : function(item, autoExpand){
	        if(item != this.activeItem){
	            if(this.activeItem){
	                this.activeItem.deactivate();
	            }
	            this.activeItem = item;
	            item.activate(autoExpand);
	        }else if(autoExpand){
	            item.expandMenu();
	        }
	    }
		,addMenuEvent : function(){
			var t = this;
			this.el.children('ul').mousedown(function(e){
				e.stopPropagation();
			}).click(function(e){
				var item = t.findTargetItem(e);				
				if(item){
					if(item.disabled) return;
					if(item.handler) item.handler(e, item);
					if(item.parentMenu){
						item.parentMenu.hide(true);
					}		
				}
			}).mouseover(function(e){
				var item = t.findTargetItem(e);
				if(item){
		            if(!item.disabled){
		                t.setActiveItem(item, true);
		            }
		        }
		        t.over = true;
		        t.triggerHandler("mouseover", [t, e, item]);
		        
			}).mouseleave(function(e){
				var item = t.findTargetItemForLeave(e);
		        if(item){
		            if(item == t.activeItem && item.shouldDeactivate(e)){
		            	//离开menu时触发
		                t.activeItem.deactivate();
		                delete t.activeItem;
		            }
			        t.over = false;
			        t.triggerHandler("mouseout", [t, e, item]);
		        }
			});
		}
		,getMenuItem : function(id){
			for(var i = 0, len = this.menuItems.length; i < len; i++){
				if(this.menuItems[i].id == id) return this.menuItems[i];
			}
		}
		,getItemId : function(item){
			return item.id || (item.id = 'uiwidget-menu-item-' + $.uiwidget.menuItemIdGenerator++);
		}
		,isVisible : function(){
	        return this.el && this.el.is(':visible');
	    }

		//隐藏
		,hide : function(deep){
			if(this.el && this.isVisible()){
	            this.triggerHandler("beforehide", [this]);
	            if(this.activeItem){
	                this.activeItem.deactivate(true);
	                delete this.activeItem;
	            }
	            this.el.hide();
				this.ghost.hide();
	            this.triggerHandler("hide", [this]);
	        }
	        if(deep === true && this.parentMenu){
	            this.parentMenu.hide(true);
	        }
		}
		
		//菜单项数量
		,size : function(){
			return this.menuItems.length;
		}
		
		,getEl : function(){
			return this.el;
		}
		
		/**
		根据坐标显示 
		@param l 左的坐标
		@param t 上的坐标 
		@param config speed：动画速度，action动画效果，parentMenu父菜单
		*/
		,showAt : function(l, t, config){
			if(!this.el)
				this.render();
			var action, speed;
			if(config){
				speed = config.speed;
				action = config.action;
				this.parentMenu = config.parentMenu;
			}
			var w = this.width;
			var h = this.el.height();
			//当前菜单项的位置
			if((l + w) > $(window).width()){
				l = l - w;
				if(l < 0)
					l = 0;
			}
			if((t + h) > $(window).height()){
				t = t - h;
				if(t < 0)
					t = 0;
			}
			this.el.css('left', l);
			this.el.css('top', t);
			this.el[action || 'show'](speed);
			this.showGhost();
		}
		
		/**
		根据对齐的目标显示
		@param target 对齐的目标 
		@param pos 对齐的位置tl-bl, tl-tr, tl-br
		@param config offset：偏移量，speed：动画速度，action动画效果，parentMenu父菜单
		*/
		,showAlignTo : function(target, pos, config){
			if(!this.el)
				this.render();
			var offset, speed, action;
			if(config){
				offset = config.offset;
				speed = config.speed;
				action = config.action;
				this.parentMenu = config.parentMenu;
			}
			if(!pos){
				pos = 'tl-bl';
			}
			if(!offset){
				offset = [];
				offset[0] = 0;
				offset[1] = 0;
			}
			var target = $(target);
			var p = target.offset();
			var l, t;
			if(pos == 'tl-bl'){
				l = p.left + offset[0];
				t = p.top + target.height() + offset[1];
			}
			if(pos == 'tl-tr'){
				l = p.left + target.width() + offset[0];
				t = p.top + offset[1];
			}
			if(pos == 'tl-br'){
				l = p.left + target.width() + offset[0];
				t = p.top + target.height() + offset[1];
			}
			
			var w = this.getWidth();
			var h = this.getHeight();
			//当前菜单项的位置
			if((l + w) > $(window).width()){
				l =  l - w - (this.parentMenu ? this.parentMenu.getWidth() : 0 );
				if(l < 0)
					l = 0;
			}
			if((t + h) > $(window).height()){
				if(parentMenu){
					t = t - h + target.outerHeight();
				}else{
					t = t - h;
				}
				if(t < 0)
					t = 0;
			}
			this.el.css('left', l);
			this.el.css('top', t);
			this.el[action || 'show'](speed);
			this.showGhost();
		}
		
		//显示遮罩层
		,showGhost : function(){
			this.ghost.width(this.el.outerWidth());
			this.ghost.height(this.el.outerHeight());
			var p = this.el.offset();
			this.ghost.css('left', p.left);
			this.ghost.css('top', p.top); 
			this.ghost.show();
		}
		
		,bind : function(arg0, arg1, arg2){
			if(typeof arg1 == 'object')
				this.el.bind(arg0, arg1, arg2);
			else 
				this.el.bind(arg0, arg1);
		}
		
		,trigger : function(arg0, arg1){
			this.el.trigger(arg0, arg1);
		}
		
		,triggerHandler : function(arg0, arg1){
			this.el.triggerHandler(arg0, arg1);
		}
		
		,getWidth : function(){
			return this.width;
		}
		
		,getHeight : function(){
			return this.el.height();
		}
	};
	
	/**
	* 菜单项
	*/
	$.uiwidget.MenuItem = function(parentMenu, cfg){
		$.extend(this, cfg);
		this.init(parentMenu);
	};
	
	$.uiwidget.MenuItem.prototype = {
		activeClass : 'uiwidget-menuitem-hover'
		,showDelay: 200
    	,hideDelay: 200
    	,init : function(parentMenu){
    		this.parentMenu = parentMenu;
			if(this.menu){
				this.menu = new $.uiwidget.Menu(this.menu);
			}
    	}
	    ,shouldDeactivate : function(e){
            if(this.menu && this.menu.isVisible()){
            	var ex = e.clientX, ey = e.clientY;
            	var el = this.menu.getEl();
            	var os = el.offset();
            	var l = os.left;
            	var r = Number(l) + el.width();
            	var t = os.top;
            	var b = Number(t) + el.height();
            	if(ex >= l && ex <= r && ey >= t && ey <= b){
            		return false;
            	}
            }
            return true;
	    }		
	    ,activate : function(autoExpand){
	        if(this.disabled){
	            return false;
	        }
	        this.el.addClass(this.activeClass);
	        if(autoExpand){
                this.expandMenu();
            }
	        this.triggerHandler("activate", [this]);
	        return true;
	    }
		,deactivate : function(immediately){
	        this.el.removeClass(this.activeClass);
	        this.hideMenu(immediately);
	        this.triggerHandler("deactivate", [this]);
	    }
	    ,expandMenu : function(autoActivate){
	        if(!this.disabled && this.menu){	            
	            if(!this.menu.isVisible()){
	                this.menu.showAlignTo(this.el, 'tl-tr', {offset: [8, 0], speed: null, parentMenu: this.parentMenu});
	            }
	        }
	    }
	    ,hideMenu : function(immediately){
	        if(this.menu && this.menu.isVisible()){
		        if(immediately) this.menu.hide();
		        if(!this.hideTimer){
		            this.hideTimer = $.defer(this.deferHide, this.hideDelay, this);
		        }
	        }
	    }
	
	    // private
	    ,deferHide : function(){
	        delete this.hideTimer;
	        if(this.menu.over){
	            this.parentMenu.setActiveItem(this, false);
	        }else{
	            this.menu.hide();
	        }
	    }
	    ,destroy : function(){
	    	this.el.remove();
	    }
	    ,getEl : function(){
	    	return this.el;
	    }
	    ,bind : function(arg0, arg1, arg2){
			if(typeof arg1 === 'object')
				this.el.bind(arg0, arg1, arg2);
			else 
				this.el.bind(arg0, arg1);
		}
		,trigger : function(arg0, arg1){
			this.el.trigger(arg0, arg1);
		}
		,triggerHandler : function(arg0, arg1){
			this.el.triggerHandler(arg0, arg1);
		}
	};
	
	/**
	* 文字菜单项
	*/
	$.uiwidget.TextMenuItem = function(parentMenu, cfg){
		$.extend(this, cfg);
		this.init(parentMenu);
	};
	$.uiwidget.TextMenuItem.prototype = {
		render : function(){
			var id = this.parentMenu.getItemId(this);
			var mi = ['<li itemId="', id,'" class="uiwidget-menu-item ',  this.disabled === true ? ' uiwidget-menu-item-disabled ' : '', this.menu?'uiwidget-menu-arrow">':'">'];
			if(this.icon){
				mi.push('<img class="uiwidget-menu-item-icon" border="0" align="absbottom"',
				'" src="', this.icon,'" /><span class="uiwidget-menu-item-text"> ');
			}
			mi.push(this.text,' </span></li>');
			return this.el = $(mi.join(''));
		}
	};
	$.extend($.uiwidget.TextMenuItem.prototype, $.uiwidget.MenuItem.prototype);
	
	/**
	* 有分隔线的菜单项
	*/
	$.uiwidget.SeparatorMenuItem = function(parentMenu, cfg){
		$.extend(this, cfg);
		this.init(parentMenu);
	};
	$.uiwidget.SeparatorMenuItem.prototype = {
		render : function(){
			var id = this.parentMenu.getItemId(this);
			var mi = ['<li itemId="', id,'" class="uiwidget-menu-line"></li>'];
			return this.el = $(mi.join(''));
		}
	};
	$.extend($.uiwidget.SeparatorMenuItem.prototype, $.uiwidget.MenuItem.prototype);
	
	$.fn.menu = function(cfg){
		return new $.uiwidget.Menu(cfg);
	};
	//deprecated
	$.menu = function(cfg){
		return new $.uiwidget.Menu(cfg);
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
    
    $.isArray = function(v){
    	return Object.prototype.toString.apply(v) === '[object Array]';
    };
    
    $.isObject = function(v){
    	return Object.prototype.toString.apply(v) === '[object Object]';
    };
})(jQuery);	