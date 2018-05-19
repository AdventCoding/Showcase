/*!
 * jQuery Showcase Plugin
 * Author: Michael S. Howard
 * Email: codingadvent@gmail.com
 * License: MIT
 */

/*global jQuery*/
'use strict';

/**
 * jQuery Showcase Plugin
 * @author Michael S. Howard
 * @requires jQuery 3.0+
 * @param $ The jQuery object
 * @param global The global Window object
 * @return {API} The API methods object
 */
window.Showcase = (($, global) => {
	
	/** Set to false for production */
	const debug = false;
	
	/** Plugin Declarations */
	let inst = null,
		api = null,
		initialized = false,
		timer = null,
		expTimer = null;
	
	/** Namespaces */
	const ns = {
		prefix: 'SC-',
		event: 'jqShowcase',
		customEvent: 'jqShowcaseUser',
	};
	
	/** Events */
	const events = new Set([
		`${ns.prefix}enable`,
		`${ns.prefix}disable`,
		`${ns.prefix}resize`,
		`${ns.prefix}navigate`,
		`${ns.prefix}error`,
	]);
	
	/** Error Objects */
	const errors = new Map([
		['NULL', { code: '', msg: '' }],
		['UNAVAILABLE', { code: '001', msg: 'The jQuery Showcase Plugin was called before it was available.' }],
		['OPTIONS', { code: '002', msg: 'Invalid options argument supplied to the jQuery Showcase Plugin.' }],
		['CALLBACK', { code: '003', msg: 'Invalid callback argument supplied to the jQuery Showcase Plugin.' }],
		['BUSY', { code: '004', msg: 'The jQuery Showcase instance is currently busy. Please use the forceLoad option.' }],
		['DATALOAD', { code: '005', msg: 'The jQuery Showcase plugin was unable to load the data content.' }],
		['MEDIALOAD', { code: '006', msg: 'The jQuery Showcase plugin was unable to load the media content.' }],
		['NODEFAULT', { code: '010', msg: 'The default option "{var}" does not exist for the Showcase Plugin.' }],
		['ONEVENT', { code: '011', msg: 'Invalid event type for the .on() Showcase method.' }],
		['ONHANDLER', { code: '012', msg: 'Invalid handler function for the .on() Showcase method.' }],
		['OFFEVENT', { code: '013', msg: 'Invalid event type for the .off() Showcase method.' }],
	]);
	
	/**
	 * The Error Handler
	 * @param {Error} err The Error object (used for details of where the error occurred)
	 * @param {bool} showcase If the error should be Showcased
	 * @throws {Error} Only in debug mode
	 * @return void
	 */
	const errorHandler = function (err, showcase = false) {
		
		if (!err) { return false; }
		
		let e = errors.get('NULL');
		
		// Find the error in the map if it exists
		for (let error of errors) {
			if (error[1].msg === err.message) {
				e = error[1];
			}
		}
		
		// Use original code and message if no match for error
		if (e.msg === '') {
			e = {
				code: err.code || '000',
				msg: err.message,
			};
		}
		
		const msg = 'An error has occurred:',
			text = `${e.code} - ${e.msg} (Line: ${err.lineNumber})`;
		
		inst.error = text;
		$(global.Showcase).trigger(`${ns.prefix}error.${ns.customEvent}`);
		
		// Throw the error in debug, otherwise Showcase it if needed
		if (debug) {
			throw err;
		} else if (showcase && Utility.isReady()) {
			$(`<p>${msg}<br>${text}</p>`).showcase(inst.options, inst.callback);
		}
		
	};
	
	/** Element Types */
	const types = {
		external: 'a',
		scalable: 'img, video',
		image: 'img, svg, canvas',
		vector: 'svg',
		media: 'video, audio',
		input: 'input, textarea, select',
		multiline: 'textarea',
		value: 'input, textarea, select option:selected',
		fill: 'audio, canvas, embed, iframe, img, object, picture, svg, video',
	};
	
	/** Button Icons */
	const icons = {
		close: '<div class="jqShowcaseIconX"><div class="jqShowcaseIconR"></div><div class="jqShowcaseIconL"></div></div>',
		left: '<div class="jqShowcaseIconL"></div>',
		right: '<div class="jqShowcaseIconR"></div>',
		check: '<div class="jqShowcaseIconCheck"><div class="jqShowcaseIcon1"></div><div class="jqShowcaseIcon2"></div></div>',
	};
	
	/** CSS Classes */
	const classes = {
		fade: 'jqSCFaded',
		animate: 'jqSCAnimated',
		load: 'jqSCLoading',
		progressBar: 'jqSCProgressBar',
		disable: 'jqSCDisabled',
		hide: 'jqSCHidden',
		transparent: 'jqSCTransparent',
		seeThrough: 'jqSCSeeThrough',
		background: 'jqSCBackground',
		backgroundObject: 'jqSCBackgroundObject',
		border: 'jqSCBorder',
		base: 'jqSCBaseSize',
		content: 'jqSCContent',
		pad: 'jqSCPadded',
		contain: 'jqSCContain',
		message: 'jqSCMessage',
	};
	
	/** Structural Elements */
	const elems = {
		container: '<div id="jqShowcaseContainer"></div>',
		navLeft: `<div id="jqShowcaseLeft">${icons.left}</div>`,
		navRight: `<div id="jqShowcaseRight">${icons.right}</div>`,
		wrapper: '<div id="jqShowcaseWrapper"></div>',
		contentWrapper: '<div id="jqShowcaseContentWrapper"></div>',
		close: `<div id="jqShowcaseClose">${icons.close}</div>`,
		expProgress: '<div id="jqShowcaseProgress"></div>',
		content: '<div id="jqShowcaseContent"></div>',
		info: '<div id="jqShowcaseInfo"><p></p></div>',
		alert: `<div id="jqShowcasePopup"><p class="${classes.message}">{message}</p>
			<button id="jqShowcaseConfirm">{button}${icons.check}</button></div>`,
		confirm: `<div id="jqShowcasePopup"><p class="${classes.message}">{message}</p><div id="jqShowcaseButtons">
			<button id="jqShowcaseConfirm">{confirm}${icons.check}</button>
			<button id="jqShowcaseCancel">{cancel}${icons.close}</button></div></div>`,
		prompt: '<input type="text" value="">',
		video: '<video{data} controls><source src="{source}" type="video/{type}"></video>',
	};
	
	/**
	 * The Default Options
	 * @typedef {Object} Defaults
	 * @property {number|string} width The width for the Showcase or 'auto'
	 * @property {number|string} height The height for the Showcase or 'auto'
	 * @property {number} currentIndex The current index if showcasing a jQuery collection
	 * @property {string|jQuery} infoContent The html string or jQuery object to place in the info box
	 * @property {bool} scaleMedia If <img> and <video> elements should be scaled based on aspect ratio
	 * @property {bool} forceScaling Force Showcase to scale and respect aspect ratio
	 * @property {bool} animate If the Showcase elements should animate in
	 * @property {bool} fade If the Showcase elements should fade in and out
	 * @property {bool} cloneData If data and events should be copied from the target element to the cloned element
	 * @property {number} expire The amount of seconds before the Showcase closes automatically (0 to disable)
	 * @property {RegExp} imageRegExp The image RegExp used to check for image content
	 * @property {RegExp} videoRegExp The video RegExp used to check for video content
	 * @property {ControlText} controlText The title texts for the nav elements
	 * @property {Promise} promise The Promise to fulfill before loading the content
	 *  (if the Promise is rejected with a string, that string will be Showcased)
	 */
	/**
	 * The ControlText Object
	 * @typedef {Object} ControlText
	 * @property {string} close The text for the close button
	 * @property {string} navLeft The text for the left navigation button
	 * @property {string} navRight The text for the right navigation button
	 */
	let defaults = {
		width: 'auto',
		height: 'auto',
		currentIndex: 0,
		infoContent: null,
		scaleMedia: true,
		forceScaling: false,
		animate: true,
		fade: true,
		cloneData: false,
		expire: 0,
		imageRegExp: /\.bmp|\.gif|\.ico|\.jpe|\.jpeg|\.jpg|\.png|\.apng|\.svg|\.tif|\.tiff|\.wbmp$/,
		videoRegExp: /\.mp4|\.ogg|\.webm$/,
		controlText: {
			close: 'Close',
			navLeft: 'Navigate Left',
			navRight: 'Navigate Right',
		},
		promise: null,
	};
	
	// Allow reset for defaults
	const originalDefaults = Object.assign({}, defaults);
	
	/**
	 * jQuery Showcase Plugin Method
	 * @param {Defaults?} options The Plugin options
	 * @param {Function?} callback A callback function to execute on completion
	 * @return {Object} The jQuery object used to call this method
	 */
	/**
	 * jQuery Showcase Plugin Method
	 * @param {Function?} callback A callback function to execute on completion
	 * @return {Object} The jQuery object used to call this method
	 */
	$.fn.showcase = function (options = {}, callback = $.noop) {
		
		if (!Utility.isReady()) {
			
			errorHandler(new Error(errors.get('UNAVAILABLE').msg));
			return this;
			
		}
		
		// Overload
		if ($.isFunction(options)) {
			
			callback = options;
			options = {};
			
		}
		
		if (!$.isPlainObject(options)) {
			
			if (options) {
				errorHandler(new Error(errors.get('OPTIONS').msg));
			}
			options = {};
			
		}
		if (!$.isFunction(callback)) {
			
			if (callback) {
				errorHandler(new Error(errors.get('CALLBACK').msg));
			}
			callback = $.noop;
			
		}
		
		initialized = true;
		inst.load(this, options, callback);
		
		return this;
		
	};
	
	/**
	 * Create a new Showcase
	 * @class
	 */
	class Showcase {
		
		constructor () {
			
			// Properties
			this.error = '';
			this.busy = false;
			this.newLoad = false;
			this.unloading = false;
			this.failsafeEngaged = false;
			this.failsafeTimer = null;
			this.deferReset = false;
			this.expire = false;
			this.options = Object.assign({}, defaults);
			this.callback = $.noop;
			this.background = classes.background;
			this.fadeContent = this.options.animate && this.options.fade;
			this.currentTargetIndex = 0;
			this.currentTargetType = {
				type: 'element',
				subType: false,
			};
			
			// Elements
			this.main = $(elems.container).addClass(
				`${classes.disable} ${classes.transparent}`
			);
			this.navLeft = $(elems.navLeft).appendTo(this.main);
			this.wrapper = $(elems.wrapper).appendTo(this.main);
			this.close = $(elems.close).appendTo(this.wrapper);
			this.expProgress = $(elems.expProgress).appendTo(this.close);
			this.contentWrapper = $(elems.contentWrapper).appendTo(this.wrapper);
			this.content = $(elems.content).appendTo(this.contentWrapper);
			this.infoParent = $(elems.info).appendTo(this.wrapper);
			this.info = this.infoParent.children('p');
			this.navRight = $(elems.navRight).appendTo(this.main);
			this.target = null;
			this.currentTarget = null;
			this.currentContent = null;
			
			$('body').append(this.main);
			
			this.setTitles()
				.setDOMEvents();
			
		}
		
		/**
		 * Set the Showcase expiration
		 * @return {Object} The Plugin instance
		 */
		setExpiration () {
			
			if (this.expire > 0) {
				
				expTimer = global.setTimeout(() => {
					this.close.children('.jqShowcaseIconX').trigger('click');
				}, this.expire * 1000);
				
				this.expProgress.removeClass(classes.progressBar)
					.css({ width: '100%' })
					.addClass(classes.progressBar)
					.css({
						transitionDuration: `${this.expire}s`,
						width: 0,
					});
				
			} else {
				
				this.expProgress.removeClass(classes.progressBar);
				
			}
			
			return this;
			
		}
		
		/**
		 * Set the titles for the Showcase Elements
		 * @return {Object} The Plugin instance
		 */
		setTitles () {
			
			const opts = this.options,
				titles = opts.controlText,
				keys = Object.keys(titles);
			
			keys.forEach((k) => {
				
				// The key is the same as the element name
				if (this[k]) { this[k].children('div').attr('title', titles[k]); }
				
			});
			
			return this;
			
		}
		
		/**
		 * Set the DOM events for the elements
		 * @return {Object} The Plugin instance
		 */
		setDOMEvents () {
			
			// Close Button
			this.close.children('.jqShowcaseIconX').on(`click.${ns.event}`, () => {
				this.uninit();
			});
			
			// Nav Buttons
			this.navLeft.children('div').on(`click.${ns.event}`, () => {
				this.navigate('left');
			});
			this.navRight.children('div').on(`click.${ns.event}`, () => {
				this.navigate('right');
			});
			
			// Window Resize
			$(global).on(`resize.${ns.event}`, () => {
				this.onResize();
			});
			
			// Keypress
			$(global.document).on('keydown.showcase', (e) => {
				
				if (Utility.isDisabled()) { return true; }
				
				const key = e.key.toLowerCase(),
					target = $(e.target);
				
				// Check if submitting a confirmation
				if (key === 'enter'
					&& this.currentContent
					&& !target.is(types.multiline)) {
					
					this.currentContent.find('#jqShowcaseConfirm').click();
					return false; // Prevent default
					
				}
				
				// Allow check only for ESC key on input types
				if (target.is(types.input)
					&& key !== 'escape') {
					
					return true;
					
				}
				
				switch (key) {
				case 'escape' :
					this.uninit();
					break;
				case 'arrowleft' :
					this.navigate('left');
					break;
				case 'arrowright' :
					this.navigate('right');
					break;
				}
				
				return true;
				
			});
			
			return this;
			
		}
		
		/**
		 * Set the target for the Showcase content
		 * @param {number} idx The index of the target to set
		 * @param {jQuery?} target The jQuery object to set or overwrite an index
		 * @param {bool?} replace If replacing an index
		 * @return {Object} The Plugin instance
		 */
		setTarget (idx, target = null, replace = false) {
			
			if (target && replace) {
				
				// Replace the target at the index
				this.target = this.target.map(
					(i, elem) => (i === idx) ? target[0] : elem
				);
				
			} else if (target) {
				
				this.target = target;
				
			}
			
			this.currentTarget = this.target.eq(idx);
			this.currentTargetIndex = idx;
			this.currentTargetType = Utility.getDataType(this.currentTarget);
			
			return this;
			
		}
		
		/**
		 * Set or remove the Close failsafe
		 * @param {bool?|number?} on If turning on the failsafe, or a timeout in ms
		 * @return {Object} The Plugin instance
		 */
		failsafe (on = true) {
			
			this.main.off(`click.${ns.event}`);
			this.failsafeEngaged = false;
			global.clearTimeout(this.failsafeTimer);
			this.failsafeTimer = null;
			
			// Showcase must be busy with loading to apply failsafe
			if (on === true && this.busy) {
				
				this.failsafeEngaged = true;
				this.main.on(`click.${ns.event}`, (e) => {
					
					if (e.target === this.main[0]) {
						Utility.abort();
					}
					
				});
				
			} else if (typeof on === 'number' && this.busy) {
				
				this.failsafeTimer = global.setTimeout(this.failsafe.bind(this), on);
				
			}
			
			return this;
			
		}
		
		/**
		 * Initialize the Showcase Plugin
		 * @param {bool?} reset If the Showcase should be reset
		 * @return {Object} The Plugin instance
		 */
		init (reset = true) {
			
			const disabled = this.main.hasClass(classes.disable);
			
			// If Showcase is disabled, hide border until animation
			if (disabled) {
				this.infoParent.removeClass(classes.border);
				this.contentWrapper.removeClass(classes.border);
			}
			
			$(global.Showcase).trigger(`${ns.prefix}enable.${ns.customEvent}`);
			this.failsafe(2000);
			this.hideElems();
			this.main.removeClass(classes.disable)
				.outerWidth(); // Force reflow
			this.main.removeClass(classes.transparent);
			
			if (reset) { this.reset(disabled); }
			
			return this;
			
		}
		
		/**
		 * Unitialize the Showcase Plugin
		 * @param {bool?} force If uninit should be forced
		 * @return {Object} The Plugin instance
		 */
		uninit (force = false) {
			
			let media = $();
			
			if (Utility.isDisabled()
				|| (Utility.isBusy() && !force)
				|| (this.newLoad && !force)) {
				return false;
			}
			
			Utility.clearTimer();
			this.failsafe(false);
			this.newLoad = false;
			this.expProgress.removeClass(classes.progressBar);
			
			// Trigger listeners and check for new load
			$(global.Showcase).trigger(`${ns.prefix}disable.${ns.customEvent}`);
			if ((this.busy || this.newLoad)
				&& !force) {
				
				return false;
				
			}
			
			this.unloading = true;
			media = this.content.find(types.media);
			
			if (media.length > 0) {
				media.each((i, e) => { e.pause(); });
			}
			
			const opts = this.options,
				end = () => {
					
					this.unloading = false;
					this.busy = false;
					this.hideElems(true);
					this.main.addClass(classes.disable);
					
				};
			
			if (opts.fade) {
				
				// Set transparency for fade out
				this.main.addClass(classes.transparent);
				Utility.setTransitionEnd(this.main, 'opacity')
					.then(end)
					.catch(errorHandler);
				
			} else {
				
				end();
				
			}
			
			return this;
			
		}
		
		/**
		 * Reinitialize the Showcase
		 * @return {Object} The Plugin instance
		 */
		reinit () {
			
			this.busy = true;
			this.deferReset = true;
			this.hideElems()
				.failsafe(1000);
			
			return this;
			
		}
		
		/**
		 * Reset the Showcase content
		 * @param {bool?} resize If the Showcase should be resized to 0, 0
		 * @return {Object} The Plugin instance
		 */
		reset (resize = true) {
			
			this.currentContent = null;
			this.content.empty();
			if (resize) { this.setDimensions(0, 0); }
			
			return this;
			
		}
		
		/**
		 * Hide the Showcase elements
		 * @param {bool?} uninit If the Showcase is uninitializing
		 * @return {Object} The Plugin instance
		 */
		hideElems (uninit = false) {
			
			// Make sure background is visible again for scaled content
			if (this.scaledContentType === 'natural') {
				this.contentWrapper.addClass(this.background);
			}
			
			if (!uninit) {
				
				this.main.addClass(classes.load);
				
				if (this.currentContent) {
					this.currentContent.addClass(classes.seeThrough);
				}
				
			}
			
			this.navLeft
				.add(this.navRight)
				.add(this.close)
				.add(this.info)
				.addClass(classes.hide);
			
			return this;
			
		}
		
		/**
		 * Show the Showcase elements
		 * @return {Object} The Plugin instance
		 */
		showElems () {
			
			this.failsafe(false);
			this.main.removeClass(classes.load);
			this.close.removeClass(classes.hide);
			
			if (this.currentContent) {
				this.currentContent.removeClass(
					`${classes.seeThrough} ${classes.transparent}`);
			}
			
			// 1px of background is visible on some browsers for scaled content
			if (this.scaledContentType === 'natural') {
				this.contentWrapper.removeClass(this.background);
			}
			
		}
		
		/**
		 * Set the Showcase dimensions
		 * @param {number?} width The width to animate to
		 * @param {number?} height The height to animate to
		 * @param {bool?} animate If the Showcase should animate to new dimensions
		 * @param {bool?} forceBackground If the Content Wrapper should have a background when not animating
		 * @return {Promise}
		 */
		setDimensions (width = 0, height = 0, animate = false) {
			
			const both = this.wrapper.add(this.contentWrapper),
				noWidth = (Math.abs(Math.floor(parseFloat(inst.wrapper.css('maxWidth'))) - Math.floor(width)) < 2),
				noHeight = (Math.abs(Math.floor(parseFloat(inst.contentWrapper.css('maxHeight'))) - Math.floor(height)) < 2),
				transitions = new Set(['max-width', 'max-height']);
			
			// Remove transition check if not animating property
			if (noWidth) { transitions.delete('max-width'); }
			if (noHeight) { transitions.delete('max-height'); }
			
			// Force no animation/fade if dimensions are close to the same
			if (animate && noWidth && noHeight) {
				animate = false;
			}
			
			const classFn = (animate) ? 'addClass' : 'removeClass';
			
			// Add or remove the animate class and show content border
			both[classFn](classes.animate);
			
			if (animate) {
				this.hideElems();
			}
			
			return new Promise((resolve, reject) => {
				
				if (animate) {
					Utility.setTransitionEnd(both, transitions)
						.then(() => {
							
							both.removeClass(classes.animate);
							resolve();
							
						})
						.catch(reject);
				}
				
				this.wrapper.css('maxWidth', width);
				this.contentWrapper.css('maxHeight', height);
				if (!animate) { resolve(); }
				
			});
			
		}
		
		/**
		 * Resize the content if needed when the Window is resized
		 * @return {Object} The Plugin instance
		 */
		onResize () {
			
			$(global.Showcase).trigger(`${ns.prefix}resize.${ns.customEvent}`);
			return this;
			
		}
		
		/**************************/
		/* API-Referenced Methods */
		/**************************/
		
		/**
		 * Enable the Showcase if disabled
		 * @return {Object} The Plugin instance
		 */
		enable () {
			
			if (Utility.isDisabled()) {
				
				if (!initialized) {
					api.alert('Hello!');
				} else {
					
					this.init(false)
						.loadComplete();
					
				}
				
			}
			
			return this;
			
		}
		
		/**
		 * Disable the Showcase if enabled
		 * @return {Object} The Plugin instance
		 */
		disable () {
			
			this.uninit();
			
		}
		
		/**
		 * Resize the main Showcase content area
		 * @param {number} width The width to resize to
		 * @param {number} height The height to resize to
		 * @param {bool?} animate If the content should animate to new size
		 * @param {Function?} callback The callback to execute after the resize
		 * @return {Object} The global Showcase object
		 */
		resize (width, height, animate = true, callback = $.noop) {
			
			if (!Utility.isBusy()) {
				
				$(global.Showcase).trigger(`${ns.prefix}resize.${ns.customEvent}`);
				inst.setDimensions(width, height, animate)
					.then(() => {
						
						if (animate) { inst.showElems(); }
						callback.call(global.Showcase);
						
					})
					.catch(errorHandler);
				
			}
			
			return this;
			
		}
		
		/**
		 * Navigate to the next or previous Showcase element
		 * @param {string} direction 'left' or 'right'
		 * @return {Object} The Plugin instance
		 */
		navigate (/* direction */) {
			
			if (!this.navEnabled || Utility.isBusy()) { return this; }
			$(global.Showcase).trigger(`${ns.prefix}navigate.${ns.customEvent}`);
			
			return this;
			
		}
		
	}
	
	/**
	 * Create a new Instance of Showcase
	 * @class
	 */
	class Instance extends Showcase {
		
		constructor () {
			
			super();
			
			this.navEnabled = false;
			this.infoEnabled = false;
			this.infoData = '';
			this.scaledContentType = null;
			this.scaledOrigin = null;
			this.scaledTarget = null;
			this.cache = new Map();
			
		}
		
		/**
		 * The main method to load the Showcase content
		 * @param {jQuery} target The jQuery object that the plugin was called on
		 * @param {Defaults} options The user-defined options
		 * @param {Function} callback The user-defined callback
		 * @return {Object} The Plugin instance
		 */
		load (target, options, callback) {
			
			this.busy = true;
			this.newLoad = true;
			this.options = Object.assign({}, defaults, options);
			this.callback = callback.bind(global.Showcase);
			this.fadeContent = (this.options.animate && this.options.fade);
			
			if (this.options.expire > 0) { this.expire = this.options.expire; }
			if (this.options.controlText) { this.setTitles(); }
			if (this.options.fade) {
				this.main.addClass(classes.fade);
			} else {
				this.main.removeClass(classes.fade);
			}
			
			if (target.length > 1) {
				
				if (this.options.currentIndex >= target.length) {
					this.options.currentIndex = target.length - 1;
				} else if (this.options.currentIndex < 0) {
					this.options.currentIndex = 0;
				}
				
				this.navEnabled = true;
				this.navLeft.add(this.navRight).removeClass(classes.hide);
				
			} else {
				
				this.options.currentIndex = 0;
				this.navEnabled = false;
				this.navLeft.add(this.navRight).addClass(classes.hide);
				
			}
			
			this.init()
				.setTarget(this.options.currentIndex, target);
			
			if (this.options.promise instanceof Promise) {
				
				this.options.promise.then(inst.loadAsync.bind(this))
					.catch(Utility.abort);
				
			} else {
				
				this.loadAsync();
				
			}
			
			return this;
			
		}
		
		/**
		 * Load the Showcase content with async
		 * @return {Object} The Plugin instance
		 */
		loadAsync () {
			
			Utility.clearTimer();
			this.busy = true;
			
			const opts = this.options,
				elem = this.currentTarget,
				prepare = (replace = false) => {
					this.loadPrepare(replace);
				};
			
			let src = '',
				type = '',
				hash = '',
				data = '',
				loaded = false,
				isImage = (Utility.isType('image') && elem.attr('src')),
				container = null;
			
			// Check the original target for info data
			this.infoData = this.currentTarget.data('showcaseInfo');
			if (this.infoData) { data = ` data-showcase-info="${this.infoData}"`; }
			
			if (Utility.isType('data') || isImage) {
				
				src = elem.attr('href') || elem.attr('src');
				
				// Check if URL has a hash for query loading
				if (src.indexOf('#') >= 0) {
					
					// Recreate the URL, separating the query with a space for jQuery
					hash = src.split('#');
					src = `${hash[0]} #${hash[1]}`;
					
				}
				
				if (opts.imageRegExp.test(src) || isImage) {
					
					container = $(`<img${data} src="${src}">`);
					
					// Check for image size cache
					if (this.cache.has(src)) {
						
						// Replace the target (index, object, replace) and prepare without cloning
						this.setTarget(this.currentTargetIndex, container, true);
						loaded = true;
						prepare(false);
						
					}
					
				} else if (opts.videoRegExp.test(src)) {
					
					// Reload Showcase with video element
					loaded = true;
					type = src.match(/\.([0-9a-z]+)$/i) || ['', 'webm'];
					$(elems.video.replace('{source}', src)
						.replace('{data}', data)
						.replace('{type}', type[1]))
						.showcase(this.options, this.callback);
					
				} else {
					
					container = $(`<div${data}></div>`);
					loaded = false;
					
				}
				
				// Continue when data is loaded into the container
				if (!loaded) {
					container.load(
						src,
						null,
						(res, status) => {
							
							if (isImage
								&& container[0].width === 0
								&& container[0].height === 0) {
								
								// Image is broken, try reloading
								timer = global.setTimeout(this.loadAsync.bind(this), 1000);
								
							} else if (status === 'error') {
								
								errorHandler(new Error(errors.get('DATALOAD').msg), true);
								
							} else {
								
								// Replace the target (index, object, replace) and prepare without cloning
								this.setTarget(this.currentTargetIndex, container, true);
								prepare(false);
								
							}
							
						}
					);
				}
				
			} else if (Utility.isType('media')) {
				
				// Continue if the media is ready, or hook into the canplay event
				if (elem[0].readyState >= 2) {
					
					prepare();
					
				} else if (elem[0].error) {
					
					errorHandler(new Error(errors.get('MEDIALOAD').msg), true);
					
				} else {
					
					elem.one('loadeddata', prepare)
						.one('error', errorHandler);
					
				}
				
			} else {
				
				// Prepare the content normally
				prepare();
				
			}
			
			// Done with new load
			this.newLoad = false;
			
			return this;
			
		}
		
		/**
		 * Prepare the load for displaying
		 * @param {bool?} clone If the target element should be cloned
		 * @return {Object} The Plugin instance
		 */
		loadPrepare (clone = true) {
			
			const opts = this.options,
				cls = `${classes.content} ${classes.transparent}
					${(this.fadeContent) ? ` ${classes.fade}` : ''}`,
				elem = (clone) ? this.currentTarget.clone(opts.cloneData)
					: this.currentTarget;
			
			let size = null;
			
			if (this.deferReset) {
				
				this.reset(false);
				this.deferReset = false;
				
			}
			
			this.currentContent = elem.addClass(cls)
				.appendTo(this.content);
			
			// Set padding
			if (this.currentContent.is(types.fill)) {
				this.currentContent.removeClass(classes.pad);
			} else {
				this.currentContent.addClass(classes.pad);
			}
			
			// Check for info data
			if (this.infoData || opts.infoContent) {
				
				this.infoEnabled = true;
				this.infoParent.removeClass(classes.disable);
				this.info.empty()
					.html(this.infoData || opts.infoContent);
				
			} else {
				
				this.infoEnabled = false;
				this.infoParent.addClass(classes.disable);
				this.info.empty();
				
			}
			
			if (opts.scaleMedia && this.currentContent.is(types.scalable)) {
				
				// Remove base size for content div to allow content scale
				this.scaledContentType = 'natural';
				this.content.removeClass(classes.base);
				
			} else {
				
				// No scaling, but force if needed
				this.scaledContentType = (opts.forceScaling) ? 'forced' : null;
				this.content.addClass(classes.base);
				
				if (typeof opts.width === 'number') {
					
					this.content.css({ width: opts.width });
					
					// Check if viewport is too narrow or if minWidth is too large
					if ($(window).width() < opts.width) {
						this.content.css({ width: $(window).width() });
					} else if (opts.width < parseInt(this.content.css('minWidth'))) {
						this.content.css('minWidth', opts.width);
					} else {
						this.content.css('minWidth', '');
					}
					
				}
				if (typeof opts.height === 'number') {
					
					this.content.css({ height: opts.height });
					
					// Check if height needs to override the minimum height
					if ($(window).height() < opts.height) {
						this.content.css({ height: $(window).height() });
					} else if (opts.height < parseInt(this.content.css('minHeight'))) {
						this.content.css('minHeight', opts.height);
					} else {
						this.content.css('minHeight', '');
					}
					
				}
				
			}
			
			// Clear containment before checking content size
			this.content.add(this.currentContent)
				.removeClass(classes.contain);
			
			size = this.checkContentSize();
			
			// Update backgrounds/border
			this.main.removeClass(classes.load);
			this.contentWrapper.removeClass(this.background);
			this.background = (Utility.isType('object'))
				? classes.backgroundObject : classes.background;
			this.infoParent.addClass(classes.border);
			this.contentWrapper.addClass(`${classes.border} ${this.background}`);
			
			// Set new dimensions and complete
			$(global.Showcase).trigger(`${ns.prefix}resize.${ns.customEvent}`);
			this.setDimensions(size.width, size.height, opts.animate)
				.then(this.loadComplete.bind(this))
				.catch(errorHandler);
			
			return this;
			
		}
		
		/**
		 * Complete the content load
		 * @return {Object} The Plugin instance
		 */
		loadComplete () {
			
			const input = this.currentContent.find(types.input);
			
			this.showElems();
			this.busy = false;
			this.callback();
			this.setExpiration();
			
			// Use callback and expiration only once
			this.callback = $.noop;
			this.expire = false;
			
			// Check for input element to focus
			if (input.length > 0) {
				input.eq(0).focus();
			}
			
			return this;
			
		}
		
		/**
		 * Check the width and height of the current content
		 * @return {Object} The width and height properties
		 */
		checkContentSize () {
			
			let size = null,
				auto = [];
			
			const opts = this.options,
				setScaled = () => {
					
					// Calculate the scaled size based on the target dimensions
					this.scaledTarget = Object.assign({}, size);
					size = this.getScaledDimensions();
					
				};
			
			if (Utility.isType('object')) {
				
				size = this.getObjectSize();
				
			} else {
				
				size = {
					width: this.content.outerWidth(),
					height: this.content.outerHeight(),
				};
				
			}
			
			// Cache object size for scalable content
			if (this.scaledContentType) {
				this.scaledOrigin = Object.assign({}, size);
			}
			
			// Prefer options and check for auto width/height
			if (typeof opts.width === 'number') {
				size.width = opts.width;
			} else {
				auto.push('width');
			}
			if (typeof opts.height === 'number') {
				size.height = opts.height;
			} else {
				auto.push('height');
			}
			
			if (this.scaledContentType) {
				
				// Add containment
				this.content.add(this.currentContent)
					.addClass(classes.contain);
				
				if (this.scaledContentType === 'natural') {
					
					if (auto.length > 0) {
						
						// Only adjust to auto if other dimension is numeric
						if (auto.length === 1) {
							size[auto[0]] = 'auto';
						}
						
						setScaled();
						
					} else {
						
						// Allow CSS contain to resize content on Window resize
						this.scaledContentType = null;
						
					}
					
				} else {
					
					// Scaling is forced
					setScaled();
					
				}
				
				this.content.removeClass(classes.base);
				
			} else {
				
				// Get auto height for non-scalable content
				if (auto.indexOf('height') >= 0) {
					
					this.content.css('height', '');
					size.height = this.content.outerHeight();
					
				}
				
			}
			
			// Allow class properties for content size
			this.content.css(Utility.baseSize);
			
			// Fallback for broken element sizes
			if (size.width === 0) { size.width = '100%'; }
			if (size.height === 0) { size.height = '100%'; }
			
			return size;
			
		}
		
		/**
		 * Get the size of an object element
		 * @return {Object|null} The width and height properties, or null
		 */
		getObjectSize () {
			
			const target = this.currentTarget,
				src = target.attr('src') || '';
			
			let size = target[0].getBoundingClientRect(); // For image type
			
			if (Utility.isType('image')) {
				
				if (this.cache.has(src)) {
					
					size = this.cache.get(src);
					
				} else {
					
					if (!size || (!size.width && !size.height)) {
						
						size = {
							width: target[0].width,
							height: target[0].height,
						};
						
						if (target.is(types.vector)) { size = Utility.getSVGDimensions(size); }
						
					}
					
					// Cache image size
					if (src) { this.cache.set(src, size); }
					
				}
				
			} else if (Utility.isType('media')) {
				
				size = {
					width: target[0].videoWidth || target.width(),
					height: target[0].videoHeight || target.height(),
				};
				
			}
			
			return {
				width: size.width,
				height: size.height,
			};
			
		}
		
		/**
		 * Get the scaled dimensions if content is scaled
		 * @return {Object} The width and height properties
		 */
		getScaledDimensions () {
			
			let width = this.scaledTarget.width,
				height = this.scaledTarget.height;
			
			// Get the increase/decrease for auto dimensions
			if (width === 'auto' || width === '100%') {
				width = (height / this.scaledOrigin.height) * this.scaledOrigin.width;
			}
			if (height === 'auto' || height === '100%') {
				height = (width / this.scaledOrigin.width) * this.scaledOrigin.height;
			}
			
			const ratio = this.scaledOrigin.width / this.scaledOrigin.height,
				wrapperOrigin = {
					width: this.wrapper.width(),
					height: this.contentWrapper.height(),
				};
			
			// Set the wrapper dimensions to the target values
			this.setDimensions(width, height)
				.catch(errorHandler);
			
			// Get the actual dimensions and ratio targets
			const scaledWidth = this.wrapper.width(),
				scaledHeight = this.contentWrapper.height(),
				targetWidth = scaledHeight * ratio,
				targetHeight = scaledWidth / ratio;
			
			// Adjust the final dimensions for aspect ratio
			if (scaledWidth < width && scaledHeight < height) {
				
				// Whichever target is less than the scaled dimension is incorrect
				if (Math.floor(targetWidth) < Math.floor(scaledWidth)) { width = targetWidth; }
				if (Math.floor(targetHeight) < Math.floor(scaledHeight)) { height = targetHeight; }
				
			} else if (scaledWidth < width) {
				
				height = targetHeight;
				
			} else if (scaledHeight < height) {
				
				width = targetWidth;
				
			}
			
			this.setDimensions(wrapperOrigin.width, wrapperOrigin.height)
				.catch(errorHandler);
			
			return { width, height, scaledWidth, scaledHeight };
			
		}
		
		/********************/
		/* Extended Methods */
		/********************/
		
		/**
		 * Show the Showcase elements
		 * @return {Object} The Plugin instance
		 */
		showElems () {
			
			super.showElems();
			
			if (this.navEnabled) {
				this.navLeft.add(this.navRight)
					.removeClass(classes.hide);
			}
			if (this.infoEnabled) {
				this.info.removeClass(classes.hide);
			}
			
			return this;
			
		}
		
		/**
		 * Resize the content if needed when the Window is resized
		 * @return {Object} The Plugin instance
		 */
		onResize () {
			
			super.onResize();
			
			if (this.scaledContentType) {
				
				// Get scaled dimensions without changing the wrapper size
				const scaled = this.getScaledDimensions();
				
				// Check if no change is needed
				if (scaled.width === this.scaledOrigin.width) {
					scaled.width = scaled.scaledWidth;
				}
				if (scaled.height === this.scaledOrigin.height) {
					scaled.height = scaled.scaledHeight;
				}
				
				this.setDimensions(scaled.width, scaled.height)
					.catch(errorHandler);
				
			}
			
			return this;
			
		}
		
		/**
		 * Navigate to the next or previous Showcase element
		 * @param {string} direction 'left' or 'right'
		 * @return {Object} The Plugin instance
		 */
		navigate (direction) {
			
			super.navigate(direction);
			if (!this.navEnabled || Utility.isBusy()) { return this; }
			
			const len = this.target.length;
			let idx = this.currentTargetIndex;
			
			idx = (direction === 'left')
				? idx - 1
				: idx + 1;
			
			// Adjust indexes that are out of bounds
			if (idx < 0) {
				idx = len - 1;
			} else if (idx >= len) {
				idx = 0;
			}
			
			// Prevent visual glitch of background if not animating
			if (!this.options.animate) {
				this.contentWrapper.removeClass(this.background);
			}
			
			this.reinit()
				.setTarget(idx)
				.loadAsync();
			
			return this;
			
		}
		
	}
	
	/** Create a new Utility */
	class Utility {
		
		/** Base CSS Style */
		static get baseSize () { return { width: '', height: '', }; }
		
		/**
		 * Check if The Plugin instance is busy
		 * @return {bool}
		 */
		static isBusy () { return (!Utility.isReady() || inst.busy || inst.unloading); }
		
		/**
		 * Check if the Showcase is ready
		 * @return {bool}
		 */
		static isReady () { return (inst && inst instanceof Showcase); }
		
		/**
		 * Check if the Showcase is disabled
		 * @return {bool}
		 */
		static isDisabled () { return (inst.main.hasClass(classes.disable)); }
		
		/**
		 * Check for a true object
		 * @return {bool}
		 */
		static isObject (obj) { return (obj === Object(obj)); }
		
		/**
		 * Check target type
		 * @param {string} type The type to check for
		 * @return {bool}
		 */
		static isType (type) {
			
			return (inst.currentTargetType.type === type
				|| inst.currentTargetType.subType === type);
			
		}
		
		/**
		 * Abort the Showcase
		 * @param {string?} message The message to Showcase if needed
		 * @return void
		 */
		static abort (message = '') {
			
			if (message) {
				api.alert(message, null);
			} else {
				inst.uninit(true);
			}
			
		}
		
		/**
		 * Clear the timer
		 * @return void
		 */
		static clearTimer () {
			
			global.clearTimeout(timer);
			timer = null;
			global.clearTimeout(expTimer);
			expTimer = null;
			
		}
		
		/**
		 * Set the transition event for animation
		 * @param {jQuery} elem The jQuery object(s) to set the event for
		 * @param {string?} property The property to check for on transition end
		 * @return {Promise}
		 */
		static setTransitionEnd (elem, property = null) {
			
			return new Promise((resolve, reject) => {
				
				const end = () => {
					
					elem.off(`transitionend.${ns.event}`);
					resolve();
					
				};
				
				let transition = '';
				
				try {
					
					// Set event and check transitioned property for resolve
					elem.off(`transitionend.${ns.event}`)
						.on(`transitionend.${ns.event}`, (e) => {
							
							if (property) {
								
								transition = e.originalEvent.propertyName;
								
								if (transition === property) {
									
									end();
									
								} else if (property instanceof Set) {
									
									// Remove matched property and check for end of Set
									property.delete(transition);
									if (property.size < 1) { end(); }
									
								}
								
							} else {
								
								// Resolve on any transition end
								end();
								
							}
							
						});
					
				} catch (e) {
					
					reject(e);
					
				}
				
			});
			
		}
		
		/**
		 * Filter the user-specified options for the defaults
		 * @return {Object} The filtered options object
		 */
		static filterOptions (options) {
			
			const keys = Object.keys(options),
				defaultKeys = Object.keys(defaults),
				filtered = {};
			
			keys.forEach((v) => {
				
				if (defaultKeys.indexOf(v) < 0) {
					errorHandler(new Error(errors.get('NODEFAULT').msg.replace('{var}', v)));
				} else {
					filtered[v] = options[v];
				}
				
			});
			
			return filtered;
			
		}
		
		/**
		 * Get the type of Showcase element
		 * @return {string}
		 */
		static getDataType (elem) {
			
			let type = {
				type: 'element',
				subType: null,
			};
			
			if (elem.is(types.external)) {
				
				type.type = 'data';
				type.subType = 'external';
				
			} else if (elem.is(types.image)) {
				
				type.type = 'object';
				type.subType = 'image';
				
			} else if (elem.is(types.media)) {
				
				type.type = 'object';
				type.subType = 'media';
				
			}
			
			return type;
			
		}
		
		/**
		 * Get the dimensions from an svg width and height
		 * @param {Object} dim The width and height objects
		 * @return {Object} The width and height properties
		 */
		static getSVGDimensions (dim) {
			
			let width = 0,
				height = 0;
			
			if (Utility.isObject(dim.width)
				&& Utility.isObject(dim.height)) {
				
				width = (dim.width.baseVal) ? dim.width.baseVal.value : 0;
				height = (dim.height.baseVal) ? dim.height.baseVal.value : 0;
				
			}
			
			return { width, height };
			
		}
		
		/**
		 * Handle the Popup action
		 * @param {Object|Function} e The jQuery.Event object, or the callback function
		 * @param {any?} result The result of the Popup
		 * @return void
		 */
		static popup (e, result = null) {
			
			api.off('disable', Utility.popup);
			
			if ($.isFunction(e)) {
				
				e.call(global.Showcase, result);
				inst.uninit();
				
			} else if (e && $.isFunction(e.data)) {
				
				e.data.call(global.Showcase, result);
				
			}
			
		}
		
		/**
		 * Get the Popup input string
		 * @return {string|string[]} The input string or array of strings
		 */
		static getPopupValue () {
			
			const input = inst.currentContent.find(types.value),
				values = [],
				value = (input.length > 1)
					? input.each(function () {
						
						const val = $(this).val() || '';
						values.push(val.trim());
						
					})
					: input.val() || '';
			
			return (values.length > 1) ? values : value.trim() + '';
			
		}
		
		/**
		 * Get the width for the Showcase Popup
		 * @param {string} message The message for the Popup
		 * @return {number}
		 */
		static getPopupWidth (message) {
			
			const defaultWidth = parseInt(defaults.width) || 0;
			let width = 400;
			
			if (message.length > 25) {
				
				width = (defaultWidth < width)
					? width : defaultWidth;
				
			} else {
				
				width = (defaultWidth < 300)
					? 300 : defaultWidth;
				
			}
			
			return width;
			
		}
		
	}
	
	/**
	 * Create a new Public API
	 * @class
	 */
	class API {
		
		/**
		 * If the Showcase is busy loading content
		 * @return {bool}
		 */
		get busy () { return Utility.isBusy(); }
		
		/**
		 * Get the current Showcase error if there is one
		 * @return {string}
		 */
		get error () { return inst.error; }
		
		/**
		 * Get the Showcase Container jQuery object
		 * @return {jQuery}
		 */
		get container () { return inst.main; }
		
		/**
		 * Get the current Showcase content jQuery object
		 * @return {jQuery}
		 */
		get content () { return inst.currentContent || $(); }
		
		/**
		 * Set the default Showcase options
		 * @param {Defaults} defaults The new default options
		 * @return {Object} The global Showcase object
		 */
		setDefaults (options) {
			
			defaults = Object.assign({}, defaults, Utility.filterOptions(options));
			return this;
			
		}
		
		/**
		 * Reset the default Showcase options
		 * @return {Object} The global Showcase object
		 */
		resetDefaults ()  {
			
			defaults = Object.assign({}, originalDefaults);
			return this;
			
		}
		
		/**
		 * Enable the Showcase if disabled
		 * @param {Function?} callback A callback function to execute after the Showcase is loaded
		 * @return {Object} The global Showcase object
		 */
		enable (callback = $.noop) {
			
			inst.enable(callback);
			return this;
			
		}
		
		/**
		 * Disable the Showcase if enabled
		 * @param {Function?} callback A callback function to execute after the Showcase is loaded
		 * @return {Object} The global Showcase object
		 */
		disable (callback = $.noop) {
			
			inst.disable(callback);
			return this;
			
		}
		
		/**
		 * Resize the main Showcase content area
		 * @param {number} width The width to resize to
		 * @param {number} height The height to resize to
		 * @param {bool?} animate If the content should animate to new size
		 * @param {Function?} callback The callback to execute after the resize
		 * @return {Object} The global Showcase object
		 */
		resize (width, height, animate = true, callback = $.noop) {
			
			inst.resize(width, height, animate, callback);
			return this;
			
		}
		
		/**
		 * Navigate to the next or previous Showcase element
		 * @param {string} direction 'left' or 'right'
		 * @return {Object} The global Showcase object
		 */
		navigate (direction) {
			
			inst.navigate(direction);
			return this;
			
		}
		
		/**
		 * Add an event listener to the Showcase
		 * @param {string} event 'enable', 'disable', 'resize', 'navigate', or 'error'
		 * @param {any?} data Optional data to be passed to the handler
		 * @param {eventListener} handler A handler for the event trigger
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Add an event listener to the Showcase
		 * @param {string} event 'enable', 'disable', 'resize', 'navigate', or 'error'
		 * @param {EventListener} handler A handler for the event trigger
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Callback for event listening
		 * The this keyword refers to the Showcase container jQuery object
		 * @callback EventListener
		 * @param {Object} event The jQuery.Event object with the .data property
		 *  that contains the data argument that was passed in the Showcase.on() method call
		 */
		on (event, data = null, handler) {
			
			if ($.isFunction(data) && handler === undefined) {
				
				handler = data;
				data = null;
				
			}
			
			if (!$.isFunction(handler)) {
				
				errorHandler(new Error(errors.get('ONHANDLER').msg));
				handler = $.noop;
				
			}
			
			if (events.has(ns.prefix + event)) {
				$(global.Showcase).on(`${ns.prefix}${event}.${ns.customEvent}`, null, data, handler);
			} else {
				errorHandler(new Error(errors.get('ONEVENT').msg));
			}
			
			return this;
			
		}
		
		/**
		 * Remove an event listener from the Showcase
		 * @param {string?} event 'enable', 'disable', 'resize', or 'navigate' (omit to clear all events)
		 * @param {Function?} handler The handler used in the Showcase.on method call (omit to clear all handlers)
		 * @return {Object} The global Showcase object
		 */
		off (event, handler) {
			
			if (event === undefined) {
				
				$(global.Showcase).off(`.${ns.customEvent}`);
				
			} else if (events.has(ns.prefix + event)) {
				
				if ($.isFunction(handler)) {
					$(global.Showcase).off(`${ns.prefix}${event}.${ns.customEvent}`, null, handler);
				} else {
					$(global.Showcase).off(`${ns.prefix}${event}.${ns.customEvent}`);
				}
				
			} else {
				
				errorHandler(new Error(errors.get('OFFEVENT').msg));
				
			}
			
			return this;
			
		}
		
		/**
		 * Display an alert Popup
		 * @param {string} message The message to display
		 * @param {string?} button The text for the alert button (null to disable)
		 * @param {Alert?} callback The callback to execute after the alert is dismissed
		 * @param {bool} expire The amount of seconds before the Showcase closes automatically
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Display an alert Popup
		 * @param {string} message The message to display
		 * @param {Alert?} callback The callback to execute after the alert is dismissed
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Callback for alert Popup
		 * The this keyword refers to the global Showcase object
		 * @callback Alert
		 * @param {bool} response True if button was clicked, null if Showcase was closed
		 */
		alert (message, button = 'OK', callback = $.noop, expire = 0) {
			
			// Overload
			if ($.isFunction(button)) {
				
				callback = button;
				button = 'OK';
				
			}
			
			// Use Utility.popup to execute the callback on the Showcase 'disable' event
			api.on('disable', callback, Utility.popup);
			
			const popup = $(elems.alert.replace('{message}', message).replace('{button}', button));
			
			if (button === null) {
				
				popup.children('button').remove('button');
				
			} else {
				
				popup.children('button')
					.on(`click.${ns.event}`, () => { Utility.popup(callback, true); });
				
			}
			
			popup.showcase({
				width: Utility.getPopupWidth(message),
				cloneData: true,
				expire,
			});
			
			return this;
			
		}
		
		/**
		 * Dispaly a confirmation Popup
		 * @param {string} message The message to display
		 * @param {string[]?} buttons The array of texts for the confirm and cancel buttons
		 * @param {Confirm?} callback The callback to execute after confirmation or cancellation
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Dispaly a confirmation Popup
		 * @param {string} message The message to display
		 * @param {Confirm?} callback The callback to execute after confirmation or cancellation
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Callback for confirm Popup
		 * The this keyword refers to the global Showcase object
		 * @callback Confirm
		 * @param {bool} response True if confirmed, false if cancelled, null if Showcase was closed
		 */
		confirm (message, buttons = ['OK', 'CANCEL'], callback = $.noop) {
			
			// Overload
			if ($.isFunction(buttons)) {
				
				callback = buttons;
				buttons = ['OK', 'CANCEL'];
				
			}
			
			// Use Utility.popup to execute the callback on the Showcase 'disable' event
			api.on('disable', callback, Utility.popup);
			
			$(elems.confirm.replace('{message}', message)
				.replace('{confirm}', buttons[0])
				.replace('{cancel}', buttons[1]))
				.find('button:first-child')
				.on(`click.${ns.event}`, () => { Utility.popup(callback, true); })
				.siblings('button')
				.on(`click.${ns.event}`, () => { Utility.popup(callback, false); })
				.end()
				.end()
				.showcase({
					width: Utility.getPopupWidth(message),
					cloneData: true,
				});
			
			return this;
			
		}
		
		/**
		 * Display a prompt Popup
		 * @param {string} message The message to display
		 * @param {string?} button The text for the prompt confirmation button
		 * @param {string?|jQuery?} input The input, textarea, or select element html string, or a jQuery element object
		 * @param {Prompt?} callback The callback to execute after the prompt is complete
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Display a prompt Popup
		 * @param {string} message The message to display
		 * @param {Prompt?} callback The callback to execute after the prompt is complete
		 * @return {Object} The global Showcase object
		 */
		/**
		 * Callback for prompt Popup
		 * The this keyword refers to the global Showcase object
		 * @callback Prompt
		 * @param {string|string[]|bool} response The trimmed string, or array of strings, from the user input,
		 *  or null if Showcase was closed
		 */
		prompt (message, button = 'OK', input = elems.prompt, callback = $.noop) {
			
			// Overload
			if ($.isFunction(button)) {
				
				callback = button;
				button = 'OK';
				input = elems.prompt;
				
			}
			
			// Use Utility.popup to execute the callback on the Showcase 'disable' event
			api.on('disable', callback, Utility.popup);
			
			const popup = $(elems.alert.replace('{message}', message).replace('{button}', button));
			
			popup.children('button')
				.on(`click.${ns.event}`, () => { Utility.popup(callback, Utility.getPopupValue()); })
				.before(input)
				.end()
				.showcase({
					width: Utility.getPopupWidth(message),
					cloneData: true,
				});
			
			return this;
			
		}
		
	}
	
	// Create Showcase instance and API reference when the DOM is ready
	$(() => {
		
		inst = new Instance();
		api = global.Showcase;
		
	});
	
	// Return the API methods for the global namespace
	return new API();
	
})(jQuery, window);
