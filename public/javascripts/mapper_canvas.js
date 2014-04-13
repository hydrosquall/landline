(function() {
  // MapCanvas puts default collections of maps together for you
  // Requires jQuery and Raphael
  var MapCanvas = this.MapperCanvas = function(container, locality, opts) {
    this.paper     = {};
    this.events    = {};
    this.attrs     = {};
    var opts       = (opts || {});
    // make map auto-resize by default.
    var resize     = true;
    resize         = (resize || opts.resize);
    this.locality  = locality;
    this.container = $(container);
    this.container.height(this.container.width() * 0.70);  
    this.setupHtml();
    console.log(opts.resize);

    var that = this;
    if (opts.resize) {
      $(window).resize(_.debounce(function() {
        that.container.height(that.container.width() * 0.70);
        that.container.empty();
        that.setupHtml();
        that.createMap();
      }, 500));
    }
  };

  MapCanvas.CONTAINERS = {
    "continental" : {el : "mappercanvas_continental"},
    "alaska"      : {el : "mappercanvas_alaska"},
    "hawaii"      : {el : "mappercanvas_hawaii"}
  };

  MapCanvas.prototype.on = function(evt, cb) {
    this.events[evt] = cb;
  };

  MapCanvas.prototype.style = function(fips, key, val) {
    this.attrs[fips] = (this.attrs[fips] || []);
    this.attrs[fips].push([key, val]);
  };

  MapCanvas.prototype.setupHtml = function() {
    var containers = MapCanvas.CONTAINERS;
    containers["continental"] = _.extend(containers["continental"], {
      width  : this.container.width(),
      height : this.container.height() * 0.85,
      top    : "0%",
      left   : 0.0
    });

    containers["alaska"] = _.extend(containers["alaska"], {
      width  : this.container.width() * 0.25,
      height : this.container.height() * 0.27,
      top    : "63%",
      left   : 0.0
    });

    containers["hawaii"] = _.extend(containers["hawaii"], {
      width : this.container.width() * 0.15,
      height : this.container.height() * 0.21,
      top : "70%",
      left : 0.25
    });

    for (container in containers) {
      this.container.append("<div id='" + containers[container].el + "'></div>");
      $("#" + containers[container].el)
        .css("top", containers[container].top)
        // calculate how many pixels left the % is, 
        // so Hawaii doesn't move around when the window is resized
        .css("margin-left", this.container.width() * containers[container].left)
        .css("position", "absolute");
      this.paper[container] = Raphael(containers[container].el, containers[container].width, containers[container].height);

    }
  };

  MapCanvas.prototype.createMap = function() {
    var data;
    var that       = this;
    var containers = MapCanvas.CONTAINERS;
    if (this.locality === "states")   data = window.MapperStates;
    if (this.locality === "counties") data = window.MapperCounties;
    for (container in containers) {
      var localityMap = new Mapper(data[container]).all();
      localityMap.asSVG(containers[container].width, containers[container].height, function(svg, it) {
        var path = that.paper[container].path(svg);
        var fips = it.fips = it.get("c") ? it.get("s") + it.get("c") : it.get("s");
          path.attr("fill", "#cecece")
              .attr('stroke-width', 0.5)
              .attr('stroke', '#999999')
              .attr('stroke-linejoin', 'bevel');
          if (that.attrs[fips]) {
            _(that.attrs[fips]).each(function(attr) {
              path.attr(attr[0], attr[1])
            });
          }
          _(that.events).each(function(func, evt) {
            path[evt](function(e) {
              func(e, path, it);
            });
          });
      });
    }
  };
}).call(this);