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
        renderCrossword (data);
        console.log( "$ JSON Data received, name is " + data.name);
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

function renderCrossword (data) {
    var $cwBox = $('#cw-box');
    var tableMarkup = [];
    tableMarkup.push('<table>');
    tableMarkup.push('<caption>');
    tableMarkup.push('test cw');
    tableMarkup.push('</caption>');
    tableMarkup.push('</table>');

    console.log('rowscount', data.puzzle.grid.length);
    var rowsCount = data.puzzle.grid.length;
    for (var i=0; i < rowsCount; i++) {
        var row = data.puzzle.grid[i];
        var colsCount = row.length;
        console.log('row', i, 'colcount', colsCount);
    }

    $cwBox.append($(tableMarkup.join('')));

}
