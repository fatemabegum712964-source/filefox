const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const modal = $("#modal");
const modalContent = $("#modalContent");
const search = $("#toolSearch");
const count = $("#toolCount");

count.textContent = `${$$(".tool-card").length} tools`;

$("#year").textContent = new Date().getFullYear();

if (localStorage.getItem("filefox-theme") === "dark")
  document.body.classList.add("dark");

$("#themeBtn").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "filefox-theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

search.oninput = () => {
  const q = search.value.toLowerCase().trim();
  let n = 0;

  $$(".tool-card").forEach(card => {
    const ok =
      !q ||
      card.textContent.toLowerCase().includes(q) ||
      (card.dataset.search || "").toLowerCase().includes(q);

    card.style.display = ok ? "" : "none";
    if (ok) n++;
  });

  count.textContent = `${n} tool${n === 1 ? "" : "s"}`;
};

$$(".tool-btn").forEach(btn => {
  btn.onclick = () => {
    const a = btn.dataset.action;

    if (a === "image") imageTool(btn.dataset.type);
    else if (a === "compress") compressTool();
    else if (a === "resize") resizeTool();
    else if (a === "pdf") pdfTool();
    else if (a === "qr") qrTool();
    else if (a === "text") textTool(btn.dataset.textTool);
    else if (a === "password") passwordTool();
    else if (a === "calculator") calculatorTool();
    else if (a === "background") backgroundTool();
    else if (a === "enhance") enhanceTool();
  };
});

$$("[data-close]").forEach(x => x.onclick = closeModal);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

