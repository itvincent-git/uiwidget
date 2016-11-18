/**
* res专用分页栏
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @date 2010-02-24
* @version 1.0.1
*/
if(window.$ && $.uiwidget && $.uiwidget.PageToolbar){
	$.uiwidget.PageToolbar.prototype.addJumperButtonEvent = function(){
		var t = this;
		this.toolbar.find('.grid-jumper-res').click(function(){
			t.handlerPageNumberEvent(t.getPageNumberEl());
		});
	};
	
	$.uiwidget.PageToolbar.prototype.getJumperButtonHtml = function(){
		return ['<input type="button" class="grid-jumper-res" value="'
		        , this.grid.jumperText
		        , '"/>'].join('');
	};
};

$.uiwidget.Grid.prototype.pageToolbar = new $.uiwidget.PageToolbar();