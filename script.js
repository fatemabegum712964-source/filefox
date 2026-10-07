'use strict';

/* =========================================================
   FILEFOX V2
   One unified tool system
   ========================================================= */

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {
  image: null,
  file: null,
  lastObjectUrl: null
};


const dialog = $('#toolDialog');
const dialogBody = $('#dialogBody');
const dialogTitle = $('#dialogTitle');
const dialogSubtitle = $('#dialogSubtitle');
const toast = $('#toast');


/* =========================================================
   TOOL INFORMATION
   ========================================================= */

const toolMeta = {

  convert: [
    'Image Converter',
    'Convert JPG, PNG and WebP in your browser.'
  ],

  compress: [
    'Image Compressor',
    'Reduce image size while keeping good quality.'
  ],

  resize: [
    'Image Resizer',
    'Resize an image with optional aspect-ratio lock.'
  ],

  crop: [
    'Image Cropper',
    'Crop using precise pixel coordinates.'
  ],

  rotate: [
    'Rotate & Flip',
    'Rotate, mirror and download an image.'
  ],

  enhance: [
    'Photo Enhancer',
    'Create a cleaner, sharper, more polished photo look.'
  ],

  background: [
    'Background Cleaner',
    'Remove a similar plain background and export PNG.'
  ],

  pdf: [
    'Image to PDF',
    'Prepare an image for Chrome print / Save as PDF.'
  ],

  qr: [
    'QR Code Generator',
    'Create a QR code from text or a link.'
  ],

  text: [
    'Text Toolkit',
    'Count, change case and clean text.'
  ],

  password: [
    'Password Generator',
    'Generate a strong random password locally.'
  ],

  calculator: [
    'Quick Calculator',
    'Calculate simple expressions locally.'
  ],

  json: [
    'JSON Formatter',
    'Format and validate JSON locally.'
  ],

  url: [
    'URL Encoder / Decoder',
    'Encode or decode URL text.'
  ],

  html: [
    'HTML Entity Tool',
    'Encode or decode HTML entities.'
  ],

  slug: [
    'Text to Slug',
    'Turn a title into a clean URL slug.'
  ],

  duplicate: [
    'Remove Duplicate Lines',
    'Remove repeated lines while keeping order.'
  ],

  reverse: [
    'Text Reverser',
    'Reverse characters or lines.'
  ],

  lines: [
    'Line Counter',
    'Count lines, non-empty lines and characters.'
  ],

  base64: [
    'Base64 Encoder / Decoder',
    'Encode or decode text locally.'
  ],

  uuid: [
    'UUID Generator',
    'Generate UUIDs locally in your browser.'
  ]

};


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

  return String(value).replace(
    /[&<>'"]/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[character])
  );

}


function showToast(message, type = 'ok') {

  toast.textContent = message;

  toast.dataset.type = type;

  toast.classList.add('show');

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {

    toast.classList.remove('show');

  }, 2800);

}


function formatBytes(bytes) {

  if (!Number.isFinite(bytes)) {
    return '—';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;

}


function downloadBlob(blob, filename) {

  if (!blob) {
    throw new Error('No output was created.');
  }

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {

    URL.revokeObjectURL(url);

  }, 1500);

}


function canvasBlob(
  canvas,
  type = 'image/png',
  quality = 0.92
) {

  return new Promise((resolve, reject) => {

    canvas.toBlob(
      blob => {

        if (blob) {
          resolve(blob);
        } else {
          reject(
            new Error(
              'This browser could not create the image.'
            )
          );
        }

      },
      type,
      quality
    );

  });

}


function loadImage(file) {

  return new Promise((resolve, reject) => {

    if (
      !file ||
      !file.type.startsWith('image/')
    ) {

      reject(
        new Error(
          'Please choose an image file.'
        )
      );

      return;
    }

    const url = URL.createObjectURL(file);

    const image = new Image();

    image.onload = () => {

      URL.revokeObjectURL(url);

      resolve(image);

    };

    image.onerror = () => {

      URL.revokeObjectURL(url);

      reject(
        new Error(
          'The image could not be opened.'
        )
      );

    };

    image.src = url;

  });

}


function safeName(
  file,
  suffix,
  extension
) {

  const base =
    (file?.name || 'file')
      .replace(/\.[^.]+$/, '')
      .replace(
        /[^a-z0-9_-]+/gi,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      )
    || 'file';

  return `${base}-${suffix}.${extension}`;

}


function closeDialog() {

  if (dialog?.open) {

    dialog.close();

  }

  dialogBody.innerHTML = '';

  state.image = null;

  state.file = null;

}


function openDialog(action) {

  const meta =
    toolMeta[action] ||
    [
      'FileFox Tool',
      ''
    ];

  dialogTitle.textContent = meta[0];

  dialogSubtitle.textContent = meta[1];

  dialogBody.innerHTML = '';

  try {

    if (
      typeof dialog.showModal === 'function'
    ) {

      dialog.showModal();

    } else {

      dialog.setAttribute(
        'open',
        ''
      );

    }

    renderTool(action);

  } catch (error) {

    closeDialog();

    showToast(
      error.message ||
      'Could not open this tool.',
      'error'
    );

  }

}


function imagePicker(extra = '') {

  return `

    <div
      class="dropzone"
      id="dropzone"
    >

      <input
        id="fileInput"
        type="file"
        accept="image/*"
        hidden
      >

      <button
        class="drop-button"
        id="pickBtn"
        type="button"
      >

        <span class="drop-icon">
          ↥
        </span>

        <span>

          <strong>
            Choose image
          </strong>

          <small>
            JPG, PNG or WebP
          </small>

        </span>

      </button>

      ${extra}

    </div>

  `;

}