function openModal(html) {
  modalContent.innerHTML = html;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const configs = {
  "jpg-png": ["JPG to PNG", "image/jpeg", "image/png", "png"],
  "png-jpg": ["PNG to JPG", "image/png", "image/jpeg", "jpg"],
  "jpg-webp": ["JPG to WebP", "image/jpeg", "image/webp", "webp"],
  "png-webp": ["PNG to WebP", "image/png", "image/webp", "webp"],
  "webp-jpg": ["WebP to JPG", "image/webp", "image/jpeg", "jpg"],
  "webp-png": ["WebP to PNG", "image/webp", "image/png", "png"]
};

function picker(accept = "image/*") {
  return `
    <label class="dropzone" for="fileInput">
      <strong>Tap to choose an image</strong>
      <small>JPG, PNG or WebP • processed in your browser</small>
    </label>
    <input id="fileInput" class="hidden" type="file" accept="${accept}">
  `;
}

function imageTool(type) {
  const c = configs[type];

  openModal(`
    <h2 class="modal-title">${c[0]}</h2>
    <p class="modal-sub">Your image is processed locally in Chrome.</p>
    ${picker(c[1])}
    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    if (e.target.files[0]) loadImage(e.target.files[0], c);
  };
}

function compressTool() {
  openModal(`
    <h2 class="modal-title">Image Compressor</h2>
    <p class="modal-sub">Reduce image file size in your browser.</p>
    ${picker()}
    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    if (e.target.files[0]) loadImage(e.target.files[0], ["compress"]);
  };
}

function resizeTool() {
  openModal(`
    <h2 class="modal-title">Image Resizer</h2>
    <p class="modal-sub">Change image width while keeping the ratio.</p>
    ${picker()}
    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    if (e.target.files[0]) loadImage(e.target.files[0], ["resize"]);
  };
}

let img, file, config;

function loadImage(f, c) {
  if (!f.type.startsWith("image/")) {
    status("Please choose an image.");
    return;
  }

  file = f;
  config = c;

  const url = URL.createObjectURL(f);
  img = new Image();

  img.onload = () => {
    if (c[0] === "compress") compressControls();
    else if (c[0] === "resize") resizeControls();
    else convertControls();
  };

  img.onerror = () => status("Chrome could not read this image.");
  img.src = url;
}

function info() {
  return `
    <div class="stats">
      <div class="stat">
        <b>${img.naturalWidth}</b><small>Width</small>
      </div>
      <div class="stat">
        <b>${img.naturalHeight}</b><small>Height</small>
      </div>
      <div class="stat">
        <b>${bytes(file.size)}</b><small>Original size</small>
      </div>
    </div>
  `;
}

function convertControls() {
  const to = config[3].toUpperCase();

  $("#workArea").innerHTML = `
    ${info()}
    <img class="preview" src="${img.src}" alt="Preview">

    <div class="actions">
      <button class="primary-action" id="convertBtn">
        Convert to ${to}
      </button>
      <button class="secondary-action" id="replaceBtn">
        Choose another
      </button>
    </div>

    <div id="result"></div>
  `;

  $("#convertBtn").onclick = convert;
  $("#replaceBtn").onclick = () => $("#fileInput").click();
}

async function convert() {
  busy("convertBtn", true, "Converting...");

  try {
    const mime = config[2];
    const canvas = makeCanvas(
      img.naturalWidth,
      img.naturalHeight,
      mime
    );

    const blob = await blobFromCanvas(
      canvas,
      mime,
      mime === "image/jpeg" ? .92 : .9
    );

    if (blob.type !== mime && mime !== "image/png")
      throw new Error("This Chrome version cannot create that format.");

    download(blob, base(file.name) + "." + config[3]);
    result(`Done — ${config[3].toUpperCase()} created.`, blob);
  } catch (e) {
    status("Conversion failed: " + e.message);
  }

  busy(
    "convertBtn",
    false,
    "Convert to " + config[3].toUpperCase()
  );
}

function compressControls() {
  $("#workArea").innerHTML = `
    ${info()}

    <img class="preview" src="${img.src}" alt="Preview">

    <div class="control">
      <label>
        <span>Quality</span>
        <span id="qualityValue">80%</span>
      </label>
      <input id="quality" type="range" min="30" max="100" value="80">
    </div>

    <div class="control">
      <label>Output format</label>
      <select id="format">
        <option value="image/jpeg">JPG</option>
        <option value="image/webp">WebP</option>
        <option value="image/png">PNG</option>
      </select>
    </div>

    <div class="actions">
      <button class="primary-action" id="compressBtn">
        Compress & Download
      </button>
      <button class="secondary-action" id="replaceBtn">
        Choose another
      </button>
    </div>

    <div id="result"></div>
  `;

  $("#quality").oninput = e =>
    $("#qualityValue").textContent = e.target.value + "%";

  $("#compressBtn").onclick = compress;

  $("#replaceBtn").onclick = () =>
    $("#fileInput").click();
}

async function compress() {
  busy("compressBtn", true, "Compressing...");

  try {
    const mime = $("#format").value;
    const quality = Number($("#quality").value) / 100;

    const max = 5000;
    const scale = Math.min(
      1,
      max / Math.max(img.naturalWidth, img.naturalHeight)
    );

    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = makeCanvas(w, h, mime);

    const blob = await blobFromCanvas(
      canvas,
      mime,
      mime === "image/png" ? undefined : quality
    );

    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
        ? "webp"
        : "jpg";

    download(
      blob,
      base(file.name) + "-compressed." + ext
    );

    const saved = Math.max(
      0,
      Math.round((1 - blob.size / file.size) * 100)
    );

    result(
      saved > 0
        ? `Compressed — about ${saved}% smaller.`
        : "Output created.",
      blob
    );
  } catch (e) {
    status("Compression failed.");
  }

  busy(
    "compressBtn",
    false,
    "Compress & Download"
  );
}

function resizeControls() {
  $("#workArea").innerHTML = `
    ${info()}

    <img class="preview" src="${img.src}" alt="Preview">

    <div class="control">
      <label>
        <span>New width (px)</span>
        <span id="heightValue"></span>
      </label>

      <input
        id="resizeWidth"
        type="number"
        min="1"
        max="10000"
        value="${img.naturalWidth}"
      >
    </div>

    <div class="status">
      Height will be calculated automatically.
    </div>

    <div class="actions">
      <button class="primary-action" id="resizeBtn">
        Resize & Download
      </button>
      <button class="secondary-action" id="replaceBtn">
        Choose another
      </button>
    </div>

    <div id="result"></div>
  `;

  updateHeight();

  $("#resizeWidth").oninput = updateHeight;
  $("#resizeBtn").onclick = resize;
  $("#replaceBtn").onclick = () => $("#fileInput").click();
}

function updateHeight() {
  const w = Number($("#resizeWidth").value);
  const h = Math.round(
    w * img.naturalHeight / img.naturalWidth
  );

  $("#heightValue").textContent = h + "px high";
}

async function resize() {
  busy("resizeBtn", true, "Resizing...");

  try {
    const w = Math.min(
      10000,
      Math.max(1, Number($("#resizeWidth").value))
    );

    const h = Math.round(
      w * img.naturalHeight / img.naturalWidth
    );

    const mime =
      file.type === "image/png"
        ? "image/png"
        : "image/jpeg";

    const ext = mime === "image/png" ? "png" : "jpg";

    const canvas = makeCanvas(w, h, mime);

    const blob = await blobFromCanvas(
      canvas,
      mime,
      mime === "image/jpeg" ? .92 : undefined
    );

    download(
      blob,
      base(file.name) + `-${w}x${h}.${ext}`
    );

    result(`Resized to ${w} × ${h}.`, blob);
  } catch {
    status("Resize failed.");
  }

  busy(
    "resizeBtn",
    false,
    "Resize & Download"
  );
}

function makeCanvas(w, h, mime) {
  const c = document.createElement("canvas");

  c.width = w;
  c.height = h;

  const ctx = c.getContext("2d");

  if (mime === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0, w, h);

  return c;
}

function blobFromCanvas(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => b ? resolve(b) : reject(new Error("Could not create file.")),
      mime,
      quality
    );
  });
}

function pdfTool() {
  openModal(`
    <h2 class="modal-title">Image to PDF</h2>
    <p class="modal-sub">
      Choose an image, then use Chrome's Save as PDF option.
    </p>

    ${picker()}

    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    const f = e.target.files[0];
    if (!f) return;

    const u = URL.createObjectURL(f);
    const i = new Image();

    i.onload = () => {
      $("#workArea").innerHTML = `
        <img class="preview" src="${u}" alt="Preview">

        <div class="actions">
          <button class="primary-action" id="printPdf">
            Open print / Save as PDF
          </button>
        </div>
      `;

      $("#printPdf").onclick = () => printPDF(i);
    };

    i.src = u;
  };
}

function printPDF(i) {
  const w = window.open("", "_blank");

  if (!w) {
    status("Chrome blocked the new window. Allow pop-ups and try again.");
    return;
  }

  const c = document.createElement("canvas");
  const max = 1200;

  const scale = Math.min(
    1,
    max / i.naturalWidth
  );

  c.width = Math.round(i.naturalWidth * scale);
  c.height = Math.round(i.naturalHeight * scale);

  c.getContext("2d").drawImage(
    i,
    0,
    0,
    c.width,
    c.height
  );

  const data = c.toDataURL("image/jpeg", .95);

  w.document.write(`
    <html>
    <head>
      <title>FileFox PDF</title>
      <style>
        body{margin:0;text-align:center;background:#eee}
        img{max-width:100%;display:block;margin:auto}
      </style>
    </head>

    <body>
      <img src="${data}">
      <script>
        window.onload=()=>setTimeout(
          ()=>window.print(),300
        );
      <\/script>
    </body>
    </html>
  `);

  w.document.close();
}

function qrTool() {
  openModal(`
    <h2 class="modal-title">QR Code Generator</h2>
    <p class="modal-sub">
      Create a QR code from text or a website address.
    </p>

    <div class="control">
      <label>Text or address</label>
      <textarea id="qrText"
        placeholder="Type something here..."></textarea>
    </div>

    <div class="actions">
      <button class="primary-action" id="makeQr">
        Generate QR
      </button>
    </div>

    <div id="qrResult"></div>
  `);

  $("#makeQr").onclick = () => {
    const text = $("#qrText").value.trim();

    if (!text) {
      status("Enter some text first.");
      return;
    }

    const box = $("#qrResult");
    box.innerHTML = "";

    if (typeof QRCode === "undefined") {
      box.innerHTML =
        `<div class="status">
          QR library could not load. Check your internet connection.
        </div>`;
      return;
    }

    const holder = document.createElement("div");

    holder.style.cssText =
      "display:grid;place-items:center;margin:22px 0";

    box.appendChild(holder);

    new QRCode(holder, {
      text,
      width: 220,
      height: 220
    });

    setTimeout(() => {
      const canvas = holder.querySelector("canvas");

      if (!canvas) return;

      const a = document.createElement("a");

      a.href = canvas.toDataURL("image/png");
      a.download = "filefox-qr.png";
      a.textContent = "Download QR PNG";
      a.className = "btn primary";

      holder.appendChild(a);
    }, 300);
  };
}

function textTool(type) {
  const title =
    type === "counter"
      ? "Word Counter"
      : type === "case"
      ? "Case Converter"
      : "Text Cleaner";

  openModal(`
    <h2 class="modal-title">${title}</h2>

    <p class="modal-sub">
      Your text stays in this browser.
    </p>

    <div class="control">
      <textarea id="textInput"
        placeholder="Paste or type your text here..."></textarea>
    </div>

    <div id="textControls"></div>
    <div id="textStats"></div>
  `);

  const input = $("#textInput");

  if (type === "counter") {
    const update = () => {
      const text = input.value;
      const words = text.trim()
        ? text.trim().split(/\s+/).length
        : 0;

      $("#textStats").innerHTML = `
        <div class="stats">
          <div class="stat">
            <b>${words}</b><small>Words</small>
          </div>

          <div class="stat">
            <b>${text.length}</b><small>Characters</small>
          </div>
        </div>
      `;
    };

    input.oninput = update;
    update();
  }

  else if (type === "case") {
    $("#textControls").innerHTML = `
      <div class="actions">
        <button class="secondary-action" id="upper">
          UPPERCASE
        </button>

        <button class="secondary-action" id="lower">
          lowercase
        </button>

        <button class="secondary-action" id="title">
          Title Case
        </button>

        <button class="primary-action" id="copyText">
          Copy
        </button>
      </div>
    `;

    $("#upper").onclick =
      () => input.value = input.value.toUpperCase();

    $("#lower").onclick =
      () => input.value = input.value.toLowerCase();

    $("#title").onclick =
      () => input.value =
        input.value
          .toLowerCase()
          .replace(/\b\w/g, x => x.toUpperCase());

    $("#copyText").onclick =
      () => copy(input.value);
  }

  else {
    $("#textControls").innerHTML = `
      <div class="actions">
        <button class="primary-action" id="clean">
          Clean text
        </button>

        <button class="secondary-action" id="copyText">
          Copy
        </button>
      </div>
    `;

    $("#clean").onclick = () => {
      input.value = input.value
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim();
    };

    $("#copyText").onclick =
      () => copy(input.value);
  }
}

function passwordTool() {
  openModal(`
    <h2 class="modal-title">Password Generator</h2>

    <p class="modal-sub">
      Generate a random password locally.
    </p>

    <div class="control">
      <label>
        <span>Length</span>
        <span id="passLenValue">16</span>
      </label>

      <input id="passLen"
        type="range"
        min="8"
        max="40"
        value="16">
    </div>

    <div class="control">
      <input id="passOutput" readonly>
    </div>

    <div class="actions">
      <button class="primary-action" id="generatePass">
        Generate
      </button>

      <button class="secondary-action" id="copyPass">
        Copy
      </button>
    </div>
  `);

  $("#passLen").oninput = e =>
    $("#passLenValue").textContent = e.target.value;

  $("#generatePass").onclick = generatePassword;

  $("#copyPass").onclick =
    () => copy($("#passOutput").value);

  generatePassword();
}

function generatePassword() {
  const len = Number($("#passLen").value);

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";

  const arr = new Uint32Array(len);

  crypto.getRandomValues(arr);

  let out = "";

  for (let i = 0; i < len; i++)
    out += chars[arr[i] % chars.length];

  $("#passOutput").value = out;
}

function calculatorTool() {
  openModal(`
    <h2 class="modal-title">Quick Calculator</h2>

    <p class="modal-sub">
      Basic arithmetic only.
    </p>

    <div class="control">
      <input id="calcInput"
        inputmode="decimal"
        placeholder="Example: 120 * 1.15">
    </div>

    <div class="actions">
      <button class="primary-action" id="calcBtn">
        Calculate
      </button>
    </div>

    <div id="calcResult"></div>
  `);

  $("#calcBtn").onclick = () => {
    const raw = $("#calcInput").value.trim();

    if (!/^[0-9+\-*/().%\s]+$/.test(raw)) {
      status("Only numbers and basic operators are allowed.");
      return;
    }

    try {
      const result = Function(
        `"use strict";return(${raw.replace(/%/g, "/100")})`
      )();

      if (!Number.isFinite(result)) throw new Error();

      $("#calcResult").innerHTML =
        `<div class="status">
          <strong>Result: ${result}</strong>
        </div>`;
    }

    catch {
      status("Could not calculate that expression.");
    }
  };
}

function busy(id, yes, text) {
  const b = $("#" + id);
  if (!b) return;

  b.disabled = yes;
  b.textContent = text;
}

function status(msg) {
  const area = $("#result") || $("#workArea");

  if (area)
    area.insertAdjacentHTML(
      "beforeend",
      `<div class="status">${esc(msg)}</div>`
    );
}

function result(msg, blob) {
  const area = $("#result");

  if (!area) return;

  area.innerHTML =
    `<div class="status">
      ${esc(msg)} • Output: ${bytes(blob.size)}
    </div>`;
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = name;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    2000
  );
}

