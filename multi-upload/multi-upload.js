/****************************以下是MultiFile插件*******************************************/
/*
 ### jQuery Multiple File Upload Plugin v1.44 - 2009-04-08 ###
 * Home: http://www.fyneworks.com/jquery/multiple-file-upload/
 * Code: http://code.google.com/p/jquery-multifile-plugin/
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 ###
*/

;if(window.jQuery) (function($){
 
	// plugin initialization
	$.fn.MultiFile = function(options){
		if(this.length==0) return this; // quick fail
		
		// Handle API methods
		if(typeof arguments[0]=='string'){
			// Perform API methods on individual elements
			if(this.length>1){
				var args = arguments;
				return this.each(function(){
					$.fn.MultiFile.apply($(this), args);
    });
			};
			// Invoke API method handler
			$.fn.MultiFile[arguments[0]].apply(this, $.makeArray(arguments).slice(1) || []);
			// Quick exit...
			return this;
		};
		
		// Initialize options for this call
		var options = $.extend(
			{}/* new object */,
			$.fn.MultiFile.options/* default options */,
			options || {} /* just-in-time options */
		);
		
		// Empty Element Fix!!!
		// this code will automatically intercept native form submissions
		// and disable empty file elements
		$('form')
		.not('MultiFile-intercepted')
		.addClass('MultiFile-intercepted')
		.submit($.fn.MultiFile.disableEmpty);
		
		//### http://plugins.jquery.com/node/1363
		// utility method to integrate this plugin with others...
		if($.fn.MultiFile.options.autoIntercept){
			$.fn.MultiFile.intercept( $.fn.MultiFile.options.autoIntercept /* array of methods to intercept */ );
			$.fn.MultiFile.options.autoIntercept = null; /* only run this once */
		};
		
		// loop through each matched element
		this
		 .not('.MultiFile-applied')
			.addClass('MultiFile-applied')
		.each(function(){
			//#####################################################################
			// MAIN PLUGIN FUNCTIONALITY - START
			//#####################################################################
			
       // BUG 1251 FIX: http://plugins.jquery.com/project/comments/add/1251
       // variable group_count would repeat itself on multiple calls to the plugin.
       // this would cause a conflict with multiple elements
       // changes scope of variable to global so id will be unique over n calls
       window.MultiFile = (window.MultiFile || 0) + 1;
       var group_count = window.MultiFile;
       
       // Copy parent attributes - Thanks to Jonas Wagner
       // we will use this one to create new input elements
       var MultiFile = {e:this, E:$(this), clone:$(this).clone()};
       
       //# USE CONFIGURATION
       if(typeof options=='number') options = {max:options};
       var o = $.extend({},
        $.fn.MultiFile.options,
        options || {},
   					($.metadata? MultiFile.E.metadata(): ($.meta?MultiFile.E.data():null)) || {}, /* metadata options */
								{} /* internals */
       );
       // limit number of files that can be selected?
       if(!(o.max>0) /*IsNull(MultiFile.max)*/){
        o.max = MultiFile.E.attr('maxlength');
        if(!(o.max>0) /*IsNull(MultiFile.max)*/){
         o.max = (String(MultiFile.e.className.match(/\b(max|limit)\-([0-9]+)\b/gi) || ['']).match(/[0-9]+/gi) || [''])[0];
         if(!(o.max>0)) o.max = -1;
         else           o.max = String(o.max).match(/[0-9]+/gi)[0];
        }
       };
       o.max = new Number(o.max);
       // limit extensions?
       o.accept = o.accept || MultiFile.E.attr('accept') || '';
       if(!o.accept){
        o.accept = (MultiFile.e.className.match(/\b(accept\-[\w\|]+)\b/gi)) || '';
        o.accept = new String(o.accept).replace(/^(accept|ext)\-/i,'');
       };

       // APPLY CONFIGURATION
       $.extend(MultiFile, o || {});
       MultiFile.STRING = $.extend({},$.fn.MultiFile.options.STRING,MultiFile.STRING);

       $.extend(MultiFile, {
        n: 0, // How many elements are currently selected?
        slaves: [], files: [],
        instanceKey: MultiFile.e.id || 'MultiFile'+String(group_count), // Instance Key?
        generateID: function(z){ return MultiFile.instanceKey + (z>0 ?'_F'+String(z):''); },
        trigger: function(event, element){
         var handler = MultiFile[event], value = $(element).attr('value');
         if(handler){
          var returnValue = handler(element, value, MultiFile);
          if( returnValue!=null ) return returnValue;
         }
         return true;
        },
		triggerWithId: function(event, element, MultiFile, spanId, aId, divId){
         var handler = MultiFile[event], value = $(element).attr('value');
         if(handler){
          var returnValue = handler(element, value, MultiFile, spanId, aId, divId);
          if( returnValue!=null ) return returnValue;
         }
         return true;
        }
       });
       
       if(String(MultiFile.accept).length>1){
								MultiFile.accept = MultiFile.accept.replace(/\W+/g,'|').replace(/^\W|\W$/g,'');
        MultiFile.rxAccept = new RegExp('\\.('+(MultiFile.accept?MultiFile.accept:'')+')$','gi');
       };
       
       // Create wrapper to hold our file list
       MultiFile.wrapID = MultiFile.instanceKey+'_wrap'; // Wrapper ID?
       MultiFile.E.wrap('<div class="MultiFile-wrap" id="'+MultiFile.wrapID+'"></div>');
       MultiFile.wrapper = $('#'+MultiFile.wrapID+'');

       // MultiFile MUST have a name - default: file1[], file2[], file3[]
       MultiFile.e.name = MultiFile.e.name || 'file'+ group_count +'[]';
							if(!MultiFile.list){
								// Create a wrapper for the list
								// * OPERA BUG: NO_MODIFICATION_ALLOWED_ERR ('list' is a read-only property)
								// this change allows us to keep the files in the order they were selected
								MultiFile.wrapper.append( '<div class="MultiFile-list" id="'+MultiFile.wrapID+'_list"></div>' );
								MultiFile.list = $('#'+MultiFile.wrapID+'_list');
							};
       MultiFile.list = $(MultiFile.list);
	
		

       //===
       
       // Bind a new element
       MultiFile.addSlave = function( slave, slave_count ){
        MultiFile.n++;
        slave.MultiFile = MultiFile;
								
								if(slave_count>0) slave.id = slave.name = '';
								
								if(slave_count>0) slave.id = MultiFile.generateID(slave_count);
        // 2008-Apr-29: New customizable naming convention (see url below)
        // http://groups.google.com/group/jquery-dev/browse_frm/thread/765c73e41b34f924#
        slave.name = String(MultiFile.namePattern
         /*master name*/.replace(/\$name/gi,$(MultiFile.clone).attr('name'))
         /*master id  */.replace(/\$id/gi,  $(MultiFile.clone).attr('id'))
         /*group count*/.replace(/\$g/gi,   group_count)//(group_count>0?group_count:''))
         /*slave count*/.replace(/\$i/gi,   slave_count)//(slave_count>0?slave_count:''))
        );
        
        // If we've reached maximum number, disable input slave
        if( (MultiFile.max > 0) && ((MultiFile.n-1) > (MultiFile.max)) )//{ // MultiFile.n Starts at 1, so subtract 1 to find true count
         slave.disabled = true;
        
        MultiFile.current = MultiFile.slaves[slave_count] = slave;
		slave = $(slave);

        slave.val('').attr('value','')[0].value = '';
        slave.addClass('MultiFile-applied');
								
        slave.change(function(){
 		// Lose focus to stop IE7 firing onchange again
        $(this).blur();
          
          //# Trigger Event! onFileSelect
          if(!MultiFile.trigger('onFileSelect', this, MultiFile, slave_count)) return false;
          //# End Event!
          
          //# Retrive value of selected file from element
          var ERROR = '', v = String(this.value || ''/*.attr('value)*/);
			if(MultiFile.accept && v && !v.match(MultiFile.rxAccept)) {
				ERROR = MultiFile.STRING.denied.replace('$ext', String(v.match(/\.\w{1,4}$/gi)));
			}

			for(var f in MultiFile.slaves) {
				if(MultiFile.slaves[f] && MultiFile.slaves[f]!=this) {
					if(MultiFile.slaves[f].value==v) {
						ERROR = MultiFile.STRING.duplicate.replace('$file', v.match(/[^\/\\]+$/gi));
					}
				}
			}
         
          // Create a new file input element
          var newEle = $(MultiFile.clone).clone();// Copy parent attributes - Thanks to Jonas Wagner

          newEle.addClass('MultiFile');

          if(ERROR!=''){
            MultiFile.error(ERROR, v.match(/[^\/\\]+$/gi), String(v.match(/\.\w{1,4}$/gi)));

            MultiFile.n--;
            MultiFile.addSlave(newEle[0], slave_count);
			
            slave.parent().prepend(newEle);
            slave.remove();
            return false;
          };
		  
          // Hide this element (NB: display:none is evil!)
          $(this).css({ position:'absolute', top: '-3000px' });
          // Add new element to the form
          slave.after(newEle);
          MultiFile.addToList( this, slave_count );
          MultiFile.addSlave( newEle[0], slave_count+1 );
		  
          if(!MultiFile.trigger('afterFileSelect', this, MultiFile)) return false;  
        });
		$(slave).data('MultiFile', MultiFile);	
		
       };

		

       MultiFile.addToList = function( slave, slave_count ){
        //# Trigger Event! onFileAppend
		var spanId = slave.id + "_filelist";//构造一个spanId, 为下面的a赋值, 用于上传完成后理该a里面的span元素的值
		var aId = slave.id + "_removeId";//构造一个移除的ID, 当上传失败时有用
		var divId = slave.id + "_listdiv";//构造一个列表中的div, 当文件时不显示该div, 如果上传成功再显示
        if(!MultiFile.triggerWithId('onFileAppend', slave, MultiFile, spanId, aId, divId)) {
			return false;
		}
		
			var
			 r = $('<div id=' + divId + ' style="display:none;" class="MultiFile-label"></div>'),
			 v = String(slave.value || ''),
			 a = $('<span id="' + spanId + '" class="MultiFile-title" title="'+MultiFile.STRING.selected.replace('$file', v)+'">'+MultiFile.STRING.file.replace('$file', v.match(/[^\/\\]+$/gi)[0])+'</span>'),
			 b = $('<a class="MultiFile-remove" id="' + aId + '" href="#'+MultiFile.wrapID+'">'+MultiFile.STRING.remove+'</a>');

			if (MultiFile.STRING.removeSide == "right"){
				MultiFile.list.append(r.append(a, b, MultiFile.STRING.fileSeparator));
			} else {
				MultiFile.list.append(r.append(b, a, MultiFile.STRING.fileSeparator));
			}
			b.click(function(){
			  if(!MultiFile.trigger('onFileRemove', slave, MultiFile)) return false;

			  MultiFile.n--;
			  MultiFile.current.disabled = false;
			  
			MultiFile.slaves[slave_count] = null;
			$(slave).remove();
			$(this).parent().remove();
											
			  $(MultiFile.current).css({ position:'', top: '' });
											$(MultiFile.current).reset().val('').attr('value', '')[0].value = '';

			  if(!MultiFile.trigger('afterFileRemove', slave, MultiFile)) return false;
											
			  return false;
			})
		
        
        if(!MultiFile.triggerWithId('afterFileAppend', slave, MultiFile, spanId, aId, divId)) return false;
		
        //# End Event!
       };
        /**  By Angus Young 2009-4-23 ;By Angus Young 2009-4-23
		*/

       
       // Bind functionality to the first element
       if(!MultiFile.MultiFile) MultiFile.addSlave(MultiFile.e, 0);
       
       // Increment control count
       //MultiFile.I++; // using window.MultiFile
       MultiFile.n++;
       MultiFile.E.data('MultiFile', MultiFile);
		
		});
	};
	
	/*--------------------------------------------------------*/
	
	$.extend($.fn.MultiFile, {
  /**
   * This method removes all selected files
   *
   * Returns a jQuery collection of all affected elements.
   *
   * @name reset
   * @type jQuery
   * @cat Plugins/MultiFile
   * @author Diego A. (http://www.fyneworks.com/)
   *
   * @example $.fn.MultiFile.reset();
   */
  reset: function(){
			var settings = $(this).data('MultiFile');
			//if(settings) settings.wrapper.find('a.MultiFile-remove').click();
			if(settings) settings.list.find('a.MultiFile-remove').click();
   return $(this);
  },
  
  
  /**
   * This utility makes it easy to disable all 'empty' file elements in the document before submitting a form.
   * It marks the affected elements so they can be easily re-enabled after the form submission or validation.
   *
   * Returns a jQuery collection of all affected elements.
   *
   * @name disableEmpty
   * @type jQuery
   * @cat Plugins/MultiFile
   * @author Diego A. (http://www.fyneworks.com/)
   *
   * @example $.fn.MultiFile.disableEmpty();
   * @param String class (optional) A string specifying a class to be applied to all affected elements - Default: 'mfD'.
   */
  disableEmpty: function(klass){ klass = String(klass || 'mfD');
   var o = [];
   $('input:file').each(function(){ if($(this).val()=='') o[o.length] = this; });
   return $(o).each(function(){ this.disabled = true }).addClass(klass);
  },
  
  
 /**
  * This method re-enables 'empty' file elements that were disabled (and marked) with the $.fn.MultiFile.disableEmpty method.
  *
  * Returns a jQuery collection of all affected elements.
  *
  * @name reEnableEmpty
  * @type jQuery
  * @cat Plugins/MultiFile
  * @author Diego A. (http://www.fyneworks.com/)
  *
  * @example $.fn.MultiFile.reEnableEmpty();
  * @param String klass (optional) A string specifying the class that was used to mark affected elements - Default: 'mfD'.
  */
  reEnableEmpty: function(klass){ klass = String(klass || 'mfD');
   return $('input:file.'+klass).removeClass(klass).each(function(){ this.disabled = false });
  },
  
  
 /**
  * This method will intercept other jQuery plugins and disable empty file input elements prior to form submission
  *
  * @name intercept
  * @cat Plugins/MultiFile
  * @author Diego A. (http://www.fyneworks.com/)
  *
  * @example $.fn.MultiFile.intercept();
  * @param Array methods (optional) Array of method names to be intercepted
  */
  intercepted: {},
  intercept: function(methods, context, args){
   var method, value; args = args || [];
   if(args.constructor.toString().indexOf("Array")<0) args = [ args ];
   if(typeof(methods)=='function'){
    $.fn.MultiFile.disableEmpty();
    value = methods.apply(context || window, args);
    $.fn.MultiFile.reEnableEmpty();
    return value;
   };
   if(methods.constructor.toString().indexOf("Array")<0) methods = [methods];
   for(var i=0;i<methods.length;i++){
    method = methods[i]+''; // make sure that we have a STRING
    if(method) (function(method){ // make sure that method is ISOLATED for the interception
     $.fn.MultiFile.intercepted[method] = $.fn[method] || function(){};
     $.fn[method] = function(){
      $.fn.MultiFile.disableEmpty();
      value = $.fn.MultiFile.intercepted[method].apply(this, arguments);
      $.fn.MultiFile.reEnableEmpty();
      return value;
     }; // interception
    })(method); // MAKE SURE THAT method IS ISOLATED for the interception
   };// for each method
  }
 });
	
	/*--------------------------------------------------------*/

	$.fn.MultiFile.options = { //$.extend($.fn.MultiFile, { options: {
		accept: '', // accepted file extensions
		max: -1,    // maximum number of selectable files
		// name to use for newly created elements
		namePattern: '$name', // same name by default (which creates an array)
		// STRING: collection lets you show messages in different languages
		STRING: {
			remove:'x',
			denied:'You cannot select a $ext file.\nTry again...',
			file:'$file',
			selected:'File selected: $file',
			duplicate:'This file has already been selected:\n$file',
			removeSide: 'left',
			fileSeparator: ' '
		},
		// name of methods that should be automcatically intercepted so the plugin can disable
		// extra file elements that are empty before execution and automatically re-enable them afterwards
  autoIntercept: [ 'submit', 'ajaxSubmit', 'validate' /* array of methods to intercept */ ],
		
		// error handling function
		error: function(s, file, suffix){//为error function添加第二个参数file, 第三个参数文件的后缀suffix	2009.4.24 by Angus Young
			 alert(s);
		}
 };
	
	// Native input reset method - because this alone doesn't always work: $(element).val('').attr('value', '')[0].value = '';
	$.fn.reset = function(){ return this.each(function(){ try{ this.reset(); }catch(e){} }); };

	
	/*
		### Default implementation ###
		The plugin will attach itself to file inputs
		with the class 'multi' when the page loads
	*/
	$(function(){
  $("input[type=file].multi").MultiFile();
 });

})(jQuery);

