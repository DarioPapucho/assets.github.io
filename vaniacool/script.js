// Variables globales
let currentPDF = null;
let totalPages = 0;
let sections = [];

// Elementos del DOM
const pdfInput = document.getElementById("pdfInput");
const uploadArea = document.getElementById("uploadArea");
const pdfInfo = document.getElementById("pdfInfo");
const fileName = document.getElementById("fileName");
const totalPagesSpan = document.getElementById("totalPages");
const splitSection = document.getElementById("splitSection");
const sectionsContainer = document.getElementById("sectionsContainer");
const addSectionBtn = document.getElementById("addSectionBtn");
const actionsSection = document.getElementById("actionsSection");
const splitBtn = document.getElementById("splitBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsSection = document.getElementById("resultsSection");
const resultsContainer = document.getElementById("resultsContainer");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const errorModal = document.getElementById("errorModal");
const errorMessage = document.getElementById("errorMessage");
const closeModal = document.getElementById("closeModal");

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  initializeEventListeners();
  addFirstSection();
});

function initializeEventListeners() {
  // Carga de archivo
  pdfInput.addEventListener("change", handleFileSelect);

  // Drag and drop
  uploadArea.addEventListener("dragover", handleDragOver);
  uploadArea.addEventListener("dragleave", handleDragLeave);
  uploadArea.addEventListener("drop", handleDrop);

  // Botones principales
  addSectionBtn.addEventListener("click", addSection);
  splitBtn.addEventListener("click", splitPDF);
  clearBtn.addEventListener("click", clearAll);
  closeModal.addEventListener("click", hideError);

  // Click en área de carga
  uploadArea.addEventListener("click", () => pdfInput.click());
}

// Manejo de archivos
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    loadPDF(file);
  }
}

function handleDragOver(event) {
  event.preventDefault();
  uploadArea.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.preventDefault();
  uploadArea.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  uploadArea.classList.remove("drag-over");

  const file = event.dataTransfer.files[0];
  if (file && file.type === "application/pdf") {
    loadPDF(file);
  } else {
    showError("Por favor, selecciona un archivo PDF válido.");
  }
}

// Cargar y procesar PDF con optimizaciones para archivos grandes
async function loadPDF(file) {
  try {
    showProgress("Cargando PDF...", 0);

    // Verificar tamaño del archivo (1GB máximo)
    if (file.size > 1024 * 1024 * 1024) {
      hideProgress();
      showError("El archivo es demasiado grande. Máximo 1GB.");
      return;
    }

    // Mostrar advertencia para archivos grandes
    if (file.size > 100 * 1024 * 1024) {
      progressText.textContent =
        "Archivo grande detectado. Esto puede tomar varios minutos...";
    }

    // Leer archivo en chunks para evitar problemas de memoria
    const arrayBuffer = await readFileInChunks(file);
    updateProgress(50);

    progressText.textContent = "Analizando estructura del PDF...";

    // Configurar PDF-lib para archivos grandes
    currentPDF = await PDFLib.PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      capNumbers: false,
    });

    totalPages = currentPDF.getPageCount();

    updateProgress(100);
    hideProgress();

    // Actualizar UI
    fileName.textContent = file.name;
    totalPagesSpan.textContent = totalPages;

    showSection(pdfInfo);
    showSection(splitSection);
    showSection(actionsSection);

    // Actualizar la primera sección con el total de páginas
    updateSectionLimits();

    // Mostrar recomendación para archivos grandes
    if (file.size > 100 * 1024 * 1024) {
      showWarning(`Archivo de ${Math.round(
        file.size / (1024 * 1024)
      )}MB cargado. 
                        Para mejor rendimiento, considera dividir en secciones más pequeñas (máximo 50 páginas por sección).`);
    }
  } catch (error) {
    hideProgress();
    console.error("Error detallado:", error);
    showError(
      "Error al cargar el PDF. Posibles causas:\n" +
        "• El archivo está corrupto o protegido\n" +
        "• Memoria insuficiente para procesar el archivo\n" +
        "• Formato PDF no compatible\n\n" +
        "Error técnico: " +
        error.message
    );
  }
}

// Función para leer archivos grandes en chunks
async function readFileInChunks(file) {
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  const chunks = [];
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    chunks.push(new Uint8Array(buffer));
    offset += chunkSize;

    // Actualizar progreso de lectura
    const progress = Math.min((offset / file.size) * 40, 40);
    updateProgress(progress);

    // Permitir que el navegador respire
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  // Combinar chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result.buffer;
}

// Manejo de secciones
function addFirstSection() {
  const section = {
    id: Date.now(),
    name: "Sección 1",
    startPage: 1,
    endPage: 1,
  };
  sections.push(section);
  renderSections();
}

