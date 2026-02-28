window.drupalSettings = {
    "crossword" : {
        "selector": ".crossword",
        "data": {}
    }
};
window.Drupal = { behaviors: {}, locale: {} };
//var once = function(){};

(function ($, Drupal, once, drupalSettings) {
    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);
    var node = searchParams.get("cw");

    if (node === null || node == '') {
        console.error('query param cw not found');
        node = '_no_data_';
    }

    const cwFile = 'data/' + node + '.json';

    $.getJSON(cwFile)
        .done(function(data) {
            // Success: data is the parsed JSON object
            drupalSettings.crossword.data = data;
            Drupal.behaviors.crossword.attach();
            //console.log("Success:", data);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // Error: this function is called if the request fails
            console.error("Error:", textStatus, errorThrown);
            console.log("Response Text:", jqXHR.responseText); // Contains the raw response text
        })
        .always(function() {
            // This function will always run, regardless of success or failure
            console.log("Request complete.");
        });

})(jQuery, Drupal, once, drupalSettings);