function resultBox(
  id = 'resultBox'
) {

  return `
    <div
      class="tool-result"
      id="${id}"
    ></div>
  `;

}


function wirePicker(onFile) {

  const input = $('#fileInput');

  const pick = $('#pickBtn');

  const zone = $('#dropzone');


  pick?.addEventListener(
    'click',
    () => input.click()
  );


  input?.addEventListener(
    'change',
    () => {

      if (input.files[0]) {

        onFile(input.files[0]);

      }

    }
  );


  [
    'dragenter',
    'dragover'
  ].forEach(eventName => {

    zone?.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        zone.classList.add('drag');

      }
    );

  });


  [
    'dragleave',
    'drop'
  ].forEach(eventName => {

    zone?.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        zone.classList.remove('drag');

      }
    );

  });


  zone?.addEventListener(
    'drop',
    event => {

      const file =
        event.dataTransfer.files[0];

      if (file) {

        onFile(file);

      }

    }
  );

}


function renderPreview(
  result,
  image,
  file
) {

  result.innerHTML = `

    <div class="preview-card">

      <img
        src="${image.src}"
        alt="Preview"
      >

      <div class="preview-info">

        <b>
          ${escapeHTML(file.name)}
        </b>

        <span>
          ${image.naturalWidth}
          ×
          ${image.naturalHeight}
          ·
          ${formatBytes(file.size)}
        </span>

      </div>

    </div>

  `;

}


function renderTool(action) {

  const renderer =
    toolRenderers[action];

  if (!renderer) {

    errorPanel(
      'This tool is not configured yet.'
    );

    return;

  }

  try {

    renderer();

  } catch (error) {

    errorPanel(
      error.message ||
      'Something went wrong.'
    );

  }

}


function errorPanel(message) {

  dialogBody.innerHTML = `

    <div class="error-panel">

      <strong>
        Tool error
      </strong>

      <p>
        ${escapeHTML(message)}
      </p>

      <button
        class="primary"
        data-close-dialog
        type="button"
      >
        Close
      </button>

    </div>

  `;

}


/* =========================================================
   IMAGE TRANSFORM
   ========================================================= */

async function imageTransform(
  file,
  draw,
  type,
  quality,
  suffix,
  extension
) {

  const image =
    await loadImage(file);

  const canvas =
    document.createElement('canvas');

  draw(
    canvas,
    image
  );

  const blob =
    await canvasBlob(
      canvas,
      type,
      quality
    );

  downloadBlob(
    blob,
    safeName(
      file,
      suffix,
      extension
    )
  );

  showToast(
    `Downloaded ${formatBytes(blob.size)}`
  );

}


/* =========================================================
   TOOL RENDERERS
   ========================================================= */

