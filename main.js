const pdfjsLib = window["pdfjs-dist/build/pdf"];

const pdfViewer = document.getElementById("pdf-viewer");
const pdfUrl = "./Building microfontends.pdf"; // Replace with the path to your PDF file
const initialScrollTop = localStorage.getItem("scrollTop" || 0);
const html = document.querySelector("html");

// Set the worker source (adjust the path as needed)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "./node_modules/pdfjs-dist/build/pdf.worker.min.js";

const highlightWords = JSON.parse(
  localStorage.getItem("highlightWords") || "[]"
);

const mapHighlightWords = new Map(highlightWords);

const addNewHighlightWord = (word) => {
  const trimmed = word.trim();
  if (!trimmed) {
    return;
  }

  mapHighlightWords.set(trimmed, {
    value: trimmed,
    color: generateRandomLowLightColor(),
  });

  renderWordTrunk();
  _highlightText();

  localStorage.setItem(
    "highlightWords",
    JSON.stringify(Array.from(mapHighlightWords))
  );
};

const deleteHighlightWord = (word) => {
  console.log("deleteHighlightWord");
  mapHighlightWords.delete(word);
  localStorage.setItem(
    "highlightWords",
    JSON.stringify(Array.from(mapHighlightWords))
  );
  renderWordTrunk();
};

function generateRandomLowLightColor() {
  const minBrightness = 50; // Adjust as needed
  const maxBrightness = 255; // Adjust as needed

  const randomComponent = () =>
    Math.floor(
      Math.random() * (maxBrightness - minBrightness + 1) + minBrightness
    );

  // Generate random color components
  const red = randomComponent();
  const green = randomComponent();
  const blue = randomComponent();

  // Convert components to hexadecimal format
  const color = `#${red.toString(16)}${green.toString(16)}${blue.toString(16)}`;

  return color;
}

// Generate a random low-light color
const randomLowLightColor = generateRandomLowLightColor();

const renderListHighlightWords = () => {
  const listSpan = [];
  mapHighlightWords.forEach((value) => {
    listSpan.push(highlightWordSpan(value));
  });
  return `<div id="highlight-trunk">
  ${listSpan.join("")}
  </div>`;
};

const highlightWordSpan = (word) => {
  return `<span class="word-highlight" style="color: ${word.color};background: ${word.color}44">${word.value}</span>`;
};

const renderWordTrunk = () => {
  const listWordElement = document.getElementById("list-word");
  listWordElement.innerHTML = renderListHighlightWords();
  listWordElement.querySelectorAll(".word-highlight").forEach((element) => {
    element.addEventListener("click", () => {
      console.log("delete word");
      deleteHighlightWord(element.innerHTML);
    });
  });
};

renderWordTrunk();

const _highlightText = async () => {
  console.time("highlight");
  document.querySelectorAll("#pdf-viewer span").forEach((element) => {
    mapHighlightWords.forEach((word) => {
      if (element.innerText.toLowerCase().includes(word.value.toLowerCase())) {
        let innerElement = element.innerHTML;
        element.childNodes.forEach((node) => {
          if (
            node.data &&
            node.data?.toLowerCase().includes(word.value.toLowerCase())
          ) {
            const updateText = node.data
              .split(" ")
              .map((text) => {
                if (text.toLowerCase() === word.value.toLowerCase()) {
                  return `<span style="font:inherit; letter-spacing: inherit;background: ${word.color}22;">${word.value}</span>`;
                }
                return text;
              })
              .join(" ");

            innerElement = innerElement.replace(node.data, updateText);
          }
        });
        element.innerHTML = innerElement;
      }
    });
  });
  console.timeEnd("highlight");
};

if (!pdfViewer.childNodes.length) {
  pdfjsLib.getDocument(pdfUrl).promise.then((pdfDoc) => {
    const numPages = 20 || pdfDoc.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      pdfDoc.getPage(pageNum).then((pdfPage) => {
        const canvas = document.createElement("canvas");
        const pageSection = document.createElement("section");
        pageSection.appendChild(canvas);

        const context = canvas.getContext("2d");
        const viewport = pdfPage.getViewport({ scale: 2 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        pdfPage.getTextContent().then((textContent) => {
          const fontFamilyMap = new Map();
          Object.keys(textContent.styles).forEach((key) => {
            fontFamilyMap.set(key, textContent.styles[key]);
          });
          for (let i = 0; i < textContent.items.length; i++) {
            const textItem = textContent.items[i];

            const text = textItem.str;
            const textRect = textItem.transform;
            if (text) {
              const styles = fontFamilyMap.get(textItem.fontName);
              highlightText({
                rect: textRect,
                width: textItem.width,
                height: textItem.height,
                container: pageSection,
                text,
                styles,
              });
            }
          }
          mapHighlightWords.forEach((word) => {
            if (
              JSON.stringify(textContent.items)
                .toLowerCase()
                .includes(word.value.toLowerCase())
            ) {
              _highlightText();
            }
          });
        });
        pdfViewer.appendChild(pageSection);

        pdfPage
          .render({ canvasContext: context, viewport: viewport })
          .promise.then(() => {
            html.scrollTo(0, Number(initialScrollTop));
          });
      });
    }
  });
}

function highlightText({ rect, width, height, container, text, styles }) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.background = "transparent"; // Highlight color
  div.style.opacity = "1"; // Highlight opacity
  div.style.left = `${rect[4] * 2}px`; // X-coordinate
  div.style.bottom = `${rect[5] * 2 + styles.ascent}px`; // Y-coordinate
  div.style.width = width * 2 + "px"; // Width
  // div.style.height = `${height * 2}px`; // Height
  div.style.fontSize = height * 2 - 1 + "px";
  div.style.display = "flex";
  div.style.background = "white";
  div.innerHTML = `<span style="font:inherit; color:black; letter-spacing:${
    styles.ascent + styles.descent
  }px">${text}</span>`;
  div.style.fontFamily = styles.fontFamily;
  div.style.whiteSpace = "nowrap";

  container.appendChild(div);
}

function getSelectedText() {
  const selection = document.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    return range.toString();
  } else {
    return null; // No text is selected
  }
}

// Example usage

window.addEventListener("dblclick", (e) => {
  const selectedText = getSelectedText();
  if (selectedText) {
    addNewHighlightWord(selectedText);
  } else {
    console.log("No text selected.");
  }
});

window.addEventListener("scroll", (e) => {
  localStorage.setItem("scrollTop", html.scrollTop);
});
