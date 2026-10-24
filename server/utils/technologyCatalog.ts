import type { TechnologyCatalogItem } from '~/composables/usePortfolioData';

const featuredCatalog: TechnologyCatalogItem[] = [
  { name: 'Angular', icon: 'logos:angular-icon', category: 'Frameworks' },
  { name: 'Astro', icon: 'logos:astro-icon', category: 'Frameworks' },
  { name: 'C', icon: 'logos:c', category: 'Langages' },
  { name: 'C++', icon: 'logos:c-plusplus', category: 'Langages' },
  { name: 'CSS', icon: 'logos:css-3', category: 'Langages' },
  { name: 'Dart', icon: 'logos:dart', category: 'Langages' },
  { name: 'Django', icon: 'logos:django-icon', category: 'Frameworks' },
  { name: 'Docker', icon: 'logos:docker-icon', category: 'Outils & Cloud' },
  { name: 'Express', icon: 'logos:express', category: 'Frameworks' },
  { name: 'Figma', icon: 'logos:figma', category: 'Outils & Cloud' },
  { name: 'Firebase', icon: 'logos:firebase', category: 'Outils & Cloud' },
  { name: 'Flutter', icon: 'logos:flutter', category: 'Frameworks' },
  { name: 'Git', icon: 'logos:git-icon', category: 'Outils & Cloud' },
  { name: 'GitHub', icon: 'logos:github-icon', category: 'Outils & Cloud' },
  { name: 'Go', icon: 'logos:go', category: 'Langages' },
  { name: 'HTML', icon: 'logos:html-5', category: 'Langages' },
  { name: 'Java', icon: 'logos:java', category: 'Langages' },
  { name: 'JavaScript', icon: 'logos:javascript', category: 'Langages' },
  { name: 'Kotlin', icon: 'logos:kotlin', category: 'Langages' },
  { name: 'Laravel', icon: 'logos:laravel', category: 'Frameworks' },
  { name: 'MongoDB', icon: 'logos:mongodb-icon', category: 'Bases de données' },
  { name: 'NestJS', icon: 'logos:nestjs', category: 'Frameworks' },
  { name: 'Next.js', icon: 'logos:nextjs-icon', category: 'Frameworks' },
  { name: 'Node.js', icon: 'logos:nodejs-icon', category: 'Runtimes & API' },
  { name: 'Nuxt', icon: 'logos:nuxt-icon', category: 'Frameworks' },
  { name: 'PHP', icon: 'logos:php', category: 'Langages' },
  { name: 'PostgreSQL', icon: 'logos:postgresql', category: 'Bases de données' },
  { name: 'Python', icon: 'logos:python', category: 'Langages' },
  { name: 'React', icon: 'logos:react', category: 'Frameworks' },
  { name: 'Redis', icon: 'logos:redis', category: 'Bases de données' },
  { name: 'Ruby', icon: 'logos:ruby', category: 'Langages' },
  { name: 'Rust', icon: 'logos:rust', category: 'Langages' },
  { name: 'Sass', icon: 'logos:sass', category: 'Langages' },
  { name: 'Spring', icon: 'logos:spring-icon', category: 'Frameworks' },
  { name: 'SQLite', icon: 'logos:sqlite', category: 'Bases de données' },
  { name: 'Supabase', icon: 'logos:supabase-icon', category: 'Bases de données' },
  { name: 'Svelte', icon: 'logos:svelte-icon', category: 'Frameworks' },
  { name: 'Tailwind CSS', icon: 'logos:tailwindcss-icon', category: 'Frameworks' },
  { name: 'TypeScript', icon: 'logos:typescript-icon', category: 'Langages' },
  { name: 'Vite', icon: 'logos:vitejs', category: 'Outils & Cloud' },
  { name: 'Vue.js', icon: 'logos:vue', category: 'Frameworks' },
  { name: 'Webpack', icon: 'logos:webpack', category: 'Outils & Cloud' },
  { name: 'OpenAI', icon: 'logos:openai-icon', category: 'IA' },
  { name: 'Anthropic', icon: 'logos:anthropic-icon', category: 'IA' },
  { name: 'Claude', icon: 'logos:claude-icon', category: 'IA' },
  { name: 'Claude Code', icon: 'logos:claude-code', category: 'IA' },
  { name: 'Google Gemini', icon: 'logos:google-gemini-icon', category: 'IA' },
  { name: 'Mistral AI', icon: 'logos:mistral-ai-icon', category: 'IA' },
  { name: 'Hugging Face', icon: 'logos:hugging-face-icon', category: 'IA' },
  { name: 'GitHub Copilot', icon: 'logos:github-copilot', category: 'IA' },
  { name: 'Cursor', icon: 'logos:cursor-icon', category: 'IA' },
  { name: 'DeepSeek', icon: 'logos:deepseek-icon', category: 'IA' },
  { name: 'LangChain', icon: 'logos:langchain-icon', category: 'IA' },
  { name: 'Ollama', icon: 'logos:ollama', category: 'IA' },
  { name: 'Perplexity', icon: 'logos:perplexity-icon', category: 'IA' },
  { name: 'PyTorch', icon: 'logos:pytorch-icon', category: 'IA' },
  { name: 'TensorFlow', icon: 'logos:tensorflow', category: 'IA' },
  { name: 'ChatGPT', icon: 'logos:openai-icon', category: 'IA' },
  { name: 'GPT-4o', icon: 'logos:openai', category: 'IA' },
  { name: 'GPT-4.1', icon: 'logos:openai-icon', category: 'IA' },
  { name: 'o3', icon: 'logos:openai', category: 'IA' },
  { name: 'o4-mini', icon: 'logos:openai-icon', category: 'IA' },
  { name: 'Claude Sonnet', icon: 'logos:claude-icon', category: 'IA' },
  { name: 'Claude Opus', icon: 'logos:claude', category: 'IA' },
  { name: 'Claude Haiku', icon: 'simple-icons:claude', category: 'IA' },
  { name: 'Gemini Pro', icon: 'logos:google-gemini-icon', category: 'IA' },
  { name: 'Gemini Flash', icon: 'logos:google-gemini', category: 'IA' },
  { name: 'DeepSeek Chat', icon: 'logos:deepseek-icon', category: 'IA' },
  { name: 'DeepSeek Reasoner', icon: 'logos:deepseek', category: 'IA' },
  { name: 'Mistral Large', icon: 'logos:mistral-ai-icon', category: 'IA' },
  { name: 'Codestral', icon: 'logos:mistral-ai', category: 'IA' },
  { name: 'Llama', icon: 'text:LL', category: 'IA' },
  { name: 'Qwen', icon: 'logos:qwen', category: 'IA' },
  { name: 'Qwen Coder', icon: 'logos:qwen-icon', category: 'IA' },
  { name: 'Grok', icon: 'logos:grok-icon', category: 'IA' },
  { name: 'Kimi', icon: 'simple-icons:kimi', category: 'IA' },
  { name: 'Cohere Command', icon: 'logos:cohere-icon', category: 'IA' },
  { name: 'Manus', icon: 'text:MA', category: 'IA' },
  { name: 'Google AI Studio', icon: 'logos:google-aistudio', category: 'IA' },
  { name: 'NotebookLM', icon: 'simple-icons:notebooklm', category: 'IA' },
  { name: 'Midjourney', icon: 'logos:midjourney', category: 'IA' },
  { name: 'Stability AI', icon: 'logos:stability-ai-icon', category: 'IA' },
  { name: 'ElevenLabs', icon: 'logos:elevenlabs-icon', category: 'IA' },
  { name: 'Suno', icon: 'logos:suno', category: 'IA' },
  { name: 'Lovable', icon: 'logos:lovable-icon', category: 'IA' },
  { name: 'Bolt.new', icon: 'logos:bolt-icon', category: 'IA' },
  { name: 'v0', icon: 'logos:v0', category: 'IA' },
  { name: 'Replit AI', icon: 'logos:replit-icon', category: 'IA' },
  { name: 'Windsurf', icon: 'simple-icons:windsurf', category: 'IA' },
  { name: 'Devin', icon: 'logos:devin', category: 'IA' },
  { name: 'OpenRouter', icon: 'logos:openrouter-icon', category: 'IA' },
  { name: 'Groq', icon: 'logos:groq', category: 'IA' },
  { name: 'Together AI', icon: 'logos:togetherai-icon', category: 'IA' },
  { name: 'Replicate', icon: 'simple-icons:replicate', category: 'IA' },
  { name: 'n8n', icon: 'logos:n8n-icon', category: 'IA' },
  { name: 'Dify', icon: 'logos:dify', category: 'IA' },
  { name: 'OpenCode', icon: 'logos:opencode-icon', category: 'IA' },
  { name: 'MiniMax', icon: 'logos:minimax-icon', category: 'IA' },
  { name: 'Moonshot AI', icon: 'logos:moonshot-ai-icon', category: 'IA' },
];

