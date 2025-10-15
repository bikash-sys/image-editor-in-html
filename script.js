const upload = document.getElementById("upload");
const canvasArea = document.getElementById("canvas-area");
const addTextBtn = document.getElementById("add-text");
const fontSizeInput = document.getElementById("font-size");
const textColorInput = document.getElementById("text-color");

let img = null;
const filters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0
};

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    canvasArea.innerHTML = `<img src="${reader.result}" id="image">`;
    img = document.getElementById("image");
    applyFilters();
  };
  reader.readAsDataURL(file);
});

function applyFilters() {
  if (img) {
    img.style.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturate}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
    `;
  }
}

document.querySelectorAll('input[type="range"]').forEach(slider => {
  slider.addEventListener("input", () => {
    if (filters.hasOwnProperty(slider.id)) {
      filters[slider.id] = slider.value;
      applyFilters();
    }
  });
});
// Add Text Box
addTextBtn.addEventListener("click", () => {
  if (!img) return alert("Upload an image first!");
  const textBox = document.createElement("div");
  textBox.className = "text-box";
  textBox.contentEditable = "true";
  textBox.innerText = "Edit text";
  textBox.style.color = textColorInput.value;
  textBox.style.fontSize = fontSizeInput.value + "px";
  textBox.style.left = "40%";
  textBox.style.top = "40%";
  textBox.style.width = "240px";
  textBox.style.height = "auto";
  textBox.style.transform = "rotate(0deg)";

  const resizeHandle = document.createElement("div");
  resizeHandle.className = "resize-handle";

  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";

  textBox.appendChild(resizeHandle);
  textBox.appendChild(rotateHandle);
  canvasArea.appendChild(textBox);

  makeDraggable(textBox);
  makeResizable(textBox, resizeHandle);
  makeRotatable(textBox, rotateHandle);

  // live controls
  fontSizeInput.addEventListener("input", () => {
    if (document.activeElement === textBox || textBox.contains(document.activeElement)) {
      textBox.style.fontSize = fontSizeInput.value + "px";
    }
  });
  textColorInput.addEventListener("input", () => {
    if (document.activeElement === textBox || textBox.contains(document.activeElement)) {
      textBox.style.color = textColorInput.value;
    }
  });
});

// Dragging
function makeDraggable(el) {
  let isDragging = false, offsetX = 0, offsetY = 0;
  el.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("resize-handle") || e.target.classList.contains("rotate-handle")) return;
    isDragging = true;
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    el.style.transition = "none";
  });
  window.addEventListener("mouseup", () => isDragging = false);
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const canvasRect = canvasArea.getBoundingClientRect();
    let x = e.clientX - canvasRect.left - offsetX;
    let y = e.clientY - canvasRect.top - offsetY;
    x = Math.max(0, Math.min(x, canvasRect.width - el.offsetWidth));
    y = Math.max(0, Math.min(y, canvasRect.height - el.offsetHeight));
    el.style.left = x + "px";
    el.style.top = y + "px";
  });
}

// Resizing 
function makeResizable(box, handle) {
  let isResizing = false, startX = 0, startWidth = 0, startHeight = 0;
  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    isResizing = true;
    const rect = box.getBoundingClientRect();
    startX = e.clientX;
    startWidth = rect.width;
    startHeight = rect.height;
    window.addEventListener("mousemove", resizeMove);
    window.addEventListener("mouseup", stopResize);
  });

  function resizeMove(e) {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const newWidth = Math.max(60, startWidth + dx);
    box.style.width = newWidth + "px";
  }

  function stopResize() {
    isResizing = false;
    window.removeEventListener("mousemove", resizeMove);
    window.removeEventListener("mouseup", stopResize);
  }
}

// Rotation
function makeRotatable(box, handle) {
  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    const rect = box.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const initial = getRotationDegrees(box);

    function rotateMove(ev) {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX);
      const delta = (angle - startAngle) * (180 / Math.PI);
      const newDeg = initial + delta;
      box.style.transform = `rotate(${newDeg}deg)`;
    }

    function stop() {
      window.removeEventListener("mousemove", rotateMove);
      window.removeEventListener("mouseup", stop);
    }

    window.addEventListener("mousemove", rotateMove);
    window.addEventListener("mouseup", stop);
  });
}

function getRotationDegrees(el) {
  const st = window.getComputedStyle(el, null);
  const tr = st.getPropertyValue("transform");
  if (tr === "none") return 0;
  const values = tr.split('(')[1].split(')')[0].split(',');
  const a = values[0], b = values[1];
  const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
  return angle;
}

// Reset
document.getElementById("reset").addEventListener("click", () => {
  canvasArea.innerHTML = "<p>No image uploaded</p>";
  img = null;
  Object.keys(filters).forEach(k => filters[k] = k === "blur" ? 0 : 100);
});

// Download
document.getElementById("download").addEventListener("click", async () => {
  if (!img) return alert("Upload an image first!");
  if (typeof html2canvas === "undefined") {
    await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
  }
  const boxes = canvasArea.querySelectorAll(".text-box");
  boxes.forEach(b => b.style.border = "none");
  html2canvas(canvasArea, { backgroundColor: null, useCORS: true, allowTaint: true })
    .then(canvas => {
      const link = document.createElement("a");
      link.download = "edited-image.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    })
    .catch(err => {
      alert("Export failed: " + err.message);
    })
    .finally(() => {
      boxes.forEach(b => b.style.border = "2px dashed rgba(255,255,255,0.4)");
    });
});

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}
