/**
* combobox 复合列表
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @data 2010-03-26
* @version 1.0.0-SNAPSHOT
*/
;(function($){
	
	$.uiwidget = $.uiwidget || {};

	$.uiwidget.Combobox = function(el, cfg){
		$.extend(this, cfg);
		this.el = el;
		this.init();
		this.render();
	};
	
	$.uiwidget.Combobox.prototype = {
		/**
		 * combox width
		 * (defaults to 110)
		 */	
		width : 110
		
		/**
		 * max height of the list
		 */
		,maxHeight : 200
		
		,valueField : 'value'
	
        ,displayField : 'text'
        
        /**
         * @cfg {Boolean} readOnly true to mark the field as readOnly in HTML
         * (defaults to false)
         */
        ,readOnly : false
    	/**
         * @cfg {Boolean} lazyInit true to not initialize the list for this combo until the field is focused
         * (defaults to true)
         */
        ,lazyInit : true
        
        ,queryName : 'combobox'
        	
        ,cache : false	
        
		,init : function(){
			if(this.data)
				this.cacheDate = this.data;
//			$.ajaxSetup({cache:false})
			this.paras = {};
		}
	
		,render : function(){
			
			this.selectedIndex = -1;
			
			this.el.addClass("f-combobox");
//			this.wrap = $('<div class="f-combobox-wrap"></div>');
			this.el.wrap('<div class="f-combobox-wrap"></div>');
			this.wrap = this.el.parent();
			this.trig = $('<input type="button" class="f-arrow-trigger" hideFocus="true"/>');
			this.el.after(this.trig);
			
			if(this.hiddenName){
				this.hiddenField =  $('<input>', {type:'hidden', name: this.hiddenName,
                    id: (this.hiddenId||this.hiddenName)});
	            this.el.after(this.hiddenField);

	        }
			
			if(!this.lazyInit){
	            this.initList();
	        }else{
	        	this.el.one("focus", $.proxy(this, "initList"));
	        }
			
			this.el.bind("focus", $.proxy(this, "onFocus"));
			this.trig.bind("click", $.proxy(this, "onTriggerClick"));
			this.el.bind("keyup", $.proxy(this, "onKeyup"));
			
			this.initValue();
			
		}
		
		,initValue : function(){
			if(this.value !== undefined){
	            this.setValue(this.value);
	        }else if(this.getValue() != undefined){
//	        	console.debug('this.getValue()='+this.getValue());
	            this.value = this.getValue();
	        }
			this.originalValue = this.getValue();
	        if(this.hiddenField){
	            this.hiddenField.val(this.hiddenValue !== undefined ? this.hiddenValue : this.value);
	        }
	    }
		
		,initList : function(){
//			$.debug('initList');
			this.renderList();
			this.loadData();
			
			this.list.width(this.el.outerWidth() + this.trig.outerWidth() - 2);
			this.listInner = this.list.find('.f-combobox-list-inner');
			
//			console.debug(this.listItems.length);
			$('.f-combobox-list-item', this.list[0])
				.live("mouseover",$.proxy(this, "onListOver"))
				.live("click", $.proxy(this, "onListClick"));
			
		}
		
		,renderList : function(){
			this.list = $(['<div class="f-combobox-list"><div class="f-combobox-list-inner"><ul></ul></div></div>'].join(""));
			this.trig.after(this.list);
		}
		
		,replaceList : function(){
//			if(!this.data || this.data.length < 1) throw "data is null.";
			var tpl = ['<ul>'];
			for(var i = 0; i < this.data.length; i++){
				tpl.push('<li class="f-combobox-list-item">', this.data[i][this.displayField], '</li>');
			}
			tpl.push('</ul>');
			this.list.find('ul').replaceWith(tpl.join(""));
		}
		
		,onTriggerClick : function(e){
//			$.debug('onTriggerClick');
	        if(this.readOnly || this.disabled){
	            return;
	        }
	        if(this.isExpanded()){
	        	this.el.focus();
	            this.collapse();
	        }else {
	            this.el.focus();
	            this.clearFilter();
	        	this.expand();
//	        	this.restrictList();
//	        	this.alignList();
	        	this.selectByValue(this.getValue(), true);
	        }
	    }
		
		,clearFilter : function(){
			if(this.filtered){
            	this.replaceList();
            	this.filtered = false;
            }
//			if(this.url && this.hasQuery){
//				$.debug('reset')
//				this.paras = {};
//				this.hasQuery = true;
//			}
			if(this.url && this.hasQuery){
//				$.debug("query");
				this.paras = {};
				this.loadData();
				this.hasQuery = false;
			}
		}
		
		,onFocus : function(){
			this.el.select();
	    }
		
		,onKeyup : function(e){
			var key = e.which;
//			console.debug("key="+key);
			if(key == 8){//backspace
				this.filter(this.getValue(), true);
			}else if(key == 13){//enter
				this.selectedIndex = -1;
				this.collapse();
			}else if(key == 40){//down
				if(!this.isExpanded()){
					this.clearFilter();
					this.expand();
//					this.alignList();
					this.selectByValue(this.getValue(), true);
				}else{
					this.selectNext();
				}
			}else if(key == 38){//up
				this.selectPrev();
			}else{
				if(this.dly){
					this.removeDelay(this.dly);
				}
				var v = this.getValue();
				this.dly = this.delay(function(){
					this.filter(v);
				}, 500);
			}
		}
		
		,triggerBlur : function(e){
//			console.debug("triggerBlur");
			if(e.target != this.trig[0] && !$.contains(this.wrap[0], e.target)){
				this.collapse();
			}
		}
		
		,onListClick : function(e){
			var target = $(e.target);
			this.selectByTarget(target);
//			this.setValue(target.html());
			this.collapse();
			this.onFocus();
		}
		
		,onListOver : function(e){
//			$.debug('onListOver');
			var target = $(e.target);
			this.selectByTarget(target, true);
		}
		
		,selectByTarget : function(target, notSetValue){
			var index = this.list.find('.f-combobox-list-item').index(target);
//			$.debug('index='+index);
			this._selectByIndex(index, notSetValue);
		}
		
		//private
		,_selectByIndex : function(index, notSetValue){
//			console.debug('index=',index);
			if(index < 0){
				this.selectedIndex = 0;
				return;
			}
			var items = this.listInner.find('.f-combobox-list-item');
			var lastSelection = items.eq(this.selectedIndex);
//			$.debug(lastSelection.html());
			this.selectedIndex = index;
			var target = items.eq(index);
			if(target.length > 0){
//				$.debug('target > 0');
				lastSelection.removeClass('f-combobox-list-item-selected');
				target.addClass('f-combobox-list-item-selected');
				if(!notSetValue)
					this.setValue(target.html());
			}else{
				this.selectedIndex = (index <= 0 ? 0 : index - 1);
			}
			return target;
		}
		
		,selectByIndex : function(index, notSetValue){
			var listItemEl = this._selectByIndex(index, notSetValue);
			if(listItemEl && listItemEl.length > 0){
				this.scrollToItem(listItemEl, false);
			}
		}
		
		,scrollToItem : function(el, animate){
	        if(!el){ return; }
	        var pos = this.getScrollPos(), area = this.getScrollArea();
	        var top = el.getOffsetsTo(this.list).top + pos ;
	        var down = top + el.outerHeight();
//	        console.debug('el.outerHeight()='+el.outerHeight());
//	        console.debug('el[0] top='+this.getOffsetsTo(el[0], this.list[0])[0]);
//	        console.debug('el.position().top='+el.position().top);
//	        console.debug('top='+top + ',pos='+pos + ', down='+down);
//	        console.debug('area='+area);
	        if(top < pos){
	            this.scrollTo(top, animate);
	        }else if(down > (pos + area)){
//	        	console.debug("down > (pos + area)");
	            this.scrollTo(down - area, animate);
	        }
	    }
		
		,getScrollPos : function(){
	        return this.list.scrollTop();
	    }

	    // private
	    ,getScrollArea : function(){
	        return this.list.height();
	    }
	    
	    ,scrollTo : function(pos, animate){
//			console.debug('scrollTo='+pos);
	    	if(animate)
	    		this.list.animate({scrollTop: pos}, "fast", "linear");
	    	else
	    		this.list.scrollTop(pos);
		}
	    
		,selectNext : function(){
			this.selectByIndex(this.selectedIndex + 1);
		}
		
		,selectPrev : function(){
			this.selectByIndex(this.selectedIndex - 1);
		}
		
		
		,putParameter : function(queryParams){
			$.extend(this.paras, queryParams);
		}
		
		,getParameter : function(){
			return this.paras;
		}
		
		,getQueryName : function(){
			return this.queryName;
		}
		
		/**
		 * 
		 * @param {boolean} true to not set the input value
		 */
		,filter : function(q, notSetValue){
//			console.debug("q=" + q);
			if(this.url){
//				$.debug("filter");
				var p = {};
				p[this.getQueryName()] = this.getValue();
				this.putParameter(p);
				this.loadData();
				this.expand();
//				this.restrictList();
//				this.alignList();
//				this.showList(this.el);
				this.hasQuery = true;
				if(this.data.length > 0){
					this.selectByIndex(0, notSetValue);
					if(!notSetValue)
						this.selectText(q.length);
				}
			}else{
				var filterData = [];
				for(var i = 0, len = this.data.length; i < len; i++){
					if(this.data[i].text.toLowerCase().indexOf(q.toLowerCase()) != -1){
						filterData.push(this.data[i]);
					}
				}
				this.data = filterData;
//				console.debug(this.data);
				this.replaceList();
				this.expand();
//				this.restrictList();
//				this.alignList();
				if(this.data.length > 0){
//					this.restrictList();
					this.selectByIndex(0, notSetValue);
					if(!notSetValue)
						this.selectText(q.length);
				}
				this.data = this.cacheDate;
				this.filtered = true;
			}
		}
		
		,selectByValue : function(q, notSetValue){
//			console.debug("q=" + q);
//			if(this.url && this.hasQuery){
////				$.debug("query");
//				this.paras = {};
//				this.loadData();
//				this.hasQuery = false;
//			}
			var index = -1;
			for(var i = 0, len = this.data.length; i < len; i++){
				if(this.data[i].text.indexOf(q) != -1){
					index = i;
					break;
				}
			}
			if(index > -1){
//				$.debug(index);
				this.selectByIndex(index, notSetValue);
			}
			
		}
		
		,getValue : function(){
			return this.el.val();
		}
		
		,setValue : function(value){
			this.value = value;
			this.el.val(value);
		}
		
		,isExpanded : function(){
			return this.list && this.list.is(':visible');
		}
		
		,collapse : function(){
	        if(!this.isExpanded()){
	            return;
	        }
	        this.list.hide();
	        $(document).unbind("mousedown");
	        this.triggerHandler('collapse');
	    }
		
		,expand : function(){
//			$.debug('expand');
			if(this.data.length < 1){
				this.collapse();
				return;
			}
			if(!this.isExpanded()){
				$(document).bind("mousedown", $.proxy(this, "triggerBlur"));
				this.showList();
				this.triggerHandler('expand');
			}
			this.restrictList();
			this.alignList();
		}

		,restrictList : function(){
			
			var height = Math.min(this.listInner.height(), this.maxHeight);
			this.setListHeight(height);
//			$.debug("this.list[0].clientWidth = " + this.list[0].clientWidth);
//			$.debug("this.list[0].clientWidth = " + this.list[0].clientWidth);
//			$.debug("this.listInner.width() = " + this.listInner.width());
//			this.listInner.width(this.list[0].clientWidth);
			
		}
		
		,setListHeight : function(height){
			this.list.height(height);
		}
		
		,alignList : function(){
			var target = this.el;
//			var target = $(target);
			var p = target.offset();
//			console.debug(offset[1]);
			var left, top;
			left = p.left ;
			var targetHeight = target.outerHeight();
			top = p.top + targetHeight ;
			var elWidth = this.list.width();
			var elHeight = this.list.height();
			var screenWidth = $(window).width();
			var screenHeight = $(window).height();
			
			if((left + elWidth) > screenWidth){
				left =  left - elWidth ;
				if(left < 0)
					left = 0;
			}
//			console.debug(top + elHeight)
//			console.debug(screenHeight)
//			console.debug("p.top = " + p.top)
			if((top + elHeight) > screenHeight){
				_top = p.top - elHeight;
//				console.debug(_top)
				if(_top < 0){
					var downHeight = screenHeight - top ;
					if(_top < downHeight){
						this.setListHeight(downHeight);
					}else{
						top = 0;
						this.setListHeight(p.top);
					}
				}else{
					top = _top;
				}
			}
//			console.debug(left);
//			console.debug(top);
			this.list.css('left', left);
			this.list.css('top', top);
//			this.list.show(speed);
		}
		
		,showList : function(speed){
			this.list.show(speed);
		}
		
		,selectText : function(start, end){
	        var v = this.getValue();
	        var doFocus = false;
	        if(v.length > 0){
	            start = start === undefined ? 0 : start;
	            end = end === undefined ? v.length : end;
	            var d = this.el[0];
	            if(d.setSelectionRange){
	                d.setSelectionRange(start, end);
	            }else if(d.createTextRange){
	                var range = d.createTextRange();
	                range.moveStart('character', start);
	                range.moveEnd('character', end-v.length);
	                range.select();
	            }
	        }else{
	            doFocus = true;
	        }
	        if(doFocus){
	            this.el.focus();
	        }
	    }
		
		/**
		 * reset to original value
		 */
		,reset : function(){
			this.setValue(this.originalValue);
		}
		
		,delay : function(fn, timeout){
			return setTimeout($.proxy(fn, this), timeout);
		}
		
		,removeDelay : function(tm){
			clearTimeout(tm);
		}
		
		,loadData : function(){
			if(this.url){
//				$.debug(this.paras.combobox);
				$.ajax({
					dataType : 'json'
					,async : false
					,type : 'POST'
					,url : this.url
					,data : this.paras
					,cache : this.cache
					,timeout : this.timeout || 60000
					,contentType: "application/x-www-form-urlencoded; charset=UTF-8"
					,success : $.proxy(this.loadSuccess, this)
				});
			}else{
				this.replaceList();
			}
		}
		
		,loadSuccess : function(data){
			this.data = data;
			this.replaceList();
		}
		
		,bind : function(arg0, arg1, arg2){
			arg0 = arg0.toLowerCase();
			if(typeof arg1 == 'object')
				return this.el.bind(arg0, arg1, arg2);
			else 
				return this.el.bind(arg0, arg1);
		}
		
		,trigger : function( event, data){
			return this.el.trigger(event, data);
		}
		
		,triggerHandler : function(type, data, srcEvent){
			type = type.toLowerCase();
			if(srcEvent){
				if( this.el[0] ){
					var event = srcEvent;
					event.type = type;
					//the trigger element actually
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
	
	$.fn.combobox = function(cfg){
		return new $.uiwidget.Combobox(this, cfg);
	};
	
	$.fn.extend({
		getOffsetsTo: function(offsetParent) {
			if ( !this[0] ) {
				return null;
			}

			var elem = this[0],
			offset       = this.offset(),
			parentOffset = /^body|html$/i.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

			offset.top  -= parseFloat( jQuery.curCSS(elem, "marginTop",  true) ) || 0;
			offset.left -= parseFloat( jQuery.curCSS(elem, "marginLeft", true) ) || 0;

			parentOffset.top  += parseFloat( jQuery.curCSS(offsetParent[0], "borderTopWidth",  true) ) || 0;
			parentOffset.left += parseFloat( jQuery.curCSS(offsetParent[0], "borderLeftWidth", true) ) || 0;

			return {
				top:  offset.top  - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}
	});
	
})(jQuery);	