const displayNames: Record<string, string> = {
  'c-plusplus': 'C++', 'c-sharp': 'C#', 'css-3': 'CSS', 'google-gemini': 'Google Gemini',
  'google-gemini-icon': 'Google Gemini', 'hugging-face': 'Hugging Face',
  'hugging-face-icon': 'Hugging Face', 'mistral-ai': 'Mistral AI',
  'mistral-ai-icon': 'Mistral AI', 'nodejs-icon': 'Node.js',
  'postgresql': 'PostgreSQL', 'tailwindcss-icon': 'Tailwind CSS',
  'typescript-icon': 'TypeScript', 'vue': 'Vue.js',
};
const aiNames = new Set([
  'anthropic', 'claude', 'claude-code', 'cursor', 'deepseek', 'github-copilot',
  'google-gemini', 'google-gemini-icon', 'hugging-face', 'hugging-face-icon',
  'langchain', 'mistral-ai', 'mistral-ai-icon', 'ollama', 'openai', 'openai-icon',
  'perplexity', 'pytorch', 'pytorch-icon', 'tensorflow', 'grok', 'grok-icon',
  'qwen', 'qwen-icon', 'cohere', 'cohere-icon', 'google-aistudio', 'notebooklm',
  'midjourney', 'stability-ai', 'stability-ai-icon', 'elevenlabs', 'elevenlabs-icon',
  'suno', 'lovable', 'lovable-icon', 'bolt', 'bolt-icon', 'v0', 'replit',
  'replit-icon', 'windsurf', 'devin', 'openrouter', 'openrouter-icon', 'groq',
  'togetherai', 'togetherai-icon', 'replicate', 'n8n', 'n8n-icon', 'dify',
  'opencode', 'opencode-icon', 'minimax', 'minimax-icon', 'moonshot-ai',
  'moonshot-ai-icon',
]);

