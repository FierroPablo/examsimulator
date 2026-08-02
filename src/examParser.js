// Parser offline para texto ya estructurado como examen (formato VCE/ExamTopics)
// o JSON. No usa IA: solo detecta patrones explícitos. Si no encuentra una
// respuesta correcta marcada, la pregunta se convierte en tipo "open" para
// autoevaluación en vez de asumir cualquier opción por defecto.

export function parseExamText(text, sourceName = "Documento pegado") {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const fromJson = tryParseJson(trimmed, sourceName);
    if (fromJson) return fromJson;
  }

  const questions = extractQuestionsFromDump(trimmed);
  if (questions.length === 0) return null;

  return {
    title: `Examen: ${sourceName.replace(/\.[^/.]+$/, "")}`,
    description: `Extraído automáticamente con ${questions.length} preguntas detectadas.`,
    passingScorePercentage: 70,
    timeLimitMinutes: Math.max(10, Math.ceil(questions.length * 1.5)),
    questions,
  };
}

function tryParseJson(trimmed, sourceName) {
  try {
    const json = JSON.parse(trimmed);
    const rawQuestions = Array.isArray(json) ? json : json.questions || [];
    if (!rawQuestions.length) return null;
    return {
      title: json.title || `Examen: ${sourceName.replace(/\.[^/.]+$/, "")}`,
      description: json.description || `Examen cargado desde ${sourceName}`,
      passingScorePercentage: json.passingScorePercentage || 70,
      timeLimitMinutes: json.timeLimitMinutes || 20,
      questions: normalizeQuestions(rawQuestions),
    };
  } catch (_) {
    return null;
  }
}

function normalizeQuestions(rawList) {
  return rawList.map((q, idx) => {
    const options = Array.isArray(q.options) ? q.options : null;
    const rawCorrect =
      typeof q.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q.correctAnswerIndex === "number"
        ? q.correctAnswerIndex
        : null;

    if (options && rawCorrect !== null && rawCorrect >= 0 && rawCorrect < options.length) {
      return {
        id: idx + 1,
        type: "multiple_choice",
        question: q.question || q.prompt || `Pregunta ${idx + 1}`,
        options,
        correctAnswer: rawCorrect,
        explanation: q.explanation || "Sin explicación adicional en el documento.",
      };
    }

    // No se pudo confirmar una respuesta correcta: se trata como pregunta
    // abierta para que el usuario se autoevalúe, en vez de asumir un índice.
    return {
      id: idx + 1,
      type: "open",
      question: q.question || q.prompt || `Pregunta ${idx + 1}`,
      referenceAnswer:
        q.explanation ||
        (options ? `Opciones originales: ${options.join(" / ")}` : "No se detectó respuesta de referencia."),
    };
  });
}

function extractQuestionsFromDump(text) {
  const questions = [];
  const blocks = text.split(/(?=(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:])/i);

  blocks.forEach((block) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return;

    const qMatch = trimmedBlock.match(
      /(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:]*([\s\S]*?)(?=(?:\n\s*[A-E][).:\s]|\n\s*ANSWER|\n\s*RESPUESTA|$))/i
    );
    let questionText = qMatch ? qMatch[1].trim() : "";

    if (!questionText && trimmedBlock.length > 20) {
      const lines = trimmedBlock.split("\n");
      questionText = lines[0].replace(/^(?:QUESTION|PREGUNTA|ITEM|Q)\s*\d+[\s.:]*/i, "").trim();
    }
    if (!questionText) return;

    const optionMatches = [...trimmedBlock.matchAll(/(?:^|\n)\s*([A-E])[).:\s]+([^\n]+)/gi)];
    const options = [];
    const optionLetters = [];
    optionMatches.forEach((m) => {
      const letter = m[1].toUpperCase();
      const content = m[2].trim();
      if (content && !optionLetters.includes(letter)) {
        options.push(content);
        optionLetters.push(letter);
      }
    });
    if (options.length < 2) return;

    const ansMatch = trimmedBlock.match(/(?:ANSWER|RESPUESTA|CORRECT ANSWER|KEY)[\s.:]*([A-E])/i);
    const expMatch = trimmedBlock.match(/(?:EXPLANATION|EXPLICACIÓN|NOTE|NOTAS)[\s.:]*([\s\S]*?)$/i);
    const explanation = expMatch ? expMatch[1].trim() : "Sin explicación adicional en el documento.";

    if (ansMatch) {
      const letter = ansMatch[1].toUpperCase();
      const correctAnswer = optionLetters.indexOf(letter);
      if (correctAnswer !== -1) {
        questions.push({
          id: questions.length + 1,
          type: "multiple_choice",
          question: questionText,
          options,
          correctAnswer,
          explanation,
        });
        return;
      }
    }

    // No se detectó una clave de respuesta explícita: no asumimos ninguna
    // opción como correcta. Se convierte en pregunta abierta autoevaluable.
    questions.push({
      id: questions.length + 1,
      type: "open",
      question: questionText,
      referenceAnswer: `No se detectó respuesta marcada en el documento. Opciones originales: ${options.join(" / ")}`,
    });
  });

  return questions;
}
