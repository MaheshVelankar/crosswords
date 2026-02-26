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
    tableMarkup.push('<table class="crossword-grid">');
    tableMarkup.push('<caption>');
    tableMarkup.push('test cw');
    tableMarkup.push('</caption>');

    console.log('rowscount', data.puzzle.grid.length);
    var rowsCount = data.puzzle.grid.length;
    for (var i=0; i < rowsCount; i++) {
    tableMarkup.push('<tr class="crossword-row">');
        var row = data.puzzle.grid[i];
        var colsCount = row.length;
        console.log('row', i, 'colcount', colsCount);
        for (var j=0; j < colsCount; j++) {
            var col = row[j];
            var tdClasses = [];
            tdClasses.push('crossword-square');
            if (col.fill === null) {
                tdClasses.push('black');
            }
            tableMarkup.push(`<td class="${tdClasses.join(',')}">`);
            tableMarkup.push('a');
            tableMarkup.push('</td>');
        }
        tableMarkup.push('</tr>');
    }

    tableMarkup.push('</table>');

    $cwBox.append($(tableMarkup.join('')));

}