const toolRenderers = {


  /* IMAGE CONVERTER */

  convert() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="control-grid one">

          <label>

            Output format

            <select id="format">

              <option value="image/png">
                PNG
              </option>

              <option value="image/jpeg">
                JPG
              </option>

              <option value="image/webp">
                WebP
              </option>

            </select>

          </label>

        </div>

        ${resultBox()}

      `)}

    `;


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;

          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Convert & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const type =
                  $('#format').value;

                const extension =
                  type === 'image/jpeg'
                    ? 'jpg'
                    : type.split('/')[1];


                await imageTransform(

                  file,

                  (
                    canvas,
                    img
                  ) => {

                    canvas.width =
                      img.naturalWidth;

                    canvas.height =
                      img.naturalHeight;

                    const context =
                      canvas.getContext('2d');

                    if (
                      type === 'image/jpeg'
                    ) {

                      context.fillStyle =
                        '#ffffff';

                      context.fillRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                      );

                    }

                    context.drawImage(
                      img,
                      0,
                      0
                    );

                  },

                  type,

                  0.92,

                  'converted',

                  extension

                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* COMPRESS */

  compress() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="control-grid one">

          <label>

            Quality

            <output id="qualityOut">
              80%
            </output>

            <input
              id="quality"
              type="range"
              min="30"
              max="100"
              value="80"
            >

          </label>

        </div>

        ${resultBox()}

      `)}

    `;


    $('#quality').oninput = () => {

      $('#qualityOut').textContent =
        `${$('#quality').value}%`;

    };


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;

          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <div class="stats">

                <span>
                  Original
                  <b>
                    ${formatBytes(file.size)}
                  </b>
                </span>

                <span>
                  Dimensions
                  <b>
                    ${image.naturalWidth}
                    ×
                    ${image.naturalHeight}
                  </b>
                </span>

                <span>
                  Output
                  <b>
                    JPG
                  </b>
                </span>

              </div>

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Compress & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const quality =
                  Number(
                    $('#quality').value
                  ) / 100;

                const maximumDimension =
                  2400;

                const scale =
                  Math.min(
                    1,
                    maximumDimension /
                    Math.max(
                      image.naturalWidth,
                      image.naturalHeight
                    )
                  );


                const canvas =
                  document.createElement(
                    'canvas'
                  );

                canvas.width =
                  Math.max(
                    1,
                    Math.round(
                      image.naturalWidth *
                      scale
                    )
                  );

                canvas.height =
                  Math.max(
                    1,
                    Math.round(
                      image.naturalHeight *
                      scale
                    )
                  );


                const context =
                  canvas.getContext(
                    '2d',
                    {
                      alpha: false
                    }
                  );


                context.drawImage(
                  image,
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/jpeg',
                    quality
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'compressed',
                    'jpg'
                  )
                );


                showToast(
                  `Compressed: ${formatBytes(blob.size)}`
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* RESIZE */

  resize() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="control-grid">

          <label>

            Width

            <input
              id="w"
              type="number"
              min="1"
              max="6000"
            >

          </label>

          <label>

            Height

            <input
              id="h"
              type="number"
              min="1"
              max="6000"
            >

          </label>

        </div>


        <label class="check">

          <input
            id="lock"
            type="checkbox"
            checked
          >

          Keep aspect ratio

        </label>


        ${resultBox()}

      `)}

    `;


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          $('#w').value =
            image.naturalWidth;

          $('#h').value =
            image.naturalHeight;


          const ratio =
            image.naturalWidth /
            image.naturalHeight;


          $('#w').oninput = () => {

            if (
              $('#lock').checked
            ) {

              $('#h').value =
                Math.round(
                  $('#w').value /
                  ratio
                );

            }

          };


          $('#h').oninput = () => {

            if (
              $('#lock').checked
            ) {

              $('#w').value =
                Math.round(
                  $('#h').value *
                  ratio
                );

            }

          };


          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Resize & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const width =
                  Math.min(
                    6000,
                    Math.max(
                      1,
                      Number(
                        $('#w').value
                      ) ||
                      image.naturalWidth
                    )
                  );


                const height =
                  Math.min(
                    6000,
                    Math.max(
                      1,
                      Number(
                        $('#h').value
                      ) ||
                      image.naturalHeight
                    )
                  );


                const canvas =
                  document.createElement(
                    'canvas'
                  );

                canvas.width =
                  width;

                canvas.height =
                  height;


                canvas
                  .getContext('2d')
                  .drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                  );


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/png'
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'resized',
                    'png'
                  )
                );


                showToast(
                  'Resized image downloaded.'
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* CROP */

  crop() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="control-grid four">

          <label>
            X
            <input
              id="cx"
              type="number"
              min="0"
              value="0"
            >
          </label>

          <label>
            Y
            <input
              id="cy"
              type="number"
              min="0"
              value="0"
            >
          </label>

          <label>
            Width
            <input
              id="cw"
              type="number"
              min="1"
              value="100"
            >
          </label>

          <label>
            Height
            <input
              id="ch"
              type="number"
              min="1"
              value="100"
            >
          </label>

        </div>

        ${resultBox()}

      `)}

    `;


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          $('#cw').value =
            image.naturalWidth;

          $('#ch').value =
            image.naturalHeight;


          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <p class="hint">
                Coordinates are measured from
                the top-left corner of the original image.
              </p>

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Crop & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const x =
                  Math.max(
                    0,
                    Math.min(
                      image.naturalWidth - 1,
                      Number(
                        $('#cx').value
                      ) || 0
                    )
                  );


                const y =
                  Math.max(
                    0,
                    Math.min(
                      image.naturalHeight - 1,
                      Number(
                        $('#cy').value
                      ) || 0
                    )
                  );


                const width =
                  Math.max(
                    1,
                    Math.min(
                      image.naturalWidth - x,
                      Number(
                        $('#cw').value
                      ) || 1
                    )
                  );


                const height =
                  Math.max(
                    1,
                    Math.min(
                      image.naturalHeight - y,
                      Number(
                        $('#ch').value
                      ) || 1
                    )
                  );


                const canvas =
                  document.createElement(
                    'canvas'
                  );


                canvas.width =
                  width;

                canvas.height =
                  height;


                canvas
                  .getContext('2d')
                  .drawImage(
                    image,
                    x,
                    y,
                    width,
                    height,
                    0,
                    0,
                    width,
                    height
                  );


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/png'
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'cropped',
                    'png'
                  )
                );


                showToast(
                  'Cropped image downloaded.'
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* ROTATE / FLIP */

  rotate() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="segmented">

          <button
            data-rotate="90"
            type="button"
          >
            Rotate 90°
          </button>

          <button
            data-rotate="180"
            type="button"
          >
            Rotate 180°
          </button>

          <button
            data-rotate="270"
            type="button"
          >
            Rotate 270°
          </button>

          <button
            data-flip="x"
            type="button"
          >
            Flip horizontal
          </button>

          <button
            data-flip="y"
            type="button"
          >
            Flip vertical
          </button>

        </div>

        ${resultBox()}

      `)}

    `;


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          let angle = 0;

          let flipX = 1;

          let flipY = 1;


          $$('[data-rotate]')
            .forEach(button => {

              button.onclick = () => {

                angle =
                  Number(
                    button.dataset.rotate
                  );

              };

            });


          $$('[data-flip]')
            .forEach(button => {

              button.onclick = () => {

                if (
                  button.dataset.flip === 'x'
                ) {

                  flipX *= -1;

                } else {

                  flipY *= -1;

                }

              };

            });


          result.insertAdjacentHTML(
            'beforeend',
            `

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Apply & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const radians =
                  angle *
                  Math.PI /
                  180;


                const swap =
                  angle === 90 ||
                  angle === 270;


                const canvas =
                  document.createElement(
                    'canvas'
                  );


                canvas.width =
                  swap
                    ? image.naturalHeight
                    : image.naturalWidth;


                canvas.height =
                  swap
                    ? image.naturalWidth
                    : image.naturalHeight;


                const context =
                  canvas.getContext('2d');


                context.translate(
                  canvas.width / 2,
                  canvas.height / 2
                );


                context.rotate(
                  radians
                );


                context.scale(
                  flipX,
                  flipY
                );


                context.drawImage(
                  image,
                  -image.naturalWidth / 2,
                  -image.naturalHeight / 2
                );


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/png'
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'edited',
                    'png'
                  )
                );


                showToast(
                  'Edited image downloaded.'
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* PHOTO ENHANCER */

  enhance() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="preset-row">

          <button
            data-preset="natural"
            type="button"
          >
            Natural
          </button>

          <button
            data-preset="vivid"
            type="button"
          >
            Vivid
          </button>

          <button
            data-preset="cinematic"
            type="button"
          >
            Cinematic
          </button>

        </div>


        <div class="control-grid">

          <label>

            Brightness

            <output id="bo">
              0
            </output>

            <input
              id="b"
              type="range"
              min="-40"
              max="40"
              value="0"
            >

          </label>


          <label>

            Contrast

            <output id="co">
              0
            </output>

            <input
              id="c"
              type="range"
              min="-40"
              max="40"
              value="0"
            >

          </label>


          <label>

            Saturation

            <output id="so">
              0
            </output>

            <input
              id="s"
              type="range"
              min="-40"
              max="60"
              value="0"
            >

          </label>


          <label>

            Warmth

            <output id="wo">
              0
            </output>

            <input
              id="w"
              type="range"
              min="-30"
              max="30"
              value="0"
            >

          </label>


          <label>

            Sharpness

            <output id="sho">
              0
            </output>

            <input
              id="sh"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value="0"
            >

          </label>

        </div>


        ${resultBox()}

      `)}

    `;


    const sync =
      () => {

        [
          'b',
          'c',
          's',
          'w',
          'sh'
        ].forEach(id => {

          const output =
            $(`#${id}o`);

          if (output) {

            output.textContent =
              $(`#${id}`).value;

          }

        });

      };


    sync();


    [
      'b',
      'c',
      's',
      'w',
      'sh'
    ].forEach(id => {

      $(`#${id}`).oninput =
        sync;

    });


    const presets = {

      natural: [
        4,
        8,
        5,
        2,
        0.5
      ],

      vivid: [
        3,
        15,
        25,
        3,
        1
      ],

      cinematic: [
        -2,
        18,
        -5,
        -4,
        1.2
      ]

    };


    $$('[data-preset]')
      .forEach(button => {

        button.onclick = () => {

          const values =
            presets[
              button.dataset.preset
            ];


          [
            'b',
            'c',
            's',
            'w',
            'sh'
          ].forEach(
            (id, index) => {

              $(`#${id}`).value =
                values[index];

            }
          );


          sync();

        };

      });


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <p class="hint">
                Pixel processing is used here,
                so the enhancer does not depend on
                CSS filter support.
              </p>

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Enhance & Download
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const maximum =
                  2200;


                const scale =
                  Math.min(
                    1,
                    maximum /
                    Math.max(
                      image.naturalWidth,
                      image.naturalHeight
                    )
                  );


                const width =
                  Math.max(
                    1,
                    Math.round(
                      image.naturalWidth *
                      scale
                    )
                  );


                const height =
                  Math.max(
                    1,
                    Math.round(
                      image.naturalHeight *
                      scale
                    )
                  );


                const canvas =
                  document.createElement(
                    'canvas'
                  );


                canvas.width =
                  width;

                canvas.height =
                  height;


                const context =
                  canvas.getContext('2d');


                context.drawImage(
                  image,
                  0,
                  0,
                  width,
                  height
                );


                const imageData =
                  context.getImageData(
                    0,
                    0,
                    width,
                    height
                  );


                const pixels =
                  imageData.data;


                const brightness =
                  Number(
                    $('#b').value
                  ) * 2.55;


                const contrast =
                  Number(
                    $('#c').value
                  );


                const saturation =
                  1 +
                  Number(
                    $('#s').value
                  ) / 100;


                const warmth =
                  Number(
                    $('#w').value
                  ) * 1.4;


                const sharpness =
                  Number(
                    $('#sh').value
                  );


                const factor =
                  (
                    259 *
                    (contrast + 255)
                  ) /
                  (
                    255 *
                    (259 - contrast)
                  );


                for (
                  let index = 0;
                  index < pixels.length;
                  index += 4
                ) {

                  let red =
                    pixels[index];


                  let green =
                    pixels[index + 1];


                  let blue =
                    pixels[index + 2];


                  red =
                    factor *
                    (red - 128) +
                    128 +
                    brightness +
                    warmth;


                  green =
                    factor *
                    (green - 128) +
                    128 +
                    brightness;


                  blue =
                    factor *
                    (blue - 128) +
                    128 +
                    brightness -
                    warmth;


                  const gray =
                    0.299 * red +
                    0.587 * green +
                    0.114 * blue;


                  red =
                    gray +
                    (red - gray) *
                    saturation;


                  green =
                    gray +
                    (green - gray) *
                    saturation;


                  blue =
                    gray +
                    (blue - gray) *
                    saturation;


                  pixels[index] =
                    Math.max(
                      0,
                      Math.min(
                        255,
                        red
                      )
                    );


                  pixels[index + 1] =
                    Math.max(
                      0,
                      Math.min(
                        255,
                        green
                      )
                    );


                  pixels[index + 2] =
                    Math.max(
                      0,
                      Math.min(
                        255,
                        blue
                      )
                    );

                }


                context.putImageData(
                  imageData,
                  0,
                  0
                );


                /*
                  Optional sharpening.
                */

                if (
                  sharpness > 0 &&
                  width > 2 &&
                  height > 2
                ) {

                  const source =
                    context.getImageData(
                      0,
                      0,
                      width,
                      height
                    );


                  const sourcePixels =
                    source.data;


                  const output =
                    context.createImageData(
                      width,
                      height
                    );


                  const outputPixels =
                    output.data;


                  const amount =
                    sharpness;


                  for (
                    let y = 1;
                    y < height - 1;
                    y++
                  ) {

                    for (
                      let x = 1;
                      x < width - 1;
                      x++
                    ) {

                      const index =
                        (
                          y *
                          width +
                          x
                        ) * 4;


                      for (
                        let channel = 0;
                        channel < 3;
                        channel++
                      ) {

                        const value =
                          sourcePixels[
                            index +
                            channel
                          ] *
                          (
                            1 +
                            4 * amount
                          )
                          -
                          amount *
                          (
                            sourcePixels[
                              index -
                              4 +
                              channel
                            ]
                            +
                            sourcePixels[
                              index +
                              4 +
                              channel
                            ]
                            +
                            sourcePixels[
                              index -
                              width * 4 +
                              channel
                            ]
                            +
                            sourcePixels[
                              index +
                              width * 4 +
                              channel
                            ]
                          );


                        outputPixels[
                          index +
                          channel
                        ] =
                          Math.max(
                            0,
                            Math.min(
                              255,
                              value
                            )
                          );

                      }


                      outputPixels[
                        index + 3
                      ] =
                        sourcePixels[
                          index + 3
                        ];

                    }

                  }


                  context.putImageData(
                    output,
                    0,
                    0
                  );

                }


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/jpeg',
                    0.94
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'enhanced',
                    'jpg'
                  )
                );


                showToast(
                  'Enhanced photo downloaded.'
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* BACKGROUND CLEANER */

  background() {

    dialogBody.innerHTML = `

      ${imagePicker(`

        <div class="control-grid one">

          <label>

            Removal strength

            <output id="tolOut">
              55
            </output>

            <input
              id="tol"
              type="range"
              min="15"
              max="120"
              value="55"
            >

          </label>

        </div>


        <p class="hint">

          Best for photos with a fairly uniform
          light or solid background.

          This is a local color-based remover,
          not full AI segmentation.

        </p>


        ${resultBox()}

      `)}

    `;


    $('#tol').oninput = () => {

      $('#tolOut').textContent =
        $('#tol').value;

    };


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          const result =
            $('#resultBox');

          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Remove Background & Download PNG
                </button>

              </div>

            `
          );


          $('#run').onclick =
            async () => {

              try {

                const maximum =
                  1800;


                const scale =
                  Math.min(
                    1,
                    maximum /
                    Math.max(
                      image.naturalWidth,
                      image.naturalHeight
                    )
                  );


                const width =
                  Math.round(
                    image.naturalWidth *
                    scale
                  );


                const height =
                  Math.round(
                    image.naturalHeight *
                    scale
                  );


                const canvas =
                  document.createElement(
                    'canvas'
                  );


                canvas.width =
                  width;

                canvas.height =
                  height;


                const context =
                  canvas.getContext('2d');


                context.drawImage(
                  image,
                  0,
                  0,
                  width,
                  height
                );


                const data =
                  context.getImageData(
                    0,
                    0,
                    width,
                    height
                  );


                const pixels =
                  data.data;


                const corners = [

                  0,

                  width - 1,

                  (height - 1) *
                  width,

                  (height - 1) *
                  width +
                  width - 1

                ];


                let backgroundRed = 0;

                let backgroundGreen = 0;

                let backgroundBlue = 0;


                corners.forEach(
                  position => {

                    backgroundRed +=
                      pixels[
                        position * 4
                      ];

                    backgroundGreen +=
                      pixels[
                        position * 4 + 1
                      ];

                    backgroundBlue +=
                      pixels[
                        position * 4 + 2
                      ];

                  }
                );


                backgroundRed /= 4;

                backgroundGreen /= 4;

                backgroundBlue /= 4;


                const tolerance =
                  Number(
                    $('#tol').value
                  );


                for (
                  let index = 0;
                  index < pixels.length;
                  index += 4
                ) {

                  const distance =
                    Math.hypot(
                      pixels[index] -
                      backgroundRed,

                      pixels[index + 1] -
                      backgroundGreen,

                      pixels[index + 2] -
                      backgroundBlue
                    );


                  if (
                    distance <
                    tolerance
                  ) {

                    pixels[index + 3] =
                      Math.max(
                        0,
                        Math.round(
                          255 *
                          (
                            distance /
                            tolerance
                          )
                        )
                      );

                  }

                }


                context.putImageData(
                  data,
                  0,
                  0
                );


                const blob =
                  await canvasBlob(
                    canvas,
                    'image/png'
                  );


                downloadBlob(
                  blob,
                  safeName(
                    file,
                    'background-removed',
                    'png'
                  )
                );


                showToast(
                  'Transparent PNG downloaded.'
                );

              } catch (error) {

                showToast(
                  error.message,
                  'error'
                );

              }

            };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* IMAGE TO PDF */

  pdf() {

    dialogBody.innerHTML = `

      ${imagePicker(
        resultBox()
      )}

    `;


    wirePicker(
      async file => {

        try {

          const image =
            await loadImage(file);

          state.file = file;

          state.image = image;


          const result =
            $('#resultBox');


          renderPreview(
            result,
            image,
            file
          );


          result.insertAdjacentHTML(
            'beforeend',
            `

              <p class="hint">

                Chrome will open its print dialog.
                Choose “Save as PDF”.

              </p>


              <div class="tool-actions">

                <button
                  class="primary"
                  id="run"
                >
                  Open Print / Save as PDF
                </button>

              </div>

            `
          );


          $('#run').onclick = () => {

            const popup =
              window.open(
                '',
                '_blank',
                'noopener,noreferrer'
              );


            if (!popup) {

              showToast(
                'Chrome blocked the popup. Allow popups for FileFox and try again.',
                'error'
              );

              return;

            }


            const imageURL =
              URL.createObjectURL(file);


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
                      margin: 0;
                    }

                    body {
                      display: grid;
                      place-items: center;
                      min-height: 100vh;
                    }

                    img {
                      max-width: 100%;
                      max-height: 100vh;
                    }

                  </style>

                </head>

                <body>

                  <img
                    src="${imageURL}"
                    alt="PDF image"
                  >

                </body>

              </html>

            `);


            popup.document.close();


            setTimeout(() => {

              popup.focus();

              popup.print();

            }, 500);

          };


        } catch (error) {

          showToast(
            error.message,
            'error'
          );

        }

      }
    );

  },


  /* QR */

  qr() {

    dialogBody.innerHTML = `

      <label>

        Text or link

        <textarea
          id="qrText"
          rows="5"
          placeholder="https://example.com"
        ></textarea>

      </label>


      <label>

        Size

        <select id="qrSize">

          <option value="220">
            220 px
          </option>

          <option value="320">
            320 px
          </option>

          <option value="480">
            480 px
          </option>

        </select>

      </label>


      <div
        id="qrBox"
        class="qr-box"
      ></div>


      <div class="tool-actions">

        <button
          class="primary"
          id="makeQR"
          type="button"
        >
          Generate QR
        </button>

        <button
          id="downloadQR"
          type="button"
        >
          Download PNG
        </button>

      </div>

    `;


    $('#makeQR').onclick = () => {

      const box =
        $('#qrBox');


      box.innerHTML = '';


      const text =
        $('#qrText')
          .value
          .trim();


      if (!text) {

        showToast(
          'Enter text or a link first.',
          'error'
        );

        return;

      }


      if (
        typeof QRCode === 'undefined'
      ) {

        showToast(
          'QR library did not load. Check your internet connection.',
          'error'
        );

        return;

      }


      new QRCode(
        box,
        {
          text,

          width:
            Number(
              $('#qrSize').value
            ),

          height:
            Number(
              $('#qrSize').value
            ),

          correctLevel:
            QRCode.CorrectLevel.M
        }
      );

    };


    $('#downloadQR').onclick = () => {

      const image =
        $('#qrBox img');


      if (!image) {

        showToast(
          'Generate the QR code first.',
          'error'
        );

        return;

      }


      fetch(image.src)

        .then(
          response =>
            response.blob()
        )

        .then(blob => {

          downloadBlob(
            blob,
            'filefox-qr.png'
          );

        })

        .catch(() => {

          showToast(
            'Could not download QR.',
            'error'
          );

        });

    };

  },


  /* TEXT */

  text() {

    dialogBody.innerHTML = `

      <label>

        Text

        <textarea
          id="textInput"
          rows="9"
          placeholder="Paste or type text..."
        ></textarea>

      </label>


      <div class="text-actions">

        <button
          data-text-action="count"
          type="button"
        >
          Count
        </button>

        <button
          data-text-action="upper"
          type="button"
        >
          UPPERCASE
        </button>

        <button
          data-text-action="lower"
          type="button"
        >
          lowercase
        </button>

        <button
          data-text-action="title"
          type="button"
        >
          Title Case
        </button>

        <button
          data-text-action="clean"
          type="button"
        >
          Clean Spaces
        </button>

      </div>


      ${resultBox()}

    `;


    const output =
      $('#resultBox');


    $$('[data-text-action]')
      .forEach(button => {

        button.onclick = () => {

          const text =
            $('#textInput').value;


          switch (
            button.dataset.textAction
          ) {

            case 'count':

              output.innerHTML = `

                <div class="stats">

                  <span>
                    Words
                    <b>
                      ${
                        (
                          text
                            .trim()
                            .match(/\S+/g)
                          ||
                          []
                        ).length
                      }
                    </b>
                  </span>

                  <span>
                    Characters
                    <b>
                      ${text.length}
                    </b>
                  </span>

                  <span>
                    Lines
                    <b>
                      ${
                        text
                          ? text.split(
                              /\r?\n/
                            ).length
                          : 0
                      }
                    </b>
                  </span>

                </div>

              `;

              break;


            case 'upper':

              $('#textInput').value =
                text.toUpperCase();

              break;


            case 'lower':

              $('#textInput').value =
                text.toLowerCase();

              break;


            case 'title':

              $('#textInput').value =
                text
                  .toLowerCase()
                  .replace(
                    /\b\w/g,
                    character =>
                      character.toUpperCase()
                  );

              break;


            case 'clean':

              $('#textInput').value =
                text
                  .replace(
                    /[ \t]+/g,
                    ' '
                  )
                  .replace(
                    /\n{3,}/g,
                    '\n\n'
                  )
                  .trim();

              break;

          }

        };

      });

  },


  /* PASSWORD */

  password() {

    dialogBody.innerHTML = `

      <div class="control-grid">

        <label>

          Length

          <output id="plOut">
            16
          </output>

          <input
            id="pl"
            type="range"
            min="8"
            max="64"
            value="16"
          >

        </label>


        <label class="check">

          <input
            id="pc"
            type="checkbox"
            checked
          >

          Include numbers

        </label>


        <label class="check">

          <input
            id="ps"
            type="checkbox"
            checked
          >

          Include symbols

        </label>

      </div>


      <div class="password-output">

        <input
          id="pass"
          readonly
        >

        <button
          id="copyPass"
          type="button"
        >
          Copy
        </button>

      </div>


      <div class="tool-actions">

        <button
          class="primary"
          id="genPass"
          type="button"
        >
          Generate
        </button>

      </div>

    `;


    $('#pl').oninput = () => {

      $('#plOut').textContent =
        $('#pl').value;

    };


    const generate =
      () => {

        let characters =
          'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';


        if (
          $('#pc').checked
        ) {

          characters +=
            '23456789';

        }


        if (
          $('#ps').checked
        ) {

          characters +=
            '!@#$%^&*_-+=';

        }


        const values =
          new Uint32Array(
            Number(
              $('#pl').value
            )
          );


        crypto.getRandomValues(
          values
        );


        let password = '';


        values.forEach(
          value => {

            password +=
              characters[
                value %
                characters.length
              ];

          }
        );


        $('#pass').value =
          password;

      };


    generate();


    $('#genPass').onclick =
      generate;


    $('#copyPass').onclick = () => {

      navigator.clipboard
        ?.writeText(
          $('#pass').value
        )
        .then(() => {

          showToast(
            'Copied.'
          );

        })
        .catch(() => {

          showToast(
            'Copy failed.',
            'error'
          );

        });

    };

  },


  /* CALCULATOR */

  calculator() {

    dialogBody.innerHTML = `

      <label>

        Expression

        <input
          id="expr"
          inputmode="decimal"
          placeholder="(12 + 8) × 3 / 2"
        >

      </label>


      <div class="tool-actions">

        <button
          class="primary"
          id="calc"
          type="button"
        >
          Calculate
        </button>

      </div>


      ${resultBox()}

    `;


    $('#calc').onclick = () => {

      const raw =
        $('#expr')
          .value
          .replace(
            /×/g,
            '*'
          )
          .replace(
            /÷/g,
            '/'
          )
          .trim();


      if (
        !/^[0-9+\-*/().%\s]+$/.test(
          raw
        )
      ) {

        showToast(
          'Only basic math characters are allowed.',
          'error'
        );

        return;

      }


      try {

        const value =
          Function(
            `"use strict";return (${raw})`
          )();


        if (
          !Number.isFinite(value)
        ) {

          throw new Error();

        }


        $('#resultBox').innerHTML = `

          <div class="big-result">

            ${escapeHTML(
              String(value)
            )}

          </div>

        `;

      } catch {

        showToast(
          'Invalid expression.',
          'error'
        );

      }

    };

  },


  /* JSON */

  json() {

    simpleTextTool(
      'Paste JSON here...',
      value => {

        try {

          return JSON.stringify(
            JSON.parse(value),
            null,
            2
          );

        } catch {

          return null;

        }

      },
      'Format JSON'
    );

  },


  /* URL */

  url() {

    simpleTextTool(
      'Paste URL text...',
      value => {

        try {

          return encodeURIComponent(
            value
          );

        } catch {

          return null;

        }

      },
      'Encode URL',
      value => {

        try {

          return decodeURIComponent(
            value
          );

        } catch {

          return null;

        }

      },
      'Decode URL'
    );

  },


  /* HTML */

  html() {

    simpleTextTool(
      'Paste HTML/text...',
      value => {

        return value.replace(
          /[&<>\"']/g,
          character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[character])
        );

      },
      'Encode HTML',
      value => {

        const textarea =
          document.createElement(
            'textarea'
          );

        textarea.innerHTML =
          value;

        return textarea.value;

      },
      'Decode HTML'
    );

  },


  /* SLUG */

  slug() {

    simpleTextTool(
      'A title for your URL...',
      value => {

        return value
          .toLowerCase()
          .normalize('NFKD')
          .replace(
            /[\u0300-\u036f]/g,
            ''
          )
          .replace(
            /[^a-z0-9]+/g,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          );

      },
      'Create Slug'
    );

  },


  /* DUPLICATES */

  duplicate() {

    simpleTextTool(
      'Paste lines...',
      value => {

        return [
          ...new Set(
            value.split(
              /\r?\n/
            )
          )
        ].join('\n');

      },
      'Remove Duplicates'
    );

  },


  /* REVERSE */

  reverse() {

    simpleTextTool(
      'Paste text...',
      value =>
        value
          .split('')
          .reverse()
          .join(''),
      'Reverse Text',
      value =>
        value
          .split(/\r?\n/)
          .reverse()
          .join('\n'),
      'Reverse Lines'
    );

  },


  /* LINE COUNTER */

  lines() {

    simpleTextTool(
      'Paste text...',
      value => {

        const lines =
          value
            ? value.split(
                /\r?\n/
              )
            : [];


        return `Lines: ${lines.length}
Non-empty lines: ${
          lines.filter(
            line =>
              line.trim()
          ).length
        }
Characters: ${value.length}
Words: ${
          (
            value
              .trim()
              .match(/\S+/g)
            ||
            []
          ).length
        }`;

      },
      'Count Lines'
    );

  },


  /* BASE64 */

  base64() {

    dialogBody.innerHTML = `

      <label>

        Text

        <textarea
          id="baseInput"
          rows="8"
          placeholder="Text..."
        ></textarea>

      </label>


      <div class="text-actions">

        <button
          id="b64e"
          type="button"
        >
          Encode
        </button>

        <button
          id="b64d"
          type="button"
        >
          Decode
        </button>

      </div>


      ${resultBox()}

    `;


    $('#b64e').onclick = () => {

      try {

        const encoded =
          btoa(
            unescape(
              encodeURIComponent(
                $('#baseInput').value
              )
            )
          );


        $('#resultBox')
          .textContent =
          encoded;

      } catch {

        showToast(
          'Could not encode text.',
          'error'
        );

      }

    };


    $('#b64d').onclick = () => {

      try {

        const decoded =
          decodeURIComponent(
            escape(
              atob(
                $('#baseInput')
                  .value
                  .trim()
              )
            )
          );


        $('#resultBox')
          .textContent =
          decoded;

      } catch {

        showToast(
          'Invalid Base64 text.',
          'error'
        );

      }

    };

  },


  /* UUID */

  uuid() {

    dialogBody.innerHTML = `

      <div
        class="uuid-list"
        id="uuidList"
      ></div>


      <div class="tool-actions">

        <button
          class="primary"
          id="newUUID"
          type="button"
        >
          Generate UUID
        </button>

        <button
          id="copyUUID"
          type="button"
        >
          Copy
        </button>

      </div>

    `;


    const generate = () => {

      const uuid =
        crypto.randomUUID
          ? crypto.randomUUID()
          : fallbackUUID();


      $('#uuidList')
        .textContent =
        uuid;

    };


    generate();


    $('#newUUID').onclick =
      generate;


    $('#copyUUID').onclick = () => {

      navigator.clipboard
        ?.writeText(
          $('#uuidList')
            .textContent
        )
        .then(() => {

          showToast(
            'Copied.'
          );

        })
        .catch(() => {

          showToast(
            'Copy failed.',
            'error'
          );

        });

    };

  }

};