function base(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    || "filefox-image";
}

function bytes(n) {
  if (n < 1024) return n + " B";

  if (n < 1024 * 1024)
    return (n / 1024).toFixed(1) + " KB";

  return (n / 1024 / 1024).toFixed(2) + " MB";
}

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    x => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[x])
  );
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    status("Copied to clipboard.");
  } catch {
    status("Copy was blocked by Chrome.");
  }
}
/* =========================================================
   BACKGROUND REMOVER
   ========================================================= */

let bgImage = null;
let bgFile = null;

function backgroundTool() {
  openModal(`
    <h2 class="modal-title">Background Remover</h2>

    <p class="modal-sub">
      Remove a simple, similar-color background and create a transparent PNG.
      Processing happens in your browser.
    </p>

    ${picker()}

    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    const f = e.target.files[0];

    if (!f) return;

    if (!f.type.startsWith("image/")) {
      status("Please choose an image.");
      return;
    }

    bgFile = f;

    const url = URL.createObjectURL(f);
    bgImage = new Image();

    bgImage.onload = () => {
      URL.revokeObjectURL(url);
      backgroundControls();
    };

    bgImage.onerror = () => {
      URL.revokeObjectURL(url);
      status("Chrome could not read this image.");
    };

    bgImage.src = url;
  };
}

function backgroundControls() {
  $("#workArea").innerHTML = `
    <div class="stats">
      <div class="stat">
        <b>${bgImage.naturalWidth}</b>
        <small>Width</small>
      </div>

      <div class="stat">
        <b>${bgImage.naturalHeight}</b>
        <small>Height</small>
      </div>

      <div class="stat">
        <b>${bytes(bgFile.size)}</b>
        <small>Original</small>
      </div>
    </div>

    <div class="control">
      <label>
        <span>Background tolerance</span>
        <span id="bgToleranceValue">35</span>
      </label>

      <input
        id="bgTolerance"
        type="range"
        min="5"
        max="100"
        value="35"
      >
    </div>

    <div class="status">
      Best results usually happen when the background has a similar
      color, such as white, blue or green.
    </div>

    <div id="bgPreview"></div>

    <div class="actions">
      <button class="primary-action" id="removeBgBtn">
        Remove Background
      </button>

      <button class="secondary-action" id="bgReplaceBtn">
        Choose another
      </button>
    </div>

    <div id="result"></div>
  `;

  $("#bgTolerance").oninput = e => {
    $("#bgToleranceValue").textContent = e.target.value;
  };

  $("#removeBgBtn").onclick = removeBackground;

  $("#bgReplaceBtn").onclick = () =>
    $("#fileInput").click();

  showBackgroundPreview();
}

function showBackgroundPreview() {
  $("#bgPreview").innerHTML = `
    <img
      class="preview"
      src="${bgImage.src}"
      alt="Background remover preview"
    >
  `;
}

async function removeBackground() {
  busy(
    "removeBgBtn",
    true,
    "Removing..."
  );

  try {
    const tolerance =
      Number($("#bgTolerance").value);

    const maxSize = 2400;

    const scale = Math.min(
      1,
      maxSize /
        Math.max(
          bgImage.naturalWidth,
          bgImage.naturalHeight
        )
    );

    const w = Math.max(
      1,
      Math.round(bgImage.naturalWidth * scale)
    );

    const h = Math.max(
      1,
      Math.round(bgImage.naturalHeight * scale)
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = w;
    canvas.height = h;

    const ctx =
      canvas.getContext("2d", {
        willReadFrequently: true
      });

    ctx.drawImage(
      bgImage,
      0,
      0,
      w,
      h
    );

    const imageData =
      ctx.getImageData(
        0,
        0,
        w,
        h
      );

    const data = imageData.data;

    /*
      Estimate the background color from
      the four corners of the image.
    */

    const samples = [];

    const points = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1]
    ];

    for (const [x, y] of points) {
      const i =
        (y * w + x) * 4;

      samples.push([
        data[i],
        data[i + 1],
        data[i + 2]
      ]);
    }

    const bgR =
      Math.round(
        samples.reduce(
          (sum, c) => sum + c[0],
          0
        ) / samples.length
      );

    const bgG =
      Math.round(
        samples.reduce(
          (sum, c) => sum + c[1],
          0
        ) / samples.length
      );

    const bgB =
      Math.round(
        samples.reduce(
          (sum, c) => sum + c[2],
          0
        ) / samples.length

/* =========================================================
   AI BACKGROUND REMOVER
   ========================================================= */

let aiBgImage = null;
let aiBgFile = null;
let aiSegmenter = null;

async function backgroundTool() {
  openModal(`
    <h2 class="modal-title">AI Background Remover</h2>

    <p class="modal-sub">
      AI detects the person and removes the background in your browser.
    </p>

    ${picker()}

    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    const f = e.target.files[0];

    if (!f) return;

    if (!f.type.startsWith("image/")) {
      status("Please choose an image.");
      return;
    }

    aiBgFile = f;

    const url =
      URL.createObjectURL(f);

    aiBgImage =
      new Image();

    aiBgImage.onload = () => {
      URL.revokeObjectURL(url);
      aiBackgroundControls();
    };

    aiBgImage.onerror = () => {
      URL.revokeObjectURL(url);
      status("Chrome could not read this image.");
    };

    aiBgImage.src = url;
  };
}

