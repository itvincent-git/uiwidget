	jQuery(document).ready(function($) {        

        $.history.init(function(url) {//��ʼ��history�¼���������$.history.load()ʱ���ᴥ������еĴ���
            $('#content').load((url == "" ? "1" : url) + ".html");
        });

        $('#ajax-links a').live('click', function(e) {
			var url = $(this).attr('href');//ȡ����ǰurl
			url = url.replace(/^.*#/, '');//��ȡ#�����Ϣ
			$.history.load(url);
			return false;
		});
	});
