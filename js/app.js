/**
 * Web Terminal Exam Suite - Main Controller (AppController)
 * Integrates WebTerminal, ExamEngine, ResultsView, and FileUploadModal into a unified command center.
 */

import { WebTerminal } from './terminal.js';
import { ExamEngine } from './examEngine.js';
import { ResultsView } from './resultsView.js';
import { FileUploadModal } from './fileUploadModal.js';
import { SAMPLE_EXAMS } from './sampleExams.js';
import { soundFX } from './soundFx.js';

class AppController {
  constructor() {
    this.currentExam = SAMPLE_EXAMS["aws-saa"];
    this.examHistory = [];

    this.initUI();
  }

  initUI() {
    this.termContainer = document.getElementById('terminalContainer');
    this.viewContainer = document.getElementById('viewContainer');
    this.modalContainer = document.getElementById('modalContainer');

    // Instantiate Sub-components
    this.terminal = new WebTerminal(this.termContainer, this);
    this.examEngine = new ExamEngine(this.viewContainer, this);
    this.resultsView = new ResultsView(this.viewContainer, this);
    this.uploadModal = new FileUploadModal(this.modalContainer, this);

    this.bindHeaderControls();
    this.showIdleScreen();
  }

  bindHeaderControls() {
    const btnNew = document.getElementById('btnNewExam');
    if (btnNew) btnNew.addEventListener('click', () => {
      soundFX.playKeyClick();
      this.openUploadModal();
    });

    const btnToggleSplit = document.getElementById('btnToggleSplit');
    if (btnToggleSplit) btnToggleSplit.addEventListener('click', () => {
      soundFX.playKeyClick();
      const workspace = document.querySelector('.workspace');
      workspace.classList.toggle('split-mode');
    });

    const btnCRT = document.getElementById('btnToggleCRT');
    if (btnCRT) btnCRT.addEventListener('click', () => {
      soundFX.playKeyClick();
      document.body.classList.toggle('theme-crt');
    });
  }

  openUploadModal() {
    this.uploadModal.open();
  }

  loadExamObject(examObj) {
    this.currentExam = examObj;
    this.terminal.println(`[EXAM LOADED] '${examObj.title}' con ${examObj.questions.length} preguntas está listo.`, "success");
  }

  startCurrentExam(config = {}) {
    if (!this.currentExam) {
      this.openUploadModal();
      return;
    }

    this.terminal.println(`[SIMULATOR] Iniciando examen '${this.currentExam.title}'...`, "sys");
    this.examEngine.startExam(this.currentExam, config);
  }

  showResults(results) {
    this.examHistory.push(results);
    this.terminal.println(`[FINAL SCORE] ${results.scorePercentage}% - ${results.passed ? 'PASSED (APROBADO)' : 'FAILED (REPROBADO)'}`, results.passed ? "success" : "error");
    this.resultsView.showResults(results);
  }

  showIdleScreen() {
    const certs = Object.values(SAMPLE_EXAMS);

    this.viewContainer.innerHTML = `
      <div class="view-panel" style="height: 100%; display: flex; flex-direction: column; overflow-y: auto; padding: 2rem; gap: 1.5rem;">
        <!-- Header -->
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <div class="brand-icon" style="width: 54px; height: 54px; font-size: 1.6rem; border-radius: var(--radius-md);">⚡</div>
          <h2 style="font-family: var(--font-mono); font-size: 1.6rem; color: #fff;">Catálogo de Certificaciones y Simulador</h2>
          <p style="max-width: 650px; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">
            Selecciona una certificación oficial precargada para comenzar inmediatamente o sube tus propios documentos (PDF, TXT, VCE Dumps).
          </p>

          <button class="btn btn-primary" id="idleUploadCustomBtn" style="padding: 0.75rem 1.5rem; font-size: 0.95rem; margin-top: 0.5rem;">
            📂 Cargar Documento Propio (PDF, TXT, JSON, VCE Dumps)
          </button>
        </div>

        <!-- Certification Cards Grid -->
        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;">
          <h3 style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
            📜 Exámenes de Certificación Disponibles (${certs.length}):
          </h3>

          <div class="cert-grid">
            ${certs.map(cert => `
              <div class="cert-card" data-cert-id="${cert.id}">
                <div>
                  <div class="cert-header">
                    <div class="cert-icon-box">${cert.icon || '📜'}</div>
                    <span class="cert-vendor" style="color: ${cert.badgeColor || 'var(--accent-cyan)'};">${cert.vendor || 'Certification'}</span>
                  </div>
                  <div class="cert-title">${cert.title}</div>
                  <div class="cert-desc" style="margin-top: 0.5rem;">${cert.description}</div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-dim); display: flex; justify-content: space-between;">
                    <span>Preguntas: <b>${cert.questions.length}</b></span>
                    <span>Corte: <b>${cert.passingScorePercentage}%</b></span>
                  </div>

                  <div class="cert-actions">
                    <button class="btn quick-btn" data-quick-id="${cert.id}">⚡ Rápido (5p)</button>
                    <button class="btn btn-primary full-btn" data-full-id="${cert.id}">🚀 Configurar</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind custom upload button
    const customBtn = document.getElementById('idleUploadCustomBtn');
    if (customBtn) customBtn.addEventListener('click', () => {
      soundFX.playKeyClick();
      this.openUploadModal();
    });

    // Bind Quick Test buttons
    const quickBtns = this.viewContainer.querySelectorAll('[data-quick-id]');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundFX.playKeyClick();
        const id = btn.getAttribute('data-quick-id');
        const certObj = SAMPLE_EXAMS[id];
        if (certObj) {
          this.loadExamObject(certObj);
          this.startCurrentExam({ questionCount: 5, timeLimitMinutes: 10, mode: 'practice' });
        }
      });
    });

    // Bind Full Test buttons
    const fullBtns = this.viewContainer.querySelectorAll('[data-full-id]');
    fullBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        soundFX.playKeyClick();
        const id = btn.getAttribute('data-full-id');
        const certObj = SAMPLE_EXAMS[id];
        if (certObj) {
          this.loadExamObject(certObj);
          this.openUploadModal();
        }
      });
    });
  }
}

// Global Startup
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
