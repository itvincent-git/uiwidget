/**
* Validator
*
* @author Vincent (zhongyongsheng@ceopen.cn)
* @data 2009-06-11
* @version 2.0.0
*/
;(function($){
	$.uiwidget = $.uiwidget || {};
	$.uiwidget.FormValidator = function(el, cfg){
		//if(this.isObject(cfg)){
		//	cfg = {rules: [cfg]};
		//}
		$.extend(this, cfg);
		this.el = el;
		this.validators = [];
		if(this.immediate)
			this.validate();
	};
	$.uiwidget.FormValidator.prototype = {
		validate : function(){
			this.inputs = this.findInputs();
			var t = this;
			$.debug('inputs='+this.inputs.length);
			for(var i = 0; i < this.inputs.length; i++){
				var v = new $.uiwidget.Validator(this.inputs[i], null);
				this.validators.push(v);
			}
			this.el.bind('submit',function(e){
				t.submit(e);
			});
			this.el.bind('reset',function(e){
				t.reset(e);
			});
		}
		,findInputs : function(){
			return this.el.map(function(){
				return this.elements ? $.makeArray(this.elements) : this;
			})
			.filter(function(){
				return this.name && !this.disabled &&
					(this.checked || /select|textarea/i.test(this.nodeName) ||
						/text|hidden|password|search|checkbox|radio/i.test(this.type));
			})
			.map(function(){
				return $(this);
			});
		}
		,submit : function(e){
			$.debug('submit');
			var valid = true;
			for(var i = 0; i < this.validators.length; i++){
				if(!this.validators[i].validate({immediate:true}))
					valid = false;  
			}
			if(!valid)
				e.preventDefault();
		}
		,reset : function(e){
			$.debug('reset');
			for(var i = 0; i < this.validators.length; i++){
				this.validators[i].reset();
			}
		}
	};
	
	$.uiwidget.Validator = function(el, cfg){
		if(cfg != null && !$.isArray(cfg)){
			cfg = {rules: [cfg]};
		}
		$.extend(this, cfg);
		this.el = el;
		//this.validate();
		this.init();
		if(this.immediate)
			this.validate();
	};
	$.uiwidget.Validator.prototype = {
		init : function(){
			var ve = $.uiwidget.Validator.defaults.validateEvent;
			var t = this;
			for(var i = 0; i < ve.length; i++){
				this.el.bind(ve[i], function(e){
					t.validate();
				});
			}	
		}
		,validate : function(){
			this.valid = this.test();
			//$.debug(valid);
			return this.valid;	
		}
		,isValid : function(){
			return this.valid;
		}
		,getValue : function(){
			//$.debug('nodeName='+this.el[0].nodeName);
			if(this.el[0].type == 'checkbox'){
				$.debug('getValue=' + this.el[0].checked);
				return this.el[0].checked;
			}	
			$.debug('getValue=' + this.el.val());
			return this.el.val();
		}
		,test : function(){
			//$.debug(this.validator);
			var rules = this.findRules();
			for(var i = 0 , len = rules.length; i < len ; i ++){
				var methodName = $.uiwidget.Validator.findMethodName(rules[i].validator);
				var method = $.uiwidget.Validator.findMethod(methodName);
				var args = this.getArgumentsByClassName(methodName, rules[i].validator);
				//$.debug('args='+args.length );
				if(!method) continue;
				if(method.call(this, this.getValue(), this.el, args)){
					this.clearInvalid();
				}else{
					this.markInvalid(this.findMessage(methodName, args));
					return false;
				}	
			}
			return true;
		}
		,markInvalid : function(msg){
			$.debug('markInvalid = ' + msg);
			this.el.addClass('validate-error');
			$.uiwidget.MessageTargets[$.uiwidget.Validator.defaults.messageTarget].mark(this.el, msg);
		}
		,clearInvalid : function(){
			$.debug('clearInvalid');
			this.el.removeClass('validate-error');
			$.uiwidget.MessageTargets[$.uiwidget.Validator.defaults.messageTarget].clear(this.el);
		}
		,reset : function(){
			this.clearInvalid();
		}
		,findRules : function(){
			if(this.rules){
			//$.debug('this.rules.length 1= ' +this.rules.length);
				return this.rules;
			}else{
				this.rules = [];
				var cls = this.el[0].className.split(' ');
				for(var i = 0, len = cls.length; i < len ; i++){
					if(cls[i] != 'validate-error')
						this.rules.push({validator: cls[i]});
				}
				//$.debug('this.rules.length = ' +this.rules.length);
				return this.rules;
			}	
		}
		
		,getArgumentsByClassName : function(prefix,className) {
			if(!className || !prefix)
				return [];
			var pattern = new RegExp(prefix+'-(\\S+)');
			var matchs = className.match(pattern);
			if(!matchs)
				return [];
			var results = [];
			var args =  matchs[1].split('-');
			for(var i = 0; i < args.length; i++) {
				if(args[i] == '') {
					if(i+1 < args.length) args[i+1] = '-'+args[i+1];
				}else{
					results.push(args[i]);
				}
			}
			return results;
		}
	    ,bind : function(arg0, arg1, fn){
			if(typeof arg1 == 'object')
				return this.grid.bind(arg0, arg1, arg2);
			else 
				return this.grid.bind(arg0, arg1);
		}
		//==============================
		
		//===========================================
		,messages : {
			required : '请输入值。'
			, minlength : '请输入一个长度最少是 {0} 的值。'
			, 'min-length' : '请输入一个长度最少是 {0} 的值。'
			, 'validate-one-required' : '请选择一个值。'
		}
		,findMessage : function(method, args){
			//$.debug('method = ' + method);
			/*if(typeof this.message === 'string'){
				return this.message;
			}else if(this.validator){
				return this.message[this.validator];
			}else{
				return this.messages[validator];
			}*/
			var m;
			m = this.getElMessage();
			if(!m){
				
			if(typeof this.messages[method] === 'string'){
				m = this.messages[method];
			}else if($.isFunction(this.messages[method])){
				this.messages[method].call(this, args);			
			}
			}
			return this.format(m, args);
		}
		,getElMessage : function(){
			return this.el.attr('message');
		}
      	,format : function(format, args){
      		if(args){
	      		//$.debug('format' );
	        	//var args = Array.prototype.slice.call(arguments, 1);
	        	return format.replace(/\{(\d+)\}/g, function(m, i){
	        	    return args[i];
	        	});
        	}else{
        		return format;
        	}
		}
	};
	$.uiwidget.Validator.defaults = {
		messageTarget : 'title'
		,validateEvent : ['keyup', 'blur']
	};
	$.extend($.uiwidget.Validator, {
		methods:{
			required : function(v, el, args, metadata){
				//$.debug('required='+el[0].name);
				return !($.uiwidget.Validator.findMethod('isEmpty')(v) || /^\s+$/.test(v));
			}
			,isEmpty : function(v, el, args, metadata){
				return  ((v == null) || (v.length == 0));
			}
			,minlength : function(v, el, args, metadata){
				return !$.uiwidget.Validator.findMethod('isEmpty')(v) && v.length >= parseInt(args[0]);
			}
			,'min-length' : function(v, el, args, metadata){
				return $.uiwidget.Validator.findMethod('minlength')(v, el, args, metadata);
			}
			,'validate-one-required' : function(v, el, args, metadata){
				$.debug('validate-one-required');
				return v ? true : false;
			}
		}
		,findMethodName : function(name){
			var resultMethodName;
			for(var methodName in this.methods){
				if(name == methodName){
					resultMethodName = methodName;
					break;
				}	
				if(name.indexOf(methodName) >= 0){
					resultMethodName = methodName;
				}	
			}
			return resultMethodName;
		}
		,findMethod : function(name){
			return this.methods[name];
		}
		,addMethod : function(method){
			$.extend(this.methods, method); 
		}
	});	

	$.uiwidget.MessageTargets={
		title:{
			mark : function(el, msg){
				el[0].title = msg;
			}
			,clear : function(el){
				el[0].title = '';
			}
		}
		,tip:{
		
		}
		,behind:{
		
		}
	}
	
	$.fn.validate = function(cfg){
		if(this.length < 1) return;
		var v;
		if(this.is('form'))
			v = new $.uiwidget.FormValidator(this, cfg);
		else
			v = new $.uiwidget.Validator(this, cfg);
		return v;	
	};
	
	$.uiwidget.Validator.autoBind = function(){
		$('.required-validate').validate({immediate:true});
	};
	
	$(function(){
		$.uiwidget.Validator.autoBind();
	});
})(jQuery);	