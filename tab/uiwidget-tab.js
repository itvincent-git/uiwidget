/**
* 标签组件
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2011-04-08
* @version 2.0.2
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.Tab = function(target, cfg){
		$.extend(this, cfg);
		this.el = $(target);
		this.init();
		this.render();
	};
	
	$.uiwidget.Tab.prototype = {
		tabIdGenerator : 0
		
		/**
		 * 是否打开滚动
		 * @cfg {boolean}
		 */
		,enableTabScroll : false
		
	    /**
	     * 滚动的长度
	     * @cfg {Number} 
	     */
	    ,scrollIncrement : 100
	    
		,init : function(){
			//if set as cfg, it will share the object
			this.tabItems = [];
			if(this.onTabClose){
				this.bind('tabClose', this.onTabClose);
			}
			if(this.onTabChange){
				this.bind('tabChange', this.onTabChange);
			}
		}
	
		//main render
		,render : function(){
			this.container = $('<div class="tab"></div>');
			this.el.append(this.container);
			this.renderHeader();
			this.renderBody();
			
			this.beginUpdate();
			for(var i=0; i < this.items.length ; i ++){
				this.addItem(this.items[i]);
			}
			this.endUpdate();
			
			if(this.initActiveTab !== undefined ){
				this.activeTab(this.initActiveTab == 'string' ? this.initActiveTab : this.tabItems[this.initActiveTab]);
			}	
		}
		
		,renderHeader : function(){
			this.header =  $('<div class="tab-header"><div class="tab-tabmenu-right"></div><div class="tab-scroller-right"/><div class="tab-scroller-left tab-scroller-left-disabled"/><div class="tab-strip-wrap"><div class="tab-strip"><ul class="tab-edge"/></div></div></div>');
			this.container.append(this.header);
			
			this.tabStrip = this.container.find("div.tab-strip");
			this.tabEdge = this.container.find("ul.tab-edge");
			this.stripWrap = this.container.find("div.tab-strip-wrap");
			
			if(this.enableTabScroll){
				this.scrollLeft = this.container.find("div.tab-scroller-left");
				this.scrollRight = this.container.find("div.tab-scroller-right");
				this.tabMenuRight = this.container.find("div.tab-tabmenu-right");
				
				this.scrollLeft.click($.proxy(this, "handlerScrollLeft"));
				this.scrollRight.click($.proxy(this, "handlerScrollRight"));
				this.tabMenuRight.click($.proxy(this, "showTabMenu"));
				this.container.resize($.proxy(this, "setStripWrapWidth"));
				this.setStripWrapWidth();
			}
			
			$('ul:not(.tab-edge)', this.tabStrip[0]).live('click', $.proxy(this, 'onTabClick'));
			$('.tab-close', this.tabStrip[0]).live('click', $.proxy(this, 'onTabCloseClick'));
		}
		
		,setStripWrapWidth : function(){
			this.stripWrap.width(this.container.width() - this.scrollLeft.width() 
					- this.scrollRight.width() - this.tabMenuRight.width());
		}
		
		,getTabMenu : function(){
			if(!$.fn.menu) throw "please import menu plugin.";
			this.tabMenu = $(document.body).menu({});
			var t = this;
			if(this.tabItems){
				for(var i =0; i < this.tabItems.length; i++){
					this.tabMenu.addMenuItem(
						{id: this.tabItems[i].id, text: this.tabItems[i].text, 
							handler: function(e, item){
								t.activeTab(item);
							}
						}
					);
				}
			}
			return this.tabMenu;
		}
		
		,showTabMenu : function(e){
			this.getTabMenu().showAlignTo(e.target);
		}
		
		/**
		添加标签页
		支持href 打开一个iframe页
		iframe 打开指定的iframe
		html 插入指定的html
		contentEl 打开指定的元素
		
		@param item 标签页设置内容
		@param position 添加的位置：
				1.position可以为before,after，表示加在tab的前或后
				2.id，表示目标id的标签
		*/
		,addItem : function(item, position){
			var tabId = this.getTabId(item);
			this.tabItems.push(item);
			var h = ['<ul tabId="', tabId, '" ', item.disabled ? 'class="disabled"' : '', '>',
					'<li class="left"></li>',
					'<li class="middle', item.closeable? ' middle-close' : '','">',
							'<div class="header-text">', item.text, '</div>', item.closeable? '<a class="tab-close"></a>' : '','</li>',
					'<li class="right"></li></ul>'];
			var tabHeader = $(h.join(''));
			if(position){
				if(position.id){
					this.tabStrip.children('ul[tabId='+ position.id + ']')[position.position](tabHeader);
				}
			}else{
				this.tabEdge.before(tabHeader);
			}
			this.delegateUpdates();
		}
		
		,onTabClick : function(e){
				var tabHeader = $(e.currentTarget);
				var tabId = this.findTabId(tabHeader);
				var item = this.searchItem(tabId);
				//标签禁用
				if(tabHeader.hasClass('disabled')){
					return;
				}	
				//判断重复
				var deactivateItem = this.getActiveItem();//t.searchItem(ah.attr('tabId'));
				if(deactivateItem == item){//重复点击
					return;
				}
				var tabContent = this.getTabContent(tabId);
				if(item.beforeActivate){
					if(item.beforeActivate(e, this, item, tabHeader, tabContent) === false)
						return;
				}
				this.loadTabContent(item, tabContent);
				//change the header class
				this.getActiveTab().removeClass('on');
				tabHeader.addClass('on');
				this.hideContent();
				//show this content
				tabContent.show();
				//trigger tab event
				if(deactivateItem  && deactivateItem.onDeactivate){
					deactivateItem.onDeactivate(e, this, deactivateItem, tabHeader, tabContent);
				}
				if(item.onActivate){
					item.onActivate(e, this, item, tabHeader, tabContent);
				}
				if(!deactivateItem || (deactivateItem && deactivateItem != item)){
					var iframe = tabContent.find('iframe[id=' + item.id + ']');
					this.triggerHandler('tabChange', [deactivateItem, item, tabHeader, tabContent, iframe, this]);	
				}
		}
		
		,onTabCloseClick : function(e/*tabHeader, item*/){
			var tabHeader = $(e.target).closest('ul');
			var tabId = this.findTabId(tabHeader);
			var item = this.searchItem(tabId);
			this.closeTab(tabId);
			this.triggerHandler('tabClose', [item]);
			return false;
		}
		
		,renderBody : function(){
			this.body = $('<div class="tab-body"></div>');
			this.container.append(this.body);
		}
		
		,getTabContent : function(tabId){
			var tabContent = this.body.children('.tab-content[tabId="' + tabId+ '"]');
			if(tabContent.length < 1){
				tabContent = this.renderContent(tabId);
				this.body.append(tabContent);
			}
			return tabContent;
		}
		
		/**
		* build the tabContent
		*/
		,renderContent : function(tabId){
			var item = this.searchItem(tabId);
			var tabContent = $(['<div class="tab-content" tabId="', tabId, '" ></div>'].join(''));
			if(item.href){
				if(!this.ajaxLoadPage){
					tabContent.append(['<iframe id="', item.id,'" name="' , item.id, '" height="',item.height? item.height: this.height, 
					'" width="100%" scrolling="auto" frameborder="0" allowtransparency="true" align="top" ></iframe>'].join(''));
				}
			}else if(item.iframe){
				tabContent.append(item.iframe);			
			}else if(item.html){
				tabContent.append(item.html);
			}else if(item.contentEl){
				tabContent.append(typeof item.contentEl == 'string'? $(item.contentEl) : item.contentEl);
			}	
			return tabContent;
		}
		
		/**
	     * suspends any internal calculations while doing a bulk operation.
	     */
	    ,beginUpdate : function(){
	        this.suspendUpdates = true;
	    }

	    /**
	     * resumes calculations at the end of a bulk operation.
	     */
	    ,endUpdate : function(){
	        this.suspendUpdates = false;
	        this.delegateUpdates();
	    }
	    
	    ,delegateUpdates : function(){
	        if(this.suspendUpdates){
	            return;
	        }
	        if(this.enableTabScroll /*&& this.rendered*/){
	            this.autoScrollTabs();
	        }
	    }
	    
		,autoScrollTabs : function(){
	        var wrap = this.stripWrap;
	        var cw = wrap.width();
	        var l = this.getScrollWidth();
	        
	        if(!this.enableTabScroll || this.items.length < 1 /*|| cw < 20*/){ // 20 to prevent display:none issues
	            return;
	        }
	        if(l <= cw){
	            if(this.scrolling){
	            	this.deActivateScrollers();
	            }
	        }else{
	            if(!this.scrolling){
	            	this.activateScrollers();
	            }
	            this.updateScrollButtons();
	        }
	    }
		
		,deActivateScrollers : function(){
			this.scrollLeft.hide();
			this.scrollRight.hide();
			this.tabMenuRight.hide();
			this.header.removeClass("tab-scrolling");
			this.scrolling = false;
		}
		
		,activateScrollers : function(){
			this.scrollLeft.show();
			this.scrollRight.show();
			this.tabMenuRight.show();
			this.header.addClass("tab-scrolling");
			this.scrolling = true;
	    }
	    
		,scrollTo : function(pos){
			this.stripWrap.animate({scrollLeft: pos}, "normal", "linear", $.proxy(this, "updateScrollButtons"));
		}
		
		,getScrollWidth : function(){
	        return this.tabEdge.position().left + this.getScrollPos();
	    }

	    // private
	    ,getScrollPos : function(){
	        return this.stripWrap.scrollLeft();
	    }

	    // private
	    ,getScrollArea : function(){
	        return this.stripWrap.width();
	    }

	    // private
	    ,getScrollIncrement : function(){
	        return this.scrollIncrement;
	    }
	    
	    ,scrollToTab : function(item, animate){
	        if(!item){ return; }
	        var el = this.getTabHeader(item);
	        var pos = this.getScrollPos(), area = this.getScrollArea();
	        var left = el.position().left + pos ;
	        var right = left + el.width();
	        if(left < pos){
	            this.scrollTo(left, animate);
	        }else if(right > (pos + area)){
	            this.scrollTo(right - area, animate);
	        }
	    }
		
	    ,handlerScrollRight : function(){
	        var sw = this.getScrollWidth()-this.getScrollArea();
	        var pos = this.getScrollPos();
	        var s = Math.min(sw, pos + this.getScrollIncrement());
	        if(s != pos){
	            this.scrollTo(s, this.animScroll);
	        }
	    }
	    
	    ,handlerScrollLeft : function(){
	        var pos = this.getScrollPos();
	        var s = Math.max(0, pos - this.getScrollIncrement());
	        if(s != pos){
	            this.scrollTo(s, this.animScroll);
	        }
	    }
	    
	    ,updateScrollButtons : function(){
	        var pos = this.getScrollPos();
	        this.scrollLeft[pos == 0 ? 'addClass' : 'removeClass']('tab-scroller-left-disabled');
	        this.scrollRight[pos >= (this.getScrollWidth()-this.getScrollArea()) ? 'addClass' : 'removeClass']('tab-scroller-right-disabled');
	    }
	    
		/**
		* 激活tab
		* @param item{Object} 激活的tab item / itemId{String} 激活的tab的id
		*/
		,activeTab : function(arg0){
			this.getTabHeader(arg0).click();
			if(this.scrolling){
                this.scrollToTab(arg0, this.animScroll);
            }
		}
		
		/**
		 * 根据item或者id取Tab的header
		 */
		,getTabHeader : function(item){
			return this.tabStrip.find('ul[tabId='+ this.getTabId(item) + ']');
		}
		
		/**
		加载tabContent
		*/
		,loadTabContent : function(item, tabContent, reload){
			//触发iframe链接,处理不同步的问题
			if(item.href){
				if(this.ajaxLoadPage){
					if(reload || !this.isContentLoaded(tabContent)){
						if($.fn.page){
							item.url = item.href;
							tabContent.page(item);
							tabContent.attr('loaded', true);
							tabContent.height(item.height ? item.height : this.height);
						}else{
							alert("Error！请导入uiwidget-page组件。");
						}	
					}
				}else{
					var iframe = tabContent.find('iframe[id=' + item.id + ']');
					if(reload || !iframe[0].src){
						iframe[0].src = this.disableCache(item.href);
					}
				}	
			}
		}
		
		/**
		 * 加上日期标记，避免跳转页面时IE有缓存
		 */
		,disableCache : function(url){
			var ts = new Date().getTime();
			// 去掉原有的 _=
			var ret = url.replace(/(\?|&)_=.*?(&|$)/, "$1_=" + ts + "$2");
			// 如果没有_=，就加上日期
			url = ret + ((ret == url) ? (url.match(/\?/) ? "&" : "?") + "_=" + ts : "");
			return url;
		}	
		
		/**
		* 重新刷新tab
		* @param item 标签id/标签的item
		*/
		,reloadTab : function(item){
			var sItem = this.searchItem(this.getTabId(item));
			this.loadTab(sItem);
		}
		
		/**
		* 加载tab
		* @param item 标签id/标签的item
		*/
		,loadTab : function(item){
			this.loadTabContent(item, this.getTabContent(this.getTabId(item)), true);
		}
		
		/**
		 * 内容是否已加载
		 */
		,isContentLoaded : function(tabContent){
			return tabContent.attr('loaded');
		}
		
		/**
		* 关闭tab
		* @param tabId 关闭的tabId
		*/
		,closeTab : function(tabId){
			var cTab = this.getTabHeader(tabId);//.remove()
			if(cTab.hasClass('on')){
				var nTab = cTab.next('ul:not(.tab-edge)');
				if(nTab.length > 0){
					nTab.click();
				}else{
					var pTab = 	cTab.prev('ul');
					if(pTab.length > 0){
						pTab.click();
					}
				}
			}
			cTab.remove();
			this.getTabContent(tabId).remove();
			var item = this.searchItem(tabId);
			this.removeItem(tabId);
			this.delegateUpdates();
			this.triggerHandler('tabClose', [item]);
		}
		
		/**
		* 隐藏tabContent
		*/
		,hideContent : function(){
			this.body.children('div.tab-content').hide();
		}
		
		/**
		* 获得激活的TAB
		*/
		,getActiveTab : function(){
			return this.tabStrip.children('ul.on');
		}
		
		/**
		 * 解除禁用TAB
		 */
		,enableTab : function(id){
			var tab = this.getTabHeader(id);
			tab.removeClass('disabled');
		}
		
		/**
		 * 禁用TAB
		 */
		,disableTab : function(id){
			var tab = this.getTabHeader(id);
			tab.addClass('disabled');
		}
		
		/**
		 * TAB是否被禁用
		 */
		,isDisabledTab : function(id){
			var tab = this.getTabHeader(id);
			return tab.hasClass('disabled');
		}
		
		/**
		取得item中定义的ID,如果没有则自动生成一个
		*/
		,getTabId : function(item){
			return typeof item == "string" ? item : (item.id || (item.id = 'uiwidget-tab-' + this.tabIdGenerator++));
		}
		
		/**
		查看ID查找item
		*/
		,searchItem : function(tabId){
			for(var i = 0, len = this.tabItems.length; i < len ; i++){
				if(this.tabItems[i].id && tabId == this.tabItems[i].id)
					return 	this.tabItems[i];		
			}
		}
		/**
		 * 取得标签的全部item
		 * @return {array} 
		 */
		,getItems : function(){
			return this.tabItems;
		}
		
		//private
		,removeItem : function(tabId){
			for(var i = 0, len = this.tabItems.length; i < len ; i++){
				if(this.tabItems[i].id && tabId == this.tabItems[i].id){
					this.tabItems.splice(i, 1);
					return;
				}
			}
		}
		
		/**
		 * 根据ID，得到该tab下的iframe
		 */
		,getContentIframe : function(id){
			var tabContent = this.getTabContent(id);
			var iframe = tabContent.find('iframe[id=' + id + ']');	
			return iframe;
		}
		
		/**
		 * 取得选中的item
		 */
		,getActiveItem : function(){
			var ah =  this.getActiveTab();
			var activateItem = this.searchItem(this.findTabId(ah));	
			return activateItem;
		}
		
		/**
		 * 
		 *  @param {Boolean} value true to prevent
		 */
		,setClosable : function(item, isClosable){
			var h = this.getTabHeader(item);
			var c = h.find('.tab-close');
			if(c.length == 0){
				this.renderCloseButton(h);
			}
			isClosable ? c.show() : c.hide();
		}
		
		,renderCloseButton : function(header){
			header.find('.middle').append('<a class="tab-close"></a>');
		}
		
		/**
		 * find tab id by el of tab's header 
		 */
		,findTabId : function(tabEl){
			return tabEl.attr("tabId");
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
		
		,getIframeById : function(id){
			return this.getTabContent(id).find('iframe');
		}
		
		/**
		 * 新增一个tab
		 * 1、如果tab已经存在，则激活此tab，如果refresh为true时，则激活时要刷新；如果tab不存在则新增
		 * 2、item中记录recordId
		 * 3、如果多于一个tab则设置为可关闭
		 */
		,addContentTab : function(tabItem) {
			if (tabItem.closeable !== false) {
				tabItem.closeable = true;
			}

			if (this.searchItem(tabItem.id)) {
				if (tabItem.refresh === true) {
					this.loadTab(tabItem);
					this.searchItem(tabItem.id).recordId = tabItem.recordId;
				}
			} else {
				this.addItem(tabItem);

				if (this.tabItems.length > 1) {
					this.setClosable(this.tabItems[0].id, true);
				}
			}

			this.activeTab(tabItem);
		}
		
		/**
		 * 取当前激活的tab content，用于操作content中的元素
		 */
		,getActiveContent : function() {
			return this.getTabContent(this.getActiveItem().id);
		}

		/**
		 * 关闭当前激活的Tab
		 * 1、如果关闭后只有一个tab，则设置为不可关闭
		 * 2、如果有parent，则激活parent
		 * 3、如果refresh为true，则要刷新parent
		 */
		,closeActiveTab : function(refresh) {
			var closeTab = this.getActiveItem();
			var parent = closeTab.parent;

			this.closeTab(this.getActiveItem().id);

			if (this.tabItems.length <= 0) {
				parent.closeable = false;
				this.addContentTab(parent);
			}

			if (refresh === true && parent != undefined) {
				if (this.searchItem(parent.id)) {
					this.activeTab(parent);
					
				} else {
					this.addContentTab(parent);
				}

				if (parent.reload) {
					window.setTimeout(function() {
						try {
							var args = closeTab.reloadArgs ? closeTab.reloadArgs : [];
							parent.reload.apply(this, args);
						} catch (e) {
						}
					}, 500);
				}
			}			
		}

	};
	
	$.fn.tab = function(cfg){
		return new $.uiwidget.Tab(this, cfg);
	};
	
	/**
	 * 重新计算tab iframe的高度
	 */
	$.fn.resizeIframe = function(offset) {
		var iframe = this[0];
		try{
			var fdh=iframe.Document ? iframe.Document.body.scrollHeight : iframe.contentDocument.body.offsetHeight;
			iframe.height =  fdh + offset.offsetHeight;
		} catch (ex) {}
	};
	
})(jQuery);	