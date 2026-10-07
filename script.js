"use strict";

/* =========================================================
   FILEFOX — STABLE CORE
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));


const modal = $("#modal");
const modalContent = $("#modalContent");
const modalClose = $("#modalClose");
const modalBackdrop = $("#modalBackdrop");

const searchInput = $("#toolSearch");
const toolCount = $("#toolCount");
const noResults = $("#noResults");

const themeBtn = $("#themeBtn");


/* =========================================================
   YEAR
   ========================================================= */

$("#year").textContent =
  String(new Date().getFullYear());


/* =========================================================
   DARK MODE
   ========================================================= */

const savedTheme =
  localStorage.getItem("filefox-theme");


if (savedTheme === "dark") {

  document.body.classList.add("dark");

}


themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle(
      "dark"
    );


    localStorage.setItem(
      "filefox-theme",
      document.body.classList.contains("dark")
        ? "dark"
        : "light"
    );

  }
);


/* =========================================================
   MODAL
   ========================================================= */

function openModal(html) {

  modalContent.innerHTML =
    html;

  modal.classList.remove(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  modal.classList.add(
    "hidden"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  modalContent.innerHTML =
    "";

  document.body.style.overflow =
    "";

}


modalClose.addEventListener(
  "click",
  closeModal
);


modalBackdrop.addEventListener(
  "click",
  closeModal
);


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
   TOOL COUNT
   ========================================================= */

function updateToolCount() {

  const cards =
    $$(".tool-card");

  const visible =
    cards.filter(
      card =>
        !card.classList.contains(
          "hidden-card"
        )
    ).length;


  toolCount.textContent =
    visible === cards.length
      ? `${cards.length} tools`
      : `${visible} of ${cards.length} tools`;

}


updateToolCount();


/* =========================================================
   SEARCH
   ========================================================= */

function filterTools() {

  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  const activeCategory =
    $(".category.active")
      ?.dataset.category ||
    "all";


  let visible =
    0;


  $$(".tool-card").forEach(
    card => {

      const searchable =
        (
          card.dataset.search ||
          ""
        ).toLowerCase();


      const category =
        card.dataset.category;


      const matchesSearch =
        !query ||
        searchable.includes(
          query
        );


      const matchesCategory =
        activeCategory === "all" ||
        category === activeCategory;


      const show =
        matchesSearch &&
        matchesCategory;


      card.classList.toggle(
        "hidden-card",
        !show
      );


      if (show) {
        visible++;
      }

    }
  );


  noResults.classList.toggle(
    "hidden",
    visible !== 0
  );


  updateToolCount();

}


searchInput.addEventListener(
  "input",
  filterTools
);


/* =========================================================
   CATEGORY
   ========================================================= */

$$(".category").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        $$(".category").forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );


        button.classList.add(
          "active"
        );


        filterTools();

      }
    );

  }
);


/* =========================================================
   CTRL/CMD + K
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
   HERO PHOTO LAB
   ========================================================= */

$("#heroEnhanceBtn").addEventListener(
  "click",
  openEnhancer
);


/* =========================================================
   TOOL DISPATCH
   ========================================================= */

$$(".tool-btn").forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;


        switch (action) {

          case "converter":
            openConverter();
            break;


          case "compress":
            openCompressor();
            break;


          case "resize":
            openResizer();
            break;


          case "enhance":
            openEnhancer();
            break;


          case "background":
            openBackgroundRemover();
            break;


          case "pdf":
            openPDFTool();
            break;


          case "qr":
            openQRTool();
            break;


          case "counter":
            openCounter();
            break;


          case "case":
            openCaseConverter();
            break;


          case "clean":
            openTextCleaner();
            break;


          case "password":
            openPasswordTool();
            break;


          case "calculator":
            openCalculator();
            break;

        }

      }
    );

  }
);


/* =========================================================
   FILE PICKER
   ========================================================= */

function uploadHTML(
  accept = "image/jpeg,image/png,image/webp"
) {

  return `

    <div
      class="drop-zone"
      id="dropZone">

      <div class="drop-icon">
        🖼️
      </div>

      <strong>
        Choose an image
      </strong>

      <p>
        JPG, PNG or WebP
      </p>

      <label class="choose-btn">

        Choose file

        <input
          id="fileInput"
          class="file-input"
          type="file"
          accept="${accept}">

      </label>

    </div>

  `;

}


/* =========================================================
   FILE READER
   ========================================================= */

function readImage(file) {

  return new Promise(
    (resolve, reject) => {

      if (!file) {

        reject(
          new Error(
            "Please choose an image."
          )
        );

        return;

      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        reject(
          new Error(
            "Please choose a valid image file."
          )
        );

        return;

      }


      const url =
        URL.createObjectURL(
          file
        );


      const image =
        new Image();


      image.onload =
        () => {

          URL.revokeObjectURL(
            url
          );


          if (
            !image.naturalWidth ||
            !image.naturalHeight
          ) {

            reject(
              new Error(
                "The image dimensions could not be read."
              )
            );

            return;

          }


          resolve({
            image,
            file
          });

        };


      image.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );


          reject(
            new Error(
              "This image could not be opened."
            )
          );

        };


      image.src =
        url;

    }
  );

}