function aiBackgroundControls() {
  $("#workArea").innerHTML = `
    <div class="stats">

      <div class="stat">
        <b>${aiBgImage.naturalWidth}</b>
        <small>Width</small>
      </div>

      <div class="stat">
        <b>${aiBgImage.naturalHeight}</b>
        <small>Height</small>
      </div>

      <div class="stat">
        <b>${bytes(aiBgFile.size)}</b>
        <small>Original</small>
      </div>

    </div>

    <img
      class="preview"
      src="${aiBgImage.src}"
      alt="Original photo"
    >

    <div class="status" id="aiBgStatus">
      Ready.
    </div>

    <div class="actions">

      <button
        class="primary-action"
        id="aiRemoveBgBtn">
        Remove Background
      </button>

      <button
        class="secondary-action"
        id="aiBgReplaceBtn">
        Choose another
      </button>

    </div>

    <div id="result"></div>
  `;

  $("#aiRemoveBgBtn").onclick =
    removeAIBackground;

  $("#aiBgReplaceBtn").onclick =
    () => $("#fileInput").click();
}

async function loadAISegmenter() {

  if (aiSegmenter)
    return aiSegmenter;

  $("#aiBgStatus").textContent =
    "Loading AI model...";

  try {

    const model =
      bodySegmentation.SupportedModels
        .MediaPipeSelfieSegmentation;

    aiSegmenter =
      await bodySegmentation.createSegmenter(
        model,
        {
          runtime: "mediapipe",

          modelType: "general",

          solutionPath:
            "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation"
        }
      );

    return aiSegmenter;

  } catch (e) {

    aiSegmenter = null;

    throw new Error(
      "AI model could not load."
    );
  }
}

