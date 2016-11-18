	jQuery(document).ready(function($) {        

        $.history.init(function(url) {//初始化history事件，当调用$.history.load()时，会触发封包中的代码
            $('#content').load((url == "" ? "1" : url) + ".html");
        });

        $('#ajax-links a').live('click', function(e) {
			var url = $(this).attr('href');//取出当前url
			url = url.replace(/^.*#/, '');//截取#后的信息
			$.history.load(url);
			return false;
		});
	});
