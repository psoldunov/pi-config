import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Markdown, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import type { MarkdownTheme } from "@earendil-works/pi-tui";

interface CodeToken {
	type: string;
	text?: string;
	lang?: string;
}

interface MarkdownInstance {
	theme: MarkdownTheme;
}

type RenderToken = (
	this: MarkdownInstance,
	token: CodeToken,
	width: number,
	nextTokenType?: string,
) => string[];

interface PatchableMarkdownPrototype {
	renderToken: RenderToken;
	__piPrettierCodePatchV1?: boolean;
	__piPrettierCodePatchV2?: boolean;
	__piPrettierCodeOriginalRenderTokenV1?: RenderToken;
	__piPrettierCodeOriginalRenderTokenV2?: RenderToken;
}

function padToWidth(text: string, width: number): string {
	const padding = Math.max(0, width - visibleWidth(text));
	return text + " ".repeat(padding);
}

function makeBorder(theme: MarkdownTheme, left: string, label: string, right: string, width: number): string {
	const safeLabel = truncateToWidth(label, Math.max(0, width - 6));
	const base = `${left}─${safeLabel ? ` ${safeLabel} ` : "─"}`;
	const fill = "─".repeat(Math.max(0, width - visibleWidth(base) - visibleWidth(right)));
	return theme.codeBlockBorder(`${base}${fill}${right}`);
}

const syntaxColors = {
	syntaxComment: "\x1b[38;5;244m",
	syntaxKeyword: "\x1b[38;5;75m",
	syntaxFunction: "\x1b[1;38;5;221m",
	syntaxVariable: "\x1b[38;5;81m",
	syntaxString: "\x1b[38;5;114m",
	syntaxNumber: "\x1b[38;5;176m",
	syntaxOperator: "\x1b[38;5;250m",
} as const;

type SyntaxColor = keyof typeof syntaxColors;

function color(colorName: SyntaxColor, text: string): string {
	if (text.length === 0) return text;
	const close = colorName === "syntaxFunction" ? "\x1b[22;39m" : "\x1b[39m";
	return `${syntaxColors[colorName]}${text}${close}`;
}

function isShellLanguage(lang: string): boolean {
	return ["bash", "sh", "shell", "zsh", "fish"].includes(lang.toLowerCase());
}

function findShellCommentStart(line: string): number {
	let quote: "'" | '"' | undefined;
	let escaped = false;
	for (let index = 0; index < line.length; index++) {
		const char = line[index];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === "\\" && quote !== "'") {
			escaped = true;
			continue;
		}
		if (quote) {
			if (char === quote) quote = undefined;
			continue;
		}
		if (char === "'" || char === '"') {
			quote = char;
			continue;
		}
		if (char === "#" && (index === 0 || /\s/.test(line[index - 1] ?? ""))) return index;
	}
	return -1;
}

function highlightShellRemainder(text: string): string {
	const tokenPattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\$\{[^}]+\}|\$[A-Za-z_][\w]*|\$\d+)|(\b\d+(?:\.\d+)?\b)|(--?[A-Za-z0-9][\w-]*)|((?:~|\.|\.\.|\/)?(?:[\w.-]+\/)+[\w./-]*|~\/[^\s]+)|([|&;<>()[\]{}=])/g;
	let output = "";
	let lastIndex = 0;
	for (const match of text.matchAll(tokenPattern)) {
		const start = match.index ?? 0;
		output += text.slice(lastIndex, start);
		const token = match[0];
		if (match[1]) output += color("syntaxString", token);
		else if (match[2]) output += color("syntaxVariable", token);
		else if (match[3]) output += color("syntaxNumber", token);
		else if (match[4]) output += color("syntaxKeyword", token);
		else if (match[5]) output += color("syntaxVariable", token);
		else output += color("syntaxOperator", token);
		lastIndex = start + token.length;
	}
	return output + text.slice(lastIndex);
}

function highlightShellLine(line: string): string {
	const commentStart = findShellCommentStart(line);
	const body = commentStart >= 0 ? line.slice(0, commentStart) : line;
	const comment = commentStart >= 0 ? line.slice(commentStart) : "";
	const match = /^(\s*)(\S+)(.*)$/.exec(body);
	if (!match) return comment ? color("syntaxComment", comment) : line;

	const [, leading = "", command = "", rest = ""] = match;
	const styledCommand = /^(if|then|else|elif|fi|for|while|do|done|case|esac|function|export|local|return|exit|cd|sudo)$/.test(command)
		? color("syntaxKeyword", command)
		: color("syntaxFunction", command);
	const styledComment = comment ? color("syntaxComment", comment) : "";
	return `${leading}${styledCommand}${highlightShellRemainder(rest)}${styledComment}`;
}

function getHighlightedLines(theme: MarkdownTheme, text: string, lang: string): string[] {
	if (isShellLanguage(lang)) {
		return text.split("\n").map(highlightShellLine);
	}
	if (theme.highlightCode) {
		return theme.highlightCode(text, lang);
	}
	return text.split("\n").map((line) => theme.codeBlock(line));
}

function renderCodeBlock(theme: MarkdownTheme, token: CodeToken, width: number, nextTokenType?: string): string[] {
	if (width < 12) {
		const lang = token.lang ?? "";
		const text = token.text ?? "";
		return [theme.codeBlockBorder(`\`\`\`${lang}`), ...text.split("\n").map((line) => theme.codeBlock(line)), theme.codeBlockBorder("```")];
	}

	const lang = (token.lang ?? "").trim();
	const innerWidth = Math.max(1, width - 4);
	const indent = theme.codeBlockIndent ?? "  ";
	const highlightedLines = getHighlightedLines(theme, token.text ?? "", lang);

	const lines: string[] = [makeBorder(theme, "╭", lang || "code", "╮", width)];
	for (const highlightedLine of highlightedLines.length > 0 ? highlightedLines : [""]) {
		const wrapped = wrapTextWithAnsi(`${indent}${highlightedLine}`, innerWidth);
		for (const content of wrapped.length > 0 ? wrapped : [""]) {
			lines.push(`${theme.codeBlockBorder("│")} ${padToWidth(content, innerWidth)} ${theme.codeBlockBorder("│")}`);
		}
	}
	lines.push(makeBorder(theme, "╰", "", "╯", width));

	if (nextTokenType && nextTokenType !== "space") {
		lines.push("");
	}

	return lines;
}

function patchMarkdownCodeBlocks(): boolean {
	const prototype = Markdown.prototype as unknown as PatchableMarkdownPrototype;
	const wasAlreadyPatched = prototype.__piPrettierCodePatchV2 === true;
	const original = prototype.__piPrettierCodeOriginalRenderTokenV2
		?? prototype.__piPrettierCodeOriginalRenderTokenV1
		?? prototype.renderToken;

	prototype.__piPrettierCodeOriginalRenderTokenV2 = original;
	prototype.renderToken = function renderToken(token: CodeToken, width: number, nextTokenType?: string): string[] {
		if (token.type === "code") {
			return renderCodeBlock(this.theme, token, width, nextTokenType);
		}
		return original.call(this, token, width, nextTokenType);
	};
	prototype.__piPrettierCodePatchV2 = true;
	return !wasAlreadyPatched;
}

export default function (pi: ExtensionAPI) {
	const patched = patchMarkdownCodeBlocks();

	pi.on("session_start", (_event, ctx) => {
		if (patched && ctx.hasUI) {
			ctx.ui.notify("Prettier markdown code blocks enabled", "info");
		}
	});
}
