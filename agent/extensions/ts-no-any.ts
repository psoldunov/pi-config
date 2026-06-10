import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

const TYPESCRIPT_FILE = /\.(?:c|m)?tsx?$/i;

const SYSTEM_INSTRUCTION = `
## TypeScript Policy — No \`any\`

When editing TypeScript files, never write explicit \`any\` types.
Forbidden examples:
- \`: any\` type annotations
- \`as any\` assertions

Use \`unknown\`, a precise interface/type, generics, or narrowed unions instead.
Tool calls that attempt to write these patterns to TypeScript files will be blocked.
`;

type ViolationKind = "colon any" | "as any";

type Violation = {
	kind: ViolationKind;
	line: number;
	column: number;
	excerpt: string;
};

function isTypescriptPath(path: string): boolean {
	return TYPESCRIPT_FILE.test(path);
}

function maskNonCode(text: string): string {
	let out = "";
	let mode: "code" | "lineComment" | "blockComment" | "single" | "double" | "template" = "code";
	let escaped = false;

	for (let index = 0; index < text.length; index++) {
		const char = text[index] ?? "";
		const next = text[index + 1] ?? "";

		if (char === "\n") {
			out += "\n";
			if (mode === "lineComment") mode = "code";
			if (mode !== "blockComment") escaped = false;
			continue;
		}

		if (mode === "lineComment" || mode === "blockComment") {
			if (mode === "blockComment" && char === "*" && next === "/") {
				out += "  ";
				index++;
				mode = "code";
			} else {
				out += " ";
			}
			continue;
		}

		if (mode === "single" || mode === "double" || mode === "template") {
			const quote = mode === "single" ? "'" : mode === "double" ? '"' : "`";
			out += " ";
			if (!escaped && char === quote) mode = "code";
			escaped = !escaped && char === "\\";
			continue;
		}

		if (char === "/" && next === "/") {
			out += "  ";
			index++;
			mode = "lineComment";
			continue;
		}

		if (char === "/" && next === "*") {
			out += "  ";
			index++;
			mode = "blockComment";
			continue;
		}

		if (char === "'") {
			out += " ";
			mode = "single";
			escaped = false;
			continue;
		}

		if (char === '"') {
			out += " ";
			mode = "double";
			escaped = false;
			continue;
		}

		if (char === "`") {
			out += " ";
			mode = "template";
			escaped = false;
			continue;
		}

		out += char;
	}

	return out;
}

function lineColumnAt(text: string, index: number): { line: number; column: number } {
	const before = text.slice(0, index);
	const lines = before.split("\n");
	return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function excerptAt(text: string, line: number): string {
	return (text.split("\n")[line - 1] ?? "").trim();
}

function findViolations(text: string): Violation[] {
	const code = maskNonCode(text);
	const patterns: Array<{ kind: ViolationKind; regex: RegExp }> = [
		{ kind: "colon any", regex: /:\s*any\b/g },
		{ kind: "as any", regex: /\bas\s+any\b/g },
	];
	const violations: Violation[] = [];

	for (const pattern of patterns) {
		for (const match of code.matchAll(pattern.regex)) {
			const index = match.index ?? 0;
			const position = lineColumnAt(text, index);
			violations.push({
				kind: pattern.kind,
				line: position.line,
				column: position.column,
				excerpt: excerptAt(text, position.line),
			});
		}
	}

	return violations.sort((left, right) => left.line - right.line || left.column - right.column);
}

function formatViolations(path: string, violations: Violation[]): string {
	const shown = violations.slice(0, 5).map((violation) => {
		return `${path}:${violation.line}:${violation.column} ${violation.kind} — ${violation.excerpt}`;
	});
	const suffix = violations.length > shown.length ? `\n...and ${violations.length - shown.length} more` : "";
	return `TypeScript explicit any blocked. Use unknown, precise types, or generics instead.\n${shown.join("\n")}${suffix}`;
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", (event) => {
		return {
			systemPrompt: event.systemPrompt + SYSTEM_INSTRUCTION,
		};
	});

	pi.on("tool_call", async (event, ctx) => {
		if (isToolCallEventType("write", event)) {
			const path = event.input.path;
			if (!isTypescriptPath(path)) return undefined;

			const violations = findViolations(event.input.content);
			if (violations.length === 0) return undefined;

			const reason = formatViolations(path, violations);
			if (ctx.hasUI) ctx.ui.notify(reason, "warning");
			return { block: true, reason };
		}

		if (isToolCallEventType("edit", event)) {
			const path = event.input.path;
			if (!isTypescriptPath(path)) return undefined;

			const combinedReplacementText = event.input.edits.map((edit) => edit.newText).join("\n");
			const violations = findViolations(combinedReplacementText);
			if (violations.length === 0) return undefined;

			const reason = formatViolations(path, violations);
			if (ctx.hasUI) ctx.ui.notify(reason, "warning");
			return { block: true, reason };
		}

		return undefined;
	});
}
