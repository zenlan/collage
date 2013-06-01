// Object.create support test, and fallback for browsers without it
if ( typeof Object.create !== "function" ) {
  Object.create = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
  };
}
if (typeof($.plugin) == 'undefined') {
  // Create a plugin based on a defined object
  $.plugin = function( name, object ) {
    $.fn[name] = function( options ) {
      return this.each(function() {
        if ( ! $.data( this, name ) ) {
          $.data( this, name, Object.create(object).init( options, this ) );
        }
      });
    };
  };
}

var zenlanCollage = {

  default_vars : {
    name : 'default',
    offset : 0,
    limit : 20,
    ajaxBusy : false,
    recentIndex : 'collage:history',
    gaEvents : true,
    prefixCaption : false,
    excludeNoPreview : false
  },
  default_elems : {
    btnSearch : 'btn-search',
    btnScrap : 'btn-scrapbook',
    btnReset : 'btn-reset',
    btnShuffle : 'btn-shuffle',
    wait : 'wait',
    results : 'results-list',
    query : 'query',
    recent : 'recent'
  },

  log : function(msg) {
    console.log(msg);
  },

  init : function ( options, elem ) {
    var base = this;
    base.options = $.extend( {}, base.default_vars, options );
    base.elems = {};
    $.each(base.default_elems, function(key, value) {
      base.elems[key] = $(document.getElementById(value));
    });
    if ($(elem).hasClass('isotope')) {
      base.elems['results'] = $(elem);
    }
    base.recent = base.getRecentQueries();
    return base;
  },

  getOptions : function () {
    return this.options;
  },

  getOption : function (name) {
    if (this.options.hasOwnProperty(name)) {
      return this.options[name];
    }
    return false;
  },

  setOption : function (name, value) {
    if (this.options.hasOwnProperty(name)) {
      this.options[name] = value;
      return true;
    }
    return false;
  },

  getElem : function (name) {
    if (this.elems.hasOwnProperty(name)) {
      return this.elems[name];
    }
    return false;
  },

  setAjaxBusy : function (status) {
    this.setOption('ajaxBusy', status);
    if (status) {
      this.elems.wait.show();
    }
    else {
      this.elems.wait.hide(1000);
    }
  },

  roomForMore : function () {
    if ($(document).height() <= $(window).height()) {
      return true;
    }
    return false;
  },

  unquote : function (string) {
    var a = string.charCodeAt(0);
    var z = string.charCodeAt(string.length-1);
    if (a == 34 && z == 34) {
      return string.replace(/\x22/g,'');
    }
    else if (a == 39 && z == 39) {
      return string.replace(/\x27/g,'');
    }
    return false;
  },

  handleHash : function (hash) {
    if (hash === false){
      document.location.hash = '';
      return false;
    }
    if (hash !== undefined) {
      document.location.hash = hash;
      return false;
    }
    hash = document.location.hash.substr(1);
    var quoted = this.unquote(hash);
    if (quoted) {
      hash = quoted;
    }
    var qry = this.sanitizeText(hash);
    if (qry !== '') {
      if (qry == 'close') {
        document.location.hash = '';
        this.hideObject();
      }
      else {
        if (quoted) {
          qry = '"' + qry + '"';
        }
        this.elems.query.val(qry);
        this.elems.btnSearch.click();
      }
    }
    else {
      document.location.hash = '';
    }
    return false;
  },

  sanitizeText : function (string) {
    var result = string;
    var tmp1 = $(result).text();
    if (tmp1 != '') {
      result = tmp1;
    }
    var tmp2 = html_sanitize(result);
    if (tmp2 != '') {
      result = tmp2;
    }
    return result;
  },

  hideObject : function () {
    this.elems.object.css('display', 'none');
  },

  initInfiniteScroll : function () {
    var previousScroll = 0;
    var currentScroll = 0;
    var base = this;
    $(window).scroll(function(data) {
      currentScroll = $(this).scrollTop();
      if (currentScroll > previousScroll){
        if (base.getOption('offset')>1) {
          base.search();
        }
      }
      previousScroll = currentScroll;
    });
  },

  resetComponents : function () {
    this.setAjaxBusy(false);
    this.elems.query.val('');
    this.handleHash(false);
    this.setOption('offset', 1);
    this.resetIsotope(this.elems.results);
  },

  /* ISOTOPE FUNCTIONS */

  initIsotope : function ($container) {
    $container.isotope({
      itemSelector : '.iso',
      layoutMode: 'masonry',
      masonry: {
        columnWidth : 20
      }
    });
  },

  resetIsotope : function ($container) {
    $container.empty();
    $container.isotope('destroy');
    this.initIsotope($container);
  },

  shuffleIsotope : function () {
    this.elems.results.isotope('shuffle');
  },

  /* STORAGE FUNCTIONS */

  getRecentQueries : function () {
    var recentQueries = [];
    if(typeof(Storage)!=='undefined') {
      var item = localStorage.getItem(this.options.recentIndex);
      if (item !== null) {
        recentQueries = JSON.parse(item);
      }
    }
    return recentQueries;
  },

  saveQuery : function (query) {
    var base = this;
    if (query == '') {
      return;
    }
    if(typeof(Storage) !== 'undefined') {
      if ($.inArray(query, base.recent) == -1) {
        if (base.recent.length == 10) {
          base.recent.shift();
        }
        base.recent.push(query);
        localStorage.setItem(base.options.recentIndex, JSON.stringify(base.recent));
      }
    }
  },

  buildRecentQueriesDatalist : function (selected) {
    var base = this;
    base.elems.recent.empty();
    $.each(base.recent, function(i,item) {
      base.elems.recent.append('<option value="' + item + '"/>');
    });
  },

  buildResultList : function (data) {
    var base = this;
    if ($.isArray(data) && data.length > 0) {
      var id, img, title;
      var items = [], elem;
      $.each(data, function(i,item){
        id = base.getItemID(item);
        img = base.getImage(item);
        title = html_sanitize(base.getCaption(item));
        if (img.length > 0) {
          elem = '<li class="iso ' + id
          + '" id="' + id
          + '" data-number="' + i
          + '" data-toggle="tooltip"'
          + '" data-placement="bottom">'
          + '<img src="' + img + '" title="' + title + '"/>'
          + '</li>';
          items.push(elem);
        }
      });
      var $items = $(items.join(''));
      $items.imagesLoaded(function(){
        $items.each(function(){
          $(this).click(function(){
            base.handleImageClick(this);
          });
        });
        base.elems.results.isotope('remove', $('#message'));
        base.elems.results.isotope('insert', $items );
        base.setNewOffset();
        base.setAjaxBusy(false);
        if (base.roomForMore() == true) {
          base.search();
        }
      });
    }
    else {
      base.setAjaxBusy(false);
      base.showMessage('You have reached the end of the ' + base.getOption('labelShort') + ' stream');
    }
  },

  showMessage : function (text) {
    this.log(text);
    var elem = '<li class="iso message">' + text + '</li>';
    this.elems.results.isotope('insert', $(elem) );

  },

  trackEventSearch : function () {
    if (this.options.gaEvents == true) {
      _gaq.push([
        '_trackEvent',document.URL,'search',this.elems.query.val()
        ]);
    }
  },

  executeAjaxSearch : function (url) {
    var base = this;
    if (base.getOption('ajaxBusy') == false) {
      base.setAjaxBusy(true);
      base.log(url);
      var ajax = $.ajax ({
        url: url,
        type: 'GET',
        dataType: 'jsonp',
        contentType: 'application/json',
        timeout: 10000,
        cache: false
      });
      ajax.done(function (response, textStatus, jqXHR){
        base.handleSearchResults(response);
      });
      ajax.fail(function (jqXHR, textStatus, errorThrown){
        base.setAjaxBusy(false);
        if (jqXHR.statusCode() > 200) {
          base.log('request failed: ' + errorThrown.message);
        }
        else if (errorThrown == 'timeout') {
          base.log('Request timed out');
        }
      });
    }
  },

  newQuery : function (allowEmpty, wildcard) {
    var base = this;
    var qry = $.trim(base.elems.query.val());
    if (!allowEmpty && qry == '') {
      if (wildcard !== 'undefined') {
        qry = '*';
      }
      base.handleHash(false);
    }
    else {
      base.handleHash(qry);
      base.saveQuery(qry);
      base.buildRecentQueriesDatalist(qry);
    }
    return qry;
  },

   setNewOffset : function () {
    this.setOption('offset',parseInt(this.getOption('limit')) + parseInt(this.getOption('offset')));
  },

  initialise : function() {

    var base = this;
    base.elems.wait.progressbar({
      value: false
    });
    base.initIsotope(base.elems.results);
    base.buildRecentQueriesDatalist();
    base.initInfiniteScroll();
    base.elems.btnReset.click(function(){
      base.resetEverything();
    });
    base.elems.btnShuffle.click(function(){
      base.shuffleIsotope();
    });
    base.elems.btnSearch.click(function(){
      base.trackEventSearch();
      base.search();
    });
    base.handleHash();
    base.elems.query.autocomplete({
      create: function( event, ui ) {
        base.elems.query.autocomplete( 'option', 'source', base.recent);
      }
    });
  }
}