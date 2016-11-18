/**
* Navigator4导航组件
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2010-01-05
* @version 1.0.0-SNAPSHOT
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.Navigator4 = function(el, cfg){
		$.extend(this, cfg);
		this.el = $(el);
		this.hrefTarget = cfg.hrefTarget;
		this.loadData();
		this.init();
		if(this.autoRender){
			this.render();
		}
	};
	
	$.uiwidget.Navigator4.prototype = {
		/*
		 * event 事件定义
		 * navresize 导航大小改变时，分发此事件，如最大最小化、菜单的折叠
		 * itemclick 导航项被点击时，分发此事件
		 */	
		/**
		 * 导航数据
		 */	
		data : []
		        
		/**
		 * 获取数据的URL
		 */        
		,url : ''        
			
		/**
		 * 页面跳转的链接对象，一般是内容页的DIV
		 */	
		,hrefTarget : null
		
		,autoRender : true

		/**
		 * 默认是否显示最大化
		 */	
		,autoMax : true

		/**
		 * 最大化的div
		 */	
		,maxDiv : null

		/**
		 * 最小化的div
		 */	
		,minDiv : null

		/**
		 * 最大化的button
		 */	
		,maxButton : null

		/**
		 * 折叠的button
		 */	
		,foldButton : null

		/**
		 * 当前所选择的节点元素id
		 */
		,currentSelectId : null
		
		/**
		 * 初始化
		 * 
		 */	
		,init : function(){
			
			//创建第一层div
			var parentDiv = $("<div></div>").attr("class", "nav4");
			this.el.append(parentDiv);
			//创建最大化div
			this.createMaxDiv();
			parentDiv.append(this.maxDiv);
			//创建最小化div
			this.createMinDiv();
			parentDiv.append(this.minDiv);
			//判断初始化时显示哪个div
			if (this.autoMax) this.minDiv.hide();
			else this.maxDiv.hide();
			
			this.maxButton.bind("click", {nav: this}, this.maximize);
			this.foldButton.bind("click", {nav: this}, this.minimize);
			
		}

		/**
		 * 最大化
		 */
		,maximize : function(e){
			var nav = e.data.nav;
			nav.getMaxDiv().show();
			nav.getMinDiv().hide();
			//触发navresize方法
			nav.triggerHandler('navresize', []);
		}
		
		/**
		 * 最小化
		 */
		,minimize : function(e){
			var nav = e.data.nav;
			//隐藏和显示
			nav.getMinDiv().show();
			nav.getMaxDiv().hide();
			//触发navresize方法
			nav.triggerHandler('navresize', []);
		}

		,createMinDiv : function() {
			//创建最小化的div
			this.minDiv = $("<div></div>").attr("class", "nav-min");
			//渲染最小化div
			this.renderMaxButton();
			//为最小化的div加入一个ul
			this.minDiv.append($("<ul></ul>"));
		}

		,createMaxDiv : function() {
			//创建最大化的div
			this.maxDiv = $("<div></div>").attr("class", "nav-max");
			//渲染折叠按钮
			this.renderFoldButton();
			//为最大化的div加入一个ul
			this.maxDiv.append($("<ul></ul>"));
		}

		,getMaxDiv : function() {
			return this.maxDiv;
		}

		,getMinDiv : function() {
			return this.minDiv;
		}

		/**
		 * 渲染最大化按钮
		 */
		,renderMaxButton: function() {
			var input = $("<input/>").attr("type", "button").attr("title", "展开菜单")
				.attr("class", "fold-button-right").attr("hideFocus", "true");
			this.maxButton = input;
			this.minDiv.append(input);
		}

		
		/**
		 * 渲染折叠按钮(最小化按钮)
		 */
		,renderFoldButton : function(){
			//创建收起菜单的按钮(最小化)
			var input = $("<input/>").attr("type", "button").attr("title", "收起菜单")
				.attr("class", "fold-button-left").attr("hideFocus", "true");
			this.foldButton = input;
			this.maxDiv.append(input);
		}

		/**
		 * 创建最小化的div
		 */
		 ,renderMin : function() {
			//创建ul元素
			var ul = this.minDiv.find("ul");
			for (var i = 0; i < this.data.length; i++) {
				var text = this.data[i].text;
				var minIconClass = this.data[i].minIconClass;
				//判断一级菜单是否有子菜单, 如果有子菜单, 则不创建一级菜单
				if (this.data[i].children != null) {
					//再创建二级菜单
					for (var j = 0; j < this.data[i].children.length; j++)	{
						var secondText = this.data[i].children[j].text;
						var secondMinIconClass =  this.data[i].children[j].minIconClass;
						var secondLi = this.createMinLi(this.data[i].children[j], secondMinIconClass);
						secondLi.bind("click", {data: this.data[i].children[j], nav: this, li: secondLi}, this.clickMinNav);
						ul.append(secondLi);
					}
				} else {
					//创建一级菜单的li
					var li = this.createMinLi(this.data[i], minIconClass);
					li.bind("click", {data: this.data[i], nav: this, li: li}, this.clickMinNav);
					//先创建一级菜单
					ul.append(li);
				}
			}
		 }

		/**
		 * 创建最大化的菜单div
		 */
		,renderMax: function() {
			//得到ul元素
			var ul = this.maxDiv.find("ul");
			for (var i = 0; i < this.data.length; i++) {
				var iconClass = this.data[i].iconClass;
				if (iconClass == null) iconClass = "";
				//判断是否有一级菜单
				if (this.data[i].children != null) {
					//创建有子菜单的一级菜单
					//创建一级菜单
					var li = $("<li></li>").attr("class", "nav-item-group").attr("id", this.data[i].id + "-max")
						.html(this.data[i].text);
					ul.append(li);
					//绑定点击方法
					li.bind("click", {li: li, dataI: this.data[i], nav: this}, this.clickMaxFirstNav);
					//创建二级菜单
					this.createMaxSecondNav(this.data[i], li);
				} else {
					//创建没有子菜单的一级菜单
					var li = $("<li></li>").attr("class", "nav-item").attr("id", this.data[i].id + "-max");
					var input = $("<input/>").attr("type", "button").attr("title", this.data[i].text)
						.attr("class", "nav-item-icon " + iconClass).attr("hideFocus", "true");
					var span = $("<span></span>").attr("class", "nav-item-text").html(this.data[i].text);
					//绑定点击方法
					li.bind("click", {li: li, dataI: this.data[i], nav: this}, this.clickMaxFirstNav);
					li.append(input);
					li.append(span);
					ul.append(li);
				}
			}

		}




		,replaceBlank : function(string, reg) {
			return string.replace(reg, "");
		}

		/**
		 * 设置元素id为选中的样式
		 * @param id 元素id
		 */
		,setSelectedCss : function(id) {
			//设置选中时最小化菜单样式
			var min = $("#" + id + "-min");
			min.attr("class", min.attr("class") + " nav-item-on");
			//设置选中时最大化菜单样式
			var max = $("#" + id + "-max");
			max.attr("class", max.attr("class") + " nav-item-on");
		}

		/**
		 * 设置元素id为不选中的样式
		 * @param id 元素id
		 */
		,setUnSelectedCss : function(id) {
			var min = $("#" + id + "-min");
			min.attr("class", "nav-item");
			var max = $("#" + id + "-max");
			max.attr("class", "nav-item");
		}


		 ,createMinLi : function(dataI, minIconClass) {
				//创建li
				var li = $("<li></li>").attr("class", "nav-item").attr("id", dataI.id + "-min");
				//创建input
				var input = $("<input/>").attr("type", "button").attr("title", dataI.text)
					.attr("class", "nav-item-icon " + minIconClass).attr("hideFocus", "true");
				li.append(input);
				return li;
		 }

		/**
		 * 创建最大化二级菜单
		 */
		,createMaxSecondNav: function(dataI, li) {
			//创建二级菜单的ul
			var ul = $("<ul></ul>").attr("style", "display:block");
			li.append(ul);
			for (var i = 0; i < dataI.children.length; i++) {
				var iconClass = dataI.children[i].iconClass;
				var text = dataI.children[i].text;
				//创建li
				var secondLi = $("<li></li>").attr("class", "nav-item").attr("id", dataI.children[i].id + "-max");
				//创建input
				var input = $("<input/>").attr("type", "button").attr("title", dataI.children[i].text)
					.attr("class", "nav-item-icon " + iconClass).attr("hideFocus", "true");
				//创建span
				var span = $("<span></span>").attr("class", "nav-item-text").html(text);
				//为二级菜单绑定事件
				secondLi.bind("click", {li: secondLi, dataI: dataI.children[i], nav: this}, this.clickMaxSecondNav);
				secondLi.append(input);
				secondLi.append(span);
				ul.append(secondLi);
			}
		}


		//最小化时点击菜单触发的方法
		,clickMinNav: function(e) {
			var nav = e.data.nav;
			var li = e.data.li;
			var data = e.data.data;
			//判断是否有子菜单
			if (data.children == null) {
				//没有子菜单, 判断是否有链接
				if (data.href != null) $("#" + nav.hrefTarget).page(data.href);
				//修改之前所选中的菜单为不选中(改变样式)
				if (nav.currentSelectId != null) nav.setUnSelectedCss(nav.currentSelectId);
				//设置当前的id为选择的id
				nav.currentSelectId = nav.replaceBlank(li.attr("id"), "-min");
				//设置选中样式
				nav.setSelectedCss(nav.currentSelectId);
			}
			//执行菜单点击方法
			nav.triggerHandler('itemclick', [data]);
		}

		/**
		 * 点击最大化一级菜单的方法
		 */
		,clickMaxFirstNav: function(e) {
			var nav = e.data.nav;
			var data = e.data.dataI;
			var li = e.data.li;
			//如果有子菜单的话, 需要加入显示子菜单的控制
			if (data.children != null) {
				var ul = li.find("ul");
				//设置子菜单显示与否
				if (li.attr("class") == "nav-item-group") {
					li.attr("class", "nav-item-group-folded");
					//显示li下面的ul(显示二级菜单)
					ul.attr("style", "display:none");
				} else {
					li.attr("class", "nav-item-group");
					ul.attr("style", "display:block");
				}
				nav.triggerHandler('navresize', []);
			} else {
				//没有子菜单并且有提供链接的话, 改变选中样式, 添加链接
				if (data.href != null) $("#" + nav.hrefTarget).page(data.href);
				//设置原来所选中的菜单为不选中(改变css)
				if (nav.currentSelectId != null) nav.setUnSelectedCss(nav.currentSelectId);
				//设置当前选择菜单的id
				nav.currentSelectId = nav.replaceBlank(li.attr("id"), "-max");
				//设置当前选择菜单的css
				nav.setSelectedCss(nav.currentSelectId);
			}
			nav.triggerHandler('itemclick', [data]);
		}


		/**
		 * 点击二级菜单时执行的方法
		 */
		,clickMaxSecondNav : function(e) {
			e.stopPropagation();
			var nav = e.data.nav;
			var li = e.data.li;
			li.attr("class", li.attr("class") + " nav-item nav-item-on");
			var data = e.data.dataI;
			if (data.href != null) $("#" + nav.hrefTarget).page(data.href);
			//将原来选中的菜单样式还原(更改原来选中的菜单的样式)
			if (nav.currentSelectId != null) nav.setUnSelectedCss(nav.currentSelectId);
			//改变当前选中样式
			nav.currentSelectId = nav.replaceBlank(li.attr("id"), "-max");
			nav.setSelectedCss(nav.currentSelectId);
			//触发菜单点击事件
			nav.triggerHandler('itemclick', [data]);
		}


		/**
		 * 渲染
		 */
		,render : function(){
			this.renderMax();
			this.renderMin();
		}
		
		/**
		 * 渲染快速新建的菜单
		 * @param 导航数据
		 */
		,renderMenu : function(items){
			
		}

		
		/**
		 * 取得折叠的按钮
		 */
		,getFoldButton : function(){
			return this.foldButton;
		}

		/**
		 * 取得最大化的按钮
		 */
		,getMaxButton : function() {
			return this.maxButton;
		}
		
		,getHeight : function(){
			if (this.maxDiv.is(":hidden")) {
				//如果菜单是最小化的返回最小化div的高
				return this.minDiv.attr("scrollHeight");
			} else {
				//如果菜单是最大化的返回最大化div的高
				return this.maxDiv.attr("scrollHeight");
			}
		}

		,getWidth : function() {
			if (this.maxDiv.is(":hidden")) {
				//此时处于最小化
				return this.minDiv.attr("offsetWidth");
			} else {
				//菜单最大化
				return this.maxDiv.attr("offsetWidth");
			}
		}

		/**
		 * 返回当前菜单是否最大化, 如果最大化返回true, 否则返回false
		 */
		,isMax : function() {
			return !this.maxDiv.is(":hidden");
		}
		
		/**
		 * 加载JSON数据
		 */
		,loadData : function(){
			var t = this;
			//如果没有提供url, 则使用data配置
			if (this.url != "") {
				$.ajax({
					async : false
					,cache : this.cache
					,dataType : 'json'
					,type : 'POST'
					,url : this.url
					,data : this.loadParas
					,timeout : this.timeout || 60000//默认超时60秒
					,contentType: "application/x-www-form-urlencoded; charset=UTF-8"
					,success : function(data){
						t.data = data || [];
					}
				});
			}
		}
		
		/**
		 * 取得数据
		 * @return 数据
		 */
		,getData : function(){
			return this.data;
		}
		
		/**
		 * 绑定事件
		 */
		,bind : function(arg0, arg1, arg2){
			arg0 = arg0.toLowerCase();
			if(typeof arg1 == 'object')
				return this.el.bind(arg0, arg1, arg2);
			else 
				return this.el.bind(arg0, arg1);
		}
		/**
		 * 触发事件
		 */
		,trigger : function(arg0, arg1){
			return this.el.trigger(arg0, arg1);
		}
		/**
		 * 触发自定义事件
		 */
		,triggerHandler : function(type, data, srcEvent){
			type = type.toLowerCase();
			if(srcEvent){
				if( this.el[0] ){
					var event = srcEvent;
					event.type = type;
					//触发事件时实际的元素
					event.triggerTarget = event.target;
					event.stopPropagation();
					$.event.trigger( event, data, this.el[0], false);
					return event.result;
				}
			}else{
				return this.el.triggerHandler(type, data);
			}		
		}

		,select : function(id) {
			var data = this.getDataById(id);
			if (data.href != null) $("#" + this.hrefTarget).page(data.href);
			if (this.currentSelectId != null) this.setUnSelectedCss(this.currentSelectId);
			//改变当前选中样式
			this.currentSelectId = id;
			this.setSelectedCss(this.currentSelectId);
			//触发菜单点击事件
			this.triggerHandler('itemclick', [data]);
		}
	
		//根据ID查找相应的数据
		,getDataById : function (id) {
			for (var i = 0; i < this.data.length; i++) {
				if (this.data[i].id == id) {
					return this.data[i];
				} else {
					if (this.data[i].children != null) {
						var children = this.data[i].children;
						for (var j = 0; j < children.length; j++) {
							if (children[j].id == id) {
								return children[j];
							}
						}
					}
				}
			}
		}
		
	};
	
	$.fn.navigator4 = function(cfg){
		return new $.uiwidget.Navigator4(this, cfg);
	};
})(jQuery);	