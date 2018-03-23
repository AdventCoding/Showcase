/*global jQuery*/
'use strict'; // ECMAScript 5 Strict Mode

/**
 * jQuery Showcase Plugin
 * Note: The Plugin is only ready after the DOM has been loaded.
 * @author Michael S. Howard
 * @requires jQuery 1.7+
 * @param $ The jQuery object
 * @param global The global Window object
 * @return {Object} The API methods object
 */
window.Showcase = (function ($, global) {
	
	/**
	* The Default Options
	* @type {Object}
	* @property {boolean} overlayClose If the Overlay click event should close the Showcase
	* @property {boolean} animate Allows Main Div to animate position and dimension
	* @property {number} width Sizes the Showcase to the specified width
	* @property {number} height Sizes the Showcase to the specified height
	* @property {string|Object} navigateElements The jQuery selector or collection to use if navigation is needed
	* @property {boolean} scaleContent Scales the Showcase content if dimensions exceed Window dimensions
	* @property {boolean} hoverControls Gives the Showcase Controls a hover effect
	* @property {boolean} cloneData If the data and events should be cloned for elements other than <a> and <img>
	* @property {string} infoContent The HTML content for the Info Bar
	* @property {RegExp} imageRegExp The image RegExp is used to check for image content
	*/
	const defaults = {
		overlayClose : true,
		animate : true,
		width : 400,
		height : 300,
		navigateElements : null,
		scaleContent : false,
		hoverControls : false,
		showLoader: true,
		cloneData: true,
		infoContent : null, // Can also use the jQuery .data({'showcaseInfo' : 'Place Info Here'}) on each element
		imageRegExp : /\.bmp|\.gif|\.jpe|\.jpeg|\.jpg|\.png|\.svg|\.tif|\.tiff|\.wbmp$/
	};
	
	/** The error constants for error handling */
	const errors = {
		NULL: { code: '', msg: '' },
		UNAVAIL : { code: 'JQS000', msg: 'The jQuery Showcase Plugin is unavailable.' },
		OPTS : { code: 'JQS001', msg: 'Invalid options argument for Showcase Plugin instance.' },
		INIT : { code: 'JQS002', msg: 'Unable to initiate plugin elements based on specified jQuery object.' },
		LOADCNT : { code: 'JQS010', msg: 'Invalid source argument for loadContent method.' },
		SETCNT : { code: 'JQS020', msg: 'Invalid element argument for setContent method.' },
		WINDIM : { code: 'JQS030', msg: 'Invalid dimension arguments for checkWinDim method.' }
	};
	
	/**
	 * The error handler for the jQuery Showcase Plugin
	 * @param {Error} err An Error object (used for line number where error occurred)
	 * @param {string} name The error name in the errors object
	 * @throws {Error} If in debug mode
	 * @return void
	 */
	const errHandler = function (err, name) {
		
		const e = (errors.hasOwnProperty(name)) ? errors[name] : errors.NULL,
			msg = 'An error has occurred.<br>' + e.code + ': ' + e.msg,
			errElem = $('<p class="ShowcaseError"></p>');
		
		if (utility.ready()) {
			
			utility.setShowcaseStandard();
			sc.enable(function () {
				
				errElem.html(msg);
				sc.content.html(errElem);
				sc.err = msg;
				sc.curContent = errElem;
				
			});
			
		} else {
			
			alert(msg);
			
		}
		
		if (debug) { throw err; }
		
	};
	
	let debug = true, // Throws an error if in debug mode
		sc = {}, // The private Showcase instance
		engine = {}, // The main Showcase Engine
		Showcase = {}, // The Showcase constructor function
		api = {}, // The Showcase API methods for window.Showcase
		utility = {}, // Various utility methods
		timer = null; // The main timer
		
	// Create the Showcase instance when the DOM is ready
	$(function () { sc = new Showcase(); });
	
	/**
	 * jQuery Showcase Plugin Method
	 * Note: Only the first element of a jQuery collection will be used.
	 * @param {Object} options Showcase plugin options
     * @param {Function} callback A callback function to execute
	 * @return {Object} The jQuery object used to call this method
	 */
	$.fn.showcase = function (options, callback) {
		
		if (!utility.ready()) {
			
			errHandler(new Error(errors.UNAVAIL.msg), 'UNAVAIL');
			
			return this;
			
		}
		
		if ($.isFunction(options)) {
			
			callback = options;
			options = {};
			
		} else if (!$.isFunction(callback)) {
			
			callback = $.noop;
			
		}
		
		if (options && !$.isPlainObject(options)) {
			
			errHandler(new Error(errors.OPTS.msg), 'OPTS');
			
			return this;
			
		}
		
		// Start the Showcase plugin
		sc.load(this.eq(0), options, callback);
		
		return this;
		
	};
	
	/** The Showcase Engine Prototype */
	engine = {
		
		// Current Error Message
		err : '',
		
		// Structural Elements/Properties
		overlay : null,
		main : null,
		content : null,
		loading : null,
		close : null,
		leftNav : null,
		rightNav : null,
		infoBar : null,
		infoBarCnt : null,
		hExtra : 0,
		vExtra : 0,
		
		// Instance Elements/Properties
		options : null,
		elem : null,
		collection : null,
		type : null,
		curContent : null,
		curNavIndex : 0,
		mainOriginWidth : 0,
		mainOriginHeight : 0,
		hBuffer : 0,
		vBuffer : 0,
		mainScale : false,
		enabled : false,
		navEnabled : false,
		infoEnabled : false,
		infoBarGlobal : false,
		infoBarHeight : 0,
		busy : false,
		
		// API Methods
		
		/**
		 * Displays the Showcase and enables the controls
		 * @param {Function} callback A function to execute when the Showcase is enabled
		 * @param {boolean} hideMain If the Main Div should not be displayed
		 * @return {boolean}
		 */
		enable : function (callback, hideMain) {
			
			if (this.busy) { return false; }
			if (!$.isFunction(callback)) { callback = $.noop; }
			
			const anim = (this.options.animate) ? 400 : 0,
				hide = function () {
					
					utility.clearTimer();
					this.close.hide();
					
					// Check Navigation
					if (this.navEnabled) {
						
						this.leftNav.hide();
						this.rightNav.hide();
						
					}
					
					// Check Info Bar
					if (this.infoEnabled) { this.infoBar.hide(); }
					
					return true;
					
				}.bind(this),
				finish = function () {
					
					this.busy = false;
					this.enabled = true;
					this.loading.hide();
					this.content.show();
					
					callback.call(this);
					
				}.bind(this);
			
			this.busy = true;
			this.overlay.off('click'); // Reset the overlayClose option
			
			if (this.options.overlayClose) {
				
				this.overlay.attr('title', 'Click to Close');
				this.overlay.on('click', function (e) {
					
					e.preventDefault();
					e.stopPropagation();
					
					this.disable();
					
				}.bind(this));
				
			} else {
				
				this.overlay.attr('title', '');
				
			}
			
			this.overlay.show();
			
			// Check the hoverControls option
			this.main.off('mouseenter');
			this.main.off('mouseleave');
			
			if (this.options.hoverControls) {
				
				this.main.on({
					mouseenter : function (e) {
						
						e.preventDefault();
						
						if (this.enabled) {
							
							utility.clearTimer();
							this.close.show();
							
							// Check Navigation
							if (this.navEnabled) {
								
								this.leftNav.show();
								this.rightNav.show();
								
							}
							
							// Check Info Bar
							if (this.infoEnabled) { this.infoBar.show(); }
							
						}
						
					}.bind(this),
					
					mouseleave : function (e) {
						
						e.preventDefault();
						
						if (this.enabled) {
							
							utility.clearTimer();
							timer = global.setTimeout(hide, 800);
							
						}
						
					}.bind(this)
					
				});
				
			} else {
				
				this.close.show();
				
				if (this.navEnabled) {
					
					this.leftNav.show();
					this.rightNav.show();
					
				}
				
				if (this.infoEnabled) { this.infoBar.show(); }
				
			}
			
			if (hideMain) {
				
				finish();
				
			} else if (anim) {
				
				this.main.show(anim, finish);
				
			} else {
				
				this.main.show();
				finish();
				
			}
			
			return true;
			
		},
		
		/**
		 * Hides the Showcase and disables the controls
		 * @param {Function} callback A function to execute when Showcase is disabled
		 * @return {boolean}
		 */
		disable : function (callback) {
			
			if (!this.enabled) { return false; }
			if (!$.isFunction(callback)) { callback = $.noop; }
			
			const anim = (this.options.animate) ? 400 : 0,
				finish = function () {
					
					this.enabled = false;
					this.busy = false;
					callback.call(this);
					
				}.bind(this);
			
			this.busy = true;
			this.loading.hide();
			this.overlay.hide();
			this.content.hide();
			this.close.hide();
			this.leftNav.hide();
			this.rightNav.hide();
			this.infoBar.hide();
			
			if (this.curContent && (this.curContent.is('video') || this.curContent.is('audio'))) {
				this.curContent[0].pause();
			}
			
			if (anim) {
				
				this.main.hide(anim, finish);
				
			} else {
				
				this.main.hide();
				finish();
				
			}
			
			return true;
			
		},
		
		/**
		 * Resizes the Showcase window
		 * @param {string} width The new width to set or animate to
		 * @param {string} height The new height to set or animate to
		 * @param {Function} callback A function to execute when resize is finished
		 * @param {boolean} animate If the Main Div should animate to the new dimensions
		 * @param {boolean} showMain If the Main Div needs to be displayed
		 * @return {boolean}
		 */
		resize : function (width, height, callback, animate, showMain) {
			
			width = (typeof width === 'number') ? width : global.parseInt(width, 10) || 0;
			height = (typeof height === 'number') ? height : global.parseInt(height, 10) || 0;
			
			if (!width || !height) { return false; }
			if (!$.isFunction(callback)) { callback = $.noop; }
			
			const cnt = this.content,
				verify = utility.checkWinDim(width, height),
				infoBarAdjust = (this.infoEnabled) ? this.infoBarHeight / 2 : 0,
				dim = {
					width : verify.width,
					height : verify.height,
					marginTop : '-' + (verify.height / 2 + infoBarAdjust) + 'px',
					marginLeft : '-' + (verify.width / 2) + 'px'
				},
				finish = function () {
					
					const originWidth = this.mainOriginWidth,
						originHeight = this.mainOriginHeight,
						alterWidth = function () {
							
							if (mainWidth < originWidth / 2) {
								
								// Content width is lower than 50% of its original size
								cnt.css({overflow : 'auto'});
								this.curContent.css({
									width : global.Math.floor(originWidth / 2),
									height : 'auto',
									top : '50%'
								});
								
								return true;
								
							}
							
							cnt.css({'overflow' : 'hidden'});
							this.curContent.css({
								width : mainWidth - 5,
								height : 'auto',
								top : '50%'
							});
							
							// Vertical centering requires manual adjustment
							this.curContent.css({
								marginTop : '-' + (this.curContent.height() / 2) + 'px'
							});
							
							return true;
							
						}.bind(this),
						alterHeight = function () {
							
							if (mainHeight < originHeight / 2) {
								
								// Content height is lower than 50% of its original size
								cnt.css({overflow : 'auto'});
								this.curContent.css({
									width : 'auto',
									height : global.Math.floor(originHeight / 2),
									top : 0,
									marginTop : 0
								});
								
								return true;
								
							}
							
							cnt.css({overflow : 'hidden'});
							this.curContent.css({
								width : 'auto',
								height : mainHeight - 5,
								top : 0,
								marginTop : 0
							});
							
							return true;
							
						}.bind(this);
					
					let mainWidth = 0,
						mainHeight = 0,
						curWidth = 0,
						curHeight = 0;
					
					cnt.css({visibility : 'visible'});
					this.loading.hide();
					
					// Cache main Showcase inner dimensions
					mainWidth = this.main.width();
					mainHeight = this.main.height();
					
					// Set Content dimensions if Showcase dimensions exceed Window dimensions
					if (verify.width !== width
						|| verify.height !== height) {
						
						this.mainScale = true;
						
						// Set Main Content Div to fit the Showcase dimensions
						cnt.width(mainWidth);
						cnt.height(mainHeight);
						
						if (this.options.scaleContent
							&& this.curContent) {
							
							// Resize current content to fit in Content Div
							if (this.type === 'data') {
								
								curWidth = this.curContent.width();
								curHeight = this.curContent.height();
								
								// Maintain scale ratio for images
								if (mainWidth < this.mainOriginWidth
									&& mainHeight < this.mainOriginHeight) {
									
									if (mainWidth - curWidth < mainHeight - curHeight) {
										
										alterWidth();
										
									} else {
										
										alterHeight();
										
									}
									
								} else if (mainWidth < this.mainOriginWidth) {
									
									alterWidth();
									
								} else {
									
									alterHeight();
									
								}
								
							} else if (this.type === 'element') {
								
								this.curContent.css({
									width : this.content.width(),
									height : this.content.height(),
									margin : 0,
									padding : 0
								});
								
							}
							
						} else {
							
							// Allow scroll bars for overflowing content
							cnt.css({overflow : 'auto'});
							
						}
						
					} else {
						
						// No scaling needed for content
						this.mainScale = false;
						cnt.css({
							width : 'auto',
							height : 'auto',
							overflow : 'hidden'
						});
						
						// Check if content needs an 'auto' overflow
						if (cnt.height() > mainHeight
							|| cnt.width() > mainWidth) {
							
							cnt.css({
								width : mainWidth,
								height : mainHeight,
								overflow : 'auto'
							});
							
						}
						
						if (this.curContent) {
							
							this.curContent.css({
								width : this.curContentOW,
								height : this.curContentOH,
								margin : this.curContentOM,
								padding : this.curContentOP
							});
							
						}
						
					}
					
					if (this.infoEnabled
						&& !this.options.hoverControls) {
						
						this.infoBar.show();
						
					}
					
					this.busy = false;
					this.loading.hide();
					callback.call(this);
					
					return true;
					
				}.bind(this);
			
			if (this.infoEnabled) { this.infoBar.hide(); }
			
			// Set dimensions and show plugin
			if (showMain === true
				&& this.main.css('visibility') !== 'visible') {
				
				this.main.css(dim);
				
				if (this.options.animate && animate) {
					
					this.main.css({
						display : 'none',
						visibility : 'visible'
					});
					this.main.show(400, finish);
					
				} else {
					
					this.main.css({
						display : 'block',
						visibility : 'visible'
					});
					finish();
					
				}
				
			} else if (this.options.animate && animate) {
				
				this.main.animate(dim, finish);
				
			} else {
				
				this.main.css(dim);
				finish();
				
			}
			
			return true;
			
		},
		
		/**
		 * Navigates between the Showcase elements
		 * @param {string} direction The reverse '<' or forward '>' direction
		 * @return {boolean}
		 */
		navigate : function (direction) {
			
			if (this.enabled === false
				|| this.navEnabled === false
				|| this.busy) {
				
				return false;
				
			}
			
			// Busy signal is set to false once execution reaches the resize method
			this.busy = true;
			
			let elem = null;
			
			if (direction === '<') {
				
				// Check if index is at the beginning
				if (this.curNavIndex === 0) {
					
					this.curNavIndex = this.collection.length - 1;
					
				} else {
					
					this.curNavIndex -= 1;
					
				}
				
			} else {
				
				// Check if index is at the end
				if (this.curNavIndex === this.collection.length - 1) {
					
					this.curNavIndex = 0;
					
				} else {
					
					this.curNavIndex += 1;
					
				}
				
			}
			
			elem = this.collection.eq(this.curNavIndex);
			
			// Set info if necessary
			if (this.infoEnabled) {
				
				if (this.infoBarGlobal) {
					
					this.infoBarCnt.html(this.options.infoContent);
					this.infoBar.show();
					
				} else if (elem.data('showcaseInfo')) {
					
					this.infoBarCnt.html(elem.data('showcaseInfo'));
					this.infoBar.show();
					
				} else {
					
					this.infoBarCnt.empty();
					this.infoBar.hide();
					
				}
				
			}
			
			this.infoBarHeight = this.infoBar.outerHeight(true);
			
			if (this.options.hoverControls) { this.infoBar.hide(); }
			
			this.loadByType(elem);
			
			return true;
			
		},
		
		// Instance Utilities
		
		/**
		 * Starts the Showcase for the current plugin call
		 * @param {Object} elem The jQuery element(s)
		 * @param {Object} options The plugin options
		 * @param {Function} callback The function to call after the Showcase is loaded
		 * @return void
		 */
		load: function (elem, options, callback) {
			
			let opts = {};
			
			if (!elem
				|| typeof elem !== 'object'
				|| elem.length < 1) {
				
				errHandler(new Error(errors.INIT.msg), 'INIT');
				
				return;
				
			}
			
			this.elem = elem;
			this.options = opts = $.extend({}, defaults, options);
			this.callback = callback.bind(global.Showcase);
			this.curContent = null;
			
			// Check if navigation is needed
			if (opts.navigateElements) {
				
				this.collection = $(opts.navigateElements);
				this.curNavIndex = this.collection.index(elem);
				
			} else {
				
				this.collection = null;
				this.curNavIndex = 0;
				
			}
			
			if (this.collection
				&& this.collection.length > 1) {
				
				this.navEnabled = true;
				
			} else {
				
				this.navEnabled = false;
				this.leftNav.hide();
				this.rightNav.hide();
				
			}
			
			// Check if the Info Bar is needed
			if (opts.infoContent) {
				
				// Use the infoContent option as global content
				this.infoEnabled = true;
				this.infoBarGlobal = true;
				this.infoBarCnt.html(opts.infoContent);
				
			} else if (elem.data('showcaseInfo')) {
				
				// Use jQuery element's 'showcaseInfo' data
				this.infoEnabled = true;
				this.infoBarGlobal = false;
				this.infoBarCnt.html(elem.data('showcaseInfo'));
				
			} else {
				
				// No info to set for the Info Bar
				this.infoEnabled = false;
				this.infoBarGlobal = false;
				this.infoBarCnt.empty();
				this.infoBarHeight = 0;
				this.infoBar.hide();
				
			}
			
			if (this.infoEnabled) {
				
				this.infoBarHeight = this.infoBar.outerHeight(true);
				
				if (!this.options.hoverControls) { this.infoBar.show(); }
				
			}
			
			// Initially empty, hide, and resize the content
			this.content.empty().css({
				display : 'block',
				visibility : 'hidden',
				width : 'auto',
				height : 'auto',
				overflow : 'hidden'
			});
			this.main.css({
				display : 'block',
				visibility : 'hidden',
				width : opts.width,
				height : opts.height,
				marginTop : '-' + (opts.height / 2) + 'px',
				marginLeft : '-' + (opts.width / 2) + 'px'
			});
			
			// Reset other instance properties
			this.mainOriginWidth = 0;
			this.mainOriginHeight = 0;
			this.hBuffer = 0;
			this.vBuffer = 0;
			this.mainScale = false;
			
			// Set current buffers
			this.setBuffers();
			
			// Display the Showcase and load the content
			this.enable(function () {
				
				this.loadByType(elem);
				
			}.bind(this), true);
			
		},
		
		/**
		 * Chooses a load method for loading new content
		 * @param {Object} elem The target element
		 * @return {boolean}
		 */
		loadByType : function (elem) {
			
			let src = null;
			
			// Check the type
			if (elem.is('a')
				|| elem.is('img')) {
				
				this.type = 'data';
				src = elem.attr('src') || elem.attr('href') || '';
				this.loadContent(src);
				
			} else {
				
				this.type = 'element';
				this.setContent(elem);
				
			}
			
			return true;
			
		},
		
		/**
		 * Loads a URL into the Showcase Content Div
		 * @param {string} src The URL string to load
		 * @return {boolean}
		 */
		loadContent : function (src) {
			
			if (typeof src !== 'string') {
				
				errHandler(new Error(errors.LOADCNT.msg), 'LOADCNT');
				
				return false;
				
			}
			
			const cnt = this.content,
				exp = this.options.imageRegExp,
				finish = function (callback) {
					
					let width = this.options.width || cnt.outerWidth(true),
						height = this.options.height || cnt.outerHeight(true);
					
					if (width === 'auto') {
						
						this.main.css({
							width : 'auto',
							visibility : 'hidden'
						});
						
						width = cnt.outerWidth(true);
						
					}
					
					if (height === 'auto') {
						
						this.main.css({
							height : 'auto',
							visibility : 'hidden'
						});
						
						height = cnt.outerHeight(true);
						
					}
					
					// Set origin info
					this.mainOriginWidth = width;
					this.mainOriginHeight = height;
					
					if (this.curContent) {
						
						this.curContentOW = this.curContent.width();
						this.curContentOH = this.curContent.height();
						this.curContentOM = this.curContent.css('margin');
						this.curContentOP = this.curContent.css('padding');
						
					}
					
					// Resize with width, height, callback, animate, showMain
					this.resize(width, height, callback, true, true);
					
					if ($.isFunction(this.callback)) { this.callback(); }
					
					return true;
					
				}.bind(this);
			
			let img = null,
				hash = null;
			
			cnt.empty();
			if (this.options.showLoader) { this.loading.show(); }
			
			// Load content and retrieve new dimensions
			if (exp.test(src)) {
				
				// Don't use width and height options for finish function
				this.options.width = null;
				this.options.height = null;
				
				// Load image into content area
				img = $('<img src="' + src + '" alt="" />')
					.hide()
					.appendTo(cnt)
					.load(function () {
						
						cnt.width(img.width());
						cnt.height(img.height());
						finish(function () { img.show(); });
						
					});
				
				this.curContent = img;
				
			} else {
				
				// Check if URL has a hash for query loading
				if (src.indexOf('#') >= 0) {
					
					// Recreate the URL, separating the query with a space for jQuery
					hash = src.split('#');
					src = hash[0] + ' #' + hash[1];
					
				}
				
				// Load URL into content area
				cnt.load(src, finish);
				
			}
			
			return true;
			
		},
		
		/**
		 * Appends content to the Showcase Content Div
		 * @param {Object} elem The element(s) to append to the Showcase
		 * @return {boolean}
		 */
		setContent : function (elem) {
			
			if (!elem
				|| typeof elem !== 'object'
				|| elem.length < 1) {
				
				errHandler(new Error(errors.SETCNT.msg), 'SETCNT');
				
				return false;
				
			}
			
			const cnt = this.content,
				clone = elem.clone(this.options.cloneData);
			
			let width = 0,
				height = 0;
			
			if (this.options.showLoader) { this.loading.show(); }
			
			// Change content and retrieve new dimensions
			clone.css({
				display : 'block',
				visibility : 'visible'
			});
			
			cnt.empty().append(clone);
			this.curContent = clone;
			this.curContentOW = clone.width();
			this.curContentOH = clone.height();
			this.curContentOM = clone.css('margin');
			this.curContentOP = clone.css('padding');
			width = this.options.width || cnt.outerWidth(true);
			height = this.options.height || cnt.outerHeight(true);
			
			if (width === 'auto') {
				
				this.main.css({
					width : 'auto',
					visibility : 'hidden'
				});
				
				width = cnt.outerWidth(true);
				
			}
			
			if (height === 'auto') {
				
				this.main.css({
					height : 'auto',
					visibility : 'hidden'
				});
				
				height = cnt.outerHeight(true);
				
			}
			
			// Set origin info
			this.mainOriginWidth = width;
			this.mainOriginHeight = height;
			
			// Resize with width, height, callback, animate, showMain
			this.resize(width, height, null, true, true);
			
			if ($.isFunction(this.callback)) { this.callback(); }
			
			return true;
			
		},
		
		/**
		 * Sets the vertical and horizontal buffer sizes around the Showcase window
		 * @return {boolean}
		 */
		setBuffers : function () {
			
			if (!this.leftNav
				|| !this.infoBar
				|| !this.hExtra
				|| !this.vExtra) {
				
				return false;
				
			}
			
			this.hBuffer = this.leftNav.outerWidth(true) * 2 + this.hExtra;
			this.vBuffer = this.infoBar.outerHeight(true) + this.vExtra;
			
			return true;
			
		},
		
		/**
		 * Used for the Window resize event to check the Showcase dimensions
		 * @return {boolean}
		 */
		onResize : function () {
			
			const dim = utility.getWinDim(),
				mainWidth = this.main.outerWidth() + this.hBuffer,
				mainHeight = this.main.outerHeight() + this.vBuffer;
			
			if (dim === null) { return false; }
			
			if (mainWidth > dim.width
				|| mainHeight > dim.height
				|| this.mainScale) {
				
				// Resize with width, height, callback, animate
				this.resize(this.mainOriginWidth, this.mainOriginHeight, null, false);
				
			}
			
			return true;
			
		}
		
	};
	
	/**
	 * The Constructor Function for the Showcase Plugin
	 * @return void
	 */
	Showcase = function () {
		
		const doc = global.document,
			body = $(doc.getElementsByTagName('body')[0]);
		
		// Create structural elements and append
		this.options = $.extend({}, defaults);
		this.loading = $('<span id="jqShowcaseLoading"></span>', doc);
		this.overlay = $('<div id="jqShowcaseOverlay" title="Click to Close"></div>', doc);
		this.main = $('<div id="jqShowcaseMain"></div>', doc);
		this.content = $('<div id="jqShowcaseContent"></div>', doc).appendTo(this.main);
		this.close = $('<span id="jqShowcaseClose" title="Close"></span>', doc).appendTo(this.main);
		this.leftNav = $('<span id="jqShowcaseLN" title="Navigate Left"></span>', doc).appendTo(this.main);
		this.rightNav = $('<span id="jqShowcaseRN" title="Navigate Right"></span>', doc).appendTo(this.main);
		this.infoBar = $('<div id="jqShowcaseInfo"><div></div></div>', doc).appendTo(this.main);
		this.infoBarCnt = this.infoBar.find('div');
		body.append(this.loading, this.overlay, this.main);
		
		// Create Event Handlers
		$(doc).on('keydown.showcase', function (e) {
			
			if (!this.enabled) {
				
				return true;
				
			}
			
			const keycode = e.which,
				trg = $(e.target);
			
			// Allow keypress on inputs, except the Escape key
			if (trg.is(':input')
				&& keycode !== 27) {
				
				return true;
				
			}
			
			switch (keycode) {
				
			case 27 :
				
				// ESC Key
				this.disable();
				
				break;
				
			case 37 :
				
				// Left Key
				this.navigate('<');
				
				break;
				
			case 39 :
				
				// Right Key
				this.navigate('>');
				
				break;
				
			}
			
			return true;
			
		}.bind(this));
		
		this.close.on('click', function (e) {
			
			e.preventDefault();
			e.stopPropagation();
			
			if (this.enabled) { this.disable(); }
			
		}.bind(this));
		
		this.leftNav.on('click', function (e) {
			
			e.preventDefault();
			e.stopPropagation();
			this.navigate('<');
			
		}.bind(this));
		
		this.rightNav.on('click', function (e) {
			
			e.preventDefault();
			e.stopPropagation();
			this.navigate('>');
			
		}.bind(this));
		
		$(global).on('resize', function () {
			
			this.onResize();
			
		}.bind(this));
		
		// Set extra buffer info
		this.hExtra = (this.main.outerHeight() - this.main.height()) * 2;
		this.vExtra = (this.main.outerWidth() - this.main.width()) * 2;
		
	};
	Showcase.prototype = engine;
	Showcase.prototype.constructor = Showcase;
	
	/** The Public API Methods */
	api = {
		
		/**
		 * If the Showcase Plugin is ready to be called
		 * @return {bool}
		 */
		get ready () { return (utility.ready() && !sc.busy); },
		
		/**
		 * If the Showcase is currently enabled
		 * @return {bool}
		 */
		get enabled () { return sc.overlay.is(':visible'); },
		
		/**
		 * Get the jaShowcaseContent container as a jQuery Object
		 * @return {Object} Returns an empty jQuery collection if Showcase is not ready
		 */
		content: function () {
			
			if (utility.ready()) { return sc.content;
			} else { return $(); }
			
		},
		
		/**
		 * Displays the Showcase and enables the controls
		 * @param {Function} callback A function to execute when the Showcase is enabled
		 * @param {boolean} hideMain If the Main Div should not be displayed
		 * @return {Object} The window.Showcase API
		 */
		enable: function (callback, hideMain) {
			
			if (utility.ready()) { sc.enable(callback, hideMain); }
			return this;
			
		},
		
		/**
		 * Hides the Showcase and disables the controls
		 * @param {Function} callback A function to execute when Showcase is disabled
		 * @return {Object} The window.Showcase API
		 */
		disable: function (callback) {
			
			if (utility.ready()) { sc.disable(callback); }
			return this;
			
		},
		
		/**
		 * Resizes the Showcase window
		 * @param {string} width The new width to set or animate to
		 * @param {string} height The new height to set or animate to
		 * @param {Function} callback A function to execute when resize is finished
		 * @param {boolean} animate If the Main Div should animate to the new dimensions
		 * @param {boolean} showMain If the Main Div needs to be displayed
		 * @return {Object} The window.Showcase API
		 */
		resize: function (width, height, callback, animate, showMain) {
			
			if (utility.ready()) { sc.resize(width, height, callback, animate, showMain); }
			return this;
			
		},
		
		/**
		 * Navigates between the Showcase elements
		 * @param {string} direction The reverse '<' or forward '>' direction
		 * @return {Object} The window.Showcase API
		 */
		navigate: function (direction) {
			
			if (utility.ready()) { sc.navigate(direction); }
			return this;
			
		}
		
	};
	
	/** Various Utility Methods */
	utility = {
		
		/**
		 * Clears the timer used for Showcase methods
		 * @return {boolean}
		 */
		clearTimer : function () {
			
			if (timer !== null) {
				
				global.clearTimeout(timer);
				timer = null;
				
			}
			
			return true;
			
		},
		
		/**
		 * Get the dimensions of the Window object
		 * @return {Object|null}
		 * @property {number} width The width of the Window
		 * @property {number} height The height of the Window
		 */
		getWinDim : function () {
			
			let dim = {};
			
			// Get the window's width and height
			if (typeof global.innerWidth !== 'undefined') {
				
				// Standard
				dim.width = global.innerWidth;
				dim.height = global.innerHeight;
				
			} else if (typeof global.document.documentElement !== 'undefined'
				&& global.document.documentElement.clientWidth) {
				
				// IE
				dim.width = global.document.documentElement.clientWidth;
				dim.height = global.document.documentElement.clientHeight;
				
			} else {
				
				dim = null;
				
			}
			
			return dim;
			
		},
		
		/**
		 * Checks width and height dimensions to make sure they are within the Window boundaries
		 * @param {string} width The width of the element
		 * @param {string} height The height of the element
		 * @return {Object|false} An object containing verified width and height properties, or false
		 * @property {number} width A verified Window width
		 * @property {number} height A verified Window height
		 */
		checkWinDim : function (width, height) {
			
			if (typeof width !== 'number'
				|| typeof height !== 'number') {
				
				errHandler(new Error(errors.WINDIM.msg), 'WINDIM');
				
				return false;
				
			}
			
			const dim = utility.getWinDim(),
				newDim = {
					
					'width' : width,
					'height' : height
					
				},
				curDim = {
					
					'width' : width + sc.hBuffer,
					'height' : height + sc.vBuffer
					
				};
			
			if (dim === null) { return newDim; }
			if (curDim.width > dim.width) { newDim.width = dim.width - sc.hBuffer; }
			if (curDim.height > dim.height) { newDim.height = dim.height - sc.vBuffer; }
			
			return newDim;
			
		},
		
		/**
		 * Sets a standard mode for the Showcase to display messages in
		 * @return {boolean}
		 */
		setShowcaseStandard : function () {
			
			if (utility.ready()) {
				
				sc.main.css({
					
					'width' : '400px',
					'height' : '150px',
					'marginTop' : '-75px',
					'marginLeft' : '-200px'
					
				});
				sc.content.css({

					'width' : 'auto',
					'height' : 'auto',
					'overflow' : 'auto'

				});
				sc.leftNav.hide();
				sc.rightNav.hide();
				sc.infoBar.hide();
				
				sc.options.hoverControls = false;
				sc.options.overlayClose = true;
				sc.mainOriginWidth = 400;
				sc.mainOriginHeight = 150;
				sc.navEnabled = false;
				sc.infoEnabled = false;
				sc.infoBarGlobal = false;
				sc.infoBarHeight = 0;
				sc.type = 'element';
				sc.curNavIndex = 0;
				sc.hBuffer = 0;
				sc.vBuffer = 0;
				sc.mainScale = false;
				
			}
			
			return true;
			
		},
		
		ready: function () { return (sc && sc instanceof Showcase); }
		
	};
	
	// Return placeholder functions for the Showcase API
	return api;
	
}(jQuery, window));