/****************************以上是MultiFile插件*******************************************/

/****************************以下是ajaxFileUpload插件**************************************/

		jQuery.extend({
			

			createUploadIframe: function(id, uri)
			{
					//create frame
					var frameId = 'jUploadFrame' + id;
					
					if(window.ActiveXObject) {
						var io = document.createElement('<iframe id="' + frameId + '" name="' + frameId + '" />');
						if(typeof uri== 'boolean'){
							io.src = 'javascript:false';
						}
						else if(typeof uri== 'string'){
							io.src = uri;
						}
					}
					else {
						var io = document.createElement('iframe');
						io.id = frameId;
						io.name = frameId;
					}
					io.style.position = 'absolute';
					io.style.top = '-1000px';
					io.style.left = '-1000px';

					document.body.appendChild(io);

					return io			
			},
			createUploadForm: function(id, fileElementId)
			{
				//create form	
				var formId = 'jUploadForm' + id;
				var fileId = 'jUploadFile' + id;
				var form = $('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');	
				var oldElement = $('#' + fileElementId);
				var newElement = $(oldElement).clone();
				$(oldElement).attr('id', fileId);
				$(oldElement).before(newElement);
				$(oldElement).appendTo(form);
				//set attributes
				$(form).css('position', 'absolute');
				$(form).css('top', '-1200px');
				$(form).css('left', '-1200px');
				$(form).appendTo('body');		
				return form;
			},

			ajaxFileUpload: function(s) {
				// TODO introduce global settings, allowing the client to modify them for all requests, not only timeout		
				s = jQuery.extend({}, jQuery.ajaxSettings, s);
				var id = new Date().getTime()        
				var form = jQuery.createUploadForm(id, s.fileElementId);
				var io = jQuery.createUploadIframe(id, s.secureuri);
				var frameId = 'jUploadFrame' + id;
				var formId = 'jUploadForm' + id;		
				// Watch for a new set of requests
				if ( s.global && ! jQuery.active++ )
				{
					jQuery.event.trigger( "ajaxStart", [s.fileElementId] );
				}            
				var requestDone = false;
				// Create the request object
				var xml = {}   
				if ( s.global )
					jQuery.event.trigger("ajaxSend", [xml, s]);
				// Wait for a response to come back
				var uploadCallback = function(isTimeout)
				{			
					var io = document.getElementById(frameId);
					try 
					{				
						if(io.contentWindow)
						{
							 xml.responseText = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
							 xml.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;
							 
						}else if(io.contentDocument)
						{
							 xml.responseText = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
							xml.responseXML = io.contentDocument.document.XMLDocument?io.contentDocument.document.XMLDocument:io.contentDocument.document;
						}						
					}catch(e)
					{
						jQuery.handleError(s, xml, null, e);
					}
					if ( xml || isTimeout == "timeout") 
					{				
						requestDone = true;
						var status;
						try {
							status = isTimeout != "timeout" ? "success" : "error";
							// Make sure that the request was successful or notmodified
							if ( status != "error" )
							{
								// process the data (runs the xml through httpData regardless of callback)
								var data = jQuery.uploadHttpData( xml, s.dataType );    
								// If a local callback was specified, fire it and pass it the data
								if ( s.success )
									s.success( data, status );
			
								// Fire the global callback
								if( s.global )
									jQuery.event.trigger( "ajaxSuccess", [xml, s] );
							} else
								jQuery.handleError(s, xml, status);
						} catch(e) 
						{
							status = "error";
							jQuery.handleError(s, xml, status, e);
						}

						// The request was completed
						if( s.global )
							jQuery.event.trigger( "ajaxComplete", [xml, s] );

						// Handle the global AJAX counter
						if ( s.global && ! --jQuery.active )
							jQuery.event.trigger( "ajaxStop" );

						// Process result
						if ( s.complete )
							s.complete(xml, status);

						jQuery(io).unbind()

						setTimeout(function()
											{	try 
												{
													$(io).remove();
													$(form).remove();	
													
												} catch(e) 
												{
													jQuery.handleError(s, xml, null, e);
												}									

											}, 100)

						xml = null

					}
				}
				// Timeout checker
				if ( s.timeout > 0 ) 
				{
					setTimeout(function(){
						// Check to see if the request is still happening
						if( !requestDone ) uploadCallback( "timeout" );
					}, s.timeout);
				}
				try 
				{
				   // var io = $('#' + frameId);
					var form = $('#' + formId);
					$(form).attr('action', s.url);
					$(form).attr('method', 'POST');
					$(form).attr('target', frameId);
					if(form.encoding)
					{
						form.encoding = 'multipart/form-data';				
					}
					else
					{				
						form.enctype = 'multipart/form-data';
					}			
					$(form).submit();

				} catch(e) 
				{			
					jQuery.handleError(s, xml, null, e);
				}
				if(window.attachEvent){
					document.getElementById(frameId).attachEvent('onload', uploadCallback);
				}
				else{
					document.getElementById(frameId).addEventListener('load', uploadCallback, false);
				} 		
				return {abort: function () {}};	

			},

			uploadHttpData: function( r, type ) {
				var data = !type;
				
				data = type == "xml" || data ? r.responseXML : r.responseText;
				// If the type is "script", eval it in global context
				if (type == "text")
				{
					return r.responseText;
				}
				if ( type == "script" ) {
					jQuery.globalEval( data );
				}
				// Get the JavaScript object, if JSON is used.
				if ( type == "json" ) {
					dataResult = data;
					return dataResult;
				}
				// evaluate scripts within html
				if ( type == "html" ) {
					jQuery("<div>").html(data).evalScripts();
				}
					
					//alert($('param', data).each(function(){alert($(this).attr('value'));}));
				return data;
			}
		})


