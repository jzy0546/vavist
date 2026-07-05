export const tools = [
  {
    slug: "ai-prompt-generator",
    type: "prompt",
    title: "AI Prompt Generator",
    h1: "AI Prompt Generator",
    navLabel: "AI Prompt",
    description:
      "Create focused AI prompts for writing, planning, research, marketing, and everyday work.",
    intro:
      "Turn a rough task into a clear prompt with role, context, output format, and quality checks.",
    primaryKeyword: "AI prompt generator",
    example: {
      topic: "Plan a launch checklist for a small SaaS newsletter",
      context: "Audience is indie founders. Keep it practical and concise."
    },
    faqs: [
      {
        q: "What is an AI prompt generator?",
        a: "It is a tool that turns a rough goal into a clearer prompt with context, constraints, and output instructions."
      },
      {
        q: "Does this tool call an AI API?",
        a: "No. It builds a reusable prompt in your browser, so there are no API keys, accounts, or server calls."
      },
      {
        q: "What makes a good AI prompt?",
        a: "A good prompt explains the role, task, audience, context, format, limits, and success criteria."
      },
      {
        q: "Can I use the generated prompt in ChatGPT or Claude?",
        a: "Yes. Copy the prompt and paste it into ChatGPT, Claude, Gemini, or another AI assistant."
      }
    ],
    related: ["chatgpt-prompt-generator", "ai-token-counter", "ai-text-cleaner"]
  },
  {
    slug: "ai-image-prompt-generator",
    type: "imagePrompt",
    title: "AI Image Prompt Generator",
    h1: "AI Image Prompt Generator",
    navLabel: "Image Prompt",
    description:
      "Build detailed AI image prompts with subject, style, composition, lighting, camera, and negative prompt notes.",
    intro:
      "Create image prompts for concept art, product visuals, thumbnails, and social posts.",
    primaryKeyword: "AI image prompt generator",
    example: {
      subject: "A compact desk setup for a solo developer",
      context: "Clean product photography, natural light, realistic details."
    },
    faqs: [
      {
        q: "What should an AI image prompt include?",
        a: "Include subject, setting, style, composition, lighting, camera view, color palette, and details to avoid."
      },
      {
        q: "Can I use this for Midjourney or image models?",
        a: "Yes. The generated prompt is plain text that can be adapted for most image generation tools."
      },
      {
        q: "Does this create images?",
        a: "No. This MVP creates prompt text only. It does not generate images or use a paid image API."
      },
      {
        q: "Why include a negative prompt?",
        a: "A negative prompt helps clarify what the image should avoid, such as blurry hands, extra text, or clutter."
      }
    ],
    related: ["ai-prompt-generator", "chatgpt-prompt-generator", "ai-text-cleaner"]
  },
  {
    slug: "chatgpt-prompt-generator",
    type: "chatgptPrompt",
    title: "ChatGPT Prompt Generator",
    h1: "ChatGPT Prompt Generator",
    navLabel: "ChatGPT Prompt",
    description:
      "Generate structured ChatGPT prompts for summaries, drafts, brainstorming, analysis, and editing tasks.",
    intro:
      "Give ChatGPT a role, a target audience, a specific output shape, and a checklist before it starts.",
    primaryKeyword: "ChatGPT prompt generator",
    example: {
      topic: "Rewrite a pricing page section for a productivity app",
      context: "Tone should be clear, confident, and friendly."
    },
    faqs: [
      {
        q: "How is this different from a generic AI prompt generator?",
        a: "It is tuned for ChatGPT-style conversations with role framing, follow-up questions, and structured output."
      },
      {
        q: "Should I paste private data into prompts?",
        a: "Avoid pasting sensitive personal, financial, medical, or confidential business information into any AI tool."
      },
      {
        q: "Can this help with writing?",
        a: "Yes. It works well for outlines, edits, summaries, email drafts, product copy, and brainstorming."
      },
      {
        q: "Is the generated prompt guaranteed to be perfect?",
        a: "No. Treat it as a strong starting point and adjust it for your exact task and audience."
      }
    ],
    related: ["ai-prompt-generator", "ai-token-counter", "ai-text-cleaner"]
  },
  {
    slug: "ai-token-counter",
    type: "tokenCounter",
    title: "AI Token Counter",
    h1: "AI Token Counter",
    navLabel: "Token Counter",
    description:
      "Estimate AI tokens, words, characters, sentences, and reading time before pasting text into an AI tool.",
    intro:
      "Quickly estimate whether your prompt or draft is short, medium, or long for common AI workflows.",
    primaryKeyword: "AI token counter",
    example: {
      text: "Paste a draft, prompt, transcript, or research note here to estimate tokens before using an AI assistant."
    },
    faqs: [
      {
        q: "Is this token count exact?",
        a: "No. It is a practical browser estimate. Exact token counts vary by model and tokenizer."
      },
      {
        q: "How does the estimate work?",
        a: "The tool combines character and word counts to provide a quick approximation for English text."
      },
      {
        q: "Why count tokens before using AI?",
        a: "Token estimates help you shorten prompts, split long inputs, and avoid pasting more text than needed."
      },
      {
        q: "Does my text leave the browser?",
        a: "No. Counting runs locally in your browser."
      }
    ],
    related: ["ai-prompt-generator", "chatgpt-prompt-generator", "ai-text-cleaner"]
  },
  {
    slug: "ai-text-cleaner",
    type: "textCleaner",
    title: "AI Text Cleaner",
    h1: "AI Text Cleaner",
    navLabel: "Text Cleaner",
    description:
      "Clean messy AI drafts by trimming lines, collapsing extra spaces, normalizing quotes, and removing repeated blank lines.",
    intro:
      "Prepare copied AI output for editing, publishing, notes, emails, and documentation.",
    primaryKeyword: "AI text cleaner",
    example: {
      text: "  This   draft has   extra spaces.\n\n\nIt also has \"curly quotes\" and messy line breaks.  "
    },
    faqs: [
      {
        q: "What does the AI Text Cleaner remove?",
        a: "It can trim whitespace, collapse repeated spaces, normalize curly quotes, and reduce repeated blank lines."
      },
      {
        q: "Does it rewrite my text?",
        a: "No. It only cleans formatting and spacing. It does not change meaning or generate new content."
      },
      {
        q: "Can I use it for copied ChatGPT output?",
        a: "Yes. It is useful for cleaning AI drafts before pasting them into documents, CMS editors, or emails."
      },
      {
        q: "Is the text uploaded anywhere?",
        a: "No. Cleaning happens locally in the browser."
      }
    ],
    related: ["ai-token-counter", "ai-prompt-generator", "chatgpt-prompt-generator"]
  }
];

export const getTool = (slug) => tools.find((tool) => tool.slug === slug);
