jQuery(document).ready(function($){
	var $lateral_menu_trigger = $('.js-menu-toggle'),
		$content_wrapper = $('.cd-main-content'),
		$navigation = $('header');

	//open-close lateral menu clicking on the menu icon
	$lateral_menu_trigger.on('click', function(event){
		event.preventDefault();

		$lateral_menu_trigger.toggleClass('is-clicked');
		$navigation.toggleClass('lateral-menu-is-open');
		$content_wrapper.toggleClass('lateral-menu-is-open').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
			// firefox transitions break when parent overflow is changed, so we need to wait for the end of the trasition to give the body an overflow hidden
			$('body').toggleClass('overflow-hidden');
		});
		$('#cd-lateral-nav').toggleClass('lateral-menu-is-open');

		//check if transitions are not supported - i.e. in IE9
		if($('html').hasClass('no-csstransitions')) {
			$('body').toggleClass('overflow-hidden');
		}
	});

	//close lateral menu clicking outside the menu itself
	$content_wrapper.on('click', function(event){
		if( !$(event.target).is('#cd-menu-trigger, #cd-menu-trigger span') ) {
			$lateral_menu_trigger.removeClass('is-clicked');
			$navigation.removeClass('lateral-menu-is-open');
			$content_wrapper.removeClass('lateral-menu-is-open').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
				$('body').removeClass('overflow-hidden');
			});
			$('#cd-lateral-nav').removeClass('lateral-menu-is-open');
			//check if transitions are not supported
			if($('html').hasClass('no-csstransitions')) {
				$('body').removeClass('overflow-hidden');
			}

		}
	});

	//open (or close) submenu items in the lateral menu. Close all the other open submenu items.
	$('.item-has-children').children('a').on('click', function(event){
		event.preventDefault();
		$(this).toggleClass('submenu-open').next('.sub-menu').slideToggle(200).end().parent('.item-has-children').siblings('.item-has-children').children('a').removeClass('submenu-open').next('.sub-menu').slideUp(200);
	});
});

jQuery(document).ready(function($){

	var productViewer = function(element) {
		this.element = element;
		this.handleContainer = this.element.find('.cd-product-viewer-handle');
		this.handleFill = this.handleContainer.children('.fill');
		this.handle = this.handleContainer.children('.handle');
		this.imageWrapper = this.element.find('.product-viewer');
		this.slideShow = this.imageWrapper.children('.product-sprite');
		this.frames = this.element.data('frame');
		//increase this value to increase the friction while dragging on the image - it has to be bigger than zero
		this.friction = this.element.data('friction');
		this.visibleFrame = 0;
		this.loaded = false;
		this.animating = false;
		this.xPosition = 0;
		this.loadFrames();
	}

	productViewer.prototype.loadFrames = function() {
		var self = this,
			imageUrl = this.slideShow.data('image'),
			newImg = $('<img/>');
		this.loading('0.5');
		//you need this to check if the image sprite has been loaded
		newImg.attr('src', imageUrl).load(function() {
			$(this).remove();
  			self.loaded = true;
  		}).each(function(){
  			image = this;
			if(image.complete) {
		    	$(image).trigger('load');
		  	}
		});
	}

	productViewer.prototype.loading = function(percentage) {
		var self = this;
		transformElement(this.handleFill, 'scaleX('+ percentage +')');
		setTimeout(function(){
			if( self.loaded ){
				//sprite image has been loaded
				self.element.addClass('loaded');
				transformElement(self.handleFill, 'scaleX(1)');
				self.dragImage();
				if(self.handle) self.dragHandle();
			} else {
				//sprite image has not been loaded - increase self.handleFill scale value
				var newPercentage = parseFloat(percentage) + .1;
				if ( newPercentage < 1 ) {
					self.loading(newPercentage);
				} else {
					self.loading(parseFloat(percentage));
				}
			}
		}, 500);
	}
	//draggable funtionality - credits to http://css-tricks.com/snippets/jquery/draggable-without-jquery-ui/
	productViewer.prototype.dragHandle = function() {
		//implement handle draggability
		var self = this;
		self.handle.on('mousedown vmousedown', function (e) {
	        self.handle.addClass('cd-draggable');
	        var dragWidth = self.handle.outerWidth(),
	            containerOffset = self.handleContainer.offset().left,
	            containerWidth = self.handleContainer.outerWidth(),
	            minLeft = containerOffset - dragWidth/2,
	            maxLeft = containerOffset + containerWidth - dragWidth/2;

	        self.xPosition = self.handle.offset().left + dragWidth - e.pageX;

	        self.element.on('mousemove vmousemove', function (e) {
	        	if( !self.animating) {
	        		self.animating =  true;
		        	( !window.requestAnimationFrame )
		        		? setTimeout(function(){self.animateDraggedHandle(e, dragWidth, containerOffset, containerWidth, minLeft, maxLeft);}, 100)
		        		: requestAnimationFrame(function(){self.animateDraggedHandle(e, dragWidth, containerOffset, containerWidth, minLeft, maxLeft);});
	        	}
	        }).one('mouseup vmouseup', function (e) {
	            self.handle.removeClass('cd-draggable');
	            self.element.off('mousemove vmousemove');
	        });

	        e.preventDefault();

	    }).on('mouseup vmouseup', function (e) {
	        self.handle.removeClass('cd-draggable');
	    });
	}

	productViewer.prototype.animateDraggedHandle = function(e, dragWidth, containerOffset, containerWidth, minLeft, maxLeft) {
		var self = this;
		var leftValue = e.pageX + self.xPosition - dragWidth;
	    // constrain the draggable element to move inside his container
	    if (leftValue < minLeft) {
	        leftValue = minLeft;
	    } else if (leftValue > maxLeft) {
	        leftValue = maxLeft;
	    }

	    var widthValue = Math.ceil( (leftValue + dragWidth / 2 - containerOffset) * 1000 / containerWidth)/10;
	    self.visibleFrame = Math.ceil( (widthValue * (self.frames-1))/100 );

	    //update image frame
	    self.updateFrame();
	    //update handle position
	    $('.cd-draggable', self.handleContainer).css('left', widthValue + '%').one('mouseup vmouseup', function () {
	        $(this).removeClass('cd-draggable');
	    });

	    self.animating = false;
	}

	productViewer.prototype.dragImage = function() {
		//implement image draggability
		var self = this;
		self.slideShow.on('mousedown vmousedown', function (e) {
	        self.slideShow.addClass('cd-draggable');
	        var containerOffset = self.imageWrapper.offset().left,
	            containerWidth = self.imageWrapper.outerWidth(),
	            minFrame = 0,
	            maxFrame = self.frames - 1;

	        self.xPosition = e.pageX;

	        self.element.on('mousemove vmousemove', function (e) {
	        	if( !self.animating) {
	        		self.animating =  true;
		        	( !window.requestAnimationFrame )
		        		? setTimeout(function(){self.animateDraggedImage(e, containerOffset, containerWidth);}, 100)
		        		: requestAnimationFrame(function(){self.animateDraggedImage(e, containerOffset, containerWidth);});
		        }
	        }).one('mouseup vmouseup', function (e) {
	            self.slideShow.removeClass('cd-draggable');
	            self.element.off('mousemove vmousemove');
	            self.updateHandle();
	        });

	        e.preventDefault();

	    }).on('mouseup vmouseup', function (e) {
	        self.slideShow.removeClass('cd-draggable');
	    });
	}

	productViewer.prototype.animateDraggedImage = function(e, containerOffset, containerWidth) {
		var self = this;
		var leftValue = self.xPosition - e.pageX;
        var widthValue = Math.ceil( (leftValue) * 100 / ( containerWidth * self.friction ));
        var frame = (widthValue * (self.frames-1))/100;
        if( frame > 0 ) {
        	frame = Math.floor(frame);
        } else {
        	frame = Math.ceil(frame);
        }
        var newFrame = self.visibleFrame + frame;

        if (newFrame < 0) {
            newFrame = self.frames - 1;
        } else if (newFrame > self.frames - 1) {
            newFrame = 0;
        }

        if( newFrame != self.visibleFrame ) {
        	self.visibleFrame = newFrame;
        	self.updateFrame();
        	self.xPosition = e.pageX;
        }

        self.animating =  false;
	}

	productViewer.prototype.updateHandle = function() {
		if(this.handle) {
			var widthValue = 100*this.visibleFrame/this.frames;
			this.handle.animate({'left': widthValue + '%'}, 200);
		}
	}

	productViewer.prototype.updateFrame = function() {
		var transformValue = - (100 * this.visibleFrame/this.frames);
		transformElement(this.slideShow, 'translateX('+transformValue+'%)');
	}

	function transformElement(element, value) {
		element.css({
			'-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value,
		});
	}

	var productToursWrapper = $('.cd-product-viewer-wrapper');
	productToursWrapper.each(function(){
		new productViewer($(this));
	});
});

