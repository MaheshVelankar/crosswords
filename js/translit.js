(function( $ ){

  $.fn.getDevString = function (inString) {
    return (
      inString.replace(/dhd/g, "ddh")
      .replace(/wd/g, "dv")
      .replace(/vd/g, "dv")
      .replace(/a\.c\.n/g, ".N")
      .replace(/a\.c/g, "E")
      .replace(/AUM/g, "ॐ")
      .replace(/A\.c/g, "O")
      .replace(/\.c/g, "E")
      .replace(/OM/g, "ॐ")
      .replace(/O\.n/g, "A.N")
      .replace(/dny/g, "jY")
      .replace(/\.N/g, "ँ")
      .replace(/\.l/g, " ̮")
      .replace(/\.g/g, " ̱")
        .replace(/\.h/g, "ZZ")
        .replace(/M/g, "ं")
        .replace(/\.n/g, "ं")
          .replace(/H/g, "ः")
            .replace(/A/g, "आ")
            .replace(/au/g, "औ")
            .replace(/aa/g, "आ")
            .replace(/ai/g, "ऐ")
            .replace(/a/g, "अ")
            .replace(/R\^i/g, "ऋ")
            .replace(/Ri/g, "ऋ")
            .replace(/ii/g, "ई")
            .replace(/L\^i/g, "ऌ")
            .replace(/i/g, "इ")
            .replace(/I/g, "ई")
            .replace(/ee/g, "ई")
            .replace(/uu/g, "ऊ")
            .replace(/Ru/g, "ऋ")
            .replace(/u/g, "उ")
            .replace(/U/g, "ऊ")
            .replace(/oo/g, "ऊ")
            .replace(/E/g, "ऍ")
            .replace(/e/g, "ए")
            .replace(/O/g, "ऑ")
            .replace(/o/g, "ओ")
            .replace(/kh/g, "ख्")
            .replace(/k/g, "क्")
            .replace(/gh/g, "घ्")
            .replace(/g/g, "ग्")
            .replace(/~N/g, "ङ्")
            .replace(/N\^/g, "ङ्")
            .replace(/chh/g, "छ्")
            .replace(/ch/g, "च्")
            .replace(/c/g, "च्")
            .replace(/jh/g, "झ्")
            .replace(/j/g, "ज्")
            .replace(/Y/g, "ञ्")
            .replace(/Th/g, "ठ्")
            .replace(/T/g, "ट्")
            .replace(/Dh/g, "ढ्")
            .replace(/D/g, "ड्")
            .replace(/N/g, "ण्")
            .replace(/th/g, "थ्")
            .replace(/t/g, "त्")
            .replace(/dh/g, "ध्")
            .replace(/d/g, "द्")
            .replace(/n/g, "न्")
            .replace(/ph/g, "फ्")
            .replace(/p/g, "प्")
            .replace(/bh/g, "भ्")
            .replace(/b/g, "ब्")
            .replace(/m/g, "म्")
            .replace(/y/g, "य्")
            .replace(/r/g, "र्")
            .replace(/R/g, "ऱ्")
            .replace(/l/g, "ल्")
            .replace(/L/g, "ळ्")
            .replace(/v/g, "व्")
            .replace(/w/g, "व्")
            .replace(/Sh/g, "ष्")
            .replace(/shh/g, "ष्")
            .replace(/sh/g, "श्")
            .replace(/s/g, "स्")
            .replace(/Kh/g, "ख़्")
            .replace(/qh/g, "ख़्")
            .replace(/h/g, "ह्")
            .replace(/x/g, "क्ष्")
            .replace(/q/g, "क़्")
            .replace(/G/g, "ग़्")
            .replace(/z/g, "ज़्")
            .replace(/\.Dh/g, "ढ़्")
            .replace(/\.D/g, "ड़्")
            .replace(/f/g, "फ़्")
            .replace(/R\^I/g, "ॠ")
            .replace(/\^I/g, "ॡ")
            .replace(/\^i/g, "ॢ")
              .replace(/\^I/g, "ॣ")
                .replace(/\|\|/g, "॥")
                .replace(/\|/g, "।")
                .replace(/0/g, "०")
                .replace(/1/g, "१")
                .replace(/2/g, "२")
                .replace(/3/g, "३")
                .replace(/4/g, "४")
                .replace(/5/g, "५")
                .replace(/6/g, "६")
                .replace(/7/g, "७")
                .replace(/8/g, "८")
                .replace(/9/g, "९")


                //second level trans
                .replace(/्अ/g, "")
                .replace(/्ं/g, "ं")
                  .replace(/्ः/g, "ः")
                    .replace(/्ँ/g, "ँ")

                      //third level trans

                      .replace(/्आ/g, "ा")
                        .replace(/्इ/g, "ि")
                          .replace(/्ई/g, "ी")
                            .replace(/्उ/g, "ु")
                              .replace(/्ऊ/g, "ू")
                                .replace(/्ऋ/g, "ृ")
                                  .replace(/्ऍ/g, "ॅ")
                                    .replace(/्ए/g, "े")
                                      .replace(/्ऐ/g, "ै")
                                        .replace(/्ऑ/g, "ॉ")
                                          .replace(/्ओ/g, "ो")
                                            .replace(/्औ/g, "ौ")

                                              .replace(/्$/g, "")
                                              .replace(/्$/g,"")
                .replace(/्([^Zक-हक़-य़])/g, "$1")
                                              .replace(/ZZ/g, "्")
                                                .replace(/््/g,"्")
                //unsupported yet
                .replace(/[BCFJKPQSVWXZ]/g, "")
                                                );
  };

  $.fn.createImeMenu = function () {
    //console.log('creating ime menu');
    if ($('#imemenu').length < 1) {
      var ih = [];
      ih.push('<div id="imemenu" style="background: #f2f2f2; position:absolute; left:0px; top:0px; ">');
      //ih.push('<label>Auto Correct:</label><input type="checkbox" id="ime_autocorrect"><br>');
      ih.push('<label>Mode:</label>');
      ih.push('<input id="imeModDev" checked="true" name="imeMode" type="radio">देवनागरी <input id="imeModRom" name="imeMode" type="radio">रोमन<br>');
      ih.push('<input id="imemenuok" type="button" value="Ok" />');
      ih.push('</div>');
      var imemenu = $(ih.join(''));
      $('body').append(imemenu);
    } $('#imemenu').hide();
  };

})( jQuery );