function addSection() {
  const lastSection = sections[sections.length - 1];
  const newStartPage = lastSection ? lastSection.endPage + 1 : 1;

  const section = {
    id: Date.now(),
    name: `Sección ${sections.length + 1}`,
    startPage: Math.min(newStartPage, totalPages),
    endPage: totalPages,
  };

  sections.push(section);
  renderSections();
}

function removeSection(id) {
  if (sections.length > 1) {
    sections = sections.filter((section) => section.id !== id);
    renderSections();
  }
}

function renderSections() {
  sectionsContainer.innerHTML = "";

  sections.forEach((section, index) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "section-item fade-in";
    sectionDiv.innerHTML = `
            <div class="section-header">
                <span class="section-title">Sección ${index + 1}</span>
                ${
                  sections.length > 1
                    ? `<button class="remove-section" onclick="removeSection(${section.id})">Eliminar</button>`
                    : ""
                }
            </div>
            <div class="section-inputs">
                <div class="input-group">
                    <label>Nombre de la sección</label>
                    <input type="text" value="${
                      section.name
                    }" onchange="updateSectionName(${section.id}, this.value)">
                </div>
                <div class="input-group">
                    <label>Página inicial</label>
                    <input type="number" min="1" max="${totalPages}" value="${
      section.startPage
    }" 
                           onchange="updateSectionStart(${
                             section.id
                           }, this.value)">
                </div>
                <div class="input-group">
                    <label>Página final</label>
                    <input type="number" min="1" max="${totalPages}" value="${
      section.endPage
    }" 
                           onchange="updateSectionEnd(${
                             section.id
                           }, this.value)">
                </div>
            </div>
        `;
    sectionsContainer.appendChild(sectionDiv);
  });
}

function updateSectionName(id, name) {
  const section = sections.find((s) => s.id === id);
  if (section) {
    section.name = name || `Sección ${sections.indexOf(section) + 1}`;
  }
}

function updateSectionStart(id, value) {
  const section = sections.find((s) => s.id === id);
  if (section) {
    const startPage = Math.max(1, Math.min(parseInt(value) || 1, totalPages));
    section.startPage = startPage;
    if (section.endPage < startPage) {
      section.endPage = startPage;
    }
    renderSections();
  }
}

function updateSectionEnd(id, value) {
  const section = sections.find((s) => s.id === id);
  if (section) {
    const endPage = Math.max(
      section.startPage,
      Math.min(parseInt(value) || section.startPage, totalPages)
    );
    section.endPage = endPage;
    renderSections();
  }
}

function updateSectionLimits() {
  if (sections.length > 0 && totalPages > 0) {
    sections[0].endPage = Math.min(sections[0].endPage, totalPages);
    renderSections();
  }
}

// Validación
function validateSections() {
  const errors = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (!section.name.trim()) {
      errors.push(`La sección ${i + 1} debe tener un nombre.`);
    }

    if (section.startPage > section.endPage) {
      errors.push(
        `En la sección "${section.name}", la página inicial no puede ser mayor que la final.`
      );
    }

    if (section.startPage < 1 || section.endPage > totalPages) {
      errors.push(
        `En la sección "${section.name}", las páginas deben estar entre 1 y ${totalPages}.`
      );
    }
  }

  return errors;
}

