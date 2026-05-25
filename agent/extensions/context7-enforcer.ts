import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type ResolveDetails = { libraryId?: string; result?: SearchResult; error?: string };
type DocsDetails = { libraryId?: string; cached?: boolean; bytes?: number; error?: string };
type CachedDetails = { libraryId?: string; match?: "exact" | "prefix" | "none"; cacheKey?: string };

const ResolveParams = Type.Object({
  libraryName: Type.String({ description: "Library name to search for (e.g., 'react')." }),
  query: Type.String({
    description: "User question or task context — used for relevance ranking.",
  }),
});

const DocsParams = Type.Object({
  libraryId: Type.String({
    description: "Context7 library ID, e.g., '/facebook/react' or '/vercel/next.js'.",
  }),
  query: Type.String({
    description: "Question or task — used to rank doc snippets.",
  }),
  tokens: Type.Optional(
    Type.Number({
      description: `Approximate token budget for the response.`,
    }),
  ),
});

const CachedParams = Type.Object({
  libraryId: Type.String({ description: "Context7 library ID." }),
  query: Type.Optional(
    Type.String({ description: "Optional original query used when caching." }),
  ),
  tokens: Type.Optional(
    Type.Number({ description: "Optional token budget used when caching." }),
  ),
});

const CONTEXT7_API_KEY = process.env.CONTEXT7_API_KEY;
const CONTEXT7_BASE_URL = "https://context7.com/api";
const DEFAULT_DOC_TOKENS = 5000;

const docCache = new Map<string, string>();

interface SearchResult {
  id: string;
  title?: string;
  description?: string;
  trustScore?: number;
  totalSnippets?: number;
}

interface SearchResponse {
  results: SearchResult[];
  searchFilterApplied?: boolean;
}

function authHeaders(): Record<string, string> {
  return CONTEXT7_API_KEY ? { Authorization: `Bearer ${CONTEXT7_API_KEY}` } : {};
}

