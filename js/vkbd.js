(function ($, Drupal, once, drupalSettings) {
    Drupal.behaviors.vkbd = {
        attach: function (context, settings) {
            var selector = settings.vkbd.container_id;
            var kbdContElems = once('keyboard', `#${selector}`);
            Drupal.vkboard = new Drupal.vkbd(
                kbdContElems[0],
                settings.vkbd,
            );
        },
        battach: function (context, settings) {
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
                var tableClassAttr = tableClasses.length >0? `class="${tableClasses.join(' ')}"`:'';
                tableMarkup.push(`<table ${tableClassAttr}>`);
                tableMarkup.push(`<tbody>`);
                tableMarkup.push(`<tr>`);
                for (let y = 0, lkey; lkey = lyt[y++];) {
                    var tdClasses = [];
                    if (lyt.length > Drupal.vkbd.keyCenter && y == lyt.length) tdClasses.push('last');
                    if (lkey[0] == ' ' || lkey[1] == ' ') tdClasses.push('space');
                    var tdClassAttr = tdClasses.length >0? `class="${tdClasses.join(' ')}"`:'';
                    tableMarkup.push(`<td ${tdClassAttr}>`);
                    tableMarkup.push(lkey[0] || '\xa0');
                    tableMarkup.push(`</td>`);
                    //console.log('pushed', `<td ${tdClassAttr}>`);
                    //console.log('pushed <'+ lkey[0] + '>');
                    //console.log('pushed', `</td>` );
                }
                tableMarkup.push(`</tr>`);
                tableMarkup.push(`</tbody>`);
                tableMarkup.push(`</table>`);
                keyContainer.append($(tableMarkup.join('')));
            }
        }
    };
    Drupal.vkbd = function (kbdContElem, vkbdSettings){
        const self = this;
        const $kbdContainer = $(kbdContElem);

        this.target = null;
        this.keyClicked = '';

        this.keyCenter = 5; //center the row if keys less than this
        this.layout = [
            [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], ['Bksp', 'Bksp']],
            [['Tab', 'Tab'], ['q', 'Q'], ['w', 'W'], ['e', 'E'], ['r', 'R'], ['t', 'T'], ['y', 'Y'], ['u', 'U'], ['i', 'I'], ['o', 'O'], ['p', 'P'], ['[', '{'], [']', '}'], ['\\', '|']],
            [['Caps', 'Caps'], ['a', 'A'], ['s', 'S'], ['d', 'D'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['j', 'J'], ['k', 'K'], ['l', 'L'], [';', ':'], ['\'', '"'], ['Enter', 'Enter']],
            [['Shift', 'Shift'], ['z', 'Z'], ['x', 'X'], ['c', 'C'], ['v', 'V'], ['b', 'B'], ['n', 'N'], ['m', 'M'], [',', '<'], ['.', '>'], ['/', '?'], ['Shift', 'Shift']],
            [[' ', ' ']]
        ];
        this.shift = this.shiftlock = false;

        this.setTarget = function(elem) {
            this.target = elem;
        };

        this.setKeyClicked = function (k) {
            self.keyClicked = k;
        };

        this.getKeyClicked = function () {
            return self.keyClicked;
        };

        this.keyClick = function(c) {
            let character = '\xa0';
            character = $(this).text();
            self.keyClicked = character;
            self.keyPublish(character);
            if (self.shift) self.modify('Shift');
            self.modify('');
        };
        this.keyPublish = function(text) {
            console.log('publish text ', text);
            var charCode = text=='\n'?13:text.charCodeAt(0);
/*
            var pressEvent = jQuery.Event("keypress", {
                keyCode: charCode, // For compatibility
                which: charCode    // jQuery normalizes to 'which' property
            });
            $(self.target).trigger(pressEvent);
*/
            //$(self.target).trigger('focus');

            let keyevent = charCode==13?$.Event('keydown'):$.Event('keypress');
            keyevent.which = charCode;
            if (charCode == 13) {
                // Create a new KeyboardEvent
                const customKeydownEvent = new KeyboardEvent('keydown', {
                    key: 'Enter', // Specify the key you want to simulate (e.g., 'Enter', 'ArrowRight', 'a')
                    code: 'Enter', // Use 'code' for the physical key
                    keyCode: 13, // keyCode is deprecated but useful for broader compatibility
                    bubbles: true, // Key events bubble up the DOM
                    cancelable: true // Event can be cancelled
                });

                // Dispatch the custom keydown event to the document
                document.dispatchEvent(customKeydownEvent);
                /*
                    document.body.focus();
                $(document).trigger(keyevent);
                */
            }else {
                $(self.target).trigger(keyevent);
            }
        };
        this.modify = function(type) {
            switch (type) {
                case 'Caps': this.shift = 0; this.shiftlock = !this.shiftlock; break;
                case 'Shift': this.shift = !this.shift;
            }
            let vchar = 0;
            if (!this.shift != !this.shiftlock) vchar += 1;
            //for (let t = this.keyboard.tBodies[0].getElementsByTagName('div')[0].getElementsByTagName('table'), x = 0, tds; x < t.length; x++)
            for (let t = this.keyboard.find('div.keyframe table'), x = 0, tds; x < t.length; x++) {
                tds = $(t[x]).find('td');
                for (let y = 0, lkey; y < tds.length; y++){
                    $(tds[y]).removeClass();
                    lkey = this.layout[x][y];
                    switch (lkey[1]) {
                        case 'Alt':
                        case 'Shift':
                            if (this.shift) $(tds[y]).addClass('pressed');
                            break;
                        case 'Caps':
                            if (this.shiftlock) $(tds[y]).addClass('pressed');
                            break;
                        case 'Enter': case 'Bksp': break;
                        default:
                            if (type) {
                                $(tds[y]).text(lkey[vchar] || '\xa0');
                            }
                    }
                    if (y == tds.length - 1 && tds.length > this.keyCenter) $(tds[y]).addClass('last');
                    if (lkey[0] == ' ' || lkey[1] == ' ') $(tds[y]).addClass('space');
                }
            }
        };
        this.prepareKbd = function () {
            var $table = $('<table/>', {
                "id": "keyboardInputMaster"
            }).appendTo($kbdContainer).addClass(`keyboardInputSize${vkbdSettings.size}`);
            $table.addClass(`tryout`);
            var $tbody = $('<tbody/>').appendTo($table);
            var $tr = $('<tr/>').appendTo($tbody);
            var $td = $('<td/>').appendTo($tr);
            var $keyFrameDiv = $('<div/>').appendTo($td).addClass('keyframe');
            //var $keyFrameDiv = $('<div/>').appendTo($td);
            return $table;
        };
        this.buildKeys = function () {
            this.shift = this.shiftlock = false;
            var $keyFrameDiv = this.keyboard.find('div.keyframe').first();
            //add keys
            for (let x = 0, lyt; lyt = this.layout[x++];){
                $table =$('<table/>').appendTo($keyFrameDiv);
                if (lyt.length <= this.keyCenter) $table.addClass('keyboardInputCenter');
                var $tbody = $('<tbody/>').appendTo($table);
                $tr = $('<tr/>').appendTo($tbody);
                for (let y = 0, lkey; lkey = lyt[y++];) {
                    $td = $('<td/>').appendTo($tr);
                    $td.addClass('vkbd_key');
                    if (lyt.length > this.keyCenter && y == lyt.length) $td.addClass('last');
                    if (lkey[0] == ' ' || lkey[1] == ' ') $td.addClass('space');
                    $td.text(lkey[0] || '\xa0');
                    $td.on('mousedown', function(e) {e.preventDefault();});
                    switch (lkey[1]) {
                        case 'Caps': case 'Shift':
                            $td.on('click', (function(type) {
                                return function() {
                                    self.modify(type);
                                    return false;
                                }
                            })(lkey[1]));
                            break;
                        case 'Enter':
                            $td.on('click', function () {
                                console.log('Enter clicked');
                                self.keyPublish("\n");
                                return true;
                            });
                            break;
                        default:
                            $td.on('click', self.keyClick);
                    }
                }
            }
        };

        self.keyboard = self.prepareKbd();
        self.buildKeys();
        $kbdContainer.addClass('keyboard_frame');
    };
})(jQuery, Drupal, once, drupalSettings);
console.log('vkbd.js loaded');



