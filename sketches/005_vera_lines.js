const morseEnhancedSketch = {
  setup: (p5) => {
    p5.noLoop();

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

    const message =
      "The tree has entered my hands, The sap has ascended my arms, The tree has grown in my breast - Downward, The branches grow out of me, like arms. Tree you are, Moss you are, You are violets with wind above them. A child - so high - you are, And all this is folly to the world.";

    let seq = [];

    for (let char of message.toUpperCase()) {
      let morse = morseMap[char] || "";

      if (char === " ") {
        seq.push({ type: "wordgap", units: 7 });
        continue;
      }

      for (let i = 0; i < morse.length; i++) {
        let symbol = morse[i];
        if (symbol === ".") {
          seq.push({ type: "dot", units: 1 });
        } else if (symbol === "-") {
          seq.push({ type: "dash", units: 3 });
        }

        if (i < morse.length - 1) {
          seq.push({ type: "gap", units: 1 });
        }
      }
      seq.push({ type: "lettergap", units: 3 });
    }

    p5.sequence = seq;
  },

  draw: (p5) => {
    if (p5.random() < 0.95) {
      p5.background(245, 245, 240); // off-white, Molnar-inspired

      const margin = 40;
      const unitSize = 12;
      const columnWidth = 30;
      const shapeWidth = columnWidth * 0.8;
      const offsetX = (columnWidth - shapeWidth) / 2;

      const maxColumns = Math.floor((p5.width - 2 * margin) / columnWidth);
      let columnCount = 1;

      let x = margin;
      let y = margin;

      for (let part of p5.sequence) {
        let h = part.units * unitSize;

        if (y + h > p5.height - margin) {
          if (columnCount >= maxColumns) break;
          x += columnWidth;
          y = margin;
          columnCount++;
        }

        // Vera Molnar-inspired: random omission or offset
        if (p5.random() < 0.08) {
          // 8% chance to skip a cell
          y += h;
          continue;
        }

        // Slight random offset for Molnar effect
        let dx = p5.random(-3, 3);
        let dy = p5.random(-3, 3);

        if (part.type === "dot" || part.type === "dash") {
          p5.noFill();
          p5.stroke(40, 40, 40, 120); // dark gray, semi-transparent
        } else {
          // p5.noFill(); // for gaps, do nothing
        }

        p5.push();
        p5.translate(x + offsetX + dx, y + dy);
        if (p5.random() < 0.1) {
          // 10% chance to rotate slightly
          p5.rotate(p5.radians(p5.random(-5, 5)));
        }
        p5.rect(0, 0, shapeWidth, h);
        p5.pop();

        y += h;
      }
    }
  },
};

export default morseEnhancedSketch;
