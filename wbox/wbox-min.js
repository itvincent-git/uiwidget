(function(a){a.fn.wBox=function(c){var g={wBoxURL:"images/",opacity:0.5,callBack:null,onClose:null,requestType:null,target:null,showClose:true,timeout:0,param:null,iframeID:"iframe",iframeWH:{width:"",height:""},html:"",title:""},o=this;var h=a.extend(g,c);var k=a(top.window);var u=top.window.document;var d=a(top.window.document.body);var r=a(this);var s=u.createElement("div");a(s).attr("id","wBox");var n='<div class="wBox_popup"><table cellspacing="0" cellpadding="0" class="wbox"><tr class="wbox-header"><td class="left"/><td class="mid wBox_dragTitle"><span class="wBox_itemTitle">'+h.title+"</span>"+(h.showClose?'<a href="#" class="wBox_close" title="关闭"></a>':"")+'</td><td class="right"/></tr><tr class="wbox-body"><td class="left">&nbsp;</td><td><div class="wBox_body"><div class="wBox_content" id="wBoxContent"></div></div></td><td class="right"><div>&nbsp;</div></td></tr><tr class="wbox-bottom"><td class="left"/><td class="mid"/><td class="right"/></tr></table></div>';this.boxDIV=a(s).append(n);var m=null;var i=null;this.showBox=function(){var y=d.find("#wBox_overlay").length>0;var x=d.find("#wBox").length;if(y){var z=d.find("#wBox_overlay");var v=z.css("z-index");m=z.css("z-index",parseInt(v)+(x==1?x+1:x)).css("width",k.width()).css("height",k.height())}else{m=a("<div id='wBox_overlay'></div>").addClass("wBox_overlayBG").css("opacity",h.opacity).appendTo(d).fadeIn(300);if(a.browser.msie&&(a.browser.version=="6.0")&&!a.support.style){m.append("<iframe frameborder='0' src='javascript:;'></iframe>")}}u.body.appendChild(s);i=a(s);i.css("z-index",parseInt(m.css("z-index"))+1);f()};function f(){var v=i.find("#wBoxContent");if(h.requestType&&h.requestType=="iframe"){v.html("<div class='wBox_load'><div id='wBox_loading'><img src='"+h.wBoxURL+"loading.gif' /></div></div>");ifrHtml=u.createElement("iframe");ifr=a(ifrHtml);ifr.attr("id",h.iframeID+"_iframe");ifr.attr("name","wBoxIframe");ifr.attr("title",h.title);ifr.attr("src",h.target);ifr.attr("scrolling","auto");ifr.attr("frameborder","0");if(h.iframeWH.height){ifr.css("height",Math.min(k.height(),h.iframeWH.height))}if(h.iframeWH.width){ifr.css("width",Math.min(k.width(),h.iframeWH.width))}ifr.appendTo(v.empty());ifr.load(function(){ifrHtml.contentWindow.document.title=h.title;try{$it=a(this).contents();$it.find(".wBox_close").click(j);fH=$it.height();fW=$it.width();w=k;newW=Math.min(w.width()-40,fW);newH=w.height()-60;newH=Math.min(newH,fH);if(!newH){return}var x=p(newW,newH+60);i.css({left:x[0],top:x[1]});a(this).css({height:newH,width:newW})}catch(y){}});ifrHtml.contentWindow.closeWin=function(){o.close.apply(o,arguments)};ifrHtml.contentWindow.cancelWin=function(){o.cancel.apply(o,arguments)}}else{if(h.html){v.html(h.html);v.css({overflow:"auto",height:h.iframeWH.height?Math.min(k.height(),h.iframeWH.height):400,width:h.iframeWH.width?Math.min(k.width(),h.iframeWH.width):600})}else{r.clone(true).show().appendTo(v.empty())}}e()}function e(){b();i.show().find(".wBox_close").click(j).hover(function(){a(this).addClass("on")},function(){a(this).removeClass("on")});typeof h.callBack==="function"?h.callBack():null;if(h.timeout){setTimeout(j,h.timeout)}q()}function b(){if(!i){return false}var A=i.width(),z=i.height(),y=p(A,z);i.css({left:y[0],top:y[1]});var x=a("body").height(),v=k.height(),B=k.width();x=Math.max(x,v);m.height(x).width(B)}function p(v,x){l=(k.width()-v)/2;t=(k.height()-x)/2+k.scrollTop();return[l,t]}function q(){var A,y,z;var C=i.find(".wBox_dragTitle").css("cursor","move");C.bind("selectstart",function(){return false});C.mousedown(function(D){A=D.clientX-parseInt(i.css("left"));y=D.clientY-parseInt(i.css("top"));i.mousemove(x).mouseout(B);C.mouseup(v)});function x(D){z=false;if(D.clientX-A<0){l=0}else{l=D.clientX-A}if(D.clientY-y<0){t=0}else{t=D.clientY-y}i.css({left:l,top:t})}function B(D){z=true;setTimeout(function(){z&&v(D)},10)}function v(D){i.unbind("mousemove",x).unbind("mouseout",B);C.unbind("mouseup",v)}}function j(v){if(i){i.stop().fadeOut(300,function(){if(navigator.userAgent.indexOf("MSIE")>0){a(this).contents().find("iframe").remove();CollectGarbage()}i.remove();if(typeof(v)==="function"){v()}var y=d.find("#wBox").length;if(y>0){var x=parseInt(m.css("z-index"));m.css("z-index",x-2)}else{if(navigator.userAgent.indexOf("MSIE")>0){m.contents().find("iframe").remove();CollectGarbage()}m.remove()}})}}this.cancel=function(){j()};this.close=function(){var v=arguments;var x=this;j(function(){if(typeof h.onClose==="function"){h.onClose.apply(x,v)}})};this.reload=function(v){var x=a(this).contents().find("iframe");if(h.iframeWH.height){x.height(h.iframeWH.height)}else{x.height("")}if(h.iframeWH.width){x.width(h.iframeWH.width)}else{x.width("")}if(v){x.attr("src",v)}else{x.load(h.target)}};this.changeTitle=function(v){i.find("span.wBox_itemTitle").html(v);i.find("iframe").attr("title",v);i.find("iframe")[0].contentWindow.document.title=v};this.param=h.param;o.showBox();return this}})(jQuery);