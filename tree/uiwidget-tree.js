/**
* Tree组件
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2010-11-01
* @version 2.1.0-SNAPSHOT
*/
;(function(){
	
	$.uiwidget = $.uiwidget || {};
	
	/**
	 * Tree 
	 */
	$.uiwidget.Tree = function(el, cfg){
		$.extend(this, cfg);
		this.el = $(el);
		this.init();
		if(this.autoRender){
			this.render();
		}
	};
	
	$.uiwidget.Tree.prototype = {
			
		autoExpandRoot : true
		
		/**
		 * 默认超时
		 */
		,defaultTimeout : 60000
		
		,autoRender : true
		
		/**
		 * 是否显示图标
		 */
		,showIcons : true
		
		/**
		 * 是否使用缓存
		 */
		,cache : false
		
		/**
		 * 是否使用异步方式加载数据
		 * {defaults to false}
		 */
		,async : false
		
		,init : function(){
			var t = this;
			
			this.nodeHash = {};
			this.loadParas = {};
			
			$.each(['beforeLoad', 'afterLoad'], function(i, name){
				if(t[name]) t.bind(name, t[name]);
			});
		}
		
		/**
		展开所有节点
		*/
		,expandAll : function(){
			this.getContainerNode().expand(true);
		}
		
		/**
		缩起所有节点
		*/
		,collapseAll : function(){
			this.getContainerNode().eachChild(function(node){
				node.collapse(true);
			});
		}
		
		/**
		展开根节点
		*/
		,expandRoot : function(){
			this.getContainerNode().eachChild(function(node){
				node.expand();
			});
		}
		
		/**
		设置查询参数
		*/
		,setLoadParas : function(para){
			for(var key in para){
				if(para[key]){
					//$.debug('setPara  ' + key + ' = ' + para[key]);
					this.loadParas[key] = para[key];
				}	
			}	
		}
		
		/**
		读取url数据
		*/
		,loadData : function(treeNode){
			this.loadParas = {};
			if(treeNode){
				if(treeNode.data.id)//默认传id
					this.setLoadParas({id : treeNode.data.id});
				this.triggerHandler('beforeLoad', [treeNode, this]);
			}
			
			var t = this;
			$.ajax({
				async : this.async
				,cache : this.cache
				,dataType : 'json'
				,type : 'POST'
				,url : this.url
				,data : this.loadParas
				,timeout : this.timeout || this.defaultTimeout//默认超时60秒
				,contentType: "application/x-www-form-urlencoded; charset=UTF-8"
				,success : function(data){
					t.data = data || {};
				}				
			});
			if(treeNode)
				this.triggerHandler('afterLoad', [treeNode, this]);
		}
		
		,render : function(){
			this.wraper = $(['<div class="tree" ' , this.height? 'style="height:'+this.height+'px" ' : '', '></div>'].join(''));
			this.el.append(this.wraper);
			this.containerNode  = new $.uiwidget.TreeNode({
					el : this.wraper
					,indent : []
					,tree : this
					,isContainer : true
					,data : {children: this.data}
				}); 
			if(!this.data && this.url)
				this.loadData(this.containerNode);
				
			this.containerNode.appendChildByData(this.data);
			this.containerNode.expand();
			if(this.autoExpandRoot) this.expandRoot();
			this.addEvent();
		}
		
		//add el event
		,addEvent : function(){
			this.el
				.dblclick($.proxy(this, "onDblclick"))
				.click($.proxy(this, "onClick"))
				.bind('contextmenu', $.proxy(this, "onContextmenu"));	
		}
		
		,onClick : function(e){
			var target = $(e.target);
			if(target.is('.tree-node-text') || target.is('.tree-node-icon')){//text/icon
				var treeNode = this.getNode(target.parent());
				treeNode.select(true);
				this.triggerHandler('nodeClick',[treeNode]);
			}else if(target.is('.tree-expand-icon')){//+-
				var treeNode = this.getNode(target.parent());
				treeNode.toggle();
			}else if(target.is('.tree-node-checkbox')){//checkbox
				var treeNode = this.getNode(target.parent());
				treeNode.data.checked = target[0].checked;
				this.triggerHandler('checkchange',[treeNode, target[0].checked]);
			}
		}
		
		,onDblclick : function(e){
			var target = $(e.target);
			if(target.is('.tree-node-text') || target.is('.tree-node-icon')){
				var treeNode = this.getNode(target.parent());
				treeNode.toggle();
				this.triggerHandler('nodeDblclick',[treeNode]);
			}
		}
		
		,onContextmenu : function(e){
			var target = $(e.target);
			if(target.is('.tree-node-text') || target.is('.tree-node-icon')){
				e.preventDefault();
				var treeNode = this.getNode(target.parent());
				this.triggerHandler('treeContextMenu', [this, treeNode], e);
				this.handlerContextMenu(treeNode, e);
			}
		}
		
		,getNode : function(el){
			var id = el[0].className.split(" ")[1].substring(10);
	        if(id){
	        	return this.getNodeById(id);
	        }	        
	        return null;
	    }
		
		/**
		取得勾选的节点
		@return {Array} 勾选的TreeNode数组
		*/
		,getCheckedNode : function(){
			var t = this;
			return this.getContainerNode().el.find(':checkbox:checked').map(function(){
				return t.getNode($(this).parent());
			});
		}
		
		/**
		取得选中的节点
		*/
		,getSelectedNode : function(){
			return this.selectedNode;
		}
		
		/**
		 * 设置选中的节点
		 */
		,setSelectedNode : function(node){
			this.selectedNode = node;
		}
		
		/**
		取得所有根节点
		*/
		,getRootNode : function(){
			return this.containerNode.childNodes;
		}
		
		/**
		取得容器节点，在此节点上增加根节点
		*/
		,getContainerNode : function(){
			return this.containerNode;
		}
		
		/**
		重新加载根节点
		*/
		,reload : function(fn){			
			if(!this.url && this.getContainerNode())
				this.getContainerNode().data = {children:this.data};
			this.getContainerNode().reload(fn);
		}
		
		/**
		取右键菜单
		*/
		,getContextMenu : function(){
			if(!this.cMenu) {
				if($.menu){
					this.cMenu =  $.menu({items : this.contextMenu});
				}
			}
			return this.cMenu;
		}
		
		/**
		增加右键菜单
		*/
		,addContextMenuItem : function(cfg){
			return this.getContextMenu().addMenuItem(cfg);
		}
		
		,handlerContextMenu : function(node, e){
			e.preventDefault();
			var contextMenu = this.getContextMenu();
			if(contextMenu && contextMenu.size() > 1){
				node.select(false);
				contextMenu.showAt(e.pageX, e.pageY);
			}
		}
		
		/**
		 * 取得数据
		 * @return 树的数据
		 */
		,getData : function(){
			return this.data;
		}
		
		,getNodeById : function(id){
	        return this.nodeHash[id];
	    }

	    // private
	    ,registerNode : function(node){
	        this.nodeHash[node.data.id] = node;
	    }

	    // private
	    ,unregisterNode : function(node){
	        delete this.nodeHash[node.data.id];
	    }
	    
	    /**
	     * 根据路径选择节点, 如 : tree.selectPath("1/2/22");
	     * @param {String} path : 用"/"分隔的id串
	     * @param {Boolean} triggerLink 是否选择节点并触发节点链接	
	     */
	    ,selectPath : function(path, triggerLink) {
			var paths = path.split('/');

			var id = paths.shift();
			this.getContainerNode().eachChild(eachFn);

			function eachFn(node) {
				if (id == node.data.id) {
					if ((id = paths.shift())) {
						node.expand();
						node.eachChild(eachFn);
					} else {
						node.select(triggerLink);
						return false;
					}
				}
			}
		}
	    
	    /**
	     * 销毁树，解除事件的绑定及销毁节点
	     */
	    ,destroy : function(){
			this.el.unbind('dblclick click contextmenu');
			this.el.empty();	
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
	};
	
	/**
	 * 树节点
	 */
	$.uiwidget.TreeNode = function(cfg){
		$.extend(this, cfg);
		this.init();
	};
	
	$.uiwidget.TreeNode.prototype = {
		isRendered : false
		
		,firstChild : null
		
		,lastChild : null
		
		,previousSibling : null
		
        ,nextSibling : null 
        
        ,ct : null 
        
        ,indent : null
        
		,init : function(){
			this.childNodes =  [];
			this.leaf = this.data && this.data.leaf;
			this.expanded = false;
		}
	
		,createNodeArray : function(){
			var data = this.data;
			var tn = ['<li class="tree-node', ' tree-node-', data.id, data.disabled ? ' tree-node-disabled' : '',  '" title="', data.title, '">'];
			
			tn.push('<span class="tree-indent">');
			tn = tn.concat(this.buildIntent());
			tn.push('</span><input type="button" hideFocus="true" class="');
			tn.push(this.buildExpandIcon().join(" "));
			tn.push('"/>');
			
			if(this.tree ? this.tree.showIcons : true){
				if(data.children || !this.isLeaf()){
					tn.push('<input type="button" hideFocus="true" class="tree-node-icon tree-node-folder', this.isContainer ? ' tree-node-root' : '' ,'"/>'); 
				}else{
					tn.push('<input type="button" hideFocus="true" class="tree-node-icon tree-node-leaf"/>'); 
				}
			}
			
			if(data.checked === 'false' || data.checked === false)
				tn.push('<input class="tree-node-checkbox"', data.disabled ? ' disabled="true"' : '', ' type="checkbox"/>');
			else if(data.checked === 'true' || data.checked === true)
				tn.push('<input class="tree-node-checkbox" type="checkbox" checked="true"/>'); 	 
			
			
			tn.push('<span class="tree-node-text" unselectable="on">', data.text, '</span></li>');	
			return tn;
	    }

		,getEl : function(){
			if(!this.el){
				this.el =  this.tree.el.find(['.tree-node-',this.data.id].join(""));
			}
			return this.el;
		}
		
		,getExpandIcon : function(){
			return this.expandIcon || (this.expandIcon = this.getEl().children('.tree-expand-icon'));
		}
		
		,getIndent : function(){
			return this.indent || (this.indent = this.getEl().children('.tree-indent'));
		}
		
		,getFolder : function(){
			return this.folder || (this.folder = this.getEl().children('.tree-node-folder'));
		}
		
		/**
		* render indent of the tree node
		*/
		,renderIndent : function(deep){
			
			this.getIndent().html(this.buildIntent().join(''));
			this.updateExpandIcon();
			
			if(deep === true && this.ct != null ){ 
				var cs = this.childNodes;
		        for(var i = 0, len = cs.length; i < len; i++){
		        	cs[i].renderIndent(deep);
		        }
	        }
		}
		
		,buildIntent : function(){
			var tn = [];
			var p = this.parentNode;
			while(p){
                if(!p.isContainer){
                    if(p.isLast()) {
						tn.unshift('<input type="button" hideFocus="true" class="tree-blank"/>');
                    } else {
						tn.unshift('<input type="button" hideFocus="true" class="tree-blank tree-line"/>');
                    }
                }
                p = p.parentNode;
            }
			return tn;
		}
		
		/**
		更新节点图标
		*/
		,updateExpandIcon : function(){
			if(this.isRendered){
				var css = this.buildExpandIcon();
				if(this.getExpandIcon().length > 0)
					this.getExpandIcon()[0].className = css.join(' ');
			}
		}
		
		,buildExpandIcon : function(){
			var css = ['tree-expand-icon'];
			var icon = [];
			if(this.isLast()){
				icon.push('tree-elbow-end');
			}else{
				icon.push('tree-elbow');
			}	
			if(!this.isLeaf()){	 	
				if(this.expanded)
					icon.push('-minus');				
				else
					icon.push('-plus');
			}
			css.push(icon.join(''));
			return css;
		}
		
		//批量添加子节点
	    ,appendChildByData : function(data){
	    	if(data){
	    		var tn = [];
				for(var i = 0, len = data.length; i < len ; i++){
					var treeNode = new $.uiwidget.TreeNode({data : data[i],tree : this.tree});
					
					if(this.childNodes.length == 0){
						this.setFirstChild(treeNode);
					}
					if(i == (len-1)){
						this.setLastChild(treeNode);
					}
					
					treeNode.parentNode = this;
					var ps = treeNode.parentNode.childNodes[i-1];
		            if(ps){
		            	treeNode.previousSibling = ps;
		                ps.nextSibling = treeNode;
		            }else{
		            	treeNode.previousSibling = null;
		            }
		            treeNode.nextSibling = null;
					
					
					tn = tn.concat(treeNode.createNodeArray());
					this.childNodes.push(treeNode);
					this.tree.registerNode(treeNode);
					treeNode.isRendered = true;
				}
				this.getCt().append(tn.join(''));
				
				this.leaf = false;
			}
	    }
	    
	    ,getCt : function(){
	    	if(!this.ct || this.ct.length == 0){
				this.ct = $('<div class="tree-node-ct"/>');
				if(this.isContainer)
					this.getEl().append(this.ct);
				else
					this.getEl().after(this.ct);
			}
			return this.ct;	
	    }
		
		/**
		在当前节点下添加子节点
		@param {json}/{TreeNode}node 添加的子节点
		*/
		,appendChild : function(node){
			if(!node.appendChild){
				if($.isArray(node)){
//					$.debug('array')
					if(node.length > 1) throw "This parameter can not be an array.";
				}else{
					var a = [];
					a.push(node);
					this.appendChildByData(a);
				}	
			}else{
				this.appendChild(node.data);
			}
		}
		
		/**
		设定首节点
		*/		
		,setFirstChild : function(node){
	        var of = this.firstChild;
	        this.firstChild = node;
	        if(of && of.isRendered && node != of){
	            of.renderIndent(true);
	        }
	        if(this.isRendered){
	            this.renderIndent(true);
	        }
	    }
		
	    /**
		设定末节点
		*/	
		,setLastChild : function(node){
			var ol = this.lastChild;
			this.lastChild = node;
			if( ol && ol.isRendered && node != ol){
				ol.renderIndent(true);
			}
			if(this.isRendered){
				this.renderIndent(true);
			}	
		}
		
		/**
		删除节点
		*/	
		,removeChild : function(node){
			var index = $.inArray(node, this.childNodes);
	        if(index == -1){
	            return false;
	        }
	        this.childNodes.splice(index, 1);
	        
	        if(node.previousSibling){
	            node.previousSibling.nextSibling = node.nextSibling;
	        }
	        if(node.nextSibling){
	            node.nextSibling.previousSibling = node.previousSibling;
	        }
	        if(this.firstChild == node){
	            this.setFirstChild(node.nextSibling);
	        }
	        if(this.lastChild == node){				
	            this.setLastChild(node.previousSibling);
	        }
	        node.parentNode = null;
	        node.previousSibling = null;
	        node.nextSibling = null;
	        
	        if(node.ct)
	        	node.ct.remove();
	        node.getEl().remove();
	        if(this.childNodes.length < 1){
	            this.collapse();
	            this.leaf = true;
	        }
	        this.updateExpandIcon();
	        this.tree.unregisterNode(node);
	        
	        return node;
		}
		
		/**
		是否首节点
		*/	
		,isLast : function(){
			return (!this.parentNode ? true : this.parentNode.lastChild == this);
		}
		
		/**
		是否叶子节点
		*/	
		,isLeaf : function(){
			return this.leaf;
		}
		
		/**
		设置节点显示的文字
		@param {string}text 设置的文字
		*/
		,setText : function(text){
			this.data.text = text;
			this.getEl().children('.tree-node-text').text(text);
		}
		
		/**
		取节点文字
		*/	
		,getText : function(){
			return this.getEl().children('.tree-node-text').text();
		}
		
		,getHrefTarget : function(){
			return this.hrefTarget || ( this.hrefTarget =(this.data && this.data.hrefTarget) || this.tree.hrefTarget);
		}
		/**
		选择节点
		@param link 是否触发链接
		*/	
		,select : function(link){
			if(this.data.disabled) return;
			
			if(this.tree.getSelectedNode())
				this.tree.getSelectedNode().getEl().find('.tree-node-selected').removeClass('tree-node-selected');
			this.tree.setSelectedNode(this);
			
			this.getEl().find('.tree-node-text').addClass('tree-node-selected');
			
			var href = this.data.href;
			this.hrefTarget = this.getHrefTarget();
			
			if(link && href && href.length > 0 ){
				if(this.tree.ajaxLoadPage ){
					if($.fn.page) 
						$(this.hrefTarget).page(href);
					else
						alert("please import page plugin.");	
				}else{
					if(typeof this.hrefTarget == 'string'){
						window.frames[this.hrefTarget].location = href;
					}else{
						this.hrefTarget.location = href;	
					}	
				}
			}
	    }
		
	    /**
		取消选择节点
		*/	
	    ,unselect : function(){
			var selEl = this.getEl().find('.tree-node-selected');
			if(selEl.length > 0){
				selEl.removeClass('tree-node-selected');
	    		this.tree.setSelectedNode(null);
			}
	    }
	    
	    /**
		是否被选择的节点
		*/	
	    ,isSelected : function(){
	    	return this.getEl().find('.tree-node-selected').length > 0;
	    }
	    
		/**
		生成子节点
		*/
		,renderChildren : function(){
			var children;
			if(!this.isLeaf()){
				if(this.data.children){// && !this.isContainer
					children = this.data.children;
				}else if(this.tree.url){
					this.tree.loadData(this);
					children = this.tree.data;
				}
				if(!children) return;
				this.appendChildByData(children);
			}
			return this.ct;
		}
		
		/**
		展开或缩小节点
		*/
	    ,toggle : function(){
			if(this.expanded){
				this.collapse();
			}else{
				this.expand();
			}
		}
	    
		/**
		展开节点
		@param {boolean} deep 是否递归展开子节点		
		*/
	    ,expand : function(deep){
			if(!this.ct || this.ct.length == 0){
				this.ct = this.renderChildren();
			}
			if(this.ct && this.ct.length > 0){
				this.ct[0].style.display = "block";
			}
			this.expanded = true;
			if(!this.isLeaf())
				this.updateExpandIcon();
			if((this.tree ? this.tree.showIcons : true) && this.getFolder())
				this.getFolder().addClass('tree-node-folderopen');
			if(deep){
				for(var i = 0; i < this.childNodes.length; i++){
					if(!this.childNodes[i].isLeaf()) 
						this.childNodes[i].expand(deep);
				}
			}
	    }
	    
	    /**
		*收缩节点
		*@param {boolean} deep 是否递归收缩子节点		
		*/
	    ,collapse : function(deep){
			if(this.ct && this.ct.length > 0){
				this.ct[0].style.display = "none";
			}
			this.expanded = false;
			if(!this.isLeaf())
				this.updateExpandIcon();
			if((this.tree ? this.tree.showIcons : true) && this.getFolder())
				this.getFolder().removeClass('tree-node-folderopen');
			if(deep){
				for(var i = 0; i < this.childNodes.length; i++){
					if(!this.childNodes[i].isLeaf()) 
						this.childNodes[i].collapse(deep);
				}
			}	
	    }
	    
	    /**
		*重载节点
		*/
	    ,reload : function(fn){
			if(this.ct){
				this.ct.remove();
				delete this.ct;
				this.expanded = false;
				this.childNodes = [];
			}
			this.expand();
			if(fn) fn(this);
		}
	    
		/**
		*	删除本节点
		*/
	    ,remove : function(){
	    	this.parentNode.removeChild(this);
	    }
	    
	    /**
		可选节点
		*/
	    ,enable : function(){
	    	this.data.disabled = false;
	    	this.getEl().removeClass('tree-node-disabled');
	    	this.getEl().find('.tree-node-checkbox').attr('disabled', false);
	    }
	    
	    /**
		不可选节点
		*/
	    ,disable : function(){
	    	this.unselect();
	    	this.data.disabled = true;
	    	this.getEl().addClass('tree-node-disabled');
	    	this.getEl().find('.tree-node-checkbox').attr('disabled', true);
	    }
	    
	    /**
		*取节点数据
		*/
	    ,getData : function(){
	    	return this.data;
	    }
	    
	    /**
		*改变节点选择框
		*/
	    ,checkChange : function(checked, triggerEvent){
	    	this.getEl().find('.tree-node-checkbox').attr('checked', checked);
			this.data.checked = checked;
			if(triggerEvent === true)
				this.tree.triggerHandler('checkchange',[this, checked]);
	    }
	    
		/**
		*递归循环所有子节点，执行参数的函数
		*函数返回false，则停止循环
		*@param {function}fn 执行的函数
		*/
	    ,cascade : function(fn){
	        if(fn(this) === false)
	        	return;
            var cs = this.childNodes;
            for(var i = 0, len = cs.length; i < len; i++) {
            	cs[i].cascade(fn);
            }
	    }
	    
		/**
		*循环子节点，执行参数的函数
		*函数返回false，则停止循环
		*@param {function}fn 执行的函数
		*/
	    ,eachChild : function(fn){
	        var cs = this.childNodes;
	        for(var i = 0, len = cs.length; i < len; i++) {
	        	if(fn(cs[i]) === false)
	        		break;
	        }
	    }
	    
	    ,getPath : function() {
			var paths = new Array();
			var loopNode = this;
			while (loopNode) {
				var id = loopNode.data.id;
				if (id) {
					paths.unshift(id);
				}
				loopNode = loopNode.parentNode;
			}
			return paths.join('/');
		}
	    
	    /**
		*绑定事件
		*/
		,bind : function(arg0, arg1, arg2){
			if(typeof arg1 == 'object')
				return this.getEl().bind(arg0, arg1, arg2);
			else 
				return this.getEl().bind(arg0, arg1);
		}
		
		,trigger : function(arg0, arg1){
			return this.getEl().trigger(arg0, arg1);
		}
		
		,triggerHandler : function(arg0, arg1){
			return this.getEl().triggerHandler(arg0, arg1);
		}
	};
	 
	/**
	 * plugin method
	 */
	$.fn.tree = function(cfg){
		return new $.uiwidget.Tree(this, cfg);
	};
	
})(jQuery);