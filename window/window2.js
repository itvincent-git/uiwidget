/*
 * 功能:提供div弹出窗口
 * 1.windowOpen 打开div弹出窗口方法
 * 2.windowClose 关闭div弹出窗口方法
 * 3.windowResize 改变div弹出窗口大小方法,用于上一步和下一步操作使用
 * 4.forwardAndResize 作用相当于转跳页面然后改变窗口大小
 * 5.backAndResize 相当于浏览器的history.back()功能然后改变窗口大小
 * @author 钟永生
 * @version 2.0beta1
 */

Ext.ux.IFrameWindow = function(config){
	//url, winId, winTitle, winHeight, winWidth, modal, ifid
	Ext.apply(this, config);
	
	if(this.autoCreate !== false)
		this.windowOpen();
};

Ext.extend(Ext.ux.IFrameWindow , Ext.util.Observable,{
	
	windowOpen : function(){
		if(Ext.WindowMgr.get(this.winId) != null){
			Ext.WindowMgr.bringToFront(this.winId);
			return;
		}
		this.ifid = this.ifid||(this.winId+'Ifm');
		var wrap = {tag:"div",id:this.winId+"_wrap"};
		
	    var iframe = {tag: "iframe", id:this.ifid, name:this.ifid
	    	,src:this.url||'', height:"100%", width:"100%", frameborder:"0",scrolling:"auto"};
		
	    this.wrapEl = Ext.DomHelper.append(document.body, wrap, true);
		this.ifEl = Ext.DomHelper.append(this.wrapEl, iframe, true);
		this.ifEl.ifw = this;
		
		delete wrap;
		delete iframe;
		
		
		var h= Ext.isIE?'onreadystatechange':'onload';
    	this.ifEl.dom[h] = this.ifEl.dom[h]?
        	this.ifEl.dom[h].createSequence(this.loadHandler,this)
        	:this.loadHandler.createDelegate(this);
        
        
		this.win = new Ext.Window({
            	id: this.winId,
            	title: this.winTitle || '',
                width:this.winWidth || 500 ,
                height:this.winHeight || 300 ,
                modal: this.modal == null ? true: this.modal,
                autoScroll: true,
                constrain: true,
				onEsc:Ext.emptyFn,
				body: this.wrapEl,
				beforeDestroy : function(){
			        Ext.destroy(
			            this.resizer,
			            this.dd,
			            this.proxy,
			            this.mask
			        );
			       	delete this.mask;
			        Ext.Window.superclass.beforeDestroy.call(this);
			    }
        });
        this.win.on('resize', function(thisWin, width, height){
        	this.ifEl.setHeight(thisWin.getInnerHeight());
        	this.ifEl.setWidth(thisWin.getInnerWidth());
		}, this);
		this.win.on('beforeshow', function(thisWin){
			maxWidth = Ext.lib.Dom.getViewWidth(true);
			maxHeight = Ext.lib.Dom.getViewHeight(true);
			if(thisWin.width > maxWidth ){
				thisWin.setWidth(maxWidth - thisWin.getFrameWidth()/1.5);
			}
			if(thisWin.height > maxHeight){
				thisWin.setHeight(maxHeight - thisWin.getFrameHeight()/1.5);
			}
		});
		this.win.on('close', function(thisWin){
			this.destroy(this);
		},this);
		        
       	
        this.win.show();
        Ext.ux.IFrameWindowManager.register(this);
	}
	
	,loadHandler : function(e){
        	
	       var rstatus = (e && typeof e.type !== 'undefined'?e.type:this.ifEl.dom.readyState );
	         switch(rstatus){
	            case 'loading':
	               //this.showMask();
	               break;
	            case 'load':
	               //this.fireEvent("documentloaded",this);
	               //this.hideMask();
	               //break;
	            case 'interactive':
	            	/*Ext.apply(this.ifEl.dom.contentWindow,
	            		{windowOpen:windowOpen
	            		,windowClose:windowClose.createCallback(this.winId)
	            		,windowResize:windowResize.createDelegate(window, [this.winId], 0)
	            		,forwardAndResize:forwardAndResize.createDelegate(window, [this.winId], 0)
	            		,backAndResize:backAndResize.createDelegate(window, [this.winId], 0)
	            		,showMask:showMask.createDelegate(window, [this.winId], 0)
	            		,hideMask:hideMask.createDelegate(window, [this.winId], 0)
	            		});
	            	*/
	            case 'complete':
	            	//Ext.ux.IFrameManager.register(this.ifEL);
	            	break;
	            default:
	        }
        }
        
	,destroy : function(ifw){
       		var ifm = ifw.ifEl;
	        if(ifm.dom){
	             ifm.dom.onreadystatechange=null;
	             ifm.dom.onload            =null;
	             if(ifm.dom.src){
	                ifm.dom.src = 'javascript:false';
	             }
	             Ext.removeNode(ifm.dom);
	        }
	        ifm.remove();
	        ifw.win.destroy();
   		}
	/**
	* 关闭div弹出窗口方法	
	* @deprecated 用于兼容过去版本
	* 
 	* @param winId 要关闭的窗口id
 	*/
  	,close : function(){
		this.win.close();
   	}
        
	/**
	 * 改变div弹出窗口大小方法,用于上一步和下一步操作使用
	 * @deprecated 用于兼容过去版本
	 * 
	 * @param winId 要改变大小的窗口id
	 * @param heigth 窗口高度
	 * @param width 窗口宽度
	 */        
	,resize : function(heigth, width){
			this.win.setHeight(heigth);
			this.win.setWidth(width);
			this.win.center();
	}
	
    /**
     * 相当于转跳页面然后改变窗口大小
     * @param winId 要改变大小的窗口id
     * @param url 跳转的url连接
     * @param heigth 窗口高度
     * @param width 窗口宽度
     */
    ,forwardAndResize : function(url, heigth, width ){
    	this.ifEl.dom.contentWindow.location.href=url;
    	this.resize(heigth, width);
    }
        
    /**
     * 相当于浏览器的history.back()功能然后改变窗口大小
     * @param winId 要改变大小的窗口id
     * @param heigth 窗口高度
     * @param width 窗口宽度
     */
    ,backAndResize : function(){
	    this.ifEL.dom.contentWindow.history.back();
	    this.resize(heigth, width);
    }
});

