# jQuery Showcase

The jQuery Showcase Plugin makes it easy to display content in a modal window. The plugin attempts to intelligently guess the type of content that will be displayed by looking for images, media, links, or other general HTML content.
>Requires jQuery 3.0+

>Important This Plugin uses features that are not supported by any Internet Explorer version.

## Example

See the example.html file for more details.
>[Codepen Example](https://codepen.io/adventcoding/full/OZZQMq/)

## API

We can call the Showcase plugin on any jQuery object. See the example.html file for more information.

```js
$('selector').showcase();
// OR
$('selector').showcase(callback);
// OR
$('selector').showcase(options, callback);
```
 - options : The options for the Showcase instance
 - callback : A callback function to execute on completion. The 'this' keyword in the callback function refers to the window.Showcase object.
----------
To control the Showcase, call one of the methods on the global Showcase object:

```js
Showcase.disable();
```

### Options

| Key | Description | Default |
| :---: | --- | :---: |
| width | The numerical width for the Showcase or 'auto' | 'auto' |
| height | The height for the Showcase or 'auto' | 'auto' |
| currentIndex | The current index if showcasing a jQuery collection | 0 |
| infoContent | The html string or jQuery object to place in the info box (See note below) | null |
| scaleMedia | Allows &lt;img&gt; and &lt;video&gt; to scale based on aspect ratio | true |
| animate | If the Showcase elements should animate in | true |
| fade | If the Showcase elements should fade in and out | true |
| cloneData | If data and events should be copied from the element to the Showcase clone | false |
| imageRegExp | The image RegExp used to check for image content | (See imageRegExp variable below) |
| controlText | The title texts for the nav elements | (See controlText variable below) |
| promise | The Promise to fulfill before loading the content | null |

```js
let imageRegExp = /\.bmp|\.gif|\.jpe|\.jpeg|\.jpg|\.png|\.svg|\.tif|\.tiff|\.wbmp$/;
let controlText = {
  close: 'Close',
  navLeft: 'Navigate Left',
  navRight: 'Navigate Right',
},
```
>infoContent Option: The Showcase plugin uses the Info Box to display information about the content within the Showcase window. By using a string of plain text or HTML, or a jQuery object, in the infoContent option, the Info Box will display that data. Alternatively, each element used with the jQuery showcase method can contain the 'showcaseInfo' property, either set with the jQuery data method or inline (e.g &lt;img data-showcase-info="Image Description"&gt;).

### Methods & Properties

These methods and properties are accessed from the Showcase instance on the window object (e.g. window.Showcase.container), or from within a callback (e.g. this.disable()). All methods will return the global Showcase object.

### .busy

If the Showcase Plugin is busy loading content.

### .error

Get the current Showcase error if there is one.

### .container

Get the Showcase Container jQuery object.

### .content

Get the current Showcase content jQuery object.

### .enable(callback)

Enable the Showcase if disabled. This method will leave all the Showcase content intact.
 - callback : A callback function to execute after the Showcase is loaded

### .disable(callback)

Disable the Showcase if enabled.
 - callback : A callback function to execute after the Showcase is loaded

### .resize(width, height, animate, callback)

Resize the main Showcase content area.
 - width : The width to resize to
 - height : The height to resize to
 - animate : If the content should animate to new size
 - callback : The callback to execute after the resize

### .navigate(direction)

Navigate to the next or previous Showcase element.
 - direction : 'left' or 'right'

### .on(event, handler)
### .on(event, data, handler)

Add an event listener to the Showcase.
 - event : 'enable', 'disable', 'resize', 'navigate', or 'error'
 - data : Optional data to be passed to the handler
 - handler : A handler for the event trigger
>The handler receives the jQuery.Event object with the .data property that contains the data argument that was passed in the Showcase.on() method call

### .off(event, handler)

Remove an event listener from the Showcase
 - event : 'enable', 'disable', 'resize', or 'navigate' (omit to clear all events)
 - handler : The handler used in the Showcase.on method call (omit to clear all handlers)

### .alert(message, callback)
### .alert(message, button, callback)

Display an alert Popup
 - message : The message to display
 - button : The text for the alert button (null to disable)
 - callback : The callback to execute after the alert is dismissed
 >The callback receives true if the button was clicked, or false if the Showcase was closed

### .confirm(message, callback)
### .confirm(message, buttons, callback)

Display a confirmation Popup
 - message : The message to display
 - buttons : The array of texts for the confirm and cancel buttons
 - callback : The callback to execute after confirmation or cancellation
 >The callback receives true if the confirm button was clicked, or false if the cancel button was clicked or the Showcase was closed

### .prompt(message, callback)
### .prompt(message, button, input, callback)

Display a prompt Popup
 - message : The message to display
 - button : The text for the prompt confirmation button
 - input : The input, textarea, or select element html string, or a jQuery element object for the user input
 - callback : The callback to execute after the prompt is complete
 >The callback receives the trimmed string, or array of trimmed strings for multiple inputs, from the user input, or false if the Showcase was closed

## License

[MIT](https://github.com/AdventCoding/Showcase/blob/master/LICENSE)
