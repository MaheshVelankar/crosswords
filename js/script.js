const gridData = [
  ["H","O","T","#","#"],
  ["#","U","#","I","#"],
  ["#","N","#","C","#"],
  ["#","#","#","E","#"],
  ["#","#","#","#","#"]
];

const answers = {
  across: {
    1: { row: 0, col: 0, word: "HOT" },
    3: { row: 0, col: 0, word: "HOTTODAY" } // example placeholder
  },
  down: {
    1: { row: 0, col: 0, word: "SUN" },
    2: { row: 1, col: 3, word: "ICE" }
  }
};

const grid = document.getElementById("grid");

gridData.forEach((row, r) => {
  row.forEach((cell, c) => {
    const input = document.createElement("input");

    if (cell === "#") {
      input.disabled = true;
      input.className = "cell block";
    } else {
      input.maxLength = 1;
      input.className = "cell";
      input.dataset.row = r;
      input.dataset.col = c;
    }

    grid.appendChild(input);
  });
});