/****************************以上是ajaxFileUpload插件**************************************/

/****************************以下是封装过的CEMultiFile的插件*******************************/

/*
 * 
 * author: Angus Young
 * create data: 2009.4.24
 * email: yangenxiong@hotmail.com
 * 
 *
*/

	jQuery.CEMultiFile = {
		//向文件列表添加文件, 并上传到服务器
		ajaxUploadFile: function(element, value, master_element, args, spanId, aId, divId){//添加一个文件时的动作, 调用ajaxFileUpload插件进行上传
            $("#" + args.loadingImageId).show();
            if (args.ajaxStart) args.ajaxStart();
			$("#" + args.loadingImageId)//$("#loading"), 上传时等待图片
			.ajaxComplete(function(xml, s){
                $(this).hide();
                if (args.ajaxComplete) args.ajaxComplete(xml, s.fileElementId);
			});
			$.ajaxFileUpload({//调用ajaxFileUpload插件中的ajaxFileUpload方法
				url: $.CEMultiFile.getURL(args.url, "size=" + args.size + "&max=" + args.max + "&fileType=" + args.fileType + "&imageHeight=" + args.imageHeight + "&imageWidth=" + args.imageWidth), 
				secureuri: false,
				fileElementId: element.id,
				dataType: 'text',
				success: function(data, status) {
					data = $(data).replaceWith("<PRE>");//将返回的json替换<PRE>, 因为ajaxFileUpload插件会帮json数据加上<PRE>
					data = $(data).replaceWith("</PRE>");
                    
					if ($(data).html().indexOf("file too max=") != -1)
					{
						$("#" + aId).click();//删除文件列表
                        var realSize = $.CEMultiFile.handleData(data);
						if (args.fileTooMax) args.fileTooMax(value, args.size, realSize);
						return;
					}
					if ($(data).html().indexOf("height too max=") != -1)
					{
						$("#" + aId).click();//删除文件列表
						var realHeight = $.CEMultiFile.handleData(data);
						if (args.imageHeightTooMax) args.imageHeightTooMax(value, realHeight, args.imageHeight);
						return;
					}
					if ($(data).html().indexOf("width too max=") != -1)
					{
						$("#" + aId).click();//删除文件列表
						var realWidth = $.CEMultiFile.handleData(data);
						if (args.imageWidthTooMax) args.imageWidthTooMax(value, realWidth, args.imageWidth);
						return;
					}
					if ($(data).html().indexOf("read image error") != -1)
					{
						$("#" + aId).click();//删除文件列表
						if (args.readImageError) args.readImageError(value);
						return;
					}
					var file = $("#"+spanId).html();
					
					if (args.getFileHtml) fileHtml = args.getFileHtml(file, data.html());
					else fileHtml = file;

					$("#" + divId).attr("style", "display:block;" + args.fileCSS);
					var index = master_element.n - 3;
					$("#"+spanId).html(fileHtml + $.CEMultiFile.getHidden(data.html(), "file_hidden_" + index, "file_hidden_" + index));
					
                    if (args.uploadSuccess) args.uploadSuccess(data, status);
				},
				error: function (data, status, e){
					if (args.uploadError) args.uploadError(data, status, e);
				}
			})
		},
        handleData: function(data) {//将=号后面的数据截取
            return $(data).html().substring($(data).html().indexOf("=") + 1, $(data).html().length);
        },
//args包括: elementId(文件域ID), denied(当文件不符合要求的提示, 以$ext代表该文件的后缀), 
//remove(控制删除的html元素), selected(tips), loadingImageId(上传时加载的元素ID), url(上传的连接), 
//accept(接受的文件类型, 例如: gif|png), max(最多的文件数), containerId(文件列表所在的容器ID), 
//removeSide(删除按钮在文件名的左边还是右边, 只接受"left"或者"right"值), 
		newFileInput: function(args) {//构建一个文件域
			$(args.element).MultiFile({
				accept: args.accept,
				max: args.max,
				list: $.CEMultiFile.getContainerId(args),
				STRING: {
					file: "$file",
					denied: "denied",//不符合后缀
					duplicate: "duplicate",//已经存在于文件列表
					remove: args.remove,//删除文件时的图片或者文字
					selected: args.selected,//"$file",
					removeSide: args.removeSide,
					fileSeparator: args.fileSeparator
				},
				onFileAppend: function(element, value, master_element, spanId, aId, divId) {//调用MultiFile插件的onFileAppend方法
                    $.CEMultiFile.ajaxUploadFile(element, value, master_element, args, spanId, aId, divId);
				},
				error: function(s, file, suffix) {
					if (s == "denied")
					{
						if (args.onDenied) args.onDenied(s, file, suffix);
					}
					if (s == "duplicate")
					{
						if (args.onDuplicate) args.onDuplicate(s, file, suffix);
					}
				}
			});
		},
		getHidden: function(hiddenValue, hiddenId, hiddenName) {//构造一个隐藏域, 用于存在文件的路径
			return '<input type="hidden" id="' + hiddenId + '" name="' + hiddenName + '" value="' + hiddenValue + '"/>';
		},
		getURL: function(url, args) {
			if (url.indexOf("?") == -1) {//不存在问号
				url += "?" + args;
			} else {
				url += "&" + args;
			}
			return url;
		},
		getContainerId: function(args) {
			if (args.containerId) return "#" + args.containerId;
			else return "";
		}
	};
	
	;(function($){
		$.uiwidget = $.uiwidget || {};
		$.uiwidget.MultiUpload = function(target, cfg){
			$.extend(this, cfg);
			this.target = $(target);
			cfg.element = target;
			new $.CEMultiFile.newFileInput(cfg);
		};
		
		$.uiwidget.MultiUpload.prototype = {
	
		};
		$.fn.multiUpload = function(cfg){
			return new $.uiwidget.MultiUpload(this, cfg);
		};
	})(jQuery);	

/****************************以上是封装过的CEMultiFile的插件*******************************/	