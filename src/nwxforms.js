/*!

Copyright (c) 2010-2012 Diego Perini (http://www.iport.it)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

//
// Cross-browser HTML5 form helper written in Javascript
//
// implements missing html5 form control attributes
//
// placeholder - input text, textarea
// autofocus - input, select, textarea
// maxlength - input text (1), textarea
// required - input, select, textarea
// pattern - input text, textarea
// data-regexp (2) - input text, textarea
//
// (1) HTML4 support maxlength on input type text
// (2) validates HTML5 specification (seen in ExtJS)
//
// Note:
// the following code has been rewritten from scratch based
// on previous work done for NWXForms and NWMask components
// written for IPORT back in 2005, I would like to say thanks
// to Remy Sharp (@rem) for pushing me to revisit these old
// scripts and implement them as HTML5 cross-browser helpers.
//
// Status:
// The code is just a pre-alpha preview and poc, should work.
// I have an alternate method for placeholders in case this
// doesn't work for some reason. I could use some containers
// styled as their underlying controls until before focus.
//
// @global - required browsing context
//

function nwxforms(global) {

	var cache = { },

	doc = global.document,

	// helper strings for event shortcut
	w3c = !!doc.addEventListener,
	add = w3c ? 'addEventListener' : 'attachEvent',
	rem = w3c ? 'removeEventListener' : 'detachEvent',
	blur = w3c ? 'blur' : 'focusout',
	focus = w3c ? 'focus' : 'focusin',
	input = w3c ? 'input' : 'propertychange',
	target = w3c ? 'target': 'srcElement',
	prefix = w3c ? '' : 'on',

	// cache for test elements references
	tagStore = { },

	// handled protocols RE string
	protoRE = '(?:(?:ftp|http|https)://)',

	// host.domain.tld RE string, for stricter checking this
	// could be used: https://gist.github.com/dperini/729294
	hostRE = '(?:[a-zA-Z0-9][-a-zA-Z0-9]{0,61}[a-zA-Z0-9]\\.)+[a-zA-Z]{2,6}',

	// mail address RE string, RFC2822/RFC5322 no double quotes, no UTF8 (RFC5336)
	mailRE = '(?:[\\w!#$%&\x27*+/=?^`{|}~-]+)(?:\\.[\\w!#$%&\x27*+/=?^`{|}~-]+)*',

        // date RE string, yyyy-mm-dd (US) dd-mm-yyyy (EU/IT)
        // multiple separators: "-", ".", "/", " " or none
        dateRE =
                // [yy]yy-mm-dd
                '(?:\\d{2}|\\d{4})[-.\\/ ]\\d{1,2}[-.\\/ ]\\d{1,2}|' +
                // dd-mm-[yy]yy
                '\\d{1,2}[-.\\/ ]\\d{1,2}[-.\\/ ](?:\\d{2}|\\d{4})|' +
                // [yy]yymmdd
                '(?:\\d{2}|\\d{4})\\d{2}\\d{2}|' +
                // ddmm[yy]yy
                '\\d{2}\\d{2}(?:\\d{2}|\\d{4})',

        // month RE string, yyyy-mm (US) mm-yyyy (EU/IT)
        // multiple separators: "-", ".", "/", " " or none
        monthRE =
                // [yy]yy mm
                '(?:\\d{2}|\\d{4})[-.\\/ ]\\d{1,2}|' +
                // mm [yy]yy
                '\\d{1,2}[-.\\/ ](?:\\d{2}|\\d{4})|' +
                // [yy]yymm
                '(?:\\d{2}|\\d{4})\\d{2}|' +
                // mm[yy]yy
                '\\d{2}(?:\\d{2}|\\d{4})',

        // week RE string, yyyy-Www (US) Www-yyyy (EU/IT)
        // a "W" marker is used to differentiate from month format
        // http://www.w3.org/TR/html-markup/input.week.html#form.data.week_xref1
        weekRE = '\\d{4}-W\\d{2}|W\\d{2}-\\d{4}',

        // time RE string, format: hh:mm:ss.ff
        // RFC3339 partial-time format no TimeZone
        timeRE = '\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{2})?',

        // numeric RE string, format: -.01e2
        numberRE = '(?:\\+|-)?(?:\\d+)(?:.\\d+)?(?:e-?\\d+)?',

        // color RE string, format: #hhh, #hhhhhh, name
        colorRE = '#[0-9a-fA-F]{3,3}|#[0-9a-fA-F]{6,6}|[a-zA-Z]+-?[a-zA-Z]+',

	// range RE string
	rangeRE = numberRE,

	// search RE string
	searchRE = '[^\\r\\n\\f]{0,}',

	// check native support for attribute
	// on specific element types (tagName)
	// don't recreate elements, cache them
	supportAttribute = function(element, attribute) {
		var tagName = element.nodeName;
		return tagName in tagStore ?
			attribute in tagStore[tagName] :
			attribute in (tagStore[tagName] = doc.createElement(tagName));
	},

	// don't copy these attributes
	skipAttr = {
		type: 1,
		value: 1,
		maxlength: 1
	},

	// collection of page forms and elements
	elements = {
		'form': doc.getElementsByTagName('form'),
		'input': doc.getElementsByTagName('input'),
		'select': doc.getElementsByTagName('select'),
		'textarea': doc.getElementsByTagName('textarea')
	},

	// element may be hidden or not displayed
	// trying to focus()/select() throw error
	focusable = function(element) {
		return element && element.offsetWidth > 0 && element.offsetHeight > 0 &&
			element.style.display != 'none' && element.style.visibility != 'hidden';
	},

	// give keyboard focus to element
	setfocus = function(element) {
		if (!focusable(element)) return;
		try {
			// IE needs to defer calling .focus() to work
			setTimeout(function() { element.focus(); }, 0);
		} catch(e) { }
	},

	// IE: prevent ESC+ESC (reset)
	// erasing entered user data
	reset = function(event) {
		event[target].value = '';
		event[target].focus();
		return stop(event);
	},

	// prevent event default action
	stop = function(event) {
		if (event.preventDefault) event.preventDefault();
		else event.returnValue = false;
		return false;
	},

	// copy element attributes on clone element
	cloneAttributes = function(element, clone) {
		var i, j, a = element.attributes, l = a.length, n;
		for (i = 0; l > i; ++i) {
			j = a[i].name.toLowerCase();
			n = element.getAttributeNode(j);
			if (n && n.specified && !skipAttr[j]) {
				if (j == 'class') {
					clone.setAttribute('className', n.value);
				}
				clone.setAttribute(a[i].name, n.value);
			}
		}
		return clone;
	},

	// change field type from password to text
	switchType = w3c ? function(element) {
		element.type = 'text';
		element.value = element.getAttribute('placeholder');
		element.extype = 'password';
		addClass(element, 'placeholder');
	} : function(element) {
		if (!cache[element.uniqueID]) {
			cache[element.uniqueID] = cloneAttributes(element, doc.createElement('input'));
			cache[element.uniqueID][add](prefix + focus, passwordFocus, 0);
			cache[element.uniqueID][add](prefix + blur, passwordBlur, 0);
		}
		cache[element.uniqueID].value = element.getAttribute('placeholder');
		addClass(cache[element.uniqueID], 'placeholder');
		element.replaceNode(cache[element.uniqueID]);
		cache[element.uniqueID].extype = element;
	},

	// field types: select
	changeHandler = function(event) {
		if (event.type == 'change') {
			(event[target].value !== '' || (event[target].selectedIndex > 0 &&
				event[target].options[event[target].selectedIndex].text !== '') ?
					removeClass : addClass)(event[target], 'placeholder');
		} else {
			(event.type == focus ? addClass : removeClass)(event[target], 'focused');
		}
	},

	// field types: password
	passwordBlur = function(event) {
		if (event[target].value === '') {
			if (w3c) {
				addClass(event[target], 'placeholder');
				if (event[target].value === '') {
					event[target].type = 'text';
					event[target].value = event[target].getAttribute('placeholder');
				}
			} else {
				event[target].replaceNode(cache[event[target].uniqueID]);
				removeClass(cache[event[target].uniqueID], 'focused');
			}
		}
		removeClass(event[target], 'focused');
	},

	// field types: password
	passwordFocus = function(event) {
		if (w3c) {
			if (event[target].value == event[target].getAttribute('placeholder')) {
				event[target].value = '';
				event[target].type = event[target].extype;
				if (document.activeElement !== event[target]) {
					event[target].focus();
				}
			}
			removeClass(event[target], 'placeholder');
			addClass(event[target], 'focused');
		} else {
			if (event[target].extype) {
				addClass(event[target].extype, 'focused');
				event[target].extype[rem](prefix + focus, passwordFocus, 0);
				event[target].replaceNode(event[target].extype);
				setfocus(event[target].extype);
				event[target].extype[add](prefix + focus, passwordFocus, 0);
			} else {
				addClass(event[target], 'focused');
			}
		}
	},

	// field types: text, textarea
	blurHandler = function(event) {
		if (event[target].value === '') {
			addClass(event[target], 'placeholder');
			if (!supportAttribute(event[target], 'placeholder')) {
				event[target].value = event[target].getAttribute('placeholder');
			}
		}
		removeClass(event[target], 'focused');
	},

	// field types: text, textarea
	focusHandler = function(event) {
		if (event[target].value == event[target].getAttribute('placeholder')) {
			if (!supportAttribute(event[target], 'placeholder')) {
				event[target].value = '';
			}
		}
		if (event[target].value === '') {
			removeClass(event[target], 'placeholder');
		}
		addClass(event[target], 'focused');
	},

	// control types: textarea
	maxlengthHandler = function(event) {
		if (event[target].value != event[target].getAttribute('placeholder')) {
			if (event[target].value.length > event[target].getAttribute('maxlength')) {
				event[target].value = event[target].value.substring(0, event[target].getAttribute('maxlength'));
			}
		}
	},

	// control types: text
	patternHandler = function(event) {
		// avoid loops on IE since changing class later will fire this again
		// we only need to be notified for the 'value' property to simulate
		// W3C textInput event (input or textInput in other browsers)
		if ('propertyName' in event && event.propertyName != 'value') return true;

		var pattern;

		if ((pattern = event[target].getAttribute('pattern'))) {
			try {
				if (!RegExp(pattern).test(event[target].value)) {
					addClass(event[target], 'mismatch');
				} else {
					removeClass(event[target], 'mismatch');
				}
			} catch(err) { }
		}
		return stop(event);
	},

	// control types: text
	regexpHandler = function(event) {
		var key = String.fromCharCode(event.keyCode ? event.keyCode : event.which),
			special = { '\x08': 1, '\x09': 1, '\x0d': 1, '\x1b': 1 };

		// does key match supplied keylist ?
		if (key.match(event[target].getAttribute('data-regexp'))) {
			return true;
		}

		// allow special keys
		if (key in special || event.charCode === 0 || event.altKey || event.ctrlKey || event.metaKey) {
			return true;
		}
		return stop(event);
	},

	// check html attribute was specified on element
	requireHelper = function(element, attribute) {
		var node = element.getAttributeNode(attribute);
		return node && node.specified && node.value !== null;
	},

	hasClass = function(element, className) {
		return RegExp(("(^|\\s)" + className + "(\\s|$)")).test(element.className);
	},

	addClass = function(element, className) {
		if (!hasClass(element, className)) {
			element.className = element.className.length ? (element.className + ' ' + className) : className;
		}
		return element;
	},

	removeClass = function(element, className) {
		if (hasClass(element, className)) {
			element.className = element.className.replace(RegExp('(?:^|\\s)' + className + '(\\s|$)'), '$1');
		}
		return element;
	};

	(function toggle(event) {

		var i, j, k, autofocus,
			element, field, invalid,
			method, node, pattern, replace;

		// handle the submit event invocation
		// and aborts in case validation fail
		if (event && event.type == 'submit') {
			invalid = false;
			for (j = 0; event[target].elements.length > j; ++j) {
				element = event[target].elements[j];
				// needed for ENTER key submits to avoid bfcache
				// remembering the focused status of the element
				removeClass(element, 'focused');
				if (!element.name || element.type == 'hidden' || element.disabled || element.readOnly) {
					continue;
				}
				// test using getAttributeNode instead of getAttribute to avoid
				// false positives on Opera 7.50, IE6 and other older browsers
				// only perform validation if the control value is not empty (@mathias, @miketaylr)
				if (element.value !== '' && element.getAttribute('placeholder') !== element.value) {
					if ((node = element.getAttributeNode('pattern')) && (pattern = node.value)) {
						try {
							if (RegExp(pattern).test(element.value) && element.getAttribute('placeholder') != element.value) {
								continue;
							}
						} catch(err) { }
						invalid = true;
						break;
					}
				}
				if (element.getAttributeNode('required') && (element.value === '' || element.getAttribute('placeholder') == element.value)) {
					if ('selectedIndex' in element && (k = element.selectedIndex) > -1) {
						// expectation here is for a value or at least index > 0 and valid text
						if (element.value !== '' || (k > 0 && element.options[k].text !== '')) {
							continue;
						}
					}
					invalid = true;
					break;
				}
			}
			if (invalid) {
				addClass(element, 'focused');
				setfocus(element);
				stop(event);
				return;
			}
		}

		// handle both initial setup and the
		// succesful submit event invocation
		method = event === true ? add : rem;

		for (i in elements) {
			for (j = 0; elements[i].length > j; ++j) {
				element = elements[i][j];
				switch (element.nodeName.toLowerCase()) {
					case 'form':

						if (event === true || event.type != 'submit') {
							element[method](prefix + 'reset', reset, false);
							element[method](prefix + 'submit', toggle, false);
						}

						break;

					case 'input':

						if (!element.getAttribute('data-regexp')) {
							switch(element.getAttribute('type')) {
								case 'color':
									element.setAttribute('data-regexp', '[-\w#]');
									break;
								case 'number':
									element.setAttribute('data-regexp', '[-+.0-9e]');
									break;
								case 'date':
								case 'time':
								case 'week':
								case 'month':
								case 'datetime':
								case 'datetime-local':
									element.setAttribute('data-regexp', '[-.\\/ 0-9]');
									break;
								default:
									break;
							}
						}

						if (!element.getAttribute('pattern')) {
							switch(element.getAttribute('type')) {
								case 'number':
									addClass(element, 'number');
									// add spinner up/down key
									element.setAttribute('pattern', '^(?:' + numberRE + ')$');
									break;
								case 'color':
									addClass(element, 'color');
									// add color picker widget
									element.setAttribute('pattern', '^(?:' + colorRE + ')$');
									break;
								case 'range':
									addClass(element, 'range');
									// add spinner/slider widget
									element.setAttribute('pattern', '^(?:' + rangeRE + ')$');
									break;
								case 'search':
									addClass(element, 'search');
									// add round corners & clear button
									element.setAttribute('pattern', '^(?:' + searchRE + ')$');
									break;
								case 'time':
									addClass(element, 'time');
									// add separate time spinner widget
									element.setAttribute('pattern', '^(?:' + timeRE + ')$');
									break;
								case 'date':
									addClass(element, 'date');
									// work for this century (numeric only)
									element.setAttribute('pattern', '^(?:' + dateRE + ')$');
									break;
								case 'week':
									addClass(element, 'week');
									// add spinner up/down key (numeric only)
									element.setAttribute('pattern', '^(?:' + weekRE + ')$');
									break;
								case 'month':
									addClass(element, 'month');
									// add spinner up/down key (numeric only)
									element.setAttribute('pattern', '^(?:' + monthRE + ')$');
									break;
								case 'datetime':
									addClass(element, 'datetime');
									// work for this century (numeric only)
									element.setAttribute('pattern', '^(?:' + dateRE + ' ' + timeRE + ')$');
									break;
								case 'datetime-local':
									addClass(element, 'datetime-local');
									// work for this century (numeric only)
									element.setAttribute('pattern', '^(?:' + dateRE + ' ' + timeRE + ')$');
									break;
								case 'email':
									addClass(element, 'email');
									// RFC2822 email address validation
									element.setAttribute('pattern', '^(?:' + mailRE + '@' + hostRE + ')$');
									break;
								case 'url':
									addClass(element, 'url');
									// URL validation (protocol is optional)
									element.setAttribute('pattern', '^(?:' + protoRE + '?' + hostRE + ')$');
									break;
								default:
									break;
							}
						}

					case 'textarea':

						// required attribute
						if (requireHelper(element, 'required') && event === true) {
							addClass(element, 'required');
						}

						// placeholder attribute
						if (requireHelper(element, 'placeholder')) {

							if (event === true || event.type != 'submit') {

								replace = false;
								if (!supportAttribute(element, 'placeholder')) {
									if (element.type == 'password') {
										element[method](prefix + blur, passwordBlur, false);
										element[method](prefix + focus, passwordFocus, false);
										switchType(element);
										replace = true;
									} else {
										if (element.value === '') {
											element.value = element.getAttribute('placeholder');
										}
										replace = false;
									}
								}
								if (replace === false) {
									element[method](prefix + blur, blurHandler, false);
									element[method](prefix + focus, focusHandler, false);
									if (element.value == element.getAttribute('placeholder')) {
										addClass(element, 'placeholder');
									}
								}

							}

							if (event === true) {
								// needed for bfcache support, VERIFY !
								element.setAttribute('autocomplete', 'off');
							} else {
								// needed for bfcache support, VERIFY !
								element.setAttribute('autocomplete', 'on');
								// clear value before submit if it contains the placeholder
								if (element.value == element.getAttribute('placeholder')) {
									element.value = '';
								}
							}

						}

						// autofocus attribute
						// code need to take over Opera own "autofocus"
						// as a temporary fix due to different behavior
						if (requireHelper(element, 'autofocus') ||
							element.getAttributeNode('autofocus') !== null) {
							autofocus = element;
						}

						// maxlength attribute
						if (requireHelper(element, 'maxlength')) {
							element[method](prefix + input, maxlengthHandler, false);
						}

						// pattern attribute
						if (requireHelper(element, 'pattern')) {
							element[method](prefix + input, patternHandler, false);
						}

						// data-regexp attribute (as seen in ExtJS)
						// limit the range of keys available in this field
						// non standard attribue but I both need & like this
						if (requireHelper(element, 'data-regexp')) {
							element[method](prefix + 'keypress', regexpHandler, false);
						}

						break;

					case 'select':

						element[method](prefix + blur, changeHandler, false);
						element[method](prefix + focus, changeHandler, false);
						element[method](prefix + 'change', changeHandler, false);

						if (event === true) {
							k = 0;
							while (element.options[k]) {
								node = element.options[k].getAttributeNode('value');
								if (node && node.specified && node.value === '') {
									addClass(element.options[k], 'placeholder');
								}
								k++;
							}
							if (element.value === '') {
								addClass(element, 'placeholder');
							}
							if (requireHelper(element, 'required')) {
								addClass(element, 'required');
							}
						}

						break;

					default:

						break;

				}
			}
		}

		// give keyboard focus to the last
		// "autofocus" element in document
		if (event === true && focusable(autofocus)) {
			autofocus.blur();
			setfocus(autofocus);
		}

		// before page unloads call toggle() to cleanup events
		if (global[method]) {
			global[method](prefix + 'beforeunload', toggle, false);
		} else {
			// fix for older Opera < 8
			global.document[method](prefix + 'beforeunload', toggle, false);
		}

		return;

	})(true);

}
