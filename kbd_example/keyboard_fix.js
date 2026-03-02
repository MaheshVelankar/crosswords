/**
 * Virtual Keyboard Interface - v1.54
 *   Copyright (c) 2024 - GreyWyvern
 *
 * Add a script-driven keyboard interface to text fields, password
 * fields and textareas.
 *
 * See https://greywyvern.com/code/javascript/keyboard/ for examples
 * and usage instructions.
 *
 * Korean Jamo to Hangul input algorithm by VitaJane and Billy.
 *
 * - https://github.com/GreyWyvern/virtual-keyboard/
 */
var VKI_attach, VKI_close;

(function() {
    let self = this;

    this.VKI_showVersion = true; // Display the version number
    this.VKI_deadBox = true; // Show the dead keys checkbox
    this.VKI_deadkeysOn = false;  // Turn dead keys on by default
    this.VKI_numberPad = true;  // Allow user to open and close the number pad
    this.VKI_numberPadOn = false;  // Show number pad by default
    this.VKI_kts = this.VKI_kt = 'US Standard';  // Default keyboard layout
    this.VKI_langAdapt = true;  // Use lang attribute of input to pre-select keyboard
    this.VKI_size = 2;  // Default keyboard size (1-5)
    this.VKI_sizeAdj = true;  // Allow user to adjust keyboard size
    this.VKI_clearPasswords = false;  // Clear password fields on focus
    this.VKI_flashPassword = 1000; // Flash last character of password: 0 = disabled, > 0 = delay in ms
    this.VKI_imageURI = ''; //'keyboard.svg';  // If empty string, use imageless mode
    this.VKI_clickless = 0;  // 0 = disabled, > 0 = delay in ms
    this.VKI_activeTab = 0;  // Tab moves to next: 1 = element, 2 = keyboard enabled element
    this.VKI_enterSubmit = true;  // Submit forms when Enter is pressed
    this.VKI_keyCenter = 3; // If this many or fewer keys in a row, center the row
    this.VKI_move = true; // Allow user to move keyboard

    // Do not touch these
    this.VKI_version = '1.54';
    this.VKI_target = false;
    this.VKI_shift = this.VKI_shiftlock = false;
    this.VKI_altgr = this.VKI_altgrlock = false;
    this.VKI_dead = false;
    this.VKI_path = (new URL((document.currentScript ||
        document.querySelector('script[src*="keyboard.js"]')
    ).src)).pathname.replace(/\/[^\/]*$/, '/');


    /* ***** i18n text strings *************************************** */
    this.VKI_i18n = {
        '00': 'Display number pad',
        '01': 'Display virtual keyboard interface',
        '02': 'Select keyboard layout',
        '03': 'Dead keys',
        '04': 'On',
        '05': 'Off',
        '06': 'Close the keyboard',
        '07': 'Clear',
        '08': 'Clear this input',
        '09': 'Version',
        '10': 'Decrease keyboard size',
        '11': 'Increase keyboard size',
        '12': 'Backspace',
        '13': 'Korean complete button',
        '14': 'Move keyboard'
    };


    /* ***** Create keyboards **************************************** */
    this.VKI_layout = {};

    // - Lay out each keyboard in rows of sub-arrays. Each sub-array
    //   represents one key.
    //
    // - Each sub-array consists of four slots described as follows:
    //     example: ['a', 'A', '\u00e1', '\u00c1']
    //
    //          a) Normal character
    //          A) Character + Shift/Caps
    //     \u00e1) Character + Alt/AltGr/AltLk
    //     \u00c1) Character + Shift/Caps + Alt/AltGr/AltLk
    //
    //   You may include sub-arrays which are fewer than four slots.
    //   In these cases, the missing slots will be blanked when the
    //   corresponding modifier key (Shift or AltGr) is pressed.
    //
    // - If the second slot of a sub-array matches one of the following
    //   strings:
    //     'Tab', 'Caps', 'Shift', 'Enter', 'Bksp', 'Alt' OR 'AltGr',
    //     'AltLk', 'Complete'
    //   then the function of the key will be the following,
    //   respectively:
    //     - Insert a tab
    //     - Toggle Caps Lock (technically a Shift Lock)
    //     - Next entered character will be the shifted character
    //     - Insert a newline (textarea), or close the keyboard
    //     - Delete the previous character
    //     - Next entered character will be the alternate character
    //     - Toggle Alt/AltGr Lock
    //     - Finish the currently displayed Korean Hangul character
    //
    //   The first slot of this sub-array will be the text to display
    //   on the corresponding key. This allows for easy localisation
    //   of key names.
    //
    // - Layout dead keys (diacritic + letter) should be added as
    //   property/value pairs of objects with hash keys equal to the
    //   diacritic. See the 'this.VKI_deadkey' object below the layout
    //   definitions. In each property/value pair, the value is what
    //   the diacritic would change the property name to.
    //
    // - Note that any characters beyond the normal ASCII set should be
    //   entered in escaped Unicode format. (eg \u00a3 = Pound symbol)
    //   You can find Unicode values for characters here:
    //     https://unicode.org/charts/
    //
    // - To remove a keyboard, just delete it, or comment it out of the
    //   source code. If you decide to remove the US International
    //   keyboard layout, make sure you change the default layout
    //   (this.VKI_kt) above so it references an existing layout.
    //
    // - The 'lang' property determines what keyboard layouts will
    //   appear when 'this.VKI_langAdapt' is true. The script will go
    //   through the layouts in code order and display the first layout
    //   with a matching language string. eg. If two layouts have the
    //   same language code, the one listed *first* below will be the
    //   layout displayed.
    this.VKI_layout['US Standard'] = {
        'name': 'US Standard', 'keys': [
            [['`', '~'], ['1', '!'], ['2', '@'], ['3', '#'], ['4', '$'], ['5', '%'], ['6', '^'], ['7', '&'], ['8', '*'], ['9', '('], ['0', ')'], ['-', '_'], ['=', '+'], ['Bksp', 'Bksp']],
            [['Tab', 'Tab'], ['q', 'Q'], ['w', 'W'], ['e', 'E'], ['r', 'R'], ['t', 'T'], ['y', 'Y'], ['u', 'U'], ['i', 'I'], ['o', 'O'], ['p', 'P'], ['[', '{'], [']', '}'], ['\\', '|']],
            [['Caps', 'Caps'], ['a', 'A'], ['s', 'S'], ['d', 'D'], ['f', 'F'], ['g', 'G'], ['h', 'H'], ['j', 'J'], ['k', 'K'], ['l', 'L'], [';', ':'], ['\'', '"'], ['Enter', 'Enter']],
            [['Shift', 'Shift'], ['z', 'Z'], ['x', 'X'], ['c', 'C'], ['v', 'V'], ['b', 'B'], ['n', 'N'], ['m', 'M'], [',', '<'], ['.', '>'], ['/', '?'], ['Shift', 'Shift']],
            [[' ', ' ']]
        ], 'lang': ['en_US'] };

    /* ***** Define Dead Keys **************************************** */
    this.VKI_deadkey = {};

    // - Lay out each dead key set as an object of property/value
    //   pairs. The rows below are wrapped so uppercase letters are
    //   below their lowercase equivalents.
    //
    // - The property name is the letter pressed after the diacritic.
    //   The property value is the letter this key-combo will generate.
    //
    // - Note that if you have created a new keyboard layout and want
    //   it included in the distributed script, PLEASE TELL ME if you
    //   have added additional dead keys to the ones below.

    /* ***** Define Symbols ****************************************** */
    this.VKI_symbol = {
        '\u00a0': "NB\nSP", '\u200b': "ZW\nSP", '\u200c': "ZW\nNJ", '\u200d': "ZW\nJ"
    };


    /* ***** Layout Number Pad *************************************** */
    this.VKI_numpad = [
        [['$'], ['\u00a3'], ['\u20ac'], ['\u00a5']],
        [['7'], ['8'], ['9'], ['/']],
        [['4'], ['5'], ['6'], ['*']],
        [['1'], ['2'], ['3'], ['=']],
        [['0'], ['.'], ['+'], ['-']]
    ];

    /* ******************************************************************
     * Attach the keyboard to an element
     *
     */
    VKI_attach = function(elem) {
        if (elem.getAttribute('VKI_attached')) return false;
        if (self.VKI_imageURI) {
            let img = document.createElement('img');
            img.src = self.VKI_path + self.VKI_imageURI;
            img.alt = self.VKI_i18n['01'];
            img.classList.add('keyboardInputInitiator');
            img.title = self.VKI_i18n['01'];
            img.elem = elem;
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                self.VKI_show(this.elem);
            });
            elem.parentNode.insertBefore(img, (elem.dir == 'rtl') ? elem : elem.nextSibling);
        } else {
            elem.addEventListener('focus', function() {
                if (self.VKI_target != this) {
                    if (self.VKI_target) self.VKI_close();
                    self.VKI_show(this);
                }
            });
            elem.addEventListener('click', function() {
                if (!self.VKI_target) self.VKI_show(this);
            });
        }
        elem.setAttribute('VKI_attached', 'true');
        elem.setAttribute('VKI_type', elem.type);
        elem.setAttribute('inputmode', 'none');
        if (elem.classList.contains('keyboardInputNumbersOnly')) {
            elem.setAttribute('VKI_numpadInput', 'true');
            elem.min = elem.min ?? 0;
            elem.step = elem.step ?? 1;
        } else if (elem.type == 'number') {
            elem.setAttribute('VKI_numpadInput', 'true');
        } else elem.setAttribute('VKI_numpadInput', 'false');
        elem.addEventListener('click', function(e) {
            if (self.VKI_target == this) e.stopPropagation();
            return false;
        });
        if (self.VKI_flashPassword && elem.getAttribute('VKI_type') == 'password') {
            elem.setAttribute('autocomplete', 'new-password');
            elem.storeValue = elem.value;
            elem.timeout = false;
            elem.addEventListener('focus', function() {
                if (typeof this.timeout !== 'number')
                    this.storeValue = this.value;
            });
            elem.restorePassword = function() {
                if (typeof this.timeout === 'number') {
                    this.type = 'password';
                    this.value = this.storeValue;
                    clearTimeout(this.timeout);
                    this.timeout = false;
                }
            };
            if (elem.form) {
                elem.form.addEventListener('submit', function(e) {
                    elem.restorePassword();
                });
            }
            elem.addEventListener('beforeinput', function() {
                elem.restorePassword();
            });
            elem.addEventListener('input', function() {
                let selfPass = this;
                if (this.value.length == this.storeValue.length + 1) {
                    this.storeValue = this.value;
                    this.value = this.value.replace(/.(?!$)/g, '\u2022');
                    setTimeout(function() {
                        selfPass.type = 'text';
                        selfPass.setSelectionRange(selfPass.value.length, selfPass.value.length);
                    }, 0);
                    this.timeout = setTimeout(function() {
                        selfPass.type = 'password';
                        selfPass.value = selfPass.storeValue;
                        selfPass.timeout = false;
                    }, self.VKI_flashPassword);
                } else this.storeValue = this.value;
            });
        }
        if (elem.getAttribute('VKI_numpadInput') == 'true') {
            elem.type = (elem.getAttribute('VKI_type') == 'password') ? 'password' : 'text';
            elem.addEventListener('beforeinput', function() {
                if (this.getAttribute('VKI_type') != 'password')
                    this.storeValue = this.value;
            });
            elem.addEventListener('input', function() {
                if (!this.value.match(new RegExp(this.pattern)) ||
                    (this.max && parseFloat(this.value) > parseFloat(this.max)) ||
                    (this.min && parseFloat(this.value) < parseFloat(this.min)))
                    if (this.getAttribute('VKI_type') != 'password')
                    this.value = this.storeValue;
            });
        }
    };


    /* ******************************************************************
     * Common mouse event actions on character keys, mainly to do with
     * clickless input
     *
     */
    let VKI_mouseEvents = function(elem) {
        if (!elem.click) elem.click = function() {
            let evt = this.ownerDocument.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, this.ownerDocument.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            this.dispatchEvent(evt);
        };
        elem.VKI_clickless = 0;
        elem.addEventListener('dblclick', function() { return false; });
        elem.addEventListener('mouseover', function() {
            if (self.VKI_clickless) {
                let _self = this;
                clearTimeout(this.VKI_clickless);
                this.VKI_clickless = setTimeout(function() {
                    _self.click(); }, self.VKI_clickless);
            }
        });
        elem.addEventListener('mouseout', function() { clearTimeout(this.VKI_clickless); });
        elem.addEventListener('mousedown', function() { clearTimeout(this.VKI_clickless); });
        elem.addEventListener('mouseup', function() { clearTimeout(this.VKI_clickless); });
    };


    /* ******************************************************************
     * Private table cell attachment function for generic characters
     *
     */
    let VKI_keyClick = function() {
        let done = false, character = '\xa0';
        if (this.firstChild.nodeName.toLowerCase() != 'small') {
            if ((character = this.firstChild.nodeValue) == '\xa0') return false;
        } else character = this.firstChild.getAttribute('char');
        if (self.VKI_deadkeysOn.checked && self.VKI_dead) {
            if (self.VKI_dead != character) {
                if (character != ' ') {
                    if (self.VKI_deadkey[self.VKI_dead][character]) {
                        self.VKI_insert(self.VKI_deadkey[self.VKI_dead][character]);
                        done = true;
                    }
                } else {
                    self.VKI_insert(self.VKI_dead);
                    done = true;
                }
            } else done = true;
        }
        self.VKI_dead = false;

        if (!done) {
            if (self.VKI_deadkeysOn.checked && self.VKI_deadkey[character]) {
                self.VKI_dead = character;
                this.classList.add('dead');
                if (self.VKI_shift) self.VKI_modify('Shift');
                if (self.VKI_altgr) self.VKI_modify('AltGr');
            } else self.VKI_insert(character);
        }
        self.VKI_modify('');
        return false;
    };

    /* ***** Build the keyboard interface **************************** */
