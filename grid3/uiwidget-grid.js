/**
* Grid组件
*
* @author Vincent (zhongyongsheng@300.cn)
* @date 2010-05-12
* @version 3.0.0-BETA1
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
	
	$.uiwidget.BLANK_IMAGE_URL = ($.uiwidget.isIE6 || $.uiwidget.isIE7) ?  'images/s2.gif' : 'data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';   
	
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
		,height : 375
		/**
		列设置
		*/
		,cm : []
		/**
		列表的json数据
		*/
		,data: {"totalCount" : 0, "result" : []}       
		/**
		数据样例：
		data : {"totalCount":2, "result":[{id:"1", name : "张三", remark : "备注" , date:"2009-02-21"},{id:"2", name : "李四", remark : "备注2"}]}
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

		,checkboxWidth : 27				
		
		//初始化
		,init : function(){
			this.initParas();
			var t = this;
			$.each(['beforeRender', 'afterRender', 'headerCheckboxClick'], function(i, name){
				if(t[name]) t.bind(name, t[name]);
			});
			this.cacheData = this.data;
			this.sm = this.sm || new $.uiwidget.RowSelectionModel();
			this.sm.grid = this;
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
				'<div class="grid-mainhead-wrap"><div class="grid-mainhead-scroller">',
				'<table class="grid-hd-table" cellspacing="0" cellpadding="0">',
				'<tbody></tbody></table></div></div>',
				'<div class="grid-mainbody-wrap"  style="height:', this.height,'px;">', 
				'<div class="grid-mainbody grid-mainbody-scroller"></div>',
				'</div></div></div>'].join(''));
			this.grid.append(this.container);
			this.mainWrap = this.container.children('.grid-main-wrap');
			this.mainHeadWrap = this.mainWrap.children('.grid-mainhead-wrap');
			this.mainHeadTable = this.mainHeadWrap.find('.grid-hd-table');
			this.mainBodyWrap =  this.mainWrap.children('.grid-mainbody-wrap');
			this.mainBody = this.mainBodyWrap.find('.grid-mainbody');			
			
			this.fitAutoSize();
			
			if(this.displayHeader){
				if(this.customHeader)
					this.renderCustomHeader();
				else	
					this.renderHeader();
				this.headerTd = this.mainHeadTable.find('td');
				this.headerCb = this.mainHeadTable.find('.grid-header-checkbox');
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
			//mainBody滚动带动mainHead滚动
			this.mainBodyWrap.bind('scroll', function(e){
				var target = $(this);
				var sl = target.scrollLeft();
				var st = target.scrollTop();
				t.mainHeadWrap.scrollLeft(sl);
				t.triggerHandler('bodyscroll',[t, sl, st]);
			});	
			
			this.sm.initEvent();			
			if(this.autoLoad) this.loadData();
			this.mainHeadTable.width(this.getTotalColumnWidth());
			this.mainBody.width(this.getTotalColumnWidth());			
			this.triggerHandler('rendered', [this]);	
		}

		/**
		自动计算宽度
		*/
		,fitAutoSize : function(){
			this.grid.width(this.grid.width());//将grid宽度改为固定px
			for(var i = 0; i < this.cm.length ; i++){
				if(this.cm[i].width && (typeof this.cm[i].width) == 'string' && this.cm[i].width.indexOf('%') != -1){//将列宽度改为固定px
					var index = this.cm[i].width.indexOf('%');
					var width = Number(this.cm[i].width.substring(0, index));
					var actualWidth = parseInt(this.getInnerWidth() * width / 100);
					this.cm[i].width = String(actualWidth + 'px');
				}else if(this.cm[i].checkbox){//设置checkbox宽度
					this.cm[i].width = String(this.checkboxWidth + 'px');
				}else if(!this.cm[i].width){//没有宽度，则为自动宽度					
					var autosize = i;	
				}
			}
			//存在一个没有设置宽度的列时，设置余下宽度给它，如果超过一个没有设置，会显示异常
			if(autosize != undefined){
				var r = this.getInnerWidth();
					for(var j = 0; j < this.cm.length ; j++){
						if(this.cm[j].width)
							r = r - this.cm[j].width.substring(0, this.cm[j].width.length - 2);
					}
					this.cm[autosize].width = String(r - 2 + 'px');
			}
		}

		/**
		列表宽度
		*/
		,getTotalWidth : function(){
			return this.container.width();
		}

		/**
		列表宽度减去滚动条宽度
		*/
		,getInnerWidth : function(){
			return this.getTotalWidth() - this.scrollOffsetWidth;
		}
		
		,buildHeadRow : function(cm, isCustom){
			var headRow = [];
			for(var i = 0; i < cm.length ; i++){
				var n = cm[i];
				if(n.checkbox){
					headRow.push('<td ', n.row?' rowspan='+n.row:'', n.col?' colspan='+n.col:''
					, n.hidden?' style="display:none"':''
					, isCustom ? '' : (' style="width:' + n.width + '"')
					, ' class="grid-hd-chk"><div class="grid-inner"><span><input type="checkbox" class="grid-header-checkbox"></span>');
				}else{
					headRow.push('<td ', n.row ? ' rowspan=' + n.row : '', n.col ? ' colspan=' + n.col : ''
					, n.hidden ? ' style="display:none"' : ''
					, isCustom ? '' : (' style="width:' + n.width + '"')
					, ' class="grid-cm-', n.dataIndex,' grid-header-', n.dataIndex, '">');
					if(i == 0){ 
						headRow.push('<div class="grid-inner"');
					}else{
						headRow.push('<div class="grid-inner"');
					}
					if(n.width && !isCustom){
						if(typeof n.width == 'string'){
							var index = n.width.indexOf('px');
							var w = Number(n.width.substring(0, index)) - 8;
							headRow.push(' style="width:', w, 'px;"');
						}else{
							headRow.push(' style="width:', n.width , '"');
						}
					}
					
					headRow.push(' title="', n.title == undefined ? n.header : n.title, '"');					
					headRow.push(' unselectable="on">', n.header);
					if(n.icon){
						headRow.push('<img class="grid-hd-icon" src="', n.icon,'"/>');
					}
				}
				headRow.push('<div class="grid-hd-tool">');
				if(n.sortable !== false && !n.checkbox){
					headRow.push('<span class="grid-hd-sort"></span>');
				}
				headRow.push('<span class="grid-hd-split"></span>');
				headRow.push('</div>');
				headRow.push('</div></td>');
			}
			return headRow;
		}
		
		/**
		自定义表头
		*/
		,renderCustomHeader : function(){
			var nth = [];
			var t = this;
			var nth = ['<tr class="grid-hd-row grid-hd-row-hidden">'];
			nth = nth.concat(this.buildHeadRow(this.cm));
			nth.push('</tr>');
			$.each(this.customHeader, function(index, customCm){
				nth.push('<tr class="grid-hd-row">');
				nth = nth.concat(t.buildHeadRow(customCm, true));
				nth.push('</tr>');
			});
			this.mainHeadWrap.find('tbody').append(nth.join(''));
		}
		
		,renderHeader : function(){
			var htd = ['<tr class="grid-hd-row">'];
			htd = htd.concat(this.buildHeadRow(this.cm));
			htd.push('</tr>');
			this.mainHeadWrap.find('tbody').append(htd.join(''));
		}
		
		,renderEditor : function(){
			var t = this;
			t.focus = $('<a class="grid-focus" tabindex="-1" href="#"/>');
			t.mainBodyWrap.append(t.focus);
			$.each(this.cm, function(i, n){
				if(n.editor ){
					if(typeof n.editor == 'string'){
						n.editor = {html:n.editor};
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
							t.doFocus();
							var trIdx = t.findRowIndex(t.findParentRow(bl));
							var dataIdx = t.getDataIndex(bl.parents('td')[0]);
							t.data.result[trIdx][dataIdx] = editor.getValue();
							t.addTitle(bl, editor.getValue()); 
							if(t.sm.activateEditor){
								t.sm.activateEditor = null;
							}
						});
						n.editor.bind('onCancel', function(e, editor){
							t.doFocus();
						});
						if(cfg.startEdit) n.editor.bind('startEdit', cfg.startEdit);
						if(cfg.beforeComplete) n.editor.bind('beforeComplete', cfg.beforeComplete);
						if(cfg.onComplete) n.editor.bind('onComplete', cfg.onComplete);
						if(cfg.onCancel) n.editor.bind('onCancel', cfg.onCancel);
					}	
					
				}
			});
		}
				
		,doFocus : function(){
			if($.browser.mozilla){
				$.defer(function(){
					this.focus.css('top', this.getScrollPos());
					this.focus.focus();
				}, 1, this);
			}else{
				this.focus.css('top', this.getScrollPos());
				this.focus.focus();
			}
		}
		
		,addTitle : function(el, text){
			el.attr('title', text);
		}
		
		//表头事件		 
		,addHeaderEvent : function(){
			this.mainHeadTable.delegate('td:has(.grid-hd-sort)','mouseover' ,{grid:this}, function(e){
				$(this).addClass('grid-hd-over');
				e.data.grid.triggerHandler('headerMouseover', [this]);	
			});
			this.mainHeadTable.delegate('td:has(.grid-hd-sort)','mouseout' ,{grid:this}, function(e){
				$(this).removeClass('grid-hd-over');
				e.data.grid.triggerHandler('headerMouseout', [this]);	
			});
			this.mainHeadTable.delegate('td:has(.grid-hd-sort)','click' ,{grid:this}, function(e){
				//排序
				var target = $(this).find('.grid-hd-sort');
				var grid = e.data.grid;
				if(target.hasClass('grid-hd-asc')){
					grid.paras.dir = 'DESC';
					if(grid.sortHeadTd)
						grid.sortHeadTd.removeClass('grid-hd-asc grid-hd-desc');
					target.addClass('grid-hd-desc');
				}else{	
					grid.paras.dir = 'ASC';
					if(grid.sortHeadTd)
						grid.sortHeadTd.removeClass('grid-hd-asc grid-hd-desc');
					target.addClass('grid-hd-asc');
				}
				
				grid.sortHeadTd = target;				
				grid.paras.sort = grid.getDataIndex(this);
				e.data.grid.triggerHandler('headerClick', [this]);	
				grid.loadData();
			});	
			this.mainHeadTable.delegate('.grid-header-checkbox','click' ,{grid:this}, function(e){
				var g = e.data.grid;
				g.triggerHandler('headerCheckboxClick', [g, $(this)]);	
			});
		}

		,getDataIndex : function(td){
			return td.className.split(' ')[1].split('-')[2];
		}

		/**
		加载url数据
		@param {Function} 过滤数据的函数
		*/
		,loadData : function(dataFilter){
			if(this.sm.selections)
				this.sm.selections.clear();
			this.updateHeaderCheckbox();
			if(this.url){
				var t = this;
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
				this.setDataFromCache();
				if(dataFilter){
					dataFilter.call(this);
				}
				this.renderData();
			}
		}
		
		//从缓存中读数据，并根据分页数设置数据
		,setDataFromCache : function(){
			if(this.pageSize && this.cacheData.result.length > this.pageSize){
				var firstData = (this.getPageNumber() - 1) * this.pageSize;
				var result = this.cacheData.result.slice(firstData, firstData + this.pageSize);
				this.setData({totalCount : this.cacheData.totalCount, result : result});
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
		
		//显示this.data数据
		,renderData : function(){
			this.triggerHandler('beforeRender', [this]);
			if(this.data && this.data.result){
				var rowArr = [];
				for(var i = 0 ; i < this.data.result.length ; i ++){
					rowArr = rowArr.concat(this.rowBuilder.buildRow(i, this.data.result[i]));
				}
				this.mainBody.empty().append(rowArr.join(''));
				// this.sm.initEvent();
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
			this.triggerHandler('afterRender', [this]);
		}
		
		
		
		,isOverHeight : function(){
			return this.mainBody.height() > this.mainBodyWrap.height();
		}
		
		,isOverWidth : function(){
			return this.mainBody.find('.grid-bd-table').width() > this.mainBodyWrap.width();
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
			return this.totalColumnWidth;
		}

		,getColumnWidth : function(col) {
			var width = this.cm[col].width;
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
			if(this.sm.selections && this.data.result.length != 0 && (this.sm.selections.getCount() == this.data.result.length)){
				if(this.headerCb)
					this.headerCb.attr('checked', true);
			}else{
				if(this.headerCb)
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
			this.headerTd.find('.grid-hd-sort').removeClass('grid-hd-asc grid-hd-desc');
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
		取得选择模型
		*/
		,getSelectionModel : function(){
			return this.sm;
		}
		
		//导航
		/**
		* 移动到首行
		*/
		,moveTop : function(index){
			var row = this.getRow(index);
			if(index == 0) return;
			var first = this.getFirstRow();
			var firstIndex = 0;
			var firstData = this.data.result[firstIndex];
			var thisData = this.data.result.splice(index, 1)[0];
			this.data.result.splice(firstIndex, 0, thisData);
			first.before(row);
		}
		
		/**
		* 移动到上一行
		*/
		,moveUp : function(index){
			var row = this.getRow(index);
			if(index == 0) return;
			var prev = this.findPrevRow(row);
			var prevIndex = index - 1;
			var prevData = this.data.result[prevIndex];
			var thisData = this.data.result.splice(index, 1)[0];
			this.data.result.splice(prevIndex, 0, thisData);
			prev.before(row);
		}
		
		/**
		* 移动到下一行
		*/
		,moveDown : function(index){
			var row = this.getRow(index);
			if(index == (this.data.result.length - 1)) return;
			var next = this.findNextRow(row);
			var nextIndex = index + 1;
			var nextData = this.data.result[nextIndex];
			var thisData = this.data.result.splice(index, 1)[0];
			this.data.result.splice(nextIndex, 0, thisData);
			next.after(row);
		}
		
		/**
		* 移动到末行
		*/
		,moveBottom : function(index){
			var row = this.getRow(index);
			if(index == (this.data.result.length - 1)) return;
			var last = this.getLastRow();
			var lastIndex = this.data.result.length - 1;
			var lastData = this.data.result[lastIndex];
			var thisData = this.data.result.splice(index, 1)[0];
			this.data.result.splice(lastIndex, 0, thisData);
			last.after(row);
		}
		
		/**
		* 增加一行
		* @return record{JsonObject}/{Array} 添加的行数据,可以为数据对象或者数据对象数组
		*/
		,appendRow : function(data){
			this.hideEmptyText();
			if(data.length){
				for(var i = 0; i < data.length; i++){
					var rowEl = $(this.rowBuilder.buildRow(this.data.result.length + i, data[i]).join(''));
					this.mainBody.append(rowEl);
				}
			}else{
				this.appendRow([].concat(data));
			}
			this.data.result = $.merge(this.data.result, data);
			if(this.pageSize)
				this.pageToolbar.updateToolbar();
		}
		
		/**
		 * 覆盖行，包括行的数据和显示的内容
		 * @param rowIndex{Integer} 行号
		 * @param record{JsonObject} 数据json对象
		 */
		,replaceRow : function(rowIndex, record){
			var row = this.getRow(rowIndex);
			this.data.result[rowIndex] = $.extend(this.data.result[rowIndex], record);
			
			var rowTable = $(this.rowBuilder.buildRow(rowIndex, this.data.result[rowIndex]).join('')).children();
			row.empty();
			row.append(rowTable);
			if(this.sm.isSelected(row)){
				this.sm.select(row, true)
			}else{
				this.sm.deselect(row, true)
			}
		}
		
		/**
		* 删除一行
		* @return 删除的行号
		*/
		,removeRow : function(index){
			var t = this;
			var row = this.getRow(index);
			this.sm.deselect(row, true);
			row.each(function(i){
				var r = $(this);
				t.data.result.splice(t.findRowIndex(r), 1);
				r.remove();
			});
			if(this.data.result.length < 1){
				this.showEmptyText();
			}
			if(this.pageSize)
				this.pageToolbar.updateToolbar();
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
			return $(el).parent('.grid-bd-row').find('td').index(el.nodeType ? el : el[0]);
		}
		
		/**
		 * 由row{JQuery Object}查询出对应的数据对象
		 * @return data{JSON}
		 */
		,findRowData : function(row){
			return this.data.result[this.findRowIndex(row)];
		}
		
		/**
		 * 由cell{JQuery Object}查询出对应的数据对象
		 * @return data{JSON} 包含data.result, data.rowIndex, data.colIndex , data.value
		 */
		,findCellData : function(cell){
			var g = this;
			var colIndex = g.findCellIndex(cell);
			var rowIndex = g.findRowIndex(g.findParentRow(cell));
			r = g.data.result[rowIndex];
			var data = {result : r
				, rowIndex : rowIndex
				, colIndex : colIndex
				, value : r[g.cm[colIndex].dataIndex]};
			return data;
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
			return this.getRow(rowIndex).find('td').eq(collIndex);
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
			// $.debug('scroll to = ' + pos)
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
	        var top = el.position().top;
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
			var g = this.grid;
			var t = this;	
			$.each(['beforeRowSelect'
				, 'rowSelect'
				, 'rowDblclick'
				, 'rowDeselect'
				, 'rowCheckboxClick'
				, 'rowmouseenter'
				, 'rowmouseleave'
				, 'rowContextMenu'], function(i, name){
				if(g[name]) g.bind(name, g[name]);
			})			
			this.addRowEvent();
			this.selections = new $.uiwidget.Collection();			
			g.bind('headerCheckboxClick', function(e, grid, checkbox){
				if($(checkbox).attr('checked')){
					t.selectAll();
				}else{
					t.deselectAll();
				}
			});
		}
		
		,addRowEvent : function(){
			var sm = this;
			var grid = this.grid;
			grid.mainBody.delegate(':checkbox.grid-body-checkbox', 'click', function(e){
				e.stopPropagation();
				var cbEl = $(this);
				var rowEl = grid.findParentRow(cbEl);
				if(!sm.isSelected(rowEl)){
					sm.select(rowEl, true);
				}else{
					sm.deselect(rowEl, true);
				}
				grid.triggerHandler('rowCheckboxClick', [grid, rowEl, cbEl]);	
			});
			
			grid.mainBody.delegate('.grid-row', 'click', function(e){
				e.stopPropagation();
				var rowEl = $(this);
				sm.select(rowEl);
			});
			
			
			grid.mainBody.delegate('.grid-row', 'mouseenter', function(e){
				var rowEl = $(this);
				rowEl.addClass('grid-row-over');
				grid.triggerHandler('rowmouseenter', [grid, rowEl]);	
			});
			
			grid.mainBody.delegate('.grid-row', 'mouseleave', function(e){
				var rowEl = $(this);
				rowEl.removeClass('grid-row-over');
				grid.triggerHandler('rowmouseleave', [grid, rowEl]);	
			});
			
			grid.mainBody.delegate('.grid-row', 'dblclick', function(e){
				var rowEl = $(this);
				grid.triggerHandler('rowDblclick', [grid, rowEl]);
			});
			
			grid.mainBody.delegate('.grid-row', 'contextmenu', function(e){
				e.preventDefault();
				var rowEl = $(this);
				grid.triggerHandler('rowContextMenu', [grid, rowEl], e);				
			});
			
			grid.mainBodyWrap.keydown(function(e){
				sm.handlerKeyDown(e);
			});
		}
		
		,selectRow : function(index, keepExisting, notUpdateCb){
			return this.select(this.grid.getRow(index), keepExisting, notUpdateCb);	
		}
		
		,deselectRow : function(index, keepExisting, notUpdateCb){
			return this.deselect(this.grid.getRow(index), keepExisting, notUpdateCb);	
		}
		
		,select : function(row, keepExisting, notUpdateCb){
			if(this.grid.triggerHandler('beforerowselect', [this.grid, row]) !== false){	
				if(!keepExisting){
					this.clearSelections();
				}
				row.addClass('grid-row-selected')
					.find(':checkbox.grid-body-checkbox').attr('checked', true);
				this.lastSelection = row;
				this.selections.add(row[0]);
				if(!notUpdateCb)
					this.grid.updateHeaderCheckbox();
				this.grid.triggerHandler('rowselect', [this.grid, row]);
			}	
		}
		
		,deselect : function(row, keepExisting, notUpdateCb){
			if(!keepExisting){
				this.clearSelections();
			}
			row.removeClass('grid-row-selected')
				.find(':checkbox.grid-body-checkbox').attr('checked', false);
			this.selections.remove(row[0]);
			if(!notUpdateCb)
				this.grid.updateHeaderCheckbox();
			this.grid.triggerHandler('rowdeselect', [this.grid, row]);	
		}
		
		,clearSelections : function(){
			this.selections.each(function(item){
				this.deselect($(item), true, true);
			}, this);
		}
		
		/**
		 * 全选
		 */
		,selectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.select($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,deselectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.deselect($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,isSelected : function(rowEl){
			return rowEl.hasClass('grid-row-selected');
		}
		
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : function(){
			var g = this.grid;
			var result = [];
			this.selections.each(function(){
				result.push(g.findRowData($(this)));
			});
			return result;
		}
		
		,getSelectedIndexs : function(){
			var g = this.grid;
			var result = [];
			this.selections.each(function(){
				result.push(g.findRowIndex($(this)));
			});
			return result;
		}
		/**
		是否已有选择的记录
		*/
		,hasSelection : function(){
			return this.selections.getCount() > 0;
		}
		
		,handlerKeyDown : function(e){
			e.stopPropagation();
			e.preventDefault();
			var key = e.which;			
			if(!this.lastSelection) return;
			var r = this.grid.findRowIndex(this.lastSelection);				
			if(key == 38){//up
				this.goRows(r - 1, 1);
			}else if(key == 40){//down
				this.goRows(r + 1, 1);
			}				
		}
		
		,goRows : function(r, step){
			if(r < 0 || r > this.grid.data.result.length - 1) return;
			var rowEl = this.grid.getRow(r);
			if(rowEl.length < 1){
				this.goRows(--r, 1);
				return;
			}			
			this.select(rowEl);
			this.grid.scrollToRow(r);
		}
	};
	
	/**
	表格选择模型,只能选择格，没有checkbox
	*/
	$.uiwidget.CellSelectionModel = function(cfg){
		$.extend(this, cfg);		
	};
	$.uiwidget.CellSelectionModel.prototype = {
		initEvent : function(){			
			var g = this.grid;
			var t = this;	
			$.each(['beforeCellSelect'
				, 'cellSelect'
				, 'cellDeselect'
				, 'cellDblclick'
				, 'cellContextMenu'
				], function(i, name){
				if(g[name]) g.bind(name, g[name]);
			})			
			this.addEvent();
			this.selections = new $.uiwidget.Collection();			
		}
		
		,addEvent : function(){
			var sm = this;
			var grid = this.grid;
			grid.mainBody.delegate('.grid-row-td', 'click', function(e){
				e.stopPropagation();
				var cell = $(this);
				sm.select(cell);
			});
			grid.mainBody.delegate('.grid-row-td', 'dblclick', function(e){
				var cell = $(this);
				grid.triggerHandler('cellDblclick', [grid, cell]);
			});
			grid.mainBody.delegate('.grid-row-td', 'contextmenu', function(e){
				e.preventDefault();
				var cell = $(this);
				grid.triggerHandler('cellContextMenu', [grid, cell], e);				
			});
			grid.mainBodyWrap.keydown(function(e){
				sm.handlerKeyDown(e);
			});
		}
		
		,selectCell : function(rowIndex, colIndex, keepExisting){
			return this.select(this.grid.getCell(rowIndex, colIndex), keepExisting);	
		}
		
		,deselectCell : function(rowIndex, colIndex, keepExisting){
			return this.deselect(this.grid.getCell(rowIndex, colIndex), keepExisting);	
		}
		
		,select : function(cell, keepExisting){
			if(this.grid.triggerHandler('beforecellselect', [this.grid, cell]) !== false){	
				if(!keepExisting){
					this.clearSelections();
				}
				cell.addClass('grid-cell-selected')	;
				this.lastSelection = cell;
				this.selections.add(cell[0]);
				this.grid.triggerHandler('cellselect', [this.grid, cell]);
			}	
		}
		
		,deselect : function(cell, keepExisting){
			if(!keepExisting){
				this.clearSelections();
			}
			cell.removeClass('grid-cell-selected');
				
			this.selections.remove(cell[0]);
			this.grid.triggerHandler('celldeselect', [this.grid, cell]);	
		}
		
		,clearSelections : function(){
			this.selections.each(function(item){
				this.deselect($(item), true, true);
			}, this);
		}
		
		,selectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.select($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,deselectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.deselect($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,isSelected : function(cell){
			return cell.hasClass('grid-cell-selected');
		}
		
		/**
		取得所有选择的记录,返回一个数组
		*/
		,getSelections : function(){
			var g = this.grid;
			var result = [];
			this.selections.each(function(){
				var cell = $(this);
				var colIndex = g.findCellIndex(cell);
				var rowIndex = g.findRowIndex(g.findParentRow(cell));
				r = g.data.result[rowIndex];
				var cellSelection = {result : r
					, rowIndex : rowIndex
					, colIndex : colIndex
					, value : r[g.cm[colIndex].dataIndex]};
				result.push(cellSelection);
			});
			return result;
		}
		
		/**
		是否已有选择的记录
		*/
		,hasSelection : function(){
			return this.selections.getCount() > 0;
		}
		
		,handlerKeyDown : function(e){
			e.stopPropagation();
			e.preventDefault();
			var key = e.which;
			var s = this.getSelections()[0];
			if(!s) return;
			var r = s.rowIndex, c = s.colIndex;
			if(key == 13){//enter
				if(this.startEditing){
					this.startEditing(r, c);
				}
			}else{
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
			if(r < 0) r = 0;
			if(c < 0) c = 0;
			var rowEl = this.grid.getRow(r);
			if(rowEl.length < 1){
				this.goCells(--r, c, 1);
				return;
			}
			var colEl = rowEl.find('.grid-row-td').eq(c);
			if(colEl.length < 1){
				this.goCells(r, --c, 1);
				return;
			}
			this.select(colEl);
			this.grid.scrollToRow(r);
		}
	};
	
	/**
	编辑表格选择模型
	*/
	$.uiwidget.EditCellSelectionModel = function(cfg){
		$.extend(this, cfg);		
	};
	$.uiwidget.EditCellSelectionModel.prototype = {
		initEvent : function(){			
			var g = this.grid;
			var t = this;	
			$.each(['beforeCellSelect'
				, 'cellSelect'
				, 'cellDblclick'
				, 'beforeRowSelect'
				, 'rowSelect'
				, 'rowDblclick'
				, 'rowDeselect'
				, 'rowCheckboxClick'
				], function(i, name){
				if(g[name]) g.bind(name, g[name]);
			})			
			this.addEvent();
			this.selections = new $.uiwidget.Collection();
			this.cellSelections = new $.uiwidget.Collection();
			g.bind('headerCheckboxClick', function(e, grid, checkbox){
				if($(checkbox).attr('checked')){
					t.selectAll();
				}else{
					t.deselectAll();
				}
			});
			g.bind('bodyscroll', function(e, grid){
				grid.sm.stopEditing();
			});
		}
		
		,addEvent : function(){
			var sm = this;
			var grid = this.grid;
			grid.mainBody.delegate('.grid-row-td', 'click', function(e){
				var cell = $(this);
				sm.selectc(cell);
				sm.onAutoEditClick(e, cell);
			});
			grid.mainBody.delegate('.grid-row', 'click', function(e){
				e.stopPropagation();
				var rowEl = $(this);
				sm.select(rowEl);
			});
			grid.mainBody.delegate(':checkbox.grid-body-checkbox', 'click', function(e){
				e.stopPropagation();
				var cbEl = $(this);
				var rowEl = grid.findParentRow(cbEl);
				if(!sm.isSelected(rowEl)){
					sm.select(rowEl, true);
				}else{
					sm.deselect(rowEl, true);
				}
				grid.triggerHandler('rowCheckboxClick', [grid, rowEl, cbEl]);	
			});
			grid.mainBody.delegate('.grid-row-td', 'dblclick', function(e){
				var cell = $(this);
				grid.triggerHandler('cellDblclick', [grid, cell]);
			});
			grid.mainBody.delegate('.grid-row', 'dblclick', function(e){
				var row = $(this);
				grid.triggerHandler('rowDblclick', [grid, row]);
			});
			grid.mainBodyWrap.keydown(function(e){
				sm.handlerKeyDown(e);
			});
		}
		
		,selectCell : function(rowIndex, colIndex, keepExisting){
			return this.selectc(this.grid.getCell(rowIndex, colIndex), keepExisting);	
		}
		
		,deselectCell : function(rowIndex, colIndex, keepExisting){
			return this.deselectc(this.grid.getCell(rowIndex, colIndex), keepExisting);	
		}
		
		,selectRow : function(index, keepExisting, notUpdateCb){
			return this.select(this.grid.getRow(index), keepExisting, notUpdateCb);	
		}
		
		,deselectRow : function(index, keepExisting, notUpdateCb){
			return this.deselect(this.grid.getRow(index), keepExisting, notUpdateCb);	
		}
		
		
		,select : function(row, keepExisting, notUpdateCb){
			if(this.grid.triggerHandler('beforerowselect', [this.grid, row]) !== false){	
				if(!keepExisting){
					this.clearSelections();
				}
				row.addClass('grid-row-selected')
					.find(':checkbox.grid-body-checkbox').attr('checked', true);
				this.lastSelection = row;
				this.selections.add(row[0]);
				if(!notUpdateCb)
					this.grid.updateHeaderCheckbox();
				this.grid.triggerHandler('rowselect', [this.grid, row]);
			}	
		}
		
		,selectc : function(cell, keepExisting){
			if(this.grid.triggerHandler('beforecellselect', [this.grid, cell]) !== false){	
				if(!keepExisting){
					this.clearCellSelections();
				}
				cell.addClass('grid-cell-selected')	;
				this.cellSelections.add(cell[0]);
				this.grid.triggerHandler('cellselect', [this.grid, cell]);
			}	
		}
		
		
		,deselect : function(row, keepExisting, notUpdateCb){
			if(!keepExisting){
				this.clearSelections();
			}
			row.removeClass('grid-row-selected')
					.find(':checkbox.grid-body-checkbox').attr('checked', false);	
			this.selections.remove(row[0]);
			if(!notUpdateCb)
				this.grid.updateHeaderCheckbox();
			this.grid.triggerHandler('rowdeselect', [this.grid, row]);
		}
		
		,deselectc : function(cell, keepExisting){
			if(!keepExisting){
				this.clearSelections();
			}
				
			cell.removeClass('grid-cell-selected');
			this.cellSelections.remove(cell[0]);
			this.grid.triggerHandler('celldeselect', [this.grid, cell]);
		}
		
		,clearSelections : function(){
			this.selections.each(function(item){
				// $.debug("clearSelections id="+ item.id);
				this.deselect($(item), true, true);
			}, this);
			
		}
		
		,clearCellSelections : function(){
			this.cellSelections.each(function(item){
				// $.debug("clearSelections id="+ item.id);
				this.deselectc($(item), true, true);
			}, this);
		}
		
		
		,selectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.select($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,deselectAll : function(){
			var t = this;
			this.grid.getAllRow().each(function(i, v){			
				t.deselect($(v), true, true);
			});
			this.grid.updateHeaderCheckbox();
		}
		
		,isSelected : function(rowEl){
			return rowEl.hasClass('grid-row-selected');
		}
		
		,getCellSelections : function(){
			var g = this.grid;
			var result = [];
			this.cellSelections.each(function(){
				var cell = $(this);
				var colIndex = g.findCellIndex(cell);
				var rowIndex = g.findRowIndex(g.findParentRow(cell));
				r = g.data.result[rowIndex];
				var cellSelection = {result : r
					, rowIndex : rowIndex
					, colIndex : colIndex
					, value : r[g.cm[colIndex].dataIndex]};
				result.push(cellSelection);
			});
			return result;
		}
		
		,getSelections : function(){
			var g = this.grid;
			var result = [];
			this.selections.each(function(){
				result.push(g.findRowData($(this)));
			});
			return result;
		}
		
		,getSelectedIndexs : function(){
			var g = this.grid;
			var result = [];
			this.selections.each(function(){
				result.push(g.findRowIndex($(this)));
			});
			return result;
		}		
		
		/**
		是否已有选择的记录
		*/
		,hasSelection : function(){
			return this.selections.getCount() > 0;
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
			if(r < 0) r = 0;
			var strict = this.grid.cm[0].checkbox ? 1 : 0;
			if(c < strict) c = strict;
			var rowEl = this.grid.getRow(r);
			if(rowEl.length < 1){
				this.goCells(--r, c, 1);
				return;
			}
			var colEl = rowEl.find('td').eq(c);
			if(colEl.length < 1){
				this.goCells(r, --c, 1);
				return;
			}
			this.selectc(colEl);
			this.grid.scrollToRow(r);
		}
		
		,onAutoEditClick : function(e, cell){
			var g = this.grid;
			var row = g.findParentRow(cell);
			var rowIndex = g.findRowIndex(row);
			var colIndex = g.findCellIndex(cell);
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
				var editEl = cellEl.find('.grid-inner');
				var colName = grid.getDataIndex(cellEl[0]);
				if($.uiwidget.isIE){
					var editWidth =  cellEl.innerWidth();
					
				}else{
					var editWidth =  cellEl.innerWidth() - grid.cellBorder ;//cellEl.css('width');
					
				}
				grid.cm[colIndex].editor.startEdit(editEl, 
						grid.data.result[rowIndex][colName] || '',
						{left : -grid.cellBorder, top : -grid.cellBorder, width : editWidth});
			}, 50, this);
		}
		,stopEditing : function(){
			if(this.activateEditor){
				this.activateEditor.completeEdit();
				this.activateEditor = null;
			}
		}
	};
		
	/**
	不能选择行的模型
	*/
	$.uiwidget.NoSelectionModel = function(cfg){
		$.extend(this, cfg);
	};
	$.uiwidget.NoSelectionModel.prototype = {
		initEvent : function(){			
			var g = this.grid;
			var t = this;	
			$.each([
				, 'rowmouseenter'
				, 'rowmouseleave'
				], function(i, name){
				if(g[name]) g.bind(name, g[name]);
			})			
			this.addRowEvent();
		}
		
		,addRowEvent : function(){
			var sm = this;
			var grid = this.grid;
			
			grid.mainBody.delegate('.grid-row', 'mouseenter', function(e){
				var rowEl = $(this);
				rowEl.addClass('grid-row-over');
				grid.triggerHandler('rowmouseenter', [grid, rowEl]);	
			});
			
			grid.mainBody.delegate('.grid-row', 'mouseleave', function(e){
				var rowEl = $(this);
				rowEl.removeClass('grid-row-over');
				grid.triggerHandler('rowmouseleave', [grid, rowEl]);	
			});
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
				t.update();
			});
			this.grid.bind('bodyscroll', function(e, grid, scrollLeft){
				t.summaryBar.scrollLeft(scrollLeft);
			});
		}
		,renderSummaryBar : function(){
			this.summaryBar = $(['<div class="grid-summary-bar"><div class="grid-summary-bar-scroller"><table class="grid-summary-table" ',
				'cellspacing="0" cellpadding="0"><tbody></tbody>',
				'</table></div></div>'].join(''));
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
			btd.push('<tr class="grid-summary-row">');
				$.each(grid.cm, function(j, m){
					if(m.checkbox){
						btd.push('<td class="grid-summary-chk" unselectable="on" style="width:', m.width ? m.width : (grid.checkboxWidth + 'px'), '"></td>');
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
							btd.push('<div unselectable="on">');
						}else{
							btd.push('<div unselectable="on" title="', text, '">');
						}	
						btd.push(text, '</div></td>');
					}
				});
			btd.push('</tr>');
			this.summaryBar.find('tbody').append(btd.join(''));
			var width = grid.mainBody.find('.grid-summary-table').width();
			if(width){
				t.summaryBar.find('.grid-summary-table').width(width);
			}
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
			var sbSpan = this.summaryBar.find('.grid-summary-bar-' + dataIndex + ' div');
			return sbSpan.attr('title');
		}
		,setValue : function(dataIndex, value){
			var sbSpan = this.summaryBar.find('.grid-summary-bar-' + dataIndex + ' div');
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
			var tb = ['<div class="grid-bottom-ctoolbar"><ul><li class="display-text">共<span class="bold">1</span>条，显示<span class="bold">1</span>-<span class="bold">1</span>条</li>'];
			
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
    			
    			if(target.children('.first-ellipsis').length > 0 || target.hasClass('.first-ellipsis')){
    				pageNum = 1;
    			}else if(target.children('.last-ellipsis').length > 0 || target.hasClass('.last-ellipsis')){
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
		header: ""
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
		header: ""
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
		rowIncrement : 0
		,cellIncrement : 0
		,buildRow : function(rowIndex, result){
			var btd = [];
			btd.push('<div class="grid-row" id="grid-row-', this.rowIncrement++,'"><table class="grid-bd-table" cellspacing="0" cellpadding="0" ',
				'><tbody><tr class="grid-bd-row">');
			for(var i = 0 ; i < this.grid.cm.length ; i ++){
				var m = this.grid.cm[i];
				if(m.checkbox){
					btd.push('<td class="grid-bd-chk" style="width:', m.width ? m.width : (this.grid.checkboxWidth + 'px'), '"><div class="grid-inner">',result?'<input type="checkbox" class="grid-body-checkbox" value=""/>':'','</div></td>');
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
					btd.push('<td hidefocus="true" style="width:', m.width,'" id="grid-td-', this.cellIncrement++, '" class="grid-row-td ', metadata.css, '" title="', metadata.title, '" tabindex="-1"><div class="grid-inner"');
						if(m.width){
							if(typeof m.width == 'string'){
								var index = m.width.indexOf('px');
								var w = Number(m.width.substring(0, index)) - 8;
								btd.push(' style="width:', w, 'px;"');
							}else{
								btd.push(' style="width:', m.width, '"');
							}
						}

					if(/<.*>/.exec(text)){//如果用html tag就不使用title
						btd.push('>');
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
						btd.push(' title="', title, '">');
					}	
					btd.push(text);
					btd.push('</div></td>');
				}
			}
			btd.push('</tr></tbody></table></div>');
			return btd;
		}
	});
	
	/**
	 * 集合
	 */
	$.uiwidget.Collection = function(cfg){
		$.extend(this, cfg);
		this.items = [];
	    this.map = {};
	    this.keys = [];
	    this.length = 0;
	    
	    if(!Array.prototype.indexOf){
		    Array.prototype.indexOf=function(el, index){
		        var n = this.length>>>0, i = ~~index;
		        if(i < 0) i += n;
		        for(; i < n; i++) if(i in this && this[i] === el) return i;
		        return -1;
		    }
		}
	};
	
	$.uiwidget.Collection.prototype = {
		add : function(key, o){
	        if(arguments.length == 1){
	            o = arguments[0];
	            key = this.getKey(o);
	        }
	        if(typeof key != 'undefined' && key !== null){
	            var old = this.map[key];
	            if(typeof old != 'undefined'){
	                return this.replace(key, o);
	            }
	            this.map[key] = o;
	        }
	        this.length++;
	        this.items.push(o);
	        this.keys.push(key);
	        return o;
	    }
	    
	    ,remove : function(o){
	        return this.removeAt(this.indexOf(o));
	    }
	    
	    ,removeAt : function(index){
	        if(index < this.length && index >= 0){
	            this.length--;
	            var o = this.items[index];
	            this.items.splice(index, 1);
	            var key = this.keys[index];
	            if(typeof key != 'undefined'){
	                delete this.map[key];
	            }
	            this.keys.splice(index, 1);
	            return o;
	        }
	        return false;
	    }
	    
	    ,getKey : function(o){
	        return o.id;
	    }
	    
	    ,replace : function(key, o){
	        if(arguments.length == 1){
	            o = arguments[0];
	            key = this.getKey(o);
	        }
	        var old = this.map[key];
	        if(typeof key == 'undefined' || key === null || typeof old == 'undefined'){
	             return this.add(key, o);
	        }
	        var index = this.indexOfKey(key);
	        this.items[index] = o;
	        this.map[key] = o;
	        return o;
	    }
	    
	    ,indexOfKey : function(key){
	        return this.keys.indexOf(key);
	    }
	    
	    ,indexOf : function(o){
	        return this.items.indexOf(o);
	    }
	    
	    ,getCount : function(){
	        return this.length;
	    }
	    
	    ,clear : function(){
	        this.length = 0;
	        this.items = [];
	        this.keys = [];
	        this.map = {};
	    }
	    
	    ,each : function(fn, scope){
	        var items = [].concat(this.items); 
	        for(var i = 0, len = items.length; i < len; i++){
	            if(fn.call(scope || items[i], items[i], i, len) === false){
	                break;
	            }
	        }
	    }
	}
})(jQuery);	