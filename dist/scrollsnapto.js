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
      self.ffAndroidDelayFix = /Android/.test(navigator.userAgent) && /Firefox/.test(navigator.userAgent) ? 300 : 70;

      self.getScrollTopOnStart();

      self.onWindowScrollStop(function (direction) {
        self.snapTo(elements, direction);
      }, opts.delay);
    },
    
    onWindowScrollStop: function (callback, delay) {
      var self = this;

      self.onScrollbarMouseUp(function () {
        var direction = self.getScrollDirection();
        callback(direction);
      });

      $(window).on('mousewheel DOMMouseScroll', function (e) {
        self.scrollTopContainer.stop(true);
        clearTimeout(self.wheelScrollTimer);
        self.wheelScrollTimer = setTimeout(function () {

          if (e.originalEvent.wheelDelta >= 0 || e.originalEvent.detail < 0) {
            var direction = 'up';
          }
          else {
            var direction = 'down';
          }
          
          callback(direction);

        }, delay + 50);
      });

      $(window).on('resize', function (e) {
        clearTimeout(self.resizeTimer);
        self.resizeTimer = setTimeout(function () {
          callback('both');
        }, delay + 300);
      });

      $(document).on('mouseup', function (e) {
        if (e.which === 2 || e.button === 4) {
          var direction = self.getScrollDirection();
          callback(direction);
        }
      });

      $(document).on('keyup', function (e) {
        if (e.keyCode === 38) {
          callback('up');
        }
        else if (e.keyCode === 40) {
          callback('down');
        }
      });

      $(document).on('touchend', function (e) {
        self.kineticScroll = false;

        $(window).on('scroll.scrollsnapto.touch', function (e) {
          clearTimeout(self.scrollTimer);
          self.kineticScroll = true;
          self.scrollTimer = setTimeout(function () {
            var direction = self.getScrollDirection();
            callback(direction);
            $(window).off('scroll.scrollsnapto.touch');
          }, delay + self.ffAndroidDelayFix);
        });

        setTimeout(function () {
          if (!self.kineticScroll) {
            var direction = self.getScrollDirection();
            callback(direction);
          }
          $(window).off('scroll.scrollsnapto.touch');
        }, delay + self.ffAndroidDelayFix);
      });

      $(document).on('touchstart touchmove', function (e) {
        self.scrollTopContainer.stop(true);
      });
    },
    
    getScrollDirection: function () {
      var self = this;
      
      if (self.scrollTopContainer.scrollTop() < self.scrollTopOnStart) {
        return 'up';
      }
      else if (self.scrollTopContainer.scrollTop() > self.scrollTopOnStart) {
        return 'down';
      }
    },
    
    getScrollTopOnStart: function () {
      var self = this;

      $(window).one('scroll touchstart', function () {
        self.scrollTopOnStart = self.scrollTopContainer.scrollTop();
      });
    },
    
    onScrollbarMouseUp: function (callback) {
      var self = this;

      $('body').on('mouseup', function () {
        self.onContentEvent = true;
        setTimeout(function () {
          self.onContentEvent = false;
        }, 10);
      });
      $(window).on('mouseup', function (e) {
        if (!self.onContentEvent) {
          callback();
        }
      });

      if (/Trident/.test(navigator.userAgent)) {
        $('body').on('mousedown', function () {
          self.onContentEvent = true;
          setTimeout(function () {
            self.onContentEvent = false;
          }, 10);
        });
        $(window).on('mousedown', function (e) {
          if (!self.onContentEvent) {
            $(window).on('scroll', function (e) {
              clearTimeout(self.scrollTimer);
              self.scrollTimer = setTimeout(function () {
                callback();
                $(window).off('scroll');
              }, 50);
            });
          }
        });
      }
    },
    
    scrollToElement: function (extractedEl) {
      var self = this;

      self.switchActive(extractedEl);
      var scrollTo = extractedEl.biggerThanViewport ? extractedEl.offsetCenter - self.elements[extractedEl.key].offsetHeight / 2 : extractedEl.offsetCenter - self.windowHalfHeight;
      self.scrollTopContainer.stop(true).animate(
              {scrollTop: scrollTo},
              self.opts.speed,
              self.opts.ease,
              function () {
                self.getScrollTopOnStart();
                self.opts.onSnapEnd();
              }
      );
    },
    
    switchActive: function (extractedEl) {
      var self = this;

      if (self.active) {
        $(self.active).removeClass('sst-active');
      }
      $(self.elements[extractedEl.key]).addClass('sst-active');
      self.active = self.elements[extractedEl.key];
    },
    
    snapTo: function (elements, direction) {
      var self = this;

      self.windowHalfHeight = window.innerHeight / 2;
      self.windowCenterOffset = window.pageYOffset + self.windowHalfHeight;

      var extracted = Object.keys(elements).map(function (key) {
        var biggerThanViewport = (elements[key].offsetHeight > self.windowHalfHeight * 2);
        var offsetTop = self.findOffsetTop(elements[key]);
        var offsetCenter = offsetTop + elements[key].offsetHeight / 2;
        var distanceFromCenter = (biggerThanViewport) ? offsetTop + (window.innerHeight / 2) - self.windowCenterOffset : offsetCenter - self.windowCenterOffset;
        var distanceFromCenterAbs = Math.abs(distanceFromCenter);
        var rObj = {
          key: key,
          biggerThanViewport: biggerThanViewport,
          distanceFromCenter: distanceFromCenter,
          distanceFromCenterAbs: distanceFromCenterAbs,
          offsetCenter: offsetCenter,
          offsetTop: offsetTop
        };
        return rObj;
      });

      extracted.sort(function (a, b) {
        if (!isFinite(a.distanceFromCenterAbs - b.distanceFromCenterAbs)) {
          return !isFinite(a.distanceFromCenterAbs) ? 1 : -1;
        } else {
          return a.distanceFromCenterAbs - b.distanceFromCenterAbs;
        }
      });

      switch (direction) {
        case 'up':
          for (var i = 0; i < 3; i++) {
            if (extracted[i].distanceFromCenter < -0.5 && (window.pageYOffset - extracted[i].offsetTop < window.innerHeight || !extracted[i].biggerThanViewport)) {
              self.scrollToElement(extracted[i]);
              return true;
            }
          }
          break;

        case 'down':
          var windowBottomEdge = window.pageYOffset + window.innerHeight;
          for (var i = 0; i < 3; i++) {
            if (extracted[i].distanceFromCenter > 0.5 && (extracted[i].offsetTop - windowBottomEdge < 0)) {
              self.scrollToElement(extracted[i]);
              return true;
            }
          }
          break;

        case 'both':
          self.scrollToElement(extracted[0]);
          return true;
      }
    },
    
    findOffsetTop: function (element) {
      var posY = element.offsetTop;
      while (element.offsetParent) {
        if (element === document.getElementsByTagName('body')[0]) {
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
      onSnapEnd: function () {
      }
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

// Create objects in older browsers
if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    function F() {
    }
    F.prototype = obj;
    return new F();
  };
}