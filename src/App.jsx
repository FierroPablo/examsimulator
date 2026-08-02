import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Award,
  Flag,
  Pause,
  Play,
  Library,
  FileUp,
  ClipboardPaste,
} from "lucide-react";
import { SAMPLE_EXAMS } from "./sampleExams.js";
import { parseExamText } from "./examParser.js";

const PALETTE = {
  paper: "#F6F5F1",
  card: "#FFFFFF",
  ink: "#1C2430",
  graphite: "#66707F",
  line: "#DAD5C9",
  accent: "#2E5EAA",
  accentDark: "#1F3F73",
  success: "#3B7A57",
  successBg: "#E7F1EA",
  danger: "#AF3E29",
  dangerBg: "#F7E9E5",
  warn: "#9C6B12",
  warnBg: "#FBF0DD",
};

const AI_QUESTION_COUNTS = [5, 8, 12];
const POOL_LIMITS = [0, 5, 10, 20];
const TIME_LIMITS = [10, 20, 30, 60, 0];

function Ticket({ children, style }) {
  return (
    <div
      style={{
        background: PALETTE.card,
        border: `1px solid ${PALETTE.line}`,
        borderRadius: 4,
        boxShadow: "0 1px 2px rgba(28,36,48,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Perforation() {
  return (
    <div style={{ position: "relative", height: 1, margin: "0 -1px" }}>
      <div
        style={{
          borderTop: `1px dashed ${PALETTE.line}`,
          position: "absolute",
          left: 14,
          right: 14,
          top: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -7,
          top: -7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: PALETTE.paper,
          border: `1px solid ${PALETTE.line}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -7,
          top: -7,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: PALETTE.paper,
          border: `1px solid ${PALETTE.line}`,
        }}
      />
    </div>
  );
}

function timeLabel(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

function PillSelector({ options, value, onChange, renderLabel }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 6,
            border: `1px solid ${value === opt ? PALETTE.accent : PALETTE.line}`,
            background: value === opt ? PALETTE.accent : "transparent",
            color: value === opt ? "#fff" : PALETTE.ink,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState("setup"); // setup | generating | exam | results
  const [activeTab, setActiveTab] = useState("pdf"); // pdf | paste | catalog
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem("examGenApiKey") || "";
    } catch (_) {
      return "";
    }
  });

  function updateApiKey(value) {
    setApiKey(value);
    try {
      localStorage.setItem("examGenApiKey", value);
    } catch (_) {}
  }

  // PDF (AI) source
  const [fileName, setFileName] = useState("");
  const [base64Data, setBase64Data] = useState(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(8);
  const fileInputRef = useRef(null);

  // Paste (offline) source
  const [pasteText, setPasteText] = useState("");

  // Catalog source
  const [selectedCatalogId, setSelectedCatalogId] = useState(null);

  // Shared config
  const [poolLimit, setPoolLimit] = useState(0);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [mode, setMode] = useState("exam"); // exam | practice

  // Exam runtime
  const [examTitle, setExamTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [openGraded, setOpenGraded] = useState({});
  const [flagged, setFlagged] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCountdown, setIsCountdown] = useState(true);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (stage !== "exam") return;
    const id = setInterval(() => {
      if (isPausedRef.current) return;
      setSecondsLeft((s) => {
        if (isCountdown) {
          if (s <= 1) {
            clearInterval(id);
            setStage("results");
            return 0;
          }
          return s - 1;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage, isCountdown]);

  function handleFile(file) {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Solo se aceptan archivos PDF.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setBase64Data(base64);
    };
    reader.onerror = () => setError("No se pudo leer el archivo.");
    reader.readAsDataURL(file);
  }

  function beginExam(examData) {
    let activeQuestions = examData.questions;
    if (activeTab !== "pdf" && poolLimit > 0 && poolLimit < activeQuestions.length) {
      activeQuestions = activeQuestions.slice(0, poolLimit);
    }
    setExamTitle(examData.title);
    setPassingScore(examData.passingScorePercentage || 70);
    setQuestions(activeQuestions);
    setAnswers({});
    setOpenGraded({});
    setFlagged({});
    setCurrentIdx(0);
    setConfirmFinish(false);
    const countdown = timeLimitMinutes > 0;
    setIsCountdown(countdown);
    setSecondsLeft(countdown ? timeLimitMinutes * 60 : 0);
    setIsPaused(false);
    setStage("exam");
  }

  async function generateFromPdf() {
    if (!base64Data) {
      setError("Sube un PDF primero.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Ingresa tu API key de Anthropic antes de generar el examen.");
      return;
    }
    setStage("generating");
    setError(null);
    try {
      const prompt = `Eres un generador de exámenes de certificación profesional. Analiza el documento PDF adjunto y genera un examen con exactamente ${aiNumQuestions} preguntas que evalúen la comprensión de los conceptos clave, con el nivel de rigor de un examen de certificación real.

Usa una mezcla de tipos de pregunta: aproximadamente la mitad de opción múltiple (4 opciones), una cuarta parte verdadero/falso, y una cuarta parte preguntas abiertas de respuesta breve. Redacta las preguntas en el mismo idioma del documento. Sé muy conciso: cada "explanation" y "referenceAnswer" debe tener como máximo 15 palabras.

Responde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin comillas de bloque de código), con esta estructura exacta:
{"examTitle": "string breve", "questions": [{"id": 1, "type": "multiple_choice", "question": "string", "options": ["string","string","string","string"], "correctAnswer": 0, "explanation": "string breve"}, {"id": 2, "type": "true_false", "question": "string", "correctAnswer": true, "explanation": "string breve"}, {"id": 3, "type": "open", "question": "string", "referenceAnswer": "string breve"}]}

El array "questions" debe tener exactamente ${aiNumQuestions} elementos, numerados en "id" del 1 al ${aiNumQuestions}.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: { type: "base64", media_type: "application/pdf", data: base64Data },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        let detail = `Código ${response.status}`;
        try {
          const errBody = await response.json();
          detail = errBody?.error?.message || detail;
        } catch (_) {}
        throw new Error(`La API respondió con un error: ${detail}`);
      }

      const data = await response.json();
      const text = data.content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
      let clean = text.replace(/```json|```/g, "").trim();
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) clean = clean.slice(firstBrace, lastBrace + 1);

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (parseErr) {
        throw new Error(
          `La respuesta llegó incompleta o mal formada (posiblemente cortada por longitud). Detalle: ${parseErr.message}`
        );
      }
      if (!parsed.questions || !parsed.questions.length) {
        throw new Error("El examen generado no tiene preguntas.");
      }

      beginExam({
        title: parsed.examTitle || fileName.replace(/\.pdf$/i, ""),
        passingScorePercentage: 70,
        questions: parsed.questions,
      });
    } catch (e) {
      setError(e.message || "No se pudo generar el examen a partir de este documento.");
      setStage("setup");
    }
  }

  function loadFromPaste() {
    setError(null);
    const parsed = parseExamText(pasteText, "Texto pegado");
    if (!parsed) {
      setError(
        "No se detectó un formato de examen reconocible (dump tipo Question/Answer o JSON). Prueba con la pestaña 'Subir PDF' para generación por IA."
      );
      return;
    }
    beginExam(parsed);
  }

  function loadFromCatalog() {
    setError(null);
    if (!selectedCatalogId) {
      setError("Elige una certificación del catálogo.");
      return;
    }
    beginExam(SAMPLE_EXAMS[selectedCatalogId]);
  }

  function setAnswer(qId, value) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function toggleFlag(qId) {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }

  function score() {
    let correct = 0;
    questions.forEach((q) => {
      if (q.type === "open") {
        if (openGraded[q.id] === true) correct += 1;
      } else if (answers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });
    return { correct, total: questions.length };
  }

  function resetAll() {
    setStage("setup");
    setError(null);
    setFileName("");
    setBase64Data(null);
    setPasteText("");
    setSelectedCatalogId(null);
    setExamTitle("");
    setQuestions([]);
    setAnswers({});
    setOpenGraded({});
    setFlagged({});
    setCurrentIdx(0);
    setConfirmFinish(false);
  }

  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PALETTE.paper,
        fontFamily: "Inter, sans-serif",
        color: PALETTE.ink,
        padding: "28px 16px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{fontImport}</style>
      <div style={{ width: "100%", maxWidth: 600 }}>
        {stage === "setup" && (
          <SetupScreen
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            error={error}
            fileName={fileName}
            onFile={handleFile}
            fileInputRef={fileInputRef}
            aiNumQuestions={aiNumQuestions}
            setAiNumQuestions={setAiNumQuestions}
            canGeneratePdf={!!base64Data}
            onGeneratePdf={generateFromPdf}
            apiKey={apiKey}
            onApiKeyChange={updateApiKey}
            pasteText={pasteText}
            setPasteText={setPasteText}
            onLoadPaste={loadFromPaste}
            selectedCatalogId={selectedCatalogId}
            setSelectedCatalogId={setSelectedCatalogId}
            onLoadCatalog={loadFromCatalog}
            poolLimit={poolLimit}
            setPoolLimit={setPoolLimit}
            timeLimitMinutes={timeLimitMinutes}
            setTimeLimitMinutes={setTimeLimitMinutes}
            mode={mode}
            setMode={setMode}
          />
        )}
        {stage === "generating" && <GeneratingScreen fileName={fileName} />}
        {stage === "exam" && (
          <ExamScreen
            examTitle={examTitle}
            questions={questions}
            currentIdx={currentIdx}
            setCurrentIdx={setCurrentIdx}
            answers={answers}
            setAnswer={setAnswer}
            flagged={flagged}
            toggleFlag={toggleFlag}
            mode={mode}
            secondsLeft={secondsLeft}
            isCountdown={isCountdown}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            confirmFinish={confirmFinish}
            setConfirmFinish={setConfirmFinish}
            onFinish={() => setStage("results")}
          />
        )}
        {stage === "results" && (
          <ResultsScreen
            examTitle={examTitle}
            passingScore={passingScore}
            questions={questions}
            answers={answers}
            openGraded={openGraded}
            setOpenGraded={setOpenGraded}
            score={score()}
            onReset={resetAll}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "9px 0",
        borderRadius: 6,
        border: `1px solid ${active ? PALETTE.accent : PALETTE.line}`,
        background: active ? PALETTE.accent : "transparent",
        color: active ? "#fff" : PALETTE.ink,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <Icon size={14} /> {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        color: PALETTE.graphite,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function SetupScreen(props) {
  const {
    activeTab,
    setActiveTab,
    error,
    fileName,
    onFile,
    fileInputRef,
    aiNumQuestions,
    setAiNumQuestions,
    canGeneratePdf,
    onGeneratePdf,
    pasteText,
    setPasteText,
    onLoadPaste,
    selectedCatalogId,
    setSelectedCatalogId,
    onLoadCatalog,
    poolLimit,
    setPoolLimit,
    timeLimitMinutes,
    setTimeLimitMinutes,
    mode,
    setMode,
    apiKey,
    onApiKeyChange,
  } = props;
  const [dragOver, setDragOver] = useState(false);
  const [showKey, setShowKey] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            color: PALETTE.accent,
            marginBottom: 6,
          }}
        >
          CENTRO DE EVALUACIÓN
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 27, lineHeight: 1.15, margin: 0 }}>
          Generador de exámenes de certificación
        </h1>
        <p style={{ color: PALETTE.graphite, fontSize: 14, marginTop: 8 }}>
          Sube un PDF para generar preguntas por IA, pega un examen ya
          formateado, o elige uno del catálogo.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <TabButton active={activeTab === "pdf"} onClick={() => setActiveTab("pdf")} icon={FileUp}>
          Subir PDF
        </TabButton>
        <TabButton active={activeTab === "paste"} onClick={() => setActiveTab("paste")} icon={ClipboardPaste}>
          Pegar texto
        </TabButton>
        <TabButton active={activeTab === "catalog"} onClick={() => setActiveTab("catalog")} icon={Library}>
          Catálogo
        </TabButton>
      </div>

      {activeTab === "pdf" && (
        <Ticket style={{ padding: 20, marginBottom: 16 }}>
          <SectionLabel>API KEY DE ANTHROPIC</SectionLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 6,
                border: `1px solid ${PALETTE.line}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                color: PALETTE.ink,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              style={{
                padding: "0 12px",
                borderRadius: 6,
                border: `1px solid ${PALETTE.line}`,
                background: "transparent",
                color: PALETTE.graphite,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {showKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: PALETTE.graphite, marginTop: 8 }}>
            Se guarda solo en tu navegador. Consíguela en{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              style={{ color: PALETTE.accent }}
            >
              console.anthropic.com/settings/keys
            </a>
            .
          </div>
        </Ticket>
      )}

      <Ticket style={{ padding: 20, marginBottom: 16 }}>
        {activeTab === "pdf" && (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `1.5px dashed ${dragOver ? PALETTE.accent : PALETTE.line}`,
                borderRadius: 8,
                padding: "26px 16px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver ? "#EAF0FA" : "transparent",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => onFile(e.target.files?.[0])}
                style={{ display: "none" }}
              />
              {fileName ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <FileText size={18} color={PALETTE.accent} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{fileName}</span>
                </div>
              ) : (
                <div>
                  <Upload size={22} color={PALETTE.graphite} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Arrastra tu PDF aquí o haz clic para elegirlo</div>
                  <div style={{ fontSize: 12, color: PALETTE.graphite, marginTop: 4 }}>
                    La IA lee el contenido real del PDF y redacta preguntas nuevas.
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              <SectionLabel>NÚMERO DE PREGUNTAS A GENERAR</SectionLabel>
              <PillSelector options={AI_QUESTION_COUNTS} value={aiNumQuestions} onChange={setAiNumQuestions} />
            </div>
          </div>
        )}

        {activeTab === "paste" && (
          <div>
            <SectionLabel>PEGA UN EXAMEN YA FORMATEADO (JSON, O TIPO "QUESTION 1 / A) ... / ANSWER: A")</SectionLabel>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={`Question 1: ¿Cuál...?\nA) Opción 1\nB) Opción 2\nAnswer: A\nExplanation: ...`}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${PALETTE.line}`,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12.5,
                color: PALETTE.ink,
                resize: "vertical",
              }}
            />
            <div style={{ fontSize: 12, color: PALETTE.graphite, marginTop: 6 }}>
              Esto se procesa localmente por patrones, no por IA. Si no se detecta la
              respuesta correcta de una pregunta, se convierte en pregunta abierta
              autoevaluable en vez de asumir una al azar.
            </div>
          </div>
        )}

        {activeTab === "catalog" && (
          <div>
            <SectionLabel>CERTIFICACIONES DE MUESTRA (SIN IA, LISTAS PARA PROBAR)</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.values(SAMPLE_EXAMS).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedCatalogId(ex.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: `1px solid ${selectedCatalogId === ex.id ? PALETTE.accent : PALETTE.line}`,
                    background: selectedCatalogId === ex.id ? "#EAF0FA" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{ex.icon}</span>
                  <span>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.title}</div>
                    <div style={{ fontSize: 12, color: PALETTE.graphite }}>
                      {ex.description} ({ex.questions.length} preguntas)
                    </div>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Ticket>

      <Ticket style={{ padding: 20 }}>
        <SectionLabel>CONFIGURACIÓN DEL EXAMEN</SectionLabel>

        {activeTab !== "pdf" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: PALETTE.graphite, marginBottom: 8 }}>Cantidad de preguntas a usar</div>
            <PillSelector
              options={POOL_LIMITS}
              value={poolLimit}
              onChange={setPoolLimit}
              renderLabel={(n) => (n === 0 ? "Todas" : n)}
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: PALETTE.graphite, marginBottom: 8 }}>Límite de tiempo</div>
          <PillSelector
            options={TIME_LIMITS}
            value={timeLimitMinutes}
            onChange={setTimeLimitMinutes}
            renderLabel={(m) => (m === 0 ? "Sin límite" : `${m} min`)}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: PALETTE.graphite, marginBottom: 8 }}>Modo</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "exam", label: "Examen real" },
              { key: "practice", label: "Práctica" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 6,
                  border: `1px solid ${mode === m.key ? PALETTE.accent : PALETTE.line}`,
                  background: mode === m.key ? PALETTE.accent : "transparent",
                  color: mode === m.key ? "#fff" : PALETTE.ink,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: PALETTE.graphite, marginTop: 6 }}>
            {mode === "exam"
              ? "Las respuestas quedan ocultas hasta finalizar."
              : "Verás si acertaste y la explicación justo después de responder."}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: PALETTE.dangerBg,
              color: PALETTE.danger,
              fontSize: 13,
              padding: "8px 12px",
              borderRadius: 6,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={
            activeTab === "pdf" ? onGeneratePdf : activeTab === "paste" ? onLoadPaste : onLoadCatalog
          }
          disabled={activeTab === "pdf" && !canGeneratePdf}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 6,
            border: "none",
            background: activeTab === "pdf" && !canGeneratePdf ? PALETTE.line : PALETTE.accent,
            color: activeTab === "pdf" && !canGeneratePdf ? PALETTE.graphite : "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: activeTab === "pdf" && !canGeneratePdf ? "not-allowed" : "pointer",
          }}
        >
          {activeTab === "pdf" ? "Generar examen con IA" : "Comenzar examen"}
        </button>
      </Ticket>
    </div>
  );
}

