"use strict";

/* =========================================================
   FILEFOX V2
   Stable browser-only JavaScript
   No TensorFlow / MediaPipe dependency
========================================================= */


/* ---------- BASIC HELPERS ---------- */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


const modal = $("#modal");
const modalContent = $("#modalContent");
const modalClose = $("#modalClose");
const modalBackdrop = $("#modalBackdrop");
const toolsGrid = $("#toolsGrid");
const searchInput = $("#toolSearch");
const count = $("#toolCount");
const year = $("#year");
const themeBtn = $("#themeBtn");


/* ---------- STARTUP ---------- */

year.textContent = new Date().getFullYear();

count.textContent =
  `${$$(".tool-card").length} tools`;


/* ---------- THEME ---------- */

const savedTheme =
  localStorage.getItem("filefox-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀";
}

themeBtn.onclick = () => {
  document.body.classList.toggle("dark");

  const dark =
    document.body.classList.contains("dark");

  localStorage.setItem(
    "filefox-theme",
    dark ? "dark" : "light"
  );

  themeBtn.textContent =
    dark ? "☀" : "☾";
};


/* ---------- SEARCH ---------- */

searchInput.addEventListener("input", () => {

  const q =
    searchInput.value.trim().toLowerCase();

  let visible = 0;

  $$(".tool-card").forEach(card => {

    const text =
      (card.dataset.search || "")
        .toLowerCase();

    const show =
      !q || text.includes(q);

    card.style.display =
      show ? "" : "none";

    if (show) visible++;
  });

  count.textContent =
    q
      ? `${visible} matching tools`
      : `${$$(".tool-card").length} tools`;
});


/* ---------- MODAL ---------- */

function openModal(html) {

  modalContent.innerHTML = html;

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  document.body.style.overflow = "hidden";
}


function closeModal() {

  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");

  modalContent.innerHTML = "";

  document.body.style.overflow = "";
}


modalClose.onclick = closeModal;
modalBackdrop.onclick = closeModal;

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal();
  }
});


/* ---------- EVENT DELEGATION ---------- */

toolsGrid.addEventListener("click", event => {

  const button =
    event.target.closest(".tool-btn");

  if (!button) return;

  const action =
    button.dataset.action;

  try {

    if (action === "image") {
      imageTool(button.dataset.type);

    } else if (action === "compress") {
      compressTool();

    } else if (action === "resize") {
      resizeTool();

    } else if (action === "crop") {
      cropTool();

    } else if (action === "rotate") {
      rotateTool();

    } else if (action === "flip") {
      flipTool();

    } else if (action === "enhance") {
      enhanceTool();

    } else if (action === "background") {
      backgroundTool();

    } else if (action === "pdf") {
      pdfTool();

    } else if (action === "qr") {
      qrTool();

    } else if (action === "text") {
      textTool(button.dataset.textTool);

    } else if (action === "password") {
      passwordTool();

    } else if (action === "calculator") {
      calculatorTool();
    }

  } catch (error) {

    console.error(error);

    showError(
      "Something went wrong. Please try again."
    );
  }
});


/* =========================================================
   FILE / IMAGE HELPERS
========================================================= */

function filePicker(accept = "image/*") {

  return new Promise((resolve, reject) => {

    const input =
      document.createElement("input");

    input.type = "file";
    input.accept = accept;

    input.onchange = () => {

      const file = input.files?.[0];

      if (!file) {
        reject(
          new Error("No file selected.")
        );
        return;
      }

      resolve(file);
    };

    input.click();
  });
}


function readDataURL(file) {

  return new Promise((resolve, reject) => {

    const reader =
      new FileReader();

    reader.onload = () =>
      resolve(reader.result);

    reader.onerror = () =>
      reject(
        new Error("Could not read the file.")
      );

    reader.readAsDataURL(file);
  });
}


function loadImage(src) {

  return new Promise((resolve, reject) => {

    const img =
      new Image();

    img.onload = () =>
      resolve(img);

    img.onerror = () =>
      reject(
        new Error("Could not decode this image.")
      );

    img.src = src;
  });
}


