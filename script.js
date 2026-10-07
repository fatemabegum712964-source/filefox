/* =========================================================
   FILEFOX V2 JAVASCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


const modal = $("#toolModal");
const modalContent = $("#modalContent");
const modalClose = $("#modalClose");
const themeBtn = $("#themeBtn");
const searchInput = $("#toolSearch");
const toolCount = $("#toolCount");
const noResults = $("#noResults");


/* =========================================================
   YEAR
   ========================================================= */

$("#year").textContent =
  new Date().getFullYear();


/* =========================================================
   TOOL COUNT
   ========================================================= */

function updateToolCount() {

  const visibleTools =
    $$(".tool-card:not(.is-hidden)").length;

  const totalTools =
    $$(".tool-card").length;

  toolCount.textContent =
    visibleTools === totalTools
      ? `${totalTools} tools`
      : `${visibleTools} of ${totalTools} tools`;
}

updateToolCount();


/* =========================================================
   DARK MODE
   ========================================================= */

const savedTheme =
  localStorage.getItem("filefox-theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}


themeBtn.onclick = () => {

  document.body.classList.toggle("dark");

  localStorage.setItem(
    "filefox-theme",
    document.body.classList.contains("dark")
      ? "dark"
      : "light"
  );
};


/* =========================================================
   SEARCH
   ========================================================= */

function searchTools() {

  const query =
    searchInput.value
      .trim()
      .toLowerCase();

  let visible = 0;

  $$(".tool-card").forEach(card => {

    const text =
      (
        card.dataset.search ||
        card.innerText
      ).toLowerCase();

    const match =
      !query ||
      text.includes(query);

    card.classList.toggle(
      "is-hidden",
      !match
    );

    if (match) visible++;

  });

  noResults.classList.toggle(
    "hidden",
    visible !== 0
  );

  updateToolCount();
}


searchInput.addEventListener(
  "input",
  searchTools
);


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

$$(".category").forEach(button => {

  button.onclick = () => {

    $$(".category").forEach(b =>
      b.classList.remove("active")
    );

    button.classList.add("active");

    const category =
      button.dataset.category;

    let visible = 0;

    $$(".tool-card").forEach(card => {

      const matches =
        category === "all" ||
        card.dataset.category === category;

      card.classList.toggle(
        "is-hidden",
        !matches
      );

      if (matches) visible++;

    });

    noResults.classList.toggle(
      "hidden",
      visible !== 0
    );

    updateToolCount();

  };

});


/* =========================================================
   KEYBOARD SEARCH
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      searchInput.focus();
    }

  }
);


/* =========================================================
   MODAL
   ========================================================= */

function openModal(content) {

  modalContent.innerHTML =
    content;

  modal.classList.remove("hidden");

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";
}


function closeModal() {

  modal.classList.add("hidden");

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow =
    "";
}


modalClose.onclick =
  closeModal;


$(".modal-backdrop").onclick =
  closeModal;


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeModal();
    }

  }
);


/* =========================================================
   TOOL BUTTON DISPATCHER
   ========================================================= */

$$(".tool-btn").forEach(button => {

  button.onclick = () => {

    const action =
      button.dataset.action;

    if (action === "image") {

      imageTool(
        button.dataset.type
      );

    }

    else if (action === "compress") {

      compressTool();

    }

    else if (action === "resize") {

      resizeTool();

    }

    else if (action === "enhance") {

      enhanceTool();

    }

    else if (action === "background") {

      backgroundTool();

    }

    else if (action === "pdf") {

      pdfTool();

    }

    else if (action === "qr") {

      qrTool();

    }

    else if (action === "text") {

      textTool(
        button.dataset.textTool
      );

    }

    else if (action === "password") {

      passwordTool();

    }

    else if (action === "calculator") {

      calculatorTool();

    }

  };

});


/* =========================================================
   HERO IMAGE BUTTON
   ========================================================= */

$("#heroUploadBtn").onclick =
  () => enhanceTool();


/* =========================================================
   IMAGE TOOL CONFIG
   ========================================================= */

const conversionTypes = {

  "jpg-png": {
    from: ["image/jpeg", "image/png"],
    to: "image/png",
    label: "PNG"
  },

  "png-webp": {
    from: ["image/png", "image/webp"],
    to: "image/webp",
    label: "WebP"
  },

  "jpg-webp": {
    from: ["image/jpeg", "image/webp"],
    to: "image/webp",
    label: "WebP"
  }

};