Ext.ux.IFrameManager = function(){
	var frames = {},namedFrames={};
	return {
		register : function(frame){
		    frame.manager = this;
		    return frames[frame.id] = namedFrames[frame.dom.name||frame.id] = frame;
		},
		ueRegister : function(frame){
		    delete frames[frame.id];
		    delete namedFrames[frame.dom.name||frame.id];
		},
		getFrameById  : function(id){
		    return frames[id] || null;
		},
		
		getFrameByName : function(name){
		    return namedFrames[name] || null;
		}

	}
}();

Ext.ux.IFrameWindowManager = function(){
	var wins = {}, frames = {};
	return {
		register : function(win){
		    win.manager = this;
		    //alert(win.winId)
		    wins[win.winId] = win;
		    //alert(win.ifid)
		    frames[win.ifid] = win;
		    //return wins[win.winId] = win;
		}
		,getById  : function(id){
		    return wins[id] || null;
		}
		,getByIFrameId : function(id){
			return frames[id] || null;
		}
		,getIFrameIdByWindow : function(w){
			return w.frameElement.id || null;
		}
		/**
		 * get the IFrameWindow by Window element
		 */
		,getByWindow : function(w){
			return this.getByIFrameId(this.getIFrameIdByWindow(w)) || null;
		}
		/**
		 * close the win by Window element
		 * @param w The window element
		 */
		,close : function(w){
			this.getByWindow(w).win.close();
		}
		
	}
}();

wm = Ext.ux.IFrameWindowManager;