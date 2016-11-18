/*
 * Translated default messages for the jQuery validation plugin.
 * Language: CN
 * Author: Fayland Lam <fayland at gmail dot com>
 */
jQuery.extend(jQuery.validator.messages, {
    required: "必填字段",
		email: "请输入正确格式的电子邮件",
		url: "请输入合法的网址",
		date: "请输入合法的日期.例如：2006/03/16 10:11:12",
		dateISO: "请输入合法的日期.例如：2006-03-16",
		dateTimeSecond: "请输入合法的日期.例如：2006-03-16 10:11:12",
		dateTime: "请输入合法的日期.例如：2006-03-16 10:11",
		number: "请输入合法的数字",
		positive: "请输入合法的正数",
		digits: "只能输入整数",
		creditcard: "请输入合法的信用卡号",
		equalTo: "请再次输入相同的值",
		accept: "请输入拥有合法后缀名的字符串.例如：'jpeg|gif|png'",
		maxlength: jQuery.format("请输入一个长度最多是 {0} 的字符串"),
		minlength: jQuery.format("请输入一个长度最少是 {0} 的字符串"),
		rangelength: jQuery.format("请输入一个长度介于 {0} 和 {1} 之间的字符串"),
		range: jQuery.format("请输入一个介于 {0} 和 {1} 之间的值"),
		max: jQuery.format("请输入一个最大为 {0} 的值"),
		min: jQuery.format("请输入一个最小为 {0} 的值"),
		less_than_date: "输入的日期应小于等于选定的日期.",
		great_than_date: "输入的日期应大于等于选定的日期.",
		less_than_number: "输入的值应小于等于选定的值.",
		great_than_number: "输入的值应大于等于选定的值.",
		integer_number: jQuery.format("输入的值整数位数最大为{0}"),
		decimal_number: jQuery.format("输入的值小数位数最大为{0}"),
		integer_decimal_range:jQuery.format("输入的值整数位数最大为{0},小数位数最大为{1}")
});