async function removeAIBackground() {

  busy(
    "aiRemoveBgBtn",
    true,
    "AI processing..."
  );

  try {

    const segmenter =
      await loadAISegmenter();

    $("#aiBgStatus").textContent =
      "AI is detecting the person...";

    /*
      Resize very large images for faster
      mobile processing.
    */

    const maxSize = 1800;

    const scale =
      Math.min(
        1,
        maxSize /
          Math.max(
            aiBgImage.naturalWidth,
            aiBgImage.naturalHeight
          )
      );

    const w =
      Math.max(
        1,
        Math.round(
          aiBgImage.naturalWidth *
          scale
        )
      );

    const h =
      Math.max(
        1,
        Math.round(
          aiBgImage.naturalHeight *
          scale
        )
      );

    const sourceCanvas =
      document.createElement("canvas");

    sourceCanvas.width = w;
    sourceCanvas.height = h;

    const sourceCtx =
      sourceCanvas.getContext("2d");

    sourceCtx.drawImage(
      aiBgImage,
      0,
      0,
      w,
      h
    );

    /*
      Run AI segmentation.
    */

    const people =
      await segmenter.segmentPeople(
        sourceCanvas
      );

    if (
      !people ||
      !people.length
    ) {
      throw new Error(
        "No person was detected."
      );
    }

    $("#aiBgStatus").textContent =
      "Creating transparent PNG...";

    /*
      Get segmentation mask.
    */

    const mask =
      await bodySegmentation.toBinaryMask(
        people,
        {
          r: 0,
          g: 0,
          b: 0,
          a: 255
        },
        {
          r: 0,
          g: 0,
          b: 0,
          a: 0
        },
        false,
        0.55
      );

    const outputCanvas =
      document.createElement("canvas");

    outputCanvas.width = w;
    outputCanvas.height = h;

    const outputCtx =
      outputCanvas.getContext("2d");

    /*
      Draw original image.
    */

    outputCtx.drawImage(
      sourceCanvas,
      0,
      0
    );

    /*
      Apply the segmentation mask.
    */

    const imageData =
      outputCtx.getImageData(
        0,
        0,
        w,
        h
      );

    const maskData =
      mask.data;

    const data =
      imageData.data;

    /*
      The mask contains alpha information.
      Keep the detected person,
      remove the background.
    */

    for (
      let i = 0;
      i < data.length;
      i += 4
    ) {

      const maskAlpha =
        maskData[i + 3];

      data[i + 3] =
        maskAlpha;
    }

    outputCtx.putImageData(
      imageData,
      0,
      0
    );

    /*
      Convert to PNG.
    */

    const blob =
      await blobFromCanvas(
        outputCanvas,
        "image/png"
      );

    const name =
      base(aiBgFile.name) +
      "-background-removed.png";

    const resultUrl =
      URL.createObjectURL(blob);

    $("#aiBgStatus").textContent =
      "Background removed successfully.";

    $("#result").innerHTML = `
      <div class="status">
        <strong>AI result</strong>
      </div>

      <div style="
        margin:15px 0;
        padding:10px;
        border-radius:14px;
        background:
          repeating-conic-gradient(
            #ddd 0 25%,
            #fff 0 50%
          ) 50% / 20px 20px;
      ">

        <img
          class="preview"
          src="${resultUrl}"
          alt="AI background removed result"
        >

      </div>
    `;

    download(
      blob,
      name
    );

    busy(
      "aiRemoveBgBtn",
      false,
      "Remove Background"
    );

  } catch (e) {

    status(
      e.message ||
      "AI background removal failed."
    );

    busy(
      "aiRemoveBgBtn",
      false,
      "Remove Background"
    );
  }
}

