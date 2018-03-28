# jQuery Showcase

The jQuery Showcase Plugin allows HTML data to be displayed in a modal window. The plugin attempts to intelligently guess the type of content that will be displayed by looking for images, links, AJAX content, and other general HTML content.
>Requires jQuery 1.7+

## Important

The CSS box-sizing property can cause issues with the sizing of the content used in the Showcase window. It's advisable to set the property to 'border-box' for the main element that is used in the Showcase.

## Example

We need the stylesheet, jQuery, and the Showcase plugin. Then we can select the images with jQuery and initiate the Showcase plugin, which will display the first image in the collection.

```html
<head>
<link rel="stylesheet" href="https://github.com/AdventCoding/Showcase/blob/master/css/showcase_white.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://github.com/AdventCoding/Showcase/blob/master/jquery.showcase.js"></script>
</head>
<body>
<img src="/images/image1.jpg" width="200" alt="Image1...">
<img src="/images/image2.jps" width="200" alt="Image2...">
<script>$('img').showcase();</script>
</body>
```

## API

To initialize the Showcase, call the method on a jQuery collection:

```js
$('selector').showcase(options, callback);
```
 - options : The options for the Showcase instance
 - callback : A callback function that is called when the Showcase content is loaded. The 'this' keyword in the callback function points to the window.Showcase object that contains the methods described in this Readme.
----------
To control the Showcase after it has been initialized, call a method on the global Showcase object:

```js
Showcase.disable();
```

### Options

| Key | Description | Default |
| :---: | --- | :---: |
| overlayClose | If the Overlay click event should close the Showcase | true |
| animate | Allows the Main Div to animate its position and dimensions | true |
| width | Sizes the Showcase to the specified width (can be 'auto') | 400 |
| height | Sizes the Showcase to the specified height (can be 'auto') | 300 |
| navigateElements | The jQuery selector or collection to use if navigation is needed | null |
| scaleContent | Scales some Showcase content, such as images, if the dimensions exceed the Window dimensions | false |
| hoverControls | Shows/Hides the Showcase Controls on the hover event | false |
| showLoader | If the animated loading image should be displayed while content is loading | true |
| cloneData | If data and events should be cloned for the Showcase element (does not apply for &lt;a&gt; or &lt;img&gt; elements) | true |
| infoContent | The content for the Info Bar; see the infoContent Option below | null |
| imageRegExp | The RegExp used to check for image content, since an &lt;img&gt; tag is needed | See Below |
| titles | The titles for the Showcase Overlay, Close, Left Nav Arrow, and Right Nav Arrow | See Below |
>imageRegExp Default: /\.bmp|\.gif|\.jpe|\.jpeg|\.jpg|
\.png|\.svg|\.tif|\.tiff|\.wbmp$/
>titles Default: { overlay: 'Click to Close', close: 'Close', leftNav: 'Navigate Left', rightNav: 'Navigate Right' }

>infoContent Option: The Showcase plugin uses the Info Bar to display information about the content within the Showcase window. By setting a string of plain text or HTML in the infoContent option, the Info Bar will display that data. Alternatively, each element used with the jQuery showcase method can contain the 'showcaseInfo' property, either set with the jQuery data method or inline (e.g &lt;img data-showcaseInfo="Image Description"&gt;).

### Methods & Properties

These methods and properties are accessed from the Showcase instance on the window object (e.g. window.Showcase.ready), or from within a callback sent to the jQuery plugin call (e.g. this.disable()). To initiate the showcase plugin on a jQuery collection, see the example above. All methods, except for .content(), will return the global Showcase object.

### .ready

If the Showcase Plugin is ready to be called.

### .enabled

If the Showcase is currently enabled.

### .content()

Retrieves the Showcase content container (#jqShowcaseContent) as a jQuery Object.

### .enable(callback, hideMain)

Displays the Showcase and enables the controls. This method will leave all the Showcase content intact.
 - callback : A callback function that executes after the Showcase is finished loading
 - hideMain : If the Main Div should not be displayed (useful for the callback function)

### .disable(callback)

Hides the Showcase and disables the controls. This method will leave all the Showcase content intact.
 - callback : A callback function that executes after the Showcase is finished unloading

### .resize(width, height, callback, animate, showMain)

Resizes the Showcase window.
 - width : The new width to set or animate to
 - height : The new height to set or animate to
 - callback : A callback function that executes after the Showcase is finished resizing
 - animate : If the Showcase should animate to the new dimensions
 - showMain : If the Showcase needs to be displayed (useful for the callback function)

### .navigate(direction)

Navigates between the Showcase elements.
Note: In order to navigate through different elements, the navigateElements option must be set to a jQuery selector string or a jQuery collection object.
 - direction : The reverse '<' or forward '>' direction

### .on(event, data, handler)

Adds an event listener to the Showcase.
 - event : 'enable', 'disable', 'resize', or 'navigate'
 - data : Optional data to be passed to the handler
 - handler : A handler for the event trigger / Receives The jQuery.Event object, and the data passed in the .on() Showcase method call

### .off(event, handler)

Removes an event listener from the Showcase.
 - event : 'enable', 'disable', 'resize', or 'navigate'
 - handler : The handler that was passed in the .on() Showcase method call, if removing a specific handler

## License

[MIT](https://github.com/AdventCoding/jQShowcase/blob/master/LICENSE)