/* =========================================================
   FILE PICKER HTML
   ========================================================= */

function pickerHTML(
  accept = "image/jpeg,image/png,image/webp"
) {

  return `

    <div class="drop-zone" id="dropZone">

      <div class="drop-icon">🖼️</div>

      <strong>
        Drop an image here
      </strong>

      <p>
        JPG, PNG or WebP
      </p>

      <label class="choose-btn">

        Choose file

        <input
          id="fileInput"
          type="file"
          accept="${accept}">

      </label>

    </div>

  `;
}


/* =========================================================
   FILE READER
   ========================================================= */

function readImageFile(file) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {
        reject(
          new Error("No file selected.")
        );
        return;
      }

      if (
        !file.type.startsWith("image/")
      ) {

        reject(
          new Error(
            "Please choose an image file."
          )
        );

        return;
      }


      const url =
        URL.createObjectURL(file);

      const img =
        new Image();


      img.onload = () => {

        URL.revokeObjectURL(url);

        resolve({
          img,
          file
        });

      };


      img.onerror = () => {

        URL.revokeObjectURL(url);

        reject(
          new Error(
            "Could not read this image."
          )
        );

      };


      img.src = url;

    }
  );

}


/* =========================================================
   IMAGE CONVERSION
   ========================================================= */

function imageTool(type) {

  const config =
    conversionTypes[type];

  if (!config) return;


  openModal(`

    <h2 class="modal-title">
      Convert to ${config.label}
    </h2>

    <p class="modal-description">
      Choose an image and convert it directly in your browser.
    </p>

    ${pickerHTML()}

    <div id="imageWork"></div>

  `);


  const input =
    $("#fileInput");


  input.onchange = async () => {

    const file =
      input.files[0];

    if (!file) return;

    try {

      const { img } =
        await readImageFile(file);

      const work =
        $("#imageWork");

      work.innerHTML = `

        <div class="preview-area">

          <img
            class="preview-img"
            id="sourcePreview"
            src="${URL.createObjectURL(file)}">

          <div class="stats">

            <div class="stat">
              <strong>
                ${img.naturalWidth}px
              </strong>
              Width
            </div>

            <div class="stat">
              <strong>
                ${img.naturalHeight}px
              </strong>
              Height
            </div>

            <div class="stat">
              <strong>
                ${formatBytes(file.size)}
              </strong>
              Size
            </div>

          </div>

          <div class="action-row">

            <button
              class="action-btn"
              id="convertImageBtn">

              Convert to ${config.label}

            </button>

            <button
              class="action-btn secondary"
              id="chooseAgain">

              Choose another

            </button>

          </div>

          <div
            class="result-box hidden"
            id="imageResult">
          </div>

        </div>

      `;


      $("#chooseAgain").onclick =
        () => imageTool(type);


      $("#convertImageBtn").onclick =
        async () => {

          const canvas =
            document.createElement("canvas");

          canvas.width =
            img.naturalWidth;

          canvas.height =
            img.naturalHeight;

          const ctx =
            canvas.getContext("2d");


          if (
            config.to === "image/jpeg"
          ) {

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
            0
          );


          const blob =
            await canvasToBlob(
              canvas,
              config.to,
              .92
            );


          const ext =
            config.to === "image/png"
              ? "png"
              : "webp";


          const result =
            $("#imageResult");


          result.classList.remove(
            "hidden"
          );


          result.innerHTML = `

            <strong>
              Conversion complete
            </strong>

            <p>
              New file size:
              ${formatBytes(blob.size)}
            </p>

            <button
              class="action-btn"
              id="downloadConverted">

              Download ${ext.toUpperCase()}

            </button>

          `;


          $("#downloadConverted").onclick =
            () => downloadBlob(
              blob,
              `filefox-converted.${ext}`
            );

        };

    }

    catch (error) {

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

  openModal(`

    <h2 class="modal-title">
      Image Compressor
    </h2>

    <p class="modal-description">
      Reduce image size while controlling quality.
    </p>

    ${pickerHTML()}

    <div id="compressWork"></div>

  `);


  $("#fileInput").onchange =
    async event => {

      const file =
        event.target.files[0];

      try {

        const { img } =
          await readImageFile(file);

        $("#compressWork").innerHTML = `

          <div class="preview-area">

            <img
              class="preview-img"
              src="${URL.createObjectURL(file)}">

            <div class="control-group">

              <label>

                Quality

                <span id="qualityValue">
                  80%
                </span>

              </label>

              <input
                id="quality"
                type="range"
                min="20"
                max="100"
                value="80">

            </div>

            <div class="action-row">

              <button
                class="action-btn"
                id="compressBtn">

                Compress image

              </button>

            </div>

            <div
              id="compressResult"
              class="result-box hidden">
            </div>

          </div>

        `;


        const quality =
          $("#quality");


        quality.oninput =
          () => {

            $("#qualityValue")
              .textContent =
              quality.value + "%";

          };


        $("#compressBtn").onclick =
          async () => {

            const canvas =
              makeCanvas(
                img,
                2500
              );

            const q =
              Number(quality.value) / 100;

            const blob =
              await canvasToBlob(
                canvas,
                "image/jpeg",
                q
              );


            $("#compressResult")
              .classList
              .remove("hidden");


            $("#compressResult").innerHTML = `

              <strong>
                Compression complete
              </strong>

              <p>
                Original:
                ${formatBytes(file.size)}
                <br>
                New:
                ${formatBytes(blob.size)}
              </p>

              <button
                class="action-btn"
                id="downloadCompressed">

                Download compressed image

              </button>

            `;


            $("#downloadCompressed").onclick =
              () => downloadBlob(
                blob,
                "filefox-compressed.jpg"
              );

          };

      }

      catch (error) {

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

  openModal(`

    <h2 class="modal-title">
      Image Resizer
    </h2>

    <p class="modal-description">
      Set the exact dimensions of your image.
    </p>

    ${pickerHTML()}

    <div id="resizeWork"></div>

  `);


  $("#fileInput").onchange =
    async event => {

      const file =
        event.target.files[0];

      try {

        const { img } =
          await readImageFile(file);


        $("#resizeWork").innerHTML = `

          <div class="preview-area">

            <img
              class="preview-img"
              src="${URL.createObjectURL(file)}">

            <div class="two-columns">

              <div class="control-group">

                <label>
                  Width
                </label>

                <input
                  id="resizeWidth"
                  type="number"
                  value="${img.naturalWidth}"
                  min="1">

              </div>

              <div class="control-group">

                <label>
                  Height
                </label>

                <input
                  id="resizeHeight"
                  type="number"
                  value="${img.naturalHeight}"
                  min="1">

              </div>

            </div>


            <div class="control-group">

              <label>
                Keep aspect ratio

                <input
                  id="keepRatio"
                  type="checkbox"
                  checked>

              </label>

            </div>


            <div class="action-row">

              <button
                class="action-btn"
                id="resizeBtn">

                Resize image

              </button>

            </div>


            <div
              id="resizeResult"
              class="result-box hidden">
            </div>

          </div>

        `;


        const width =
          $("#resizeWidth");

        const height =
          $("#resizeHeight");

        const ratio =
          img.naturalWidth /
          img.naturalHeight;


        width.oninput =
          () => {

            if (
              $("#keepRatio").checked
            ) {

              height.value =
                Math.round(
                  Number(width.value) /
                  ratio
                );

            }

          };


        height.oninput =
          () => {

            if (
              $("#keepRatio").checked
            ) {

              width.value =
                Math.round(
                  Number(height.value) *
                  ratio
                );

            }

          };


        $("#resizeBtn").onclick =
          async () => {

            const w =
              Math.max(
                1,
                Number(width.value)
              );

            const h =
              Math.max(
                1,
                Number(height.value)
              );


            const canvas =
              document.createElement(
                "canvas"
              );

            canvas.width = w;
            canvas.height = h;


            const ctx =
              canvas.getContext("2d");

            ctx.imageSmoothingEnabled =
              true;

            ctx.imageSmoothingQuality =
              "high";


            ctx.drawImage(
              img,
              0,
              0,
              w,
              h
            );


            const blob =
              await canvasToBlob(
                canvas,
                "image/png"
              );


            $("#resizeResult")
              .classList
              .remove("hidden");


            $("#resizeResult").innerHTML = `

              <strong>
                Resize complete
              </strong>

              <p>
                ${w} × ${h}
              </p>

              <button
                class="action-btn"
                id="downloadResized">

                Download image

              </button>

            `;


            $("#downloadResized").onclick =
              () => downloadBlob(
                blob,
                "filefox-resized.png"
              );

          };

      }

      catch (error) {

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

  openModal(`

    <h2 class="modal-title">
      DSLR Look
    </h2>

    <p class="modal-description">
      Enhance contrast, color, brightness and sharpness
      for a more polished camera-style result.
    </p>

    ${pickerHTML()}

    <div id="enhanceWork"></div>

  `);


  $("#fileInput").onchange =
    async event => {

      const file =
        event.target.files[0];

      try {

        const { img } =
          await readImageFile(file);


        $("#enhanceWork").innerHTML = `

          <div class="preview-area">

            <div class="compare-grid">

              <div>

                <div class="compare-label">
                  Original
                </div>

                <img
                  id="enhanceOriginal"
                  src="${URL.createObjectURL(file)}">

              </div>

              <div>

                <div class="compare-label">
                  Preview
                </div>

                <img
                  id="enhancePreview">

              </div>

            </div>


            <div class="control-group">

              <label>
                Brightness
                <span id="brightVal">105%</span>
              </label>

              <input
                id="bright"
                type="range"
                min="70"
                max="140"
                value="105">

            </div>


            <div class="control-group">

              <label>
                Contrast
                <span id="contrastVal">112%</span>
              </label>

              <input
                id="contrast"
                type="range"
                min="70"
                max="150"
                value="112">

            </div>


            <div class="control-group">

              <label>
                Saturation
                <span id="saturationVal">112%</span>
              </label>

              <input
                id="saturation"
                type="range"
                min="70"
                max="160"
                value="112">

            </div>


            <div class="control-group">

              <label>
                Sharpness
                <span id="sharpVal">1</span>
              </label>

              <input
                id="sharp"
                type="range"
                min="0"
                max="3"
                step=".1"
                value="1">

            </div>


            <div class="control-group">

              <label>
                Warmth
                <span id="warmVal">0</span>
              </label>

              <input
                id="warm"
                type="range"
                min="-30"
                max="30"
                value="0">

            </div>


            <div class="action-row">

              <button
                class="action-btn"
                data-preset="natural">

                Natural

              </button>

              <button
                class="action-btn secondary"
                data-preset="vivid">

                Vivid

              </button>

              <button
                class="action-btn secondary"
                data-preset="cinematic">

                Cinematic

              </button>

            </div>


            <div class="action-row">

              <button
                class="action-btn"
                id="applyEnhance">

                Enhance & Download

              </button>

            </div>

          </div>

        `;


        const controls = {

          bright: $("#bright"),
          contrast: $("#contrast"),
          saturation: $("#saturation"),
          sharp: $("#sharp"),
          warm: $("#warm")

        };


        function updateLabels() {

          $("#brightVal")
            .textContent =
            controls.bright.value + "%";

          $("#contrastVal")
            .textContent =
            controls.contrast.value + "%";

          $("#saturationVal")
            .textContent =
            controls.saturation.value + "%";

          $("#sharpVal")
            .textContent =
            controls.sharp.value;

          $("#warmVal")
            .textContent =
            controls.warm.value;

        }


        Object.values(controls)
          .forEach(control => {

            control.oninput =
              () => {

                updateLabels();

                renderEnhancePreview();

              };

          });


        function renderEnhancePreview() {

          const canvas =
            enhanceCanvas(
              img,
              controls
            );

          $("#enhancePreview").src =
            canvas.toDataURL(
              "image/jpeg",
              .88
            );

        }


        $$("[data-preset]").forEach(
          button => {

            button.onclick = () => {

              const preset =
                button.dataset.preset;


              if (
                preset === "natural"
              ) {

                controls.bright.value =
                  105;

                controls.contrast.value =
                  112;

                controls.saturation.value =
                  108;

                controls.sharp.value =
                  1;

                controls.warm.value =
                  3;

              }


              if (
                preset === "vivid"
              ) {

                controls.bright.value =
                  108;

                controls.contrast.value =
                  120;

                controls.saturation.value =
                  132;

                controls.sharp.value =
                  1.5;

                controls.warm.value =
                  5;

              }


              if (
                preset === "cinematic"
              ) {

                controls.bright.value =
                  98;

                controls.contrast.value =
                  125;

                controls.saturation.value =
                  105;

                controls.sharp.value =
                  1.2;

                controls.warm.value =
                  -3;

              }


              updateLabels();

              renderEnhancePreview();

            };

          }
        );


        $("#applyEnhance").onclick =
          async () => {

            const canvas =
              enhanceCanvas(
                img,
                controls
              );


            const blob =
              await canvasToBlob(
                canvas,
                "image/jpeg",
                .94
              );


            downloadBlob(
              blob,
              "filefox-dslr-look.jpg"
            );

          };


        renderEnhancePreview();

      }

      catch (error) {

        showError(
          error.message
        );

      }

    };

}


/* =========================================================
   DSLR CANVAS
   ========================================================= */

function enhanceCanvas(
  img,
  controls
) {

  const canvas =
    makeCanvas(
      img,
      3200
    );


  const ctx =
    canvas.getContext("2d");


  const brightness =
    Number(controls.bright.value);

  const contrast =
    Number(controls.contrast.value);

  const saturation =
    Number(controls.saturation.value);

  const warm =
    Number(controls.warm.value);


  const tempCanvas =
    document.createElement(
      "canvas"
    );

  tempCanvas.width =
    canvas.width;

  tempCanvas.height =
    canvas.height;


  const temp =
    tempCanvas.getContext("2d");


  temp.filter =
    `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
    `;


  temp.drawImage(
    img,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );


  ctx.filter = "none";

  ctx.drawImage(
    tempCanvas,
    0,
    0
  );


  /* Warmth overlay */

  if (warm !== 0) {

    ctx.save();

    ctx.globalAlpha =
      Math.abs(warm) / 180;

    ctx.fillStyle =
      warm > 0
        ? "#ff9b58"
        : "#6aa7ff";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.restore();

  }


  /* Simple clarity/sharpness */

  const sharp =
    Number(controls.sharp.value);


  if (sharp > 0) {

    ctx.save();

    ctx.globalAlpha =
      Math.min(
        .18,
        sharp / 10
      );

    ctx.globalCompositeOperation =
      "overlay";

    ctx.drawImage(
      canvas,
      -1,
      0
    );

    ctx.drawImage(
      canvas,
      1,
      0
    );

    ctx.restore();

  }


  return canvas;

}


/* =========================================================
   BACKGROUND REMOVER
   =========================================================

   This is intentionally a lightweight browser method.
   It works best on simple, fairly uniform backgrounds.
   ========================================================= */

function backgroundTool() {

  openModal(`

    <h2 class="modal-title">
      Background Remover
    </h2>

    <p class="modal-description">
      Best for photos with a relatively simple or solid-color
      background.
    </p>

    ${pickerHTML()}

    <div id="backgroundWork"></div>

  `);


  $("#fileInput").onchange =
    async event => {

      const file =
        event.target.files[0];

      try {

        const { img } =
          await readImageFile(file);


        $("#backgroundWork").innerHTML = `

          <div class="preview-area">

            <img
              class="preview-img"
              id="bgPreview"
              src="${URL.createObjectURL(file)}">


            <div class="control-group">

              <label>

                Background tolerance

                <span id="toleranceValue">
                  35
                </span>

              </label>

              <input
                id="tolerance"
                type="range"
                min="5"
                max="100"
                value="35">

            </div>


            <div class="action-row">

              <button
                class="action-btn"
                id="removeBgBtn">

                Remove background

              </button>

            </div>


            <div
              id="bgResult"
              class="result-box hidden">
            </div>

          </div>

        `;


        const tolerance =
          $("#tolerance");


        tolerance.oninput =
          () => {

            $("#toleranceValue")
              .textContent =
              tolerance.value;

          };


        $("#removeBgBtn").onclick =
          async () => {

            const canvas =
              makeCanvas(
                img,
                2500
              );


            const ctx =
              canvas.getContext("2d");


            const imageData =
              ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );


            const data =
              imageData.data;


            const sample =
              getCornerAverage(
                data,
                canvas.width,
                canvas.height
              );


            const limit =
              Number(
                tolerance.value
              );


            for (
              let i = 0;
              i < data.length;
              i += 4
            ) {

              const r =
                data[i];

              const g =
                data[i + 1];

              const b =
                data[i + 2];


              const distance =
                Math.sqrt(

                  Math.pow(
                    r - sample.r,
                    2
                  )

                  +

                  Math.pow(
                    g - sample.g,
                    2
                  )

                  +

                  Math.pow(
                    b - sample.b,
                    2
                  )

                );


              if (
                distance <
                limit * 2.5
              ) {

                data[i + 3] = 0;

              }

            }


            ctx.putImageData(
              imageData,
              0,
              0
            );


            const blob =
              await canvasToBlob(
                canvas,
                "image/png"
              );


            $("#bgResult")
              .classList
              .remove("hidden");


            $("#bgResult").innerHTML = `

              <strong>
                Background processing complete
              </strong>

              <p>
                Transparent PNG created.
              </p>

              <button
                class="action-btn"
                id="downloadBg">

                Download transparent PNG

              </button>

            `;


            $("#downloadBg").onclick =
              () => downloadBlob(
                blob,
                "filefox-background-removed.png"
              );

          };

      }

      catch (error) {

        showError(
          error.message
        );

      }

    };

}


/* =========================================================
   CORNER COLOR SAMPLE
   ========================================================= */

function getCornerAverage(
  data,
  width,
  height
) {

  const points = [

    [2, 2],

    [width - 3, 2],

    [2, height - 3],

    [width - 3, height - 3]

  ];


  let r = 0;
  let g = 0;
  let b = 0;


  points.forEach(
    ([x, y]) => {

      const index =
        (
          y * width +
          x
        ) * 4;


      r += data[index];

      g += data[index + 1];

      b += data[index + 2];

    }
  );


  return {

    r: r / points.length,

    g: g / points.length,

    b: b / points.length

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

    <p class="modal-description">
      Select an image and create a printable PDF.
    </p>

    ${pickerHTML()}

    <div id="pdfWork"></div>

  `);


  $("#fileInput").onchange =
    async event => {

      const file =
        event.target.files[0];

      try {

        const { img } =
          await readImageFile(file);


        $("#pdfWork").innerHTML = `

          <div class="preview-area">

            <img
              class="preview-img"
              src="${URL.createObjectURL(file)}">


            <button
              class="action-btn"
              id="printPdfBtn">

              Open print / Save as PDF

            </button>

          </div>

        `;


        $("#printPdfBtn").onclick =
          () => {

            const canvas =
              makeCanvas(
                img,
                2200
              );


            const image =
              canvas.toDataURL(
                "image/jpeg",
                .92
              );


            const win =
              window.open(
                "",
                "_blank"
              );


            if (!win) {

              showError(
                "Please allow popups in Chrome for this tool."
              );

              return;
            }


            win.document.write(`

              <!DOCTYPE html>

              <html>

              <head>

                <title>
                  FileFox PDF
                </title>

                <style>

                  body {
                    margin: 0;
                    text-align: center;
                  }

                  img {
                    max-width: 100%;
                    max-height: 100vh;
                  }

                </style>

              </head>

              <body>

                <img src="${image}">

                <script>

                  window.onload = () => {
                    window.print();
                  };

                <\/script>

              </body>

              </html>

            `);


            win.document.close();

          };

      }

      catch (error) {

        showError(
          error.message
        );

      }

    };

}


/* =========================================================
   QR GENERATOR
   ========================================================= */

function qrTool() {

  openModal(`

    <h2 class="modal-title">
      QR Code Generator
    </h2>

    <p class="modal-description">
      Create a QR code from text or a link.
    </p>


    <div class="control-group">

      <label>
        Text or URL
      </label>

      <textarea
        id="qrText"
        placeholder="https://example.com">
      </textarea>

    </div>


    <div class="action-row">

      <button
        class="action-btn"
        id="generateQr">

        Generate QR

      </button>

    </div>


    <div
      id="qrResult"
      class="result-box">

      Your QR code will appear here.

    </div>

  `);


  $("#generateQr").onclick =
    () => {

      const text =
        $("#qrText")
          .value
          .trim();


      if (!text) {

        showError(
          "Please enter some text or a URL."
        );

        return;

      }


      const result =
        $("#qrResult");


      result.innerHTML =
        `<div id="qrCode"></div>`;


      if (
        typeof QRCode === "undefined"
      ) {

        showError(
          "QR library could not load. Check your internet connection."
        );

        return;

      }


      new QRCode(
        $("#qrCode"),
        {
          text,
          width: 220,
          height: 220
        }
      );

    };

}


/* =========================================================
   TEXT TOOLS
   ========================================================= */

function textTool(type) {

  const titles = {

    counter:
      "Word Counter",

    case:
      "Case Converter",

    clean:
      "Text Cleaner"

  };


  openModal(`

    <h2 class="modal-title">
      ${titles[type] || "Text Tool"}
    </h2>

    <p class="modal-description">
      Work with text instantly.
    </p>


    <textarea
      id="textInput"
      placeholder="Type or paste your text here...">
    </textarea>


    <div class="action-row">

      ${
        type === "counter"
          ? `
            <button
              class="action-btn"
              id="processText">

              Count

            </button>
          `
          : ""
      }


      ${
        type === "case"
          ? `
            <button
              class="action-btn"
              data-case="upper">

              UPPERCASE

            </button>

            <button
              class="action-btn secondary"
              data-case="lower">

              lowercase

            </button>

            <button
              class="action-btn secondary"
              data-case="title">

              Title Case

            </button>
          `
          : ""
      }


      ${
        type === "clean"
          ? `
            <button
              class="action-btn"
              id="processText">

              Clean text

            </button>
          `
          : ""
      }

    </div>


    <div
      class="result-box"
      id="textResult">

      Result will appear here.

    </div>

  `);


  if (type === "counter") {

    $("#processText").onclick =
      () => {

        const text =
          $("#textInput").value;


        const words =
          text
            .trim()
            ? text
                .trim()
                .split(/\s+/)
                .length
            : 0;


        const chars =
          text.length;


        const lines =
          text
            ? text.split("\n").length
            : 0;


        const sentences =
          text
            .split(/[.!?]+/)
            .filter(x => x.trim())
            .length;


        $("#textResult").innerHTML = `

          <strong>
            ${words} words
          </strong>

          <p>
            Characters: ${chars}
            <br>
            Lines: ${lines}
            <br>
            Sentences: ${sentences}
          </p>

        `;

      };

  }


  if (type === "clean") {

    $("#processText").onclick =
      () => {

        const input =
          $("#textInput");


        input.value =
          input.value
            .split("\n")
            .map(line =>
              line.trim().replace(
                /\s+/g,
                " "
              )
            )
            .filter(Boolean)
            .join("\n");


        $("#textResult").textContent =
          "Text cleaned.";

      };

  }


  if (type === "case") {

    $$("[data-case]").forEach(
      button => {

        button.onclick =
          () => {

            const input =
              $("#textInput");


            const mode =
              button.dataset.case;


            if (mode === "upper") {

              input.value =
                input.value.toUpperCase();

            }


            if (mode === "lower") {

              input.value =
                input.value.toLowerCase();

            }


            if (mode === "title") {

              input.value =
                input.value
                  .toLowerCase()
                  .replace(
                    /\b\w/g,
                    char =>
                      char.toUpperCase()
                  );

            }

          };

      }
    );

  }

}


/* =========================================================
   PASSWORD GENERATOR
   ========================================================= */

function passwordTool() {

  openModal(`

    <h2 class="modal-title">
      Password Generator
    </h2>

    <p class="modal-description">
      Generate a random password.
    </p>


    <div class="control-group">

      <label>
        Length
        <span id="passLengthValue">
          16
        </span>
      </label>

      <input
        id="passLength"
        type="range"
        min="6"
        max="40"
        value="16">

    </div>


    <div class="action-row">

      <button
        class="action-btn"
        id="generatePassword">

        Generate password

      </button>

    </div>


    <div
      class="result-box"
      id="passwordResult">

      Click generate.

    </div>

  `);


  const length =
    $("#passLength");


  length.oninput =
    () => {

      $("#passLengthValue")
        .textContent =
        length.value;

    };


  $("#generatePassword").onclick =
    () => {

      const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ" +
        "abcdefghijkmnopqrstuvwxyz" +
        "23456789!@#$%";


      let password = "";


      const size =
        Number(length.value);


      for (
        let i = 0;
        i < size;
        i++
      ) {

        password +=
          chars[
            Math.floor(
              Math.random() *
              chars.length
            )
          ];

      }


      $("#passwordResult").innerHTML = `

        <strong>
          ${escapeHTML(password)}
        </strong>

        <div class="action-row">

          <button
            class="action-btn"
            id="copyPassword">

            Copy

          </button>

        </div>

      `;


      $("#copyPassword").onclick =
        async () => {

          await navigator.clipboard
            ?.writeText(password);

          $("#copyPassword")
            .textContent =
            "Copied!";

        };

    };

}


/* =========================================================
   CALCULATOR
   ========================================================= */

function calculatorTool() {

  openModal(`

    <h2 class="modal-title">
      Quick Calculator
    </h2>

    <p class="modal-description">
      Enter a basic mathematical expression.
    </p>


    <input
      id="calcInput"
      type="text"
      inputmode="decimal"
      placeholder="Example: 25 * 4 + 10">


    <div class="action-row">

      <button
        class="action-btn"
        id="calculateBtn">

        Calculate

      </button>

    </div>


    <div
      class="result-box"
      id="calcResult">

      Result will appear here.

    </div>

  `);


  $("#calculateBtn").onclick =
    () => {

      const expression =
        $("#calcInput")
          .value
          .trim();


      if (!expression) {

        showError(
          "Enter a calculation."
        );

        return;

      }


      if (
        !/^[0-9+\-*/().%\s]+$/
          .test(expression)
      ) {

        showError(
          "Only basic numbers and operators are allowed."
        );

        return;

      }


      try {

        const result =
          Function(
            `"use strict"; return (${expression})`
          )();


        if (
          !Number.isFinite(result)
        ) {

          throw new Error();

        }


        $("#calcResult").innerHTML = `

          <strong>
            ${result}
          </strong>

        `;

      }

      catch {

        showError(
          "Invalid calculation."
        );

      }

    };

}


/* =========================================================
   CANVAS HELPERS
   ========================================================= */

function makeCanvas(
  img,
  maxDimension = 5000
) {

  let width =
    img.naturalWidth;

  let height =
    img.naturalHeight;


  const scale =
    Math.min(
      1,
      maxDimension /
      Math.max(
        width,
        height
      )
    );


  width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );


  height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    width;

  canvas.height =
    height;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";


  ctx.drawImage(
    img,
    0,
    0,
    width,
    height
  );


  return canvas;

}


function canvasToBlob(
  canvas,
  type = "image/png",
  quality = .92
) {

  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        blob => {

          if (!blob) {

            reject(
              new Error(
                "Could not create image."
              )
            );

            return;

          }

          resolve(blob);

        },

        type,

        quality

      );

    }
  );

}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    filename;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );

}


/* =========================================================
   UTILITIES
   ========================================================= */

function formatBytes(bytes) {

  if (!bytes) return "0 B";


  const units =
    [
      "B",
      "KB",
      "MB",
      "GB"
    ];


  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );


  return (
    (bytes /
      Math.pow(
        1024,
        index
      )
    ).toFixed(
      index === 0 ? 0 : 1
    )
    +
    " "
    +
    units[index]
  );

}


function escapeHTML(text) {

  return String(text)
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

  const old =
    $("#filefoxError");


  if (old) old.remove();


  const box =
    document.createElement(
      "div"
    );


  box.id =
    "filefoxError";


  box.style.cssText = `

    position:fixed;
    left:50%;
    bottom:22px;
    transform:translateX(-50%);
    z-index:9999;
    max-width:calc(100% - 30px);
    padding:13px 17px;
    border-radius:13px;
    background:#b3261e;
    color:white;
    font:700 13px system-ui;
    box-shadow:0 12px 35px rgba(0,0,0,.25);

  `;


  box.textContent =
    message;


  document.body.appendChild(
    box
  );


  setTimeout(
    () => box.remove(),
    3500
  );

}


/* =========================================================
   DRAG & DROP SUPPORT
   ========================================================= */

document.addEventListener(
  "dragover",
  event => {

    const zone =
      event.target.closest(
        "#dropZone"
      );

    if (!zone) return;

    event.preventDefault();

    zone.classList.add(
      "dragging"
    );

  }
);


document.addEventListener(
  "dragleave",
  event => {

    const zone =
      event.target.closest(
        "#dropZone"
      );

    if (!zone) return;

    zone.classList.remove(
      "dragging"
    );

  }
);


document.addEventListener(
  "drop",
  event => {

    const zone =
      event.target.closest(
        "#dropZone"
      );

    if (!zone) return;

    event.preventDefault();

    zone.classList.remove(
      "dragging"
    );


    const file =
      event.dataTransfer
        ?.files?.[0];


    if (!file) return;


    const input =
      $("#fileInput");


    if (!input) return;


    try {

      const transfer =
        new DataTransfer();

      transfer.items.add(
        file
      );

      input.files =
        transfer.files;

      input.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );

    }

    catch {

      showError(
        "Please use Choose file on this browser."
      );

    }

  }
);


/* =========================================================
   INITIAL MESSAGE
   ========================================================= */

console.log(
  "FileFox V2 loaded successfully."
);