/* =========================================================
   DSLR LOOK / PHOTO ENHANCER
   ========================================================= */

let enhanceImage = null;
let enhanceFile = null;

function enhanceTool() {
  openModal(`
    <h2 class="modal-title">DSLR Look</h2>

    <p class="modal-sub">
      Enhance your photo with sharper detail,
      richer colors, contrast and a natural camera-like finish.
    </p>

    ${picker()}

    <div id="workArea"></div>
  `);

  $("#fileInput").onchange = e => {
    const f = e.target.files[0];

    if (!f) return;

    if (!f.type.startsWith("image/")) {
      status("Please choose an image.");
      return;
    }

    enhanceFile = f;

    const url =
      URL.createObjectURL(f);

    enhanceImage =
      new Image();

    enhanceImage.onload = () => {
      URL.revokeObjectURL(url);
      enhanceControls();
    };

    enhanceImage.onerror = () => {
      URL.revokeObjectURL(url);
      status("Chrome could not read this image.");
    };

    enhanceImage.src = url;
  };
}

function enhanceControls() {
  $("#workArea").innerHTML = `
    ${infoForEnhance()}

    <div class="control">
      <label>Preset</label>

      <select id="enhancePreset">
        <option value="natural">Natural DSLR</option>
        <option value="vivid">Vivid Camera</option>
        <option value="cinematic">Cinematic</option>
        <option value="portrait">Portrait</option>
        <option value="none">Manual</option>
      </select>
    </div>

    <div class="control">
      <label>
        <span>Brightness</span>
        <span id="enhBrightValue">4</span>
      </label>

      <input
        id="enhBright"
        type="range"
        min="-30"
        max="30"
        value="4"
      >
    </div>

    <div class="control">
      <label>
        <span>Contrast</span>
        <span id="enhContrastValue">12</span>
      </label>

      <input
        id="enhContrast"
        type="range"
        min="-30"
        max="40"
        value="12"
      >
    </div>

    <div class="control">
      <label>
        <span>Saturation</span>
        <span id="enhSatValue">8</span>
      </label>

      <input
        id="enhSat"
        type="range"
        min="-30"
        max="40"
        value="8"
      >
    </div>

    <div class="control">
      <label>
        <span>Sharpness</span>
        <span id="enhSharpValue">18</span>
      </label>

      <input
        id="enhSharp"
        type="range"
        min="0"
        max="40"
        value="18"
      >
    </div>

    <div class="control">
      <label>
        <span>Warmth</span>
        <span id="enhWarmValue">2</span>
      </label>

      <input
        id="enhWarm"
        type="range"
        min="-20"
        max="20"
        value="2"
      >
    </div>

    <div class="control">
      <label>
        <span>Vignette</span>
        <span id="enhVignetteValue">8</span>
      </label>

      <input
        id="enhVignette"
        type="range"
        min="0"
        max="40"
        value="8"
      >
    </div>

    <div id="enhancePreview"></div>

    <div class="actions">
      <button
        class="primary-action"
        id="enhanceBtn"
      >
        Apply DSLR Look
      </button>

      <button
        class="secondary-action"
        id="enhReplaceBtn"
      >
        Choose another
      </button>
    </div>

    <div id="result"></div>
  `;

  const controls = [
    ["enhBright", "enhBrightValue"],
    ["enhContrast", "enhContrastValue"],
    ["enhSat", "enhSatValue"],
    ["enhSharp", "enhSharpValue"],
    ["enhWarm", "enhWarmValue"],
    ["enhVignette", "enhVignetteValue"]
  ];

  controls.forEach(([input, value]) => {
    $("#" + input).oninput = () => {
      $("#" + value).textContent =
        $("#" + input).value;
    };
  });

  $("#enhancePreset").onchange =
    applyEnhancePreset;

  $("#enhanceBtn").onclick =
    enhancePhoto;

  $("#enhReplaceBtn").onclick =
    () => $("#fileInput").click();

  showOriginalEnhancePreview();
}