/*
    this.VKI_keyboard = document.createElement('table');
    this.VKI_keyboard.id = 'keyboardInputMaster';
    this.VKI_keyboard.dir = 'ltr';
    this.VKI_keyboard.cellSpacing = '0';
    this.VKI_keyboard.classList.add('keyboardInputSize' + this.VKI_size);
    this.VKI_keyboard.addEventListener('click', function(e) {
        e.stopPropagation();
        return false;
    });

    if (!this.VKI_layout[this.VKI_kt])
        return alert('No keyboard named "' + this.VKI_kt + '"');

    let thead = document.createElement('thead');
    let thtr = document.createElement('tr');
    let thth = document.createElement('th');
    thth.colSpan = '2';

    this.VKI_select = document.createElement('div');
    this.VKI_select.id = 'keyboardInputSelect';
    this.VKI_select.title = this.VKI_i18n['02'];
    this.VKI_select.sortType = 0;
    this.VKI_select.addEventListener('click', function() {
        let ol = this.getElementsByTagName('ol')[0];
        if (!ol.style.display || this.sortType < 2) {
            ol.style.display = 'block';
            let li = ol.getElementsByTagName('li'), scr = 0;
            [...li].sort((a, b) => {
                if (!this.sortType) {
                    return a.getAttribute('data-order') - b.getAttribute('data-order');
                } else return (a.title > b.title) ? 1 : -1;
            }).forEach(node => ol.appendChild(node));
            for (let x = 0; x < li.length; x++) {
                li[x].firstChild.nodeValue = (this.sortType) ? li[x].title : li[x].getAttribute('data-text');
                if (VKI_kt == li[x].getAttribute('data-text')) {
                    li[x].classList.add('selected');
                    scr = li[x].offsetTop - li[x].offsetHeight * 2;
                } else li[x].classList.remove('selected');
            }
            setTimeout(function() { ol.scrollTop = scr; }, 0);
            this.sortType++;
        } else {
            ol.style.display = '';
            this.sortType = 0;
        }
    });
    this.VKI_select.appendChild(document.createTextNode(this.VKI_kt));
    this.VKI_select.appendChild(document.createTextNode(' \u25be'));
    let order = 0, langs = 0, ol = document.createElement('ol');
    Object.keys(this.VKI_layout).forEach(ktype => {
        if (!this.VKI_layout[ktype].lang) this.VKI_layout[ktype].lang = [];
        let li = document.createElement('li');
        li.title = this.VKI_layout[ktype].name;
        li.setAttribute('data-order', order++);
        li.setAttribute('data-text', ktype);
        li.addEventListener('click', function(e) {
            e.stopPropagation();
            this.parentNode.style.display = '';
            self.VKI_kts = self.VKI_kt = self.VKI_select.firstChild.nodeValue = this.getAttribute('data-text');
            self.VKI_select.sortType = 0;
            self.VKI_buildKeys();
            self.VKI_KO_targetEvents?.(); // Korean target events
        });
        li.appendChild(document.createTextNode(ktype));
        ol.appendChild(li);
        langs++;
    });
    this.VKI_select.appendChild(ol);
    if (langs > 1) thth.appendChild(this.VKI_select);

    if (this.VKI_numberPad) {
        let span = document.createElement('span');
        span.id = 'keyboardInputNumpadToggle';
        span.appendChild(document.createTextNode('#'));
        span.title = this.VKI_i18n['00'];
        span.addEventListener('click', function() {
            self.VKI_numpadCell.style.display = (!self.VKI_numpadCell.style.display) ? 'none' : '';
            self.VKI_numpadCell.previousStyle = self.VKI_numpadCell.style.display;
            self.VKI_position(true);
        });
        thth.appendChild(span);
    }

    this.VKI_kbSize = function(delta) {
        this.VKI_size = Math.min(5, Math.max(1, this.VKI_size + delta));
        this.VKI_keyboard.className = this.VKI_keyboard.className.replace(/\bkeyboardInputSize\d\b/, '');
        if (this.VKI_size != 2) this.VKI_keyboard.classList.add('keyboardInputSize' + this.VKI_size);
        this.VKI_position(true);
    };
    if (this.VKI_sizeAdj) {
        let small = document.createElement('small');
        small.title = this.VKI_i18n['10'];
        small.addEventListener('click', function() { self.VKI_kbSize(-1); });
        small.appendChild(document.createTextNode('\u21d3'));
        thth.appendChild(small);
        let big = document.createElement('big');
        big.title = this.VKI_i18n['11'];
        big.addEventListener('click', function() { self.VKI_kbSize(1); });
        big.appendChild(document.createTextNode('\u21d1'));
        thth.appendChild(big);
    }

    let span = document.createElement('span');
    span.id = 'keyboardInputNumpadBksp';
    span.appendChild(document.createTextNode('\u21E6'));
    span.title = this.VKI_i18n['12'];
    span.addEventListener('click', function() { self.VKI_backspace(); });
    thth.appendChild(span);

    if (this.VKI_move) {
        this.VKI_move = document.createElement('span');
        this.VKI_move.pos = [0, 0];
        this.VKI_move.appendChild(document.createTextNode('\u2725'));
        this.VKI_move.title = this.VKI_i18n['14'];
        this.VKI_move.move = function(e) {
            if (self.VKI_target.keyboardPosition == 'fixed') {
                self.VKI_keyboard.style.left = e.pageX - self.VKI_move.pos[0] + 'px';
                self.VKI_keyboard.style.top = e.pageY - self.VKI_move.pos[1] + 'px';
            } else {
                self.VKI_keyboard.style.left = e.pageX + VKI_scrollDist()[0] - self.VKI_move.pos[0] + VKI_scrollDist()[0] + 'px';
                self.VKI_keyboard.style.top = e.pageY + VKI_scrollDist()[1] - self.VKI_move.pos[1] + VKI_scrollDist()[1] + 'px';
            }
        };
        this.VKI_move.drop = function() {
            document.removeEventListener('mousemove', self.VKI_move.move);
            document.removeEventListener('mouseup', self.VKI_move.drop);
        }
        this.VKI_move.addEventListener('mousedown', function(e) {
            e.preventDefault();
            let coord = self.VKI_keyboard.getBoundingClientRect();
            self.VKI_move.pos[0] = e.pageX - coord.left;
            self.VKI_move.pos[1] = e.pageY - coord.top;
            if (self.VKI_target.keyboardPosition != 'fixed') {
                self.VKI_move.pos[0] += VKI_scrollDist()[0];
                self.VKI_move.pos[1] += VKI_scrollDist()[1];
            }
            document.addEventListener('mousemove', self.VKI_move.move);
            document.addEventListener('mouseup', self.VKI_move.drop);
        });
        thth.appendChild(this.VKI_move);
    }

    span = document.createElement('span');
    span.appendChild(document.createTextNode(this.VKI_i18n['07']));
    span.title = this.VKI_i18n['08'];
    span.addEventListener('click', function() {
        self.VKI_target.value = '';
        self.VKI_target.focus();
        self.VKI_KO_clearCurrent?.();
        return false;
    });
    thth.appendChild(span);

    let strong = document.createElement('strong');
    strong.title = this.VKI_i18n['06'];
    strong.addEventListener('click', function() { self.VKI_close(); });
    let big = document.createElement('big');
    big.appendChild(document.createTextNode('\u00d7'));
    strong.appendChild(big);
    thth.appendChild(strong);

    thtr.appendChild(thth);
    //thead.appendChild(thtr);
    this.VKI_keyboard.appendChild(thead);

    let tbody = document.createElement('tbody');
    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.id = 'keyboardInputKeyboard';
    let div = document.createElement('div');

    if (this.VKI_deadBox) {
        let label = document.createElement('label');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.title = this.VKI_i18n['03'] + ': ' + ((this.VKI_deadkeysOn) ? this.VKI_i18n['04'] : this.VKI_i18n['05']);
        checkbox.defaultChecked = this.VKI_deadkeysOn;
        checkbox.addEventListener('click', function() {
            this.title = self.VKI_i18n['03'] + ': ' + ((this.checked) ? self.VKI_i18n['04'] : self.VKI_i18n['05']);
            self.VKI_modify('');
            return true;
        });
        label.appendChild(checkbox);
        checkbox.checked = this.VKI_deadkeysOn;
        div.appendChild(label);
        this.VKI_deadkeysOn = checkbox;
    } else this.VKI_deadkeysOn.checked = this.VKI_deadkeysOn;

    if (this.VKI_showVersion) {
        let vr = document.createElement('var');
        vr.title = this.VKI_i18n['09'] + ' ' + this.VKI_version;
        vr.appendChild(document.createTextNode('v' + this.VKI_version));
        div.appendChild(vr);
    }

    td.appendChild(div);
    tr.appendChild(td);

    this.VKI_numpadCell = document.createElement('td');
    this.VKI_numpadCell.id = 'keyboardInputNumpad';
    if (!this.VKI_numberPadOn) {
        this.VKI_numpadCell.style.display = 'none';
        this.VKI_numpadCell.previousStyle = 'none';
    } else this.VKI_numpadCell.previousStyle = '';
    let ntable = document.createElement('table');
    ntable.cellSpacing = '0';
    let ntbody = document.createElement('tbody');
    for (let x = 0; x < this.VKI_numpad.length; x++) {
        let ntr = document.createElement('tr');
        for (let y = 0; y < this.VKI_numpad[x].length; y++) {
            let ntd = document.createElement('td');
            ntd.addEventListener('click', VKI_keyClick);
            if (this.VKI_numpad[x][y][0].match(/\d/)) ntd.classList.add('digit');
            if (this.VKI_numpad[x][y][0] == '.') ntd.classList.add('decimal');
            if (this.VKI_numpad[x][y][0] == '-') ntd.classList.add('negative');
            ntd.appendChild(document.createTextNode(this.VKI_numpad[x][y][0]));
            VKI_mouseEvents(ntd);
            ntr.appendChild(ntd);
        } ntbody.appendChild(ntr);
    } ntable.appendChild(ntbody);
    this.VKI_numpadCell.appendChild(ntable);
    tr.appendChild(this.VKI_numpadCell);
    tbody.appendChild(tr);
    this.VKI_keyboard.appendChild(tbody);
*/

    /* ****************************************************************
     * Build or rebuild the keyboard keys
     *
     */
    this.VKI_buildKeys = function() {
        console.log('in buildkeys');
        this.VKI_shift = this.VKI_shiftlock = this.VKI_altgr = this.VKI_altgrlock = this.VKI_dead = false;
        let container = this.VKI_keyboard.tBodies[0].getElementsByTagName('div')[0];
        for (let t = container.getElementsByTagName('table'), x = t.length - 1; x >= 0; x--)
            container.removeChild(t[x]);

        let hasDeadKey = false;
        for (let x = 0, lyt; lyt = this.VKI_layout[this.VKI_kt].keys[x++];) {
            let table = document.createElement('table');
            table.cellSpacing = '0';
            if (lyt.length <= this.VKI_keyCenter) table.classList.add('keyboardInputCenter');
            let tbody = document.createElement('tbody');
            let tr = document.createElement('tr');
            for (let y = 0, lkey; lkey = lyt[y++];) {
                let td = document.createElement('td');
                if (this.VKI_symbol[lkey[0]]) {
                    let text = this.VKI_symbol[lkey[0]].split("\n");
                    let small = document.createElement('small');
                    small.setAttribute('char', lkey[0]);
                    for (let z = 0; z < text.length; z++) {
                        if (z) small.appendChild(document.createElement('br'));
                        small.appendChild(document.createTextNode(text[z]));
                    } td.appendChild(small);
                } else td.appendChild(document.createTextNode(lkey[0] || '\xa0'));

                if (this.VKI_deadkeysOn.checked)
                    for (const key in this.VKI_deadkey)
                        if (key === lkey[0]) { td.classList.add('deadkey'); break; }
                if (lyt.length > this.VKI_keyCenter && y == lyt.length) td.classList.add('last');
                if (lkey[0] == ' ' || lkey[1] == ' ') td.classList.add('space');

                switch (lkey[1]) {
                    case 'Caps': case 'Shift':
                    case 'Alt': case 'AltGr': case 'AltLk':
                        td.addEventListener('click', (function(type) { return function() { self.VKI_modify(type); return false; }})(lkey[1]));
                        break;

                    case 'Tab':
                        td.addEventListener('click', function() {
                            if (self.VKI_activeTab) {
                                if (self.VKI_target.form) {
                                    let target = self.VKI_target, elems = target.form.elements;
                                    self.VKI_close();
                                    for (let z = 0, me = false, j = -1; z < elems.length; z++) {
                                        if (j == -1 && elems[z].getAttribute('VKI_attached')) j = z;
                                        if (me) {
                                            if (self.VKI_activeTab == 1 && elems[z]) break;
                                            if (elems[z].getAttribute('VKI_attached')) break;
                                        } else if (elems[z] == target) me = true;
                                    }
                                    if (z == elems.length) z = Math.max(j, 0);
                                    if (elems[z].getAttribute('VKI_attached')) {
                                        self.VKI_show(elems[z]);
                                    } else elems[z].focus();
                                } else self.VKI_target.focus();
                            } else self.VKI_insert("\t");
                            return false;
                        });
                        break;

                    case 'Bksp':
                        td.title = this.VKI_i18n['12'];
                        td.addEventListener('click', function() { self.VKI_backspace(); });
                        break;

                    case 'Enter':
                        td.addEventListener('click', function() {
                            if (self.VKI_target.nodeName != 'TEXTAREA') {
                                if (self.VKI_enterSubmit && self.VKI_target.form) {
                                    for (let z = 0, subm = false; z < self.VKI_target.form.elements.length; z++)
                                        if (self.VKI_target.form.elements[z].type == 'submit') subm = true;
                                    if (!subm) self.VKI_target.form.submit();
                                }
                                self.VKI_close();
                            } else self.VKI_insert("\n");
                            return true;
                        });
                        break;

                    case 'Complete': // Korean input only
                        td.title = this.VKI_i18n['13'];
                        td.id = 'keyboardInputKOComplete';
                        td.textContent = '';
                        td.addEventListener('click', function() {
                            self.VKI_target.focus();
                            self.VKI_KO_clearCurrent?.();
                            // Keep the cursor in place
                            self.VKI_target.setSelectionRange(
                                self.VKI_target.selectionStart,
                                self.VKI_target.selectionStart
                            );
                        });
                        break;

                    default:
                        td.addEventListener('click', VKI_keyClick);

                }
                VKI_mouseEvents(td);
                tr.appendChild(td);
                for (let z = 0; z < 4; z++)
                    if (this.VKI_deadkey[lkey[z] = lkey[z] || '']) hasDeadKey = true;
            } tbody.appendChild(tr);
            table.appendChild(tbody);
            container.appendChild(table);
        }
/*
        if (this.VKI_deadBox)
            this.VKI_deadkeysOn.style.display = (hasDeadKey) ? 'inline' : 'none';
*/
    };

    //this.VKI_buildKeys();
    //this.VKI_keyboard.addEventListener('selectstart', function() { return false; });
    //this.VKI_keyboard.unselectable = 'on';


    /* ******************************************************************
     * Controls modifier keys
     *
     */
    this.VKI_modify = function(type) {
        switch (type) {
            case 'Alt': case 'AltGr': this.VKI_altgr = !this.VKI_altgr; break;
            case 'AltLk': this.VKI_altgr = 0; this.VKI_altgrlock = !this.VKI_altgrlock; break;
            case 'Caps': this.VKI_shift = 0; this.VKI_shiftlock = !this.VKI_shiftlock; break;
            case 'Shift': this.VKI_shift = !this.VKI_shift;
        }
        let vchar = 0;
        if (!this.VKI_shift != !this.VKI_shiftlock) vchar += 1;
        if (!this.VKI_altgr != !this.VKI_altgrlock) vchar += 2;

        for (let t = this.VKI_keyboard.tBodies[0].getElementsByTagName('div')[0].getElementsByTagName('table'), x = 0, tds; x < t.length; x++) {
            tds = t[x].getElementsByTagName('td');
            for (let y = 0, lkey; y < tds.length; y++) {
                tds[y].className = '';
                lkey = this.VKI_layout[this.VKI_kt].keys[x][y];

                switch (lkey[1]) {
                    case 'Alt':
                    case 'AltGr':
                        if (this.VKI_altgr) tds[y].classList.add('pressed');
                        break;
                    case 'AltLk':
                        if (this.VKI_altgrlock) tds[y].classList.add('pressed');
                        break;
                    case 'Shift':
                        if (this.VKI_shift) tds[y].classList.add('pressed');
                        break;
                    case 'Caps':
                        if (this.VKI_shiftlock) tds[y].classList.add('pressed');
                        break;
                    case 'Tab': case 'Enter': case 'Bksp': case 'Complete': break;
                    default:
                        if (type) {
                            tds[y].removeChild(tds[y].firstChild);
                            if (this.VKI_symbol[lkey[vchar]]) {
                                let text = this.VKI_symbol[lkey[vchar]].split("\n");
                                let small = document.createElement('small');
                                small.setAttribute('char', lkey[vchar]);
                                for (let z = 0; z < text.length; z++) {
                                    if (z) small.appendChild(document.createElement('br'));
                                    small.appendChild(document.createTextNode(text[z]));
                                } tds[y].appendChild(small);
                            } else tds[y].appendChild(document.createTextNode(lkey[vchar] || '\xa0'));
                        }
                        if (this.VKI_deadkeysOn.checked) {
                            let character = tds[y].firstChild.nodeValue || tds[y].firstChild.className;
                            if (this.VKI_dead) {
                                if (character == this.VKI_dead) tds[y].classList.add('pressed');
                                if (this.VKI_deadkey[this.VKI_dead][character]) tds[y].classList.add('target');
                            }
                            if (this.VKI_deadkey[character]) tds[y].classList.add('deadkey');
                        }
                }

                if (y == tds.length - 1 && tds.length > this.VKI_keyCenter) tds[y].classList.add('last');
                if (lkey[0] == ' ' || lkey[1] == ' ') tds[y].classList.add('space');
            }
        }
    };


    /* ******************************************************************
     * Insert text at the cursor
        *
        */
        this.VKI_insert = function(text) {
            this.VKI_target.dispatchEvent(new Event('beforeinput'));
            this.VKI_target.focus();
            if (this.VKI_target.maxLength)
                this.VKI_target.maxlength = this.VKI_target.maxLength;
            if (typeof this.VKI_target.maxlength == 'undefined' ||
                this.VKI_target.maxlength < 0 ||
                this.VKI_target.value.length < this.VKI_target.maxlength) {
                if (!this.VKI_target.readOnly || this.VKI_target.getAttribute('VKI_type') == 'password') {
                    let rng = [this.VKI_target.selectionStart, this.VKI_target.selectionEnd];
                    // If using the Korean keyboard
                    if (this.VKI_kt == '\ud55c\uad6d\uc5b4') {
                        let val = this.VKI_KO_insert?.(text, rng);
                        if (typeof val != 'undefined') [text, rng] = val;
                    }
                    this.VKI_target.value = this.VKI_target.value.substr(0, rng[0]) + text + this.VKI_target.value.substr(rng[1]);
                    this.VKI_target.setSelectionRange(rng[0] + text.length, rng[0] + text.length);
                } // Readonly
                if (this.VKI_shift) this.VKI_modify('Shift');
                if (this.VKI_altgr) this.VKI_modify('AltGr');
                this.VKI_target.dispatchEvent(new Event('input'));
                this.VKI_target.focus();
            } // Addition of this character would be over the maxLength
        };


    /* ******************************************************************
     * Delete a character behind the cursor
     *
     */
    this.VKI_backspace = function() {
        this.VKI_target.focus();
        if (!this.VKI_target.readOnly || this.VKI_target.getAttribute('VKI_type') == 'password') {
            let rng = [this.VKI_target.selectionStart, this.VKI_target.selectionEnd];
            // Get the character we're about to delete with backspace
            let lastInput = this.VKI_target.value.substr(rng[0] - 1, rng[1]);
            // Delete the previous character
            if (rng[0] < rng[1]) rng[0]++;
            this.VKI_target.value = this.VKI_target.value.substr(0, rng[0] - 1) + this.VKI_target.value.substr(rng[1]);
            this.VKI_target.setSelectionRange(rng[0] - 1, rng[0] - 1);
            // If using the Korean keyboard
            if (this.VKI_kt == '\ud55c\uad6d\uc5b4')
                this.VKI_KO_backspace?.(lastInput, rng);
        } // Readonly
        if (this.VKI_shift) this.VKI_modify('Shift');
        if (this.VKI_altgr) this.VKI_modify('AltGr');
        this.VKI_target.focus();
        return true;
    };


    /* ******************************************************************
     * Show the keyboard interface
     *
     */
    this.VKI_show = function(elem) {
        return;
        if (!this.VKI_target) {
            this.VKI_target = elem;
            if (this.VKI_langAdapt && this.VKI_target.lang) {
                let chg = false, lang = this.VKI_target.lang.toLowerCase().replace(/-/g, '_');
                for (const layout in this.VKI_layout)
                    for (let y = 0; y < this.VKI_layout[layout].lang.length; y++)
                        if (!chg && lang == this.VKI_layout[layout].lang[y].toLowerCase())
                            chg = this.VKI_select.firstChild.nodeValue = this.VKI_kt = layout;
                if (chg) this.VKI_buildKeys();
            }
            try {
                this.VKI_keyboard.parentNode.removeChild(this.VKI_keyboard);
            } catch (e) {}
            if (this.VKI_target.getAttribute('VKI_type') == 'password') {
                this.VKI_target.storeReadOnly = this.VKI_target.readOnly;
                this.VKI_target.readOnly = 'readonly';
                if (this.VKI_clearPasswords) this.VKI_target.value = '';
            }
            if (this.VKI_target.getAttribute('VKI_numpadInput') == 'true') {
                this.VKI_keyboard.classList.add('numpadOnly');
                this.VKI_numpadCell.classList.add('showNegative', 'showDecimal');
                this.VKI_numpadCell.previousStyle = this.VKI_numpadCell.style.display;
                this.VKI_numpadCell.style.display = '';
                let noNeg = false;
                this.VKI_target.pattern = '^[+-]?[0-9]*\\.?[0-9]*$';
                if (this.VKI_target.min && parseFloat(this.VKI_target.min) >= 0) {
                    this.VKI_target.pattern = '^\\+?[0-9]*\\.?[0-9]*$';
                    this.VKI_numpadCell.classList.remove('showNegative');
                    noNeg = true;
                }
                if (this.VKI_target.step && !parseFloat(this.VKI_target.step).toString().match(/\./)) {
                    this.VKI_target.pattern = (noNeg) ? '^\\+?[0-9]*$' : '^[+-]?[0-9]*$';
                    this.VKI_numpadCell.classList.remove('showDecimal');
                }
            } else {
                this.VKI_keyboard.classList.remove('numpadOnly');
                this.VKI_numpadCell.style.display = this.VKI_numpadCell.previousStyle;
            }

            let elemStep = this.VKI_target;
            this.VKI_target.keyboardPosition = 'absolute';
            do {
                if (window.getComputedStyle(elemStep, null)['position'] == 'fixed') {
                    this.VKI_target.keyboardPosition = 'fixed';
                    break;
                }
            } while (elemStep = elemStep.offsetParent);

            document.body.appendChild(this.VKI_keyboard);
            this.VKI_keyboard.style.position = this.VKI_target.keyboardPosition;

            //this.VKI_position(true);
            this.VKI_target.blur();
            this.VKI_target.focus();

            this.VKI_KO_targetEvents?.();
        } else this.VKI_close();
    };


    /* ******************************************************************
     * Position the keyboard
     *
     */
    this.VKI_position = function(force) {
        if (this.VKI_target) {
            let kPos = VKI_findPos(this.VKI_keyboard), wDim = VKI_innerDimensions(), sDis = VKI_scrollDist();
            let place = false, fudge = this.VKI_target.offsetHeight + 3;
            if (force !== true) {
                if (kPos[1] + this.VKI_keyboard.offsetHeight - sDis[1] - wDim[1] > 0) {
                    place = true;
                    fudge = -this.VKI_keyboard.offsetHeight - 3;
                } else if (kPos[1] - sDis[1] < 0) place = true;
            }
            if (place || force === true) {
                let iPos = VKI_findPos(this.VKI_target), scr = this.VKI_target;
                while (scr = scr.parentNode) {
                    if (scr == document.body) break;
                    if (scr.scrollHeight > scr.offsetHeight || scr.scrollWidth > scr.offsetWidth) {
                        if (!scr.getAttribute('VKI_scrollListener')) {
                            scr.setAttribute('VKI_scrollListener', true);
                            scr.addEventListener('scroll', function() { this.VKI_position(true); });
                        } // Check if the input is in view
                        let pPos = VKI_findPos(scr), oTop = iPos[1] - pPos[1], oLeft = iPos[0] - pPos[0];
                        let top = oTop + this.VKI_target.offsetHeight;
                        let left = oLeft + this.VKI_target.offsetWidth;
                        let bottom = scr.offsetHeight - oTop - this.VKI_target.offsetHeight;
                        let right = scr.offsetWidth - oLeft - this.VKI_target.offsetWidth;
                        this.VKI_keyboard.style.display = (top < 0 || left < 0 || bottom < 0 || right < 0) ? 'none' : '';
                    }
                }
                this.VKI_keyboard.style.top = iPos[1] + fudge + 'px';
                this.VKI_keyboard.style.left = Math.max(10, Math.min(wDim[0] - this.VKI_keyboard.offsetWidth - 25, iPos[0])) + 'px';
            }
            if (force === true) this.VKI_position();
        }
    };


    /* ******************************************************************
     * Close the keyboard interface
     *
     */
    this.VKI_close = VKI_close = function() {
        if (this.VKI_target) {
            if (this.VKI_move) this.VKI_move.drop();
            this.VKI_KO_clearCurrent?.();

            if (this.VKI_target.getAttribute('VKI_type') == 'password')
                this.VKI_target.readOnly = this.VKI_target.storeReadOnly;
            if (this.VKI_target.getAttribute('VKI_numpadInput') == 'true')
                this.VKI_target.pattern = '.*';
            try {
                this.VKI_keyboard.parentNode.removeChild(this.VKI_keyboard);
            } catch (e) {}
            if (this.VKI_kt != this.VKI_kts) {
                this.VKI_select.firstChild.nodeValue = this.VKI_kt = this.VKI_kts;
                this.VKI_buildKeys();
            }
            this.VKI_select.getElementsByTagName('ol')[0].style.display = '';;
            this.VKI_select.sortType = 0;
            this.VKI_target.focus();
            this.VKI_target = false;
            this.VKI_KO_targetEvents?.();
        }
    };


    /* ***** Private functions *************************************** */
    let VKI_findPos = function(obj) {
        if (self.VKI_target.keyboardPosition != 'fixed') {
            let curleft = curtop = 0, scr = obj;
            while ((scr = scr.parentNode) && scr != document.body) {
                curleft -= scr.scrollLeft || 0;
                curtop -= scr.scrollTop || 0;
            }
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
            return [curleft, curtop];
        } else {
            let boundingRect = obj.getBoundingClientRect();
            return [boundingRect.left, boundingRect.top];
        }
    };

    let VKI_innerDimensions = function() {
        if (self.innerHeight) {
            return [self.innerWidth, self.innerHeight];
        } else if (document.documentElement && document.documentElement.clientHeight) {
            return [document.documentElement.clientWidth, document.documentElement.clientHeight];
        } else if (document.body && document.body.clientWidth)
            return [document.body.clientWidth, document.body.clientHeight];
        return [0, 0];
    };

    let VKI_scrollDist = function() {
        let html = document.getElementsByTagName('html')[0];
        if (html.scrollTop && document.documentElement.scrollTop) {
            return [html.scrollLeft, html.scrollTop];
        } else if (html.scrollTop || document.documentElement.scrollTop) {
            return [html.scrollLeft + document.documentElement.scrollLeft, html.scrollTop + document.documentElement.scrollTop];
        } else if (document.body.scrollTop)
            return [document.body.scrollLeft, document.body.scrollTop];
        return [0, 0];
    };

    let VKI_renderKeyboard = function() {
        /* ***** Build the keyboard interface **************************** */
        this.VKI_keyboard = document.createElement('table');
        this.VKI_keyboard.id = 'keyboardInputMaster';
        this.VKI_keyboard.dir = 'ltr';
        this.VKI_keyboard.cellSpacing = '0';
        this.VKI_keyboard.classList.add('keyboardInputSize' + this.VKI_size);
        this.VKI_keyboard.addEventListener('click', function(e) {
            e.stopPropagation();
            return false;
        });

        if (!this.VKI_layout[this.VKI_kt])
            return alert('No keyboard named "' + this.VKI_kt + '"');

        let tbody = document.createElement('tbody');
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.id = 'keyboardInputKeyboard';
        let div = document.createElement('div');
        td.appendChild(div);
        tr.appendChild(td);
        tbody.appendChild(tr);
        this.VKI_keyboard.appendChild(tbody);
        this.VKI_buildKeys();
        document.body.appendChild(this.VKI_keyboard);
    };

    window.addEventListener('resize', this.VKI_position);
    window.addEventListener('scroll', this.VKI_position);
    window.addEventListener('load', function() {
        let inputElems = [
            ...document.getElementsByTagName('input'),
            ...document.getElementsByTagName('textarea')
        ];
        VKI_renderKeyboard();
        for (let x = 0, elem; elem = inputElems[x++];)
            if (elem.nodeName == 'TEXTAREA' || elem.type == 'text' || elem.type == 'number' || elem.type == 'password')
                if (elem.classList.contains('keyboardInput')){
                    //VKI_attach(elem);
                    self.VKI_target = elem;
                    elem.addEventListener('focus', function() {
                        console.log('elem focused');
                        self.VKI_target = this;
                        //if (self.VKI_target != this) {
                        //    if (self.VKI_target) self.VKI_close();
                        //    self.VKI_show(this);
                        //}
                    });
                }


        //document.documentElement.addEventListener('click', function(e) {
        //    self.VKI_close();
        //});
    });
})();
