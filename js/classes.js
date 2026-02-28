(function ($, Drupal, once, drupalSettings) {

  Drupal.Crossword = {

    Square: function(data, answer, Crossword) {
      this.Crossword = Crossword;
      this.row = data.row;
      this.column = data.col;
      // Note that a fill of null means a black square
      // while an empty string indicates a redacted answer.
      this.fill = data.fill;
      // For the answer, black squares contain empty string.
      this.answer = answer ? answer : "";
      this.numeral = data.numeral;
      this.across = data.across ? data.across.index : null;
      this.down = data.down ? data.down.index : null;
      this.moves = {
        'up' : false,
        'down' : false,
        'left' : false,
        'right' : false,
      };
      this.$square = null;

      this.connect = function($square) {
        this.$square = $square;
        Crossword.sendAnswerEvents(this);
      }

      // A black or redacted square cannot have an error.
      this.hasError = function() {
        return this.fill && this.answer && this.answer.toUpperCase() !== this.fill.toUpperCase();
      }

      // A black square is considered correct.
      this.isCorrect = function() {
        return this.isBlack() || (this.answer && this.fill && this.answer.toUpperCase() === this.fill.toUpperCase());
      }

      this.isEmpty = function() {
        return !this.isBlack() && this.answer === "";
      }

      this.isBlack = function() {
        return this.fill === null;
      }

      this.isRedacted = function() {
        return this.fill === "";
      }

      this.isLastLetter = function(dir) {
        return this == this[dir]['squares'][this[dir]['squares'].length - 1];
      }

      this.isFirstLetter = function(dir) {
        return this == this[dir]['squares'][0];
      }
    },

    Clue: function(data) {
      this.text = data.text;
      this.dir = data.dir;
      this.index = data.index;
      this.numeral = data.numeral;
      this.references = data.references; //starts as contstants. objects get added later
      this.squares = [];
      this.$clue = null;

      this.connect = function($clue) {
        this.$clue = $clue;
      }

      this.hasError = function() {
        for (var i = 0; i < this.squares.length; i++) {
          if (this.squares[i].hasError()) {
            return true;
          }
        }
        return false;
      }

      this.isCorrect = function() {
        for (var i = 0; i < this.squares.length; i++) {
          if (!this.squares[i].isCorrect()) {
            return false;
          }
        }
        return true;
      }

      this.isComplete = function() {
        for (var i = 0; i < this.squares.length; i++) {
          if (this.squares[i].isEmpty()) {
            return false;
          }
        }
        return true;
      }

      this.getAriaCurrentString = function() {
        var aria = "";
        var countString = this.squares.length + " letters.";
        var blank = true;
        for (var i = 0; i < this.squares.length; i++) {
          if (this.squares[i].answer) {
            aria += this.squares[i].answer.toUpperCase();
            blank = false;
          }
          else {
            aria += "blank";
          }
          aria += ". ";
        }
        if (blank) {
          return countString;
        }
        else {
          aria = aria.substring(0, aria.length - 1);
          return "Answer: " + countString + " " + aria;
        }
      }

      this.getAriaClueText = function() {
        return this.numeral + " " + this.dir + ". " + this.text.replace(/_{2,}/, "blank");
      }

      this.getAnswerLength = function() {
        return this.squares.length;
      }
    },

    Crossword: function(data, answers) {
      var Crossword = this;
      this.data = data;

      this.id = data.id;
      this.dir = 'across';
      this.activeSquare = {'row' : null, 'col': null};
      this.activeClue = null;
      this.activeReferences = [];
      this.answers = answers ? answers : emptyAnswers(); //the initial answers
      this.grid = makeGrid(this.answers);
      this.clues = makeClues();
      connectCluesAndSquares();
      this.stack = {
        'undo' : [],
        'redo' : [],
      };
      this.$crossword = null;
      this.$activeCluesText = null;
      this.solved = false;
      this.revealed = data.revealed;

      this.setActiveSquare = function(Square) {
        if (Square.fill !== null) {
          this.sendOffEvents();
          this.activeSquare = Square;
          if (!Square[this.dir]) {
            // Uncrossed square. Switch to useful direction.
            this.dir = this.dir == 'across' ? 'down' : 'across';
          }
          this.activeClue = Square[this.dir];
          this.activeReferences = Square[this.dir] ? Square[this.dir].references : [];
          this.sendOnEvents();
        }
        return this;
      }

      this.setActiveClue = function(Clue) {
        this.sendOffEvents();
        if (Clue !== null && Clue.dir !== null) {
          this.activeClue = Clue;
          this.dir = Clue.dir;
          this.activeSquare = Clue.squares[0];
          this.activeReferences = Clue.references;
        }
        this.sendOnEvents();
        return this;
      }

      this.changeDir = function() {
        this.dir = this.dir == 'across' ? 'down' : 'across';
        this.setActiveSquare(this.activeSquare);
        return this;
      }

      // "Move" is called directly by arrow keys.
      this.moveActiveSquare = function(move) {
        if (this.activeSquare.moves[move]) {
          this.setActiveSquare(this.activeSquare.moves[move]);
        }
        return this;
      }

      // Advance and retreat are used with movement that is NOT triggered
      // by the arrow keys.

      // If on last letter, go to next clue.
      this.advanceActiveSquare = function() {
        if (this.activeSquare.isLastLetter(this.dir)) {
          this.advanceToNextUnsolvedClue();
        }
        else {
          if (this.dir == 'across') {
            this.moveActiveSquare('right');
          }
          else {
            this.moveActiveSquare('down');
          }
        }
        return this;
      }

      // Retreat stops at the first letter.
      this.retreatActiveSquare = function() {
        if (this.activeSquare.isFirstLetter(this.dir)) {
          return this;
        }
        else {
          if (this.dir == 'across') {
            this.moveActiveSquare('left');
          }
          else {
            this.moveActiveSquare('up');
          }
        }
        return this;
      }

      this.advanceActiveClue = function() {
        if (this.activeClue) {
          if (this.clues[this.dir][this.activeClue.index + 1]) {
            this.setActiveClue(this.clues[this.dir][this.activeClue.index + 1]);
          }
          else {
            this.setActiveClue(this.clues[this.dir][0]);
          }
        }
        else {
          this.setActiveClue(this.clues[this.dir][0]);
        }
        return this;
      }

      this.retreatActiveClue = function() {
        if (this.activeClue) {
          if (this.clues[this.dir][this.activeClue.index - 1]) {
            this.setActiveClue(this.clues[this.dir][this.activeClue.index - 1]);
          }
          else {
            this.setActiveClue(this.clues[this.dir][this.clues[this.dir].length - 1]);
          }
        }
        else {
          this.setActiveClue(this.clues[this.dir][0]);
        }
        return this;
      }

      this.changeActiveClue = function(dir, change) {
        // change will be +/- 1
        if (dir == this.dir) {
          change > 0 ? this.advanceActiveClue() : this.retreatActiveClue();
        }
        else {
          this.changeDir();
        }
        return this;
      }

      this.advanceToNextUnsolvedClue = function(goToNextClue = false) {
        if (this.activeClue) {
          // Check the rest of clues in this direction.
          for (var i = this.activeClue.index + 1; i < this.clues[this.dir].length; i++) {
            if (this.clues[this.dir][i]) {
              if (goToNextClue || (this.showingErrors() && this.clues[this.dir][i].hasError()) || !this.clues[this.dir][i].isComplete()) {
                this.setActiveClue(this.clues[this.dir][i]);
                return this;
              }
            }
          }
          // Go to other direction and check all clues.
          var other_dir = this.dir == 'across' ? 'down' : 'across';
          for (var i = 0; i < this.clues[other_dir].length; i++) {
            if (this.clues[other_dir][i]) {
              if (goToNextClue || (this.showingErrors() && this.clues[other_dir][i].hasError()) || !this.clues[other_dir][i].isComplete()) {
                this.setActiveClue(this.clues[other_dir][i]);
                return this;
              }
            }
          }
          // Check start of clues in this direction.
          for (var i = 0; i < this.activeClue.index; i++) {
            if (this.clues[this.dir][i]) {
              if ((this.showingErrors() && this.clues[this.dir][i].hasError()) || !this.clues[this.dir][i].isComplete()) {
                this.setActiveClue(this.clues[this.dir][i]);
                return this;
              }
            }
          }
        }
        else {
          this.setActiveClue(this.clues[this.dir][0]);
        }
        // If we haven't returned we simply advance to the next clue.
        return this.advanceToNextUnsolvedClue(true);
      }

      this.retreatToPreviousUnsolvedClue = function(goToPreviousClue = false) {
        if (this.activeClue) {
          // Check the rest of clues in this direction.
          for (var i = this.activeClue.index - 1; i >= 0; i--) {
            if (this.clues[this.dir][i]) {
              if (goToPreviousClue || (this.showingErrors() && this.clues[this.dir][i].hasError()) || !this.clues[this.dir][i].isComplete()) {
                this.setActiveClue(this.clues[this.dir][i]);
                return this;
              }
            }
          }
          // Go to other direction and check all clues.
          var other_dir = this.dir == 'across' ? 'down' : 'across';
          for (var i = this.clues[other_dir].length - 1; i >= 0; i--) {
            if (this.clues[other_dir][i]) {
              if (goToPreviousClue || (this.showingErrors() && this.clues[other_dir][i].hasError()) || !this.clues[other_dir][i].isComplete()) {
                this.setActiveClue(this.clues[other_dir][i]);
                return this;
              }
            }
          }
          // Check end of clues in this direction.
          for (var i = this.clues[this.dir].length - 1; i > this.activeClue.index; i--) {
            if (this.clues[this.dir][i]) {
              if (goToPreviousClue || (this.showingErrors() && this.clues[this.dir][i].hasError()) || !this.clues[this.dir][i].isComplete()) {
                this.setActiveClue(this.clues[this.dir][i]);
                return this;
              }
            }
          }
        }
        else {
          this.setActiveClue(this.clues[this.dir][0]);
        }
        // If we haven't returned we simply advance to the previous clue.
        return this.retreatToPreviousUnsolvedClue(true);
      }

      this.focus = function() {
        if (this.activeSquare && this.activeSquare['$square']) {
          this.activeSquare['$square'].trigger('crossword-focus');
        }
        return this;
      }

      this.escape = function() {
        this.sendOffEvents();
        this.activeClue = null;
        this.activeSquare = null
        this.activeReferences = null;
        return this;
      }

      this.setAnswer = function(letter, rebus, undo, redo, complete='yes', propagate='yes') {
        if (rebus) {
          // Rebus means there can be more than one letter in the square.
          // Backspace gets handled special.
          if (!letter) {
            // Backspace.
            this.activeSquare.answer = this.activeSquare.answer ? this.activeSquare.answer.substring(0, this.activeSquare.answer.length - 1) : "";
          }
          else {
            // Not backspace.
            this.activeSquare.answer = this.activeSquare.answer ? this.activeSquare.answer + letter : letter;
          }
          if (!(undo || redo)) {
            this.stack.undo.push({'square' : this.activeSquare, 'letter' : this.activeSquare.answer});
            this.stack.redo = [];
          }
          this.sendAnswerEvents(this.activeSquare);
        }
        else {
          if (!(undo || redo)) {
            this.stack.undo.push({'square' : this.activeSquare, 'letter' : this.activeSquare.answer});
            this.stack.redo = [];
          }
          this.activeSquare.answer = letter;
          this.sendAnswerEvents(this.activeSquare, complete);
          if (!undo) {
            if (letter === "") {
              this.retreatActiveSquare();
            }
            else {
              if (propagate == 'yes') {
                this.advanceActiveSquare();
              }
            }
          }
        }
        return this;
      }

      this.cheat = function() {
        if (this.activeSquare && this.activeSquare.fill) {
          this.sendCheatEvents(this.activeSquare);
          this.setAnswer(this.activeSquare.fill);
        }
        return this;
      }

      this.undo = function() {
        if (this.stack.undo.length) {
          var oldState = this.stack.undo.pop();
          this.stack.redo.push({'square' : oldState.square, 'letter' : oldState.square.answer });
          this.setActiveSquare(oldState.square);
          this.setAnswer(oldState.letter, false, true);
        }
        return this;
      }

      this.redo = function() {
        if (this.stack.redo.length) {
          var oldState = this.stack.redo.pop();
          this.stack.undo.push({'square' : oldState.square, 'letter' : oldState.square.answer });
          this.setActiveSquare(oldState.square);
          this.setAnswer(oldState.letter, false, false, true);
        }
        return this;
      }

      this.reveal = function() {
        this.revealed = true;
        for (var row_index = 0; row_index < this.grid.length; row_index++) {
          for (var col_index = 0; col_index < this.grid[row_index].length; col_index++) {
            var Square = this.grid[row_index][col_index];
            if (Square.isRedacted()) {
              // We jump out if puzzle is redacted.
              return this;
            }
            if (!Square.isBlack() && !Square.isRedacted() && Square.answer.toUpperCase() !== Square.fill.toUpperCase()) {
              Square.answer = Square.fill;
              this.sendCheatEvents(Square);
              this.sendAnswerEvents(Square);
            }
          }
        }
        if (!this.solved && this.$crossword) {
          this.$crossword.trigger('crossword-revealed');
        }
        return this;
      }

      // Note that this function should return an array that matches the format
      // of the array returned by CrosswordDataService::getSolution(). The idea
      // is to use getAnswers() on the FE and getSolution() on the BE in the
      // scenario where the solution is not exposed publicly to the FE.
      this.getAnswers = function() {
        var answers = [];
        for (var $row_index = 0; $row_index < this.grid.length; $row_index++) {
          answers[$row_index] = [];
          for (var $col_index = 0; $col_index < this.grid[$row_index].length; $col_index++) {
            answers[$row_index][$col_index] = this.grid[$row_index][$col_index].answer;
          }
        }
        return answers;
      }

      this.clear = function() {
        this.setAnswers(emptyAnswers());
        this.revealed = false;
        this.solved = false;
        if (this.$crossword) {
          this.$crossword.trigger('crossword-clear');
        }
        return this;
      }

      this.setAnswers = function(answers) {
        this.stack.undo = [];
        for (var $row_index = 0; $row_index < this.grid.length; $row_index++) {
          for (var $col_index = 0; $col_index < this.grid[$row_index].length; $col_index++) {
            this.grid[$row_index][$col_index].answer = answers[$row_index][$col_index];
            this.sendAnswerEvents(this.grid[$row_index][$col_index]);
          }
        }
        return this;
      }

      this.isSolved = function() {
        for (var $row_index = 0; $row_index < this.grid.length; $row_index++) {
          for (var $col_index = 0; $col_index < this.grid[$row_index].length; $col_index++) {
            var Square = this.grid[$row_index][$col_index];
            // If any squares are redacted, this can't decide that it's solved.
            if (Square.isRedacted() || (!Square.isCorrect() && !Square.isBlack())) {
              return false;
            }
          }
        }
        this.solved = true;
        return true;
      }

      this.showingErrors = function() {
        return this.$crossword.hasClass('show-errors');
      }

      this.countBlankSquares = function() {
        var count = 0;
        for (var $row_index = 0; $row_index < this.grid.length; $row_index++) {
          for (var $col_index = 0; $col_index < this.grid[$row_index].length; $col_index++) {
            if (this.grid[$row_index][$col_index].isEmpty()) {
              count++;
            }
          }
        }
        return count;
      }

      /**
       * Functions that trigger events on dom elements.
       */
      this.sendOffEvents = function(){
        if (this.activeClue) {
          if (this.$activeCluesText) {
            this.$activeCluesText.trigger('crossword-off');
          }
          if (this.activeClue['$clue']) {
            this.activeClue['$clue'].trigger('crossword-off');
          }
          this.activeClue.squares.forEach(function(item, index){
            if (item['$square']) {
              item['$square'].trigger('crossword-off');
            }
          });
          if(this.activeReferences) {
            this.activeReferences.forEach(function(clue, index){
              if (clue['$clue']) {
                clue['$clue'].trigger('crossword-off');
              }
              clue.squares.forEach(function(item, index){
                if (item['$square']) {
                  item['$square'].trigger('crossword-off');
                }
              });
            });
          }
        }
        if (this.activeSquare && this.activeSquare['$square']) {
          this.activeSquare['$square'].trigger('crossword-off');
        }
      }

      this.sendOnEvents = function(){
        if (this.activeClue) {
          if (this.$activeCluesText) {
            this.$activeCluesText.trigger('crossword-active', [this.activeClue]);
          }
          if (this.activeClue['$clue']) {
            this.activeClue['$clue'].trigger('crossword-active');
          }
          this.activeClue.squares.forEach(function(item, index){
            if (item['$square']) {
              item['$square'].trigger('crossword-highlight');
            }
          });
          if(this.activeReferences) {
            this.activeReferences.forEach(function(clue, index){
              if (clue['$clue']) {
                clue['$clue'].trigger('crossword-reference');
              }
              clue.squares.forEach(function(item, index){
                if (item['$square']) {
                  item['$square'].trigger('crossword-reference');
                }
              });
            });
          }
        }
        if (this.activeSquare && this.activeSquare['$square']) {
          this.activeSquare['$square'].trigger('crossword-active');
        }
      }

      this.sendAnswerEvents = function(Square, complete="yes"){
        if (Square && Square['$square']) {
          Square['$square'].trigger('crossword-answer', [Square.answer]);
          //console.log('complete: '+ complete + ', has error: ' + Square.hasError());
          if (complete === "yes" && Square.hasError()) {
          //console.log('will flag error');
            Square['$square'].trigger('crossword-error');
          }
          else {
            Square['$square'].trigger('crossword-ok');
          }
//          if (Square.answer.length > 1) {
//            Square['$square'].trigger('crossword-rebus');
//         }
//         else {
              Square['$square'].trigger('crossword-not-rebus');
//         }

          // now the clues
          if (Square.down && Square.down['$clue']) {
            Square.down['$clue'].trigger('crossword-aria-update');
            if (complete === "yes" && Square.down.hasError()) {
              Square.down['$clue'].trigger('crossword-error');
            }
            else {
              Square.down['$clue'].trigger('crossword-ok');
            }
            if (Square.down.isComplete()) {
              Square.down['$clue'].trigger('crossword-clue-complete');
            }
            else {
              Square.down['$clue'].trigger('crossword-clue-not-complete');
            }
          }
          if (Square.across && Square.across['$clue']) {
            Square.across['$clue'].trigger('crossword-aria-update');
            if (complete === "yes" && Square.across.hasError()) {
              Square.across['$clue'].trigger('crossword-error');
            }
            else {
              Square.across['$clue'].trigger('crossword-ok');
            }
            if (Square.across.isComplete()) {
              Square.across['$clue'].trigger('crossword-clue-complete');
            }
            else {
              Square.across['$clue'].trigger('crossword-clue-not-complete');
            }
          }
        }
        if (!this.solved && !this.revealed && !Square.isRedacted() && this.isSolved()) {
          if (this.$crossword) {
            this.$crossword.trigger('crossword-solved');
          }
        }
      }

      this.sendCheatEvents = function(Square){
        if (Square && Square['$square']) {
          Square['$square'].trigger('crossword-cheat');
          if (Square.across && Square.across['$clue']) {
            Square.across['$clue'].trigger('crossword-cheat');
          }
          if (Square.down && Square.down['$clue']) {
            Square.down['$clue'].trigger('crossword-cheat');
          }
        }
      }

      /**
       * Internal functions for initialization.
       */
      function emptyAnswers() {
        var grid = Crossword.data.puzzle.grid;
        var answers = [];
        for (var row_index = 0; row_index < grid.length; row_index++) {
          answers.push([]);
          for (var col_index = 0; col_index < grid[row_index].length; col_index++) {
            answers[row_index].push('');
          }
        }
        return answers;
      }

      function makeGrid(answers) {
        var grid = [];
        var data_grid = Crossword.data.puzzle.grid;

        // start by creating objects
        for (var row_index = 0; row_index < data_grid.length; row_index++) {
          var row = [];
          for (var col_index = 0; col_index < data_grid[row_index].length; col_index++) {
            row[col_index] = new Drupal.Crossword.Square(data_grid[row_index][col_index], answers[row_index][col_index], Crossword);
          }
          grid.push(row);
        }
        // now connect the moves
        for (var row_index = 0; row_index < data_grid.length; row_index++) {
          for (var col_index = 0; col_index < data_grid[row_index].length; col_index++) {
            var square = grid[row_index][col_index];
            for (move in data_grid[row_index][col_index]['moves']) {
              if (data_grid[row_index][col_index]['moves'][move]) {
                square.moves[move] = grid[data_grid[row_index][col_index]['moves'][move].row][data_grid[row_index][col_index]['moves'][move].col];
              }
            }
          }
        }
        return grid;
      }

      function makeClues() {
        var clues = {
          'across' : [],
          'down' : [],
        };
        var dirs = {'across' : true, 'down' : true};
        for (var dir in dirs) {
          var data_clues = Crossword.data.puzzle.clues[dir];
          for (var i = 0; i < data_clues.length; i++) {
            data_clues[i].index = i;
            data_clues[i].dir = dir;
            clues[dir].push(new Drupal.Crossword.Clue(data_clues[i]));
          }
        }

        // connect references
        for (var dir in dirs) {
          for (var i = 0; i < clues[dir].length; i++) {
            if (clues[dir][i].references) {
              var realRefs = [];
              var refs = clues[dir][i].references
              for (var ref_index in refs) {
                realRefs.push(clues[refs[ref_index].dir][refs[ref_index].index]);
              }
              clues[dir][i].references = realRefs;
            }
          }
        }
        return clues;
      }

      function connectCluesAndSquares() {
        var grid = Crossword.grid;
        var clues = Crossword.clues;
        var dirs = {'across' : true, 'down' : true};

        for (var row_index = 0; row_index < grid.length; row_index++) {
          for (var col_index = 0; col_index < grid[row_index].length; col_index++) {
            var Square = grid[row_index][col_index];
            for (var dir in dirs) {
              if (Square[dir] !== null) {
                clues[dir][Square[dir]]['squares'].push(Square);
                Square[dir] = clues[dir][Square[dir]];
              }
            }
          }
        }
      }

      // A funny thing for initialization that doesn't have anywhere nice to go.
      this.setActiveClue(this.clues.across[0]);
    }
  }

})(jQuery, Drupal, once, drupalSettings);