function GeneratingScreen({ fileName }) {
  return (
    <Ticket style={{ padding: 40, textAlign: "center", marginTop: 60 }}>
      <Loader2 size={26} color={PALETTE.accent} style={{ margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontWeight: 600, fontSize: 15 }}>Analizando documento…</div>
      <div style={{ fontSize: 13, color: PALETTE.graphite, marginTop: 4 }}>
        Generando preguntas a partir de {fileName || "tu PDF"}
      </div>
    </Ticket>
  );
}

function ExamScreen({
  examTitle,
  questions,
  currentIdx,
  setCurrentIdx,
  answers,
  setAnswer,
  flagged,
  toggleFlag,
  mode,
  secondsLeft,
  isCountdown,
  isPaused,
  setIsPaused,
  confirmFinish,
  setConfirmFinish,
  onFinish,
}) {
  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const answered = q.type === "open" ? !!answers[q.id]?.trim() : answers[q.id] !== undefined;
  const showFeedback = mode === "practice" && q.type !== "open" && answers[q.id] !== undefined;
  const urgent = isCountdown && secondsLeft < 300;

  return (
    <div>
      <Ticket style={{ padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: PALETTE.accent, letterSpacing: "0.08em" }}>
              PREGUNTA {currentIdx + 1} DE {questions.length} · {mode === "exam" ? "EXAMEN" : "PRÁCTICA"}
            </div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 17 }}>{examTitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                color: urgent ? PALETTE.danger : PALETTE.graphite,
                border: `1px solid ${urgent ? PALETTE.danger : PALETTE.line}`,
                borderRadius: 4,
                padding: "4px 8px",
              }}
            >
              {timeLabel(secondsLeft)}
            </div>
            <button
              onClick={() => setIsPaused((p) => !p)}
              title={isPaused ? "Reanudar" : "Pausar"}
              style={{
                border: `1px solid ${PALETTE.line}`,
                background: "transparent",
                borderRadius: 4,
                padding: "5px 7px",
                cursor: "pointer",
                color: PALETTE.graphite,
                display: "flex",
              }}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
        <div style={{ height: 4, background: PALETTE.line, borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIdx + 1) / questions.length) * 100}%`,
              background: PALETTE.accent,
              transition: "width 150ms",
            }}
          />
        </div>
      </Ticket>

      {isPaused && (
        <Ticket style={{ padding: 16, marginBottom: 16, textAlign: "center", background: PALETTE.warnBg }}>
          <div style={{ color: PALETTE.warn, fontWeight: 600, fontSize: 13 }}>Examen en pausa</div>
        </Ticket>
      )}

      <Ticket style={{ padding: 22, opacity: isPaused ? 0.4 : 1, pointerEvents: isPaused ? "none" : "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5 }}>{q.question}</div>
          <button
            onClick={() => toggleFlag(q.id)}
            title="Marcar para revisión"
            style={{
              flexShrink: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: flagged[q.id] ? PALETTE.warn : PALETTE.line,
            }}
          >
            <Flag size={18} fill={flagged[q.id] ? PALETTE.warn : "none"} />
          </button>
        </div>

        {q.type === "multiple_choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, i) => {
              let border = PALETTE.line;
              let bg = "transparent";
              if (showFeedback) {
                if (i === q.correctAnswer) {
                  border = PALETTE.success;
                  bg = PALETTE.successBg;
                } else if (answers[q.id] === i) {
                  border = PALETTE.danger;
                  bg = PALETTE.dangerBg;
                }
              } else if (answers[q.id] === i) {
                border = PALETTE.accent;
                bg = "#EAF0FA";
              }
              return (
                <button
                  key={i}
                  onClick={() => setAnswer(q.id, i)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${border}`,
                    background: bg,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    color: PALETTE.ink,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      border: `1.5px solid ${answers[q.id] === i ? PALETTE.accent : PALETTE.graphite}`,
                      background: answers[q.id] === i ? PALETTE.accent : "transparent",
                      color: answers[q.id] === i ? "#fff" : PALETTE.graphite,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ paddingTop: 2 }}>{opt}</span>
                </button>
              );
            })}
            {showFeedback && (
              <div style={{ fontSize: 13, color: PALETTE.graphite, marginTop: 4 }}>{q.explanation}</div>
            )}
          </div>
        )}

        {q.type === "true_false" && (
          <div>
            <div style={{ display: "flex", gap: 10 }}>
              {[true, false].map((val) => {
                let border = PALETTE.line;
                let bg = "transparent";
                let color = PALETTE.ink;
                if (showFeedback) {
                  if (val === q.correctAnswer) {
                    border = PALETTE.success;
                    bg = PALETTE.success;
                    color = "#fff";
                  } else if (answers[q.id] === val) {
                    border = PALETTE.danger;
                    bg = PALETTE.danger;
                    color = "#fff";
                  }
                } else if (answers[q.id] === val) {
                  border = PALETTE.accent;
                  bg = PALETTE.accent;
                  color = "#fff";
                }
                return (
                  <button
                    key={String(val)}
                    onClick={() => setAnswer(q.id, val)}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      borderRadius: 8,
                      border: `1.5px solid ${border}`,
                      background: bg,
                      color,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    {val ? "VERDADERO" : "FALSO"}
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <div style={{ fontSize: 13, color: PALETTE.graphite, marginTop: 10 }}>{q.explanation}</div>
            )}
          </div>
        )}

        {q.type === "open" && (
          <textarea
            value={answers[q.id] || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="Escribe tu respuesta…"
            rows={5}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 14,
              borderRadius: 8,
              border: `1px solid ${PALETTE.line}`,
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              color: PALETTE.ink,
              lineHeight: "26px",
              background: "repeating-linear-gradient(transparent, transparent 25px, " + PALETTE.line + " 26px)",
              resize: "vertical",
            }}
          />
        )}
      </Ticket>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16, marginBottom: 8 }}>
        {questions.map((qq, idx) => {
          const isAns = qq.type === "open" ? !!answers[qq.id]?.trim() : answers[qq.id] !== undefined;
          const isFlag = !!flagged[qq.id];
          const isActive = idx === currentIdx;
          return (
            <button
              key={qq.id}
              onClick={() => setCurrentIdx(idx)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: `1.5px solid ${isActive ? PALETTE.accent : isFlag ? PALETTE.warn : isAns ? PALETTE.success : PALETTE.line}`,
                background: isActive ? PALETTE.accent : isAns ? PALETTE.successBg : "transparent",
                color: isActive ? "#fff" : PALETTE.ink,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 6,
            border: `1px solid ${PALETTE.line}`,
            background: "transparent",
            color: currentIdx === 0 ? PALETTE.line : PALETTE.ink,
            fontSize: 13,
            cursor: currentIdx === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        {isLast ? (
          confirmFinish ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmFinish(false)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 6,
                  border: `1px solid ${PALETTE.line}`,
                  background: "transparent",
                  color: PALETTE.ink,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Seguir revisando
              </button>
              <button
                onClick={onFinish}
                style={{
                  padding: "9px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: PALETTE.danger,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sí, finalizar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmFinish(true)}
              style={{
                padding: "9px 18px",
                borderRadius: 6,
                border: "none",
                background: PALETTE.accent,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Finalizar examen
            </button>
          )
        ) : (
          <button
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 6,
              border: "none",
              background: PALETTE.accentDark,
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        )}
      </div>
      {!answered && (
        <div style={{ fontSize: 12, color: PALETTE.graphite, textAlign: "center", marginTop: 10 }}>
          Aún no has respondido esta pregunta.
        </div>
      )}
    </div>
  );
}

function ResultsScreen({ examTitle, passingScore, questions, answers, openGraded, setOpenGraded, score, onReset }) {
  const pct = questions.length ? Math.round((score.correct / score.total) * 100) : 0;
  const passed = pct >= passingScore;

  return (
    <div>
      <Ticket style={{ padding: 26, textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: PALETTE.graphite, marginBottom: 10 }}>
          RESULTADO — {examTitle.toUpperCase()}
        </div>
        <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 44, lineHeight: 1 }}>
          {score.correct}/{score.total}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginTop: 14,
            padding: "6px 14px",
            borderRadius: 999,
            background: passed ? PALETTE.successBg : PALETTE.dangerBg,
            color: passed ? PALETTE.success : PALETTE.danger,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <Award size={15} /> {passed ? "APROBADO" : "NO APROBADO"} · {pct}% (corte {passingScore}%)
        </div>
      </Ticket>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q, idx) => (
          <ReviewCard
            key={q.id}
            index={idx}
            q={q}
            userAnswer={answers[q.id]}
            openGraded={openGraded[q.id]}
            onGradeOpen={(val) => setOpenGraded((prev) => ({ ...prev, [q.id]: val }))}
          />
        ))}
      </div>

      <button
        onClick={onReset}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          marginTop: 20,
          padding: "12px 0",
          borderRadius: 6,
          border: `1px solid ${PALETTE.line}`,
          background: "transparent",
          color: PALETTE.ink,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <RotateCcw size={15} /> Nuevo examen
      </button>
    </div>
  );
}

function ReviewCard({ index, q, userAnswer, openGraded, onGradeOpen }) {
  let isCorrect = null;
  if (q.type !== "open") isCorrect = userAnswer === q.correctAnswer;

  return (
    <Ticket style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: PALETTE.graphite }}>
          Q-{String(index + 1).padStart(2, "0")}
        </div>
        {q.type !== "open" &&
          (isCorrect ? <CheckCircle2 size={17} color={PALETTE.success} /> : <XCircle size={17} color={PALETTE.danger} />)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, margin: "6px 0 10px" }}>{q.question}</div>

      {q.type === "multiple_choice" && (
        <div style={{ fontSize: 13, color: PALETTE.graphite, lineHeight: 1.6 }}>
          Tu respuesta:{" "}
          <span style={{ color: isCorrect ? PALETTE.success : PALETTE.danger, fontWeight: 600 }}>
            {userAnswer !== undefined ? q.options[userAnswer] : "Sin responder"}
          </span>
          {!isCorrect && (
            <div>
              Respuesta correcta:{" "}
              <span style={{ color: PALETTE.success, fontWeight: 600 }}>{q.options[q.correctAnswer]}</span>
            </div>
          )}
          {q.explanation && <div style={{ marginTop: 4 }}>{q.explanation}</div>}
        </div>
      )}

      {q.type === "true_false" && (
        <div style={{ fontSize: 13, color: PALETTE.graphite, lineHeight: 1.6 }}>
          Tu respuesta:{" "}
          <span style={{ color: isCorrect ? PALETTE.success : PALETTE.danger, fontWeight: 600 }}>
            {userAnswer === undefined ? "Sin responder" : userAnswer ? "Verdadero" : "Falso"}
          </span>
          {!isCorrect && (
            <div>
              Respuesta correcta:{" "}
              <span style={{ color: PALETTE.success, fontWeight: 600 }}>{q.correctAnswer ? "Verdadero" : "Falso"}</span>
            </div>
          )}
          {q.explanation && <div style={{ marginTop: 4 }}>{q.explanation}</div>}
        </div>
      )}

      {q.type === "open" && (
        <div style={{ fontSize: 13, color: PALETTE.graphite, lineHeight: 1.6 }}>
          <div>
            <strong style={{ color: PALETTE.ink }}>Tu respuesta:</strong> {userAnswer?.trim() ? userAnswer : "Sin responder"}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong style={{ color: PALETTE.ink }}>Respuesta de referencia:</strong> {q.referenceAnswer}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>¿Tu respuesta fue correcta?</span>
            <button
              onClick={() => onGradeOpen(true)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${openGraded === true ? PALETTE.success : PALETTE.line}`,
                background: openGraded === true ? PALETTE.successBg : "transparent",
                color: PALETTE.success,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sí
            </button>
            <button
              onClick={() => onGradeOpen(false)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${openGraded === false ? PALETTE.danger : PALETTE.line}`,
                background: openGraded === false ? PALETTE.dangerBg : "transparent",
                color: PALETTE.danger,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
    </Ticket>
  );
}
