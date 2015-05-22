ScrollSnapTo
===================================


Project Overview
----------------

jQuery plugin to make snap to elements effect on scroll.  
**Version:** 0.2.0-alpha  
**Dependencies:** jQuery ≥ 1.7  
**Support:** Latest Mozilla Firefox, Google Chrome and IE9+.   

[SEE DEMO](http://rafaelpawlos.com/checkboxrange)

Usage:
----------------

Here's an example of basic usage:

    $('.elements-class').scrollsnapto(); 


Options:
----------------

Option       | Values                | Description
------------ | --------------------- | -----------
`speed:`     | `400`                 | // Animation speed; default: `400`
`ease:`      | `'swing' ⎮ 'linear' ` | // Choose animation easing; default: `'swing'`
`delay:`     | `20`                  | // Time to wait (listen to further scroll events) before calling snap (in ms); default: `20`
`onSnapEnd:` | `function () {}`      | // Callback apllied after snap


License
----------------

ScrollSnapTo is released under the terms of the MIT license. See LICENSE file for details.


Credits
----------------

ScrollSnapTo is developed by Rafael Pawlos, http://rafaelpawlos.com
