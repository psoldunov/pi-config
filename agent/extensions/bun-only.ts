/**
 * Bun-Only Extension
 *
 * 1. Injects a "Bun-Only" instruction into the system prompt so the agent
 *    knows to use bun/bunx by default.
 * 2. Intercepts any remaining npm/pnpm/yarn bash commands and rewrites them
 *    to bun silently.
 *
 * This enforces a consistent package manager across all projects.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";

const BUN_INSTRUCTION = `
## Package Manager Policy — Bun Only

**Always use \`bun\` and \`bunx\` instead of npm, pnpm, or yarn.**

- \`npm install\` → \`bun install\`
- \`npm run <script>\` → \`bun run <script>\`
- \`npx <cmd>\` → \`bunx <cmd>\`
- \`pnpm <cmd>\` → \`bun <cmd>\`
- \`yarn <cmd>\` → \`bun <cmd>\`

When the user types npm/pnpm/yarn/npx, interpret it as the bun equivalent.
Never suggest using npm, pnpm, yarn, or npx unless explicitly requested.
`;

export default function (pi: ExtensionAPI) {
	// Inject bun-only instruction into the system prompt
	pi.on("before_agent_start", (_, ctx) => {
		const existing = ctx.getSystemPrompt();
		return {
			systemPrompt: existing + BUN_INSTRUCTION,
		};
	});

	// Also intercept any remaining bash commands that slip through
	pi.on("tool_call", async (event, ctx) => {
		if (!isToolCallEventType("bash", event)) return undefined;

		const command = event.input.command as string;

		const npmPatterns = [/\bnpm\b/, /\bpnpm\b/, /\byarn\b/];
		const isNpmOrPnpmOrYarn = npmPatterns.some((pattern) =>
			pattern.test(command),
		);

		if (isNpmOrPnpmOrYarn) {
			event.input.command = command
				.replace(/\bnpm\b/g, "bun")
				.replace(/\bpnpm\b/g, "bun")
				.replace(/\byarn\b/g, "bun")
				.replace(/\bnpx\b/g, "bunx");

			ctx.ui.notify(
				"Package manager auto-converted: npm/pnpm/yarn → bun",
				"info",
			);
		}

		return undefined;
	});
}