async function resolveLibraryId(libraryName: string, query: string): Promise<SearchResult | null> {
  const url = new URL(`${CONTEXT7_BASE_URL}/v2/libs/search`);
  url.searchParams.set("libraryName", libraryName);
  url.searchParams.set("query", query);

  const response = await fetch(url.toString(), { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as SearchResponse;
  return data.results?.[0] ?? null;
}

async function fetchLibraryDocs(libraryId: string, query: string, tokens: number): Promise<string> {
  const url = new URL(`${CONTEXT7_BASE_URL}/v2/context`);
  url.searchParams.set("libraryId", libraryId);
  url.searchParams.set("query", query);
  url.searchParams.set("type", "txt");
  url.searchParams.set("tokens", String(tokens));

  const response = await fetch(url.toString(), { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Docs fetch failed: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

export default async function (pi: ExtensionAPI) {
  if (!CONTEXT7_API_KEY) {
    console.error("[Context7] CONTEXT7_API_KEY not set. Anonymous tier rate limits apply.");
  }

  pi.registerTool<typeof ResolveParams, ResolveDetails>({
    name: "context7_resolve_library_id",
    label: "Context7: Resolve Library ID",
    description:
      "Resolve a human-readable library name (e.g., 'react', 'next.js') to a Context7 library ID (e.g., '/facebook/react') via the v2/libs/search endpoint. Both libraryName and query are required by the API.",
    parameters: ResolveParams,
    async execute(_toolCallId, params) {
      try {
        const top = await resolveLibraryId(params.libraryName, params.query);
        if (!top) {
          return {
            content: [{ type: "text", text: `No library matched '${params.libraryName}'.` }],
            details: {},
          };
        }
        const summary = `${top.id}${top.title ? ` — ${top.title}` : ""}${
          top.description ? `\n${top.description}` : ""
        }`;
        return {
          content: [{ type: "text", text: summary }],
          details: { libraryId: top.id, result: top },
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error resolving library ID: ${msg}` }],
          details: { error: msg },
        };
      }
    },
  });

  pi.registerTool<typeof DocsParams, DocsDetails>({
    name: "context7_get_library_docs",
    label: "Context7: Get Library Docs",
    description:
      "Fetch fresh documentation for a Context7 library ID via v2/context. Returns plain-text docs relevant to the query. Caches the result by libraryId+query for the session.",
    parameters: DocsParams,
    async execute(_toolCallId, params) {
      try {
        const tokens = params.tokens ?? DEFAULT_DOC_TOKENS;
        const cacheKey = `${params.libraryId}::${params.query}::${tokens}`;
        const cached = docCache.get(cacheKey);
        if (cached) {
          return {
            content: [{ type: "text", text: cached }],
            details: { libraryId: params.libraryId, cached: true },
          };
        }

        const content = await fetchLibraryDocs(params.libraryId, params.query, tokens);
        if (!content || content.trim().length === 0) {
          return {
            content: [{ type: "text", text: "No documentation returned." }],
            details: { libraryId: params.libraryId, cached: false },
          };
        }

        docCache.set(cacheKey, content);
        return {
          content: [{ type: "text", text: content }],
          details: { libraryId: params.libraryId, cached: false, bytes: content.length },
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching docs: ${msg}` }],
          details: { error: msg },
        };
      }
    },
  });

  pi.registerTool<typeof CachedParams, CachedDetails>({
    name: "context7_get_cached_doc_raw",
    label: "Context7: Get Cached Doc Raw",
    description:
      "Return previously fetched documentation from the in-memory session cache without hitting the network. Match by libraryId; if a query is provided, match the exact cache key.",
    parameters: CachedParams,
    async execute(_toolCallId, params) {
      const tokens = params.tokens ?? DEFAULT_DOC_TOKENS;
      if (params.query) {
        const exact = docCache.get(`${params.libraryId}::${params.query}::${tokens}`);
        if (exact) {
          return {
            content: [{ type: "text", text: exact }],
            details: { libraryId: params.libraryId, match: "exact" },
          };
        }
      }

      const prefix = `${params.libraryId}::`;
      const entries = [...docCache.entries()].filter(([k]) => k.startsWith(prefix));
      if (entries.length === 0) {
        return {
          content: [
            { type: "text", text: `No cached documentation found for '${params.libraryId}'.` },
          ],
          details: { libraryId: params.libraryId, match: "none" },
        };
      }

      const [key, content] = entries[0];
      return {
        content: [{ type: "text", text: content }],
        details: { libraryId: params.libraryId, match: "prefix", cacheKey: key },
      };
    },
  });

  const DEFAULT_LIBS: Record<string, string> = {
    prisma: "prisma",
    tailwind: "tailwindcss",
    clerk: "clerk",
    zod: "zod",
    typebox: "typebox",
    react: "react",
    nextjs: "next.js",
    "next.js": "next.js",
  };

  // Allow user override via env: "slug:search-name,slug2:search-name2" or "slug,slug2".
  const COMMON_LIBS: Record<string, string> = (() => {
    const envList = process.env.CONTEXT7_AUTO_LIBS;
    if (!envList) return DEFAULT_LIBS;
    const out: Record<string, string> = {};
    for (const entry of envList.split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const [slug, searchName] = trimmed.split(":").map((s) => s.trim());
      if (slug) out[slug.toLowerCase()] = (searchName || slug).toLowerCase();
    }
    return Object.keys(out).length > 0 ? out : DEFAULT_LIBS;
  })();

  function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  pi.on("before_agent_start", async (event) => {
    const promptText = event.prompt ?? "";
    if (!promptText) return;

    const detected = Object.keys(COMMON_LIBS).filter((lib) => {
      const pattern = new RegExp(`(^|[^a-z0-9_])${escapeRegex(lib)}([^a-z0-9_]|$)`, "i");
      return pattern.test(promptText);
    });
    if (detected.length === 0) return;

    const injectedParts: string[] = [];

    for (const lib of detected) {
      try {
        const searchName = COMMON_LIBS[lib];
        const top = await resolveLibraryId(searchName, searchName);
        if (!top?.id) continue;

        // Stable per-library "overview" cache key — reusable across turns.
        const overviewQuery = searchName;
        const cacheKey = `${top.id}::${overviewQuery}::${DEFAULT_DOC_TOKENS}`;
        let content = docCache.get(cacheKey);
        if (!content) {
          content = await fetchLibraryDocs(top.id, overviewQuery, DEFAULT_DOC_TOKENS);
          if (content) docCache.set(cacheKey, content);
        }
        if (content) {
          injectedParts.push(`\n[Context7 Docs: ${lib} (${top.id})]\n${content}\n`);
        }
      } catch (err) {
        console.error(`[Context7 Enforcer] ${lib}:`, err);
      }
    }

    if (injectedParts.length === 0) return;

    const injectedContext = injectedParts.join("\n");
    const libsList = detected.join(", ");

    return {
      message: {
        customType: "context7_docs",
        content: injectedContext,
        display: false,
      },
      systemPrompt:
        event.systemPrompt +
        `\n\n[Context7] Fresh documentation injected for: ${libsList}. ` +
        `Treat this as the primary source of truth for these libraries. ` +
        `Do NOT rely on training-data recall when Context7 docs contradict it.`,
    };
  });
}
