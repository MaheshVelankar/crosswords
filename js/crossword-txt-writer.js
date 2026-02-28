(function( $ ) {
  $.fn.cwtxtwriter = function( options ) {
    var thisBox = null,
      thisTF = null,
      es = false,
      deveditselection = null,
      range = null,
      s1 = '',
      s2 = '',
      s3 = '',
      selStart = 0,
      selEnd = 0,
      romstring = '',
      devstring = '',
      udevstring = '',
      devlen = 0,
      tip = null,
      editmode = 'dev',
      lastEvent = '',
      Crossword = options.Crossword,
      splitRe = /ॐ|[ऄ-औॠॡॲ-ॷꣾ][ऀ-ं]*|(ऱ?‍?्)?([क-हक़-फ़य़-ॿ][◌़]?[◌्](‍|‌)?)*[ऄ-औॠॡॲ-ॷꣾक-हक़-फ़य़-ॿ][◌़]?([◌्]|[ऺऻा-ौॎॏ]?[ऀ-ं]*)/gu;

    var lastWhich;


    const cwSegmenter = new Intl.Segmenter("mr-IN", { granularity: "grapheme" });

    var getLetters = function(string) {
      var segments = cwSegmenter.segment(string);
      if (!segments) {
        return [];
      }
      var segArr = Array.from(segments);
      var segmentStrings = Array.from(segments).map(segmentObj => segmentObj.segment);
      return segmentStrings;
    };

    $('body').append(tip);

    var tipid = 'mano_romtip';
    if ($('#'+tipid).length<1) {
      var thetip = $('<div id="'+tipid+'" style="background-color:#FFFF00; position:absolute; left:0px; top:0px; "></div>');
      $('body').append(thetip);
    }
    tip = $('#'+tipid);

    var label = $("label[for='"+$(this).attr('id')+"']");
    //$('<span><input checked="true" name="imeMode" type="radio">dev<input name="imeMode" type="radio">rom</span>').appendTo(label);
    var radName = $(this).attr('id') + '-ime-mode';
    label.after($('<span><label><input checked name="' + radName + '" type="radio" value="dev" /> देवनागरी</label><label><input name="' + radName  + '" type="radio" value="rom" /> रोमन</label></span>'));

    $('input:radio[name="'+radName+'"]').change(function() {
        if ($(this).val() == 'dev') {
          editmode = 'dev';
        } else {
          editmode = 'rom';
        }
    });

  // returns the current selection object
  var _getSelection = function () {
    if (document.selection) {
      return document.selection;
    }
    else {
      return window.getSelection();
    }
  };

  // returns a range for the current selection
  var _createRange = function (sel) {
    if (sel.createRange) {
      return sel.createRange();
    }
    else {
      return document.createRange();
    }
  };

    var clearEditRanges = function () {
      romstring='';
      handleTipDisplay('');
      es = false;
      selStart = 0;
      selEnd = 0;
      s1 = '';
      s3 = '';
      lastEvent = '';
    };

    var handleTipDisplay = function ( str ) {
      if (str == '') {
        tip.html('');
        tip.hide();
        return;
      }
      else {
        tip.html(str);
        tip.show();
      }
    };

    var handleTipPos = function(){
        var o = thisBox.offset();
        var h = thisBox.height();

        bl = { left: o.left, top: o.top + h + 25};

        tip.get(0).style.left = bl.left + "px";
        tip.get(0).style.top = bl.top + "px";

        var tipo = tip.offset();
    };


    var blur = function(e) {
      //console.log('in blur of ' + thisBox.attr('id'));
      //console.log('id: ' + thisBox.attr('id') + ', lastEvent: ' + lastEvent);
      if (lastEvent === 'input') {
//        sendSquareExitEvent();
      }
      var activeSq = Crossword.activeSquare;
      e.target.value='';
      if (activeSq.hasError()) {
        activeSq['$square'].trigger('crossword-error');
      }
      lastEvent = 'blur';
      clearEditRanges();
    }

    var focus = function(e) {
        lastEvent = 'focus';
        clearEditRanges();
    }

    var focusout = function(e) {
      //console.log('in focusout of ' + thisBox.attr('id'));
        clearEditRanges();
    }

    var click = function(e) {
        lastEvent = 'click';
        clearEditRanges();
    };

    var keypress = function(e) {
        lastEvent = 'keypress';
      handleTipPos();

      if (e.which == 13 || e.which == 60 || e.which == 62 || e.which == 0) {
        clearEditRanges();
        //processInput();
        //sendSquareExitEvent();
        return;
      }

      if (e.which == 32) {
        clearEditRanges();
        return;
      }

      if (editmode != 'dev') {
        return;
      }

      if (!es) {
        //alert ('editset not set');
        var sel = _getSelection();
        deveditselection = _createRange (sel);
        es = true;
        range = deveditselection;
        var selLength = thisTF.value.length;
        selStart = thisTF.selectionStart;
        selEnd = thisTF.selectionEnd;
        s1 = (thisTF.value).substring(0,selStart);
        s3 = (thisTF.value).substring(selEnd, selLength);
        handleTipPos();
      }
      lastWhich = e.which;
      romstring += String.fromCharCode(e.which);
      processInput();
      e.preventDefault();
    };

    var keydown = function(e) {
        lastEvent = 'keydown';
      if (editmode != 'dev') {
        return;
      }

      if ( e.which == 8 ) {
        if ( romstring.length > 0 ) {
          romstring = romstring.substr(0,romstring.length-1);
          processInput();
          e.preventDefault();
        }
        else {
          clearEditRanges();
          processInput();
        }
        return;
      }
      if (e.which >= 44 && e.which <= 111) {
        return;
      }
      //clearEditRanges();
    };

    var prime = function (e, data) {
      //console.log('in prime');
      romstring = String.fromCharCode(data.value);
      processInput();
      es = true;
    };

    var processInput = function () {
      devstring = $.fn.getDevString(romstring);
      //console.log('romstring', romstring, 'devstring', devstring);
      devlen = devstring.length;
      s2 = devstring;
      thisTF.value = s1 + s2 + s3;
      thisTF.setSelectionRange ( selStart + devlen, selStart + devlen );
      handleTipDisplay(romstring);
      sendInputEvent();
    };

    var sendInputEvent = function() {
      //var letters = thisTF.value.match(splitRe);
      var letters = getLetters( thisTF.value);
      var letter_count = letters?letters.length:0;

      //console.log('tfValue:' + thisTF.value);
      if (letter_count>0) {
        //console.log( 'letters: ' + letters);
      } else {
        //console.log( 'letters: _no_letters_');
      }

      thisTF.value = letter_count>0?letters[0]:'';

      const customData = {
        next_value: letter_count>1?lastWhich:0,
        complete: letter_count<1?true:letter_count>1?true:false,
        source: 'manual dispatch'
      };

      const inputEvent = new CustomEvent('input', {
        detail: customData,
        bubbles: true, // Set to true if the event should bubble up the DOM tree
        cancelable: true // Set to true if the event can be canceled
      });
      lastEvent = 'input';
      thisTF.dispatchEvent(inputEvent);
    };

    var sendSquareExitEvent = function() {
      const squareExitEvent = new CustomEvent('square-exit', {});
      lastEvent = 'square-exit';
      thisTF.dispatchEvent(squareExitEvent);
    };


    this.each(function() {
        thisBox = $(this);
        thisBox.on('click', click);
        thisBox.on('focus', focus);
        //thisBox.on('focusout', focusout);
        thisBox.on('blur', blur);
        thisBox.on('keypress', keypress);
        thisBox.on('keydown', keydown);
        thisBox.on('prime', prime);
        thisTF = thisBox.get(0);
    });
  };
}( jQuery ));