function infoForEnhance() {
  return `
    <div class="stats">
      <div class="stat">
        <b>${enhanceImage.naturalWidth}</b>
        <small>Width</small>
      </div>

      <div class="stat">
        <b>${enhanceImage.naturalHeight}</b>
        <small>Height</small>
      </div>

      <div class="stat">
        <b>${bytes(enhanceFile.size)}</b>
        <small>Original</small>
      </div>
    </div>
  `;
}

function showOriginalEnhancePreview() {
  $("#enhancePreview").innerHTML = `
    <img
      class="preview"
      src="${enhanceImage.src}"
      alt="Original photo"
    >

    <div class="status">
      Original photo
    </div>
  `;
}

function applyEnhancePreset() {
  const preset =
    $("#enhancePreset").value;

  const presets = {
    natural: {
      bright: 4,
      contrast: 12,
      sat: 8,
      sharp: 18,
      warm: 2,
      vignette: 8
    },

    vivid: {
      bright: 5,
      contrast: 16,
      sat: 20,
      sharp: 22,
      warm: 3,
      vignette: 6
    },

    cinematic: {
      bright: 0,
      contrast: 20,
      sat: -2,
      sharp: 16,
      warm: -2,
      vignette: 18
    },

    portrait: {
      bright: 7,
      contrast: 8,
      sat: 5,
      sharp: 12,
      warm: 5,
      vignette: 10
    },

    none: {
      bright: 0,
      contrast: 0,
      sat: 0,
      sharp: 0,
      warm: 0,
      vignette: 0
    }
  };

  const p =
    presets[preset];

  if (!p) return;

  setEnhValue(
    "enhBright",
    "enhBrightValue",
    p.bright
  );

  setEnhValue(
    "enhContrast",
    "enhContrastValue",
    p.contrast
  );

  setEnhValue(
    "enhSat",
    "enhSatValue",
    p.sat
  );

  setEnhValue(
    "enhSharp",
    "enhSharpValue",
    p.sharp
  );

  setEnhValue(
    "enhWarm",
    "enhWarmValue",
    p.warm
  );

  setEnhValue(
    "enhVignette",
    "enhVignetteValue",
    p.vignette
  );
}

function setEnhValue(
  input,
  output,
  value
) {
  $("#" + input).value = value;
  $("#" + output).textContent = value;
}