let cachedCatalog: {
  expiresAt: number;
  source: 'Iconify' | 'local';
  items: TechnologyCatalogItem[];
  warning?: string;
} | undefined;

function titleFromSlug(slug: string) {
  return displayNames[slug] || slug.split(/[-_]/).map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : '').join(' ');
}

async function loadCollection(prefix: string) {
  const response = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`, {
    signal: AbortSignal.timeout(4500),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Iconify ${prefix} collection returned HTTP ${response.status}`);
  const collection = await response.json() as { prefix?: string; uncategorized?: string[] };
  if (collection.prefix !== prefix || !Array.isArray(collection.uncategorized)) {
    throw new Error(`Iconify returned an unexpected ${prefix} collection`);
  }
  return collection.uncategorized;
}

export async function getTechnologyCatalog() {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return {
      source: cachedCatalog.source,
      items: cachedCatalog.items,
      ...(cachedCatalog.warning ? { warning: cachedCatalog.warning } : {}),
    };
  }

  try {
    const collections = await Promise.all(['logos', 'devicon', 'simple-icons'].map(async (prefix) => {
      try {
        return { prefix, slugs: await loadCollection(prefix), usedFallback: false };
      } catch (error) {
        console.warn(`[Technology catalog] Iconify ${prefix} collection is unavailable; using curated entries.`, error);
        return {
          prefix,
          slugs: featuredCatalog.filter((item) => item.icon.startsWith(`${prefix}:`)).map((item) => item.icon.slice(prefix.length + 1)),
          usedFallback: true,
        };
      }
    }));
    const completeCatalog = collections.flatMap(({ prefix, slugs }) => slugs.map((slug) => {
      const icon = `${prefix}:${slug}`;
      const featured = featuredCatalog.find((item) => item.icon === icon);
      return {
        name: featured?.name || titleFromSlug(slug),
        icon,
        category: featured?.category || (prefix === 'devicon' ? 'Langages & frameworks' : aiNames.has(slug) ? 'IA' : 'Autres technologies'),
      };
    }));
    const byIdentity = new Map<string, TechnologyCatalogItem>();
    for (const item of [...featuredCatalog, ...completeCatalog]) byIdentity.set(`${item.name.toLocaleLowerCase('fr')}:${item.icon}`, item);
    const items = [...byIdentity.values()];
    const hasFallback = collections.some((collection) => collection.usedFallback);
    const source = collections.every((collection) => collection.usedFallback) ? 'local' as const : 'Iconify' as const;
    const warning = hasFallback ? 'Certaines collections Iconify sont indisponibles ; les technologies essentielles restent accessibles.' : undefined;
    cachedCatalog = {
      expiresAt: Date.now() + (hasFallback ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000),
      source,
      items,
      warning,
    };
    return {
      source,
      items,
      ...(warning ? { warning } : {}),
    };
  } catch (error) {
    console.warn('[Technology catalog] Iconify is unavailable; using the curated technology list.', error);
    return {
      source: 'local' as const,
      items: featuredCatalog,
      warning: 'Catalogue Iconify indisponible ; le catalogue local (langages, frameworks, outils et IA) est affiché.',
    };
  }
}
