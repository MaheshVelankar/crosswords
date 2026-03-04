(function ($, Drupal, once, drupalSettings) {
    Drupal.behaviors.vkbd = {
        attach: function (context, settings) {
            Drupal.vkbd = {};
            var selector = drupalSettings.vkbd.container_selector;
            console.log('found one keyboard site');
            Drupal.vkbd.keyCenter = 3; //center the row if keys less than this
            Drupal.vkbd.layout = [
                [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], ['Bksp', 'Bksp']],
                [['Tab', 'Tab'], ['q', 'Q'], ['w', 'W'], ['e', 'E'], ['r', 'R'], ['t', 'T'], ['y', 'Y'], ['u', 'U'], ['i', 'I'], ['o', 'O'], ['p', 'P'], ['[', '{'], [']', '}'], ['\\', '|']],
                [['Caps', 'Caps'], ['a', 'A'], ['s', 'S'], ['d', 'D'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['j', 'J'], ['k', 'K'], ['l', 'L'], [';', ':'], ['\'', '"'], ['Enter', 'Enter']],
                [['Shift', 'Shift'], ['z', 'Z'], ['x', 'X'], ['c', 'C'], ['v', 'V'], ['b', 'B'], ['n', 'N'], ['m', 'M'], [',', '<'], ['.', '>'], ['/', '?'], ['Shift', 'Shift']],
                [[' ', ' ']]
            ];

            var tableMarkup = [];
            var tableClasses = [];
            tableClasses.push(`keyboardInputSize${drupalSettings.vkbd.size}`);
            tableMarkup.push(`<table id="keyboardInputMaster" class="${tableClasses.join(' ')}">`);

            tableMarkup.push('<caption>');
            tableMarkup.push('test cw');
            tableMarkup.push('</caption>');

            tableMarkup.push(`<tbody>`);
            tableMarkup.push(`<tr>`);
            tableMarkup.push(`<td>`);
            tableMarkup.push(`<div class="keyframe">`);
            tableMarkup.push(`</div>`);
            tableMarkup.push(`</td>`);
            tableMarkup.push(`</tr>`);
            tableMarkup.push(`</tbody>`);
            tableMarkup.push(`</table>`);
            $(selector).append($(tableMarkup.join('')));
            once('keyboard', selector);
            Drupal.vkbd.keyboard = $(`#keyboardInputMaster`);
            console.log('kbd id', Drupal.vkbd.keyboard.attr('id'));

            //add keys
            var keyContainer = Drupal.vkbd.keyboard.find('div.keyframe').first();
            for (let x = 0, lyt; lyt = Drupal.vkbd.layout[x++];) {
                tableMarkup = [];
                tableClasses = [];
                if (lyt.length <= Drupal.vkbd.keyCenter) tableClasses.push('keyboardInputCenter');
                var tableClassAttr = tableClasses.length >0? `class="${tableClasses.join(' ')}`:'';
                tableMarkup.push(`<table ${tableClassAttr}>`);
                tableMarkup.push(`<tbody>`);
                tableMarkup.push(`<tr>`);
                for (let y = 0, lkey; lkey = lyt[y++];) {
                    console.log(lkey[0], lkey[1]);
                    var tdClasses = [];
                    if (lyt.length > Drupal.vkbd.keyCenter && y == lyt.length) tdClasses.push('last');
                    var tdClassAttr = tdClasses.length >0? `class="${tdClasses.join(' ')}""`:'';
                    tableMarkup.push(`<td ${tdClassAttr}>`);
                    tableMarkup.push(lkey[0] || '\xa0');
                    console.log('pushed', lkey[0], 'tdclass', tdClassAttr);
                    tableMarkup.push(`</td>`);
                }
                tableMarkup.push(`</tr>`);
                tableMarkup.push(`</tbody>`);
                tableMarkup.push(`</table>`);
                keyContainer.append($(tableMarkup.join('')));
                console.log('-------');
            }
        }
    }
})(jQuery, Drupal, once, drupalSettings);
console.log('vkbd.js loaded');



