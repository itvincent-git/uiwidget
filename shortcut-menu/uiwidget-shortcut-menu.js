/**
* uiwidget.ShortcutMenu
*
* @author Vincent (zhongyongsheng@ceopen.cn)
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.ShortcutMenu = function(target, cfg){
		$.extend(this, cfg);
		this.shortcutMenu = target;
		this.init();
		this.render();
	};
	
	/*
		下拉条:
		如果displayableItemSize>=item的数目,下拉条不显示,反之则显示
		根据resize事件作出变化

		下拉部分:
		根据displayableItemSize计算出剩余需要显示出来的item,例如计算出displayableItemSize=5,总共的item有10个,那么下拉部分就显示后面的5个item,其余部分隐藏
	*/
	$.uiwidget.ShortcutMenu.prototype = {
		addMenu : '新增快捷菜单'
		,navMenu : '导航设置'
		,more : '更多'
		,nav:[] //组装html的集合
		,itemWidth : 42//每个item的宽度
		,init : function(){
			var t = this;
			if(document.all){
				t.shortcutMenu.resize(function(){
					t.shortcutMenu.empty();
					t.render();
				});
			}else{
				$(window).resize(function(){
					t.shortcutMenu.empty();
					t.render();
				});
			}
		}
		//main render
		,render : function(){
			this.shortcutMenu.addClass('uiwidget-shortcut-nav uiwidget-shortcut-fast-nav');

			var displayableItemSize = parseInt(this.shortcutMenu.width() / this.itemWidth);	
			
			this.nav.push('<ul>');

			this.renderShortcutBar(displayableItemSize);
			
			this.renderAddMenuItem(displayableItemSize);

			if(this.data.length >= displayableItemSize && displayableItemSize > 0){
				this.nav.push('</ul></div></li>');
			}
			
			this.nav.push('</ul>');

			this.shortcutMenu.append(this.nav.join(''));
			
			this.nav = [];

			var t = this;

			$('li.addOtherMenu', this.shortcutMenu).click(function(){
				if(typeof(t.onAddMenuItem)=='function')
					t.onAddMenuItem();
			});
			
			var hideMenu = $('div.hideMenu', t.shortcutMenu);

			$('li.hideMenuButton', this.shortcutMenu).click(function(e){
				var maxWidth = $(document.body).width();
				var width = parseInt(e.clientX)+hideMenu.width();
				if(width >= maxWidth)
					hideMenu.attr('className','hideMenu uiwidget-shortcut-fast-nav-more uiwidget-shortcut-fast-nav-more-right');
				else
					hideMenu.attr('className','hideMenu uiwidget-shortcut-fast-nav-more');
				
				hideMenu.fadeIn(100);
				e.stopPropagation();
			});

			$(document).click(function(){
				hideMenu.fadeOut(100);
			});

			$(document).blur(function(){
				hideMenu.fadeOut(100);
			});
			
			var ifm = this.hrefTarget;

			this.shortcutMenu.children().children().click(function (){
				if($(this).attr('href')){
					if(typeof(t.changeBgColor)=='function'){
						t.changeBgColor(this);
					}
					$('#'+ifm).attr('src',$(this).attr('href'));
				}
			});//add nav click event
			
			$("ul.hideMenuUl").children().click(function (){
				if($(this).attr('href'))
					$('#'+ifm).attr('src',$(this).attr('href'));
			});//add nav click event

			if(document.all){//for IE
				$('#'+ifm).focus(function(){
					hideMenu.fadeOut(100);
				});
			}
		}
		
		,renderShortcutBar : function(displayableItemSize){
			for(var i=0; i<displayableItemSize; i++){
				if(this.data.length >= displayableItemSize && i==displayableItemSize-1){
					break;
				}
				var menu = this.data[i];
				if(!menu)//防止this.data.length<displayableItemSize的情况
					break;
				this.nav.push('<li href="',menu.href,'"><a href="javascript:void(0);"><img src="',menu.icon,'" alt="',menu.text,'" title="',menu.text,'"/></a></li>');
			}
			if(this.data.length >= displayableItemSize && displayableItemSize > 0){
				for(var j=displayableItemSize-1; j<this.data.length;j++){
					if(j == displayableItemSize-1){
						this.nav.push('<li class="hideMenuButton"><div title="', this.more ,'" class="shortcut-menu-more"></div>');
						this.nav.push('<div class="hideMenu uiwidget-shortcut-fast-nav-more" style="display:none;"><ul class="hideMenuUl">');
					}
					var menu = this.data[j];
					this.nav.push('<li href="',menu.href,'"><a href="javascript:void(0);"><img src="',menu.icon,'" alt="',menu.text,'" title="',menu.text,'"/>',menu.text,'</a></li>');								
				}
			}else{
				this.nav.push('<li class="addOtherMenu"><div class="shortcut-menu-setting" title="', this.navMenu ,'"></div></li>');
			}
		}

		,renderAddMenuItem : function(displayableItemSize){
			if(this.data.length >= displayableItemSize && displayableItemSize > 0){
				this.nav.push('<li class="addOtherMenu uiwidget-shortcut-add"><a href="javascript:void(0);">', this.addMenu ,'</a></li>');
			}
		}
		
		,renderDropDownButton : function(){
			
		}

		,renderDropDownMenu : function(){
			
		}
	};
	
	
	$.fn.shortcutMenu = function(cfg){
		return new $.uiwidget.ShortcutMenu(this, cfg);
	};
})(jQuery);	