# jQuery Showcase

The jQuery Showcase Plugin allows HTML data to be displayed in a modal window. The plugin attempts to intelligently guess the type of content that will be displayed by looking for images, links, AJAX content, and other general HTML content.
>Requires jQuery 1.7+

## Example

We need the stylesheet, jQuery, and the Showcase plugin. Then we can select the images with jQuery and initiate the Showcase plugin, which will display the first image in the collection.

```html
<head>
<link rel="stylesheet" href="https://github.com/AdventCoding/jQShowcase/blob/master/css/showcase_white.css">
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.js"></script>
<script src="https://github.com/AdventCoding/jQShowcase/blob/master/jquery.showcase.js"></script>
</head>
<body>
<img src="https://images.unsplash.com/photo-1502630859934-b3b41d18206c?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=e044488fe252577b2788a6ded2b4c993&dpr=1&auto=format&fit=crop&w=1000&q=80&cs=tinysrgb" width="200" alt="San Francisco">
<img src="https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=53417780c9a34ffae5334a1d03b105a6&dpr=1&auto=format&fit=crop&w=1000&q=80&cs=tinysrgb" width="200" alt="Cafe">
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
// The Showcase API object is attached to the global window object
Showcase.disable();
```

### Options

|Key|Description|Default
|--|--|--|
|overlayClose|If the Overlay click event should close the Showcase|false
|--|--|--|
|animate|Allows the Main Div to animate its position and dimensions|true
|--|--|--|
|width|Sizes the Showcase to the specified width|400
|--|--|--|
|height|Sizes the Showcase to the specified height|300
|--|--|--|
|navigateElements|The jQuery selector or collection to use if navigation is needed|null
|--|--|--|
|scaleContent|Scales some Showcase content, such as images, if the dimensions exceed the Window dimensions|false
|--|--|--|
|hoverControls|Gives the Showcase Controls a hover effect|false
|--|--|--|
|infoContent|The content for the Info Bar; see the infoContent Option below|null
|--|--|--|
|imageRegExp|The RegExp used to check for image content, since an <img> tag is needed|See Below
>imageRegExp Default: /\.bmp|\.gif|\.jpe|\.jpeg|\.jpg|
\.png|\.svg|\.tif|\.tiff|\.wbmp$/
>infoContent Option: The Showcase plugin uses the Info Bar to display information about the content within the Showcase window. By setting a string of plain text or HTML in the infoContent option, the Info Bar will display that data. Alternatively, each element used with the jQuery showcase method can contain the 'showcaseInfo' property, either set with the jQuery data method or inline (e.g <img data-showcaseInfo="Image Description">).


### Methods

These methods are called from the Showcase instance on the window object, or from within a callback sent to the jQuery plugin call (e.g. this.enable()). To call the showcase plugin on a jQuery collection, see the example above.

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

## License

[MIT](https://github.com/AdventCoding/jQShowcase/blob/master/LICENSE)
