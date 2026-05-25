import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("code", {
		description: "Open a file or directory in VS Code",
		handler: async (args, ctx) => {
			// If no arguments are provided, use current working directory
			const path = Array.isArray(args) && args.length > 0 ? args[0] : ".";

			try {
				// We try to execute 'code' command.
				// Note: 'code' must be in the PATH where pi is running.
				await pi.exec("code", [path]);
				ctx.ui.notify(`Opened ${path} in VS Code`, "info");
			} catch (error) {
				ctx.ui.notify(`Failed to open VS Code: ${error}`, "error");
			}
		},
	});
}
