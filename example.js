jQuery(document).ready(function($) {

  $.plugin('zccVam', zenlanCollage);
  var obj = {};
  $(obj).zccVam({
    name: "zccVam",
    labelLong: "Victoria & Albert Museum",
    labelShort: "V&A",
    offset : 0,
    limit : $('#limit').text(),
    prefixCaption : $('#prefixcaption').text(),
    excludeNoPreview : $('#excludenopreview').text(),
    gaEvents : false
  });
  var zccVam = $(obj).data('zccVam');

  zccVam.resetEverything = function() {
    this.resetComponents();
    this.setOption('offset', 0);
  }
  zccVam.getURL = function (item) {
    var url = '';
    if (item.hasOwnProperty('id')) {
      var id = item.id.replace(/_/g, '/');
      url = 'http://collections.vam.ac.uk/item/' + id;
    }
    return url;
  }
  zccVam.getItemID = function (item) {
    var id;
    if (item.hasOwnProperty('fields')) {
      id = item.fields.object_number + '_' + item.fields.slug;
    }
    return id;
  }
  zccVam.getImage = function (item) {
    var url = '';
    if (item.hasOwnProperty('fields')) {
      var suffix = '_jpg_' + (window.innerWidth<600?'s':(window.innerWidth>900?'ws':'o')) + '.jpg';
      url = 'http://media.vam.ac.uk/media/thira/collection_images/' + item.fields.primary_image_id.substr(0,6) + '/' + item.fields.primary_image_id + suffix;
    }
    if ((url == '') && (!this.getOption('excludeNoPreview'))) {
      url = 'placeholder.png';
    }
    return url;
  }
  zccVam.getCaption = function (item) {
    var title = '', prefix = '';
    if (this.getOption('prefixCaption')) {
      prefix = '(V&A) ';
    }
    if (item.hasOwnProperty('fields')) {
      if (item.fields.hasOwnProperty('title') && item.fields.title !== '') {
        title = item.fields.title;
      }
      else if (item.fields.hasOwnProperty('object')) {
        title = item.fields.object;
      }
      title = prefix + title;
    }
    return title;
  }
  zccVam.handleSearchResults = function (data) {
    var docs = [];
    if (data.hasOwnProperty('records')) {
      docs = data.records;
    }
    this.buildResultList(docs);
  }
  zccVam.setNewOffset = function () {
    this.setOption('offset',parseInt(this.getOption('limit')) + parseInt(this.getOption('offset')));
  }
  zccVam.search = function () {
    var qry = this.newQuery(true);
    var url = 'http://www.vam.ac.uk/api/json/museumobject/search'
    + '?images=1'
    + '&limit=' + this.getOption('limit')
    + '&offset=' + this.getOption('offset')
    + '&q=' + qry;
    this.executeAjaxSearch(url);
  }
  zccVam.initialise();

  zccVam.handleImageClick = function(elem) {
    var url = this.getURL(elem);
    var win=window.open(url, '_blank');
  }

});