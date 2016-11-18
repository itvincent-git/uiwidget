/**
* Messagebox提示窗口
*
* @author Shilei(shilei@ceopen.cn) Vincent(zhongyongsheng@ceopen.cn) 
* @data 09-05-12
* @version 1.0.0 
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	/**
	* Messagebox
	*/
	$.uiwidget.Messagebox = function(target, cfg){
		$.extend(this, cfg);
		this.messagebox = $(target);
		this.init();
		this.render();
	};
	
	$.uiwidget.Messagebox.prototype = {
		OK_TEXT : '确 定'
		,CANCEL_TEXT : '取 消'
    ,CLOSE_TEXT : '关 闭'
		,ASK_TITLE : '提示'
		,ALERT_TITLE : '警告'
    ,SUCCESS_TITLE : '成功'
    ,ERROR_TITLE : '失败'
		,init : function(){
			
		}
		,render : function(){
		
		}
		,renderWindow : function(){
		   var windowContent = $(['<div class="msg-window-wrap" onselectstart="return false;" style="-moz-user-select: none;"><div class="msg-window-header"><div class="msg-window-header-left">',
					   '</div><div class="msg-window-header-content"><span></span></div><div class="msg-window-header-right"></div>',
					   '</div><div class="btn-msg-window-close-noraml"></div>',
					   '<div class="msg-window-container" >',
						 '<div class="msg-window-body"><div class="msg-window-body-left"></div><div class="msg-window-body-center"><div class="msg-window-ico-prompt"></div><div class="msg-window-msg-content"><table cellpadding="0" cellspacing="0"><tr><td></td></tr></table></div></div><div class="msg-window-body-right"></div>',
						 '</div>',
						 '<a href="#" id="msg-focus"/><div class="msg-window-button" >',
			       '</div> ',
			       '</div>',
			       '<div class="msg-window-bottom"><div class="msg-window-bottom-left"></div><div class="msg-window-bottom-middle"></div><div class="msg-window-bottom-right"></div></div>',
			       '</div>'].join(''));	
			  $(document.body).append(windowContent);
			  this.titleEl = windowContent.find('div.msg-window-header-content>span');
			  this.msgEl = windowContent.find('div.msg-window-msg-content td');
			  this.iconEl = windowContent.find('div.msg-window-body-center>div')[0];
			  this.buttonEl = windowContent.find('div.msg-window-button');
			  
        //只有title栏可以拖拽
        windowContent.drag({handler : $('.msg-window-header')});
			  return windowContent;
		}
		,renderMask : function(){
			 var maskContent = $('<div class="mask"><iframe frameborder="0" style="width:100%;height:100%"></iframe></div>');
			 $(document.body).append(maskContent);		 
		   return maskContent;  
		} 
		,message : function(args){
			//$.debug(args.msg);
			this.show();
			if(args.type)
				this[args.type](args);
			else
				this.customCommand(args);

			$(document.body).bind('keydown', {windowEl : this.windowEl}, this.keydown);
		}
		,keydown: function(e){			
			var key = e.which;
			if(key == 13){
				var	btns = e.data.windowEl.find("div.btn-order");
				if(btns.length > 0){
					var btn0 = btns.first();
					btn0.click();
				}
			}
		}
		//自定义提示
		,customCommand : function(args){			
			if(args.title)
			  this.setTitle(args.title);
				
			this.setMsg(args.msg);
						
			if(args.iconCls)
			  this.setIconCls(args.iconCls);
						  
			var mw = $('div.msg-window-wrap');
			//设置为居中
			mw.css('left', (document.body.clientWidth-mw[0].clientWidth)/2+document.body.scrollLeft);			
			mw.css('top',($(window).height()-mw[0].clientHeight)/2+document.body.scrollTop);
			//先清空原先按钮,再生成新按钮			
			if(args.buttons)
				 this.setButton(args.buttons);
			
			var t = this;
			//绑定按钮事件
			this.windowEl.find("div.btn-order").each(function(i){
			   $(this).bind("click", function(){
					 if(args.fn)
						args.fn({index:i},args.msg);
					 t.hide();
			 });
         /*
         $(this).find("li.middle-normal").mouseover(function(){
	    	    $(this).prev().addClass('left-over');
						$(this).addClass('middle-over');
						$(this).next().addClass('right-over');
					}).mouseout(function(){
						$(this).prev().removeClass('left-over');
						$(this).removeClass('middle-over');
						$(this).next().removeClass('right-over');
					});*/
					$(this).find("li.middle-normal").hover(function(){
	    	    $(this).prev().addClass('left-over');
						$(this).addClass('middle-over');
						$(this).next().addClass('right-over');
					},function(){
						$(this).prev().removeClass('left-over');
						$(this).removeClass('middle-over');
						$(this).next().removeClass('right-over');
					});
      });
      
		  //绑定'×'的事件
		  this.windowEl.find("div.btn-msg-window-close-noraml").unbind("click");
		  this.windowEl.find("div.btn-msg-window-close-noraml").hover(function(){	
				$(this).removeClass('btn-msg-window-close-noraml');   	    
							$(this).addClass('btn-msg-window-close-over');						
						},function(){
							$(this).removeClass('btn-msg-window-close-over');   	    
							$(this).addClass('btn-msg-window-close-noraml');	
						});
		  this.windowEl.find("div.btn-msg-window-close-noraml").bind("click", function(){
			  if(args.fn)
					 args.fn({index:-1},args.msg);
			  t.hide();
		  }); 
		}
		/**
		提示/询问,确定/取消按钮
		*/
		,ask : function(args){
			//设置默认值			
			this.setTitle(this.ASK_TITLE);			
			this.setIconCls('msg-window-ico-prompt');			
	    this.setButton([{text:this.OK_TEXT,iconCls:'ico-btn-order-ok'}, {text:this.CANCEL_TEXT,iconCls:'ico-btn-order-close'}]);
	    
      //调用自定义信息
      this.customCommand(args);
		}
		/**
		警告,确定/取消按钮
		String msg 提供信息
		[String title] 标题
		[Function fn] 确定后回调函数
		*/
		,alert : function(args){
			//设置默认值			
			this.setTitle(this.ALERT_TITLE);
			this.setIconCls('msg-window-ico-warning');			
	    this.setButton([{text:this.OK_TEXT,iconCls:'ico-btn-order-ok'}, {text:this.CANCEL_TEXT,iconCls:'ico-btn-order-close'}]);
	    
	    //调用自定义信息
      this.customCommand(args);
		}
		/**
		成功,关闭按钮
		*/
		,success : function(args){
			//设置默认值
			this.setTitle(this.SUCCESS_TITLE);			
			this.setIconCls('msg-window-ico-success');			
	    this.setButton([{text:this.OK_TEXT,iconCls:'ico-btn-order-ok'}]);
	    
	    //调用自定义信息
      this.customCommand(args);
		}
		/**
		失败/错误/异常,关闭按钮
		*/
		,error : function(args){
			//设置默认值
			this.setTitle(this.ERROR_TITLE);			
			this.setIconCls('msg-window-ico-error');			
	    this.setButton([{text:this.OK_TEXT,iconCls:'ico-btn-order-ok'}]);
	    
	    //调用自定义信息
      this.customCommand(args);
		}
		//弹出窗
		,getWindow : function(){
			return this.windowEl || (this.windowEl = this.renderWindow());
		}
		//遮罩
		,getMask : function(){
			return this.maskEl || (this.maskEl = this.renderMask());
		}
		//标题
		,setTitle : function(title){
			this.titleEl.html(title);
		}
		//设置信息
		,setMsg : function(text){
			this.msgEl.html(text);
		}
		//设置图标css
		,setIconCls : function(css){
			this.iconEl.className = css;			
		}
		//设置按钮
		,setButton : function(buttons){
			this.buttonEl.empty();
			
			for(var i=0;i<buttons.length;i++)
			  if(buttons[i].iconCls)
			    this.buttonEl.append(['<div class="btn-order"><ul><li class="left-normal"></li><li class="middle-normal"><input type="button" class="',buttons[i].iconCls,'"/>',buttons[i].text,'</li><li class="right-normal"></li></ul></div>'].join(''));
		    else
		    	this.buttonEl.append(['<div class="btn-order"><ul><li class="left-normal"></li><li class="middle-normal">',buttons[i].text,'</li><li class="right-normal"></li></ul></div>'].join(''));
		}		
		,show : function(){
			this.getWindow().show();
			this.getMask();
			//ie
			var newHeight = document.body.scrollHeight;			
			if(document.body.scrollHeight <= document.body.clientHeight){
			   newHeight = document.body.clientHeight;
			}
			//firefox
			if($.browser.mozilla) 
			   newHeight = $(document).height();
										
			$("div.mask").height(newHeight).show();
			this.windowEl.find('#msg-focus').focus();
		}
		,hide : function(){
			this.getWindow().hide();
			this.getMask().hide();
			$(document.body).unbind('keydown', this.keydown);
		}
	};
	
	$.messagebox = function(cfg){
		$.uiwidget.Messagebox.instance = $.uiwidget.Messagebox.instance || new $.uiwidget.Messagebox(document.body, {});
		return $.uiwidget.Messagebox.instance.message(cfg);
	};
})(jQuery);	