async function enhancePhoto() {
  busy(
    "enhanceBtn",
    true,
    "Enhancing..."
  );

  try {
    const maxSize = 3000;

    const scale = Math.min(
      1,
      maxSize /
        Math.max(
          enhanceImage.naturalWidth,
          enhanceImage.naturalHeight
        )
    );

    const w = Math.max(
      1,
      Math.round(
        enhanceImage.naturalWidth *
        scale
      )
    );

    const h = Math.max(
      1,
      Math.round(
        enhanceImage.naturalHeight *
        scale
      )
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = w;
    canvas.height = h;

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently: true
        }
      );

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      enhanceImage,
      0,
      0,
      w,
      h
    );

    let imageData =
      ctx.getImageData(
        0,
        0,
        w,
        h
      );

    const bright =
      Number($("#enhBright").value);

    const contrast =
      Number($("#enhContrast").value);

    const saturation =
      Number($("#enhSat").value);

    const sharp =
      Number($("#enhSharp").value);

    const warmth =
      Number($("#enhWarm").value);

    const vignette =
      Number($("#enhVignette").value);

    applyColorEnhancement(
      imageData,
      bright,
      contrast,
      saturation,
      warmth,
      vignette
    );

    ctx.putImageData(
      imageData,
      0,
      0
    );

    if (sharp > 0) {
      imageData =
        sharpenImage(
          ctx,
          w,
          h,
          sharp
        );

      ctx.putImageData(
        imageData,
        0,
        0
      );
    }

    const blob =
      await blobFromCanvas(
        canvas,
        "image/jpeg",
        0.94
      );

    const name =
      base(enhanceFile.name) +
      "-dslr-look.jpg";

    const resultUrl =
      URL.createObjectURL(blob);

    $("#enhancePreview").innerHTML = `
      <div style="margin-bottom:10px">
        <strong>Before</strong>
      </div>

      <img
        class="preview"
        src="${enhanceImage.src}"
        alt="Before enhancement"
      >

      <div style="
        margin:20px 0 10px
      ">
        <strong>After — DSLR Look</strong>
      </div>

      <img
        class="preview"
        src="${resultUrl}"
        alt="Enhanced photo"
      >
    `;

    download(
      blob,
      name
    );

    result(
      "DSLR-style photo created.",
      blob
    );

  } catch (e) {
    status(
      "Photo enhancement failed. Try a smaller image."
    );
  }

  busy(
    "enhanceBtn",
    false,
    "Apply DSLR Look"
  );
}

function applyColorEnhancement(
  imageData,
  brightness,
  contrast,
  saturation,
  warmth,
  vignette
) {
  const data =
    imageData.data;

  const w =
    imageData.width;

  const h =
    imageData.height;

  const brightnessAmount =
    brightness * 2.55;

  const contrastFactor =
    (259 * (contrast + 255)) /
    (255 * (259 - contrast));

  const saturationFactor =
    1 + saturation / 100;

  const warmthAmount =
    warmth * 1.5;

  const cx =
    w / 2;

  const cy =
    h / 2;

  const maxDistance =
    Math.sqrt(
      cx * cx +
      cy * cy
    );

  for (
    let y = 0;
    y < h;
    y++
  ) {
    for (
      let x = 0;
      x < w;
      x++
    ) {
      const i =
        (y * w + x) * 4;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      /*
        Brightness
      */

      r += brightnessAmount;
      g += brightnessAmount;
      b += brightnessAmount;

      /*
        Contrast
      */

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

      /*
        Saturation
      */

      const gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      r =
        gray +
        (r - gray) *
        saturationFactor;

      g =
        gray +
        (g - gray) *
        saturationFactor;

      b =
        gray +
        (b - gray) *
        saturationFactor;

      /*
        Warmth
      */

      r += warmthAmount;
      b -= warmthAmount;

      /*
        Soft vignette
      */

      if (vignette > 0) {
        const dx =
          x - cx;

        const dy =
          y - cy;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          ) /
          maxDistance;

        const edge =
          Math.max(
            0,
            distance - 0.35
          ) / 0.65;

        const factor =
          1 -
          (edge * edge) *
          (vignette / 100);

        r *= factor;
        g *= factor;
        b *= factor;
      }

      data[i] =
        clamp255(r);

      data[i + 1] =
        clamp255(g);

      data[i + 2] =
        clamp255(b);
    }
  }
}

function sharpenImage(
  ctx,
  w,
  h,
  amount
) {
  const source =
    ctx.getImageData(
      0,
      0,
      w,
      h
    );

  const output =
    ctx.createImageData(
      w,
      h
    );

  const src =
    source.data;

  const dst =
    output.data;

  const strength =
    Math.min(
      0.45,
      amount / 100
    );

  /*
    3x3 unsharp-style sharpening.
  */

  for (
    let y = 0;
    y < h;
    y++
  ) {
    for (
      let x = 0;
      x < w;
      x++
    ) {
      const i =
        (y * w + x) * 4;

      const left =
        ((y * w) +
          Math.max(0, x - 1)) *
        4;

      const right =
        ((y * w) +
          Math.min(w - 1, x + 1)) *
        4;

      const top =
        ((Math.max(0, y - 1) * w) +
          x) *
        4;

      const bottom =
        ((Math.min(h - 1, y + 1) * w) +
          x) *
        4;

      for (
        let c = 0;
        c < 3;
        c++
      ) {
        const center =
          src[i + c];

        const average =
          (
            src[left + c] +
            src[right + c] +
            src[top + c] +
            src[bottom + c]
          ) / 4;

        dst[i + c] =
          clamp255(
            center +
            (center - average) *
            strength *
            2.2
          );
      }

      dst[i + 3] =
        src[i + 3];
    }
  }

  return output;
}

function clamp255(n) {
  return Math.max(
    0,
    Math.min(
      255,
      Math.round(n)
    )
  );
      }