/* =========================================================
   UUID FALLBACK
   ========================================================= */

function fallbackUUID() {

  const bytes =
    new Uint8Array(16);


  crypto.getRandomValues(
    bytes
  );


  bytes[6] =
    (
      bytes[6] &
      15
    ) |
    64;


  bytes[8] =
    (
      bytes[8] &
      63
    ) |
    128;


  return [
    ...bytes
  ]
    .map(
      (value, index) => {

        const hex =
          value
            .toString(16)
            .padStart(
              2,
              '0'
            );


        return [
          4,
          6,
          8,
          10,
          12
        ].includes(index)
          ? `-${hex}`
          : hex;

      }
    )
    .join('');

}


/* =========================================================
   SIMPLE TEXT TOOL
   ========================================================= */

function simpleTextTool(
  placeholder,
  transform,
  buttonText,
  secondaryTransform = null,
  secondaryText = 'Decode'
) {

  dialogBody.innerHTML = `

    <label>

      Text

      <textarea
        id="simpleInput"
        rows="9"
        placeholder="${escapeHTML(
          placeholder
        )}"
      ></textarea>

    </label>


    <div class="text-actions">

      <button
        id="primarySimple"
        type="button"
      >
        ${escapeHTML(
          buttonText
        )}
      </button>

      ${
        secondaryTransform
          ? `

            <button
              id="secondarySimple"
              type="button"
            >
              ${escapeHTML(
                secondaryText
              )}
            </button>

          `
          : ''
      }

    </div>


    ${resultBox()}

  `;


  const run =
    transformFunction => {

      const value =
        $('#simpleInput')
          .value;


      const output =
        transformFunction(
          value
        );


      if (
        output === null ||
        output === undefined
      ) {

        showToast(
          'Could not process this text.',
          'error'
        );

        return;

      }


      $('#resultBox')
        .textContent =
        output;

    };


  $('#primarySimple').onclick =
    () => run(transform);


  if (secondaryTransform) {

    $('#secondarySimple').onclick =
      () =>
        run(
          secondaryTransform
        );

  }

}