/* =========================================================
   PREVIEW URL
   ========================================================= */

function previewURL(file) {

  return URL.createObjectURL(
    file
  );

}


/* =========================================================
   IMAGE CANVAS
   ========================================================= */

function createCanvas(
  image,
  maxSide = 2600
) {

  let width =
    image.naturalWidth;

  let height =
    image.naturalHeight;


  const largest =
    Math.max(
      width,
      height
    );


  if (
    largest > maxSide
  ) {

    const ratio =
      maxSide / largest;

    width =
      Math.round(
        width * ratio
      );

    height =
      Math.round(
        height * ratio
      );

  }


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


  if (!ctx) {

    throw new Error(
      "Your browser could not create an image canvas."
    );

  }


  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    "high";


  ctx.drawImage(
    image,
    0,
    0,
    width,
    height
  );


  return canvas;

}


/* =========================================================
   CANVAS → BLOB
   ========================================================= */

function canvasBlob(
  canvas,
  type,
  quality
) {

  return new Promise(
    (resolve, reject) => {

      canvas.toBlob(
        blob => {

          if (!blob) {

            reject(
              new Error(
                "The browser could not create the output file."
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

  if (!blob) {

    showError(
      "Nothing is available to download."
    );

    return;

  }


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


  link.style.display =
    "none";


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  setTimeout(
    () => {
      URL.revokeObjectURL(
        url
      );
    },
    1500
  );

}


/* =========================================================
   BYTES
   ========================================================= */

function bytes(size) {

  if (
    !Number.isFinite(size) ||
    size <= 0
  ) {

    return "0 B";

  }


  const units =
    [
      "B",
      "KB",
      "MB",
      "GB"
    ];


  const index =
    Math.min(
      units.length - 1,
      Math.floor(
        Math.log(size) /
        Math.log(1024)
      )
    );


  return (
    (
      size /
      Math.pow(
        1024,
        index
      )
    ).toFixed(
      index === 0
        ? 0
        : 1
    )
    +
    " "
    +
    units[index]
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

  const old =
    document.getElementById(
      "filefox-error"
    );


  if (old) {
    old.remove();
  }


  const box =
    document.createElement(
      "div"
    );


  box.id =
    "filefox-error";


  box.textContent =
    message;


  box.style.cssText = `

    position:fixed;
    left:50%;
    bottom:22px;
    transform:translateX(-50%);
    z-index:9999;
    width:max-content;
    max-width:calc(100% - 28px);
    padding:12px 16px;
    border-radius:13px;
    background:#b3261e;
    color:white;
    font:700 12px system-ui;
    box-shadow:0 15px 40px rgba(0,0,0,.25);
    text-align:center;

  `;


  document.body.appendChild(
    box
  );


  setTimeout(
    () => {

      if (box.isConnected) {
        box.remove();
      }

    },
    3500
  );

}


/* =========================================================
   IMAGE CONVERTER
   ========================================================= */

function openConverter() {

  openModal(`

    <h2 class="modal-title">
      Image Converter
    </h2>

    <p class="modal-description">
      Convert JPG, PNG or WebP to the format you need.
    </p>

    ${uploadHTML()}

    <div id="converterArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        $("#converterArea")
          .innerHTML = `

            <div class="preview-wrap">

              <img
                class="preview-image"
                src="${previewURL(file)}">

              <div class="stats-grid">

                <div class="stat">
                  <strong>
                    ${image.naturalWidth}
                  </strong>
                  Width
                </div>

                <div class="stat">
                  <strong>
                    ${image.naturalHeight}
                  </strong>
                  Height
                </div>

                <div class="stat">
                  <strong>
                    ${bytes(file.size)}
                  </strong>
                  Size
                </div>

              </div>


              <div class="control">

                <div class="control-label">
                  Output format
                </div>


                <div class="action-row">

                  <button
                    class="action-btn secondary"
                    data-output="png">

                    PNG

                  </button>

                  <button
                    class="action-btn secondary"
                    data-output="jpeg">

                    JPG

                  </button>

                  <button
                    class="action-btn secondary"
                    data-output="webp">

                    WebP

                  </button>

                </div>

              </div>


              <div
                id="converterResult"
                class="result hidden">
              </div>

            </div>

          `;


        $$("#converterArea [data-output]")
          .forEach(
            button => {

              button.addEventListener(
                "click",
                async () => {

                  await convertImage(
                    image,
                    button.dataset.output
                  );

                }
              );

            }
          );


      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   CONVERT IMAGE
   ========================================================= */

async function convertImage(
  image,
  output
) {

  try {

    const canvas =
      createCanvas(
        image,
        3200
      );


    const type =
      output === "png"
        ? "image/png"
        : output === "webp"
          ? "image/webp"
          : "image/jpeg";


    if (
      type === "image/jpeg"
    ) {

      const ctx =
        canvas.getContext(
          "2d"
        );


      ctx.globalCompositeOperation =
        "destination-over";

      ctx.fillStyle =
        "#ffffff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.globalCompositeOperation =
        "source-over";

    }


    const blob =
      await canvasBlob(
        canvas,
        type,
        .94
      );


    const extension =
      output === "jpeg"
        ? "jpg"
        : output;


    const result =
      $("#converterResult");


    result.classList.remove(
      "hidden"
    );


    result.innerHTML = `

      <strong>
        Conversion complete
      </strong>

      <p>
        Output:
        ${extension.toUpperCase()}
        ·
        ${bytes(blob.size)}
      </p>

      <button
        id="downloadConverted"
        class="action-btn">

        Download ${extension.toUpperCase()}

      </button>

    `;


    $("#downloadConverted")
      .onclick =
      () =>
        downloadBlob(
          blob,
          `filefox-converted.${extension}`
        );

  }

  catch (error) {

    showError(
      error.message
    );

  }

}


/* =========================================================
   COMPRESSOR
   ========================================================= */

function openCompressor() {

  openModal(`

    <h2 class="modal-title">
      Image Compressor
    </h2>

    <p class="modal-description">
      Lower the file size while controlling JPEG quality.
    </p>

    ${uploadHTML()}

    <div id="compressArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        $("#compressArea")
          .innerHTML = `

            <div class="preview-wrap">

              <img
                class="preview-image"
                src="${previewURL(file)}">


              <div class="control">

                <div class="control-label">

                  Quality

                  <span id="qualityValue">
                    82%
                  </span>

                </div>

                <input
                  id="quality"
                  type="range"
                  min="20"
                  max="100"
                  value="82">

              </div>


              <div class="action-row">

                <button
                  id="compressButton"
                  class="action-btn">

                  Compress image

                </button>

              </div>


              <div
                id="compressResult"
                class="result hidden">
              </div>

            </div>

          `;


        $("#quality")
          .addEventListener(
            "input",
            event => {

              $("#qualityValue")
                .textContent =
                `${event.target.value}%`;

            }
          );


        $("#compressButton")
          .addEventListener(
            "click",
            async () => {

              try {

                const canvas =
                  createCanvas(
                    image,
                    2400
                  );


                const quality =
                  Number(
                    $("#quality").value
                  ) / 100;


                const blob =
                  await canvasBlob(
                    canvas,
                    "image/jpeg",
                    quality
                  );


                const result =
                  $("#compressResult");


                result.classList.remove(
                  "hidden"
                );


                result.innerHTML = `

                  <strong>
                    Compression complete
                  </strong>

                  <p>
                    Original:
                    ${bytes(file.size)}
                    <br>
                    New:
                    ${bytes(blob.size)}
                  </p>

                  <button
                    id="downloadCompressed"
                    class="action-btn">

                    Download compressed JPG

                  </button>

                `;


                $("#downloadCompressed")
                  .onclick =
                  () =>
                    downloadBlob(
                      blob,
                      "filefox-compressed.jpg"
                    );

              }

              catch (error) {

                showError(
                  error.message
                );

              }

            }
          );

      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   RESIZER
   ========================================================= */

function openResizer() {

  openModal(`

    <h2 class="modal-title">
      Image Resizer
    </h2>

    <p class="modal-description">
      Change image dimensions without losing the original file.
    </p>

    ${uploadHTML()}

    <div id="resizeArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        const width =
          image.naturalWidth;

        const height =
          image.naturalHeight;


        $("#resizeArea")
          .innerHTML = `

            <div class="preview-wrap">

              <img
                class="preview-image"
                src="${previewURL(file)}">


              <div class="two-col">

                <div class="control">

                  <div class="control-label">
                    Width
                  </div>

                  <input
                    id="resizeWidth"
                    type="number"
                    min="1"
                    value="${width}">

                </div>


                <div class="control">

                  <div class="control-label">
                    Height
                  </div>

                  <input
                    id="resizeHeight"
                    type="number"
                    min="1"
                    value="${height}">

                </div>

              </div>


              <div class="control">

                <label>

                  <input
                    id="keepRatio"
                    type="checkbox"
                    checked>

                  Keep aspect ratio

                </label>

              </div>


              <div class="action-row">

                <button
                  id="resizeButton"
                  class="action-btn">

                  Resize image

                </button>

              </div>


              <div
                id="resizeResult"
                class="result hidden">
              </div>

            </div>

          `;


        const widthInput =
          $("#resizeWidth");

        const heightInput =
          $("#resizeHeight");

        const keep =
          $("#keepRatio");


        const ratio =
          width / height;


        widthInput.addEventListener(
          "input",
          () => {

            if (!keep.checked) {
              return;
            }


            const value =
              Number(
                widthInput.value
              );


            if (value > 0) {

              heightInput.value =
                Math.round(
                  value / ratio
                );

            }

          }
        );


        heightInput.addEventListener(
          "input",
          () => {

            if (!keep.checked) {
              return;
            }


            const value =
              Number(
                heightInput.value
              );


            if (value > 0) {

              widthInput.value =
                Math.round(
                  value * ratio
                );

            }

          }
        );


        $("#resizeButton")
          .addEventListener(
            "click",
            async () => {

              try {

                const w =
                  Number(
                    widthInput.value
                  );

                const h =
                  Number(
                    heightInput.value
                  );


                if (
                  !Number.isFinite(w) ||
                  !Number.isFinite(h) ||
                  w < 1 ||
                  h < 1
                ) {

                  throw new Error(
                    "Enter valid width and height."
                  );

                }


                if (
                  w > 5000 ||
                  h > 5000
                ) {

                  throw new Error(
                    "Maximum output dimension is 5000px."
                  );

                }


                const canvas =
                  document.createElement(
                    "canvas"
                  );


                canvas.width =
                  Math.round(w);

                canvas.height =
                  Math.round(h);


                const ctx =
                  canvas.getContext(
                    "2d"
                  );


                ctx.imageSmoothingEnabled =
                  true;

                ctx.imageSmoothingQuality =
                  "high";


                ctx.drawImage(
                  image,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );


                const blob =
                  await canvasBlob(
                    canvas,
                    "image/png"
                  );


                const result =
                  $("#resizeResult");


                result.classList.remove(
                  "hidden"
                );


                result.innerHTML = `

                  <strong>
                    Resize complete
                  </strong>

                  <p>
                    ${canvas.width} × ${canvas.height}
                  </p>

                  <button
                    id="downloadResized"
                    class="action-btn">

                    Download PNG

                  </button>

                `;


                $("#downloadResized")
                  .onclick =
                  () =>
                    downloadBlob(
                      blob,
                      "filefox-resized.png"
                    );

              }

              catch (error) {

                showError(
                  error.message
                );

              }

            }
          );

      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   PHOTO LAB
   ========================================================= */

function openEnhancer() {

  openModal(`

    <h2 class="modal-title">
      Photo Lab — DSLR Look
    </h2>

    <p class="modal-description">
      Adjust the image manually or choose a preset.
      This is enhancement, not a real DSLR camera simulation.
    </p>

    ${uploadHTML()}

    <div id="enhanceArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        $("#enhanceArea")
          .innerHTML = `

            <div class="preview-wrap">

              <div class="compare">

                <div class="compare-item">

                  <div class="compare-label">
                    Original
                  </div>

                  <img
                    src="${previewURL(file)}">

                </div>


                <div class="compare-item">

                  <div class="compare-label">
                    Enhanced
                  </div>

                  <img
                    id="enhancedPreview">

                </div>

              </div>


              <div class="control">

                <div class="control-label">

                  Brightness

                  <span id="brightValue">
                    0
                  </span>

                </div>

                <input
                  id="bright"
                  type="range"
                  min="-35"
                  max="35"
                  value="8">

              </div>


              <div class="control">

                <div class="control-label">

                  Contrast

                  <span id="contrastValue">
                    0
                  </span>

                </div>

                <input
                  id="contrast"
                  type="range"
                  min="-40"
                  max="50"
                  value="14">

              </div>


              <div class="control">

                <div class="control-label">

                  Saturation

                  <span id="saturationValue">
                    0
                  </span>

                </div>

                <input
                  id="saturation"
                  type="range"
                  min="-40"
                  max="60"
                  value="12">

              </div>


              <div class="control">

                <div class="control-label">

                  Sharpness

                  <span id="sharpValue">
                    0
                  </span>

                </div>

                <input
                  id="sharp"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value="0.8">

              </div>


              <div class="control">

                <div class="control-label">

                  Warmth

                  <span id="warmValue">
                    0
                  </span>

                </div>

                <input
                  id="warm"
                  type="range"
                  min="-25"
                  max="25"
                  value="3">

              </div>


              <div class="action-row">

                <button
                  class="action-btn secondary"
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
                  id="downloadEnhanced"
                  class="action-btn">

                  Enhance & Download

                </button>

              </div>

            </div>

          `;


        const controls = {

          bright:
            $("#bright"),

          contrast:
            $("#contrast"),

          saturation:
            $("#saturation"),

          sharp:
            $("#sharp"),

          warm:
            $("#warm")

        };


        function updateLabels() {

          $("#brightValue")
            .textContent =
            controls.bright.value;

          $("#contrastValue")
            .textContent =
            controls.contrast.value;

          $("#saturationValue")
            .textContent =
            controls.saturation.value;

          $("#sharpValue")
            .textContent =
            controls.sharp.value;

          $("#warmValue")
            .textContent =
            controls.warm.value;

        }


        function refresh() {

          updateLabels();


          const canvas =
            enhanceCanvas(
              image,
              controls
            );


          $("#enhancedPreview")
            .src =
            canvas.toDataURL(
              "image/jpeg",
              .9
            );

        }


        Object.values(
          controls
        ).forEach(
          input => {

            input.addEventListener(
              "input",
              refresh
            );

          }
        );


        $$("[data-preset]")
          .forEach(
            button => {

              button.addEventListener(
                "click",
                () => {

                  const preset =
                    button.dataset.preset;


                  if (
                    preset === "natural"
                  ) {

                    controls.bright.value =
                      8;

                    controls.contrast.value =
                      14;

                    controls.saturation.value =
                      12;

                    controls.sharp.value =
                      .8;

                    controls.warm.value =
                      3;

                  }


                  if (
                    preset === "vivid"
                  ) {

                    controls.bright.value =
                      10;

                    controls.contrast.value =
                      23;

                    controls.saturation.value =
                      30;

                    controls.sharp.value =
                      1.2;

                    controls.warm.value =
                      5;

                  }


                  if (
                    preset === "cinematic"
                  ) {

                    controls.bright.value =
                      0;

                    controls.contrast.value =
                      27;

                    controls.saturation.value =
                      5;

                    controls.sharp.value =
                      .9;

                    controls.warm.value =
                      -4;

                  }


                  refresh();

                }
              );

            }
          );


        $("#downloadEnhanced")
          .addEventListener(
            "click",
            async () => {

              try {

                const canvas =
                  enhanceCanvas(
                    image,
                    controls
                  );


                const blob =
                  await canvasBlob(
                    canvas,
                    "image/jpeg",
                    .94
                  );


                downloadBlob(
                  blob,
                  "filefox-photo-enhanced.jpg"
                );

              }

              catch (error) {

                showError(
                  error.message
                );

              }

            }
          );


        refresh();

      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   PHOTO ENHANCEMENT
   ========================================================= */

function enhanceCanvas(
  image,
  controls
) {

  const canvas =
    createCanvas(
      image,
      2600
    );


  const ctx =
    canvas.getContext(
      "2d"
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
    Number(
      controls.bright.value
    );


  const contrast =
    Number(
      controls.contrast.value
    );


  const saturation =
    Number(
      controls.saturation.value
    );


  const warmth =
    Number(
      controls.warm.value
    );


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

    let r =
      data[i];

    let g =
      data[i + 1];

    let b =
      data[i + 2];


    /* brightness */

    r += brightness;
    g += brightness;
    b += brightness;


    /* contrast */

    r =
      contrastFactor *
      (r - 128) +
      128;

    g =
      contrastFactor *
      (g - 128) +
      128;

    b =
      contrastFactor *
      (b - 128) +
      128;


    /* saturation */

    const avg =
      (r + g + b) / 3;


    const sat =
      1 +
      saturation / 100;


    r =
      avg +
      (r - avg) * sat;

    g =
      avg +
      (g - avg) * sat;

    b =
      avg +
      (b - avg) * sat;


    /* warmth */

    r +=
      warmth * .8;

    b -=
      warmth * .45;


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


  /*
    Lightweight clarity:
    blend a very small edge-emphasis layer.
  */

  const sharp =
    Number(
      controls.sharp.value
    );


  if (sharp > 0) {

    applyClarity(
      canvas,
      sharp
    );

  }


  return canvas;

}


/* =========================================================
   CLAMP
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


/* =========================================================
   CLARITY
   ========================================================= */

function applyClarity(
  canvas,
  amount
) {

  const ctx =
    canvas.getContext(
      "2d"
    );


  const width =
    canvas.width;

  const height =
    canvas.height;


  /*
    Keep this conservative so that
    mobile devices do not get overloaded.
  */

  if (
    width * height >
    7_000_000
  ) {

    return;

  }


  const original =
    ctx.getImageData(
      0,
      0,
      width,
      height
    );


  const source =
    original.data;


  const output =
    new Uint8ClampedArray(
      source
    );


  const strength =
    Math.min(
      .22,
      amount * .11
    );


  /*
    Simple edge emphasis.
    We compare each pixel with the pixel
    immediately to its left.
  */

  for (
    let y = 0;
    y < height;
    y++
  ) {

    const row =
      y * width;


    for (
      let x = 1;
      x < width;
      x++
    ) {

      const index =
        (row + x) * 4;

      const previous =
        (row + x - 1) * 4;


      for (
        let channel = 0;
        channel < 3;
        channel++
      ) {

        const difference =
          source[index + channel] -
          source[previous + channel];


        output[index + channel] =
          clamp(
            source[index + channel] +
            difference * strength
          );

      }

    }

  }


  original.data.set(
    output
  );


  ctx.putImageData(
    original,
    0,
    0
  );

}


/* =========================================================
   BACKGROUND REMOVER
   ========================================================= */

function openBackgroundRemover() {

  openModal(`

    <h2 class="modal-title">
      Background Remover
    </h2>

    <p class="modal-description">
      Works best when the background has a similar color,
      such as a simple wall or plain backdrop.
    </p>

    ${uploadHTML()}

    <div id="backgroundArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        $("#backgroundArea")
          .innerHTML = `

            <div class="preview-wrap">

              <img
                class="preview-image"
                src="${previewURL(file)}">


              <div class="control">

                <div class="control-label">

                  Background tolerance

                  <span id="toleranceValue">
                    38
                  </span>

                </div>

                <input
                  id="tolerance"
                  type="range"
                  min="10"
                  max="100"
                  value="38">

              </div>


              <div class="action-row">

                <button
                  id="removeBackground"
                  class="action-btn">

                  Remove background

                </button>

              </div>


              <div
                id="backgroundResult"
                class="result hidden">
              </div>

            </div>

          `;


        $("#tolerance")
          .addEventListener(
            "input",
            event => {

              $("#toleranceValue")
                .textContent =
                event.target.value;

            }
          );


        $("#removeBackground")
          .addEventListener(
            "click",
            async () => {

              try {

                const canvas =
                  createCanvas(
                    image,
                    2200
                  );


                const ctx =
                  canvas.getContext(
                    "2d"
                  );


                const data =
                  ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                  );


                const pixels =
                  data.data;


                const background =
                  sampleCorners(
                    pixels,
                    canvas.width,
                    canvas.height
                  );


                const tolerance =
                  Number(
                    $("#tolerance").value
                  );


                for (
                  let i = 0;
                  i < pixels.length;
                  i += 4
                ) {

                  const r =
                    pixels[i];

                  const g =
                    pixels[i + 1];

                  const b =
                    pixels[i + 2];


                  const distance =
                    colorDistance(
                      r,
                      g,
                      b,
                      background.r,
                      background.g,
                      background.b
                    );


                  if (
                    distance <
                    tolerance * 2.4
                  ) {

                    pixels[i + 3] =
                      0;

                  }

                }


                ctx.putImageData(
                  data,
                  0,
                  0
                );


                const blob =
                  await canvasBlob(
                    canvas,
                    "image/png"
                  );


                const result =
                  $("#backgroundResult");


                result.classList.remove(
                  "hidden"
                );


                result.innerHTML = `

                  <strong>
                    Transparent PNG created
                  </strong>

                  <p>
                    This version works best on simple backgrounds.
                  </p>

                  <button
                    id="downloadBackground"
                    class="action-btn">

                    Download transparent PNG

                  </button>

                `;


                $("#downloadBackground")
                  .onclick =
                  () =>
                    downloadBlob(
                      blob,
                      "filefox-transparent.png"
                    );

              }

              catch (error) {

                showError(
                  error.message
                );

              }

            }
          );

      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   COLOR DISTANCE
   ========================================================= */

function colorDistance(
  r1,
  g1,
  b1,
  r2,
  g2,
  b2
) {

  return Math.sqrt(

    Math.pow(
      r1 - r2,
      2
    )

    +

    Math.pow(
      g1 - g2,
      2
    )

    +

    Math.pow(
      b1 - b2,
      2
    )

  );

}


/* =========================================================
   CORNER SAMPLING
   ========================================================= */

function sampleCorners(
  pixels,
  width,
  height
) {

  const size =
    4;


  const points = [

    [size, size],

    [width - size, size],

    [size, height - size],

    [width - size, height - size]

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


      r +=
        pixels[index];

      g +=
        pixels[index + 1];

      b +=
        pixels[index + 2];

    }
  );


  return {

    r:
      r / points.length,

    g:
      g / points.length,

    b:
      b / points.length

  };

}


/* =========================================================
   IMAGE → PDF
   ========================================================= */

function openPDFTool() {

  openModal(`

    <h2 class="modal-title">
      Image → PDF
    </h2>

    <p class="modal-description">
      Choose an image, then use Chrome's print dialog to save it as PDF.
    </p>

    ${uploadHTML()}

    <div id="pdfArea"></div>

  `);


  connectImagePicker(
    async file => {

      try {

        const {
          image
        } =
          await readImage(
            file
          );


        $("#pdfArea")
          .innerHTML = `

            <div class="preview-wrap">

              <img
                class="preview-image"
                src="${previewURL(file)}">


              <div class="action-row">

                <button
                  id="printPDF"
                  class="action-btn">

                  Open PDF print dialog

                </button>

              </div>

            </div>

          `;


        $("#printPDF")
          .addEventListener(
            "click",
            () => {

              const canvas =
                createCanvas(
                  image,
                  2200
                );


              const imageURL =
                canvas.toDataURL(
                  "image/jpeg",
                  .92
                );


              const popup =
                window.open(
                  "",
                  "_blank"
                );


              if (!popup) {

                showError(
                  "Chrome blocked the popup. Allow popups and try again."
                );

                return;

              }


              popup.document.open();


              popup.document.write(`

                <!doctype html>

                <html>

                <head>

                  <title>
                    FileFox PDF
                  </title>

                  <style>

                    html,
                    body {
                      margin:0;
                      padding:0;
                      text-align:center;
                      background:white;
                    }

                    img {
                      max-width:100%;
                      height:auto;
                    }

                    @media print {
                      img {
                        max-width:100%;
                      }
                    }

                  </style>

                </head>

                <body>

                  <img src="${imageURL}">

                  <script>

                    window.addEventListener(
                      "load",
                      function () {
                        setTimeout(
                          function () {
                            window.print();
                          },
                          250
                        );
                      }
                    );

                  <\/script>

                </body>

                </html>

              `);


              popup.document.close();

            }
          );

      }

      catch (error) {

        showError(
          error.message
        );

      }

    }
  );

}


/* =========================================================
   QR TOOL
   ========================================================= */

function openQRTool() {

  openModal(`

    <h2 class="modal-title">
      QR Code Generator
    </h2>

    <p class="modal-description">
      Enter text or a URL to create a QR code.
    </p>


    <div class="control">

      <div class="control-label">
        Text or URL
      </div>

      <textarea
        id="qrInput"
        placeholder="https://example.com">
      </textarea>

    </div>


    <div class="action-row">

      <button
        id="makeQR"
        class="action-btn">

        Generate QR

      </button>

    </div>


    <div
      id="qrOutput"
      class="result">

      QR code will appear here.

    </div>

  `);


  $("#makeQR")
    .addEventListener(
      "click",
      () => {

        const text =
          $("#qrInput")
            .value
            .trim();


        if (!text) {

          showError(
            "Enter text or a URL first."
          );

          return;

        }


        if (
          typeof QRCode ===
          "undefined"
        ) {

          showError(
            "QR library did not load. Check your internet connection."
          );

          return;

        }


        const output =
          $("#qrOutput");


        output.innerHTML =
          `<div id="qrCode"></div>`;


        new QRCode(
          $("#qrCode"),
          {
            text,
            width: 220,
            height: 220,
            correctLevel:
              QRCode.CorrectLevel.M
          }
        );

      }
    );

}


/* =========================================================
   WORD COUNTER
   ========================================================= */

function openCounter() {

  openModal(`

    <h2 class="modal-title">
      Word Counter
    </h2>

    <p class="modal-description">
      Count words, characters, lines and sentences.
    </p>


    <textarea
      id="counterInput"
      placeholder="Type or paste text here...">
    </textarea>


    <div
      id="counterResult"
      class="result">

      Start typing to see the count.

    </div>

  `);


  $("#counterInput")
    .addEventListener(
      "input",
      updateCounter
    );

}


function updateCounter() {

  const text =
    $("#counterInput")
      .value;


  const words =
    text.trim()
      ? text.trim().split(/\s+/).length
      : 0;


  const characters =
    text.length;


  const lines =
    text
      ? text.split("\n").length
      : 0;


  const sentences =
    text
      .split(/[.!?]+/)
      .filter(
        part =>
          part.trim()
      ).length;


  $("#counterResult")
    .innerHTML = `

      <strong>
        ${words} words
      </strong>

      <p>
        Characters: ${characters}
        <br>
        Lines: ${lines}
        <br>
        Sentences: ${sentences}
      </p>

    `;

}


/* =========================================================
   CASE CONVERTER
   ========================================================= */

function openCaseConverter() {

  openModal(`

    <h2 class="modal-title">
      Case Converter
    </h2>

    <p class="modal-description">
      Convert your text instantly.
    </p>


    <textarea
      id="caseInput"
      placeholder="Write your text here...">
    </textarea>


    <div class="action-row">

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

    </div>

  `);


  $$("[data-case]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const input =
              $("#caseInput");


            const mode =
              button.dataset.case;


            if (
              mode === "upper"
            ) {

              input.value =
                input.value.toUpperCase();

            }


            if (
              mode === "lower"
            ) {

              input.value =
                input.value.toLowerCase();

            }


            if (
              mode === "title"
            ) {

              input.value =
                input.value
                  .toLowerCase()
                  .replace(
                    /\b\w/g,
                    char =>
                      char.toUpperCase()
                  );

            }

          }
        );

      }
    );

}


/* =========================================================
   TEXT CLEANER
   ========================================================= */

function openTextCleaner() {

  openModal(`

    <h2 class="modal-title">
      Text Cleaner
    </h2>

    <p class="modal-description">
      Remove unnecessary spaces and blank lines.
    </p>


    <textarea
      id="cleanInput"
      placeholder="Paste your text here...">
    </textarea>


    <div class="action-row">

      <button
        id="cleanButton"
        class="action-btn">

        Clean text

      </button>

    </div>

  `);


  $("#cleanButton")
    .addEventListener(
      "click",
      () => {

        const input =
          $("#cleanInput");


        input.value =
          input.value
            .split("\n")
            .map(
              line =>
                line
                  .trim()
                  .replace(
                    /\s+/g,
                    " "
                  )
            )
            .filter(
              Boolean
            )
            .join("\n");

      }
    );

}


/* =========================================================
   PASSWORD
   ========================================================= */

function openPasswordTool() {

  openModal(`

    <h2 class="modal-title">
      Password Generator
    </h2>

    <p class="modal-description">
      Generate a random password locally in your browser.
    </p>


    <div class="control">

      <div class="control-label">

        Length

        <span id="passwordLengthValue">
          16
        </span>

      </div>


      <input
        id="passwordLength"
        type="range"
        min="8"
        max="40"
        value="16">

    </div>


    <div class="action-row">

      <button
        id="generatePassword"
        class="action-btn">

        Generate password

      </button>

    </div>


    <div
      id="passwordResult"
      class="result">

      Your password will appear here.

    </div>

  `);


  const length =
    $("#passwordLength");


  length.addEventListener(
    "input",
    () => {

      $("#passwordLengthValue")
        .textContent =
        length.value;

    }
  );


  $("#generatePassword")
    .addEventListener(
      "click",
      generatePassword
    );

}


function generatePassword() {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ" +
    "abcdefghijkmnopqrstuvwxyz" +
    "23456789!@#$%^&*";


  const length =
    Number(
      $("#passwordLength").value
    );


  let password =
    "";


  if (
    window.crypto &&
    crypto.getRandomValues
  ) {

    const values =
      new Uint32Array(
        length
      );


    crypto.getRandomValues(
      values
    );


    for (
      let i = 0;
      i < length;
      i++
    ) {

      password +=
        chars[
          values[i] %
          chars.length
        ];

    }

  }

  else {

    for (
      let i = 0;
      i < length;
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

  }


  $("#passwordResult")
    .innerHTML = `

      <strong>
        ${escapeHTML(password)}
      </strong>

      <div class="action-row">

        <button
          id="copyPassword"
          class="action-btn">

          Copy

        </button>

      </div>

    `;


  $("#copyPassword")
    .addEventListener(
      "click",
      async () => {

        try {

          await navigator.clipboard.writeText(
            password
          );


          $("#copyPassword")
            .textContent =
            "Copied!";

        }

        catch {

          showError(
            "Clipboard access was blocked by the browser."
          );

        }

      }
    );

}


/* =========================================================
   CALCULATOR
   ========================================================= */

function openCalculator() {

  openModal(`

    <h2 class="modal-title">
      Quick Calculator
    </h2>

    <p class="modal-description">
      Use numbers and basic operators.
    </p>


    <input
      id="calculatorInput"
      type="text"
      inputmode="decimal"
      placeholder="25 * 4 + 10">


    <div class="action-row">

      <button
        id="calculate"
        class="action-btn">

        Calculate

      </button>

    </div>


    <div
      id="calculatorResult"
      class="result">

      Result will appear here.

    </div>

  `);


  $("#calculate")
    .addEventListener(
      "click",
      calculate
    );


  $("#calculatorInput")
    .addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter"
        ) {

          calculate();

        }

      }
    );

}


function calculate() {

  const expression =
    $("#calculatorInput")
      .value
      .trim();


  if (!expression) {

    showError(
      "Enter a calculation."
    );

    return;

  }


  /*
    Only allow simple arithmetic.
    No letters, brackets with code,
    function names, etc.
  */

  if (
    !/^[0-9+\-*/().%\s]+$/
      .test(expression)
  ) {

    showError(
      "Only numbers and basic operators are allowed."
    );

    return;

  }


  try {

    const result =
      Function(
        `"use strict";return (${expression})`
      )();


    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {

      throw new Error();

    }


    $("#calculatorResult")
      .innerHTML = `

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

}


/* =========================================================
   IMAGE PICKER + DRAG DROP
   ========================================================= */

function connectImagePicker(
  callback
) {

  const input =
    $("#fileInput");

  const zone =
    $("#dropZone");


  if (!input || !zone) {
    return;
  }


  input.addEventListener(
    "change",
    () => {

      const file =
        input.files?.[0];


      if (file) {
        callback(file);
      }

    }
  );


  zone.addEventListener(
    "dragover",
    event => {

      event.preventDefault();

      zone.classList.add(
        "dragging"
      );

    }
  );


  zone.addEventListener(
    "dragleave",
    () => {

      zone.classList.remove(
        "dragging"
      );

    }
  );


  zone.addEventListener(
    "drop",
    event => {

      event.preventDefault();

      zone.classList.remove(
        "dragging"
      );


      const file =
        event.dataTransfer
          ?.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        showError(
          "Please drop an image file."
        );

        return;

      }


      callback(file);

    }
  );

                       }
