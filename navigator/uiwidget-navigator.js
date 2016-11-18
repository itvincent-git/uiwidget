/**
* uiwidget.navigator
* 
* 
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.Navigator = function(target, cfg){
		$.extend(this, cfg);
		this.navigator = target;
		this.init();
		this.render();
	};
	
	$.uiwidget.Navigator.prototype = {
		nav : []
		,rowNum : 0
		,flowchart : '业务流程图'
		,exit : '退出'
		,init : function(){

		}
		
		,render : function(){
			this.renderHead();//render header
			
			this.renderBody();//render body
			
			this.renderFooter();//render footer
			
			this.renderProxy();//render proxy
			
			this.renderGhost();

			//append the nav to the target
			$(this.navigator).addClass('uiwidget-navigator-nav-allmenu').append(this.nav.join(''));
			
			var height = $(this.navigator).height();
			
			if(this.rowNum<=5){
				height = 180;
			}else if(this.rowNum>=6 && this.rowNum<=7){
				height = 260;
			}else if(this.rowNum>=8 && this.rowNum<=9){
				height = 300;
			}else if(this.rowNum>=10 && this.rowNum<=11){
				height = 410;
			}else{
				height = 460;				
			}
			
			$(this.navigator).height(height);

			var ifm = this.hrefTarget;

			$("ul.uiwidget-navigator-menu-second").children().click(function (){
				$('#'+ifm).attr('src',$(this).attr('href'));
			});//add nav click event
			
			var t = this;
						
			$(document).click(function(){
				t.hide();
			});

			$(document).blur(function(){
				t.hide();
			});
						
			if(document.all){//for IE
				$('#'+ifm).focus(function(){
					t.hide();
				});
			}
		}
		,renderHead : function(){
			this.nav.push('<ul class="uiwidget-navigator-nav-allmenu-top">');
			this.nav.push('<li class="uiwidget-navigator-left"></li>');
			this.nav.push('<li class="uiwidget-navigator-center" style="width: 425px;"></li>');
			this.nav.push('<li class="uiwidget-navigator-right"></li>');
			this.nav.push('</ul>');
		}
		,renderBody : function(){
			this.nav.push('<ul class="uiwidget-navigator-nav-allmenu-middle">');
			this.nav.push('<li class="uiwidget-navigator-left"></li>');
			this.nav.push('<li class="uiwidget-navigator-center" style="width: 534px;">');
			this.nav.push('<div class="uiwidget-navigator-content">');
			for(var i=0;i<this.data.length;i++){
				var vi = this.data[i];
				this.nav.push('<div class="uiwidget-navigator-menu-first" title="', vi.text ,'">', vi.text);
				this.rowNum++;
				if(vi.children.length > 0){
					this.rowNum+=vi.children.length%6==0?vi.children.length/6:parseInt(vi.children.length/6)+1;
					this.nav.push('<ul class="uiwidget-navigator-menu-second">');
					for(var j=0;j<vi.children.length;j++){
						var vj = vi.children[j];
						this.nav.push('<li href="', vj.href ,'"><a href="javascript:void(0);" title="', vj.text ,'">', vj.text ,'</a></li>');
						if(j==vi.children.length-1)
							this.nav.push('<br style="clear: left;" />');
					}
					this.nav.push('</ul>');
				}
				this.nav.push('</div>');
			}
			this.nav.push('</div>');
			this.nav.push('</li>');
			this.nav.push('<li class="uiwidget-navigator-right"></li>');
			this.nav.push('</ul>');
		}
		,renderFooter : function(){
			this.nav.push('<ul class="uiwidget-navigator-nav-allmenu-footer">');
			this.nav.push('<li class="uiwidget-navigator-left"></li>');
			this.nav.push('<li class="uiwidget-navigator-center" style="width: 506px;">');
			this.nav.push('<div class="uiwidget-navigator-flow-chart">', this.flowchart ,'</div>');
			this.nav.push('<div class="uiwidget-navigator-quit">', this.exit ,'</div>');
			this.nav.push('<div class="uiwidget-navigator-line"></div>');
			this.nav.push('</li>');
			this.nav.push('<li class="uiwidget-navigator-right"></li>');
			this.nav.push('</ul>');
		}
		,renderProxy : function(){
			this.nav.push('<iframe src="" frameborder="0" scrolling="no"></iframe>');
		}
		,renderGhost : function(){
			this.navigator.after('<div style="border: 1px solid #09759B;display:none;position: absolute; left: 0px; top: 10px;z-index:2009;"></div>');
			//this.ghost = this.navigator.next('navigator-ghost');
		}
		,show : function(){
			var viewDiv = this.navigator.next();
			var mainDiv = this.navigator;
			var w = 0;
			var h = 0;
			var t = 0;
			var l = 0;
			mainDiv.show();
			var maxw = mainDiv.width();
			var maxh = mainDiv.height();
			var maxt = mainDiv.css('top');
			var maxl = mainDiv.css('left');
			mainDiv.hide();
			function doView(){
				w+=75;
				h+=55;
				t+=3;
				l+=1;
				if(w>=maxw||h>=maxh){
					viewDiv.width(maxw);
					viewDiv.height(maxh);
					viewDiv.css('top', maxt);
					viewDiv.css('left', maxl);
					viewDiv.hide();
					mainDiv.show();
					clearInterval(iIntervalId);
				}else{
					viewDiv.show();
					viewDiv.width(w);
					viewDiv.height(h);
					viewDiv.css('top', t);
					viewDiv.css('left', l);
				}
			}
			iIntervalId=setInterval(doView, 5);
		}
		,hide : function(){
			var viewDiv = this.navigator.next();
			var mainDiv = this.navigator;
			mainDiv.hide();
			viewDiv.show();
			var w = viewDiv.attr('offsetWidth');
			var h = viewDiv.attr('offsetHeight');
			var t = parseInt(viewDiv.css('top'));
			var l = parseInt(viewDiv.css('left'));
			function doHide(){
				w-=75;
				h-=55;
				t-=3;
				l-=1;
				if(w<=0||h<=0){
					viewDiv.width(0);
					viewDiv.height(0);
					viewDiv.css('top', 10);
					viewDiv.css('left', 0);
					viewDiv.hide();
					clearInterval(iIntervalId);			
				}else{
					viewDiv.width(w);
					viewDiv.height(h);
					viewDiv.css('top', t);
					viewDiv.css('left', l);
				}
			}
			iIntervalId=setInterval(doHide,1);
		}
	};
	
	$.fn.navigator = function(cfg){
		return new $.uiwidget.Navigator(this, cfg);
	};
})(jQuery);	