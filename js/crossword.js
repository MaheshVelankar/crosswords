(function ($, Drupal, once, drupalSettings) {

    Drupal.behaviors.crossword = {
        attach: function (context, settings) {
            var selector = drupalSettings.crossword.selector;
            once('crossword-init', selector).forEach(function(crossword){
                var $crossword = $(crossword);
                var data = drupalSettings.crossword.data;
                var vkbd = drupalSettings.crossword.vkbd;
                Drupal.behaviors.crossword.renderCrossword($crossword, data);
                // Handle persisting revealed status.
                //data.revealed = Drupal.behaviors.crossword.isRevealed(data.id);
                //if (data.revealed) {
                //  $crossword.addClass('crossword-revealed');
                //}
                var answers = Drupal.behaviors.crossword.loadAnswers(data);
                var Crossword = new Drupal.Crossword.Crossword(data, answers);
                Crossword.$crossword = $crossword;
                Crossword.$activeCluesText = $('.active-clues-text', $crossword);
                $crossword.data("Crossword", Crossword);

                Drupal.behaviors.crossword.addCrosswordEventHandlers($crossword, data);
                Drupal.behaviors.crossword.connectClues($crossword, data);
                Drupal.behaviors.crossword.connectSquares($crossword, data);
                Drupal.behaviors.crossword.addInputHandlers($crossword, data);
                Drupal.behaviors.crossword.addSquareExitHandlers($crossword, data);
                Drupal.behaviors.crossword.addDevIme($crossword, data, vkbd);
                Drupal.behaviors.crossword.addKeydownHandlers($crossword, data);
                Drupal.behaviors.crossword.addClickHandlers($crossword, data);
                //Drupal.behaviors.crossword.addKeypressHandlers($crossword, data);

                // Trick the display into updating now that everything is connected.
                Crossword.setActiveClue(Crossword.activeClue);

                // Handle checkboxes for settings.
                // Show-errors setting.
                if ($('#show-errors', $crossword).prop('checked')) {
                    $crossword.addClass('show-errors');
                }
                once('crossword-show-errors-change', '#show-errors', crossword).forEach(function(element) {
                    $(element).on('change', function () {
                        $crossword.toggleClass('show-errors');
                        localStorage.setItem('#show-errors', $(this).prop('checked'));
                    });
                });
                // Show-references setting.
                if ($('#show-references', $crossword).prop('checked')) {
                    $crossword.addClass('show-references');
                }
                once('crossword-show-references-change', '#show-references', crossword).forEach(function(element){
                    $(element).on('change', function(){
                        $crossword.toggleClass('show-references');
                        localStorage.setItem('#show-references', $(this).prop('checked'));
                    });
                });
                // Show-clue setting.
                if ($('#show-clues', $crossword).prop('checked') === false) {
                    $crossword.addClass('hide-clues');
                }
                once('crossword-show-clues-change', '#show-clues', crossword).forEach(function(element){
                    $(element).on('change', function(){
                        $crossword.toggleClass('hide-clues');
                        localStorage.setItem('#show-clues', $(this).prop('checked'));
                    });
                });
                // Load settings from storage to override defaults.
                Drupal.behaviors.crossword.loadSettings($crossword)

                // Instructions button is an odd duck.
                once('crossword-button-instructions', '.button-instructions', crossword).forEach(function(element){
                    $(element).click(function(e){
                        e.preventDefault();
                        $('.crossword-instructions-container', $crossword).toggleClass('active');
                    });
                });
            });
        },
        loadSettings: function($crossword) {
            var settings = [
                '#show-errors',
                '#show-references',
                '#show-clues',
            ];
            settings.forEach(function(setting) {
                if (localStorage.getItem(setting) !== null) {
                    if (String($(setting, $crossword).prop('checked')) !== localStorage.getItem(setting)) {
                        $(setting, $crossword).trigger('click');
                    }
                }
            });
        },
        loadAnswers: function (data) {
            var key = 'crossword:' + data.id;
            var storage;
            if (localStorage.getItem(key) !== null) {
                storage = JSON.parse(localStorage.getItem(key));
                if (storage['answers']) {
                    return storage['answers'];
                }
            }
            // If we haven't returned, no answers are saved yet.
            var emptyAnswers = Drupal.behaviors.crossword.emptyAnswers(data);
            if (!storage) {
                storage = {};
            }
            storage['answers'] = emptyAnswers;
            localStorage.setItem(key, JSON.stringify(storage));
            return emptyAnswers;
        },
        saveAnswers: function (id, answers) {
            var key = 'crossword:' + id;
            var storage;
            if (localStorage.getItem(key) !== null) {
                storage = JSON.parse(localStorage.getItem(key));
            }
            if (!storage) {
                storage = {};
            }
            storage['answers'] = answers;
            localStorage.setItem(key, JSON.stringify(storage));
        },
        saveRevealed: function (id, revealed) {
            var key = 'crossword:' + id;
            var storage;
            if (localStorage.getItem(key) !== null) {
                storage = JSON.parse(localStorage.getItem(key));
            }
            if (!storage) {
                storage = {};
            }
            storage['revealed'] = revealed;
            localStorage.setItem(key, JSON.stringify(storage));
        },
        isRevealed: function (id) {
            var key = 'crossword:' + id;
            if (localStorage.getItem(key) !== null) {
                var storage = JSON.parse(localStorage.getItem(key));
                if (storage['revealed']) {
                    return storage['revealed'];
                }
            }
            return false;
        },
        emptyAnswers: function (data) {
            var grid = data.puzzle.grid;
            var answers = [];
            for (var row_index = 0; row_index < grid.length; row_index++) {
                answers.push([]);
                for (var col_index = 0; col_index < grid[row_index].length; col_index++) {
                    if (data.puzzle.grid[row_index][col_index].hint) {
                        // A hint is always visible, even when loading the first time.
                        answers[row_index].push(data.puzzle.grid[row_index][col_index].fill);
                    }
                    else {
                        answers[row_index].push(null);
                    }
                }
            }
            return answers;
        },
        connectSquares: function ($crossword, data) {
            $('.crossword-square', $crossword).each(function(){
                var row = Number($(this).data('row'));
                var col = Number($(this).data('col'));
                $(this).data("Square", $crossword.data("Crossword").grid[row][col]);
                $(this).data("Square").connect($(this));
            });
        },
        connectClues: function ($crossword, data) {
            $('.crossword-clue', $crossword).each(function(){
                if ($(this).data('clue-index-across') !== undefined) {
                    var index = Number($(this).data('clue-index-across'));
                    $(this).data("Clue", $crossword.data("Crossword").clues.across[index]);
                }
                else {
                    var index = Number($(this).data('clue-index-down'));
                    $(this).data("Clue", $crossword.data("Crossword").clues.down[index]);
                }
                $(this).data("Clue").connect($(this));
            });
        },
        addInputHandlers: function($crossword, data) {
            var Crossword = $crossword.data("Crossword");
            $('.crossword-square input', $crossword).on('input', function(e){
                //console.log('in input val: ' + $(this).val());
                var activeSq;
                if (e.detail.complete){
                    activeSq = Crossword.activeSquare;
                    //console.log('in input yes yes');
                    Crossword.setAnswer(e.target.value, Drupal.behaviors.crossword.rebusEntryActive(e.target.value), null, null, 'yes','yes').focus();
                    activeSq = Crossword.activeSquare;
                    var newInputLocator = '#sq_' + (activeSq.row + 1) + "_" + (activeSq.column + 1);
                    let ekeypress = $.Event('keypress');
                    ekeypress.which = e.detail.next_value;
                    $(newInputLocator).trigger(ekeypress);
                    //$(newInputLocator).trigger('prime', {value: e.detail.next_value});
                    $(this).val("");
                } else{
                    //console.log('in input no no');
                    activeSq = Crossword.activeSquare;
                    activeSq = Crossword.activeSquare;
                    Crossword.setAnswer(e.target.value, Drupal.behaviors.crossword.rebusEntryActive(e.target.value), null, null, 'no', 'no');
                }
            });
            // Make sure non-crossword inputs, like a searchbar, still work.
            $('input:not(".crossword-input")').on('focus', function() {
                Crossword.escape();
            });
        },
        addSquareExitHandlers: function($crossword,data) {
            var Crossword = $crossword.data("Crossword");
            $('.crossword-square input', $crossword).on('square-exit', function(e){
                console.log('in square-exit val: ' + $(this).val());
                console.log('in square-exit yes no');
                Crossword.setAnswer($(this).val(), Drupal.behaviors.crossword.rebusEntryActive(e.target.value), null, null, 'yes', 'no');
                $(this).val("");
            });
        },
        addDevIme: function($crossword, data, vkbd) {
            var Crossword = $crossword.data("Crossword");
            var data = drupalSettings.crossword.data;
            var grid = data.puzzle.grid;
            for (var row_index = 0; row_index < grid.length; row_index++) {
                for (var col_index = 0; col_index < grid[row_index].length; col_index++) {
                    var input_id_locator = '#sq_' + (row_index + 1) + '_' + (col_index + 1);
                    $(input_id_locator).cwtxtwriter({Crossword : Crossword, vkbd : vkbd});
                }
            }
            Crossword.focus();
        },
        addKeypressHandlers: function($crossword, data) {
            var Crossword = $crossword.data("Crossword");
            $('.crossword-square input', $crossword).on('keypress', function(e){
            });
        },
        addKeydownHandlers: function($crossword, data) {
            var Crossword = $crossword.data("Crossword");

            $(document).on("keydown", function(event) {
                var elem_id = $(event.target).attr('id');
                if (Crossword.activeClue) {
                    //for arrows, spacebar, escape, and tab
                    var activeSq = Crossword.activeSquare;
                    switch(event.keyCode) {
                        case 27:
                            //escape
                            // Opt out of key hijacking!
                            event.preventDefault();
                            Crossword.escape();
                            Drupal.behaviors.crossword.turnOffRebus();
                            break;
                        case 38:
                            //up
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Crossword.moveActiveSquare('up').focus();
                            Drupal.behaviors.crossword.turnOffRebus();
                            break;
                        case 37:
                            //left
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Drupal.behaviors.crossword.turnOffRebus();
                            if (event.shiftKey) {
                                Crossword.retreatToPreviousUnsolvedClue().focus();
                            } else {
                                Crossword.moveActiveSquare('left').focus();
                            }
                            break;
                        case 39:
                            //right
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Drupal.behaviors.crossword.turnOffRebus();
                            if (event.shiftKey) {
                                Crossword.advanceToNextUnsolvedClue().focus();
                            } else {
                                Crossword.moveActiveSquare('right').focus();
                            }
                            break;
                        case 40:
                            //down
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Crossword.moveActiveSquare('down').focus();
                            Drupal.behaviors.crossword.turnOffRebus();
                            break;
                        case 32:
                            //spacebar
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            // Escape from rebus or toggle direction.
                            if (Drupal.behaviors.crossword.rebusEntryActive("spacebar")) {
                                Crossword.advanceActiveSquare().focus();
                                Drupal.behaviors.crossword.turnOffRebus();
                            } else {
                                Crossword.changeDir().focus();
                            }
                            break;
                        case 13:
                            //return
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Drupal.behaviors.crossword.turnOffRebus();
                            Crossword.advanceActiveSquare().focus();
                            break;
                        case 9:
                            //tab
                            console.log('event target: ' + event.target.tagName);
                            console.log('event currenttarget: ' + event.currentTarget.tagName);
                            event.preventDefault();
                            event.target.value='';
                            if (activeSq.hasError()) {
                                activeSq['$square'].trigger('crossword-error');
                            }
                            Drupal.behaviors.crossword.turnOffRebus();
                            if (event.shiftKey) {
                                Crossword.retreatActiveClue().focus();
                            } else {
                                Crossword.advanceActiveClue().focus();
                            }
                            break;
                            /*
            case 46:
            case 8:
                            //backspace
              Crossword.setAnswer("", Drupal.behaviors.crossword.rebusEntryActive("backspace")).focus();
              break;
              */
                        case 82:
                            // r + CTRL toggles rebus.
                            if (event.ctrlKey) {
                                event.preventDefault();
                                Drupal.behaviors.crossword.toggleRebus();
                            }
                            break;
                        case 67:
                            // c + CTRL cheats.
                            if (event.ctrlKey) {
                                event.preventDefault();
                                $('.button-cheat', $crossword).trigger('click');
                                Drupal.behaviors.crossword.turnOffRebus();
                                Crossword.focus();
                            }
                            break;
                        case 73:
                            // i + CTRL toggles instructions.
                            if (event.ctrlKey) {
                                event.preventDefault();
                                $('.crossword-instructions-container', $crossword).toggleClass('active').focus();
                            }
                            break;
                        case 69:
                            // e + CTRL toggles errors.
                            if (event.ctrlKey) {
                                event.preventDefault();
                                $('#show-errors', $crossword).trigger('click').
                                    Crossword.focus();
                            }
                            break;
                        default:
                            // In any other case add focus so letter can always be entered.
                            // Helpful if user is clicking buttons and using keyboard.
                            //Crossword.focus();
                            var $focusedElement = $(document.activeElement);
                            if ($focusedElement.attr('id') === undefined || !$focusedElement.attr('id').startsWith('sq_')) {
                                //  Crossword.focus();
                            }

                            break;
                    }
                }
            });
        },
        addClickHandlers: function ($crossword, data) {
            var Crossword = $crossword.data("Crossword");

            once('crossword-square-click', '.crossword-square').forEach(function(element){
                $(element).click(function(){
                    if ($(this).data("Square") == Crossword.activeSquare && $(this).hasClass('focus')) {
                        Crossword.changeDir();
                    }
                    else {
                        Crossword.setActiveSquare($(this).data("Square"));
                        Drupal.behaviors.crossword.turnOffRebus();
                    }
                    Crossword.focus();
                });
            });

            once('crossword-clue-click', '.crossword-clue').forEach(function(element){
                $(element).click(function(){
                    Crossword.setActiveClue($(this).data("Clue")).focus();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-clue-change-click', '.crossword-clue-change').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    var dir = $(this).data('dir');
                    var change = Number($(this).data('clue-change'));
                    Crossword.changeActiveClue(dir, change);
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-express-click', '.next-clue-express').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    Crossword.advanceToNextUnsolvedClue();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-express-click', '.prev-clue-express').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    Crossword.retreatToPreviousUnsolvedClue();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-dir-change-click', '.crossword-dir-change').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    var dir = $(this).data('dir');
                    if (dir != Crossword.dir) {
                        Crossword.changeDir();
                    }
                });
            });

            once('crossword-cheat-click', '.button-cheat').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    if ($(this).data('confirm')) {
                        var message = $(this).data('confirm');
                        if (!confirm(message)) {
                            return;
                        }
                    }
                    Crossword.cheat();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-undo-click', '.button-undo').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    if ($(this).data('confirm')) {
                        var message = $(this).data('confirm');
                        if (!confirm(message)) {
                            return;
                        }
                    }
                    Crossword.undo().focus();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-redo-click', '.button-redo').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    if ($(this).data('confirm')) {
                        var message = $(this).data('confirm');
                        if (!confirm(message)) {
                            return;
                        }
                    }
                    Crossword.redo().focus();
                    Drupal.behaviors.crossword.turnOffRebus();
                });
            });

            once('crossword-solution-click', '.button-solution').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    if ($(this).data('confirm')) {
                        var message = $(this).data('confirm');
                        if (!confirm(message)) {
                            return;
                        }
                    }
                    Crossword.reveal();
                });
            });

            once('crossword-clear-click', '.button-clear').forEach(function(element){
                $(element).click(function(e){
                    e.preventDefault();
                    if ($(this).data('confirm')) {
                        var message = $(this).data('confirm');
                        if (!confirm(message)) {
                            return;
                        }
                    }
                    Crossword.clear();
                });
            });

            // When activating rebus entry, re-focus onto crossword.
            once('crossword-rebus-click', '.rebus-entry').forEach(function(element){
                $(element).click(function(e){
                    Crossword.focus();
                });
            });
        },
        addCrosswordEventHandlers: function ($crossword, data) {
            $('.crossword-clue, .crossword-square', $crossword)
                .on('crossword-active', function(){
                    $(this).addClass('active');
                })
                .on('crossword-highlight', function(){
                    $(this).addClass('highlight');
                })
                .on('crossword-reference', function(){
                    $(this).addClass('reference');
                })
                .on('crossword-error', function(){
                    $(this).addClass('error');
                })
                .on('crossword-ok', function(){
                    $(this).removeClass('error');
                })
                .on('crossword-off', function(){
                    $(this)
                        .removeClass('active')
                        .removeClass('highlight')
                        .removeClass('reference')
                        .removeClass('focus')
                        .find('input').blur();
                })
                .on('crossword-cheat', function(){
                    $(this).addClass('cheat');
                });

            $('.crossword-square', $crossword)
                .on('crossword-answer', function(e, answer){
                    $(this).find('.square-fill').text(answer.toUpperCase());
                    var Crossword = $crossword.data("Crossword");
                    Drupal.behaviors.crossword.saveAnswers(Crossword.id, Crossword.getAnswers())
                })
                .on('crossword-rebus', function(){
                    $(this).addClass('rebus');
                })
                .on('crossword-not-rebus', function(){
                    $(this).removeClass('rebus');
                })
                .on('crossword-focus', function(){
                    $(this).addClass('focus');
                    $(this).find('input').focus();
                })
                .on('crossword-active', function(){
                    // Manage aria-label.
                    var Crossword = $crossword.data("Crossword");
                    var dir = Crossword.dir;
                    var Square = $(this).data("Square");
                    if (Square && Square.isFirstLetter(dir)) {
                        var Clue = Square[dir];
                        var solvedString = Crossword.solved ? "The puzzle has been solved. Well done! " : "";
                        var revealedString = Crossword.revealed ? "The puzzle has been revealed. " : "";
                        var errorString = Crossword.showingErrors() && Clue.hasError() ? " Contains error." : "";
                        $(this).find('input').attr("aria-label", solvedString + revealedString + Clue.getAriaClueText() + ". " + Clue.getAriaCurrentString() + errorString);
                    }
                    else {
                        $(this).find('input').attr("aria-label","");
                    }
                });

            $('.crossword-clue', $crossword)
                .on('crossword-clue-complete', function(){
                    $(this).addClass('complete');
                })
                .on('crossword-clue-not-complete', function(){
                    $(this).removeClass('complete');
                });

            $('.active-clues-text', $crossword)
                .on('crossword-active', function(e, Clue){
                    // Try to copy clue html from dom.
                    // If no $clue, build html ourselves.
                    if (Clue['$clue']) {
                        var $clue_copy = $('<div class="active ' + Clue.dir + '">' + Clue['$clue'].html() + '</div>');
                        $clue_copy.data("real-clue", Clue['$clue']);
                        $clue_copy.click(function(){
                            $(this).data("real-clue").trigger("click");
                        });
                        $(this).html($clue_copy);
                    }
                    else {
                        var $clue = $('<div class="active ' + Clue.dir + '"><span class="numeral">' + Clue.numeral + '</span><span class="text"></span></div>');
                        $clue.find('.text').html(Clue.text);
                        $(this).html($clue);
                    }
                    if (Clue.references) {
                        for (var i = 0; i < Clue.references.length; i++) {
                            if (Clue.references[i]['$clue']) {
                                var $reference_copy = $('<div class="reference ' + Clue.references[i].dir + '">' + Clue.references[i]['$clue'].html() + '</div>');
                                $reference_copy.data("real-clue", Clue.references[i]['$clue']);
                                $reference_copy.click(function () {
                                    $(this).data("real-clue").trigger("click");
                                });
                                $(this).append($reference_copy);
                            }
                            else {
                                var $reference = $('<div class="reference ' + Clue.references[i].dir + '"><span class="numeral">' + Clue.references[i].numeral + '</span><span class="text"></span></div>');
                                $reference.find('.text').html(Clue.references[i].text);
                                $(this).append($reference);
                            }
                        }
                    }
                })
                .on('crossword-off', function() {
                    $(this).html(null);
                });

            $crossword
                .on('crossword-solved', function() {
                    $(this).addClass('crossword-solved');
                    console.log('The crossword puzzle has been solved.');
                })
                .on('crossword-revealed', function() {
                    $(this).addClass('crossword-revealed');
                    Drupal.behaviors.crossword.saveRevealed(data.id , 'revealed');
                })
                .on('crossword-clear', function() {
                    $(this).removeClass('crossword-solved').removeClass('crossword-revealed');
                    Drupal.behaviors.crossword.saveRevealed(data.id , '');
                });
        },
        renderCrossword: function ($crossword, data) {
            var $cwBox = $('#cw-box');
            var tableMarkup = [];
            tableMarkup.push('<table class="crossword-grid">');
            tableMarkup.push('<caption>');
            tableMarkup.push('test cw');
            tableMarkup.push('</caption>');

            //console.log('rowscount', data.puzzle.grid.length);
            var rowsCount = data.puzzle.grid.length;
            for (var i=0; i < rowsCount; i++) {
                tableMarkup.push('<tr class="crossword-row">');
                var row = data.puzzle.grid[i];
                var colsCount = row.length;
                //console.log('row', i, 'colcount', colsCount);
                for (var j=0; j < colsCount; j++) {
                    var col = row[j];
                    var tdClasses = [];
                    tdClasses.push('crossword-square');
                    if (col.fill === null) {
                        tdClasses.push('black');
                    }
                    if (col.bbar) {
                        tdClasses.push('bbar');
                    }
                    if (col.rbar) {
                        tdClasses.push('rbar');
                    }
                    var dataAttrs = [];
                    dataAttrs.push(`data-row="${i}"`);
                    dataAttrs.push(`data-col="${j}"`);
                    if (col.across !== undefined && col.across.index !== undefined) {
                        dataAttrs.push(`data-clue-index-across="${col.across.index}"`);
                    }
                    if (col.down !== undefined && col.down.index !== undefined) {
                        dataAttrs.push(`data-clue-index-down="${col.down.index}"`);
                    }
                    if (col.numeral !== undefined) {
                        dataAttrs.push(`data-numeral="${col.numeral}"`);
                    }
                    tableMarkup.push(`<td class="${tdClasses.join(' ')}" ${dataAttrs.join(' ')}>`);
                    tableMarkup.push(`<input id="sq_${i+1}_${j+1}" inputmode="none" type="text" lang="mr" class="phantom crossword-input" tabindex="-1">`);
                    if (col.numeral !== undefined) {
                        tableMarkup.push(`<span class="numeral">${col.numeral}</span>`);
                    }
                    tableMarkup.push(
`<div class="square-bulk"></div>
<div class="square-fill"></div>`
                    );
                    //tableMarkup.push('a');
                    tableMarkup.push('</td>');
                }
                tableMarkup.push('</tr>');
            }
            tableMarkup.push('</table>');
            $cwBox.append($(tableMarkup.join('')));

            var acrCluesMarkup = [];
            acrCluesMarkup.push('<ul class="ul-0">');
            var acrCluesCount = data.puzzle.clues.across.length;
            for (var i=0; i<acrCluesCount; i++) {
                var clue = data.puzzle.clues.across[i];
                var dataAttrs = [];
                dataAttrs.push(`data-clue-index-across="${i}"`);
                dataAttrs.push(`data-clue-numeral-across="${clue.numeral}"`);
                acrCluesMarkup.push(`<li class="crossword-clue li-0" ${dataAttrs.join(' ')}>`);
                acrCluesMarkup.push(`<span class="numeral">${clue.numeral}</span>`);
                acrCluesMarkup.push(clue.text);
                acrCluesMarkup.push('</li>');
            }
            $('.crossword-clues.across').append($(acrCluesMarkup.join('')));
            var dwnCluesMarkup = [];
            dwnCluesMarkup.push('<ul class="ul-0">');
            var dwnCluesCount = data.puzzle.clues.down.length;
            for (var i=0; i<dwnCluesCount; i++) {
                var clue = data.puzzle.clues.down[i];
                var dataAttrs = [];
                dataAttrs.push(`data-clue-index-down="${i}"`);
                dataAttrs.push(`data-clue-numeral-down="${clue.numeral}"`);
                dwnCluesMarkup.push(`<li class="crossword-clue li-0" ${dataAttrs.join(' ')}>`);
                dwnCluesMarkup.push(`<span class="numeral">${clue.numeral}</span>`);
                dwnCluesMarkup.push(clue.text);
                dwnCluesMarkup.push('</li>');
            }
            $('.crossword-clues.down').append($(dwnCluesMarkup.join('')));
        },
        rebusEntryActive: function(letter) {
            return $('.rebus-entry').prop('checked');
        },
        turnOffRebus: function() {
            $('.rebus-entry').prop('checked', false);
        },
        toggleRebus: function() {
            $('.rebus-entry').prop('checked', !$('.rebus-entry').prop('checked'));
        },
    }
})(jQuery, Drupal, once, drupalSettings);
console.log('crossword.js loaded');
