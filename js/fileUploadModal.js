/**
 * File Upload & Exam Setup Modal Component
 * Supports Drag & Drop, file reader (PDF, TXT, JSON, CSV), paste raw text, and exam settings.
 */

import { DocumentParser } from './documentParser.js';
import { SAMPLE_EXAMS } from './sampleExams.js';
import { soundFX } from './soundFx.js';

export class FileUploadModal {
  constructor(containerEl, appController) {
    this.container = containerEl;
    this.app = appController;
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.container.innerHTML = '';
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal-card">
          <div class="modal-header">
            <div style="color: #fff; display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--accent-cyan);">⚡</span> Cargar Documento o Seleccionar Examen
            </div>
            <button class="btn" id="closeModalBtn" style="padding: 0.2rem 0.5rem;">✕</button>
          </div>

          <div class="modal-body">
            <!-- Tabs -->
            <div style="display: flex; border-bottom: 1px solid var(--border-color); gap: 0.5rem; padding-bottom: 0.5rem;">
              <button class="btn btn-primary" id="tabUpload" style="flex: 1;">📂 Archivo Propio (PDF, TXT, VCE)</button>
              <button class="btn" id="tabSample" style="flex: 1;">🌐 Catálogo de Certificaciones</button>
            </div>

            <!-- Tab Content 1: File Upload / Drag & Drop -->
            <div id="uploadContent" style="display: flex; flex-direction: column; gap: 1.25rem;">
              <div class="drop-zone" id="dropZone">
                <div class="drop-icon">📁</div>
                <div style="font-weight: 600; color: #fff;">Arrastra y suelta tu documento aquí</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Formatos compatibles: .txt, .pdf, .json, dumps de VCE/ExamTopics</div>
                <input type="file" id="fileInput" accept=".txt,.pdf,.json,.csv" style="display: none;" />
                <button class="btn btn-primary" style="margin-top: 0.5rem;">Explorar Archivos</button>
              </div>

              <div class="form-group">
                <label class="form-label">O Pega Texto Plano de Examen / Apuntes:</label>
                <textarea id="rawTextArea" class="form-input" rows="4" placeholder="Pega el contenido del examen aquí (ej. Question 1: ... A. Opción 1 ... Answer: A)"></textarea>
              </div>
            </div>

            <!-- Tab Content 2: Pre-loaded Exams -->
            <div id="sampleContent" style="display: none; flex-direction: column; gap: 0.75rem; max-height: 240px; overflow-y: auto;">
              ${Object.values(SAMPLE_EXAMS).map(ex => `
                <div class="option-card sample-exam-card" data-id="${ex.id}">
                  <div class="option-letter">${ex.icon || '📜'}</div>
                  <div class="option-content">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="font-weight: bold; color: #fff;">${ex.title}</div>
                      <span style="font-size: 0.7rem; font-family: var(--font-mono); color: ${ex.badgeColor || 'var(--accent-cyan)'}; font-weight: bold;">
                        ${ex.vendor || ''}
                      </span>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
                      ${ex.description} (${ex.questions.length} preguntas)
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Exam Configuration Options -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
              <div style="font-family: var(--font-mono); font-weight: bold; color: var(--accent-cyan); font-size: 0.9rem;">
                ⚙️ Configuración del Examen:
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Cantidad de Preguntas:</label>
                  <select class="form-select" id="questionCountSelect">
                    <option value="0">Todas las del documento</option>
                    <option value="5">5 preguntas (Prueba Rápida)</option>
                    <option value="10" selected>10 preguntas</option>
                    <option value="20">20 preguntas</option>
                    <option value="50">50 preguntas</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Límite de Tiempo (Minutos):</label>
                  <select class="form-select" id="timeLimitSelect">
                    <option value="10">10 Minutos</option>
                    <option value="20" selected>20 Minutos</option>
                    <option value="30">30 Minutos</option>
                    <option value="60">60 Minutos</option>
                    <option value="0">Sin Límite de Tiempo</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Modo de Examen:</label>
                <select class="form-select" id="modeSelect">
                  <option value="exam" selected>Real Exam Simulator (Respuestas ocultas hasta terminar)</option>
                  <option value="practice">Practice Mode (Retroalimentación inmediata + Explicaciones)</option>
                </select>
              </div>
            </div>

            <button class="btn btn-primary" id="startLoadedBtn" style="justify-content: center; padding: 0.8rem;">
              🚀 Cargar y Comenzar Examen
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backdrop = this.container.querySelector('#modalBackdrop');
    const closeBtn = this.container.querySelector('#closeModalBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Tabs
    const tabUpload = this.container.querySelector('#tabUpload');
    const tabSample = this.container.querySelector('#tabSample');
    const uploadContent = this.container.querySelector('#uploadContent');
    const sampleContent = this.container.querySelector('#sampleContent');

    tabUpload.addEventListener('click', () => {
      tabUpload.className = 'btn btn-primary';
      tabSample.className = 'btn';
      uploadContent.style.display = 'flex';
      sampleContent.style.display = 'none';
    });

    tabSample.addEventListener('click', () => {
      tabSample.className = 'btn btn-primary';
      tabUpload.className = 'btn';
      sampleContent.style.display = 'flex';
      uploadContent.style.display = 'none';
    });

    // Drag & Drop
    const dropZone = this.container.querySelector('#dropZone');
    const fileInput = this.container.querySelector('#fileInput');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.processFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.processFile(fileInput.files[0]);
      }
    });

    // Sample Exam Selection
    let selectedSampleId = null;
    const sampleCards = this.container.querySelectorAll('.sample-exam-card');
    sampleCards.forEach(card => {
      card.addEventListener('click', () => {
        sampleCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedSampleId = card.getAttribute('data-id');
      });
    });

    // Start Button
    const startBtn = this.container.querySelector('#startLoadedBtn');
    startBtn.addEventListener('click', () => {
      soundFX.playKeyClick();
      const qCount = parseInt(this.container.querySelector('#questionCountSelect').value);
      const timeLimit = parseInt(this.container.querySelector('#timeLimitSelect').value);
      const mode = this.container.querySelector('#modeSelect').value;

      const rawText = this.container.querySelector('#rawTextArea').value.trim();

      let examObject = null;

      if (rawText) {
        examObject = DocumentParser.parseText(rawText, "Texto Pegado");
      } else if (selectedSampleId && SAMPLE_EXAMS[selectedSampleId]) {
        examObject = SAMPLE_EXAMS[selectedSampleId];
      } else if (this.app.currentExam) {
        examObject = this.app.currentExam;
      } else {
        alert("Por favor carga un archivo, pega el texto de un examen o selecciona una certificación del catálogo.");
        return;
      }

      this.close();
      this.app.loadExamObject(examObject);
      this.app.startCurrentExam({
        questionCount: qCount,
        timeLimitMinutes: timeLimit,
        mode: mode
      });
    });
  }

  processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const textContent = e.target.result;
        this.loadedExam = DocumentParser.parseText(textContent, file.name);
        alert(`✓ Archivo '${file.name}' procesado correctamente. ${this.loadedExam.questions.length} preguntas detectadas.`);
      } catch (err) {
        alert("Error al procesar el archivo: " + err.message);
      }
    };
    reader.readAsText(file);
  }
}