function canvasBlob(
  canvas,
  type = "image/png",
  quality = .9
) {

  return new Promise((resolve, reject) => {

    canvas.toBlob(
      blob => {

        if (!blob) {
          reject(
            new Error("Image export failed.")
          );
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}


function downloadBlob(blob, filename) {

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}


function formatBytes(bytes) {

  if (!bytes) return "0 B";

  const units =
    ["B", "KB", "MB", "GB"];

  const i =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return (
    (bytes /
      Math.pow(1024, i))
      .toFixed(i ? 1 : 0)
    + " "
    + units[i]
  );
}


function safeDimension(
  width,
  height,
  max = 2600
) {

  const largest =
    Math.max(width, height);

  if (largest <= max) {
    return {
      width,
      height
    };
  }

  const ratio =
    max / largest;

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}


function makeCanvas(width, height) {

  const canvas =
    document.createElement("canvas");

  canvas.width =
    Math.max(1, Math.round(width));

  canvas.height =
    Math.max(1, Math.round(height));

  return canvas;
}


/* =========================================================
   COMMON IMAGE UI
========================================================= */

function imagePickerUI(
  title,
  subtitle,
  buttonText = "Choose image"
) {

  return `
    <h2 class="modal-title">${escapeHTML(title)}</h2>

    <p class="modal-subtitle">
      ${escapeHTML(subtitle)}
    </p>

    <div class="drop-zone">
      <button class="choose-btn" id="chooseFile">
        ${escapeHTML(buttonText)}
      </button>

      <p class="status" id="fileStatus">
        JPG, PNG or WebP
      </p>
    </div>

    <div id="workArea"></div>
  `;
}


/* =========================================================
   IMAGE CONVERSION
========================================================= */

const conversionConfig = {

  "jpg-png": {
    title: "JPG → PNG",
    output: "image/png",
    ext: "png"
  },

  "png-jpg": {
    title: "PNG → JPG",
    output: "image/jpeg",
    ext: "jpg"
  },

  "jpg-webp": {
    title: "JPG → WebP",
    output: "image/webp",
    ext: "webp"
  },

  "png-webp": {
    title: "PNG → WebP",
    output: "image/webp",
    ext: "webp"
  },

  "webp-jpg": {
    title: "WebP → JPG",
    output: "image/jpeg",
    ext: "jpg"
  },

  "webp-png": {
    title: "WebP → PNG",
    output: "image/png",
    ext: "png"
  }
};


function imageTool(type) {

  const config =
    conversionConfig[type];

  if (!config) return;

  openModal(
    imagePickerUI(
      config.title,
      "Select an image and convert it directly in your browser."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      const size =
        safeDimension(
          img.naturalWidth,
          img.naturalHeight
        );

      $("#fileStatus").textContent =
        `${file.name} • ${formatBytes(file.size)}`;

      $("#workArea").innerHTML = `

        <img
          class="preview"
          id="imagePreview"
          alt="Preview">

        <div class="stats">
          <div class="stat">
            <strong>${img.naturalWidth}</strong>
            <small>Original width</small>
          </div>

          <div class="stat">
            <strong>${img.naturalHeight}</strong>
            <small>Original height</small>
          </div>

          <div class="stat">
            <strong>${formatBytes(file.size)}</strong>
            <small>Original size</small>
          </div>
        </div>

        <div class="result-actions">
          <button class="primary-btn" id="convertBtn">
            Convert to ${config.ext.toUpperCase()}
          </button>
        </div>

        <div id="result"></div>
      `;

      $("#imagePreview").src =
        src;

      $("#convertBtn").onclick =
        async () => {

          try {

            $("#convertBtn").disabled =
              true;

            $("#convertBtn").textContent =
              "Processing...";

            const canvas =
              makeCanvas(
                size.width,
                size.height
              );

            const ctx =
              canvas.getContext("2d");

            if (config.output === "image/jpeg") {

              ctx.fillStyle = "#ffffff";

              ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
              );
            }

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const blob =
              await canvasBlob(
                canvas,
                config.output,
                .92
              );

            downloadBlob(
              blob,
              "filefox-converted."
              + config.ext
            );

            $("#result").innerHTML = `
              <div class="result">
                <strong>✓ Conversion complete</strong>
                <div class="status">
                  ${formatBytes(blob.size)}
                </div>
              </div>
            `;

          } catch (error) {

            showError(
              error.message
            );

          } finally {

            $("#convertBtn").disabled =
              false;

            $("#convertBtn").textContent =
              `Convert to ${config.ext.toUpperCase()}`;
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   COMPRESSOR
========================================================= */

function compressTool() {

  openModal(
    imagePickerUI(
      "Image Compressor",
      "Reduce image size with adjustable quality."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#fileStatus").textContent =
        `${file.name} • ${formatBytes(file.size)}`;

      $("#workArea").innerHTML = `

        <img class="preview" id="compressPreview">

        <div class="tool-controls">

          <div class="control">
            <label>
              Quality:
              <strong id="qualityValue">80</strong>%
            </label>

            <input
              id="quality"
              type="range"
              min="20"
              max="100"
              value="80">
          </div>

          <button class="primary-btn" id="compressBtn">
            Compress image
          </button>

        </div>

        <div id="compressResult"></div>
      `;

      $("#compressPreview").src =
        src;

      $("#quality").oninput = () => {

        $("#qualityValue").textContent =
          $("#quality").value;
      };

      $("#compressBtn").onclick =
        async () => {

          try {

            const quality =
              Number(
                $("#quality").value
              ) / 100;

            const size =
              safeDimension(
                img.naturalWidth,
                img.naturalHeight,
                2400
              );

            const canvas =
              makeCanvas(
                size.width,
                size.height
              );

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const type =
              file.type === "image/png"
                ? "image/webp"
                : "image/jpeg";

            const ext =
              type === "image/webp"
                ? "webp"
                : "jpg";

            const blob =
              await canvasBlob(
                canvas,
                type,
                quality
              );

            downloadBlob(
              blob,
              `filefox-compressed.${ext}`
            );

            const saved =
              file.size > blob.size
                ? Math.round(
                    (1 - blob.size / file.size) * 100
                  )
                : 0;

            $("#compressResult").innerHTML = `
              <div class="result">
                <strong>✓ Done</strong>
                <div class="status">
                  Original: ${formatBytes(file.size)}
                  <br>
                  New: ${formatBytes(blob.size)}
                  <br>
                  Approx. reduction: ${saved}%
                </div>
              </div>
            `;

          } catch (error) {

            showError(
              error.message
            );
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   RESIZER
========================================================= */

function resizeTool() {

  openModal(
    imagePickerUI(
      "Image Resizer",
      "Choose an image and set its exact dimensions."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#fileStatus").textContent =
        `${file.name} • ${formatBytes(file.size)}`;

      $("#workArea").innerHTML = `

        <img class="preview" id="resizePreview">

        <div class="tool-controls">

          <div class="control">
            <label>Width</label>
            <input
              id="newWidth"
              type="number"
              min="1"
              value="${img.naturalWidth}">
          </div>

          <div class="control">
            <label>Height</label>
            <input
              id="newHeight"
              type="number"
              min="1"
              value="${img.naturalHeight}">
          </div>

          <button class="primary-btn" id="resizeBtn">
            Resize & Download
          </button>

        </div>

        <div id="resizeResult"></div>
      `;

      $("#resizePreview").src =
        src;

      $("#resizeBtn").onclick =
        async () => {

          try {

            const width =
              Number($("#newWidth").value);

            const height =
              Number($("#newHeight").value);

            if (
              !width ||
              !height ||
              width < 1 ||
              height < 1
            ) {
              throw new Error(
                "Enter valid dimensions."
              );
            }

            if (
              width > 5000 ||
              height > 5000
            ) {
              throw new Error(
                "Maximum dimension is 5000px."
              );
            }

            const canvas =
              makeCanvas(
                width,
                height
              );

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              0,
              0,
              width,
              height
            );

            const blob =
              await canvasBlob(
                canvas,
                "image/png"
              );

            downloadBlob(
              blob,
              "filefox-resized.png"
            );

            $("#resizeResult").innerHTML =
              `<div class="result">✓ Image resized successfully.</div>`;

          } catch (error) {

            showError(
              error.message
            );
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   CROP
========================================================= */

function cropTool() {

  openModal(
    imagePickerUI(
      "Image Cropper",
      "Set X, Y, width and height for your crop."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#workArea").innerHTML = `

        <img class="preview" id="cropPreview">

        <div class="tool-controls">

          <div class="control">
            <label>X</label>
            <input id="cropX" type="number" value="0" min="0">
          </div>

          <div class="control">
            <label>Y</label>
            <input id="cropY" type="number" value="0" min="0">
          </div>

          <div class="control">
            <label>Width</label>
            <input
              id="cropW"
              type="number"
              value="${img.naturalWidth}"
              min="1">
          </div>

          <div class="control">
            <label>Height</label>
            <input
              id="cropH"
              type="number"
              value="${img.naturalHeight}"
              min="1">
          </div>

          <button class="primary-btn" id="cropBtn">
            Crop & Download
          </button>

        </div>
      `;

      $("#fileStatus").textContent =
        `${file.name} • ${img.naturalWidth} × ${img.naturalHeight}`;

      $("#cropPreview").src =
        src;

      $("#cropBtn").onclick =
        async () => {

          try {

            const x =
              Number($("#cropX").value);

            const y =
              Number($("#cropY").value);

            const w =
              Number($("#cropW").value);

            const h =
              Number($("#cropH").value);

            if (
              x < 0 ||
              y < 0 ||
              w <= 0 ||
              h <= 0 ||
              x + w > img.naturalWidth ||
              y + h > img.naturalHeight
            ) {
              throw new Error(
                "Crop area is outside the image."
              );
            }

            const canvas =
              makeCanvas(w, h);

            const ctx =
              canvas.getContext("2d");

            ctx.drawImage(
              img,
              x,
              y,
              w,
              h,
              0,
              0,
              w,
              h
            );

            const blob =
              await canvasBlob(
                canvas,
                "image/png"
              );

            downloadBlob(
              blob,
              "filefox-cropped.png"
            );

          } catch (error) {

            showError(
              error.message
            );
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   ROTATE
========================================================= */

function rotateTool() {

  openModal(
    imagePickerUI(
      "Image Rotator",
      "Rotate your image by 90°, 180° or 270°."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#workArea").innerHTML = `

        <img class="preview" id="rotatePreview">

        <div class="tool-controls">

          <div class="control">
            <label>Rotation</label>

            <select id="rotation">
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </div>

          <button class="primary-btn" id="rotateBtn">
            Rotate & Download
          </button>

        </div>
      `;

      $("#rotatePreview").src =
        src;

      $("#rotateBtn").onclick =
        async () => {

          const deg =
            Number(
              $("#rotation").value
            );

          const swap =
            deg === 90 ||
            deg === 270;

          const canvas =
            makeCanvas(
              swap
                ? img.naturalHeight
                : img.naturalWidth,

              swap
                ? img.naturalWidth
                : img.naturalHeight
            );

          const ctx =
            canvas.getContext("2d");

          ctx.translate(
            canvas.width / 2,
            canvas.height / 2
          );

          ctx.rotate(
            deg * Math.PI / 180
          );

          ctx.drawImage(
            img,
            -img.naturalWidth / 2,
            -img.naturalHeight / 2
          );

          const blob =
            await canvasBlob(
              canvas,
              "image/png"
            );

          downloadBlob(
            blob,
            "filefox-rotated.png"
          );
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   FLIP
========================================================= */

function flipTool() {

  openModal(
    imagePickerUI(
      "Image Flipper",
      "Mirror your image horizontally or vertically."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#workArea").innerHTML = `

        <img class="preview" id="flipPreview">

        <div class="tool-controls">

          <div class="control">
            <label>Direction</label>

            <select id="flipDirection">
              <option value="horizontal">
                Horizontal
              </option>

              <option value="vertical">
                Vertical
              </option>
            </select>
          </div>

          <button class="primary-btn" id="flipBtn">
            Flip & Download
          </button>

        </div>
      `;

      $("#flipPreview").src =
        src;

      $("#flipBtn").onclick =
        async () => {

          const horizontal =
            $("#flipDirection").value ===
            "horizontal";

          const canvas =
            makeCanvas(
              img.naturalWidth,
              img.naturalHeight
            );

          const ctx =
            canvas.getContext("2d");

          if (horizontal) {
            ctx.translate(
              canvas.width,
              0
            );

            ctx.scale(-1, 1);

          } else {

            ctx.translate(
              0,
              canvas.height
            );

            ctx.scale(1, -1);
          }

          ctx.drawImage(
            img,
            0,
            0
          );

          const blob =
            await canvasBlob(
              canvas,
              "image/png"
            );

          downloadBlob(
            blob,
            "filefox-flipped.png"
          );
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   DSLR LOOK / PHOTO ENHANCER
========================================================= */

function enhanceTool() {

  openModal(
    imagePickerUI(
      "DSLR Look",
      "Enhance brightness, contrast, color and sharpness."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#workArea").innerHTML = `

        <img class="preview" id="enhancePreview">

        <div class="tool-controls">

          <div class="control">
            <label>
              Brightness
              <strong id="brightVal">0</strong>
            </label>

            <input
              id="bright"
              type="range"
              min="-50"
              max="50"
              value="0">
          </div>

          <div class="control">
            <label>
              Contrast
              <strong id="contrastVal">10</strong>
            </label>

            <input
              id="contrast"
              type="range"
              min="-50"
              max="50"
              value="10">
          </div>

          <div class="control">
            <label>
              Saturation
              <strong id="satVal">15</strong>
            </label>

            <input
              id="sat"
              type="range"
              min="-50"
              max="70"
              value="15">
          </div>

          <div class="control">
            <label>
              Sharpness
              <strong id="sharpVal">20</strong>
            </label>

            <input
              id="sharp"
              type="range"
              min="0"
              max="50"
              value="20">
          </div>

          <div class="control">
            <label>
              Warmth
              <strong id="warmVal">5</strong>
            </label>

            <input
              id="warm"
              type="range"
              min="-30"
              max="30"
              value="5">
          </div>

          <button
            class="secondary-btn"
            id="autoEnhance">
            ✨ Auto DSLR
          </button>

          <button
            class="primary-btn"
            id="enhanceBtn">
            Enhance & Download
          </button>

        </div>
      `;

      $("#enhancePreview").src =
        src;


      const pairs = [
        ["bright", "brightVal"],
        ["contrast", "contrastVal"],
        ["sat", "satVal"],
        ["sharp", "sharpVal"],
        ["warm", "warmVal"]
      ];

      pairs.forEach(([input, output]) => {

        $("#" + input).oninput = () => {

          $("#" + output).textContent =
            $("#" + input).value;
        };
      });


      $("#autoEnhance").onclick = () => {

        const values = {
          bright: 3,
          contrast: 15,
          sat: 18,
          sharp: 28,
          warm: 5
        };

        Object.entries(values)
          .forEach(([id, value]) => {

            $("#" + id).value =
              value;

            $("#" + id + "Val").textContent =
              value;
          });
      };


      $("#enhanceBtn").onclick =
        async () => {

          try {

            const size =
              safeDimension(
                img.naturalWidth,
                img.naturalHeight,
                2200
              );

            const canvas =
              makeCanvas(
                size.width,
                size.height
              );

            const ctx =
              canvas.getContext("2d", {
                willReadFrequently: true
              });

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const imageData =
              ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );

            const data =
              imageData.data;

            const brightness =
              Number($("#bright").value);

            const contrast =
              Number($("#contrast").value);

            const saturation =
              Number($("#sat").value);

            const warmth =
              Number($("#warm").value);

            const contrastFactor =
              (259 *
                (contrast + 255)) /
              (255 *
                (259 - contrast));


            for (
              let i = 0;
              i < data.length;
              i += 4
            ) {

              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];

              r =
                contrastFactor *
                (r - 128) +
                128 +
                brightness * 2.2;

              g =
                contrastFactor *
                (g - 128) +
                128 +
                brightness * 2.2;

              b =
                contrastFactor *
                (b - 128) +
                128 +
                brightness * 2.2;


              const max =
                Math.max(r, g, b);

              const min =
                Math.min(r, g, b);

              const avg =
                (r + g + b) / 3;

              const satFactor =
                1 +
                saturation / 100;

              r =
                avg +
                (r - avg) *
                satFactor;

              g =
                avg +
                (g - avg) *
                satFactor;

              b =
                avg +
                (b - avg) *
                satFactor;


              r += warmth;
              b -= warmth * .7;


              data[i] =
                clamp(r);

              data[i + 1] =
                clamp(g);

              data[i + 2] =
                clamp(b);
            }


            ctx.putImageData(
              imageData,
              0,
              0
            );


            const sharp =
              Number(
                $("#sharp").value
              );

            if (sharp > 0) {

              const original =
                ctx.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );

              const srcData =
                original.data;

              const copy =
                new Uint8ClampedArray(
                  srcData
                );

              const amount =
                sharp / 100;

              const w =
                canvas.width;

              const h =
                canvas.height;


              for (
                let y = 1;
                y < h - 1;
                y++
              ) {

                for (
                  let x = 1;
                  x < w - 1;
                  x++
                ) {

                  const p =
                    (y * w + x) * 4;

                  for (
                    let c = 0;
                    c < 3;
                    c++
                  ) {

                    const center =
                      copy[p + c];

                    const top =
                      copy[p - w * 4 + c];

                    const bottom =
                      copy[p + w * 4 + c];

                    const left =
                      copy[p - 4 + c];

                    const right =
                      copy[p + 4 + c];

                    const edge =
                      center * 5 -
                      top -
                      bottom -
                      left -
                      right;

                    srcData[p + c] =
                      clamp(
                        center +
                        (edge - center) *
                        amount
                      );
                  }
                }
              }

              ctx.putImageData(
                original,
                0,
                0
              );
            }


            const blob =
              await canvasBlob(
                canvas,
                "image/jpeg",
                .94
              );

            downloadBlob(
              blob,
              "filefox-dslr-look.jpg"
            );

          } catch (error) {

            showError(
              error.message
            );
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   BACKGROUND CLEANER
========================================================= */

function backgroundTool() {

  openModal(
    imagePickerUI(
      "Background Cleaner",
      "Best for photos with a simple, fairly uniform background."
    )
  );

  $("#chooseFile").onclick = async () => {

    try {

      const file =
        await filePicker("image/*");

      const src =
        await readDataURL(file);

      const img =
        await loadImage(src);

      $("#workArea").innerHTML = `

        <img class="preview" id="bgPreview">

        <div class="tool-controls">

          <div class="control">
            <label>
              Background tolerance
              <strong id="tolVal">55</strong>
            </label>

            <input
              id="tolerance"
              type="range"
              min="10"
              max="130"
              value="55">
          </div>

          <button
            class="primary-btn"
            id="removeBgBtn">
            Remove background
          </button>

        </div>

        <p class="status">
          This is a browser-based color remover,
          not AI subject segmentation.
        </p>
      `;

      $("#bgPreview").src =
        src;

      $("#tolerance").oninput = () => {

        $("#tolVal").textContent =
          $("#tolerance").value;
      };


      $("#removeBgBtn").onclick =
        async () => {

          try {

            const size =
              safeDimension(
                img.naturalWidth,
                img.naturalHeight,
                1800
              );

            const canvas =
              makeCanvas(
                size.width,
                size.height
              );

            const ctx =
              canvas.getContext("2d", {
                willReadFrequently: true
              });

            ctx.drawImage(
              img,
              0,
              0,
              canvas.width,
              canvas.height
            );

            const imageData =
              ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );

            const data =
              imageData.data;

            const w =
              canvas.width;

            const h =
              canvas.height;


            function pixel(x, y) {

              const i =
                (y * w + x) * 4;

              return [
                data[i],
                data[i + 1],
                data[i + 2]
              ];
            }


            const points = [
              pixel(0, 0),
              pixel(w - 1, 0),
              pixel(0, h - 1),
              pixel(w - 1, h - 1)
            ];


            const bg = [
              Math.round(
                points.reduce(
                  (s, p) => s + p[0],
                  0
                ) / points.length
              ),

              Math.round(
                points.reduce(
                  (s, p) => s + p[1],
                  0
                ) / points.length
              ),

              Math.round(
                points.reduce(
                  (s, p) => s + p[2],
                  0
                ) / points.length
              )
            ];


            const tolerance =
              Number(
                $("#tolerance").value
              );


            for (
              let i = 0;
              i < data.length;
              i += 4
            ) {

              const dr =
                data[i] - bg[0];

              const dg =
                data[i + 1] - bg[1];

              const db =
                data[i + 2] - bg[2];

              const distance =
                Math.sqrt(
                  dr * dr +
                  dg * dg +
                  db * db
                );


              if (
                distance <= tolerance
              ) {

                data[i + 3] = 0;

              } else if (
                distance <
                tolerance + 30
              ) {

                const alpha =
                  Math.round(
                    ((distance - tolerance) /
                    30) *
                    255
                  );

                data[i + 3] =
                  alpha;
              }
            }


            ctx.putImageData(
              imageData,
              0,
              0
            );


            const blob =
              await canvasBlob(
                canvas,
                "image/png"
              );

            downloadBlob(
              blob,
              "filefox-background-cleaned.png"
            );

          } catch (error) {

            showError(
              error.message
            );
          }
        };

    } catch (error) {

      showError(
        error.message
      );
    }
  };
}


/* =========================================================
   IMAGE → PDF
========================================================= */

function pdfTool() {

  openModal(`
    <h2 class="modal-title">
      Image → PDF
    </h2>

    <p class="modal-subtitle">
      Select an image, then print/save it as PDF.
    </p>

    <div class="drop-zone">

      <button
        class="choose-btn"
        id="pdfChoose">
        Choose image
      </button>

      <p class="status">
        Chrome's print dialog will create the PDF.
      </p>

    </div>

    <div id="pdfArea"></div>
  `);


  $("#pdfChoose").onclick =
    async () => {

      try {

        const file =
          await filePicker("image/*");

        const src =
          await readDataURL(file);

        const img =
          await loadImage(src);

        $("#pdfArea").innerHTML = `

          <img
            class="preview"
            id="pdfPreview">

          <div class="result-actions">

            <button
              class="primary-btn"
              id="printPdfBtn">
              Open Print / Save PDF
            </button>

          </div>
        `;

        $("#pdfPreview").src =
          src;


        $("#printPdfBtn").onclick =
          () => {

            const win =
              window.open(
                "",
                "_blank"
              );

            if (!win) {

              showError(
                "Chrome blocked the new window. Allow pop-ups for FileFox and try again."
              );

              return;
            }


            win.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>FileFox PDF</title>

                <style>
                  html,body{
                    margin:0;
                    padding:0;
                    background:white;
                  }

                  body{
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    min-height:100vh;
                  }

                  img{
                    max-width:100%;
                    max-height:100vh;
                  }
                </style>
              </head>

              <body>

                <img
                  src="${src}"
                  onload="setTimeout(() => window.print(), 300)">

              </body>
              </html>
            `);

            win.document.close();
          };

      } catch (error) {

        showError(
          error.message
        );
      }
    };
}


/* =========================================================
   QR
========================================================= */

function qrTool() {

  openModal(`
    <h2 class="modal-title">
      QR Code Generator
    </h2>

    <p class="modal-subtitle">
      Create a QR code from text or a link.
    </p>

    <div class="control">
      <label>Text / URL</label>

      <input
        id="qrText"
        placeholder="https://example.com">
    </div>

    <div class="result-actions">

      <button
        class="primary-btn"
        id="makeQR">
        Generate QR
      </button>

    </div>

    <div
      class="qr-box"
      id="qrBox">
    </div>
  `);


  $("#makeQR").onclick =
    () => {

      const text =
        $("#qrText").value.trim();

      if (!text) {

        showError(
          "Enter some text or a URL."
        );

        return;
      }


      if (
        typeof QRCode ===
        "undefined"
      ) {

        showError(
          "QR library could not load. Check your internet connection and refresh."
        );

        return;
      }


      const box =
        $("#qrBox");

      box.innerHTML = "";


      new QRCode(
        box,
        {
          text,
          width: 190,
          height: 190
        }
      );
    };
}


/* =========================================================
   TEXT TOOLS
========================================================= */

function textTool(type) {

  const titles = {
    counter: "Word Counter",
    case: "Case Converter",
    clean: "Text Cleaner",
    duplicate: "Duplicate Remover",
    slug: "Text → Slug"
  };


  openModal(`

    <h2 class="modal-title">
      ${titles[type] || "Text Tool"}
    </h2>

    <p class="modal-subtitle">
      Process your text directly in the browser.
    </p>

    <textarea
      class="tool-textarea"
      id="textInput"
      placeholder="Type or paste your text here..."></textarea>

    <div class="result-actions">

      ${
        type === "counter"
          ? `
            <button class="primary-btn" id="processText">
              Count
            </button>
          `
          : ""
      }

      ${
        type === "case"
          ? `
            <button class="secondary-btn" data-case="upper">
              UPPERCASE
            </button>

            <button class="secondary-btn" data-case="lower">
              lowercase
            </button>

            <button class="secondary-btn" data-case="title">
              Title Case
            </button>
          `
          : ""
      }

      ${
        type === "clean"
          ? `
            <button class="primary-btn" id="processText">
              Clean text
            </button>
          `
          : ""
      }

      ${
        type === "duplicate"
          ? `
            <button class="primary-btn" id="processText">
              Remove duplicates
            </button>
          `
          : ""
      }

      ${
        type === "slug"
          ? `
            <button class="primary-btn" id="processText">
              Create slug
            </button>
          `
          : ""
      }

    </div>

    <div id="textResult"></div>
  `);


  const input =
    $("#textInput");

  const result =
    $("#textResult");


  if (type === "case") {

    $$("[data-case]").forEach(btn => {

      btn.onclick = () => {

        const mode =
          btn.dataset.case;

        let text =
          input.value;

        if (mode === "upper") {
          text =
            text.toUpperCase();
        }

        if (mode === "lower") {
          text =
            text.toLowerCase();
        }

        if (mode === "title") {
          text =
            text
              .toLowerCase()
              .replace(
                /\b\w/g,
                c => c.toUpperCase()
              );
        }

        input.value =
          text;
      };
    });

    return;
  }


  $("#processText").onclick =
    () => {

      const text =
        input.value;


      if (type === "counter") {

        const words =
          text.trim()
            ? text.trim().split(/\s+/).length
            : 0;

        const chars =
          text.length;

        const lines =
          text
            ? text.split(/\r?\n/).length
            : 0;

        result.innerHTML = `
          <div class="result">
            <strong>${words} words</strong>
            <div class="status">
              ${chars} characters • ${lines} lines
            </div>
          </div>
        `;
      }


      if (type === "clean") {

        input.value =
          text
            .split(/\r?\n/)
            .map(x => x.trim())
            .filter(Boolean)
            .join("\n");

        result.innerHTML =
          `<div class="result">✓ Text cleaned.</div>`;
      }


      if (type === "duplicate") {

        const lines =
          text.split(/\r?\n/);

        const unique =
          [...new Set(
            lines.map(x => x.trim())
          )].filter(Boolean);

        input.value =
          unique.join("\n");

        result.innerHTML =
          `<div class="result">
            ✓ Duplicate lines removed.
          </div>`;
      }


      if (type === "slug") {

        const slug =
          text
            .toLowerCase()
            .trim()
            .replace(
              /[^a-z0-9\s-]/g,
              ""
            )
            .replace(
              /\s+/g,
              "-"
            )
            .replace(
              /-+/g,
              "-"
            );

        input.value =
          slug;

        result.innerHTML =
          `<div class="result">✓ Slug created.</div>`;
      }
    };
}


/* =========================================================
   PASSWORD
========================================================= */

function passwordTool() {

  openModal(`

    <h2 class="modal-title">
      Password Generator
    </h2>

    <p class="modal-subtitle">
      Generate a random password locally.
    </p>

    <div class="control">

      <label>
        Length:
        <strong id="passLengthValue">16</strong>
      </label>

      <input
        id="passLength"
        type="range"
        min="6"
        max="40"
        value="16">
    </div>

    <div class="result">

      <input
        id="passwordOutput"
        readonly
        class="control input"
        style="padding:12px;width:100%;margin-top:10px">

      <div class="result-actions">

        <button
          class="primary-btn"
          id="generatePassword">
          Generate
        </button>

        <button
          class="secondary-btn"
          id="copyPassword">
          Copy
        </button>

      </div>

    </div>
  `);


  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789" +
    "!@#$%&*";


  function generate() {

    const length =
      Number(
        $("#passLength").value
      );

    let output = "";

    for (
      let i = 0;
      i < length;
      i++
    ) {

      output +=
        chars[
          Math.floor(
            Math.random() *
            chars.length
          )
        ];
    }

    $("#passwordOutput").value =
      output;
  }


  $("#passLength").oninput =
    () => {

      $("#passLengthValue").textContent =
        $("#passLength").value;
    };


  $("#generatePassword").onclick =
    generate;


  $("#copyPassword").onclick =
    async () => {

      const value =
        $("#passwordOutput").value;

      if (!value) return;

      try {

        await navigator.clipboard.writeText(
          value
        );

        $("#copyPassword").textContent =
          "Copied ✓";

        setTimeout(() => {
          $("#copyPassword").textContent =
            "Copy";
        }, 1200);

      } catch {

        showError(
          "Copy was blocked by the browser."
        );
      }
    };


  generate();
}


/* =========================================================
   CALCULATOR
========================================================= */

function calculatorTool() {

  openModal(`

    <h2 class="modal-title">
      Quick Calculator
    </h2>

    <p class="modal-subtitle">
      Enter a simple mathematical expression.
    </p>

    <div class="control">

      <input
        id="calcInput"
        placeholder="Example: 25 * 4 + 10">

    </div>

    <div class="result-actions">

      <button
        class="primary-btn"
        id="calculateBtn">
        Calculate
      </button>

    </div>

    <div id="calcResult"></div>
  `);


  $("#calculateBtn").onclick =
    () => {

      const expression =
        $("#calcInput").value.trim();


      if (!expression) {

        showError(
          "Enter a calculation."
        );

        return;
      }


      /*
        Only allow numbers and basic
        arithmetic characters.
      */

      if (
        !/^[0-9+\-*/().%\s]+$/
          .test(expression)
      ) {

        showError(
          "Only basic mathematical expressions are allowed."
        );

        return;
      }


      try {

        const result =
          Function(
            `"use strict"; return (${expression})`
          )();

        if (
          typeof result !== "number" ||
          !Number.isFinite(result)
        ) {
          throw new Error();
        }

        $("#calcResult").innerHTML = `
          <div class="result">
            <strong>${result}</strong>
          </div>
        `;

      } catch {

        showError(
          "Invalid calculation."
        );
      }
    };
}


/* =========================================================
   HELPERS
========================================================= */

function clamp(value) {

  return Math.max(
    0,
    Math.min(
      255,
      Math.round(value)
    )
  );
}


function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function showError(message) {

  const existing =
    $("#errorBox");

  if (existing) {
    existing.remove();
  }

  const div =
    document.createElement("div");

  div.id =
    "errorBox";

  div.className =
    "result";

  div.style.marginTop =
    "15px";

  div.innerHTML =
    `<strong>⚠️ ${escapeHTML(message)}</strong>`;

  modalContent.prepend(div);
}


/* ---------- GLOBAL ERROR PROTECTION ---------- */

window.addEventListener(
  "error",
  event => {

    console.error(
      "FileFox error:",
      event.error || event.message
    );
  }
);
