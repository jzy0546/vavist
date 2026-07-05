const $ = (root, selector) => root.querySelector(selector);
const $$ = (root, selector) => Array.from(root.querySelectorAll(selector));

const setStatus = (root, message) => {
  const status = $(root, '[data-role="status"]');
  if (status) status.textContent = message;
};

const getValue = (root, role) => {
  const element = $(root, `[data-role="${role}"]`);
  return element ? element.value.trim() : "";
};

const setOutput = (root, value) => {
  const output = $(root, '[data-role="output"]');
  if (output) output.value = value;
};

const promptTemplate = (root, variant) => {
  const topic = getValue(root, "topic") || "Describe your task";
  const tone = getValue(root, "tone") || "Clear and practical";
  const format = getValue(root, "format") || "Checklist";
  const context = getValue(root, "context") || "No extra context provided.";
  const assistantName = variant === "chatgpt" ? "ChatGPT" : "an AI assistant";
  const focus =
    variant === "chatgpt"
      ? "Ask one clarifying question if the request is ambiguous, then produce the answer."
      : "Before answering, identify assumptions and choose the most useful structure.";

  return `Act as ${assistantName} with strong judgment and concise communication.

Task:
${topic}

Context:
${context}

Tone:
${tone}

Output format:
${format}

Instructions:
1. ${focus}
2. Make the response specific, practical, and easy to act on.
3. Avoid vague advice and unsupported claims.
4. End with a short quality check that explains what to review next.`;
};

const imagePromptTemplate = (root) => {
  const subject = getValue(root, "subject") || "A clear main subject";
  const style = getValue(root, "style") || "Realistic editorial photo";
  const lighting = getValue(root, "lighting") || "Soft natural light";
  const context = getValue(root, "context") || "Clean composition, balanced colors, realistic details.";

  return `${subject}, ${style}, ${lighting}, thoughtful composition, strong focal point, natural depth, high detail.

Scene details:
${context}

Camera and composition:
eye-level view, balanced framing, clear foreground and background separation.

Negative prompt:
blurry details, distorted hands, unreadable text, cluttered layout, extra limbs, low resolution, harsh artifacts.`;
};

const normalizeWhitespace = (text, options) => {
  let result = text;

  if (options.normalizeQuotes) {
    result = result
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2026/g, "...");
  }

  if (options.trimLines) {
    result = result
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  if (options.collapseSpaces) {
    result = result.replace(/[ \t]{2,}/g, " ");
  }

  if (options.blankLines) {
    result = result.replace(/\n{3,}/g, "\n\n");
  }

  return result.trim();
};

const countText = (text) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const sentences = trimmed ? trimmed.split(/[.!?]+/).filter((item) => item.trim()).length : 0;
  const estimatedTokens = Math.max(0, Math.ceil((chars / 4 + words * 0.75) / 2));
  const readingMinutes = words ? Math.max(1, Math.ceil(words / 220)) : 0;

  return { words, chars, sentences, estimatedTokens, readingMinutes };
};

const updateMetrics = (root) => {
  const text = getValue(root, "source");
  const stats = countText(text);
  const metrics = {
    tokens: stats.estimatedTokens.toLocaleString(),
    words: stats.words.toLocaleString(),
    chars: stats.chars.toLocaleString(),
    reading: `${stats.readingMinutes} min`
  };

  Object.entries(metrics).forEach(([key, value]) => {
    const element = $(root, `[data-metric="${key}"]`);
    if (element) element.textContent = value;
  });

  setOutput(
    root,
    `Estimated tokens: ${stats.estimatedTokens.toLocaleString()}
Words: ${stats.words.toLocaleString()}
Characters: ${stats.chars.toLocaleString()}
Sentences: ${stats.sentences.toLocaleString()}
Reading time: ${stats.readingMinutes} min`
  );
};

const generate = (root) => {
  const tool = root.dataset.tool;

  if (tool === "ai-image-prompt-generator") {
    setOutput(root, imagePromptTemplate(root));
    setStatus(root, "Image prompt generated.");
    return;
  }

  if (tool === "chatgpt-prompt-generator") {
    setOutput(root, promptTemplate(root, "chatgpt"));
    setStatus(root, "ChatGPT prompt generated.");
    return;
  }

  if (tool === "ai-token-counter") {
    updateMetrics(root);
    setStatus(root, "Token estimate updated.");
    return;
  }

  if (tool === "ai-text-cleaner") {
    const source = getValue(root, "source");
    const options = Object.fromEntries(
      $$(root, "[data-option]").map((item) => [item.dataset.option, item.checked])
    );
    setOutput(root, normalizeWhitespace(source, options));
    setStatus(root, "Text cleaned.");
    return;
  }

  setOutput(root, promptTemplate(root, "general"));
  setStatus(root, "Prompt generated.");
};

const clearTool = (root) => {
  $$(
    root,
    'input[data-role], textarea[data-role]:not([readonly])'
  ).forEach((element) => {
    element.value = "";
  });
  setOutput(root, "");
  setStatus(root, "Cleared.");
  if (root.dataset.tool === "ai-token-counter") updateMetrics(root);
};

const fillExample = (root) => {
  const examples = {
    "ai-prompt-generator": {
      topic: "Create a launch checklist for a small SaaS newsletter",
      context: "Audience is indie founders. Keep it practical and concise."
    },
    "chatgpt-prompt-generator": {
      topic: "Rewrite a pricing page section for a productivity app",
      context: "Tone should be clear, confident, and friendly."
    },
    "ai-image-prompt-generator": {
      subject: "A compact desk setup for a solo developer",
      context: "Clean product photography, natural light, realistic details."
    },
    "ai-token-counter": {
      source: "Paste a draft, prompt, transcript, or research note here to estimate tokens before using an AI assistant."
    },
    "ai-text-cleaner": {
      source: "  This   draft has   extra spaces.\n\n\nIt also has \"curly quotes\" and messy line breaks.  "
    }
  };

  const values = examples[root.dataset.tool] || {};
  Object.entries(values).forEach(([role, value]) => {
    const element = $(root, `[data-role="${role}"]`);
    if (element) element.value = value;
  });
  generate(root);
};

const copyOutput = async (root) => {
  const output = $(root, '[data-role="output"]');
  if (!output || !output.value.trim()) {
    setStatus(root, "Nothing to copy yet.");
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    setStatus(root, "Copied to clipboard.");
  } catch {
    output.select();
    document.execCommand("copy");
    setStatus(root, "Copied.");
  }
};

const initTool = (root) => {
  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;

    if (action === "generate") generate(root);
    if (action === "clear") clearTool(root);
    if (action === "example") fillExample(root);
    if (action === "copy") copyOutput(root);
  });

  $$(
    root,
    "input, select, textarea, [data-option]"
  ).forEach((element) => {
    element.addEventListener("input", () => {
      if (root.dataset.tool === "ai-token-counter") updateMetrics(root);
    });
    element.addEventListener("change", () => {
      if (root.dataset.tool === "ai-token-counter") updateMetrics(root);
    });
  });

  generate(root);
};

document.querySelectorAll(".tool-shell").forEach(initTool);
