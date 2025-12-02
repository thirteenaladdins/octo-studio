const myCustomSketch = {
  setup: (p5) => {
    // Remove the canvas.parent() call - P5Canvas component handles it
    // p5.background(50);

    const morseMap = {
      A: ".-",
      B: "-...",
      C: "-.-.",
      D: "-..",
      E: ".",
      F: "..-.",
      G: "--.",
      H: "....",
      I: "..",
      J: ".---",
      K: "-.-",
      L: ".-..",
      M: "--",
      N: "-.",
      O: "---",
      P: ".--.",
      Q: "--.-",
      R: ".-.",
      S: "...",
      T: "-",
      U: "..-",
      V: "...-",
      W: ".--",
      X: "-..-",
      Y: "-.--",
      Z: "--..",
      1: ".----",
      2: "..---",
      3: "...--",
      4: "....-",
      5: ".....",
      6: "-....",
      7: "--...",
      8: "---..",
      9: "----.",
      0: "-----",
    };

    let message =
      "hello there the angel from my nightmare, the shadow in the background of the morgue";
    let seq = [];
    let units = 0;

    console.log(`Encoding message: ${message}`);

    for (let charIndex = 0; charIndex < message.length; charIndex++) {
      let char = message[charIndex].toUpperCase();
      let morse = morseMap[char] || "";
      console.log(`Char: ${char} -> Morse: ${morse}`);

      for (let symbolIndex = 0; symbolIndex < morse.length; symbolIndex++) {
        let symbol = morse[symbolIndex];
        if (symbol === ".") {
          seq.push({ type: "dot", units: 1 });
          units += 1;
          console.log(` Added dot (1 unit). Total units: ${units}`);
        } else if (symbol === "-") {
          seq.push({ type: "dash", units: 3 });
          units += 3;
          console.log(` Added dash (3 units). Total units: ${units}`);
        }
        if (symbolIndex < morse.length - 1) {
          seq.push({ type: "gap", units: 1 });
          units += 1;
          console.log(` Added gap (1 unit). Total units: ${units}`);
        }
      }

      if (charIndex < message.length - 1) {
        seq.push({ type: "lettergap", units: 3 });
        units += 3;
        console.log(` Added letter gap (3 units). Total units: ${units}`);
      }
    }

    console.log("Final sequence:", seq);
    console.log(`Total units: ${units}`);

    p5.sequence = seq;
    p5.totalUnits = units;
    p5.noLoop(); // Draw only once
  },

  draw: (p5) => {
    // p5.background(50);
    p5.strokeWeight(2);

    const margin = 20;
    // let x = p5.width / 2; // Start at center or adjust as you like
    let x = margin;

    let y = margin + 20;

    const unitHeight = 5; // Fixed unit height
    const columnSpacing = 40; // Space between columns

    // p5.rect(margin, margin, p5.width - 2 * margin, p5.height - 2 * margin);

    let usableHeight = p5.height - 2 * margin;

    let letterParts = [];
    let currentLetterParts = [];

    // Group parts into letters
    for (let part of p5.sequence) {
      currentLetterParts.push(part);
      if (part.type === "lettergap") {
        letterParts.push(currentLetterParts);
        currentLetterParts = [];
      }
    }
    if (currentLetterParts.length > 0) {
      letterParts.push(currentLetterParts);
    }

    for (let letter of letterParts) {
      // Calculate letter height
      let letterUnits = letter.reduce((sum, part) => sum + part.units, 0);
      let letterHeight = letterUnits * unitHeight;

      // Check if letter fits in remaining space
      if (y + letterHeight > margin + usableHeight) {
        // Move to next column
        x += columnSpacing;
        y = margin;
      }

      // Draw the letter parts
      for (let part of letter) {
        if (part.type === "dot") {
          p5.stroke(0, 0, 255); // blue dot
          p5.line(x, y, x, y + part.units * unitHeight);
        } else if (part.type === "dash") {
          p5.stroke(255, 0, 0); // red dash
          p5.line(x, y, x, y + part.units * unitHeight);
        } else {
          // gaps (symbol gap / lettergap)
          p5.stroke(100); // faint gray for gaps if you want to see them
          // Or skip line to leave empty space
        }
        y += part.units * unitHeight;
      }
    }
  },
};

export default myCustomSketch;