/* =========================================================
 * bootstrap-datetimepicker.js
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Improvements by Andrew Rowls
 * Improvements by Sébastien Malot
 * Improvements by Yun Lai
 * Improvements by Kenneth Henderick
 * Improvements by CuGBabyBeaR
 * Improvements by Christian Vaas <auspex@auspex.eu>
 *
 * Project URL : http://www.malot.fr/bootstrap-datetimepicker
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

(function(factory){
    if (typeof define === 'function' && define.amd)
      define(['jquery'], factory);
    else if (typeof exports === 'object')
      factory(require('jquery'));
    else
      factory(jQuery);

}(function($, undefined){

  // Add ECMA262-5 Array methods if not supported natively (IE8)
  if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf = function (find, i) {
      if (i === undefined) i = 0;
      if (i < 0) i += this.length;
      if (i < 0) i = 0;
      for (var n = this.length; i < n; i++) {
        if (i in this && this[i] === find) {
          return i;
        }
      }
      return -1;
    }
  }

  // Add timezone abbreviation support for ie6+, Chrome, Firefox
  function timeZoneAbbreviation() {
    var abbreviation, date, formattedStr, i, len, matchedStrings, ref, str;
    date = (new Date()).toString();
    formattedStr = ((ref = date.split('(')[1]) != null ? ref.slice(0, -1) : 0) || date.split(' ');
    if (formattedStr instanceof Array) {
      matchedStrings = [];
      for (var i = 0, len = formattedStr.length; i < len; i++) {
        str = formattedStr[i];
        if ((abbreviation = (ref = str.match(/\b[A-Z]+\b/)) !== null) ? ref[0] : 0) {
          matchedStrings.push(abbreviation);
        }
      }
      formattedStr = matchedStrings.pop();
    }
    return formattedStr;
  }

  function UTCDate() {
    return new Date(Date.UTC.apply(Date, arguments));
  }

  // Picker object
  var Datetimepicker = function (element, options) {
    var that = this;

    this.element = $(element);

    // add container for single page application
    // when page switch the datetimepicker div will be removed also.
    this.container = options.container || 'body';

    this.language = options.language || this.element.data('date-language') || 'en';
    this.language = this.language in dates ? this.language : this.language.split('-')[0]; // fr-CA fallback to fr
    this.language = this.language in dates ? this.language : 'en';
    this.isRTL = dates[this.language].rtl || false;
    this.formatType = options.formatType || this.element.data('format-type') || 'standard';
    this.format = DPGlobal.parseFormat(options.format || this.element.data('date-format') || dates[this.language].format || DPGlobal.getDefaultFormat(this.formatType, 'input'), this.formatType);
    this.isInline = false;
    this.isVisible = false;
    this.isInput = this.element.is('input');
    this.fontAwesome = options.fontAwesome || this.element.data('font-awesome') || false;

    this.bootcssVer = options.bootcssVer || (this.isInput ? (this.element.is('.form-control') ? 3 : 2) : ( this.bootcssVer = this.element.is('.input-group') ? 3 : 2 ));

    this.component = this.element.is('.date') ? ( this.bootcssVer === 3 ? this.element.find('.input-group-addon .glyphicon-th, .input-group-addon .glyphicon-time, .input-group-addon .glyphicon-remove, .input-group-addon .glyphicon-calendar, .input-group-addon .fa-calendar, .input-group-addon .fa-clock-o').parent() : this.element.find('.add-on .icon-th, .add-on .icon-time, .add-on .icon-calendar, .add-on .fa-calendar, .add-on .fa-clock-o').parent()) : false;
    this.componentReset = this.element.is('.date') ? ( this.bootcssVer === 3 ? this.element.find('.input-group-addon .glyphicon-remove, .input-group-addon .fa-times').parent():this.element.find('.add-on .icon-remove, .add-on .fa-times').parent()) : false;
    this.hasInput = this.component && this.element.find('input').length;
    if (this.component && this.component.length === 0) {
      this.component = false;
    }
    this.linkField = options.linkField || this.element.data('link-field') || false;
    this.linkFormat = DPGlobal.parseFormat(options.linkFormat || this.element.data('link-format') || DPGlobal.getDefaultFormat(this.formatType, 'link'), this.formatType);
    this.minuteStep = options.minuteStep || this.element.data('minute-step') || 5;
    this.pickerPosition = options.pickerPosition || this.element.data('picker-position') || 'bottom-right';
    this.showMeridian = options.showMeridian || this.element.data('show-meridian') || false;
    this.initialDate = options.initialDate || new Date();
    this.zIndex = options.zIndex || this.element.data('z-index') || undefined;
    this.title = typeof options.title === 'undefined' ? false : options.title;
    this.timezone = options.timezone || timeZoneAbbreviation();

    this.icons = {
      leftArrow: this.fontAwesome ? 'fa-arrow-left' : (this.bootcssVer === 3 ? 'glyphicon-arrow-left' : 'icon-arrow-left'),
      rightArrow: this.fontAwesome ? 'fa-arrow-right' : (this.bootcssVer === 3 ? 'glyphicon-arrow-right' : 'icon-arrow-right')
    }
    this.icontype = this.fontAwesome ? 'fa' : 'glyphicon';

    this._attachEvents();

    this.clickedOutside = function (e) {
        // Clicked outside the datetimepicker, hide it
        if ($(e.target).closest('.datetimepicker').length === 0) {
            that.hide();
        }
    }

    this.formatViewType = 'datetime';
    if ('formatViewType' in options) {
      this.formatViewType = options.formatViewType;
    } else if ('formatViewType' in this.element.data()) {
      this.formatViewType = this.element.data('formatViewType');
    }

    this.minView = 0;
    if ('minView' in options) {
      this.minView = options.minView;
    } else if ('minView' in this.element.data()) {
      this.minView = this.element.data('min-view');
    }
    this.minView = DPGlobal.convertViewMode(this.minView);

    this.maxView = DPGlobal.modes.length - 1;
    if ('maxView' in options) {
      this.maxView = options.maxView;
    } else if ('maxView' in this.element.data()) {
      this.maxView = this.element.data('max-view');
    }
    this.maxView = DPGlobal.convertViewMode(this.maxView);

    this.wheelViewModeNavigation = false;
    if ('wheelViewModeNavigation' in options) {
      this.wheelViewModeNavigation = options.wheelViewModeNavigation;
    } else if ('wheelViewModeNavigation' in this.element.data()) {
      this.wheelViewModeNavigation = this.element.data('view-mode-wheel-navigation');
    }

    this.wheelViewModeNavigationInverseDirection = false;

    if ('wheelViewModeNavigationInverseDirection' in options) {
      this.wheelViewModeNavigationInverseDirection = options.wheelViewModeNavigationInverseDirection;
    } else if ('wheelViewModeNavigationInverseDirection' in this.element.data()) {
      this.wheelViewModeNavigationInverseDirection = this.element.data('view-mode-wheel-navigation-inverse-dir');
    }

    this.wheelViewModeNavigationDelay = 100;
    if ('wheelViewModeNavigationDelay' in options) {
      this.wheelViewModeNavigationDelay = options.wheelViewModeNavigationDelay;
    } else if ('wheelViewModeNavigationDelay' in this.element.data()) {
      this.wheelViewModeNavigationDelay = this.element.data('view-mode-wheel-navigation-delay');
    }

    this.startViewMode = 2;
    if ('startView' in options) {
      this.startViewMode = options.startView;
    } else if ('startView' in this.element.data()) {
      this.startViewMode = this.element.data('start-view');
    }
    this.startViewMode = DPGlobal.convertViewMode(this.startViewMode);
    this.viewMode = this.startViewMode;

    this.viewSelect = this.minView;
    if ('viewSelect' in options) {
      this.viewSelect = options.viewSelect;
    } else if ('viewSelect' in this.element.data()) {
      this.viewSelect = this.element.data('view-select');
    }
    this.viewSelect = DPGlobal.convertViewMode(this.viewSelect);

    this.forceParse = true;
    if ('forceParse' in options) {
      this.forceParse = options.forceParse;
    } else if ('dateForceParse' in this.element.data()) {
      this.forceParse = this.element.data('date-force-parse');
    }
    var template = this.bootcssVer === 3 ? DPGlobal.templateV3 : DPGlobal.template;
    while (template.indexOf('{iconType}') !== -1) {
      template = template.replace('{iconType}', this.icontype);
    }
    while (template.indexOf('{leftArrow}') !== -1) {
      template = template.replace('{leftArrow}', this.icons.leftArrow);
    }
    while (template.indexOf('{rightArrow}') !== -1) {
      template = template.replace('{rightArrow}', this.icons.rightArrow);
    }
    this.picker = $(template)
      .appendTo(this.isInline ? this.element : this.container) // 'body')
      .on({
        click:     $.proxy(this.click, this),
        mousedown: $.proxy(this.mousedown, this)
      });

    if (this.wheelViewModeNavigation) {
      if ($.fn.mousewheel) {
        this.picker.on({mousewheel: $.proxy(this.mousewheel, this)});
      } else {
        console.log('Mouse Wheel event is not supported. Please include the jQuery Mouse Wheel plugin before enabling this option');
      }
    }

    if (this.isInline) {
      this.picker.addClass('datetimepicker-inline');
    } else {
      this.picker.addClass('datetimepicker-dropdown-' + this.pickerPosition + ' dropdown-menu');
    }
    if (this.isRTL) {
      this.picker.addClass('datetimepicker-rtl');
      var selector = this.bootcssVer === 3 ? '.prev span, .next span' : '.prev i, .next i';
      this.picker.find(selector).toggleClass(this.icons.leftArrow + ' ' + this.icons.rightArrow);
    }

    $(document).on('mousedown touchend', this.clickedOutside);

    this.autoclose = false;
    if ('autoclose' in options) {
      this.autoclose = options.autoclose;
    } else if ('dateAutoclose' in this.element.data()) {
      this.autoclose = this.element.data('date-autoclose');
    }

    this.keyboardNavigation = true;
    if ('keyboardNavigation' in options) {
      this.keyboardNavigation = options.keyboardNavigation;
    } else if ('dateKeyboardNavigation' in this.element.data()) {
      this.keyboardNavigation = this.element.data('date-keyboard-navigation');
    }

    this.todayBtn = (options.todayBtn || this.element.data('date-today-btn') || false);
    this.clearBtn = (options.clearBtn || this.element.data('date-clear-btn') || false);
    this.todayHighlight = (options.todayHighlight || this.element.data('date-today-highlight') || false);

    this.weekStart = 0;
    if (typeof options.weekStart !== 'undefined') {
      this.weekStart = options.weekStart;
    } else if (typeof this.element.data('date-weekstart') !== 'undefined') {
      this.weekStart = this.element.data('date-weekstart');
    } else if (typeof dates[this.language].weekStart !== 'undefined') {
      this.weekStart = dates[this.language].weekStart;
    }
    this.weekStart = this.weekStart % 7;
    this.weekEnd = ((this.weekStart + 6) % 7);
    this.onRenderDay = function (date) {
      var render = (options.onRenderDay || function () { return []; })(date);
      if (typeof render === 'string') {
        render = [render];
      }
      var res = ['day'];
      return res.concat((render ? render : []));
    };
    this.onRenderHour = function (date) {
      var render = (options.onRenderHour || function () { return []; })(date);
      var res = ['hour'];
      if (typeof render === 'string') {
        render = [render];
      }
      return res.concat((render ? render : []));
    };
    this.onRenderMinute = function (date) {
      var render = (options.onRenderMinute || function () { return []; })(date);
      var res = ['minute'];
      if (typeof render === 'string') {
        render = [render];
      }
      if (date < this.startDate || date > this.endDate) {
        res.push('disabled');
      } else if (Math.floor(this.date.getUTCMinutes() / this.minuteStep) === Math.floor(date.getUTCMinutes() / this.minuteStep)) {
        res.push('active');
      }
      return res.concat((render ? render : []));
    };
    this.onRenderYear = function (date) {
      var render = (options.onRenderYear || function () { return []; })(date);
      var res = ['year'];
      if (typeof render === 'string') {
        render = [render];
      }
      if (this.date.getUTCFullYear() === date.getUTCFullYear()) {
        res.push('active');
      }
      var currentYear = date.getUTCFullYear();
      var endYear = this.endDate.getUTCFullYear();
      if (date < this.startDate || currentYear > endYear) {
        res.push('disabled');
      }
      return res.concat((render ? render : []));
    }
    this.onRenderMonth = function (date) {
      var render = (options.onRenderMonth || function () { return []; })(date);
      var res = ['month'];
      if (typeof render === 'string') {
        render = [render];
      }
      return res.concat((render ? render : []));
    }
    this.startDate = new Date(-8639968443048000);
    this.endDate = new Date(8639968443048000);
    this.datesDisabled = [];
    this.daysOfWeekDisabled = [];
    this.setStartDate(options.startDate || this.element.data('date-startdate'));
    this.setEndDate(options.endDate || this.element.data('date-enddate'));
    this.setDatesDisabled(options.datesDisabled || this.element.data('date-dates-disabled'));
    this.setDaysOfWeekDisabled(options.daysOfWeekDisabled || this.element.data('date-days-of-week-disabled'));
    this.setMinutesDisabled(options.minutesDisabled || this.element.data('date-minute-disabled'));
    this.setHoursDisabled(options.hoursDisabled || this.element.data('date-hour-disabled'));
    this.fillDow();
    this.fillMonths();
    this.update();
    this.showMode();

    if (this.isInline) {
      this.show();
    }
  };

  Datetimepicker.prototype = {
    constructor: Datetimepicker,

    _events:       [],
    _attachEvents: function () {
      this._detachEvents();
      if (this.isInput) { // single input
        this._events = [
          [this.element, {
            focus:   $.proxy(this.show, this),
            keyup:   $.proxy(this.update, this),
            keydown: $.proxy(this.keydown, this)
          }]
        ];
      }
      else if (this.component && this.hasInput) { // component: input + button
        this._events = [
          // For components that are not readonly, allow keyboard nav
          [this.element.find('input'), {
            focus:   $.proxy(this.show, this),
            keyup:   $.proxy(this.update, this),
            keydown: $.proxy(this.keydown, this)
          }],
          [this.component, {
            click: $.proxy(this.show, this)
          }]
        ];
        if (this.componentReset) {
          this._events.push([
            this.componentReset,
            {click: $.proxy(this.reset, this)}
          ]);
        }
      }
      else if (this.element.is('div')) {  // inline datetimepicker
        this.isInline = true;
      }
      else {
        this._events = [
          [this.element, {
            click: $.proxy(this.show, this)
          }]
        ];
      }
      for (var i = 0, el, ev; i < this._events.length; i++) {
        el = this._events[i][0];
        ev = this._events[i][1];
        el.on(ev);
      }
    },

    _detachEvents: function () {
      for (var i = 0, el, ev; i < this._events.length; i++) {
        el = this._events[i][0];
        ev = this._events[i][1];
        el.off(ev);
      }
      this._events = [];
    },

    show: function (e) {
      this.picker.show();
      this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
      if (this.forceParse) {
        this.update();
      }
      this.place();
      $(window).on('resize', $.proxy(this.place, this));
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      this.isVisible = true;
      this.element.trigger({
        type: 'show',
        date: this.date
      });
    },

    hide: function () {
      if (!this.isVisible) return;
      if (this.isInline) return;
      this.picker.hide();
      $(window).off('resize', this.place);
      this.viewMode = this.startViewMode;
      this.showMode();
      if (!this.isInput) {
        $(document).off('mousedown', this.hide);
      }

      if (
        this.forceParse &&
          (
            this.isInput && this.element.val() ||
              this.hasInput && this.element.find('input').val()
            )
        )
        this.setValue();
      this.isVisible = false;
      this.element.trigger({
        type: 'hide',
        date: this.date
      });
    },

    remove: function () {
      this._detachEvents();
      $(document).off('mousedown', this.clickedOutside);
      this.picker.remove();
      delete this.picker;
      delete this.element.data().datetimepicker;
    },

    getDate: function () {
      var d = this.getUTCDate();
      if (d === null) {
        return null;
      }
      return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
    },

    getUTCDate: function () {
      return this.date;
    },

    getInitialDate: function () {
      return this.initialDate
    },

    setInitialDate: function (initialDate) {
      this.initialDate = initialDate;
    },

    setDate: function (d) {
      this.setUTCDate(new Date(d.getTime() - (d.getTimezoneOffset() * 60000)));
    },

    setUTCDate: function (d) {
      if (d >= this.startDate && d <= this.endDate) {
        this.date = d;
        this.setValue();
        this.viewDate = this.date;
        this.fill();
      } else {
        this.element.trigger({
          type:      'outOfRange',
          date:      d,
          startDate: this.startDate,
          endDate:   this.endDate
        });
      }
    },

    setFormat: function (format) {
      this.format = DPGlobal.parseFormat(format, this.formatType);
      var element;
      if (this.isInput) {
        element = this.element;
      } else if (this.component) {
        element = this.element.find('input');
      }
      if (element && element.val()) {
        this.setValue();
      }
    },

    setValue: function () {
      var formatted = this.getFormattedDate();
      if (!this.isInput) {
        if (this.component) {
          this.element.find('input').val(formatted);
        }
        this.element.data('date', formatted);
      } else {
        this.element.val(formatted);
      }
      if (this.linkField) {
        $('#' + this.linkField).val(this.getFormattedDate(this.linkFormat));
      }
    },

    getFormattedDate: function (format) {
      format = format || this.format;
      return DPGlobal.formatDate(this.date, format, this.language, this.formatType, this.timezone);
    },

    setStartDate: function (startDate) {
      this.startDate = startDate || this.startDate;
      if (this.startDate.valueOf() !== 8639968443048000) {
        this.startDate = DPGlobal.parseDate(this.startDate, this.format, this.language, this.formatType, this.timezone);
      }
      this.update();
      this.updateNavArrows();
    },

    setEndDate: function (endDate) {
      this.endDate = endDate || this.endDate;
      if (this.endDate.valueOf() !== 8639968443048000) {
        this.endDate = DPGlobal.parseDate(this.endDate, this.format, this.language, this.formatType, this.timezone);
      }
      this.update();
      this.updateNavArrows();
    },

    setDatesDisabled: function (datesDisabled) {
      this.datesDisabled = datesDisabled || [];
      if (!$.isArray(this.datesDisabled)) {
        this.datesDisabled = this.datesDisabled.split(/,\s*/);
      }
      var mThis = this;
      this.datesDisabled = $.map(this.datesDisabled, function (d) {
        return DPGlobal.parseDate(d, mThis.format, mThis.language, mThis.formatType, mThis.timezone).toDateString();
      });
      this.update();
      this.updateNavArrows();
    },

    setTitle: function (selector, value) {
      return this.picker.find(selector)
        .find('th:eq(1)')
        .text(this.title === false ? value : this.title);
    },

    setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
      this.daysOfWeekDisabled = daysOfWeekDisabled || [];
      if (!$.isArray(this.daysOfWeekDisabled)) {
        this.daysOfWeekDisabled = this.daysOfWeekDisabled.split(/,\s*/);
      }
      this.daysOfWeekDisabled = $.map(this.daysOfWeekDisabled, function (d) {
        return parseInt(d, 10);
      });
      this.update();
      this.updateNavArrows();
    },

    setMinutesDisabled: function (minutesDisabled) {
      this.minutesDisabled = minutesDisabled || [];
      if (!$.isArray(this.minutesDisabled)) {
        this.minutesDisabled = this.minutesDisabled.split(/,\s*/);
      }
      this.minutesDisabled = $.map(this.minutesDisabled, function (d) {
        return parseInt(d, 10);
      });
      this.update();
      this.updateNavArrows();
    },

    setHoursDisabled: function (hoursDisabled) {
      this.hoursDisabled = hoursDisabled || [];
      if (!$.isArray(this.hoursDisabled)) {
        this.hoursDisabled = this.hoursDisabled.split(/,\s*/);
      }
      this.hoursDisabled = $.map(this.hoursDisabled, function (d) {
        return parseInt(d, 10);
      });
      this.update();
      this.updateNavArrows();
    },

    place: function () {
      if (this.isInline) return;

      if (!this.zIndex) {
        var index_highest = 0;
        $('div').each(function () {
          var index_current = parseInt($(this).css('zIndex'), 10);
          if (index_current > index_highest) {
            index_highest = index_current;
          }
        });
        this.zIndex = index_highest + 10;
      }

      var offset, top, left, containerOffset;
      if (this.container instanceof $) {
        containerOffset = this.container.offset();
      } else {
        containerOffset = $(this.container).offset();
      }

      if (this.component) {
        offset = this.component.offset();
        left = offset.left;
        if (this.pickerPosition === 'bottom-left' || this.pickerPosition === 'top-left') {
          left += this.component.outerWidth() - this.picker.outerWidth();
        }
      } else {
        offset = this.element.offset();
        left = offset.left;
        if (this.pickerPosition === 'bottom-left' || this.pickerPosition === 'top-left') {
          left += this.element.outerWidth() - this.picker.outerWidth();
        }
      }

      var bodyWidth = document.body.clientWidth || window.innerWidth;
      if (left + 220 > bodyWidth) {
        left = bodyWidth - 220;
      }

      if (this.pickerPosition === 'top-left' || this.pickerPosition === 'top-right') {
        top = offset.top - this.picker.outerHeight();
      } else {
        top = offset.top + this.height;
      }

      top = top - containerOffset.top;
      left = left - containerOffset.left;

      this.picker.css({
        top:    top,
        left:   left,
        zIndex: this.zIndex
      });
    },

    hour_minute: "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]",

    update: function () {
      var date, fromArgs = false;
      if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
        date = arguments[0];
        fromArgs = true;
      } else {
        date = (this.isInput ? this.element.val() : this.element.find('input').val()) || this.element.data('date') || this.initialDate;
        if (typeof date === 'string') {
          date = date.replace(/^\s+|\s+$/g,'');
        }
      }

      if (!date) {
        date = new Date();
        fromArgs = false;
      }

      if (typeof date === "string") {
        if (new RegExp(this.hour_minute).test(date) || new RegExp(this.hour_minute + ":[0-5][0-9]").test(date)) {
          date = this.getDate()
        }
      }

      this.date = DPGlobal.parseDate(date, this.format, this.language, this.formatType, this.timezone);

      if (fromArgs) this.setValue();

      if (this.date < this.startDate) {
        this.viewDate = new Date(this.startDate);
      } else if (this.date > this.endDate) {
        this.viewDate = new Date(this.endDate);
      } else {
        this.viewDate = new Date(this.date);
      }
      this.fill();
    },

    fillDow: function () {
      var dowCnt = this.weekStart,
        html = '<tr>';
      while (dowCnt < this.weekStart + 7) {
        html += '<th class="dow">' + dates[this.language].daysMin[(dowCnt++) % 7] + '</th>';
      }
      html += '</tr>';
      this.picker.find('.datetimepicker-days thead').append(html);
    },

    fillMonths: function () {
      var html = '';
      var d = new Date(this.viewDate);
      for (var i = 0; i < 12; i++) {
        d.setUTCMonth(i);
        var classes = this.onRenderMonth(d);
        html += '<span class="' + classes.join(' ') + '">' + dates[this.language].monthsShort[i] + '</span>';
      }
      this.picker.find('.datetimepicker-months td').html(html);
    },

    fill: function () {
      if (!this.date || !this.viewDate) {
        return;
      }
      var d = new Date(this.viewDate),
        year = d.getUTCFullYear(),
        month = d.getUTCMonth(),
        dayMonth = d.getUTCDate(),
        hours = d.getUTCHours(),
        startYear = this.startDate.getUTCFullYear(),
        startMonth = this.startDate.getUTCMonth(),
        endYear = this.endDate.getUTCFullYear(),
        endMonth = this.endDate.getUTCMonth() + 1,
        currentDate = (new UTCDate(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate())).valueOf(),
        today = new Date();
      this.setTitle('.datetimepicker-days', dates[this.language].months[month] + ' ' + year)
      if (this.formatViewType === 'time') {
        var formatted = this.getFormattedDate();
        this.setTitle('.datetimepicker-hours', formatted);
        this.setTitle('.datetimepicker-minutes', formatted);
      } else {
        this.setTitle('.datetimepicker-hours', dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
        this.setTitle('.datetimepicker-minutes', dayMonth + ' ' + dates[this.language].months[month] + ' ' + year);
      }
      this.picker.find('tfoot th.today')
        .text(dates[this.language].today || dates['en'].today)
        .toggle(this.todayBtn !== false);
      this.picker.find('tfoot th.clear')
        .text(dates[this.language].clear || dates['en'].clear)
        .toggle(this.clearBtn !== false);
      this.updateNavArrows();
      this.fillMonths();
      var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
        day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
      prevMonth.setUTCDate(day);
      prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
      var nextMonth = new Date(prevMonth);
      nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
      nextMonth = nextMonth.valueOf();
      var html = [];
      var classes;
      while (prevMonth.valueOf() < nextMonth) {
        if (prevMonth.getUTCDay() === this.weekStart) {
          html.push('<tr>');
        }
        classes = this.onRenderDay(prevMonth);
        if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() < month)) {
          classes.push('old');
        } else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() > month)) {
          classes.push('new');
        }
        // Compare internal UTC date with local today, not UTC today
        if (this.todayHighlight &&
          prevMonth.getUTCFullYear() === today.getFullYear() &&
          prevMonth.getUTCMonth() === today.getMonth() &&
          prevMonth.getUTCDate() === today.getDate()) {
          classes.push('today');
        }
        if (prevMonth.valueOf() === currentDate) {
          classes.push('active');
        }
        if ((prevMonth.valueOf() + 86400000) <= this.startDate || prevMonth.valueOf() > this.endDate ||
          $.inArray(prevMonth.getUTCDay(), this.daysOfWeekDisabled) !== -1 ||
          $.inArray(prevMonth.toDateString(), this.datesDisabled) !== -1) {
          classes.push('disabled');
        }
        html.push('<td class="' + classes.join(' ') + '">' + prevMonth.getUTCDate() + '</td>');
        if (prevMonth.getUTCDay() === this.weekEnd) {
          html.push('</tr>');
        }
        prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
      }
      this.picker.find('.datetimepicker-days tbody').empty().append(html.join(''));

      html = [];
      var txt = '', meridian = '', meridianOld = '';
      var hoursDisabled = this.hoursDisabled || [];
      d = new Date(this.viewDate)
      for (var i = 0; i < 24; i++) {
        d.setUTCHours(i);
        classes = this.onRenderHour(d);
        if (hoursDisabled.indexOf(i) !== -1) {
          classes.push('disabled');
        }
        var actual = UTCDate(year, month, dayMonth, i);
        // We want the previous hour for the startDate
        if ((actual.valueOf() + 3600000) <= this.startDate || actual.valueOf() > this.endDate) {
          classes.push('disabled');
        } else if (hours === i) {
          classes.push('active');
        }
        if (this.showMeridian && dates[this.language].meridiem.length === 2) {
          meridian = (i < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
          if (meridian !== meridianOld) {
            if (meridianOld !== '') {
              html.push('</fieldset>');
            }
            html.push('<fieldset class="hour"><legend>' + meridian.toUpperCase() + '</legend>');
          }
          meridianOld = meridian;
          txt = (i % 12 ? i % 12 : 12);
          if (i < 12) {
            classes.push('hour_am');
          } else {
            classes.push('hour_pm');
          }
          html.push('<span class="' + classes.join(' ') + '">' + txt + '</span>');
          if (i === 23) {
            html.push('</fieldset>');
          }
        } else {
          txt = i + ':00';
          html.push('<span class="' + classes.join(' ') + '">' + txt + '</span>');
        }
      }
      this.picker.find('.datetimepicker-hours td').html(html.join(''));

      html = [];
      txt = '';
      meridian = '';
      meridianOld = '';
      var minutesDisabled = this.minutesDisabled || [];
      d = new Date(this.viewDate);
      for (var i = 0; i < 60; i += this.minuteStep) {
        if (minutesDisabled.indexOf(i) !== -1) continue;
        d.setUTCMinutes(i);
        d.setUTCSeconds(0);
        classes = this.onRenderMinute(d);
        if (this.showMeridian && dates[this.language].meridiem.length === 2) {
          meridian = (hours < 12 ? dates[this.language].meridiem[0] : dates[this.language].meridiem[1]);
          if (meridian !== meridianOld) {
            if (meridianOld !== '') {
              html.push('</fieldset>');
            }
            html.push('<fieldset class="minute"><legend>' + meridian.toUpperCase() + '</legend>');
          }
          meridianOld = meridian;
          txt = (hours % 12 ? hours % 12 : 12);
          html.push('<span class="' + classes.join(' ') + '">' + txt + ':' + (i < 10 ? '0' + i : i) + '</span>');
          if (i === 59) {
            html.push('</fieldset>');
          }
        } else {
          txt = i + ':00';
          html.push('<span class="' + classes.join(' ') + '">' + hours + ':' + (i < 10 ? '0' + i : i) + '</span>');
        }
      }
      this.picker.find('.datetimepicker-minutes td').html(html.join(''));

      var currentYear = this.date.getUTCFullYear();
      var months = this.setTitle('.datetimepicker-months', year)
        .end()
        .find('.month').removeClass('active');
      if (currentYear === year) {
        // getUTCMonths() returns 0 based, and we need to select the next one
        // To cater bootstrap 2 we don't need to select the next one
        months.eq(this.date.getUTCMonth()).addClass('active');
      }
      if (year < startYear || year > endYear) {
        months.addClass('disabled');
      }
      if (year === startYear) {
        months.slice(0, startMonth).addClass('disabled');
      }
      if (year === endYear) {
        months.slice(endMonth).addClass('disabled');
      }

      html = '';
      year = parseInt(year / 10, 10) * 10;
      var yearCont = this.setTitle('.datetimepicker-years', year + '-' + (year + 9))
        .end()
        .find('td');
      year -= 1;
      d = new Date(this.viewDate);
      for (var i = -1; i < 11; i++) {
        d.setUTCFullYear(year);
        classes = this.onRenderYear(d);
        if (i === -1 || i === 10) {
          classes.push(old);
        }
        html += '<span class="' + classes.join(' ') + '">' + year + '</span>';
        year += 1;
      }
      yearCont.html(html);
      this.place();
    },

    updateNavArrows: function () {
      var d = new Date(this.viewDate),
        year = d.getUTCFullYear(),
        month = d.getUTCMonth(),
        day = d.getUTCDate(),
        hour = d.getUTCHours();
      switch (this.viewMode) {
        case 0:
          if (year <= this.startDate.getUTCFullYear()
            && month <= this.startDate.getUTCMonth()
            && day <= this.startDate.getUTCDate()
            && hour <= this.startDate.getUTCHours()) {
            this.picker.find('.prev').css({visibility: 'hidden'});
          } else {
            this.picker.find('.prev').css({visibility: 'visible'});
          }
          if (year >= this.endDate.getUTCFullYear()
            && month >= this.endDate.getUTCMonth()
            && day >= this.endDate.getUTCDate()
            && hour >= this.endDate.getUTCHours()) {
            this.picker.find('.next').css({visibility: 'hidden'});
          } else {
            this.picker.find('.next').css({visibility: 'visible'});
          }
          break;
        case 1:
          if (year <= this.startDate.getUTCFullYear()
            && month <= this.startDate.getUTCMonth()
            && day <= this.startDate.getUTCDate()) {
            this.picker.find('.prev').css({visibility: 'hidden'});
          } else {
            this.picker.find('.prev').css({visibility: 'visible'});
          }
          if (year >= this.endDate.getUTCFullYear()
            && month >= this.endDate.getUTCMonth()
            && day >= this.endDate.getUTCDate()) {
            this.picker.find('.next').css({visibility: 'hidden'});
          } else {
            this.picker.find('.next').css({visibility: 'visible'});
          }
          break;
        case 2:
          if (year <= this.startDate.getUTCFullYear()
            && month <= this.startDate.getUTCMonth()) {
            this.picker.find('.prev').css({visibility: 'hidden'});
          } else {
            this.picker.find('.prev').css({visibility: 'visible'});
          }
          if (year >= this.endDate.getUTCFullYear()
            && month >= this.endDate.getUTCMonth()) {
            this.picker.find('.next').css({visibility: 'hidden'});
          } else {
            this.picker.find('.next').css({visibility: 'visible'});
          }
          break;
        case 3:
        case 4:
          if (year <= this.startDate.getUTCFullYear()) {
            this.picker.find('.prev').css({visibility: 'hidden'});
          } else {
            this.picker.find('.prev').css({visibility: 'visible'});
          }
          if (year >= this.endDate.getUTCFullYear()) {
            this.picker.find('.next').css({visibility: 'hidden'});
          } else {
            this.picker.find('.next').css({visibility: 'visible'});
          }
          break;
      }
    },

    mousewheel: function (e) {

      e.preventDefault();
      e.stopPropagation();

      if (this.wheelPause) {
        return;
      }

      this.wheelPause = true;

      var originalEvent = e.originalEvent;

      var delta = originalEvent.wheelDelta;

      var mode = delta > 0 ? 1 : (delta === 0) ? 0 : -1;

      if (this.wheelViewModeNavigationInverseDirection) {
        mode = -mode;
      }

      this.showMode(mode);

      setTimeout($.proxy(function () {

        this.wheelPause = false

      }, this), this.wheelViewModeNavigationDelay);

    },

    click: function (e) {
      e.stopPropagation();
      e.preventDefault();
      var target = $(e.target).closest('span, td, th, legend');
      if (target.is('.' + this.icontype)) {
        target = $(target).parent().closest('span, td, th, legend');
      }
      if (target.length === 1) {
        if (target.is('.disabled')) {
          this.element.trigger({
            type:      'outOfRange',
            date:      this.viewDate,
            startDate: this.startDate,
            endDate:   this.endDate
          });
          return;
        }
        switch (target[0].nodeName.toLowerCase()) {
          case 'th':
            switch (target[0].className) {
              case 'switch':
                this.showMode(1);
                break;
              case 'prev':
              case 'next':
                var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1);
                switch (this.viewMode) {
                  case 0:
                    this.viewDate = this.moveHour(this.viewDate, dir);
                    break;
                  case 1:
                    this.viewDate = this.moveDate(this.viewDate, dir);
                    break;
                  case 2:
                    this.viewDate = this.moveMonth(this.viewDate, dir);
                    break;
                  case 3:
                  case 4:
                    this.viewDate = this.moveYear(this.viewDate, dir);
                    break;
                }
                this.fill();
                this.element.trigger({
                  type:      target[0].className + ':' + this.convertViewModeText(this.viewMode),
                  date:      this.viewDate,
                  startDate: this.startDate,
                  endDate:   this.endDate
                });
                break;
              case 'clear':
                this.reset();
                if (this.autoclose) {
                  this.hide();
                }
                break;
              case 'today':
                var date = new Date();
                date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0);

                // Respect startDate and endDate.
                if (date < this.startDate) date = this.startDate;
                else if (date > this.endDate) date = this.endDate;

                this.viewMode = this.startViewMode;
                this.showMode(0);
                this._setDate(date);
                this.fill();
                if (this.autoclose) {
                  this.hide();
                }
                break;
            }
            break;
          case 'span':
            if (!target.is('.disabled')) {
              var year = this.viewDate.getUTCFullYear(),
                month = this.viewDate.getUTCMonth(),
                day = this.viewDate.getUTCDate(),
                hours = this.viewDate.getUTCHours(),
                minutes = this.viewDate.getUTCMinutes(),
                seconds = this.viewDate.getUTCSeconds();

              if (target.is('.month')) {
                this.viewDate.setUTCDate(1);
                month = target.parent().find('span').index(target);
                day = this.viewDate.getUTCDate();
                this.viewDate.setUTCMonth(month);
                this.element.trigger({
                  type: 'changeMonth',
                  date: this.viewDate
                });
                if (this.viewSelect >= 3) {
                  this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                }
              } else if (target.is('.year')) {
                this.viewDate.setUTCDate(1);
                year = parseInt(target.text(), 10) || 0;
                this.viewDate.setUTCFullYear(year);
                this.element.trigger({
                  type: 'changeYear',
                  date: this.viewDate
                });
                if (this.viewSelect >= 4) {
                  this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                }
              } else if (target.is('.hour')) {
                hours = parseInt(target.text(), 10) || 0;
                if (target.hasClass('hour_am') || target.hasClass('hour_pm')) {
                  if (hours === 12 && target.hasClass('hour_am')) {
                    hours = 0;
                  } else if (hours !== 12 && target.hasClass('hour_pm')) {
                    hours += 12;
                  }
                }
                this.viewDate.setUTCHours(hours);
                this.element.trigger({
                  type: 'changeHour',
                  date: this.viewDate
                });
                if (this.viewSelect >= 1) {
                  this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                }
              } else if (target.is('.minute')) {
                minutes = parseInt(target.text().substr(target.text().indexOf(':') + 1), 10) || 0;
                this.viewDate.setUTCMinutes(minutes);
                this.element.trigger({
                  type: 'changeMinute',
                  date: this.viewDate
                });
                if (this.viewSelect >= 0) {
                  this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
                }
              }
              if (this.viewMode !== 0) {
                var oldViewMode = this.viewMode;
                this.showMode(-1);
                this.fill();
                if (oldViewMode === this.viewMode && this.autoclose) {
                  this.hide();
                }
              } else {
                this.fill();
                if (this.autoclose) {
                  this.hide();
                }
              }
            }
            break;
          case 'td':
            if (target.is('.day') && !target.is('.disabled')) {
              var day = parseInt(target.text(), 10) || 1;
              var year = this.viewDate.getUTCFullYear(),
                month = this.viewDate.getUTCMonth(),
                hours = this.viewDate.getUTCHours(),
                minutes = this.viewDate.getUTCMinutes(),
                seconds = this.viewDate.getUTCSeconds();
              if (target.is('.old')) {
                if (month === 0) {
                  month = 11;
                  year -= 1;
                } else {
                  month -= 1;
                }
              } else if (target.is('.new')) {
                if (month === 11) {
                  month = 0;
                  year += 1;
                } else {
                  month += 1;
                }
              }
              this.viewDate.setUTCFullYear(year);
              this.viewDate.setUTCMonth(month, day);
              this.element.trigger({
                type: 'changeDay',
                date: this.viewDate
              });
              if (this.viewSelect >= 2) {
                this._setDate(UTCDate(year, month, day, hours, minutes, seconds, 0));
              }
            }
            var oldViewMode = this.viewMode;
            this.showMode(-1);
            this.fill();
            if (oldViewMode === this.viewMode && this.autoclose) {
              this.hide();
            }
            break;
        }
      }
    },

    _setDate: function (date, which) {
      if (!which || which === 'date')
        this.date = date;
      if (!which || which === 'view')
        this.viewDate = date;
      this.fill();
      this.setValue();
      var element;
      if (this.isInput) {
        element = this.element;
      } else if (this.component) {
        element = this.element.find('input');
      }
      if (element) {
        element.change();
      }
      this.element.trigger({
        type: 'changeDate',
        date: this.getDate()
      });
      if(date === null)
        this.date = this.viewDate;
    },

    moveMinute: function (date, dir) {
      if (!dir) return date;
      var new_date = new Date(date.valueOf());
      //dir = dir > 0 ? 1 : -1;
      new_date.setUTCMinutes(new_date.getUTCMinutes() + (dir * this.minuteStep));
      return new_date;
    },

    moveHour: function (date, dir) {
      if (!dir) return date;
      var new_date = new Date(date.valueOf());
      //dir = dir > 0 ? 1 : -1;
      new_date.setUTCHours(new_date.getUTCHours() + dir);
      return new_date;
    },

    moveDate: function (date, dir) {
      if (!dir) return date;
      var new_date = new Date(date.valueOf());
      //dir = dir > 0 ? 1 : -1;
      new_date.setUTCDate(new_date.getUTCDate() + dir);
      return new_date;
    },

    moveMonth: function (date, dir) {
      if (!dir) return date;
      var new_date = new Date(date.valueOf()),
        day = new_date.getUTCDate(),
        month = new_date.getUTCMonth(),
        mag = Math.abs(dir),
        new_month, test;
      dir = dir > 0 ? 1 : -1;
      if (mag === 1) {
        test = dir === -1
          // If going back one month, make sure month is not current month
          // (eg, Mar 31 -> Feb 31 === Feb 28, not Mar 02)
          ? function () {
          return new_date.getUTCMonth() === month;
        }
          // If going forward one month, make sure month is as expected
          // (eg, Jan 31 -> Feb 31 === Feb 28, not Mar 02)
          : function () {
          return new_date.getUTCMonth() !== new_month;
        };
        new_month = month + dir;
        new_date.setUTCMonth(new_month);
        // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
        if (new_month < 0 || new_month > 11)
          new_month = (new_month + 12) % 12;
      } else {
        // For magnitudes >1, move one month at a time...
        for (var i = 0; i < mag; i++)
          // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
          new_date = this.moveMonth(new_date, dir);
        // ...then reset the day, keeping it in the new month
        new_month = new_date.getUTCMonth();
        new_date.setUTCDate(day);
        test = function () {
          return new_month !== new_date.getUTCMonth();
        };
      }
      // Common date-resetting loop -- if date is beyond end of month, make it
      // end of month
      while (test()) {
        new_date.setUTCDate(--day);
        new_date.setUTCMonth(new_month);
      }
      return new_date;
    },

    moveYear: function (date, dir) {
      return this.moveMonth(date, dir * 12);
    },

    dateWithinRange: function (date) {
      return date >= this.startDate && date <= this.endDate;
    },

    keydown: function (e) {
      if (this.picker.is(':not(:visible)')) {
        if (e.keyCode === 27) // allow escape to hide and re-show picker
          this.show();
        return;
      }
      var dateChanged = false,
        dir, newDate, newViewDate;
      switch (e.keyCode) {
        case 27: // escape
          this.hide();
          e.preventDefault();
          break;
        case 37: // left
        case 39: // right
          if (!this.keyboardNavigation) break;
          dir = e.keyCode === 37 ? -1 : 1;
          var viewMode = this.viewMode;
          if (e.ctrlKey) {
            viewMode += 2;
          } else if (e.shiftKey) {
            viewMode += 1;
          }
          if (viewMode === 4) {
            newDate = this.moveYear(this.date, dir);
            newViewDate = this.moveYear(this.viewDate, dir);
          } else if (viewMode === 3) {
            newDate = this.moveMonth(this.date, dir);
            newViewDate = this.moveMonth(this.viewDate, dir);
          } else if (viewMode === 2) {
            newDate = this.moveDate(this.date, dir);
            newViewDate = this.moveDate(this.viewDate, dir);
          } else if (viewMode === 1) {
            newDate = this.moveHour(this.date, dir);
            newViewDate = this.moveHour(this.viewDate, dir);
          } else if (viewMode === 0) {
            newDate = this.moveMinute(this.date, dir);
            newViewDate = this.moveMinute(this.viewDate, dir);
          }
          if (this.dateWithinRange(newDate)) {
            this.date = newDate;
            this.viewDate = newViewDate;
            this.setValue();
            this.update();
            e.preventDefault();
            dateChanged = true;
          }
          break;
        case 38: // up
        case 40: // down
          if (!this.keyboardNavigation) break;
          dir = e.keyCode === 38 ? -1 : 1;
          viewMode = this.viewMode;
          if (e.ctrlKey) {
            viewMode += 2;
          } else if (e.shiftKey) {
            viewMode += 1;
          }
          if (viewMode === 4) {
            newDate = this.moveYear(this.date, dir);
            newViewDate = this.moveYear(this.viewDate, dir);
          } else if (viewMode === 3) {
            newDate = this.moveMonth(this.date, dir);
            newViewDate = this.moveMonth(this.viewDate, dir);
          } else if (viewMode === 2) {
            newDate = this.moveDate(this.date, dir * 7);
            newViewDate = this.moveDate(this.viewDate, dir * 7);
          } else if (viewMode === 1) {
            if (this.showMeridian) {
              newDate = this.moveHour(this.date, dir * 6);
              newViewDate = this.moveHour(this.viewDate, dir * 6);
            } else {
              newDate = this.moveHour(this.date, dir * 4);
              newViewDate = this.moveHour(this.viewDate, dir * 4);
            }
          } else if (viewMode === 0) {
            newDate = this.moveMinute(this.date, dir * 4);
            newViewDate = this.moveMinute(this.viewDate, dir * 4);
          }
          if (this.dateWithinRange(newDate)) {
            this.date = newDate;
            this.viewDate = newViewDate;
            this.setValue();
            this.update();
            e.preventDefault();
            dateChanged = true;
          }
          break;
        case 13: // enter
          if (this.viewMode !== 0) {
            var oldViewMode = this.viewMode;
            this.showMode(-1);
            this.fill();
            if (oldViewMode === this.viewMode && this.autoclose) {
              this.hide();
            }
          } else {
            this.fill();
            if (this.autoclose) {
              this.hide();
            }
          }
          e.preventDefault();
          break;
        case 9: // tab
          this.hide();
          break;
      }
      if (dateChanged) {
        var element;
        if (this.isInput) {
          element = this.element;
        } else if (this.component) {
          element = this.element.find('input');
        }
        if (element) {
          element.change();
        }
        this.element.trigger({
          type: 'changeDate',
          date: this.getDate()
        });
      }
    },

    showMode: function (dir) {
      if (dir) {
        var newViewMode = Math.max(0, Math.min(DPGlobal.modes.length - 1, this.viewMode + dir));
        if (newViewMode >= this.minView && newViewMode <= this.maxView) {
          this.element.trigger({
            type:        'changeMode',
            date:        this.viewDate,
            oldViewMode: this.viewMode,
            newViewMode: newViewMode
          });

          this.viewMode = newViewMode;
        }
      }
      /*
       vitalets: fixing bug of very special conditions:
       jquery 1.7.1 + webkit + show inline datetimepicker in bootstrap popover.
       Method show() does not set display css correctly and datetimepicker is not shown.
       Changed to .css('display', 'block') solve the problem.
       See https://github.com/vitalets/x-editable/issues/37

       In jquery 1.7.2+ everything works fine.
       */
      //this.picker.find('>div').hide().filter('.datetimepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
      this.picker.find('>div').hide().filter('.datetimepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
      this.updateNavArrows();
    },

    reset: function () {
      this._setDate(null, 'date');
    },

    convertViewModeText:  function (viewMode) {
      switch (viewMode) {
        case 4:
          return 'decade';
        case 3:
          return 'year';
        case 2:
          return 'month';
        case 1:
          return 'day';
        case 0:
          return 'hour';
      }
    }
  };

  var old = $.fn.datetimepicker;
  $.fn.datetimepicker = function (option) {
    var args = Array.apply(null, arguments);
    args.shift();
    var internal_return;
    this.each(function () {
      var $this = $(this),
        data = $this.data('datetimepicker'),
        options = typeof option === 'object' && option;
      if (!data) {
        $this.data('datetimepicker', (data = new Datetimepicker(this, $.extend({}, $.fn.datetimepicker.defaults, options))));
      }
      if (typeof option === 'string' && typeof data[option] === 'function') {
        internal_return = data[option].apply(data, args);
        if (internal_return !== undefined) {
          return false;
        }
      }
    });
    if (internal_return !== undefined)
      return internal_return;
    else
      return this;
  };

  $.fn.datetimepicker.defaults = {
  };
  $.fn.datetimepicker.Constructor = Datetimepicker;
  var dates = $.fn.datetimepicker.dates = {
    en: {
      days:        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      daysShort:   ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      daysMin:     ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
      months:      ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      meridiem:    ['am', 'pm'],
      suffix:      ['st', 'nd', 'rd', 'th'],
      today:       'Today',
      clear:       'Clear'
    }
  };

  var DPGlobal = {
    modes:            [
      {
        clsName: 'minutes',
        navFnc:  'Hours',
        navStep: 1
      },
      {
        clsName: 'hours',
        navFnc:  'Date',
        navStep: 1
      },
      {
        clsName: 'days',
        navFnc:  'Month',
        navStep: 1
      },
      {
        clsName: 'months',
        navFnc:  'FullYear',
        navStep: 1
      },
      {
        clsName: 'years',
        navFnc:  'FullYear',
        navStep: 10
      }
    ],
    isLeapYear:       function (year) {
      return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
    },
    getDaysInMonth:   function (year, month) {
      return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
    },
    getDefaultFormat: function (type, field) {
      if (type === 'standard') {
        if (field === 'input')
          return 'yyyy-mm-dd hh:ii';
        else
          return 'yyyy-mm-dd hh:ii:ss';
      } else if (type === 'php') {
        if (field === 'input')
          return 'Y-m-d H:i';
        else
          return 'Y-m-d H:i:s';
      } else {
        throw new Error('Invalid format type.');
      }
    },
    validParts: function (type) {
      if (type === 'standard') {
        return /t|hh?|HH?|p|P|z|Z|ii?|ss?|dd?|DD?|mm?|MM?|yy(?:yy)?/g;
      } else if (type === 'php') {
        return /[dDjlNwzFmMnStyYaABgGhHis]/g;
      } else {
        throw new Error('Invalid format type.');
      }
    },
    nonpunctuation: /[^ -\/:-@\[-`{-~\t\n\rTZ]+/g,
    parseFormat: function (format, type) {
      // IE treats \0 as a string end in inputs (truncating the value),
      // so it's a bad format delimiter, anyway
      var separators = format.replace(this.validParts(type), '\0').split('\0'),
        parts = format.match(this.validParts(type));
      if (!separators || !separators.length || !parts || parts.length === 0) {
        throw new Error('Invalid date format.');
      }
      return {separators: separators, parts: parts};
    },
    parseDate: function (date, format, language, type, timezone) {
      if (date instanceof Date) {
        var dateUTC = new Date(date.valueOf() - date.getTimezoneOffset() * 60000);
        dateUTC.setMilliseconds(0);
        return dateUTC;
      }
      if (/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(date)) {
        format = this.parseFormat('yyyy-mm-dd', type);
      }
      if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}$/.test(date)) {
        format = this.parseFormat('yyyy-mm-dd hh:ii', type);
      }
      if (/^\d{4}\-\d{1,2}\-\d{1,2}[T ]\d{1,2}\:\d{1,2}\:\d{1,2}[Z]{0,1}$/.test(date)) {
        format = this.parseFormat('yyyy-mm-dd hh:ii:ss', type);
      }
      if (/^[-+]\d+[dmwy]([\s,]+[-+]\d+[dmwy])*$/.test(date)) {
        var part_re = /([-+]\d+)([dmwy])/,
          parts = date.match(/([-+]\d+)([dmwy])/g),
          part, dir;
        date = new Date();
        for (var i = 0; i < parts.length; i++) {
          part = part_re.exec(parts[i]);
          dir = parseInt(part[1]);
          switch (part[2]) {
            case 'd':
              date.setUTCDate(date.getUTCDate() + dir);
              break;
            case 'm':
              date = Datetimepicker.prototype.moveMonth.call(Datetimepicker.prototype, date, dir);
              break;
            case 'w':
              date.setUTCDate(date.getUTCDate() + dir * 7);
              break;
            case 'y':
              date = Datetimepicker.prototype.moveYear.call(Datetimepicker.prototype, date, dir);
              break;
          }
        }
        return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), 0);
      }
      var parts = date && date.toString().match(this.nonpunctuation) || [],
        date = new Date(0, 0, 0, 0, 0, 0, 0),
        parsed = {},
        setters_order = ['hh', 'h', 'ii', 'i', 'ss', 's', 'yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'D', 'DD', 'd', 'dd', 'H', 'HH', 'p', 'P', 'z', 'Z'],
        setters_map = {
          hh:   function (d, v) {
            return d.setUTCHours(v);
          },
          h:    function (d, v) {
            return d.setUTCHours(v);
          },
          HH:   function (d, v) {
            return d.setUTCHours(v === 12 ? 0 : v);
          },
          H:    function (d, v) {
            return d.setUTCHours(v === 12 ? 0 : v);
          },
          ii:   function (d, v) {
            return d.setUTCMinutes(v);
          },
          i:    function (d, v) {
            return d.setUTCMinutes(v);
          },
          ss:   function (d, v) {
            return d.setUTCSeconds(v);
          },
          s:    function (d, v) {
            return d.setUTCSeconds(v);
          },
          yyyy: function (d, v) {
            return d.setUTCFullYear(v);
          },
          yy:   function (d, v) {
            return d.setUTCFullYear(2000 + v);
          },
          m:    function (d, v) {
            v -= 1;
            while (v < 0) v += 12;
            v %= 12;
            d.setUTCMonth(v);
            while (d.getUTCMonth() !== v)
              if (isNaN(d.getUTCMonth()))
                return d;
              else
                d.setUTCDate(d.getUTCDate() - 1);
            return d;
          },
          d:    function (d, v) {
            return d.setUTCDate(v);
          },
          p:    function (d, v) {
            return d.setUTCHours(v === 1 ? d.getUTCHours() + 12 : d.getUTCHours());
          },
          z:    function () {
            return timezone
          }
        },
        val, filtered, part;
      setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
      setters_map['dd'] = setters_map['d'];
      setters_map['P'] = setters_map['p'];
      setters_map['Z'] = setters_map['z'];
      date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
      if (parts.length === format.parts.length) {
        for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
          val = parseInt(parts[i], 10);
          part = format.parts[i];
          if (isNaN(val)) {
            switch (part) {
              case 'MM':
                filtered = $(dates[language].months).filter(function () {
                  var m = this.slice(0, parts[i].length),
                    p = parts[i].slice(0, m.length);
                  return m === p;
                });
                val = $.inArray(filtered[0], dates[language].months) + 1;
                break;
              case 'M':
                filtered = $(dates[language].monthsShort).filter(function () {
                  var m = this.slice(0, parts[i].length),
                    p = parts[i].slice(0, m.length);
                  return m.toLowerCase() === p.toLowerCase();
                });
                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                break;
              case 'p':
              case 'P':
                val = $.inArray(parts[i].toLowerCase(), dates[language].meridiem);
                break;
              case 'z':
              case 'Z':
                timezone;
                break;

            }
          }
          parsed[part] = val;
        }
        for (var i = 0, s; i < setters_order.length; i++) {
          s = setters_order[i];
          if (s in parsed && !isNaN(parsed[s]))
            setters_map[s](date, parsed[s])
        }
      }
      return date;
    },
    formatDate:       function (date, format, language, type, timezone) {
      if (date === null) {
        return '';
      }
      var val;
      if (type === 'standard') {
        val = {
          t:    date.getTime(),
          // year
          yy:   date.getUTCFullYear().toString().substring(2),
          yyyy: date.getUTCFullYear(),
          // month
          m:    date.getUTCMonth() + 1,
          M:    dates[language].monthsShort[date.getUTCMonth()],
          MM:   dates[language].months[date.getUTCMonth()],
          // day
          d:    date.getUTCDate(),
          D:    dates[language].daysShort[date.getUTCDay()],
          DD:   dates[language].days[date.getUTCDay()],
          p:    (dates[language].meridiem.length === 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
          // hour
          h:    date.getUTCHours(),
          // minute
          i:    date.getUTCMinutes(),
          // second
          s:    date.getUTCSeconds(),
          // timezone
          z:    timezone
        };

        if (dates[language].meridiem.length === 2) {
          val.H = (val.h % 12 === 0 ? 12 : val.h % 12);
        }
        else {
          val.H = val.h;
        }
        val.HH = (val.H < 10 ? '0' : '') + val.H;
        val.P = val.p.toUpperCase();
        val.Z = val.z;
        val.hh = (val.h < 10 ? '0' : '') + val.h;
        val.ii = (val.i < 10 ? '0' : '') + val.i;
        val.ss = (val.s < 10 ? '0' : '') + val.s;
        val.dd = (val.d < 10 ? '0' : '') + val.d;
        val.mm = (val.m < 10 ? '0' : '') + val.m;
      } else if (type === 'php') {
        // php format
        val = {
          // year
          y: date.getUTCFullYear().toString().substring(2),
          Y: date.getUTCFullYear(),
          // month
          F: dates[language].months[date.getUTCMonth()],
          M: dates[language].monthsShort[date.getUTCMonth()],
          n: date.getUTCMonth() + 1,
          t: DPGlobal.getDaysInMonth(date.getUTCFullYear(), date.getUTCMonth()),
          // day
          j: date.getUTCDate(),
          l: dates[language].days[date.getUTCDay()],
          D: dates[language].daysShort[date.getUTCDay()],
          w: date.getUTCDay(), // 0 -> 6
          N: (date.getUTCDay() === 0 ? 7 : date.getUTCDay()),       // 1 -> 7
          S: (date.getUTCDate() % 10 <= dates[language].suffix.length ? dates[language].suffix[date.getUTCDate() % 10 - 1] : ''),
          // hour
          a: (dates[language].meridiem.length === 2 ? dates[language].meridiem[date.getUTCHours() < 12 ? 0 : 1] : ''),
          g: (date.getUTCHours() % 12 === 0 ? 12 : date.getUTCHours() % 12),
          G: date.getUTCHours(),
          // minute
          i: date.getUTCMinutes(),
          // second
          s: date.getUTCSeconds()
        };
        val.m = (val.n < 10 ? '0' : '') + val.n;
        val.d = (val.j < 10 ? '0' : '') + val.j;
        val.A = val.a.toString().toUpperCase();
        val.h = (val.g < 10 ? '0' : '') + val.g;
        val.H = (val.G < 10 ? '0' : '') + val.G;
        val.i = (val.i < 10 ? '0' : '') + val.i;
        val.s = (val.s < 10 ? '0' : '') + val.s;
      } else {
        throw new Error('Invalid format type.');
      }
      var date = [],
        seps = $.extend([], format.separators);
      for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
        if (seps.length) {
          date.push(seps.shift());
        }
        date.push(val[format.parts[i]]);
      }
      if (seps.length) {
        date.push(seps.shift());
      }
      return date.join('');
    },
    convertViewMode:  function (viewMode) {
      switch (viewMode) {
        case 4:
        case 'decade':
          viewMode = 4;
          break;
        case 3:
        case 'year':
          viewMode = 3;
          break;
        case 2:
        case 'month':
          viewMode = 2;
          break;
        case 1:
        case 'day':
          viewMode = 1;
          break;
        case 0:
        case 'hour':
          viewMode = 0;
          break;
      }

      return viewMode;
    },
    headTemplate: '<thead>' +
                '<tr>' +
                '<th class="prev"><i class="{iconType} {leftArrow}"/></th>' +
                '<th colspan="5" class="switch"></th>' +
                '<th class="next"><i class="{iconType} {rightArrow}"/></th>' +
                '</tr>' +
      '</thead>',
    headTemplateV3: '<thead>' +
                '<tr>' +
                '<th class="prev"><span class="{iconType} {leftArrow}"></span> </th>' +
                '<th colspan="5" class="switch"></th>' +
                '<th class="next"><span class="{iconType} {rightArrow}"></span> </th>' +
                '</tr>' +
      '</thead>',
    contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
    footTemplate: '<tfoot>' +
                    '<tr><th colspan="7" class="today"></th></tr>' +
                    '<tr><th colspan="7" class="clear"></th></tr>' +
                  '</tfoot>'
  };
  DPGlobal.template = '<div class="datetimepicker">' +
    '<div class="datetimepicker-minutes">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-hours">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-days">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplate +
    '<tbody></tbody>' +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-months">' +
    '<table class="table-condensed">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-years">' +
    '<table class="table-condensed">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '</div>';
  DPGlobal.templateV3 = '<div class="datetimepicker">' +
    '<div class="datetimepicker-minutes">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplateV3 +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-hours">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplateV3 +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-days">' +
    '<table class=" table-condensed">' +
    DPGlobal.headTemplateV3 +
    '<tbody></tbody>' +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-months">' +
    '<table class="table-condensed">' +
    DPGlobal.headTemplateV3 +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '<div class="datetimepicker-years">' +
    '<table class="table-condensed">' +
    DPGlobal.headTemplateV3 +
    DPGlobal.contTemplate +
    DPGlobal.footTemplate +
    '</table>' +
    '</div>' +
    '</div>';
  $.fn.datetimepicker.DPGlobal = DPGlobal;

  /* DATETIMEPICKER NO CONFLICT
   * =================== */

  $.fn.datetimepicker.noConflict = function () {
    $.fn.datetimepicker = old;
    return this;
  };

  /* DATETIMEPICKER DATA-API
   * ================== */

  $(document).on(
    'focus.datetimepicker.data-api click.datetimepicker.data-api',
    '[data-provide="datetimepicker"]',
    function (e) {
      var $this = $(this);
      if ($this.data('datetimepicker')) return;
      e.preventDefault();
      // component click requires us to explicitly show it
      $this.datetimepicker('show');
    }
  );
  $(function () {
    $('[data-provide="datetimepicker-inline"]').datetimepicker();
  });

}));

(function(win,jQuery,undefined){

    // if no query selector or soon has already been loaded / when using a module loader the test is irrelevant
    if (!document.querySelectorAll || win.Soon) {return;}

    var exports = {};
    var utils = {};
    var view = {};
    var transform = {};

    // setup resizer
    var resizer = {
        timer:0,
        cbs:[],
        register:function(cb) {
            resizer.cbs.push(cb);
        },
        deregister:function(cb){
            var i=resizer.cbs.length-1;
            for(;i>=0;i--) {
                if (resizer.cbs[i]===cb) {
                    resizer.cbs.splice(i,1);
                }
            }
        },
        onresize:function(){
            clearTimeout(resizer.timer);
            resizer.timer = setTimeout(function(){
                resizer.resize();
            },100);
        },
        resize:function(){
            var i= 0,l=resizer.cbs.length;
            for(;i<l;i++) {
                resizer.cbs[i]();
            }
        },
        init:function(){
            if (!win.addEventListener){return;}
            win.addEventListener('resize',resizer.onresize,false);
        }
    };


// bind polyfill
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs   = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function() {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}


// indexof polyfill
// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {

        var k;

        // 1. Let O be the result of calling ToObject passing
        //    the this value as the argument.
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get
        //    internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If len is 0, return -1.
        if (len === 0) {
            return -1;
        }

        // 5. If argument fromIndex was passed let n be
        //    ToInteger(fromIndex); else let n be 0.
        var n = +fromIndex || 0;

        if (Math.abs(n) === Infinity) {
            n = 0;
        }

        // 6. If n >= len, return -1.
        if (n >= len) {
            return -1;
        }

        // 7. If n >= 0, then Let k be n.
        // 8. Else, n<0, Let k be len - abs(n).
        //    If k is less than 0, then let k be 0.
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        // 9. Repeat, while k < len
        while (k < len) {
            var kValue;
            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the
            //    HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            //    i.  Let elementK be the result of calling the Get
            //        internal method of O with the argument ToString(k).
            //   ii.  Let same be the result of applying the
            //        Strict Equality Comparison Algorithm to
            //        searchElement and elementK.
            //  iii.  If same is true, return k.
            if (k in O && O[k] === searchElement) {
                return k;
            }
            k++;
        }
        return -1;
    };
}

// classlist polyfill
(function () {

    if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;

    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

    function DOMTokenList(el) {
        this.el = el;
        // The className needs to be trimmed and split on whitespace
        // to retrieve a list of classes.
        var classes = el.className.replace(/^\s+|\s+$/g,'').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            push.call(this, classes[i]);
        }
    }

    DOMTokenList.prototype = {
        add: function(token) {
            if(this.contains(token)) return;
            push.call(this, token);
            this.el.className = this.toString();
        },
        contains: function(token) {
            return this.el.className.indexOf(token) != -1;
        },
        item: function(index) {
            return this[index] || null;
        },
        remove: function(token) {
            if (!this.contains(token)) return;
            for (var i = 0; i < this.length; i++) {
                if (this[i] == token) break;
            }
            splice.call(this, i, 1);
            this.el.className = this.toString();
        },
        toString: function() {
            return join.call(this, ' ');
        },
        toggle: function(token) {
            if (!this.contains(token)) {
                this.add(token);
            } else {
                this.remove(token);
            }

            return this.contains(token);
        }
    };

    window.DOMTokenList = DOMTokenList;

    function defineElementGetter (obj, prop, getter) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop,{
                get : getter
            });
        } else {
            obj.__defineGetter__(prop, getter);
        }
    }

    defineElementGetter(Element.prototype, 'classList', function () {
        return new DOMTokenList(this);
    });

})();

// request animation frame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
utils = (function(){

    // iso to date
    // http://stackoverflow.com/questions/11020658/javascript-json-date-parse-in-ie7-ie8-returns-nan
    var dateFromISO = function(s){
        var day, tz,
            rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
            p= rx.exec(s) || [];
        if(p[1]){
            day= p[1].split(/\D/);
            for(var i= 0, L= day.length; i<L; i++){
                day[i]= parseInt(day[i], 10) || 0;
            }
            day[1]-= 1;
            day= new Date(Date.UTC.apply(Date, day));
            if(!day.getDate()) return Number.NaN;
            if(p[5]){
                tz= (parseInt(p[5], 10)*60);
                if(p[6]) tz+= parseInt(p[6], 10);
                if(p[4]== '+') tz*= -1;
                if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
            }
            return day;
        }
        return Number.NaN;
    };

    var _dt = new Date('2015-01-01T12:00:00.123+01:00');
    var getDate = isNaN(_dt) ? function(iso) {return dateFromISO(iso);} : function(iso){return new Date(iso);};

    // test if this browser supports 3d transforms
    function hasTransformSupport() {
        if (!window.getComputedStyle) {
            return false;
        }

        var el = document.createElement('div'),
            has3d,
            transforms = {
                'webkitTransform':'-webkit-transform',
                'OTransform':'-o-transform',
                'msTransform':'-ms-transform',
                'MozTransform':'-moz-transform',
                'transform':'transform'
            };

        // Add it to the body to get the computed style.
        document.body.insertBefore(el, null);

        for (var t in transforms) {
            if (el.style[t] !== undefined) {
                el.style[t] = 'translate3d(1px,1px,1px)';
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);

        return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
    }

    // test for animation support
    function hasAnimationSupport(){

        var animation = false,
            animationString = 'animation',
            keyframePrefix = '',
            domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
            pfx  = '',
            i= 0,
            elm = document.body,
            l=domPrefixes.length;

        if (elm.style.animationName !== undefined ) { animation = true; }

        if (animation === false) {
            for(; i < l; i++ ) {
                if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                    pfx = domPrefixes[ i ];
                    animationString = pfx + 'Animation';
                    keyframePrefix = '-' + pfx.toLowerCase() + '-';
                    animation = true;
                    break;
                }
            }
        }
        return animation;

    }

    var documentVisibilityEvent;
    var documentHiddenAttribute;
    if (typeof document.hidden !== 'undefined') {
        documentHiddenAttribute = 'hidden';
        documentVisibilityEvent = 'visibilitychange';
    } else if (typeof document.mozHidden !== 'undefined') {
        documentHiddenAttribute = 'mozHidden';
        documentVisibilityEvent = 'mozvisibilitychange';
    } else if (typeof document.msHidden !== 'undefined') {
        documentHiddenAttribute = 'msHidden';
        documentVisibilityEvent = 'msvisibilitychange';
    } else if (typeof document.webkitHidden !== 'undefined') {
        documentHiddenAttribute = 'webkitHidden';
        documentVisibilityEvent = 'webkitvisibilitychange';
    }


    var animationsSupported = false;
    var textContentSupported = false;

    var millisecond = 1,
        second = 1000 * millisecond,
        minute = 60 * second,
        hour = 60 * minute,
        day = 24 * hour,
        week = (365 / 52) * day,
        month = (365 / 12) * day,
        year = 365 * day;

    var exports = {

        MAX:{
            y:100,
            M:12,
            w:52,
            d:365,
            h:24,
            m:60,
            s:60,
            ms:1000
        },

        AMOUNT:{
            y:year,
            M:month,
            w:week,
            d:day,
            h:hour,
            m:minute,
            s:second,
            ms:millisecond
        },

        CIRC:Math.PI * 2,
        QUART:Math.PI * .5,

        DAYS:['su','mo','tu','we','th','fr','sa'],

        setText:null,

        documentVisibilityEvent:documentVisibilityEvent,

        pad:function(value){return ('00' + value).slice(-2)},

        getDayIndex:function(day) {
            return this.DAYS.indexOf(day.substr(0,2));
        },

        isSlow:function() {
            return !('textContent' in document.body);
        },

        supportsAnimation:function() {

            // for animations we need both the animation and the transform API
            animationsSupported = hasAnimationSupport() && hasTransformSupport();

            exports.supportsAnimation = function(){return animationsSupported;};

            return animationsSupported;

        },

        toArray:function(args) {
            return Array.prototype.slice.call(args);
        },

        toBoolean:function(value) {
            if (typeof value === 'string') {
                return value === 'true';
            }
            return value;
        },

        isoToDate:function(iso) {

            // contains timezone?
            if (iso.match(/(Z)|([+\-][0-9]{2}:?[0-9]*$)/g)) {
                return getDate(iso);
            }

            // no timezone and contains time, make local
            iso += iso.indexOf('T') !==-1 ? 'Z' : '';
            var date = getDate(iso);
            return this.dateToLocal(date);
        },

        dateToLocal:function(date) {
            return new Date(
                date.getTime() + (date.getTimezoneOffset() * 60000)
            );
        },

        prefix:(function(){
            var vendors = ['webkit', 'Moz', 'ms', 'O'],i = 0,l = vendors.length,transform,elementStyle = document.createElement('div').style;
            for (;i<l;i++) {
                transform = vendors[i] + 'Transform';
                if (transform in elementStyle ) { return vendors[i]; }
            }
            return null;
        })(),

        setTransform:function(element,value) {
            element.style[this.prefix + 'Transform'] = value;
            element.style['transform'] = value;
        },

        setTransitionDelay:function(element,value) {
            element.style[this.prefix + 'TransitionDelay'] = value + ',' + value + ',' + value;
            element.style['TransitionDelay'] = value + ',' + value + ',' + value;
        },

        getShadowProperties:function(value) {
            value = value ? value.match(/(-?\d+px)|(rgba\(.+\))|(rgb\(.+\))|(#[abcdef\d]+)/g) : null;
            if (!value) {return null;}
            var i=0,l=value.length,c,r=[];
            for(;i<l;i++) {
                if(value[i].indexOf('px')!==-1) {
                    r.push(parseInt(value[i],10));
                }
                else {
                    c = value[i];
                }
            }
            r.push(c);

            if (r.length === 5) {
                r.splice(3,1);
            }

            return r;
        },

        getDevicePixelRatio:function() {
            return window.devicePixelRatio || 1;
        },

        isDocumentHidden:function() {
            return documentHiddenAttribute ? document[documentHiddenAttribute] : false;
        },

        triggerAnimation:function(element,animationClass) {

            element.classList.remove(animationClass);

            window.requestAnimationFrame(function(){

                element.offsetLeft;
                element.classList.add(animationClass);

            });

        },

        getBackingStoreRatio:function(ctx) {
            return ctx.webkitBackingStorePixelRatio ||
                   ctx.mozBackingStorePixelRatio ||
                   ctx.msBackingStorePixelRatio ||
                   ctx.oBackingStorePixelRatio ||
                   ctx.backingStorePixelRatio || 1;
        },

        setShadow:function(ctx,x,y,blur,color) {
            ctx.shadowOffsetX = x;
            ctx.shadowOffsetY = y;
            ctx.shadowBlur = blur;
            ctx.shadowColor = color;
        },

        getColorBetween:function(from,to,percent) {

            function makeChannel(a, b) {
                return(a + Math.round((b-a)*percent));
            }

            function makeColorPiece(num) {
                num = Math.min(num, 255);   // not more than 255
                num = Math.max(num, 0);     // not less than 0
                var str = num.toString(16);
                if (str.length < 2) {
                    str = '0' + str;
                }
                return(str);
            }

            return('#' +
                makeColorPiece(makeChannel(from.r, to.r)) +
                makeColorPiece(makeChannel(from.g, to.g)) +
                makeColorPiece(makeChannel(from.b, to.b))
            );

        },

        getGradientColors:function(from,to,detail) {

            // calculate in betweens
            var colors = [];
            var i=0,l=detail,s=1/(l-1),p=0;
            for(;i<l;i++) {
                colors[i] = this.getColorBetween(from,to,p);
                p += s;
            }

            return colors;
        },

        hexToRgb:function(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        drawGradientArc:function(ctx,x,y,radius,offset,length,from,to,width,colorFrom,colorTo,shadow,cap) {

            if (to < from) {return;}

            // add shadow
            if (shadow) {

                this.drawArc(
                    ctx,
                    x,
                    y,
                    radius,

                    offset,
                    length,
                    from,
                    to,

                    width,
                    'transparent',
                    shadow,

                    cap
                );

            }

            var fromRGB = this.hexToRgb(colorFrom);
            var toRGB = this.hexToRgb(colorTo);

            // get relative to and from color
            var fromRGBRelative = this.hexToRgb(this.getColorBetween(fromRGB,toRGB,(from - offset) / length));
            var toRGBRelative = this.hexToRgb(this.getColorBetween(fromRGB,toRGB,(to - offset) / length));

            // get all colors
            var range = to - from;
            var segmentCount = Math.ceil(range * 30);
            var colors = this.getGradientColors(fromRGBRelative,toRGBRelative,segmentCount);

            // let's do this
            var start = -this.QUART + (this.CIRC * from);
            var gradient;
            var startColor,endColor,xStart,yStart,xEnd,yEnd;
            var l = colors.length;
            var i = 0;
            var segment = (this.CIRC * range) / l;

            for (; i < l; i++) {

                startColor = colors[i];
                endColor = colors[i+1] || startColor;

                // x start / end of the next arc to draw
                xStart = x + Math.cos(start) * radius;
                xEnd = x + Math.cos(start + segment) * radius;

                // y start / end of the next arc to draw
                yStart = y + Math.sin(start) * radius;
                yEnd = y + Math.sin(start + segment) * radius;

                ctx.beginPath();

                gradient = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
                gradient.addColorStop(0, startColor);
                gradient.addColorStop(1.0, endColor);

                ctx.lineCap = cap;
                ctx.strokeStyle = gradient;
                ctx.arc(x, y, radius, start -.005, start + segment + 0.005);
                ctx.lineWidth = width;
                ctx.stroke();
                ctx.closePath();

                start += segment;
            }

        },

        drawArc:function(ctx,x,y,radius,offset,length,from,to,width,color,shadow,cap) {

            if (to < from) {return;}

            if (color.gradient.colors !== null && color.gradient.type === 'follow') {

                this.drawGradientArc(
                    ctx,
                    x,
                    y,
                    radius,

                    offset,
                    length,
                    from,
                    to,

                    width,
                    color.gradient.colors[0],
                    color.gradient.colors[1],
                    shadow,

                    cap
                );

                return;
            }

            if (shadow) {

                var translation = color.fill === 'transparent' ? 9999 : 0;

                ctx.save();

                ctx.translate(translation,0);

                this.setShadow(
                    ctx,
                    shadow[0] - translation,
                    shadow[1],
                    shadow[2],
                    shadow[3]
                );

            }

            ctx.beginPath();
            ctx.lineWidth = width;

            ctx.arc(
            x, y, radius,
            -this.QUART + (this.CIRC * from),
            -this.QUART + (this.CIRC * to)
            , false);


            if (color.gradient.colors) {
                var grad = color.gradient.type === 'horizontal' ?
                    ctx.createLinearGradient(0, radius, radius * 2, radius) :
                    ctx.createLinearGradient(radius, 0, radius, radius * 2);
                grad.addColorStop(0, color.gradient.colors[0]);
                grad.addColorStop(1, color.gradient.colors[1]);
                ctx.strokeStyle = grad;
            }
            else {
                ctx.strokeStyle = color.fill === 'transparent' ? '#000' : color.fill;
            }


            ctx.lineCap = cap;

            ctx.stroke();

            if (shadow) {
                ctx.restore();
            }

        },

        drawRing:function(ctx,

                          progress,

                          offset,
                          length,
                          gap,

                          size,

                          radiusRing,
                          widthRing,
                          colorRing,
                          shadowRing,

                          radiusProgress,
                          widthProgress,
                          colorProgress,
                          shadowProgress,

                          cap,

                          invert
            ) {

            if (length + gap > 1) {
                length = length - (-1 + length + gap);
                offset = offset + (gap * .5);
            }

            var aStart = offset;
            var bEnd = offset + length;
            var mid = progress * length;
            var scale = .5 - Math.abs(-.5 + progress);
            var aEnd = offset + (mid - (scale * gap));
            var bStart = offset + (mid + ((1-scale) * gap));

            // if no radius supplied, quit
            if (!radiusRing && !radiusProgress) {return;}

            // let's draw
            if (invert) {

                this.drawArc(
                    ctx,size,size,radiusRing,
                    offset,length,
                    bStart,bEnd,
                    widthRing,colorRing,shadowRing,
                    cap
                );

                this.drawArc(
                    ctx,size,size,radiusProgress,
                    offset,length,
                    aStart,aEnd,
                    widthProgress,colorProgress,shadowProgress,
                    cap
                );

            }
            else {

                this.drawArc(
                    ctx,size,size,radiusRing,
                    offset,length,
                    aStart,aEnd,
                    widthRing,colorRing,shadowRing,
                    cap
                );

                this.drawArc(
                    ctx,size,size,radiusProgress,
                    offset,length,
                    bStart,bEnd,
                    widthProgress,colorProgress,shadowProgress,
                    cap
                );

            }
        },

        setTextContent:function(node,text) {
            if ('textContent' in document.body) {
                node.textContent = text;
                exports.setTextContent = function(node,text) {
                    node.textContent = text;
                }
            }
            else {
                node.innerText = text;
                exports.setTextContent = function(node,text) {
                    node.innerText = text;
                }
            }
        }

    };

    return exports;

}());
transform.cap = function(min,max) {
    min = min || 0;
    max = max || 1;
    return function (value){
        return Math.min(Math.max(value,min),max);
    }
};
transform.chain = (function(Utils){

    return function() {

        var transforms = Utils.toArray(arguments);
        var i;
        var l=transforms.length;

        return function(value) {
            for (i=0;i<l;i++) {
                value = transforms[i](value);
            }
            return value;
        }
    };

}(utils));

transform.chars = function(){
    return function(value) {
        return (value + '').split('');
    }
};
transform.diff = function(diff){
    return function(value){
        return diff - value;
    }
};
transform.duplicate = function(count) {
    var arr = new Array(count);
    var i;
    return function (value){
        i = count;
        while (i--) {
            arr[i] = value;
        }
        return arr;
    }
};
transform.duration = (function(Utils){

    var formats = ['y','M','w','d','h','m','s','ms'];
    var l = formats.length;

    return function(format,cascade) {

        return function(value){

            var i=0;
            var result = [];
            var remaining = value;
            var used,key,required;

            for(;i<l;i++) {

                key = formats[i];
                required = Utils.AMOUNT[key];

                // how much is used by this format type
                used = Math.floor(remaining / required);

                // is this format type is used in a slot calculate what's left
                if (format.indexOf(key) !== -1) {

                    // subtract
                    remaining = remaining % required;

                    // and add results
                    result.push(Math.max(0,used));

                }
                else if (!cascade) {

                    // if we're not cascading act as if we used up the value
                    remaining = remaining % required;
                }

            }

            return result;

        }

    };

}(utils));

transform.event = function(test,callback) {
    return function(value) {
        if (test(value)) {
            callback();
        }
        return value;
    }
};
transform.modulate = function(char) {
    return function(value) {
        return parseInt(value,10) % 2 === 0 ? char : '';
    }
};
transform.now = function() {

    // fixed date

    return function() {
        return new Date().getTime();
    }
};
transform.offset = function(date){
    return function(value) {
        return date + value;
    }
};
transform.pad = function(padding){
    padding = padding || '';
    return function(value) {
        return (padding + value).slice(-padding.length);
    }
};
transform.plural = function(single,plural) {
    return function(value) {
        return parseInt(value,10) === 1 ? single : plural;
    }
};
transform.progress = function(offset,target){
    return function(value) {
        value = parseInt(value,10);
        if (target > offset) {
            return value / target;
        }
        return (offset - value) / offset;
    }
};
view.Console = (function(){

    var exports = function(options){

        this._transform = options.transform || function(value){return value;};

    };

    exports.prototype = {

        redraw:function(){},

        destroy:function(){
            return null;
        },

        getElement:function(){
            return null;
        },

        setValue:function(value) {
            console.log(this._transform(value));
        }

    };

    return exports;

}());
view.Fill = (function(Utils){

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-fill ' + (options.className || '');

        this._transform = options.transform || function(value){return value;};
        this._direction = 'to-top';

        var i=0,l=options.modifiers.length;
        for(;i<l;i++) {
            if (options.modifiers[i].indexOf('to-')===0) {
                this._direction = options.modifiers[i];
                break;
            }
        }

        this._fill = document.createElement('span');
        this._fill.className = 'soon-fill-inner';

        this._progress = document.createElement('span');
        this._progress.className = 'soon-fill-progress';
        this._fill.appendChild(this._progress);

        this._wrapper.appendChild(this._fill);

    };

    exports.prototype = {

        redraw:function(){},

        destroy:function() {

            // no need to clean up, just node removal

            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        setValue:function(value){

            var t = this._transform(value);
            var tr;

            switch(this._direction) {
                case 'to-top':
                    tr = 'translateY(' + (100 - (t * 100)) + '%)';
                    break;
                case 'to-top-right':
                    tr = 'scale(1.45) rotateZ(-45deg) translateX(' + (-100 + (t * 100)) + '%)';
                    break;
                case 'to-top-left':
                    tr = 'scale(1.45) rotateZ(45deg) translateX(' + (100 - (t * 100)) + '%)';
                    break;
                case 'to-left':
                    tr = 'translateX(' + (100 - (t * 100)) + '%)';
                    break;
                case 'to-right':
                    tr = 'translateX(' + (-100 + (t * 100)) + '%)';
                    break;
                case 'to-bottom-right':
                    tr = 'scale(1.45) rotateZ(45deg) translateX(' + (-100 + (t * 100)) + '%)';
                    break;
                case 'to-bottom-left':
                    tr = 'scale(1.45) rotateZ(-45deg) translateX(' + (100 - (t * 100)) + '%)';
                    break;
                case 'to-bottom':
                    tr = 'translateY(' + (-100 + (t * 100)) + '%)';
                    break;
                default:
                    break;
            }

            Utils.setTransform(this._progress,tr);

        }
    };

    return exports;

}(utils));
view.Flip = (function (Utils) {

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-flip ' + (options.className || '');

        this._transform = options.transform || function(value){return value;};

        this._inner = document.createElement('span');
        this._inner.className = 'soon-flip-inner';

        this._card = document.createElement('span');
        this._card.className = 'soon-flip-card';

        if (Utils.supportsAnimation()) {

            this._front = document.createElement('span');
            this._front.className = 'soon-flip-front soon-flip-face';
            this._back = document.createElement('span');
            this._back.className = 'soon-flip-back soon-flip-face';

            this._card.appendChild(this._front);
            this._card.appendChild(this._back);

            this._top = document.createElement('span');
            this._top.className = 'soon-flip-top soon-flip-face';
            this._card.appendChild(this._top);

            this._bottom = document.createElement('span');
            this._bottom.className = 'soon-flip-bottom soon-flip-face';
            this._card.appendChild(this._bottom);

        }
        else {
            this._fallback = document.createElement('span');
            this._fallback.className = 'soon-flip-fallback';
            this._card.appendChild(this._fallback);
        }

        this._bounding = document.createElement('span');
        this._bounding.className = 'soon-flip-bounding';
        this._card.appendChild(this._bounding);

        this._inner.appendChild(this._card);

        this._wrapper.appendChild(this._inner);

        this._frontValue = null;
        this._backValue = null;
        this._boundingLength = 0;

    };

    exports.prototype = {

        redraw:function(){},

        _setBoundingForValue:function(value) {

            // if value has a different length than before, change bounding box
            var l = (value + '').length;
            if (l === this._boundingLength) {
                return;
            }

            // set new bounding length
            this._boundingLength = l;

            // build character string
            var str = '',i=0;
            for (;i<l;i++) {
                str+='8';
            }

            // setup spacer
            this._bounding.textContent = str;

            // update flipper width, we do this to create a layout boundary so page reflows cost less cpu
            var size = parseInt(getComputedStyle(this._card).fontSize,10);
            var factor = this._bounding.offsetWidth / size;

            // per character we add .1 to fix any font problems, then we apply the width
            this._inner.style.width = (factor + ((l-1) * .1)) + 'em';


        },

        destroy:function() {

            // no need to clean up, just node removal

            return this._wrapper;
        },

        getElement:function() {
            return this._wrapper;
        },

        setValue:function(value) {

            value = this._transform(value);

            // if no animation support stop here
            if (!Utils.supportsAnimation()) {
                this._fallback.textContent = value;
                this._setBoundingForValue(value);
                return;
            }

            // check if is currently empty, if so, don't animate but only do setup
            if (!this._frontValue) {
                this._bottom.textContent = value;
                this._front.textContent = value;
                this._frontValue = value;
                this._setBoundingForValue(value);
                return;
            }

            // if is same value as previously stop here
            if (this._backValue && this._backValue === value || this._frontValue === value) {
                return;
            }

            // check if already has value, if so, move value to other panel
            if (this._backValue) {
                this._bottom.textContent = this._backValue;
                this._front.textContent = this._backValue;
                this._frontValue = this._backValue;
            }

            // set values
            this._setBoundingForValue(value);
            this._top.textContent = value;
            this._back.textContent = value;
            this._backValue = value;

            // trigger
            Utils.triggerAnimation(this._inner,'soon-flip-animate');

        }

    };

    return exports;

}(utils));
view.Group = (function(getPresenter){

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-group ' + (options.className || '');

        this._inner = document.createElement('span');
        this._inner.className = 'soon-group-inner';
        this._wrapper.appendChild(this._inner);

        this._transform = options.transform || function(value){return value;};

        this._presenters = options.presenters;

        this._presenterStorage = [];

    };

    exports.prototype = {

        redraw:function(){
            var i=this._presenterStorage.length-1;
            for(;i>=0;i--) {
                this._presenterStorage[i].redraw();
            }
        },

        destroy:function() {
            var i=this._presenterStorage.length-1;
            for(;i>=0;i--) {
                this._presenterStorage[i].destroy();
            }
            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        setValue:function(value) {

            // set value, if it's 0 we can hide a group if necessary
            this._wrapper.setAttribute('data-value',value);

            // present value
            value = this._transform(value);
            var i=0;
            var isArray = value instanceof Array;
            var l = isArray ? value.length : this._presenters.length;
            var presenter;

            for (;i<l;i++) {

                presenter = this._presenterStorage[i];

                if (!presenter) {
                    presenter = getPresenter(this._presenters[i]);
                    this._inner.appendChild(presenter.getElement());
                    this._presenterStorage[i] = presenter;
                }

                presenter.setValue(isArray ? value[i] : value);

            }

        }

    };

    return exports;

}(getPresenter));
view.Matrix = (function(){

    var digits = {
        ' ':[
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0]
        ],
        '0':[
            [0,1,1,1,0],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0]
        ],
        '1':[
            [0,0,1,1,0],
            [0,1,1,1,0],
            [0,0,1,1,0],
            [0,0,1,1,0],
            [0,0,1,1,0],
            [0,0,1,1,0],
            [0,1,1,1,1]
        ],
        '2':[
            [0,1,1,1,0],
            [1,1,0,1,1],
            [0,0,0,1,1],
            [0,0,1,1,0],
            [0,1,1,0,0],
            [1,1,0,0,0],
            [1,1,1,1,1]
        ],
        '3':[
            [0,1,1,1,0],
            [1,1,0,1,1],
            [0,0,0,1,1],
            [0,0,1,1,0],
            [0,0,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0]
        ],
        '4':[
            [0,0,1,1,1],
            [0,1,0,1,1],
            [1,1,0,1,1],
            [1,1,1,1,1],
            [0,0,0,1,1],
            [0,0,0,1,1],
            [0,0,0,1,1]
        ],
        '5':[
            [1,1,1,1,1],
            [1,1,0,0,0],
            [1,1,0,0,0],
            [1,1,1,1,0],
            [0,0,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0]
        ],
        '6':[
            [0,1,1,1,0],
            [1,1,0,0,0],
            [1,1,1,1,0],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0]
        ],
        '7':[
            [1,1,1,1,1],
            [0,0,0,1,1],
            [0,0,0,1,1],
            [0,0,1,1,0],
            [0,1,1,0,0],
            [1,1,0,0,0],
            [1,1,0,0,0]
        ],
        '8':[
            [0,1,1,1,0],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,0]
        ],
        '9':[
            [0,1,1,1,0],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [1,1,0,1,1],
            [0,1,1,1,1],
            [0,0,0,1,1],
            [0,1,1,1,0]
        ]
    };

    var rows = digits[0].length;
    var cols = digits[0][0].length;
    var i=0, j,html='';
    for(;i<rows;i++) {
        html+='<span class="soon-matrix-row">';
        j=0;
        for(;j<cols;j++) {
            html+='<span class="soon-matrix-dot"></span>';
        }
        html+='</span>';
    }

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-matrix ' + (options.className || '');

        this._inner = document.createElement('span');
        this._inner.className = 'soon-matrix-inner';
        this._wrapper.appendChild(this._inner);

        this._transform = options.transform || function(value) {return value;};
        this._value = [];

    };

    exports.prototype = {

        redraw:function(){},

        destroy:function() {

            // no need to clean up, just node removal

            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        _addChar:function() {

            var char = document.createElement('span');
            char.className = 'soon-matrix-char';
            char.innerHTML = html;
            return {
                node:char,
                ref:[]
            };

        },

        _updateChar:function(char,value) {

            // get dot layout
            var matrix = digits[value];

            // update character
            var j,i= 0,ref = char.ref;
            if(!ref.length) {
                var dots = char.node.getElementsByClassName('soon-matrix-dot');
                for(;i<rows;i++) {
                    ref[i] = [];
                    j=0;
                    for(;j<cols;j++) {
                        ref[i][j] = dots[(i * cols) + j];
                    }
                }
            }

            for(;i<rows;i++) {
                j=0;
                for(;j<cols;j++) {
                    ref[i][j].setAttribute('data-state',matrix[i][j]===1 ? '1' : '0');
                }
            }

        },


        setValue:function(value) {

            value = this._transform(value);
            value += '';
            value = value.split('');
            var i=0;
            var l=value.length;

            for(;i<l;i++) {
                var char = this._value[i];
                if(!char) {
                    char = this._addChar();
                    this._inner.appendChild(char.node);
                    this._value[i] = char;
                }
                this._updateChar(char,value[i]);
            }

        }
    };

    return exports;

}());
view.Repeater = (function(getPresenterByType){

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-repeater ' + (options.className || '');

        this._delay = options.delay || 0;
        this._transform = options.transform || function(value){return value;};
        this._destroyed = false;

        this._presenter = options.presenter;
        this._Presenter = getPresenterByType(this._presenter.type);

        this._prepend = typeof options.prepend === 'undefined' ? true : options.prepend;

        this._presenterStorage = [];

    };

    exports.prototype = {

        redraw:function(){
            var i=this._presenterStorage.length-1;
            for(;i>=0;i--) {
                this._presenterStorage[i].redraw();
            }
        },

        destroy:function() {

            this._destroyed = true;

            var i=this._presenterStorage.length-1;
            for(;i>=0;i--) {
                this._presenterStorage[i].destroy();
            }

            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        setValue:function(value) {

            value = this._transform(value);
            value = value instanceof Array ? value : [value];

            if (this._prepend) {
                value.reverse();
            }

            var i=0;
            var l = value.length;
            var presenter;
            var delay = 0;
            var element;
            var crop;
            var swap = value.length !== this._wrapper.children.length;

            for (;i<l;i++) {

                presenter = this._presenterStorage[i];

                if (!presenter) {

                    presenter = new this._Presenter(this._presenter.options || {});

                    if (this._wrapper.children.length === 0 || !this._prepend) {
                        this._wrapper.appendChild(presenter.getElement());
                    }
                    else {
                        this._wrapper.insertBefore(presenter.getElement(),this._wrapper.firstChild);
                    }

                    this._presenterStorage[i] = presenter;

                    if (this._delay) {
                        delay -= this._delay;
                    }

                }

                if (this._delay && !swap) {
                    this._setValueDelayed(presenter,value[i],delay);
                    delay += this._delay;
                }
                else {
                    this._setValue(presenter,value[i],swap);
                }
            }

            l=this._wrapper.children.length;
            crop = i;

            for (;i<l;i++) {

                presenter = this._presenterStorage[i];

                element = presenter.destroy();
                element.parentNode.removeChild(element);

                this._presenterStorage[i] = null;

            }

            this._presenterStorage.length = crop;

        },

        _setValueDelayed:function(presenter,value,delay,swap) {
            var self = this;
            setTimeout(function(){
                self._setValue(presenter,value,swap);
            },delay);
        },

        _setValue:function(presenter,value,swap) {
            if (swap) {
                presenter.setValue(' ');
            }
            presenter.setValue(value);
        }

    };

    return exports;

}(getPresenterByType));
view.Ring = (function(Utils,Resizer){

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-ring ' + (options.className || '');

        this._transform = options.transform || function(value){return value;};

        this._modifiers = options.modifiers;

        this._animate = options.animate;

        this._canvas = document.createElement('canvas');
        this._wrapper.appendChild(this._canvas);

        this._style = document.createElement('span');
        this._style.className = 'soon-ring-progress';
        this._style.style.visibility = 'hidden';
        this._style.style.position = 'absolute';
        this._wrapper.appendChild(this._style);

        this._current = 0;
        this._target = null;
        this._destroyed = false;

        this._lastTick = 0;
        this._styles = null;

        // start ticking
        var self = this;
        if (Utils.supportsAnimation()) {
            window.requestAnimationFrame(function(ts){
                self._tick(ts);
            });
        }
    };

    exports.prototype = {

        destroy:function() {
            this._destroyed = true;
            Resizer.deregister(this._resizeBind);
            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        _getModifier:function(type) {

            var i= 0,l=this._modifiers.length,hit=null;
            for (;i<l;i++){
                if (this._modifiers[i].indexOf(type)!==-1) {
                    hit = this._modifiers[i];
                    break;
                }
            }

            if (!hit) {
                return null;
            }

            if (hit.indexOf('-')===-1) {
                return true;
            }

            var parts = hit.split('-');
            if (parts[1].indexOf('_')!==-1) {
                // color
                var colors = parts[1].split('_');
                colors[0] = '#' + colors[0];
                colors[1] = '#' + colors[1];
                return colors;
            }

            var fl = parseFloat(parts[1]);
            if (isNaN(fl)) {
                return parts[1];
            }

            // percentage
            return fl / 100;

        },

        redraw:function(){

            var styles = window.getComputedStyle(this._style);

            this._styles = {
                offset:this._getModifier('offset') || 0,
                gap:this._getModifier('gap') || 0,
                length:this._getModifier('length') || 1,
                flip:this._getModifier('flip') || false,
                invert:this._getModifier('invert') || null,
                align:'center',
                size:0,
                radius:0,
                padding:parseInt(styles.getPropertyValue('padding-bottom'),10) || 0,
                cap:parseInt(styles.getPropertyValue('border-top-right-radius'),10) === 0 ? 'butt' : 'round',
                progressColor:{
                    fill:styles.getPropertyValue('color') || '#000',
                    gradient:{
                        colors:this._getModifier('progressgradient') || null,
                        type:this._getModifier('progressgradienttype') || 'follow'
                    }
                },
                progressWidth:parseInt(styles.getPropertyValue('border-top-width'),10) || 2,
                progressShadow:Utils.getShadowProperties(styles.getPropertyValue('text-shadow')),
                ringColor:{
                    fill:styles.getPropertyValue('background-color') || '#fff',
                    gradient:{
                        colors:this._getModifier('ringgradient') || null,
                        type:this._getModifier('ringgradienttype') || 'follow'
                    }
                },
                ringWidth:parseInt(styles.getPropertyValue('border-bottom-width'),10) || 2,
                ringShadow:Utils.getShadowProperties(styles.getPropertyValue('box-shadow'))
            };

            var ctx = this._canvas.getContext('2d'),
                size = this._canvas.parentNode.clientWidth,
                devicePixelRatio = Utils.getDevicePixelRatio(),
                backingStoreRatio = Utils.getBackingStoreRatio(ctx),
                ratio = devicePixelRatio / backingStoreRatio,
                maxWidthFactor = size < 125 ? Math.min(1,size * .005) : 1;

            // cap width depending on window size, will always result in a minimum width of 1
            this._styles.ringWidth = Math.ceil(this._styles.ringWidth * maxWidthFactor);
            this._styles.progressWidth = Math.ceil(this._styles.progressWidth * maxWidthFactor);

            // fix 'transparent' color values

            if (this._styles.ringColor.fill === 'transparent') {
                this._styles.ringColor.fill = 'rgba(0,0,0,0)';
            }

            if (this._styles.progressColor.fill === 'transparent') {
                this._styles.progressColor.fill = 'rgba(0,0,0,0)';
            }


            // set gap style
            if (this._styles.cap === 'round' && this._modifiers.join('').indexOf('gap-') === -1) {
                this._styles.gap = ((this._styles.ringWidth + this._styles.progressWidth) * .5) * .005;
            }

            if (!size) {
                return;
            }

            if (devicePixelRatio !== backingStoreRatio) {

                this._canvas.width = size * ratio;
                this._canvas.height = size * ratio;

                this._canvas.style.width = size + 'px';
                this._canvas.style.height = size + 'px';

                ctx.scale(ratio,ratio);

            }
            else {

                this._canvas.width = size;
                this._canvas.height = size;
            }

            this._styles.size = size * .5;

            // background
            var radius = (this._styles.size - this._styles.padding);
            this._styles.ringRadius = radius - (this._styles.ringWidth * .5);
            this._styles.progressRadius = radius - (this._styles.progressWidth * .5);

            if (this._styles.progressWidth === this._styles.ringWidth) {
                this._styles.progressRadius = this._styles.ringRadius;
            }
            else if (this._styles.progressWidth < this._styles.ringWidth) {
                // progress
                if (this._modifiers.indexOf('align-center')!==-1) {
                    this._styles.progressRadius = this._styles.ringRadius;
                }
                else if (this._modifiers.indexOf('align-bottom')!==-1) {
                    this._styles.progressRadius = radius - (this._styles.ringWidth - (this._styles.progressWidth *.5));
                }
                else if (this._modifiers.indexOf('align-inside')!==-1) {
                    this._styles.progressRadius = radius - (this._styles.ringWidth + (this._styles.progressWidth * .5));
                }
            }
            else {
                // ring
                if (this._modifiers.indexOf('align-center')!==-1) {
                    this._styles.ringRadius = this._styles.progressRadius;
                }
                else if (this._modifiers.indexOf('align-bottom')!==-1) {
                    this._styles.ringRadius = radius - (this._styles.progressWidth - (this._styles.ringWidth * .5));
                }
                else if (this._modifiers.indexOf('align-inside')!==-1) {
                    this._styles.ringRadius = radius - (this._styles.progressWidth + (this._styles.ringWidth * .5));
                }
            }

            if (this._modifiers.indexOf('glow-progress')!==-1 && this._styles.progressShadow) {
                this._styles.progressShadow[this._styles.progressShadow.length-1] =
                    this._styles.progressColor.gradient.colors !== null ? this._styles.progressColor.gradient.colors[0] : this._styles.progressColor.fill;
            }

            if (this._modifiers.indexOf('glow-background')!==-1 && this._styles.ringShadow) {
                this._styles.ringShadow[this._styles.ringShadow.length-1] =
                    this._styles.ringColor.gradient.colors !== null ? this._styles.ringColor.gradient.colors[0]:  this._styles.ringColor.fill;
            }

            // reset current
            this._current = null;
        },

        _tick:function(ts) {

            if (this._destroyed) {
                return;
            }

            // needs target to function
            if (this._target !== null) {
                this._draw(ts);
            }

            // to the next frame
            var self = this;
            window.requestAnimationFrame(function(ts){
                self._tick(ts);
            });

        },

        _draw:function(ts){

            if (this._animate) {

                // calculate step
                var diff = ts - this._lastTick;
                var fps = diff < 250 ? 1000/diff : 30;
                this._lastTick = ts;

                // if rendering same value, stop here
                if (this._current === this._target) {
                    return;
                }

                // get distance to animate
                this._current += (this._target - this._current) / (fps / 3);

                // if reached target, cap
                if (Math.abs(this._current - this._target) <= .001) {
                    this._current = this._target;
                }

            }
            else {
                this._current = this._target;
            }

            // clear the current context
            var ctx = this._canvas.getContext('2d');
            ctx.clearRect(0,0,this._canvas.width,this._canvas.height);

            // apply flip
            var p = this._styles.flip ? 1 - this._current : this._current;

            Utils.drawRing(
                ctx,

                p,

                this._styles.offset,
                this._styles.length,
                this._styles.gap,

                this._styles.size,

                this._styles.ringRadius,
                this._styles.ringWidth,
                this._styles.ringColor,
                this._styles.ringShadow,

                this._styles.progressRadius,
                this._styles.progressWidth,
                this._styles.progressColor,
                this._styles.progressShadow,

                this._styles.cap,

                this._styles.invert
            );

        },

        setValue:function(value){

            if (!this._styles) {
                this.redraw();
            }

            value = this._transform(value);
            if (this._target !== value) {
                this._target = value;
            }

            if(!Utils.supportsAnimation()) {
                this._current = this._target;
                this._draw();
            }
        }

    };

    return exports;

}(utils,resizer));
view.Slot = (function(Utils){

    var exports = function(options) {

        this._forceReplace = typeof options.forceReplace === 'undefined' ? false : options.forceReplace;

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-slot ' + (options.className || '');

        this._transform = options.transform || function(value){return value;};

        this._new = document.createElement('span');
        this._new.className = 'soon-slot-new';
        this._old = document.createElement('span');
        this._old.className = 'soon-slot-old';

        this._bounding = document.createElement('span');
        this._bounding.className = 'soon-slot-bounding';

        this._inner = document.createElement('span');
        this._inner.className = 'soon-slot-inner soon-slot-animate';

        this._inner.appendChild(this._old);
        this._inner.appendChild(this._new);
        this._inner.appendChild(this._bounding);

        this._wrapper.appendChild(this._inner);

        this._newValue = '';
        this._oldValue = '';
        this._boundingLength = 0;

    };

    exports.prototype = {

        redraw:function(){},

        destroy:function() {

            // no need to clean up, just node removal

            return this._wrapper;
        },

        getElement:function() {
            return this._wrapper;
        },

        _isEmpty:function() {
            return !this._newValue;
        },

        _isSame:function(value) {
            return this._newValue === value;
        },

        _setBoundingForValue:function(value){

            // if value has a different length than before, change bounding box
            var l = (value + '').length;
            if (l === this._boundingLength) {
                return;
            }

            // set new bounding length
            this._boundingLength = l;

            // build character string
            var str = '',i=0;
            for (;i<l;i++) {
                str+='8';
            }

            // setup spacer
            this._bounding.textContent = str;

            // update slot width, we do this to create a layout boundary so page reflows cost less cpu
            var size = parseInt(getComputedStyle(this._wrapper).fontSize,10);
            var factor = this._bounding.offsetWidth / size;

            // per character we add .1 to fix any font problems, then we apply the width
            this._inner.style.width = (factor + ((l-1) * .1)) + 'em';

        },

        _setNewValue:function(value) {
            this._newValue = value;
            this._new.textContent = value;
        },

        _setOldValue:function(value) {
            this._oldValue = value;
            this._old.textContent = value;
        },

        setValue:function(value) {

            // start with old value

            // new value animates in view

            // old value animates out of view

            // transform
            value = this._transform(value);

            // if is currently empty
            if (this._isEmpty()) {
                this._setNewValue(value);
                this._setBoundingForValue(value);

                // animate first character
                Utils.triggerAnimation(this._inner,'soon-slot-animate');
            }

            // if same value, don't do a thing, unless we're forced to replace
            else if (this._isSame(value) && !this._forceReplace) {
                 // do nothing, literally
            }

            // new value
            else {

                if (this._newValue.length) {
                    this._setOldValue(this._newValue);
                }

                this._setNewValue(value);

                this._setBoundingForValue(value);

                Utils.triggerAnimation(this._inner,'soon-slot-animate');

            }

        }

    };

    return exports;

}(utils));
view.Text = (function(Utils){

    var exports = function(options) {

        this._wrapper = document.createElement('span');
        this._wrapper.className = 'soon-text ' + (options.className || '');
        this._transform = options.transform || function(value) {return value;};

    };

    exports.prototype = {

        redraw:function(){},

        destroy:function() {

            // no need to clean up, just node removal

            return this._wrapper;
        },

        getElement:function(){
            return this._wrapper;
        },

        setValue:function(value) {
            Utils.setTextContent(this._wrapper,this._transform(value));
        }

    };

    return exports;

}(utils));
var Ticker = (function(win,Utils,undefined){

    var exports = function(cb,options){

        options = options || {};

        // tick rate
        this._rate = options.rate || 1000;

        // time countdown started
        this._offset = null;

        // time passed
        this._time = 0;

        // has the timer been paused
        this._paused = false;

        // reference to tick timeout
        this._nextTickReference = null;
        this._tickBind = this._tick.bind(this);

        // on tick callback
        this._onTick = cb || function(){};

        // listen to visibility changes
        document.addEventListener(Utils.documentVisibilityEvent,this);

    };

    exports.prototype = {

        handleEvent:function(){

            if (Utils.isDocumentHidden()) {
                this._lock();
            }
            else {
                this._unlock();
            }

        },

        isRunning:function() {
            return this._offset !== null;
        },

        isPaused:function() {
            return this.isRunning() && this._paused;
        },

        start:function(){

            // if already running stop here
            if (this.isRunning()) {return;}

            // start time
            this.reset();

        },

        getTime:function(){
            return this._time;
        },

        reset:function() {

            // pause
            this.pause();

            // set new offset and reset time passed
            this._offset = new Date().getTime();
            this._time = 0;

            // resume ticking
            this.resume();

        },

        stop:function(){

            var self = this;
            setTimeout(function(){
                self._clearTimer();
                self._offset = null;
            },0);

        },

        pause:function(){

            this._paused = true;

            this._clearTimer();

        },

        resume:function(){

            // if already ticking
            if (!this.isPaused()) {return;}

            // no longer paused
            this._paused = false;

            // calculate new offset
            var newOffset = new Date().getTime();
            this._time += newOffset - this._offset;
            this._offset = newOffset;

            // resume ticking
            this._tick();

        },

        _clearTimer:function() {

            clearTimeout(this._nextTickReference);
            this._nextTickReference = null;

        },

        _lock:function(){

            this._clearTimer();

        },

        _unlock:function() {

            // if timer was paused, don't start ticking
            if (this.isPaused()) {return;}

            // resume ticking
            this.pause();
            this.resume();

        },

        _tick:function(){

            // tick tack
            this._onTick(this._time);

            // add to offset
            this._offset += this._rate;

            // add to passed time
            this._time += this._rate;

            // remember timeout for later clearing
            //clearTimeout(this._nextTickReference);
            this._nextTickReference = win.setTimeout(
                this._tickBind,
                this._offset - new Date().getTime()
            );

        }

    };

    return exports;

}(this,utils));

// private API
var uid = 0;
var size = 0;
var respondTimer = null;
var scales = ['xxl','xl','l','m','s','xs','xxs'];
var scaleDefault = 3; // m
var scaleCount = scales.length;
var soons = [];
var tickerCallbacks = [];
var defaultKeys = {
    'y':{
        'labels':'Year,Years',
        'option':'Years',
        'padding':''
    },
    'M':{
        'labels':'Month,Months',
        'option':'Months',
        'padding':'00'
    },
    'w':{
        'labels':'Week,Weeks',
        'option':'Weeks',
        'padding':'00'
    },
    'd':{
        'labels':'Day,Days',
        'option':'Days',
        'padding':'000'
    },
    'h':{
        'labels':'Hour,Hours',
        'option':'Hours',
        'padding':'00'
    },
    'm':{
        'labels':'Minute,Minutes',
        'option':'Minutes',
        'padding':'00'
    },
    's':{
        'labels':'Second,Seconds',
        'option':'Seconds',
        'padding':'00'
    },
    'ms':{
        'labels':'Millisecond,Milliseconds',
        'option':'Milliseconds',
        'padding':'000'
    }
};

// register respond methods
resizer.register(respond);

// responsive behaviour
function respond() {

    // don't do anything if width has not changed
    if (size === window.innerWidth) {
        return;
    }

    // store new width
    size = window.innerWidth;

    // resize tickers now
    resizeTickers();

}

function fitTicker(node,inner,presenter,available) {

    var root = parseInt(getComputedStyle(document.documentElement).fontSize,10) / 16;
    var currentSize = parseInt(getComputedStyle(inner).fontSize,10) / 16 / root;
    var factor = available / inner.scrollWidth;
    var size = factor * currentSize;

    if (size < 4) {
        node.style.fontSize = '';
        presenter.redraw();
        return false;
    }

    node.style.fontSize = size + 'rem';
    node.setAttribute('data-scale-rounded',Math.round(size).toString());
    presenter.redraw();

    return true;

}

function resizeTicker(node,presenter) {

    // if is slow browser don't do anything
    if (utils.isSlow()){return;}

    // get available space
    var style = window.getComputedStyle(node.parentNode);
    var padLeft = parseInt(style.getPropertyValue('padding-left'),10);
    var padRight = parseInt(style.getPropertyValue('padding-right'),10);
    var available = node.parentNode.clientWidth - padLeft - padRight;

    // get scale settings for this counter
    var max = node.getAttribute('data-scale-max');
    var hide = node.getAttribute('data-scale-hide');
    var scale = max ? scales.indexOf(max) : scaleDefault;

    // setup parameters for scaling
    var groups = node.querySelectorAll('.soon-group-sub');
    var i=0;
    var l=groups.length;
    var inner = node.querySelector('.soon-group');
    var newScale;
    var didHide;

    // show all groups
    for(;i<l;i++) {
        groups[i].style.display = '';
    }

    // if should attempt to fit
    if (max === 'fit' || max === 'fill') {
        if (fitTicker(node,inner,presenter,available)) {
            return; // it fit's we're done
        }
        else {
            scale = 0; // it does not fit, let's scale down
        }
    }

    // while it does not fit pick a smaller scale
    newScale = scale;
    do {
        node.setAttribute('data-scale',scales[newScale]);
        newScale++;
    }
    while (inner.scrollWidth > available && scales[newScale]);
    if (newScale !== scale) {
        presenter.redraw();
    }

    // if fits or no hiding is allowed stop here, stop here
    if (inner.scrollWidth <= available || hide === 'none') {
        return;
    }

    // get groups containing zero values
    i=0;
    didHide=false;
    do {

        // if not empty, move to hiding groups from the right side
        if (groups[i].getAttribute('data-value') !== '0') {
            break;
        }

        // hide the group and recalculate space
        groups[i].style.display = 'none';
        didHide = true;
        i++

    }
    while(inner.scrollWidth > available && i<l);
    if (didHide) {
        presenter.redraw();
    }

    // if only hiding empty values is allowed, let's stop here
    if (hide === 'empty') {
        return;
    }

    // hide from right side
    i=l-1;
    didHide = false;
    do {

        // hide the group and recalculate space
        groups[i].style.display = 'none';
        didHide = true;
        i--;

    }
    while(inner.scrollWidth > available && i > 0);
    if (didHide) {
        presenter.redraw();
    }

}

function resizeTickers() {
    var i=soons.length- 1;
    for(;i>=0;i--) {
        resizeTicker(soons[i].node,soons[i].presenter);
    }
}

function getSoonIndexByElement(element) {
    var i=0;
    var l=soons.length;
    for(;i<l;i++) {
        if (soons[i].node === element) {
            return i;
        }
    }
    return null;
}

function getTickerCallbackIndexByElement(element){
    var i=0;
    var l=tickerCallbacks.length;
    for(;i<l;i++) {
        if (tickerCallbacks[i].node === element) {
            return i;
        }
    }
    return null;
}

function getSoon(element) {
    var index = getSoonIndexByElement(element);
    if (index===null) {
        return null;
    }
    return soons[index];
}

function setDefaultsForSoonElement(element) {

    // add soon class
    if (element.className.indexOf('soon') === -1) {
        element.className += ' soon';
    }

    // add no animation class
    if (!utils.supportsAnimation()) {
        element.className += ' soon-no-animation';
    }

    // set default attributes
    var attr = element.getAttribute('data-layout');
    if (!attr || attr.indexOf('group') === -1 && attr.indexOf('line') === -1) {
        if (!attr) {attr = '';}
        element.setAttribute('data-layout',attr + ' group');
    }

    // if is a slow browser, revert to text
    if (utils.isSlow()) {
        element.removeAttribute('data-visual');
        element.setAttribute('data-view','text');
        element.className += ' soon-slow-browser';
    }

}

function setDataAttribute(element,options,option) {
    if (options[option] && !element.getAttribute('data-' + option)) {
        element.setAttribute('data-' + option,options[option]);
    }
}

function getDataAttribute(element,option) {
    return element.getAttribute('data-' + option);
}

function createClockTransform(options,onComplete) {

    var isCountdown = options.due !== null || options.since !== null;
    var clockTransform = null;

    if (isCountdown) {

        if (options.since) {

            // when counting up
            clockTransform = transform.chain(

                function(value){return options.now ? -value : value;},

                transform.offset(options.now ? options.now.getTime() : new Date().getTime()),
                transform.diff(options.since.getTime()),

                function(value){return Math.abs(value);},
                function(value){return Math.max(0,value);},

                function(value){options.callback.onTick(value,options.since);return value;},

                transform.event(function(value){return value===0;},onComplete),

                transform.duration(options.format,options.cascade)

            );

        }
        else {

            // when counting down
            clockTransform = transform.chain(
                transform.offset(options.now.getTime()),
                transform.diff(options.due.getTime()),

                function(value){return Math.max(0,value);},

                function(value){options.callback.onTick(value,options.due);return value;},

                transform.event(function(value){return value<=0;},onComplete),

                transform.duration(options.format,options.cascade)
            );

        }

    }
    else {
        clockTransform = function(){
            var d = new Date();
            return [
                d.getHours(),
                d.getMinutes(),
                d.getSeconds()
            ]
        };
        options.format = ['h','m','s'];
        options.separator = ':';
    }

    return clockTransform;

}

function createClockOutline(options,onComplete) {

    var isCountdown = options.due !== null || options.since !== null;

    var clockTransform = createClockTransform(options,onComplete);
    var clock = {
        type:'group',
        options:{
            transform:clockTransform,
            presenters:[]
        }
    };

    var presenters = [];
    var l = options.format.length;
    var i= 0;
    var group;
    var text;
    var view;
    var reflectedView;
    var wrapper;
    var format;
    var index;

    for(;i<l;i++) {

        format = options.format[i];
        index = i;

        group = {
            type:'group',
            options:{
                className:'soon-group-sub',
                presenters:[]
            }
        };

        if (options.visual) {

            group.options.presenters.push(createVisualizer(options,format));

            if (options.reflect) {
                group.options.presenters.push(createVisualizer(options,format,'soon-reflection'));
            }

        }

        text = {
            type:'text',
            options:{
                className:'soon-label'
            }
        };

        if (options.singular) {
            text.options.transform = transform.plural(options.label[format],options.label[format + '_s']);
        }
        else {
            text.options.transform = (function(format){ return function(){return options.label[format + '_s'];}}(format));
        }

        // if format is ms
        view = createView(options,format);
        reflectedView = null;

        if (options.reflect && !options.visual) {
            reflectedView = createView(options,format,'soon-reflection');
        }

        // create view object
        group.options.presenters.push(view);

        // create reflected view
        if (reflectedView) {
            group.options.presenters.push(reflectedView);
        }

        // only set labels if this is a countdown
        if (isCountdown) {
            group.options.presenters.push(text);
        }


        // if separator set
        if (options.separator) {

            wrapper = {
                type:'group',
                options:{
                    className:'soon-group-separator',
                    presenters:[
                        group
                    ]
                }
            };

            if (index !== 0) {

                if (options.reflect) {
                    wrapper.options.presenters.unshift(
                        {
                            type: 'text',
                            options: {
                                className: 'soon-separator soon-reflection',
                                transform: function () {
                                    return options.separator;
                                }
                            }
                        }
                    );
                }

                wrapper.options.presenters.unshift(
                    {
                        type: 'text',
                        options: {
                            className: 'soon-separator',
                            transform: function () {
                                return options.separator;
                            }
                        }
                    }
                );


            }

            group = wrapper;
        }

        presenters.push(group);
    }

    clock.options.presenters = presenters;

    return clock;

}

function createVisualizer(options,format,className) {

    // handle which visual to show
    var config = options.visual.split(' ');
    var visual = config[0];
    config.shift();

    // setup
    return {
        type:visual,
        options:{
            className:'soon-visual ' + (className || ''),
            transform:transform.chain(
                transform.progress(utils.MAX[format]),
                transform.cap()
            ),
            modifiers:config,
            animate:format !== 'ms'
        }
    }
}

function createView(options,format,className) {

    if (options.chars) {
        return {
            type:'repeater',
            options:{
                delay:options.view === 'text' ? 0 : 50,
                className:'soon-value ' + (className || ''),
                transform:transform.chain(
                    transform.pad(options.padding[format]),
                    transform.chars()
                ),
                presenter: {
                    type:options.view
                }
            }
        };
    }

    return {
        type:'group',
        options:{
            className:'soon-group-sub-sub soon-value ' + (className || ''),
            transform:transform.pad(options.padding[format]),
            presenters:[
                {
                    type:options.view
                }
            ]
        }
    };

}

function register(element,ticker,presenter) {

    soons.push({
        node:element,
        ticker:ticker,
        presenter:presenter
    });

}

function getPresenter(options) {
    return new (getPresenterByType(options.type))(options.options || {});
}

function getPresenterByType(type) {
    return view[type.charAt(0).toUpperCase() + type.slice(1)];
}

function createPresenter(element,presenter) {

    // check if should create on inner element
    var ph = element.getElementsByClassName ? element.getElementsByClassName('soon-placeholder') : element.querySelectorAll('soon-placeholder');
    if (ph.length) {
        ph[0].innerHTML = '';
        element = ph[0];
    }

    // else turn the entire element into a presenter
    var presenterInstance = getPresenter(presenter);
    element.appendChild(presenterInstance.getElement());
    return presenterInstance;
}

function createTicker(element,presenter,rate) {

    // create ticker instance
    var ticker = new Ticker(
        function(runTime) {
            presenter.setValue(runTime);
        },
        {
            rate:rate
        }
    );

    // remember this ticker for reset, resize and destroy
    register(element,ticker,presenter);

    // start ticker
    ticker.start();

    // resize element after first tick
    resizeTicker(element,presenter);

    // return
    return ticker;

}

function createByElement(element) {

    // set single options
    var defaults;
    var types = ['labels','padding'];
    var i,l=2; // 2 == types length
    var options = {
        since:getDataAttribute(element,'since'),
        due:getDataAttribute(element,'due'),
        now:getDataAttribute(element,'now'),
        face:getDataAttribute(element,'face'),
        visual:getDataAttribute(element,'visual'),
        format:getDataAttribute(element,'format'),
        singular:getDataAttribute(element,'singular') === 'true',
        reflect:getDataAttribute(element,'reflect') === 'true',
        scaleMax:getDataAttribute(element,'scale-max'),
        scaleHide:getDataAttribute(element,'scale-hide'),
        separateChars:(!(getDataAttribute(element,'separate-chars') === 'false')),
        cascade:(!(getDataAttribute(element,'cascade') === 'false')),
        separator:getDataAttribute(element,'separator'),
        padding:(!(getDataAttribute(element,'padding') === 'false')),
        eventComplete:getDataAttribute(element,'event-complete'),
        eventTick:getDataAttribute(element,'event-tick')
    };

    // get group options for labels
    for (var key in defaultKeys) {
        if (!defaultKeys.hasOwnProperty(key)){continue;}
        defaults = defaultKeys[key];
        for(i=0;i<l;i++) {
            options[types[i] + defaults.option] = getDataAttribute(element,types[i] + '-' + defaults.option.toLowerCase());
        }
    }

    return exports.create(element,options);
}

var inRegExp = /([\d]+)[\s]+([a-z]+)/i;
var atRegExp = /([\d]+)[:]*([\d]{2})*[:]*([\d]{2})*/;

function getDueDate(due) {

    var date;

    if (due.indexOf('in ') === 0) {

        // in 1 hour
        // in 3 hours
        // in 1 minute
        // in 60 minutes
        // in 1 second
        // in 5 seconds

        var duration = due.match(inRegExp);
        var c = parseInt(duration[1],10);
        var q = duration[2];

        // set date
        date = new Date();
        if (q.indexOf('hour')!==-1) {
            date.setHours(date.getHours() + c);
        }
        else if (q.indexOf('minute')!==-1) {
            date.setMinutes(date.getMinutes() + c);
        }
        else if (q.indexOf('second') !== -1) {
            date.setSeconds(date.getSeconds() + c);
        }

        return date;

    }
    else if (due.indexOf('at ')!==-1) {

        // at 12
        // at 9
        // monday at 10:30
        // at 15:10:20
        // sunday at 10 zone +01:00
        // reset at 12:30

        date = new Date();
        var now = date.getTime();
        var reset = due.indexOf('reset')!==-1;
        due = due.replace('reset ','');
        var parts = due.split('at ');
        var dueTime = parts[1].match(atRegExp);
        var h = parseInt(dueTime[1],10);
        var m = dueTime[2] ? parseInt(dueTime[2],10) : 0;
        var s = dueTime[3] ? parseInt(dueTime[3],10) : 0;

        // get zone
        var zone = parts[1].split(' zone ');
        if (zone) {
            zone = zone[1];
        }

        // set day of week
        if (parts[0].length) {
            var dayIndex = utils.getDayIndex(parts[0]);
            var distance = (dayIndex + 7 - date.getDay()) % 7;
            date.setDate(date.getDate() + distance);
        }

        // set time
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(s);
        date.setMilliseconds(0);

        // test if date has just passed, if so, jump day or week depending on setting
        if (reset && now >= date.getTime()) {
            date.setHours(h + (parts[0].length ? 7*24 : 24));
        }

        // create iso
        var p = utils.pad;
        var isoDate = date.getFullYear() + '-' + p(date.getMonth()+1) + '-' + p(date.getDate());
        var isoTime = p(date.getHours()) + ':' + p(date.getMinutes()) + ':' + p(date.getSeconds());
        due = isoDate + 'T' + isoTime + (zone || '');
    }

    return utils.isoToDate(due);
}

function getPaddingForFormat(key,format) {

    // if is first, no padding
    if (format.indexOf(key) === 0) {
        return '';
    }

    // if weeks
    if (key === 'w') {

        // when months set, maximum value for weeks is 4
        if (format.indexOf('M')!==-1) {
            return '';
        }

    }

    // if days
    if (key === 'd') {

        // when weeks set, days have no padding
        if (format.indexOf('w')!==-1) {
            return '';
        }

        if (format.indexOf('M')!==-1) {
            return '00';
        }

    }

    return null;

}

/**
 * Public API
 */
exports.parse = function(element) {
    createByElement(element);
};

exports.redraw = function(element) {
    if (element) {
        resizeTicker(element);
    }
    else {
        resizeTickers();
    }
};

exports.reset = function(element) {
    var soon = getSoon(element);
    if (soon) {
        soon.ticker.reset();
    }
};

exports.freeze = function(element) {

    // hold current time
    var soon = getSoon(element);
    if (soon) {
        soon.ticker.pause();
    }

};

exports.unfreeze = function(element) {

    // continue counter, will make time jump
    var soon = getSoon(element);
    if (soon) {
        soon.ticker.resume();
    }

};

exports.destroy = function(element) {

    var index = getSoonIndexByElement(element);
    if (index === null) {return;}

    var tickerIndex = getTickerCallbackIndexByElement(element);
    if (tickerIndex !== null) {
        tickerCallbacks.splice(tickerIndex,1);
    }

    var soon = soons[index];

    // if a ticker is attached, stop it before killing the presenter
    if (soon.ticker) {
        soon.ticker.stop();
    }

    // remove presenter
    soon.presenter.destroy();

    // remove the node
    soon.node.removeChild(soon.node.querySelector('.soon-group'));

    // set initialized to false
    element.removeAttribute('data-initialized');

    // remove the soon object from the collection
    soons.splice(index,1);
};

exports.create = function(element,options) {

    // if no options call on element
    if (!options) {
        return createByElement(element);
    }

    // test if not already initialized
    if (element.getAttribute('data-initialized')==='true') {
        return null;
    }

    // now initialized
    element.setAttribute('data-initialized','true');

    // test if should loop / can be looped
    if (options.due && options.due.indexOf('reset')!==-1 &&
        (!options.eventComplete ||
         (options.eventComplete &&
          options.eventComplete.indexOf('__soon_automated_callback_')===-1))) {

        // generate unique complete callback id
        var cb = '__soon_automated_callback_' + (uid++);

        // create new complete callback method
        window[cb] = (function(complete){

            return function() {

                // call original onComplete
                if (complete){window[complete]();}

                // recreate counter
                exports.destroy(element);
                exports.create(element,options);

            };

        }(options.eventComplete));

        // set new callback
        options.eventComplete = cb;
    }

    // apply the layout options to the element
    setDataAttribute(element,options,'layout');
    setDataAttribute(element,options,'face');
    setDataAttribute(element,options,'visual');
    setDataAttribute(element,options,'format');

    // set scale
    if (options.scaleMax) {
        element.setAttribute('data-scale-max',options.scaleMax);
    }

    // set hide option
    if (options.scaleHide) {
        element.setAttribute('data-scale-hide',options.scaleHide);
    }

    // get format
    var format = (options.format || 'd,h,m,s').split(',');

    // define ticker rate
    var rate = format.indexOf('ms') === -1 ? 1000 : 24;

    // get labels
    var key;
    var labels = {};
    var defaults;
    var labelParts;
    for (key in defaultKeys) {
        if (!defaultKeys.hasOwnProperty(key)){continue;}
        defaults = defaultKeys[key];
        labelParts = (options['labels' + defaults.option] || defaults.labels).split(',');
        labels[key] = labelParts[0];
        labels[key + '_s'] = labelParts[1] || labelParts[0];
    }

    // get padding
    var hasPadding = typeof options.padding === 'undefined' ? true : options.padding;
    var padding = {};
    for (key in defaultKeys) {
        if (!defaultKeys.hasOwnProperty(key)){continue;}
        defaults = defaultKeys[key];

        // padding disabled
        if (!hasPadding) {
            padding[key] = '';
            continue;
        }

        // padding enabled, if left most value, remove padding, else, default padding
        padding[key] = getPaddingForFormat(key,format);
        if (padding[key]===null) {
            padding[key] = defaults.padding;
        }

        // override with padding options if set
        if (options['padding' + defaults.option]) {

            padding[key] = options['padding' + defaults.option]
        }

    }

    // get value
    var view = (options.face || 'text ').split(' ')[0];

    // set due date object
    var due = options.due ? getDueDate(options.due) : null;
    var since = options.since ? utils.isoToDate(options.since) : null;
    var now = options.now ? utils.isoToDate(options.now) : since ? null : new Date();

    // create the presenter
    var setup = {
        due:due,
        since:since,
        now:now,
        view:view,
        visual:options.visual || null,
        format:format,
        separator:options.separator || null,
        cascade:typeof options.cascade === 'undefined' ? true : utils.toBoolean(options.cascade),
        singular:options.singular,
        reflect:options.reflect || false,
        chars:typeof options.separateChars === 'undefined' ? true : utils.toBoolean(options.separateChars),
        label:labels,
        padding:padding,
        callback:{
            onComplete:typeof options.eventComplete === 'string' ? window[options.eventComplete] : function(){},
            onTick:typeof options.eventTick === 'string' ? window[options.eventTick] : function(){}
        }
    };

    // if is a slow browser, force text
    if (utils.isSlow()) {
        setup.view = 'text';
        setup.reflect = false;
        setup.visual = null;
    }

    // holds ticker later on
    var ticker = null;

    // create the clock outline
    var outline = createClockOutline(setup,function(){

        // is called when clock runs out
        if (ticker) {
            ticker.stop();
        }

        // call onComplete method
        setup.callback.onComplete();

    });

    // set default values if missing
    setDefaultsForSoonElement(element);

    // create presenter
    var presenter = createPresenter(element,outline);

    // create the ticker
    ticker = createTicker(element,presenter,rate);

    // return
    return ticker;
};

// domready (c) Dustin Diaz 2012 - License MIT
// altered to stay in Soon scope
var domready;
!function(t){domready=t()}(function(e){function p(e){h=1;while(e=t.shift())e()}var t=[],n,r=!1,i=document,s=i.documentElement,o=s.doScroll,u="DOMContentLoaded",a="addEventListener",f="onreadystatechange",l="readyState",c=o?/^loaded|^c/:/^loaded|c/,h=c.test(i[l]);return i[a]&&i[a](u,n=function(){i.removeEventListener(u,n,r),p()},r),o&&i.attachEvent(f,n=function(){/^c/.test(i[l])&&(i.detachEvent(f,n),p())}),e=o?function(n){self!=top?h?n():t.push(n):function(){try{s.doScroll("left")}catch(t){return setTimeout(function(){e(n)},50)}n()}()}:function(e){h?e():t.push(e)}});

// if doc already loaded/complete than setup immediately, else wait for DOMContentLoaded
domready(function(){

    // if can listen to events, start listening to window resize for handling responsive behaviour
    resizer.init();

    // test if should block kickstart
    var script = document.querySelector('script[src*=soon]');
    if (script && script.getAttribute('data-auto')==='false') {
        return;
    }

    // find all soon elements
    var elements = document.getElementsByClassName ? document.getElementsByClassName('soon') : document.querySelectorAll('.soon');
    var i=0;
    var l=elements.length;

    for(;i<l;i++) {
        createByElement(elements[i]);
    }

});
// expose as jQuery plugin
(function(factory,$){

    // if no jquery, stop here
    if (!$) {return;}

    // setup plugin
    $.fn.soon = function(options) {
        options = options || {};
        return this.each(function() {
            factory.create(this,options);
        });
    };

    $.fn.soon.destroy = function() {
        return this.each(function() {
            factory.destroy(this);
        });
    };

    $.fn.soon.reset = function() {
        return this.each(function() {
            factory.reset(this);
        });
    };

    $.fn.soon.resize = function() {
        return this.each(function() {
            factory.resize(this);
        });
    };

    $.fn.soon.freeze = function() {
        return this.each(function() {
            factory.freeze(this);
        });
    };

    $.fn.soon.unfreeze = function() {
        return this.each(function() {
            factory.unfreeze(this);
        });
    };


}(exports,jQuery));

    // CommonJS
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exports;
    }
    // AMD
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return exports;
        });
    }
    // Browser global
    else {
        win.Soon = exports;
    }

}(window,window['jQuery']));
