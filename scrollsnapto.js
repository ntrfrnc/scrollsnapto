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

/*! ScrollSnapTo.js by Rafael Pawlos | http://git.rafaelpawlos.com/scrollsnapto | MIT license */

(function ($, document, window, Object) {

  var pluginName = 'scrollsnapto';
  var storageName = 'plugin_' + pluginName;

  var pluginObject = {

    init: function (opts, elements) {
      var self = this;
      
      self.opts = opts;
      self.elements = elements;
      self.scrollTopContainer = $(/AppleWebKit/.test(navigator.userAgent) ? "body" : "html");
      
      self.getScrollTopOnStart();

      self.onWindowScrollStop(function (direction) {
        self.snapTo(elements, direction);
      }, opts.delay);
    },
    
    onWindowScrollStop: function (callback, delay) {
      var self = this;
              
      self.onScrollbar('mouseup', function(){
        if(self.scrollTopContainer.scrollTop() < self.scrollTopOnStart){
          callback('up');
        }
        else if(self.scrollTopContainer.scrollTop() > self.scrollTopOnStart){
          callback('down');
        }
      });

      $(window).on('mousewheel DOMMouseScroll', function (e) {
        self.scrollTopContainer.stop(true);
        clearTimeout(self.wheelScrollTimer);
        self.wheelScrollTimer = setTimeout(function () {

          if (e.originalEvent.wheelDelta >= 0 || e.originalEvent.detail < 0) {
            callback('up');
          }
          else {
            callback('down');
          }

        }, delay+50);
      });

      $(window).on('resize', function (e) {
        clearTimeout(self.resizeTimer);
        self.resizeTimer = setTimeout(function () {
          callback('both');
        }, delay + 300);
      });

      $('body').on('mouseup', function (e) {
        if (e.button === 1) {
          if(self.scrollTopContainer.scrollTop() < self.scrollTopOnStart){
            callback('up');
          }
          else if(self.scrollTopContainer.scrollTop() > self.scrollTopOnStart){
            callback('down');
          }
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
      
      $(document).on('touchend', function (e) {
        self.kineticScroll = false;

        $(window).on('scroll.scrollsnapto.touch', function (e) {
          clearTimeout(self.scrollTimer);
          self.kineticScroll = true;
          self.scrollTimer = setTimeout(function () {
            if (self.scrollTopContainer.scrollTop() < self.scrollTopOnStart) {
              callback('up');
            }
            else if (self.scrollTopContainer.scrollTop() > self.scrollTopOnStart) {
              callback('down');
            }
            $(window).off('scroll.scrollsnapto.touch');
          }, delay+100);
        });

        setTimeout(function () {
          if (!self.kineticScroll) {
            if (self.scrollTopContainer.scrollTop() !== self.scrollTopOnStart) {
              callback('both');
            }
            $(window).off('scroll.scrollsnapto.touch');
          }
        }, delay+100);
      });
      
      $(document).on('touchstart touchmove', function (e) {
        self.scrollTopContainer.stop(true);
      });
    },
    
    getScrollTopOnStart: function(){
      var self = this;
      
      $(window).one('scroll touchstart', function(){
        self.scrollTopOnStart = self.scrollTopContainer.scrollTop();
      });
    },
    
    onScrollbar: function (event, callback) {
      var self = this;

      $('body').on(event, function () {
        self.onContentEvent = true;
        setTimeout(function () {
          self.onContentEvent = false;
        }, 10);
      });
      $(window).on(event, function () {
        if (self.onContentEvent) {
          return;
        }
        callback();
      });
    },
    
    scrollToCenter: function (wrapperCenterOffset) {
      var self = this;
      
      self.scrollTopContainer.stop(true).animate(
        {scrollTop: wrapperCenterOffset - self.windowHalfHeight},
        self.opts.speed,
        self.opts.ease,
        function(){
          self.getScrollTopOnStart();
          self.opts.onSnapEnd();
        }
      );    
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
      self.windowHalfHeight = $(window).height() / 2;
      var windowCenterOffset = $(window).scrollTop() + self.windowHalfHeight;
    
      var extracted = Object.keys(elements).map(function (key) {
        var wrapperCenterOffset = self.getAbsoluteOffsetTop(elements[key]) + elements[key].offsetHeight / 2;
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
            self.scrollToCenter(extracted[0].wrapperCenterOffset);
            self.switchActive(extracted[0].key);
            return true;
          }
          else if (extracted[1].distanceFromCenter < 0) {
            self.scrollToCenter(extracted[1].wrapperCenterOffset);
            self.switchActive(extracted[1].key);
            return true;
          }
          else if (extracted[2].distanceFromCenter < 0) {
            self.scrollToCenter(extracted[2].wrapperCenterOffset);
            self.switchActive(extracted[2].key);
            return true;
          }
          break;

        case 'down':
          if (extracted[0].distanceFromCenter > 0.5) {
            self.scrollToCenter(extracted[0].wrapperCenterOffset);
            self.switchActive(extracted[0].key);
            return true;
          }
          else if (extracted[1].distanceFromCenter > 0) {
            self.scrollToCenter(extracted[1].wrapperCenterOffset);
            self.switchActive(extracted[1].key);
            return true;
          }
          else if (extracted[2].distanceFromCenter > 0) {
            self.scrollToCenter(extracted[2].wrapperCenterOffset);
            self.switchActive(extracted[2].key);
            return true;
          }
          break;

        case 'both':
          self.scrollToCenter(extracted[0].wrapperCenterOffset);
          self.switchActive(extracted[0].key);
          return true;
      }
    },
    
    getAbsoluteOffsetTop: function (element) {
      var posY = element.offsetTop;
      while (element.offsetParent) {
        if (element == document.getElementsByTagName('body')[0]) {
          break
        }
        else {
          posY = posY + element.offsetParent.offsetTop;
          element = element.offsetParent;
        }
      }
      return posY;
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
}(jQuery, document, window, Object));