// Dividir PDF con optimizaciones para archivos grandes
async function splitPDF() {
  const errors = validateSections();
  if (errors.length > 0) {
    showError(errors.join("\n"));
    return;
  }

  try {
    showProgress("Dividiendo PDF...", 0);
    resultsContainer.innerHTML = "";

    const results = [];
    const totalSections = sections.length;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const baseProgress = (i / totalSections) * 90;
      updateProgress(baseProgress);
      progressText.textContent = `Procesando: ${section.name} (${
        i + 1
      }/${totalSections})`;

      try {
        // Crear un nuevo documento PDF
        const newPDF = await PDFLib.PDFDocument.create();

        // Procesar páginas en lotes para archivos grandes
        const pageIndices = [];
        for (
          let pageNum = section.startPage;
          pageNum <= section.endPage;
          pageNum++
        ) {
          pageIndices.push(pageNum - 1);
        }

        const batchSize = 10; // Procesar 10 páginas a la vez
        const totalBatches = Math.ceil(pageIndices.length / batchSize);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const batchStart = batchIndex * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, pageIndices.length);
          const batchIndices = pageIndices.slice(batchStart, batchEnd);

          // Copiar páginas del lote actual
          const copiedPages = await newPDF.copyPages(currentPDF, batchIndices);
          copiedPages.forEach((page) => newPDF.addPage(page));

          // Actualizar progreso dentro de la sección
          const batchProgress =
            baseProgress +
            ((batchIndex + 1) / totalBatches) * (90 / totalSections);
          updateProgress(batchProgress);

          // Permitir que el navegador respire
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        progressText.textContent = `Generando archivo: ${section.name}`;

        // Generar el PDF con configuración optimizada
        const pdfBytes = await newPDF.save({
          useObjectStreams: false, // Mejor para archivos grandes
          addDefaultPage: false,
        });

        // Crear enlace de descarga
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        results.push({
          name: section.name,
          url: url,
          pages: `${section.startPage}-${section.endPage}`,
          pageCount: section.endPage - section.startPage + 1,
          size: Math.round((pdfBytes.length / (1024 * 1024)) * 100) / 100, // MB
        });
      } catch (sectionError) {
        console.error(
          `Error procesando sección ${section.name}:`,
          sectionError
        );
        showWarning(
          `Error al procesar la sección "${section.name}": ${sectionError.message}`
        );
      }
    }

    updateProgress(100);
    hideProgress();

    if (results.length > 0) {
      // Mostrar resultados
      displayResults(results);
      showSection(resultsSection);

      // Mostrar estadísticas
      const totalOutputSize = results.reduce(
        (sum, result) => sum + result.size,
        0
      );
      showSuccess(
        `✅ División completada exitosamente!\n${results.length} archivo${
          results.length > 1 ? "s" : ""
        } generado${results.length > 1 ? "s" : ""} (${totalOutputSize.toFixed(
          1
        )} MB total)`
      );
    } else {
      showError(
        "No se pudo generar ningún archivo. Verifica las configuraciones."
      );
    }
  } catch (error) {
    hideProgress();
    console.error("Error general en splitPDF:", error);
    showError(
      "Error crítico al dividir el PDF:\n" +
        error.message +
        "\n\nSugerencias:\n• Reduce el tamaño de las secciones\n• Cierra otras pestañas del navegador\n• Reinicia la aplicación"
    );
  }
}

function displayResults(results) {
  resultsContainer.innerHTML = "";

  results.forEach((result) => {
    const resultDiv = document.createElement("div");
    resultDiv.className = "result-item fade-in";
    resultDiv.innerHTML = `
            <div class="result-info">
                <h4>${result.name}</h4>
                <p>Páginas ${result.pages} • ${result.pageCount} página${
      result.pageCount > 1 ? "s" : ""
    } • ${result.size} MB</p>
            </div>
            <a href="${result.url}" download="${
      result.name
    }.pdf" class="btn btn-success">
                Descargar
            </a>
        `;
    resultsContainer.appendChild(resultDiv);
  });
}

// Limpiar todo
function clearAll() {
  currentPDF = null;
  totalPages = 0;
  sections = [];

  // Resetear input
  pdfInput.value = "";

  // Ocultar secciones
  hideSection(pdfInfo);
  hideSection(splitSection);
  hideSection(actionsSection);
  hideSection(resultsSection);

  // Limpiar resultados
  resultsContainer.innerHTML = "";

  // Agregar primera sección
  addFirstSection();
}

// Utilidades de UI
function showSection(element) {
  element.style.display = "block";
  element.classList.add("fade-in");
}

function hideSection(element) {
  element.style.display = "none";
  element.classList.remove("fade-in");
}

function showProgress(text, progress) {
  progressText.textContent = text;
  progressFill.style.width = progress + "%";
  progressContainer.style.display = "block";
}

function updateProgress(progress) {
  progressFill.style.width = progress + "%";
}

function hideProgress() {
  progressContainer.style.display = "none";
}

function showError(message) {
  errorMessage.textContent = message;
  errorModal.style.display = "flex";
}

function showWarning(message) {
  // Crear modal de advertencia temporal
  const warningDiv = document.createElement("div");
  warningDiv.className = "warning-toast";
  warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">${message}</span>
            <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
  document.body.appendChild(warningDiv);

  // Auto-remover después de 8 segundos
  setTimeout(() => {
    if (warningDiv.parentElement) {
      warningDiv.remove();
    }
  }, 8000);
}

function showSuccess(message) {
  // Crear modal de éxito temporal
  const successDiv = document.createElement("div");
  successDiv.className = "success-toast";
  successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✅</span>
            <span class="success-text">${message}</span>
            <button class="success-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
  document.body.appendChild(successDiv);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (successDiv.parentElement) {
      successDiv.remove();
    }
  }, 5000);
}

function hideError() {
  errorModal.style.display = "none";
}

// Cerrar modal al hacer click fuera
window.addEventListener("click", function (event) {
  if (event.target === errorModal) {
    hideError();
  }
});
