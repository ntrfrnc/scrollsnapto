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
      self.activeKey = '0';
      
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
    
    scrollToElement: function (extractedEl) {
      var self = this;
      
      var scrollTo = extractedEl.biggerThanViewport ? extractedEl.offsetCenter - self.elements[extractedEl.key].offsetHeight / 2 : extractedEl.offsetCenter - self.windowHalfHeight;
      self.scrollTopContainer.stop(true).animate(
        {scrollTop: scrollTo},
        self.opts.speed,
        self.opts.ease,
        function(){
          self.getScrollTopOnStart();
          self.opts.onSnapEnd();
        }
      );    
    },
    
    switchActive: function (extractedEl) {
      var self = this;
      
      if(self.active){
        $(self.active).removeClass('sst-active');  
      }
      $(self.elements[extractedEl.key]).addClass('sst-active');
      self.activeKey = extractedEl.key;
      self.activeBiggerThanViewport = extractedEl.biggerThanViewport;
      self.active = self.elements[extractedEl.key]; 
    },
    
    snapTo: function (elements, direction) {
      var self = this;

      self.windowHalfHeight = window.innerHeight / 2;
      self.windowCenterOffset = window.scrollY + self.windowHalfHeight;

      var extracted = Object.keys(elements).map(function (key) {
        var biggerThanViewport = (elements[key].offsetHeight > self.windowHalfHeight * 2) ? true : false;
        var offsetCenter = self.findOffsetTop(elements[key]) + elements[key].offsetHeight / 2;
        var distanceFromCenter = (biggerThanViewport) ? elements[key].offsetTop + self.windowHalfHeight - self.windowCenterOffset : offsetCenter - self.windowCenterOffset;
        var distanceFromCenterAbs = Math.abs(distanceFromCenter);

        var rObj = {
          key: key,
          biggerThanViewport: biggerThanViewport,
          distanceFromCenter: distanceFromCenter,
          distanceFromCenterAbs: distanceFromCenterAbs,
          offsetCenter: offsetCenter,
          offsetTop: elements[key].offsetTop,
          offsetBottom: elements[key].offsetTop + elements[key].offsetHeight
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
          console.log(window.scrollY - extracted[0].offsetTop);
          console.log(window.scrollY - extracted[1].offsetTop);
          console.log(window.scrollY - extracted[2].offsetTop);

          if (extracted[0].distanceFromCenter < -0.5 && !(extracted[0].biggerThanViewport && extracted[0].key === self.activeKey) && (window.scrollY - extracted[0].offsetTop < self.opts.offsetForBiggersThanViewport || !extracted[0].biggerThanViewport)) {
            self.scrollToElement(extracted[0]);
            self.switchActive(extracted[0]);
            console.log(1);
            return true;
          }
          else if (extracted[1].distanceFromCenter < 0  && (window.scrollY - extracted[1].offsetTop < self.opts.offsetForBiggersThanViewport || !extracted[1].biggerThanViewport)) {
            self.scrollToElement(extracted[1]);
            self.switchActive(extracted[1]);
            console.log(2);
            return true;
          }
          else if (extracted[2].distanceFromCenter < 0 && (window.scrollY - extracted[2].offsetTop < self.opts.offsetForBiggersThanViewport || !extracted[2].biggerThanViewport)) {
            self.scrollToElement(extracted[2]);
            self.switchActive(extracted[2]);
            console.log(3);
            return true;
          }
          break;

        case 'down':
          console.log(extracted[0].offsetBottom - window.scrollY+window.innerHeight);
                    console.log(extracted[1].offsetBottom - window.scrollY+window.innerHeight);
                              console.log(extracted[2].offsetBottom - window.scrollY+window.innerHeight);
          if (extracted[0].distanceFromCenter > 0.5 && !(extracted[0].biggerThanViewport && extracted[0].key === self.activeKey) && (extracted[0].offsetBottom - window.scrollY+window.innerHeight < self.opts.offsetForBiggersThanViewport || (!self.activeBiggerThanViewport && extracted[0].biggerThanViewport) || (!self.activeBiggerThanViewport && extracted[0].biggerThanViewport))) {
            self.scrollToElement(extracted[0]);
            self.switchActive(extracted[0]);
              
            return true;
          }
          else if (extracted[1].distanceFromCenter > 0 && !(extracted[1].biggerThanViewport && extracted[1].key === self.activeKey)  && (extracted[1].offsetBottom - window.scrollY+window.innerHeight < self.opts.offsetForBiggersThanViewport || (!self.activeBiggerThanViewport && extracted[1].biggerThanViewport) || (!self.activeBiggerThanViewport && !extracted[1].biggerThanViewport))) {
            self.scrollToElement(extracted[1]);
            self.switchActive(extracted[1]);
            return true;
          }
          else if (extracted[2].distanceFromCenter > 0 && !(extracted[2].biggerThanViewport && extracted[2].key === self.activeKey) && (extracted[2].offsetBottom - window.scrollY+window.innerHeight < self.opts.offsetForBiggersThanViewport || (!self.activeBiggerThanViewport && extracted[2].biggerThanViewport) || (!self.activeBiggerThanViewport && !extracted[2].biggerThanViewport))) {
            self.scrollToElement(extracted[2]);
            self.switchActive(extracted[2]);
            return true;
          }
          break;

        case 'both':
          self.scrollToElement(extracted[0]);
          self.switchActive(extracted[0]);
          return true;
      }
    },
    
    findOffsetTop: function (element) {
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
      careAboutBiggersThanViewport : true,
      offsetForBiggersThanViewport : 0,
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
