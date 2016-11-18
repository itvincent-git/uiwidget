/*
 * 功能:提供div弹出窗口
 * 1.windowOpen 打开div弹出窗口方法
 * 2.windowClose 关闭div弹出窗口方法
 * 3.windowResize 改变div弹出窗口大小方法,用于上一步和下一步操作使用
 * 4.forwardAndResize 作用相当于转跳页面然后改变窗口大小
 * 5.backAndResize 相当于浏览器的history.back()功能然后改变窗口大小
 * 6.showMask 显示遮罩
 * 7.hideMask 隐藏遮罩
 * @author 钟永生
 * @version 1.2.1
 * @date 2009-2-17
 */
//弹出窗口
var win;
var windowOpen;
var windowClose;
var windowResize;
if(top != this){
		if(windowOpen == undefined){
			windowOpen =  top.windowOpen;
		}
		if(windowClose == undefined){
			windowClose = top.windowClose;
		}
		if(windowResize == undefined){
			windowResize = top.windowResize;
		}
}else{
	/**
	 * 打开div弹出窗口方法
	 * @param url 弹出窗口的连接
	 * @param winid 弹出窗口id
	 * @param winHeight 弹出窗口的高度
	 * @param winWidth 弹出窗口的宽度
	 * @param modal 是否为模态窗,默认为true,即此窗口不关闭,不能进行之前的页面操作,true为模态窗,false为普通窗口
	 * @param ifid 弹出窗口iframe的id
	 */	
	windowOpen = function(){
		var config = {};
		if(Ext.type(arguments[0]) == 'object'){
			config = arguments[0];
			var url=arguments[0].url, winId=arguments[0].winId, winTitle=arguments[0].winTitle;
			var winHeight=arguments[0].winHeight, winWidth=arguments[0].winWidth;
			var modal=arguments[0].modal, ifid=arguments[0].ifid;
		}else{
			var url=arguments[0], winId=arguments[1], winTitle=arguments[2];
			var winHeight=arguments[3], winWidth=arguments[4];
			var modal=arguments[5], ifid=arguments[6];
		}
		if(Ext.WindowMgr.get(winId) != null){
			Ext.WindowMgr.bringToFront(winId);
			return;
		}
		winHeight = (winHeight== null||winHeight==undefined)? 300: winHeight;
		winWidth = (winWidth== null||winWidth==undefined)? 500: winWidth;    
		
		var wrap = {
		tag:"div"
		,id:winId+"_wrap"
		};
	    var iframe = {
	    tag: "iframe"
	    ,id:ifid||(winId+'Ifm')
	    ,src: Ext.isIE ? url||'' : ''
	    ,name:ifid||(winId+'Ifm')
	    ,height:"100%"
	    ,width:"100%"
	    ,frameborder:"0"
	    ,scrolling:"auto"
	    ,style:"position:relative"
		};
		
		var wrapEl = Ext.DomHelper.append(document.body, wrap, true);
		var ifEl = Ext.DomHelper.append(wrapEl, iframe, true);
		delete iframe;
		
		var loadMask;
		if(config.loadMask !== false){
		}
		
		var h= Ext.isIE?'onreadystatechange':'onload';
    	ifEl.dom[h] = ifEl.dom[h]?
        	ifEl.dom[h].createSequence(loadHandler,ifEl):
        	loadHandler.createDelegate(ifEl);
        function loadHandler(e){
        	
        	var rstatus = (e && typeof e.type !== 'undefined'?e.type:ifEl.dom.readyState );
	         switch(rstatus){
	            case 'loading':
	               break;
	            case 'load':
	            case 'interactive':
	            	Ext.apply(ifEl.dom.contentWindow,
	            		{windowOpen:windowOpen
	            		,windowClose:windowClose.createCallback(winId)
	            		,windowResize:windowResize.createDelegate(window, [winId], 0)
	            		,forwardAndResize:forwardAndResize.createDelegate(window, [winId], 0)
	            		,backAndResize:backAndResize.createDelegate(window, [winId], 0)
	            		,showMask:showMask.createDelegate(window, [winId], 0)
	            		,hideMask:hideMask.createDelegate(window, [winId], 0)
	            		});
	            case 'complete':
	           		if(loadMask && loadMask.hide){
	            		loadMask.hide();
	           		}
	               break;
	            default:
	        }
        }
         
		win = new Ext.Window({
            	id: winId,
            	title: winTitle || '',
                width:winWidth ,
                height:winHeight ,
                modal:  modal===false ? false : true,
                autoScroll: true,
                constrain: true,
				onEsc:config.onEsc || Ext.emptyFn,
				body: wrapEl,
				ifm:ifEl,
				loadMask:loadMask,
				draggable:config.draggable === false? false:true,//是否可拖拉,默认为true
				maximizable:config.maximizable === true? true:false,//是否可以最大化,默认为false
				minimizable:config.minimizable === true? true:false,//是否可以最小化,默认为false
				resizable:config.resizable === true? true:false,//是否可以改变大小,默认为false
				beforeDestroy : function(){
			        Ext.destroy(
			            this.resizer,
			            this.dd,
			            this.proxy,
			            this.mask
			        );
			       	delete this.mask;
			       	var ifm = this.ifm;
			       	if(ifm.dom){
			             ifm.dom.onreadystatechange=null;
			             ifm.dom.onload            =null;
			             if(ifm.dom.src){
			                ifm.dom.src = 'javascript:false';
			             }
			             Ext.removeNode(ifm.dom);
			             if(Ext.isGecko)
						 	delete window.frames[ifm.id];
			        }
			             
			        Ext.Window.superclass.beforeDestroy.call(this);
			    }
        });
        
		win.on('resize', function(panel, width, height){
			var ifa = Ext.get(iframe.id);
			var ifh = panel.getInnerHeight();
			var ifw = panel.getInnerWidth();
			ifa.setHeight(ifh);
			ifa.setWidth(ifw);
		});
		win.on('beforeshow', function(thisWin){
			var maxWidth = Ext.lib.Dom.getViewWidth(true);
			var maxHeight = Ext.lib.Dom.getViewHeight(true);
			if(thisWin.width > maxWidth ){
				thisWin.setWidth(maxWidth - thisWin.getFrameWidth()/1.5);
			}
			if(thisWin.height > maxHeight){
				thisWin.setHeight(maxHeight - thisWin.getFrameHeight()/1.5);
			}
		});
		
		if(config.beforeClose)
			win.on('beforeclose', config.beforeClose);

        win.show();
        if(Ext.isGecko)
        	ifEl.dom.src = url;   
        if(loadMask){
        	loadMask.show();
        }
	}

	/**
	* 关闭div弹出窗口方法	
	* 
 	* @param winId 要关闭的窗口id
 	*/
  	windowClose = function(){
       	if(arguments.length == 1 && (typeof arguments[0]) == 'string'){
			var closeWin = Ext.WindowMgr.get(arguments[0]);
			if(closeWin == null) return;
			closeWin.close();
       	}
   	}
        
	/**
	 * 改变div弹出窗口大小方法,用于上一步和下一步操作使用
	 * 
	 * @param winId 要改变大小的窗口id
	 * @param heigth 窗口高度
	 * @param width 窗口宽度
	 */        
	windowResize = function(){
      	if(arguments.length == 3 && (typeof arguments[0]) == 'string'){
			var resizeWin = Ext.WindowMgr.get(arguments[0]);
			resizeWin.setHeight(arguments[1]);
			resizeWin.setWidth(arguments[2]);
			resizeWin.center();
       	}
	}
	
    /**
     * 相当于转跳页面然后改变窗口大小
     * @param winId 要改变大小的窗口id
     * @param url 跳转的url连接
     * @param heigth 窗口高度
     * @param width 窗口宽度
     */
    forwardAndResize = function(){
    	if(arguments.length == 4 && typeof arguments[0] == 'string'){
    		var resizeWin = Ext.WindowMgr.get(arguments[0]);
    		resizeWin.ifm.dom.contentWindow.location.href=arguments[1];
    		windowResize(arguments[0], arguments[2], arguments[3]);
    	}
    }
        
    /**
     * 相当于浏览器的history.back()功能然后改变窗口大小
     * @param winId 要改变大小的窗口id
     * @param heigth 窗口高度
     * @param width 窗口宽度
     */
    backAndResize = function(){
    	if(arguments.length == 3 && typeof arguments[0] == 'string'){
    		var resizeWin = Ext.WindowMgr.get(arguments[0]);
	    	resizeWin.ifm.dom.contentWindow.history.back();
	    	windowResize(arguments[0], arguments[2], arguments[3]);
    	}
    }
    /**
     * 显示遮罩
     * @param winId 窗口id
     */
    showMask = function(){
    	var w = Ext.WindowMgr.get(arguments[0]);
    	if(w.loadMask)
    		w.loadMask.show();
    }
    /**
     *  隐藏遮罩
     * @param winId 窗口id
     */
    hideMask = function(){
    	var w = Ext.WindowMgr.get(arguments[0]);
    	if(w.loadMask && w.loadMask.hide)
    		w.loadMask.hide();
    }

    /**
	 * 改变div弹出窗口的标题
	 * 
	 * @param winId 要改变大小的窗口id
	 * @param title 窗口标题
	 * 
	 */
	setWindowTitle = function(){
		if(arguments.length == 2 && typeof arguments[0] == 'string'){
			var divWindow = Ext.WindowMgr.get(arguments[0]);
			divWindow.setTitle(arguments[1]);
		}
	}

	setInterval(Ext.Element.garbageCollect, 10000);
	if(Ext.isIE)
		setInterval(CollectGarbage, 10000);
}