/* =========================================================
   TOOL EVENT SYSTEM
   ========================================================= */

/*
  One event listener handles every tool button.
  This is more reliable than attaching separate
  handlers to every button.
*/

$('#toolGrid')?.addEventListener(
  'click',
  event => {

    const button =
      event.target.closest(
        '[data-action]'
      );


    if (!button) {
      return;
    }


    event.preventDefault();


    openDialog(
      button.dataset.action
    );

  }
);


/* =========================================================
   MODAL CONTROLS
   ========================================================= */

$('#closeDialog')
  ?.addEventListener(
    'click',
    closeDialog
  );


dialog?.addEventListener(
  'click',
  event => {

    if (
      event.target === dialog
    ) {

      closeDialog();

    }

  }
);


/*
  Native dialog normally handles Escape,
  but this makes the behavior explicit.
*/

dialog?.addEventListener(
  'cancel',
  event => {

    event.preventDefault();

    closeDialog();

  }
);


/*
  Error-panel close button.
*/

dialog?.addEventListener(
  'click',
  event => {

    if (
      event.target.closest(
        '[data-close-dialog]'
      )
    ) {

      closeDialog();

    }

  }
);


/* =========================================================
   THEME
   ========================================================= */

$('#themeToggle')
  ?.addEventListener(
    'click',
    () => {

      document.documentElement
        .classList.toggle(
          'dark'
        );


      localStorage.setItem(
        'filefox-theme',

        document.documentElement
          .classList
          .contains('dark')
          ? 'dark'
          : 'light'
      );

    }
  );


if (
  localStorage.getItem(
    'filefox-theme'
  ) === 'dark'
) {

  document.documentElement
    .classList
    .add('dark');

}


/* =========================================================
   YEAR
   ========================================================= */

$('#year').textContent =
  new Date().getFullYear();


/* =========================================================
   TOOL COUNT
   ========================================================= */

const cards =
  $$('.tool-card');


$('#toolCount').textContent =
  `${cards.length} tools`;


/* =========================================================
   SEARCH
   ========================================================= */

$('#search')
  ?.addEventListener(
    'input',
    event => {

      const query =
        event.target.value
          .toLowerCase()
          .trim();


      let visible = 0;


      cards.forEach(
        card => {

          const matches =
            !query ||
            card.dataset.search
              .includes(query);


          card.hidden =
            !matches;


          if (matches) {

            visible++;

          }

        }
      );


      $('#visibleCount')
        .textContent =
        `${visible} shown`;

    }
  );


/* =========================================================
   CLEAR SEARCH
   ========================================================= */

$('#clearSearch')
  ?.addEventListener(
    'click',
    () => {

      $('#search').value = '';

      $('#search')
        .dispatchEvent(
          new Event('input')
        );

      $('#search').focus();

    }
  );
