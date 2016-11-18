/**
* Grid组件
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2011-03-28
* @version 2.0.3
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
	
	$.uiwidget.Grid = function(target, cfg){
		$.extend(this, cfg);
		this.grid = target;
		this.init();
		this.render();
	};
	
	$.uiwidget.Grid.prototype = {
		/**
		底部工具栏的文字
		*/
		pageNumberText  : "页码："
      	,jumperText 	: "跳到"
      	,firstText      : "首页"
      	,prevText       : "前一页"
      	,nextText       : "下一页"
      	,lastText       : "末页"
      	,emptyMsg       : "没有记录"
      	,displayMsg     : "显示 {0} - {1}条，共 {2} 条"
      	,pageSizeListText:"显示条数："
		/**
		每页显示行数
		,pageSize : 15
		*/
		/**
		列表高度,默认高度(15行)
		*/
		,height : 375//398
		/**
		列设置
		*/
		,cm : []
		/**
		列表的json数据
		*/
		,data: {"totalCount" : 0, "result" : []}       
		/*
		data : {"totalCount":2, "result":[{id:"1", name : "张三", remark : "2009-01-01" , effectiveDate:"2009-02-21"},
		{id:"2", name : "李四", remark : "2009-01-02"}]}
		*/
		/**
		获取列表json的链接
		url : 'http://localhost:8080/test/test.do?method=paging'
		*/		
		/**
		初始化查询参数
		baseParams : {}
		*/
		/**
		默认排序字段及方式
		defaultSort : {field:'id', direction: 'DESC'}
		*/
		/**
		是否显示表头
		*/
		,displayHeader : true
		/**
		是否自动加载数据
		*/
		,autoLoad : true
		/**
		默认行高度
		*/
		,defaultLineHeight : 25
		/**
		 * 滚动条预计宽度
		 */
		,scrollOffsetWidth : 17
		/**
		 * 是否使用ajax缓存
		 */
		,cache : false
		/**
		 * 单元格边框宽度
		 */
		,cellBorder : 1
		
		//初始化
		,init : function(){
			this.initParas();
			var t = this;
			$.each(['', 'Single', 'Multi'], function(i, name){
				t['getContextMenu' + name] = function(){
					if(!t['cMenu'+name]) {
						if(t.grid.menu){
							t['cMenu'+name] =  t.grid.menu(t['contextMenu' + name]);
						}	
					}
					return t['cMenu'+name];
				};
			});
			$.each(['beforeRender', 'afterRender', 'beforeRowClick', 'headerCheckboxClick'], function(i, name){
				if(t[name]) t.bind(name, t[name]);
			});
			this.sm = this.sm || new $.uiwidget.RowSelectionModel();
			this.sm.grid = this;
			this.cacheData = this.data;
			this.pageToolbar = this.pageToolbar || new $.uiwidget.ComplexPageToolbar();
			this.pageToolbar.grid = this;
			this.rowBuilder = this.rowBuilder || new $.uiwidget.GridRowBuilder();
			this.rowBuilder.grid = this;
		}
		//初始化查询参数
		,initParas : function(){
			this.paras = {};
			if(this.defaultSort){
				this.paras.sort = this.defaultSort.field;
				this.paras.dir = this.defaultSort.direction;
			}
			if(this.pageSize){
				this.paras.start = 0;	
				this.paras.limit = this.pageSize;
			}
			$.extend(this.paras, this.baseParams);
		}
		//main render
		,render : function(){
			var cm = this.cm;
			var t = this;
			this.container = $(['<div class="grid-container"><div class="grid-main-wrap">',
				'<div class="grid-mainhead-wrap">',
				'<table class="grid-main" cellspacing="0" cellpadding="0">',
				'<thead></thead></table></div>',
				'<div class="grid-mainbody-wrap"  style="height:', this.height,'px;">', 
				'<div class="grid-mainbody"></div>',
				'</div></div></div>'].join(''));
			this.grid.append(this.container);
			this.mainWrap = t.container.children('.grid-main-wrap');
			this.mainHeadWrap = t.mainWrap.children('.grid-mainhead-wrap');
			this.mainBodyWrap =  t.mainWrap.children('.grid-mainbody-wrap');
			this.mainBody = this.mainBodyWrap.find('.grid-mainbody');
			if(this.displayHeader){
				if(this.customHeader)
					this.renderCustomHeader();
				else	
					this.renderHeader();
			}
			this.headerTd = this.mainHeadWrap.find('thead').find('td');
			this.headerCb = this.mainHeadWrap.find('.grid-header-checkbox');
			if(this.displayHeader){
				this.addHeaderEvent();
			}
			this.renderEditor();
			if(this.pageSize)
				this.pageToolbar.renderToolbar();
			if(this.showSummaryBar){
				if($.uiwidget.SummaryBar){
					this.summaryBar = new $.uiwidget.SummaryBar(this);
				}
			}
			if(this.viewConfig && this.viewConfig.horizontalScroll){
				this.mainBodyWrap.css('overflow-x', 'auto');
				this.mainBodyWrap.css('position','relative');
				this.addHorizontalScroller(this.mainHeadWrap);
				//解决列宽度为px时，右边留白处理
				this.mainBody.addClass('grid-mainbody-scroller');
				
				//mainBody滚动带动mainHead滚动
				this.mainBodyWrap.bind('scroll', function(e){
					var target = $(this);
					var sl = target.scrollLeft();
					var st = target.scrollTop();
					t.mainHeadWrap.scrollLeft(sl);
					t.triggerHandler('bodyscroll',[t, sl, st]);
				});	
			}	
			if(this.autoLoad)
				this.loadData();
			this.trigger('rendered', [this]);	
		}
		//添加水平的滚动条
		,addHorizontalScroller : function(el){
			el.wrapInner('<div class="grid-mainhead-scroller"></div>');
		}
		,buildHeadRow : function(cm){
			var headRow = [];
			for(var i = 0; i < cm.length ; i++){
				var n = cm[i];
				if(n.checkbox){
					headRow.push('<th ', n.row?' rowspan='+n.row:'', n.col?' colspan='+n.col:'', n.hidden?' style="display:none"':'',n.dataIndex, ' unselectable="on"><input type="checkbox" class="grid-header-checkbox"></th>');
				}else{
					headRow.push('<td ', n.row?' rowspan='+n.row:'', n.col?' colspan='+n.col:'', n.hidden?' style="display:none"':'', ' style="width:', n.width,'"  class="grid-cm-', n.dataIndex,' grid-header-', n.dataIndex, '">');
					if(i == 0){ 
						headRow.push('<span class="grid-title-blank" ');
					}else{
						headRow.push('<span class="grid-title-line" ');
					}
					if(n.title == undefined){
						headRow.push('title="', n.header, '"');
					}else{
						headRow.push('title="', n.title, '"');
					}
					headRow.push('unselectable="on"><a class="grid-title-text">', n.header);
					
					if(n.iconCls){
						headRow.push('<input type="button" hideFocus="true" class="', n.iconCls, '"/>');
					}
					if(n.sortable !== false){
						headRow.push('</a><div class="sort-icon"/>');
					}else{
						headRow.push('</a>');
					}
					headRow.push('</div></td>');
				}
			}
			return 	headRow;
		}
		,renderCustomHeader : function(){
			var nth = [];
			var t = this;
			var nth = ['<tr class="grid-header-row-hidden">'];
			nth = nth.concat(this.buildHeadRow(this.cm));
			nth.push('</tr>');
			$.each(this.customHeader, function(index, customCm){
				nth.push('<tr>');
				nth = nth.concat(t.buildHeadRow(customCm));
				nth.push('</tr>');
			});
			this.mainHeadWrap.find('thead').append(nth.join(''));
		}
		,renderHeader : function(){
			var htd = ['<tr>'];
			htd = htd.concat(this.buildHeadRow(this.cm));
			htd.push('</tr>');
			this.mainHeadWrap.find('thead').append(htd.join(''));
		}
		,renderEditor : function(){
			var t = this;
			//render focus
			t.focus = $('<a class="grid-focus" tabindex="-1" href="#"/>');
			t.mainBodyWrap.append(t.focus);
			$.each(this.cm, function(i, n){
				if(n.editor ){
					if(typeof n.editor == 'string'){
						n.editor = {html:n.editor};//t.mainBodyWrap.editor({field: n.editor});
					}
					if(typeof n.editor == 'object'){
						var cfg = n.editor;
						if(cfg.type){
							if(cfg.type == 'text'){
								var vid = 'grid-editor-' + n.dataIndex;
								cfg.html = ['<input id="', vid, '" class="', vid, ' ', cfg.cls,'" type="text" />'].join('');
							}else if(cfg.type == 'date'){
								var vid = 'grid-editor-' + n.dataIndex;
								cfg.html = $(['<input id="', vid, '" class="', vid, ' ', cfg.cls,'" type="text" />'].join(''));
								t.grid.append(cfg.html);
								Calendar.setup({inputField : cfg.html[0], ifFormat : "%Y-%m-%d", button : cfg.html[0] });
								cfg.startEdit = function(e, editor){
									editor.getEditEl()[0].onclick();
								};
							}
						}
						n.editor = t.mainBodyWrap.editor({
							field: cfg.html
						});
						n.editor.bind('onComplete', function(e, editor){
							var bl = editor.bindEl;
							//处理滚动条出现时,对focus到第一行
							t.doFocus(bl);
							var trIdx = t.findRowIndex(t.findParentRow(bl));
							var dataIdx = t.getDataIndex(bl.parents('td')[0]);
							t.data.result[trIdx][dataIdx] = editor.getValue();
							t.addTitle(bl, editor.getValue()); 
							if(t.sm.activateEditor){
								t.sm.activateEditor = null;
							}
						});
						n.editor.bind('onCancel', function(e, editor){
							t.doFocus(editor.bindEl);
						});
						if(cfg.startEdit) n.editor.bind('startEdit', cfg.startEdit);
						if(cfg.beforeComplete) n.editor.bind('beforeComplete', cfg.beforeComplete);
						if(cfg.onComplete) n.editor.bind('onComplete', cfg.onComplete);
						if(cfg.onCancel) n.editor.bind('onCancel', cfg.onCancel);
					}	
					
				}
			});
		}
		,doFocus : function(bindEl){
			if($.browser.mozilla){
			$.defer(function(){
				this.focus.focus();
			}, 1, this);
			}else{
				this.focus.focus();
			}
		}
		,addTitle : function(el, text){
			el.attr('title', text);
		}
		,addHeaderEvent : function(){
			var t = this;
			//header mouse hover event
			this.headerTd.filter(':has(.sort-icon)').mouseover(function(){
				$(this).addClass('grid-header-sort-on');
			}).mouseout(function(){
				$(this).removeClass('grid-header-sort-on');
			}).click(function(e){
				//排序
				var target = $(this);
				if(target.hasClass('sort-asc')){
					t.paras.dir = 'DESC';
					target.removeClass('sort-asc').addClass('sort-desc');
				}else{	
					t.paras.dir = 'ASC';
					target.removeClass('sort-desc').addClass('sort-asc');
				}
				t.headerTd.not(this).removeClass('sort-asc sort-desc');
				t.paras.sort = t.getDataIndex(this);
				t.loadData();
			});
		}
		,getDataIndex : function(td){
			return td.className.split(' ')[0].split('-')[2];
		}
		/**
		加载url数据
		@param {Function} 过滤数据的函数
		*/
		,loadData : function(dataFilter){
			var t = this;
			if(this.url){
				$.ajax({
					dataType : 'json'
					,type : 'POST'
					,url : this.url
					,data : this.paras
					,cache : this.cache
					,timeout : this.timeout || 60000//默认超时60秒
					,contentType: "application/x-www-form-urlencoded; charset=UTF-8"
					,success : function(data){
						t.data = data;
						if(dataFilter){
							dataFilter.call(t);
						}	
						t.renderData();
					}
				});
			}else{
				t.setDataFromCacheByPageNumber();
				if(dataFilter){
					dataFilter.call(t);
				}
				t.renderData();
			}
		}
		//从缓存中读数据，并根据分页数设置数据
		,setDataFromCacheByPageNumber : function(){
			if(this.pageSize){
				var fd = (this.getPageNumber() - 1) * this.pageSize;
				var d = this.cacheData.result.slice(fd, fd + this.pageSize);
				this.setData({totalCount:this.cacheData.totalCount, result:d});
			}
		}
		/**
		刷新并插入新的数据到第一行
		@param {Array} 插入的数据数组
		@param {Function} 过滤数据的函数
		*/
		,reloadInsertBefore : function(records, filter){
			this.loadInit(function(){
				this.insertDataBefore(records, filter);
			});
		}
		/**
		插入新的数据到第一行
		@param {Array} 插入的数据数组
		@param {Function} 过滤数据的函数
		*/
		,insertRecordsBefore : function(records, filter){
			this.insertDataBefore(records, filter);
			this.renderData();
		}
		/**
		插入新的数据到data的最前面
		@param {Array} 插入的数据数组
		@param {Function} 过滤数据的函数
		*/
		,insertDataBefore : function(records, filter){
			if(typeof records === 'string'){
				records = eval('(' + records + ')');
			}
			if(records.totalCount){//data
				records = records.result;
			}else if(!records.length){//不是数组
				var na = [];
				na.push(records);
				records = na;
			}
			this.filterData(records, filter);
			//添加新记录到第一行
			for(var i=0; i < records.length; i ++){
				this.data.result.unshift(records[i]);
			}
			if(this.pageSize){
				//超过分页数就减少多余的行
				if(this.data.result.length > this.pageSize){
					this.data.result = this.data.result.slice(0, this.pageSize);
				}
			}
		}
		//过滤记录
		,filterData : function(records, filter){
			if(!filter){
				filter = function(data, record){
					if(data.id == record.id){
						return true;
					}
				};	
			}
			var filterRecords = [];	
			//过滤记录
			for(var i=0; i < records.length; i ++){
				for(var j=0, len = this.data.result.length; j < len; j ++){
					if(filter.call(this, this.data.result[j], records[i])){
						filterRecords.push(this.data.result[j]);
					}
				}
			}
			//删除过滤记录
			//$.debug('filterRecords.length = '+ filterRecords.length);
			for(var i = 0; i < filterRecords.length; i ++){
				var index = jQuery.inArray(filterRecords[i], this.data.result);
				this.data.result.splice(index, 1);
			}
		}
		/**
		修改选中的记录为参数中的记录
		@param {Array} 修改的记录
		*/
		,modifySelectedRecords : function(records){
			var rows = this.getSelectedRow();
			for(var i = 0, len = records.length; i < len ; i ++){
				var row = rows.eq(i);
				var cells = row.find('th,td');
				var index = this.findRowIndex(row);
				for(var j = 0, lenj = this.cm.length; j < lenj ; j ++){
					if(this.cm[j].checkbox)
						continue;
					//更新data为新的数据	
					this.data.result[index] =  records[i];
					//显示新的数据	
					var text = records[i][this.cm[j].dataIndex];
					var metadata = {};
					metadata.css = 'grid-cm-' +  this.cm[j].dataIndex;						
					if(this.cm[j].renderer){
						text = this.cm[j].renderer(text, records[i], index, j, metadata);
					}
					if(!records[i] || text == null || text== undefined || (typeof text == "string" && text.length < 1) )
						text = '';
					var inner = cells.eq(j).children('.grid-body-inner-span');
					inner.html(text);
					this.addTitle(inner, text); 
				}
			}
		}
		//render the body depend on data
		,renderData : function(){
			this.triggerHandler('beforeRender', [this]);
			this.headerCb.attr('checked', false);
			if(this.data && this.data.result){
				var rowArr = [];
				for(var i = 0 ; i < this.data.result.length ; i ++){
					rowArr = rowArr.concat(this.rowBuilder.buildRow(i, this.data.result[i]));
				}
				this.mainBody.empty().append(rowArr.join(''));
				this.sm.initEvent();
				if(this.data.result.length < 1){
					this.showEmptyText();
					if($.uiwidget.isIE){
						this.mainBody.hide();
					}
				}else{
					this.hideEmptyText();
					if($.uiwidget.isIE){
						this.mainBody.show();
					}
				}
			}
			if(this.pageSize){
				this.pageToolbar.updateToolbar();
			}
			this.sync();			
			this.triggerHandler('afterRender', [this]);
		}
		
		//同步高度与宽度
		,sync : function(){			
			if($.uiwidget.isIE){//解决ie6没有横向滚动条
				this.mainBodyWrap.width(this.grid.width());
				this.mainHeadWrap.width(this.grid.width());
			}
			if(this.viewConfig && this.viewConfig.horizontalScroll){
				
				var mainBodyTb = this.mainBody.find('.grid-main');
				var mainHeadTb = this.mainHeadWrap.find('.grid-main');
				var mainHeadScr = this.mainHeadWrap.find('.grid-mainhead-scroller');

				mainBodyTb.width(this.getTotalColumnWidth());
				this.mainBody.width(this.getTotalColumnWidth());				
				mainHeadTb.width(this.getTotalColumnWidth());

				//if(this.isOverHeight()){					
					if(!$.uiwidget.isIE6){							
						mainHeadScr.width(this.getTotalColumnWidth() + this.scrollOffsetWidth);
					}
					//$.debug('over');
				//}else{
					//$.debug('not over');
					//mainHeadScr.width(this.getTotalColumnWidth());
					//this.mainBodyWrap.css('overflow-y','hidden');
				//}
			}else if(this.isOverHeight()){
				$.defer(function(){
					var mainHeadTb = this.mainHeadWrap.find('.grid-main');
					mainHeadTb.width(this.mainHeadWrap.width() - this.scrollOffsetWidth);
					//if($.uiwidget.isIE){
					this.mainBody.width(this.mainBodyWrap.width() - this.scrollOffsetWidth);
					//}
				}, 1, this);
				this.mainHeadWrap.addClass('grid-mainhead-wrap-scrollOffset');
				//this.mainBody.addClass('grid-mainbody-scrollOffset');
			}else if(this.mainHeadWrap.hasClass('grid-mainhead-wrap-scrollOffset')){
				this.mainHeadWrap.find('.grid-main').width(this.mainBodyWrap.width());
				this.mainBody.width(this.mainBodyWrap.width());
				this.mainHeadWrap.removeClass('grid-mainhead-wrap-scrollOffset');
				//this.mainBody.removeClass('grid-mainbody-scrollOffset');
			}
			
		}
		
		,isOverHeight : function(){
			return this.mainBody.height() > this.mainBodyWrap.height();
		}
		
		,isOverWidth : function(){
			return this.mainBody.find('.grid-main').width() > this.mainBodyWrap.width();
		}
		
		,getTotalColumnWidth : function() {
			if (!this.totalColumnWidth) {
				this.totalColumnWidth = 0;
				for (var i = 0, len = this.cm.length; i < len; i++) {
					if ( !this.cm[i].hidden) {
						this.totalColumnWidth += this.getColumnWidth(i);
					}
				}
			}
			//$.debug(this.totalColumnWidth);
			return this.totalColumnWidth;
		}

		,getColumnWidth : function(col) {
			var width = this.cm[col].width;
			//console.debug(this.cm[col]);
			if(width){
				if(typeof width == 'string'){
					var i = width.indexOf('px');
					width = Number(width.substring(0, i));
				}
			}else{
				var checkbox = this.cm[col].checkbox;
				if(checkbox){
					width = 29;
				}else{
					width = 0;
				}
			}
			//console.debug(width);
			return width;
		}
		
		,showEmptyText : function(){
			this.mainBody.after(this.emptyText || (this.emptyText = $('<div class="grid-empty-text">'+ this.emptyMsg +  '</div>')));
			this.emptyText.show();
		}
		
		,hideEmptyText : function(){
			if(this.emptyText) this.emptyText.hide();
		}
		
		,updateHeaderCheckbox : function(){
			if(this.getSelections().length == this.data.result.length){
				this.headerCb.attr('checked', true);
			}else{
				this.headerCb.attr('checked', false);
			}
		}
			
		/**
		跳转到目标页
		@param {Object} toPage 页码
		*/
		,goPage : function(toPage){
			if(toPage){
				this.pageNumber = toPage;
				this.paras.start = (toPage - 1) * this.pageSize;
			}else{
				this.pageNumber = 0;	
			}
			this.loadData();	
		}
		/**
		页码
		*/
		,getPageNumber : function(){
			return this.pageNumber || (this.pageNumber = 1);
		}
		/**
		分页数
		*/
		,getPageSize : function(){
			return this.pageSize;
		}
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : function(){
			return this.sm.getSelections();
		}
		/**
		取得选择的行的序号
		*/
		,getSelectedRowIndex : function(){
			return this.sm.getSelectedRowIndex();
		}
		/**
		是否已有选择的记录
		*/
		,hasSelected : function(){
			return this.sm.hasSelected();
		}
		/**
		取得数据
		*/		
		,getData : function(){
			return this.data;
		}
		/**
		设置数据
		*/
		,setData : function(data){
			this.data = data;
		}
		/**
		取得数据result
		*/
		,getResult : function(){
			return this.getData().result;
		}
		/**
		重新读取远程数据
		*/
		,reload : function(){
			this.loadData();
		}
		/**
		读取数据
		*/
		,load : function(){
			this.loadData();
		}
		/**
		 按照初始参数重新读取数据
		*/
		,loadInit : function(filter){
			this.initParas();
			this.loadData(filter);
			//清空排序按钮
			this.headerTd.removeClass('sort-asc sort-desc');
		}
		/**
		增加右键菜单项
		@param {Object} cfg菜单项配置参数
		*/
		,addContextMenuItem : function(cfg){
			return this.getContextMenu().addMenuItem(cfg);
		}
		/**
		查询方法
		@param {Object} queryParams查询参数
		*/
		,query : function(queryParams){
			$.extend(this.paras, {start:0, limit:this.pageSize});
			$.extend(this.paras, queryParams);
			this.loadData();
		}
		/**
		查询方法,同query
		*/
		,search : this.query
		/**
		设置分页大小
		*/
		,setPageSize : function(size){
			this.paras.limit = size;
			this.pageSize = size;
		}
		/**
		取得选择的行,返回jQuery对象
		*/
		,getSelectedRow : function(){
			return this.sm.getSelectedRow();
		}
		/**
		取得选择模型
		*/
		,getSelectionModel : function(){
			return this.sm;
		}
		//导航
		/**
		* 移动到首行
		*/
		,moveTop : function(el){
			var thisIndex = this.findRowIndex(el);
			if(thisIndex == 0) return;
			
			var first = this.getFirstRow();
			var firstIndex = 0;
			var firstData = this.data.result[firstIndex];
			
			var thisData = this.data.result.splice(thisIndex, 1)[0];
			
			this.data.result.splice(firstIndex, 0, thisData);
			first.before(el);
		}
		/**
		* 移动到上一行
		*/
		,moveUp : function(el){
			var thisIndex = this.findRowIndex(el);
			if(thisIndex == 0) return;
			
			var prev = this.findPrevRow(el);
			var prevIndex = thisIndex - 1;
			var prevData = this.data.result[prevIndex];
			
			var thisData = this.data.result.splice(thisIndex, 1)[0];
			
			this.data.result.splice(prevIndex, 0, thisData);
			prev.before(el);
		}
		/**
		* 移动到下一行
		*/
		,moveDown : function(el){
			var thisIndex = this.findRowIndex(el);
			if(thisIndex == (this.data.result.length - 1)) return;
			
			var next = this.findNextRow(el);
			var nextIndex = thisIndex + 1;
			var nextData = this.data.result[nextIndex];
			
			var thisData = this.data.result.splice(thisIndex, 1)[0];
			
			this.data.result.splice(nextIndex, 0, thisData);
			
			next.after(el);
		}
		/**
		* 移动到末行
		*/
		,moveBottom : function(el){
			var thisIndex = this.findRowIndex(el);
			if(thisIndex == (this.data.result.length - 1)) return;
			
			var last = this.getLastRow();
			var lastIndex = this.data.result.length - 1;
			var lastData = this.data.result[lastIndex];
			
			var thisData = this.data.result.splice(thisIndex, 1)[0];
			
			this.data.result.splice(lastIndex, 0, thisData);
			
			last.after(el);
		}
		/**
		* 增加一行
		* @return 添加的行数据
		*/
		,appendRow : function(data){
			this.hideEmptyText();
			if(data.length){
				for(var i = 0; i < data.length; i++){
					var rowEl = $(this.rowBuilder.buildRow(this.data.result.length + i, data[i]).join(''));
					this.mainBody.append(rowEl);
					this.sm.addRowEvent(rowEl);
				}
			}else{
				var rowEl = $(this.rowBuilder.buildRow(this.data.result.length + i, data[i]).join(''));
				this.mainBody.append(rowEl);
				this.sm.addRowEvent(rowEl);
			}
			this.data.result = $.merge(this.data.result, data);
			this.sync();
		}
		/**
		 * 覆盖行，包括行的数据和显示的内容
		 * @param rowIndex{Integer} 行号
		 * @param record{JsonObject} 数据json对象
		 */
		,replaceRow : function(rowIndex, record){
			var row = this.getRow(rowIndex);
			var cells = row.find('th,td');
			this.data.result[rowIndex] = $.extend(this.data.result[rowIndex], record);
			
			var rowTable = $(this.rowBuilder.buildRow(rowIndex, this.data.result[rowIndex]).join('')).children();
			row.empty();
			row.append(rowTable);
		}
		/**
		* 删除一行
		* @return {jQuery}删除的行
		*/
		,removeRow : function(rowEl){
			var t = this;
			rowEl.each(function(i){
				var r = $(this);
				t.data.result.splice(t.findRowIndex(r), 1);
				r.remove();
			});
			if(this.data.result.length < 1){
				this.headerCb.attr('checked', false);
				this.showEmptyText();
			}
			this.sync();
		}
		/**
		* 找到行元素的行序号
		*/
		,findRowIndex : function(el){
			return this.mainBody.children('.grid-row').index(el.nodeType ? el : el[0]);
		}
		/**
		 * 找到单元格的列序号
		 */
		,findCellIndex : function(el){
			return $(el).parent('tr').find('th,td').index(el.nodeType ? el : el[0]);
		}
		/**
		 * 取得所有行,返回jQuery对象
		 */
		,getAllRow : function(){
			return this.mainBody.children('.grid-row');
		}
		/**
		取得行,返回jQuery对象
		*/
		,getRow : function(index){
			return this.mainBody.children('.grid-row:eq(' + index + ')');
		}
		/**
		取得列,返回jQuery对象
		*/
		,getCell : function(rowIndex, collIndex){
			return this.getRow(rowIndex).find('th,td').eq(collIndex);
		}
		/**
		 * 从父节点中找出行
		 */
		,findParentRow : function(el){
			return el.parents('.grid-row');
		}
		/**
		 * 从父节点中找出格的td
		 */
		,findParentCell : function(el){
			if(el.is('[class*=grid-row-td]')){
				return el;
			}else{
				return el.parents('[class*=grid-row-td]');
			}
		}

		,getFirstRow : function(){
			return this.mainBody.find('.grid-row:first');
		}
		,getLastRow : function(){
			return this.mainBody.find('.grid-row:last');
		}
		,findPrevRow : function(el){
			return el.prev('.grid-row');
		}
		,findNextRow : function(el){
			return el.next('.grid-row');
		}		
		/*
		绑定事件
		*/
		,bind : function(arg0, arg1, arg2){
			arg0 = arg0.toLowerCase();
			if(typeof arg1 == 'object')
				return this.grid.bind(arg0, arg1, arg2);
			else 
				return this.grid.bind(arg0, arg1);
		}
		,trigger : function( event, data){
			return this.grid.trigger(event, data);
		}
		,triggerHandler : function(type, data, srcEvent){
			type = type.toLowerCase();
			if(srcEvent){
				if( this.grid[0] ){
					var event = srcEvent;
					event.type = type;
					//触发事件时实际的元素
					event.triggerTarget = event.target;
					
					event.stopPropagation();
					$.event.trigger( event, data, this.grid[0], false);
					return event.result;
				}
			}else{
				return this.grid.triggerHandler(type, data);
			}		
		}
		,getHeight : function(){
			return this.height;
		}
		,setHeight : function(h){
			this.mainBodyWrap.height((this.height = h));
		}
		,getLineHeight : function(){
			return this.lineHeight || (this.lineHeight = this.mainBody.children('tr').height()) || this.defaultLineHeight;
		}
		
		,scrollTo : function(pos){
			this.mainBodyWrap.scrollTop(pos);
		}

	    // private
	    ,getScrollPos : function(){
	        return this.mainBodyWrap.scrollTop();
	    }

	    // private
	    ,getScrollArea : function(){
	        return this.mainBodyWrap.height();
	    }
	    
	    ,scrollToRow : function(rowIndex){
	        var el = this.getRow(rowIndex);
	        var pos = this.getScrollPos(), area = this.getScrollArea();
	        var top = el.position().top - this.mainHeadWrap.height() + pos ;
	        var bottom = top + el.height();
	        if(top < pos){
	            this.scrollTo(top);
	        }else if(bottom > (pos + area)){
	            this.scrollTo(bottom - area);
	        }
	    }
	};
	
	/**
	行选择模型
	*/
	$.uiwidget.RowSelectionModel = function(cfg){
		$.extend(this, cfg);
	};
	$.uiwidget.RowSelectionModel.prototype = {
		initEvent : function(){
			var grid = this.grid;
			var t = this;
			grid.getAllRow().each(function(){
				t.addRowEvent($(this));
			});
			if(!this.isBinding){
				this.isBinding = true;
				//已不使用带on的事件，兼容旧方法
				if(grid.onRowClick){
					grid.bind('rowClick', grid.onRowClick);
				}
				if(grid.onRowDblclick){
					grid.bind('rowDblclick', grid.onRowDblclick);
				}
				if(grid.rowContextMenu){
					grid.bind('rowContextMenu', grid.rowContextMenu);
				}
				//header checkbox event
				grid.headerCb.click(function(){
					if($(this).attr('checked')){
						t.select(grid.getAllRow());
					}else{
						t.deselect(grid.getAllRow());
					}
					grid.triggerHandler('headerCheckboxClick', [grid]);	
				});
			}
		}
		,addRowEvent : function(rowEl){
			var sm = this;
			var grid = this.grid;
			rowEl.click(function(e){
				e.stopPropagation();
				if(grid.triggerHandler('beforeRowClick', [grid, rowEl], e) === false){
					return;
				}
				if(e.ctrlKey && grid.cm[0].checkbox){//ctrl+click
					sm.toggle(rowEl);
				}else if(e.shiftKey && grid.cm[0].checkbox){//shift+click
					var thisIdx = grid.findRowIndex(rowEl);
					var lastIdx = grid.lastSelection? grid.findRowIndex(grid.lastSelection) : thisIdx;
					sm.selectRange(thisIdx, lastIdx);
				}else{//click
					sm.handlerClickRow(rowEl);
				}
				//header checkbox synchronize
				grid.updateHeaderCheckbox();
				grid.triggerHandler('rowClick', [grid, rowEl]);	
			});
			rowEl.find(':checkbox.grid-body-checkbox').each(function(){
				sm.addRowCheckboxEvent(grid, $(this));
			});
			//mouse roll over event
			rowEl.mouseover(function(e){
				rowEl.addClass('grid-row-over');
				grid.triggerHandler('rowMouseOver', [grid, rowEl]);	
			});
			rowEl.mouseout(function(e){
				rowEl.removeClass('grid-row-over');
				grid.triggerHandler('rowMouseOut', [grid, rowEl]);	
			});
			//double click
			rowEl.dblclick(function(e){
				grid.triggerHandler('rowDblclick', [grid, rowEl]);
			});
			//right click
			rowEl.bind('contextmenu', function(e){
				e.preventDefault();
				grid.triggerHandler('rowContextMenu', [grid, rowEl], e);
				var contextMenu = grid.getContextMenu();
				var contextMenuSingle = grid.getContextMenuSingle();
				var contextMenuMulti = grid.getContextMenuMulti();
				
				//多选行变更选择
				if(sm.getSelections().length < 2 || !rowEl.hasClass('grid-row-selected')){//mutiple selection
					sm.handlerClickRow(rowEl);
				}
				
				if(sm.getSelections().length == 1){
					//没有单选菜单项,不显示
					if(contextMenuSingle && contextMenuSingle.size() > 0){
						sm.applyContextRow(contextMenuSingle, rowEl);
						contextMenuSingle.showAt(e.pageX, e.pageY);
					}else{
						//没有菜单项,不显示
						if(contextMenu && contextMenu.size() > 0){
							sm.applyContextRow(contextMenu, rowEl);
							contextMenu.showAt(e.pageX, e.pageY);
						}	
					}
				}else if(sm.getSelections().length > 1){
					//没有多选菜单项,不显示
					if(contextMenuMulti && contextMenuMulti.size() > 0){
						sm.applyContextRow(contextMenuMulti, rowEl);
						contextMenuMulti.showAt(e.pageX, e.pageY);
					}else{
						//没有菜单项,不显示
						if(contextMenu && contextMenu.size() > 0){
							sm.applyContextRow(contextMenu, rowEl);
							contextMenu.showAt(e.pageX, e.pageY);
						}	
					}	
				}
				
			});
		}
		,applyContextRow : function(menu, rowEl){
			menu.contextRowEl = rowEl;
			menu.contextSelection = this.grid.getResult()[this.grid.findRowIndex(rowEl)];
		}
		,addRowCheckboxEvent : function(grid, cbEl){
			cbEl.click(function(e){
				e.stopPropagation();
				var rowEl = grid.findParentRow(cbEl);
				if(grid.triggerHandler('beforeRowClick', [grid, rowEl], e) === false){
					return;
				}
				rowEl.toggleClass('grid-row-selected');
				if(grid.getSelections().length == grid.data.result.length){
					//全选行
					grid.headerCb.attr('checked', true);
				}else{
					grid.headerCb.attr('checked', false);
				}
				grid.triggerHandler('rowClick', [grid, rowEl]);	
			});
		}
		,select : function(rowEl){
			rowEl.addClass('grid-row-selected')
				.find(':checkbox.grid-body-checkbox').attr('checked', true);
			this.grid.lastSelection = rowEl;
		}
		,deselect : function(rowEl){
			rowEl.removeClass('grid-row-selected')
				.find(':checkbox.grid-body-checkbox').attr('checked', false);
		}
		/**
		 * 全选
		 */
		,selectAll : function(){
			this.grid.headerCb.attr('checked', true);
			this.select(this.grid.getAllRow());
		}
		,handlerClickRow : function(rowEl){
			this.deselect(this.getSelectedRow());
			this.select(rowEl);
		}
		,selectRange : function(startIdx, endIdx){
			var tr = this.grid.getAllRow();
			if((startIdx - endIdx) > 0){
				this.select(tr.slice(endIdx, startIdx + 1));
			}else
				this.select(tr.slice(startIdx, endIdx + 1));
		}
		,toggle : function(rowEl){
			var tdCheck = rowEl.toggleClass('grid-row-selected').find(':checkbox.grid-body-checkbox');
			if(tdCheck.attr('checked')) 
				tdCheck.attr('checked', false); 
			else 
				tdCheck.attr('checked', true);
		}
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : function(){
			var grid = this.grid;
			var result = [];
			this.grid.mainBody.children('.grid-row-selected').each(function(i, v){
				result.push(grid.data.result[grid.findRowIndex(v)]);
			});
			return result;
		}
		/**
		取得选择的行的序号
		*/
		,getSelectedRowIndex : function(){
			var selectedRow = this.grid.mainBody.children('.grid-row-selected');
			return selectedRow.length > 0 ? this.grid.findRowIndex(selectedRow) : null;
		}
		/**
		是否已有选择的记录
		*/
		,hasSelected : function(){
			return this.grid.mainBody.children('.grid-row-selected').length > 0;
		}
		/**
		取得选择的行,返回jQuery对象
		*/
		,getSelectedRow : function(){
			return this.grid.mainBody.children('.grid-row-selected');
		}
	};
	/**
	表格选择模型,只能选择格，没有checkbox
	*/
	$.uiwidget.CellSelectionModel = function(cfg){
		$.extend(this, cfg);
	};
	$.uiwidget.CellSelectionModel.prototype = {
		initEvent : function(rowEl){
			var grid = this.grid;
			var t = this;
			grid.mainBody.find('td').each(function(){
				t.addCellEvent(grid, $(this));
			});
			if(!this.isBinding){//避免重复绑定
				this.isBinding = true;
				if(grid.onCellDblclick)
					grid.bind('cellDblclick', grid.onCellDblclick);
				if(grid.onCellClick){
					grid.bind('cellClick', grid.onCellClick);
				}
				grid.mainBodyWrap.keydown(function(e){//keypress
					t.handlerKeyDown(e);
				});
			}	
			/**
			editor
			*/
			var cm = grid.cm;
			for(var i = 0; i < cm.length ; i++){
				if(cm[i].editor){
					grid.mainBody.find('.grid-cell-' + cm[i].dataIndex + ' .grid-body-inner-span').bind('click', {index : i}, function(e){
						var alt = $(this).attr('title');
						cm[e.data.index].editor.startEdit(this, alt);
					});
				}
			}
		}
		,addRowEvent : function(rowEl){
			var grid = this.grid;
			var t = this;
			rowEl.find('td').each(function(){
				t.addCellEvent(grid, $(this));
			});
		}
		,addCellEvent : function(t, cellEl){
			var sm = this;
			var grid = this.grid;
			cellEl.click(function(e){
				e.stopPropagation();
				if(grid.triggerHandler('beforeCellClick', [grid, cellEl]) === false){
					return;
				}
				if(e.metaKey){//ctrl+click
					sm.toggle(cellEl);
				}else{//click
					sm.handlerClickCell(cellEl);
				}
				grid.triggerHandler('cellClick', [grid, cellEl]);	
			});
			//double click
			cellEl.dblclick(function(e){
				grid.triggerHandler('cellDblclick', [grid, cellEl]);		
			});
			//right click
			cellEl.bind('contextmenu', function(e){
				e.preventDefault();
				var contextMenu = t.getContextMenu();
				var contextMenuSingle = t.getContextMenuSingle();
				var contextMenuMulti = t.getContextMenuMulti();
				//多选格变更选择
				if(sm.getSelections().length < 2 || !cellEl.hasClass('grid-cell-selected')){//mutiple selection
					sm.handlerClickCell(cellEl);
				}
				if(sm.getSelections().length == 1){
					//没有单选菜单项,不显示
					if(contextMenuSingle && contextMenuSingle.size() > 0){
						sm.applyContextCell(contextMenuSingle, cellEl);
						contextMenuSingle.showAt(e.pageX, e.pageY);
					}else{
						//没有菜单项,不显示
						if(contextMenu && contextMenu.size() > 0){
							sm.applyContextCell(contextMenu, cellEl);
							contextMenu.showAt(e.pageX, e.pageY);
						}	
					}
				}else if(sm.getSelections().length > 1){
					//没有多选菜单项,不显示
					if(contextMenuMulti && contextMenuMulti.size() > 0){
						sm.applyContextCell(contextMenuMulti, cellEl);
						contextMenuMulti.showAt(e.pageX, e.pageY);
					}else{
						//没有菜单项,不显示
						if(contextMenu && contextMenu.size() > 0){
							sm.applyContextCell(contextMenu, cellEl);
							contextMenu.showAt(e.pageX, e.pageY);
						}
					}	
				}
			});
		}
		,applyContextCell : function(menu, cellEl){
			menu.contextCellEl = cellEl;
			var colIndex = this.grid.findCellIndex(cellEl);
			var rowIndex = this.grid.findRowIndex(this.grid.findParentRow(cellEl));
			var r = this.grid.getResult()[rowIndex];
			var cellSelection = {result : r
				, rowIndex : rowIndex
				, colIndex : colIndex
				, value : r[this.grid.cm[colIndex].dataIndex]};
			menu.contextSelection = cellSelection;
		}
		,select : function(cellEl){
			if(this.grid.triggerHandler('beforeCellSelect', [this.grid, cellEl]) === false){
				return;
			}
			cellEl.addClass('grid-cell-selected');
		}
		,deselect : function(cellEl){
			cellEl.removeClass('grid-cell-selected');
		}
		,handlerClickCell : function(cellEl){
			this.deselect(this.grid.mainBody.find('td'));
			this.select(cellEl);
		}
		,toggle : function(cellEl){
			cellEl.toggleClass('grid-cell-selected');
		}
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : function(){
			var grid = this.grid;
			var data = this.grid.data;
			var cm = this.grid.cm;
			var sels = [], colIndex, cellSelection, result, r, cmIdx;
			this.grid.mainBody.find('.grid-cell-selected').each(function(i, v){
				var cellEl = $(v);
				colIndex = grid.findCellIndex(cellEl);
				rowIndex = grid.findRowIndex(grid.findParentRow(cellEl));
				r = data.result[rowIndex];
				cellSelection = {result : r
					, rowIndex : rowIndex
					, colIndex : colIndex
					, value : r[cm[colIndex].dataIndex]};
				sels.push(cellSelection);
			});
			return sels;
		}
		,getCellSelections : function(){
			return this.getSelections();
		}
		/**
		是否已有选择的记录
		*/
		,hasSelected : function(){
			return this.grid.mainBody.find('.grid-cell-selected').length > 0;
		}
		/**
		取得选择的行,返回jQuery对象
		*/
		,getSelectedRow : function(){
			return this.grid.findParentRow(this.getSelectedCell());
		}
		/**
		取得选择的格,返回jQuery对象
		*/
		,getSelectedCell : function(){
			return this.grid.mainBody.find('.grid-cell-selected');
		}
		,handlerKeyDown : function(e){
			e.stopPropagation();
			e.preventDefault();
			var key = e.which;
			var s = this.getCellSelections()[0];
			if(!s) return;
			var r = s.rowIndex, c = s.colIndex;
			if(key == 13){//enter
				if(this.startEditing){
					this.startEditing(r, c);
				}
			}else{
				c = this.grid.cm[0].checkbox ? c - 1 : c;	
				if(key == 9){//tab
					this.goCells(r, c + 1, 1);
				}else if(key == 37){//left
					this.goCells(r, c - 1, 1);
				}else if(key == 39){//right
					this.goCells(r, c + 1, 1);
				}else if(key == 38){//up
					this.goCells(r - 1, c, 1);
				}else if(key == 40){//down
					this.goCells(r + 1, c, 1);
				}
			}	
		}
		,goCells : function(r, c, step){
			r == -1 ? r = 0 : r = r;
			c == -1 ? c = 0 : c = c;
			var rowEl = this.grid.getRow(r);
			if(rowEl.length < 1){
				r--;
				rowEl = this.grid.getRow(r);
			}
			var colEl = rowEl.find('td').eq(c);
			if(colEl.length < 1){
				var nextRowEl = this.grid.findNextRow(rowEl);
				if(nextRowEl.length > 0){
					rowEl = nextRowEl;
				}
				colEl = rowEl.find('td').eq(0);
			}
			this.handlerClickCell(colEl);
			this.grid.scrollToRow(r);
		}
		/**
		取得选择的行的序号
		*/
		,getSelectedRowIndex : function(){
			var cellEl = this.grid.mainBody.find('.grid-cell-selected');
			return cellEl.length > 0 ? this.grid.findRowIndex(this.grid.findParentRow(cellEl)) : null;
		}
	};
	
	/**
	编辑表格选择模型
	*/
	$.uiwidget.EditCellSelectionModel = function(cfg){
		$.extend(this, cfg);
	};
	$.extend($.uiwidget.EditCellSelectionModel.prototype, {
		initEvent : function(rowEl){
			if(!this.isBinding){
				this.isBinding = true;
				var grid = this.grid;
				var t = this;
				grid.mainBodyWrap.keydown(function(e){//keypress
					t.handlerKeyDown(e);
				});
				grid.headerCb.click(function(){
					if($(this).attr('checked')){
						t.selectRow(grid.getAllRow());
					}else{
						t.deselectRow(grid.getAllRow());
					}
				});
				grid.mainBody.bind('click', {grid : grid, name:'click'}, this.processEvent);
				grid.mainBody.bind('contextmenu', {grid : grid, name:'contextmenu'}, this.processEvent);
				grid.mainBodyWrap.bind('scroll', {grid: grid, name:'scroll'}, this.processEvent);
				
				grid.bind('rowclick', function(e, grid, row){
					if(e.ctrlKey && grid.cm[0].checkbox){//ctrl+click
						t.toggleRow(row);
					}else if(e.shiftKey && grid.cm[0].checkbox){//shift+click
						var thisIdx = grid.findRowIndex(row);
						var lastIdx = grid.lastSelection? grid.findRowIndex(grid.lastSelection) : thisIdx;
						t.selectRowRange(thisIdx, lastIdx);
					}else{//click
						t.handlerClickRow(row);
					}
				});
				
				grid.bind('cellclick', function(e, grid, cell){
					t.handlerClickCell(cell);
					t.onAutoEditClick(e, cell);
				});
				
				grid.bind('rowcontextmenu', function(e, grid, row){
					t.onRowContextmenu(e, row);
				});
				
				grid.bind('cellcontextmenu', function(e, grid, row){
					t.onCellContextmenu(e, row);
				});
				
				grid.bind('checkboxclick', function(e, grid, row){
					t.onCheckboxClick(e, grid, row);
				});
				
				grid.bind('bodyscroll', function(e, grid){
					grid.getSelectionModel().stopEditing();
				});
			}
		}
		,processEvent : function(e){
			var target = $(e.target);
			var grid = e.data.grid;
			var name = e.data.name;
			
			if(name == 'scroll'){
				grid.triggerHandler('bodyscroll', [grid], e);
			}else{
				var row = grid.findParentRow(target);
				var rowIndex = grid.findRowIndex(row);
				var cell = grid.findParentCell(target);
				var colIndex = grid.findCellIndex(cell);
				
				if(target.is('.grid-body-checkbox') || target.is('.grid-body-checkbox-th')){
					grid.triggerHandler('checkbox' + name, [grid, row], e);
				}else{
					if(row)
						grid.triggerHandler('row' + name, [grid, row], e);
					if(cell)
						grid.triggerHandler('cell' + name, [grid, cell], e);
				}
			}
			grid.updateHeaderCheckbox();
		}
		,onAutoEditClick : function(e, cell){
			var grid = this.grid;
			var row = grid.findParentRow(cell);
			var rowIndex = grid.findRowIndex(row);
			var colIndex = grid.findCellIndex(cell);
			this.startEditing(rowIndex, colIndex);
		}
		,startEditing : function(rowIndex, colIndex){
			this.stopEditing();
			var grid = this.grid;
			if(!grid.cm[colIndex] || !grid.cm[colIndex].editor)
				return;
			// 处理 safari, ie 和 opera的问题
			$.defer(function(){
				this.activateEditor = grid.cm[colIndex].editor;
				var cellEl = grid.getCell(rowIndex, colIndex);
				var editEl = cellEl.find('.grid-body-inner-span');
				var colName = grid.getDataIndex(cellEl[0]);
				grid.cm[colIndex].editor.startEdit(editEl, 
						grid.data.result[rowIndex][colName] || '',
						{left:-grid.cellBorder, top:-grid.cellBorder});
			}, 50, this);
		}
		,stopEditing : function(){
			if(this.activateEditor){
				this.activateEditor.completeEdit();
				this.activateEditor = null;
			}
		}
		,onRowContextmenu : function(e, rowEl){
			e.preventDefault();
			var contextMenu = grid.getContextMenu();
			var contextMenuSingle = grid.getContextMenuSingle();
			var contextMenuMulti = grid.getContextMenuMulti();
			
			var sm = this;
			//多选行变更选择
			if(sm.getSelections().length < 2 || !rowEl.hasClass('grid-row-selected')){//mutiple selection
				sm.handlerClickRow(rowEl);
			}
			
			if(sm.getSelections().length == 1){
				//没有单选菜单项,不显示
				if(contextMenuSingle && contextMenuSingle.size() > 0){
					sm.applyContextRow(contextMenuSingle, rowEl);
					contextMenuSingle.showAt(e.pageX, e.pageY);
				}else{
					//没有菜单项,不显示
					if(contextMenu && contextMenu.size() > 0){
						sm.applyContextRow(contextMenu, rowEl);
						contextMenu.showAt(e.pageX, e.pageY);
					}	
				}
			}else if(sm.getSelections().length > 1){
				//没有多选菜单项,不显示
				if(contextMenuMulti && contextMenuMulti.size() > 0){
					sm.applyContextRow(contextMenuMulti, rowEl);
					contextMenuMulti.showAt(e.pageX, e.pageY);
				}else{
					//没有菜单项,不显示
					if(contextMenu && contextMenu.size() > 0){
						sm.applyContextRow(contextMenu, rowEl);
						contextMenu.showAt(e.pageX, e.pageY);
					}	
				}	
			}
			
		}
		,onCellContextmenu : function(e, cell){
			this.handlerClickCell(cell);
		}
		//deprecated
		,addRowEvent : function(rowEl){
		}
		,applyContextRow : function(menu, rowEl){
			menu.contextRowEl = rowEl;
			menu.contextSelection = this.grid.getResult()[this.grid.findRowIndex(rowEl)];
		}
		,onCheckboxClick : function(e, grid, row){
			e.stopPropagation();
			if(row.hasClass('grid-row-selected')){
				grid.sm.deselectRow(row);
			}else{
				grid.sm.selectRow(row);
			}
		}
		,selectRow : function(rowEl){
			rowEl.addClass('grid-row-selected')
				.find(':checkbox.grid-body-checkbox').attr('checked', true);
			this.grid.lastSelection = rowEl;
		}
		,deselectRow : function(rowEl){
			rowEl.removeClass('grid-row-selected')
				.find(':checkbox.grid-body-checkbox').attr('checked', false);
		}
		,toggleRow : function(rowEl){
			var tdCheck = rowEl.toggleClass('grid-row-selected').find(':checkbox.grid-body-checkbox');
			if(tdCheck.attr('checked')) 
				tdCheck.attr('checked', false); 
			else 
				tdCheck.attr('checked', true);
		}
		,selectRowRange : function(startIdx, endIdx){
			var tr = this.grid.getAllRow();
			if((startIdx - endIdx) > 0)
				this.selectRow(tr.slice(endIdx, startIdx + 1));
			else
				this.selectRow(tr.slice(startIdx, endIdx + 1));
		}
		,handlerClickRow : function(rowEl){
			this.selectRow(rowEl);
			this.deselectRow(rowEl.siblings());
		}
		,select : function(cellEl){
			cellEl.addClass('grid-cell-selected');
		}
		,deselect : function(cellEl){
			cellEl.removeClass('grid-cell-selected');
		}
		,handlerClickCell : function(cellEl){
			this.deselect(this.grid.mainBody.find('td'));
			this.select(cellEl);
		}
		,selectCell : function(rowIndex, collIndex ){
			this.handlerClickCell(this.grid.getCell(rowIndex, collIndex));
		} 
		/**
		取得选择的行,返回jQuery对象
		*/
		,getSelectedRow : function(){
			return this.grid.mainBody.find('.grid-row-selected');
		}
		/**
		取得选择的格,返回jQuery对象
		*/
		,getSelectedCell : function(){
			return this.grid.mainBody.find('.grid-cell-selected');
		}	
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : $.uiwidget.RowSelectionModel.prototype.getSelections
		,getCellSelections : $.uiwidget.CellSelectionModel.prototype.getSelections
		,handlerKeyDown : $.uiwidget.CellSelectionModel.prototype.handlerKeyDown
		,_goCells : $.uiwidget.CellSelectionModel.prototype.goCells
		,goCells : function(r, c, step){
			this._goCells(r, c, step);
			var rowEl = this.grid.getRow(r);
			this.handlerClickRow(rowEl);
		}
		/**
		取得选择的行的序号
		*/
		,getSelectedRowIndex : function(){
			var selectedRow = this.grid.mainBody.children('.grid-row-selected');
			return selectedRow.length > 0 ? this.grid.findRowIndex(selectedRow) : null;
		}
	});
	
	/**
	不能选择行的模型
	*/
	$.uiwidget.NoSelectionModel = function(cfg){
		$.extend(this, cfg);
	};
	$.uiwidget.NoSelectionModel.prototype = {
		initEvent : function(){
			var grid = this.grid;
			var t = this;
			grid.getAllRow().each(function(){
				t.addRowEvent($(this));
			});
		}
		,addRowEvent : function(rowEl){
			var grid = this.grid;
			rowEl.mouseover(function(e){
				rowEl.addClass('grid-row-over');
				grid.triggerHandler('rowMouseOver', [grid, rowEl]);	
			});
			rowEl.mouseout(function(e){
				rowEl.removeClass('grid-row-over');
				grid.triggerHandler('rowMouseOut', [grid, rowEl]);	
			});
			rowEl.click(function(e){
				grid.triggerHandler('rowClick', [grid, rowEl]);	
			});
		}
		,getSelections: function(){
			return null;
		}
		,getSelectedRowIndex: function(){
			return null;
		}
		,hasSelected: function(){
			return false;
		}
		,getSelectedRow: function(){
			return null;
		}
	};
	
	/**
	统计栏
	 */
	$.uiwidget.SummaryBar = function(grid){
		this.grid = grid;
		this.render();
	};
	$.uiwidget.SummaryBar.prototype = {
		render : function(){
			var t = this;
			this.grid.bind('afterRender', function(e, grid){
				t.removeSummaryBar();
				t.renderSummaryBar();
				if(grid.viewConfig && grid.viewConfig.horizontalScroll){
					t.summaryBar.wrapInner('<div class="grid-summary-bar-scroller"></div>');
					var width = grid.mainBody.find('.grid-main').width();
					if(width){
						t.summaryBar.find('.grid-main').width(width);
					}
				}
			});
		}
		,renderSummaryBar : function(){
			this.summaryBar = $(['<div class="grid-summary-bar"><table class="grid-main" ',
				'cellspacing="0" cellpadding="0"><tbody></tbody>',
				'</table></div>'].join(''));
			var t = this;
			var grid = this.grid;
			grid.mainWrap.after(this.summaryBar);
			var btd = [];
			var summary = {};
			$.each(grid.cm, function(j, m){
				if(!m.checkbox && m.summaryConfig){
					if(m.summaryConfig.html){
						summary[m.dataIndex] = m.summaryConfig.html;
					}
					if(m.summaryConfig.calculation){
						for(var i = 0 ; i < grid.getResult().length ; i++){
							if(typeof m.summaryConfig.calculation == 'string'){
								summary[m.dataIndex] = $.uiwidget.Calculations[m.summaryConfig.calculation].call(grid,
									summary[m.dataIndex], m.dataIndex, i, grid.getResult()[i]) || 0;
							}else if(typeof m.summaryConfig.calculation == 'function'){
								summary[m.dataIndex] = m.summaryConfig.calculation.call(grid,
									summary[m.dataIndex], m.dataIndex, i, grid.getResult()[i]) || 0;
							}
						}
					}
				}
			});
			btd.push('<tr>');
				$.each(grid.cm, function(j, m){
					if(m.checkbox){
						btd.push('<th unselectable="on"></th>');
					}else{
						var text = summary[m.dataIndex]; 
						if(typeof text == 'number'){
							if(m.precision != undefined){
								text = summary[m.dataIndex].toFixed(m.precision);
							}else{
								text = summary[m.dataIndex].toFixed($.uiwidget.Calculations.defPrecision);
							}
						}
						btd.push('<td class="grid-summary-bar-', m.dataIndex, '" hidefocus="true" width="', m.width,'" tabindex="1">');
						if(/<.*>/.exec(text)){//如果用html tag就不使用title
							btd.push('<span unselectable="on" class="grid-body-inner-span">');
						}else{
							btd.push('<span unselectable="on" class="grid-body-inner-span" title="', text, '">');
						}	
						if( text == null || text== undefined || (typeof text == "string" && text.length < 1) )
							btd.push('&#160;');
						else
							btd.push(text);
						btd.push('</span></td>');
					}
				});
			btd.push('</tr>');
			this.summaryBar.find('tbody').append(btd.join(''));
			grid.bind('bodyscroll', function(e, grid, scrollLeft){
				t.summaryBar.scrollLeft(scrollLeft);
			});
		}
		,removeSummaryBar : function(){
			if(this.summaryBar){
				this.summaryBar.remove();
			}
		}
		,update : function(){
			this.removeSummaryBar();
			this.renderSummaryBar();
		}
		,getValue : function(dataIndex){
			var sbSpan = this.summaryBar.find('.grid-summary-bar-' + dataIndex + ' .grid-body-inner-span');
			return sbSpan.attr('title');
		}
		,setValue : function(dataIndex, value){
			var sbSpan = this.summaryBar.find('.grid-summary-bar-' + dataIndex + ' .grid-body-inner-span');
			sbSpan.attr('title', value);
			sbSpan.html(value);
		}
	};
	
	/**
	 * PageToolbar分页栏
	 */
	$.uiwidget.PageToolbar = function(){
	};
	$.uiwidget.PageToolbar.prototype = {
		renderToolbar : function(){
			var tb = ['<div class="grid-bottom-toolbar" cellpadding="0" cellspacing="0">'];
            if(this.grid.pageSizeList){         
	            var psl = ['<div class="page-size-list"><span class="page-size-list-text">',
	            	this.grid.pageSizeListText,'</span><select class="page-size-list-select">'];
	            for(var i = 0; i < this.grid.pageSizeList.length; i ++){
	            	psl.push('<option value=', this.grid.pageSizeList[i], 
	            		this.grid.pageSize && (this.grid.pageSize == this.grid.pageSizeList[i]) ? ' selected' : '',
	            		'>', this.grid.pageSizeList[i],'</option>');
	            }
	            psl.push('</select></div>');  
	            tb = tb.concat(psl);        
            }
            tb = tb.concat(['<div class="display-text">', this.getDisplayText(0,0,0), '</div>',
                      '<div class="page-navigator"><table border="0" cellspacing="0" cellpadding="0">'
                            ,'<tr align="center">'
                            ,'<td width="18"><input type="button" class="page-first" title="', this.grid.firstText,'"/></td>'
                            ,'  <td width="18"><input type="button" class="page-pre" title="', this.grid.prevText,'"/></td>'
                            ,'  <td width="18"><input type="button" class="page-next" title="', this.grid.nextText,'"/></td>'
                            ,'  <td width="18"><input type="button" class="page-last" title="', this.grid.lastText, '"/></td>'
                            ,'  <td width="10"  class="page-seperator">|</td>'
                            ,'  <td width="48">', this.grid.pageNumberText, '</td>'
                            ,'	<td width="20"><input class="page-number" type="text" value="1"/></td>'
                            ,'  <td width="10">/</td>'
                            ,'  <td width="15"><span class="total-page-size">1</span></td>'
                            ,' 	<td width="50">', this.getJumperButtonHtml(),'</td>'
                            ,'</tr>'
                       ,' </table></div>'
                   ,'</div>']);
            this.toolbar = $(tb.join(''));       
            this.grid.container.append(this.toolbar);
            	 	 
            var t = this;
            this.getPageNextEl().click(function(){
            	var pageNum = parseInt(t.getPageNumberEl().val());
            	if(pageNum < parseInt(t.getTotalPageSizeEl().html())){
            		t.grid.goPage(pageNum + 1);
            	}
            });
            this.getPagePreEl().click(function(){
            	var pageNum = parseInt(t.getPageNumberEl().val());
            	if(pageNum > 1){
            		t.grid.goPage(--pageNum);
            	}
            });
            this.getPageFirstEl().click(function(){
            	var pageNum = parseInt(t.getPageNumberEl().val());
            	if(pageNum > 1){
            		pageNum = 1;
            		t.grid.goPage(1);
            	}
            });
            this.getPageLastEl().click(function(){
            	var pageNum = parseInt(t.getPageNumberEl().val());
            	var totalPage = parseInt(t.getTotalPageSizeEl().html());
            	if(pageNum < totalPage){
            		pageNum = totalPage;
            		t.grid.goPage(totalPage);
            	}
            });
			this.addJumperButtonEvent();
			
			this.getPageNumberEl().keydown(function(e){
				e.stopPropagation();
				if(e.which == 13){//enter
					t.handlerPageNumberEvent($(this));
				}
			}).focus(function(e){
				$(this).select();
			});
			//选择分页数
			this.getPageSizeSelectEl().change(function(e){
				t.grid.setPageSize(this.value);
				t.grid.goPage(1);
			});
			
			this.addPageElHoverEvent(this.getPageFirstEl(), 'first');
			this.addPageElHoverEvent(this.getPagePreEl(), 'pre');
			this.addPageElHoverEvent(this.getPageNextEl(), 'next');
			this.addPageElHoverEvent(this.getPageLastEl(), 'last');
		}
		/**
		 * 创建跳转按钮的html
		 */
		,getJumperButtonHtml : function(){
			return ['<div class="grid-btn-order"><ul><li class="left-normal"></li><li class="middle-normal">'
			        , this.grid.jumperText
			        , '</li><li class="right-normal"></li></ul></div>'].join('');
		}
		/**
		 * 跳转按钮事件
		 */
		,addJumperButtonEvent : function(){
			var t = this;
			this.toolbar.find('li.middle-normal').hover(function(){
				$(this).prev().addClass('left-over');
				$(this).addClass('middle-over');
				$(this).next().addClass('right-over');
			}, function(){
				$(this).prev().removeClass('left-over');
				$(this).removeClass('middle-over');
				$(this).next().removeClass('right-over');
			}).click(function(){
				t.handlerPageNumberEvent(t.getPageNumberEl());
			});
		}	
		/**
		更新工具栏
		*/
		,updateToolbar : function(){
			var pageSize = this.grid.pageSize;
			var totalCount = this.grid.data.totalCount || this.grid.data.result.length;
			var recordStart = this.grid.paras.start;
			var recordEnd = recordStart + this.grid.data.result.length;
			var pageNum = recordStart / pageSize + 1;
			var totalPageSize = parseInt((totalCount==0 ? totalCount : totalCount-1) / pageSize) + 1;
			if(this.grid.data.result.length > 0){
				var displayText = this.getDisplayText(recordStart+1, recordEnd, totalCount);
			}else{
				var displayText = this.grid.emptyMsg;
			}
			this.getPageNumberEl().val(pageNum);	 	 
			this.setDisplayText(displayText);	 
			this.getTotalPageSizeEl().html(totalPageSize);
			if(pageNum == 1){
				this.getPageFirstEl().addClass('page-first-disabled');
				this.getPagePreEl().addClass('page-pre-disabled');
			}else{
				this.getPageFirstEl().removeClass('page-first-disabled');
				this.getPagePreEl().removeClass('page-pre-disabled');
			}
			if(pageNum == totalPageSize){
				this.getPageNextEl().addClass('page-next-disabled');
				this.getPageLastEl().addClass('page-last-disabled');
			}else{
				this.getPageNextEl().removeClass('page-next-disabled');
				this.getPageLastEl().removeClass('page-last-disabled');
			}
		}
      	
      	//格式化
      	,format : function(format){
        	var args = Array.prototype.slice.call(arguments, 1);
        	if(!format) throw "format is null";
        	return format.replace(/\{(\d+)\}/g, function(m, i){
        	    return args[i];
        	});
		}
      	,setDisplayText : function(displayText){
      		this.getDisplayTextEl().html(displayText);
      	}
		,getDisplayText : function(start, end, totalCount){
			return this.format(this.grid.displayMsg, '<span class="record-start">'+ start +'</span>',
				 '<span class="record-end">'+ end +'</span>', 
				 '<span class="record-amount">' + totalCount + '</span>');
        }
		,addPageElHoverEvent : function(el, cls){
			el.hover(
				function(){	
					if(!el.hasClass('page-'+cls+'-disabled')) 
						el.addClass('page-'+cls+'-over');
				}
				,function(){
					el.removeClass('page-'+cls+'-over');
				}
			);
		}
		,getPageNumberEl : function(){
			return this.pageNumberEl || (this.pageNumberEl = this.toolbar.find(':input.page-number'));
		}
		,getDisplayTextEl : function(){
			return this.displayTextEl || (this.displayTextEl = this.toolbar.find('.display-text'));	
		}
		,getTotalPageSizeEl : function(){
			return this.totalPageSizeEl || (this.totalPageSizeEl = this.toolbar.find('.total-page-size'));
		}
		,getPageFirstEl : function(){
			return this.pageFirstEl || (this.pageFirstEl = this.toolbar.find('.page-first'));
		}	
		,getPagePreEl : function(){
			return this.pagePreEl || (this.pagePreEl = this.toolbar.find('.page-pre'));
		}
		,getPageNextEl : function(){	
			return this.pageNextEl || (this.pageNextEl = this.toolbar.find('.page-next'));
		}	
		,getPageLastEl : function(){
			return this.pageLastEl || (this.pageLastEl = this.toolbar.find('.page-last'));
		}
		,getPageSizeSelectEl : function(){
			return this.pageSizeSelectEl || (this.pageSizeSelectEl = this.toolbar.find('.page-size-list-select'));
		}	
		,handlerPageNumberEvent : function(pnEl){
			var pageNum = parseInt(pnEl[0].value);
			if(isNaN(pageNum)) return;
			var totalPage = parseInt(this.getTotalPageSizeEl().html());
			if(pageNum > totalPage){
				this.grid.goPage(totalPage);
				pnEl.val(totalPage);
			}else if(pageNum <= 0){
	           	this.grid.goPage(1);
	           	pnEl.val(1);
	        }else{
	           	this.grid.goPage(pageNum);
	        }
		}
	};
	
	/**
	 * ComplexPageToolbar 
	 * 
	 * complex page toolbar look like this : [1][2][3][4][5]
	 */
	$.uiwidget.ComplexPageToolbar = function(){
	};
	$.uiwidget.ComplexPageToolbar.prototype = {
		displayMsg     : "共{0}条，显示{1}-{2}条"
		,jumperMsg 		: "跳页"
		,prevText       : "&lt;&lt;"
		,nextText       : "&gt;&gt;"
		,pageSizeListText:"，显示条数："
		,renderToolbar : function(){
			var tb = ['<div class="grid-bottom-ctoolbar"><ul><li class="display-text">共<span class="bold">0</span>条，显示<span class="bold">0</span>-<span class="bold">0</span>条</li>'];
			
			if(this.grid.pageSizeList){         
	            var psl = ['<li class="page-size-list">', this.pageSizeListText, '<select class="page-size-list-select">'];
	            for(var i = 0; i < this.grid.pageSizeList.length; i ++){
	            	psl.push('<option value=', this.grid.pageSizeList[i], 
	            		this.grid.pageSize && (this.grid.pageSize == this.grid.pageSizeList[i]) ? ' selected' : '',
	            		'>', this.grid.pageSizeList[i],'</option>');
	            }
	            psl.push('</select></li>');  
	            tb = tb.concat(psl);        
            }
			
			tb = tb.concat(
    		['<li class="display-line">&#160;</li><li class="nav">',
                '<li><input type="text" class="page-number" value="', this.jumperMsg, '" /></li>',
		     '</div>'   
			]);
            this.toolbar = $(tb.join(''));       
            this.grid.container.append(this.toolbar);
            var grid = this.grid;
            var t = this;
            this.getNavEl().bind('click', {toolbar : this}, function(e){
            	var target = $(e.target);
    			var toolbar = e.data.toolbar;
    			var targetText = target.html();
    			if(target.children('.first-ellipsis').length > 0 || target.is('.first-ellipsis')){					
    				pageNum = 1;
    			}else if(target.children('.last-ellipsis').length > 0 || target.is('.last-ellipsis')){
    				pageNum = toolbar.totalPageSize;
    			}else if(targetText == toolbar.nextText){
    				pageNum = toolbar.pageNum + 1;
    			}else if(targetText == toolbar.prevText){
    				pageNum = toolbar.pageNum - 1;
    			}else{
    				pageNum = Number(target.html());
    			}
    			grid.triggerHandler('toolbarPagenumClick', [grid, target, pageNum], e);
            });
            this.getPageNumberEl().focus(function(e){
            	if($(this).val() == t.jumperMsg)
            		$(this).val('');
            }).blur(function(){
            	if($(this).val() == '')
            		$(this).val(t.jumperMsg);
            	
            }).keydown(function(e){
				e.stopPropagation();
				if(e.which == 13){//enter
					t.handlerPageNumberEvent($(this));
				}
			});
			//选择分页数
			this.getPageSizeSelectEl().change(function(e){
				t.grid.setPageSize(this.value);
				t.grid.goPage(1);
			});
            grid.bind('toolbarPagenumClick', function(e, grid, target, pageNum){
            	grid.goPage(pageNum);
            });
		}
		/**
		更新工具栏
		*/
		,updateToolbar : function(){
			var pageSize = this.grid.pageSize;
			var totalCount = this.grid.data.totalCount || this.grid.data.result.length;
			var recordStart = this.grid.paras.start;
			var recordEnd = recordStart + this.grid.data.result.length;
			this.pageNum = recordStart / pageSize + 1;
			this.totalPageSize = parseInt((totalCount==0 ? totalCount : totalCount-1) / pageSize) + 1;
			if(this.grid.data.result.length > 0){
				var displayText = this.getDisplayText(recordStart+1, recordEnd, totalCount);
			}else{
				var displayText = this.grid.emptyMsg;
			}
			this.setDisplayText(displayText);	 
			this.updatePageNav();
		}
		
		,updatePageNav : function(){
			var nav = [];
			if(this.totalPageSize == 1){
				this.getPageNumberEl().hide();
				this.getDisplayLineEl().hide();
				this.getNavEl().empty();
				return;
			}
			if(this.totalPageSize <= 5){
				if(this.pageNum != 1)
					nav = this.renderPrevPage(nav);
				for(var i = 0 ;i < this.totalPageSize; i++){
					if(this.pageNum == (i + 1)){
						nav = this.renderCurrent(i + 1, nav);
					}else{
						nav = this.renderPage(i + 1, nav);
					}
				}
				if(this.pageNum != this.totalPageSize)
					nav = this.renderNextPage(nav);
			}else{
				if(this.pageNum == 1){
					from = 1;to=5;
				}else if ((this.totalPageSize - this.pageNum) > 3){
					from = this.pageNum - 1;to = this.pageNum + 3;
				}else{
					to = this.totalPageSize; from = to - 4;
				}
				
				if(from != 1){
					nav = this.renderFirstPage(nav);
				}
				if(this.pageNum != 1)
					nav = this.renderPrevPage(nav);
				
				for(var i = from ;i < to + 1; i++){
					if(this.pageNum == i){
						nav = this.renderCurrent(this.pageNum, nav);
					}else{
						nav = this.renderPage(i, nav);
					}
				}
				if(this.pageNum != this.totalPageSize){
					nav = this.renderNextPage(nav);
				}
				if(to != this.totalPageSize)
					nav = this.renderLastPage(this.totalPageSize, nav);
			}
			this.getPageNumberEl().show();
			this.getDisplayLineEl().show();
			this.getNavEl().empty().append(nav.join(''));
		}
		
		,renderCurrent : function(text, arr){
			arr = arr.concat(['<span class="current">', text, '</span>']);
			return arr;
		}
		
		,renderPage : function(text, arr){
			arr = arr.concat(['<a href="javascript:void(0)" class="page" hidefocus="true">', text, '</a>']);
			return arr;
		}
		
		,renderPrevPage : function(arr){
			return this.renderPage(this.prevText, arr);
		}
		
		,renderNextPage : function(arr){
			return this.renderPage(this.nextText, arr);
		}
		
		,renderFirstPage : function(arr){
			arr = arr.concat(['<a href="javascript:void(0)" class="page" hidefocus="true">', 1, '<span class="ellipsis first-ellipsis">...</span></a>']);
			return arr;
		}
		
		,renderLastPage : function(text, arr){
			arr = arr.concat(['<a href="javascript:void(0)" class="page" hidefocus="true"><span class="ellipsis last-ellipsis">...</span>', text, '</a>']);
			return arr;
		}
		
      	//格式化
      	,format : function(format){
        	var args = Array.prototype.slice.call(arguments, 1);
        	if(!format) throw "format is null";
        	return format.replace(/\{(\d+)\}/g, function(m, i){
        	    return args[i];
        	});
		}
      	,setDisplayText : function(displayText){
      		this.getDisplayTextEl().html(displayText);
      	}
		,getDisplayText : function(start, end, totalCount){
			return this.format(this.displayMsg, 
				'<span class="bold">' + totalCount + '</span>',
				'<span class="bold">'+ start +'</span>',
				'<span class="bold">'+ end +'</span>');
        }
		,handlerPageNumberEvent : function(pnEl){
			var pageNum = parseInt(pnEl[0].value);
			if(isNaN(pageNum)) return;
			if(pageNum > this.totalPageSize){
				this.grid.goPage(this.totalPageSize);
				pnEl.val(this.totalPageSize);
			}else if(pageNum <= 0){
	           	this.grid.goPage(1);
	           	pnEl.val(1);
	        }else{
	           	this.grid.goPage(pageNum);
	        }
		}
		
		,getPageNumberEl : function(){
			return this.pageNumberEl || (this.pageNumberEl = this.toolbar.find(':input.page-number'));
		}
		,getDisplayTextEl : function(){
			return this.displayTextEl || (this.displayTextEl = this.toolbar.find('.display-text'));	
		}
		,getNavEl :  function(){
			return this.navEl || (this.navEl = this.toolbar.find('.nav'));	
		}
		,getPageSizeSelectEl : function(){
			return this.pageSizeSelectEl || (this.pageSizeSelectEl = this.toolbar.find('.page-size-list-select'));
		}	
		,getDisplayLineEl : function(){
			return this.displayLineEl || (this.displayLineEl = this.toolbar.find('.display-line'));
		}
	};
	
	/**
	统计计算法则
	*/
	$.uiwidget.Calculations = {
		/**
		 * 默认计算精度
		 */	
		defPrecision : 2	
		,sum : function(value, dataIndex, rowIndex, data){
			var v = Number(data[dataIndex]);
			if(!isNaN(v)){
				return v + (value||0);
			}
		}
		,max : function(value, dataIndex, rowIndex, data){
			var v = Number(data[dataIndex]);
			if(!isNaN(v)){
				return  (value||0) < v ? v : (value||0);
			}
		}
		,min : function(value, dataIndex, rowIndex, data){
			var v = Number(data[dataIndex]);
			if(!isNaN(v)){
				return  (value||v) < v ? (value||v) : v ;
			}
		}
		,count : function(value, dataIndex, rowIndex, data){
			return  (value||0)+1 ;
		}
		,average : function(value, dataIndex, rowIndex, data){
			var v = Number(data[dataIndex]);
			if(!isNaN(v)){
				return ((value||0) * rowIndex + v) / (rowIndex+1);
			}
		}
	};
	//用于浮点数精确运算
	$.extend({
		//加
		accAdd : function(arg1,arg2){ 
		    var r1,r2,m; 
		    try{r1=arg1.toString().split(".")[1].length;}catch(e){r1=0;}; 
		    try{r2=arg2.toString().split(".")[1].length;}catch(e){r2=0;};
		    return (parseInt(arg1*m) + parseInt(arg2*m))/m; 
		}
		//减
		,accMin : function(arg1,arg2){ 
		    var r1,r2,m; 
		    try{r1=arg1.toString().split(".")[1].length;}catch(e){r1=0;}; 
		    try{r2=arg2.toString().split(".")[1].length;}catch(e){r2=0;}; 
		    m=Math.pow(10,Math.max(r1,r2)); 
		    return (parseInt(arg1*m) - parseInt(arg2*m))/m;
		}
		//乘
		,accMul : function(arg1,arg2){ 
		    var m=0,s1=arg1.toString(),s2=arg2.toString(); 
		    try{m+=s1.split(".")[1].length;}catch(e){}; 
		    try{m+=s2.split(".")[1].length;}catch(e){}; 
		    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m); 
		}
		//除
		,accDiv : function(arg1,arg2){ 
		    var t1=0,t2=0,r1,r2; 
		    try{t1=arg1.toString().split(".")[1].length;}catch(e){};
		    try{t2=arg2.toString().split(".")[1].length;}catch(e){}; 
		    r1=Number(arg1.toString().replace(".","")); 
		    r2=Number(arg2.toString().replace(".","")); 
		    return $.accMul((r1/r2), Math.pow(10,t2-t1)); 
		}   
	});
	/**
	行序号
	*/
	$.uiwidget.RowNumberer = {
		header: "&#160;"
		,sortable : false
		,dataIndex: 'gridRowNumberer'
		,width:'25px'
		,renderer : function(value, data, rowIndex, colIndex, metadata){
           	return rowIndex+1;
        }
	};
	/**
	分页行序号
	*/
	$.uiwidget.PageRowNumberer = {
		header: "&#160;"
		,sortable : false
		,dataIndex: 'gridPageRowNumberer'
		,width:'25px'
		,renderer : function(value, data, rowIndex, colIndex, metadata, grid){
           	return (grid.getPageNumber() - 1) * grid.getPageSize() + rowIndex + 1;
        }
	};
	/**
	使用列表组件
	*/
	$.fn.grid = function(cfg){
		return new $.uiwidget.Grid(this, cfg);
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
    
    
	$.uiwidget.GridRowBuilder = $.uiwidget.Class.create({
		buildRow : function(rowIndex, result){
			var btd = [];
			btd.push('<div class="grid-row"><table class="grid-main" cellspacing="0" cellpadding="0"><tbody><tr>');
			for(var i = 0 ; i < this.grid.cm.length ; i ++){
				var m = this.grid.cm[i];
				if(m.checkbox){
					btd.push('<th class="grid-body-checkbox-th">',result?'<input type="checkbox" class="grid-body-checkbox" value=""/>':'','</th>');
				}else{
					var text = result[m.dataIndex];
					if(typeof text == 'number'&& m.precision){
						text = result[m.dataIndex].toFixed(m.precision);
					}
					var metadata = {};
					metadata.css = ['grid-cm-' ,  m.dataIndex, ' grid-cell-', m.dataIndex].join('');						
					if(m.renderer){
						text = m.renderer(text, result, rowIndex, i, metadata, this.grid);
					}
					btd.push('<td hidefocus="true" style="width:', m.width,'" class="', metadata.css, ' grid-row-td" title="', metadata.title, '" tabindex="-1">');
					if(/<.*>/.exec(text)){//如果用html tag就不使用title
						btd.push('<span class="grid-body-inner-span">');
					}else{
						var title = null;
						if(!result || text == null || text== undefined || (typeof text == "string" && text.length < 1) ){
							title = "";
						}else{
							if(typeof text == 'string')
								title = text.replace(/\"/g, "&quot;");
							else
								title = text;
						}	
						btd.push('<span unselectable="on" class="grid-body-inner-span" title="', title, '">');
					}	
					btd.push(text);
					btd.push('</span></td>');
				}
			}
			btd.push('</tr></tbody></table></div>');
			return btd;
		}
	});
	
	
})(jQuery);	