'use strict';

// Create objects in older browsers
if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    function F() {
    }
    F.prototype = obj;
    return new F();
  };
}

/*! ScrollSnapTo.js by Rafael Pawlos | http://rafaelpawlos.com | MIT license */

(function ($, document, window, Promise, Object) {

  var pluginName = 'scrollsnapto';
  var storageName = 'plugin_' + pluginName;

  var pluginObject = {

    init: function (opts, elements) {
      var self = this;
      
      self.opts = opts;
      self.elements = elements;
      self.scrollTopContainer = $(/AppleWebKit/.test(navigator.userAgent) ? "body" : "html");

      self.onWindowScrollStop(function (direction) {
        self.snapTo(elements, direction);
      }, opts.delay);
    },
    
    onScrollbarEvent: function (event, callback, delay) {
      var self = this;
      
      var mouseupContent = new Promise(function (resolve, reject) {
        $('body').one(event, reject);
      });
      var mouseupWindow = new Promise(function (resolve, reject) {
        $(window).one(event, resolve);
      });
      Promise.race([mouseupWindow, mouseupContent]).then(function () {
        setTimeout(function () {
          callback('both');
          self.onScrollbarEvent(event, callback, delay);
        }, delay);
      }, function () {
        setTimeout(function () {
          self.onScrollbarEvent(event, callback, delay);
        }, delay);
      });
    },
    
    onWindowScrollStop: function (callback, delay) {
      var self = this;
      
      delay = typeof delay !== 'undefined' ? delay : 250;
      self.onScrollbarEvent('mouseup', callback, delay);

      $(window).on('mousewheel DOMMouseScroll', function (e) {
        self.scrollTopContainer.stop(true);
        clearTimeout($.data(window, "scrollCheck"));
        $.data(window, "scrollCheck", setTimeout(function () {

          if (e.originalEvent.wheelDelta >= 0 || e.originalEvent.detail < 0) {
            callback('up');
          }
          else {
            callback('down');
          }

        }, delay+50));
      });

      $(window).on('resize', function (e) {
        clearTimeout($.data(window, "resizeCheck"));
        $.data(window, "resizeCheck", setTimeout(function () {
          callback('both');
        }, delay + 300));
      });

      $('body').on('mouseup', function (e) {
        if (e.button === 1) {
          callback('both');
        }
      });
      
      $(document).on('keyup', function (e) {
        if (e.keyCode === 38) {
          callback('up');
        }
        else if(e.keyCode === 40){
          callback('down');
        }
      });
    },
    
    scrollToCenter: function (wrapperCenterOffset, windowHalfHeight) {
      var self = this;
      
      self.scrollTopContainer.stop(true).animate({scrollTop: wrapperCenterOffset - windowHalfHeight}, self.opts.speed, self.opts.ease, self.opts.onSnapEnd);
    },
    
    switchActive: function (key) {
      var self = this;
      
      if(self.active){
        $(self.active).removeClass('sst-active');  
      }
      $(self.elements[key]).addClass('sst-active');
      self.active = self.elements[key]; 
    },
    
    snapTo: function (elements, direction) {
      var self = this;

      var windowHalfHeight = $(window).height() / 2;
      var windowCenterOffset = $(window).scrollTop() + windowHalfHeight;
//      var elements = document.querySelectorAll(elQuery);
    
      var extracted = Object.keys(elements).map(function (key) {
        var wrapperCenterOffset = elements[key].offsetTop + elements[key].offsetHeight / 2;
        var distanceFromCenter = wrapperCenterOffset - windowCenterOffset;
        var distanceFromCenterAbs = Math.abs(distanceFromCenter);
        var rObj = {
          key: key,
          wrapperCenterOffset: wrapperCenterOffset,
          distanceFromCenter: distanceFromCenter,
          distanceFromCenterAbs: distanceFromCenterAbs
        };
        return rObj;
      });

      extracted.sort(function (a, b) {
        if (!isFinite(a.distanceFromCenterAbs - b.distanceFromCenterAbs)){
          return !isFinite(a.distanceFromCenterAbs) ? 1 : -1;
        }else{
          return a.distanceFromCenterAbs - b.distanceFromCenterAbs;
        }
      });

      switch (direction) {
        case 'up':
          if (extracted[0].distanceFromCenter < -0.5) {
            self.scrollToCenter(extracted[0].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[0].key);
            return false;
          }
          else if (extracted[1].distanceFromCenter < 0) {
            self.scrollToCenter(extracted[1].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[1].key);
            return false;
          }
          else if (extracted[2].distanceFromCenter < 0) {
            self.scrollToCenter(extracted[2].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[2].key);
            return false;
          }
          break;

        case 'down':
          if (extracted[0].distanceFromCenter > 0.5) {
            self.scrollToCenter(extracted[0].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[0].key);
            return false;
          }
          else if (extracted[1].distanceFromCenter > 0) {
            self.scrollToCenter(extracted[1].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[1].key);
            return false;
          }
          else if (extracted[2].distanceFromCenter > 0) {
            self.scrollToCenter(extracted[2].wrapperCenterOffset, windowHalfHeight);
            self.switchActive(extracted[2].key);
            return false;
          }
          break;

        case 'both':
          self.scrollToCenter(extracted[0].wrapperCenterOffset, windowHalfHeight);
          self.switchActive(extracted[0].key);
          return false;
      }
    }
  };
  
  $.fn[pluginName] = function (options) {
    var opts = $.extend(true, {
      speed: 400,
      ease: 'swing',
      delay: 20,
      onSnapEnd: function(){}
    }, options);

    var pluginInstance = $.data(window, storageName);
    if (!pluginInstance) {
      pluginInstance = Object.create(pluginObject).init(opts, this);
      $.data(this, storageName, pluginInstance);
    } else {
      $.error('Plugin is already initialized.');
      return;
    }

    return this;
  };
}(jQuery, document, window, Promise, Object));