const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

const modal = $("#modal");
const modalContent = $("#modalContent");
const search = $("#toolSearch");
const count = $("#toolCount");

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
