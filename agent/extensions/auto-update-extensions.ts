import type {
	ExtensionAPI,
	ExtensionContext,
	SessionStartEvent,
} from "@earendil-works/pi-coding-agent";

const UPDATE_COMPLETE_ENV = "PI_EXTENSIONS_AUTO_UPDATE_COMPLETE";

type CommandResult = {
	code: number;
	stdout: string;
	stderr: string;
};

type UpdateOptions = {
	env: NodeJS.ProcessEnv;
	run: (command: string, args: string[]) => Promise<CommandResult>;
};

type UpdateOutcome =
	| { status: "updated" }
	| { status: "skipped" }
	| { status: "failed"; reason: string };

function isEnabled(value: string | undefined): boolean {
	return (
		value === "1" ||
		value?.toLowerCase() === "true" ||
		value?.toLowerCase() === "yes"
	);
}

export async function updateExtensionsAtStartup({
	env,
	run,
}: UpdateOptions): Promise<UpdateOutcome> {
	if (isEnabled(env.PI_OFFLINE) || env[UPDATE_COMPLETE_ENV] === "1") {
		return { status: "skipped" };
	}

	env[UPDATE_COMPLETE_ENV] = "1";

	try {
		const result = await run("pi", ["update", "--extensions"]);
		if (result.code !== 0) {
			return {
				status: "failed",
				reason:
					result.stderr.trim() ||
					`pi update --extensions exited with code ${result.code}`,
			};
		}

		return { status: "updated" };
	} catch (error) {
		return {
			status: "failed",
			reason: error instanceof Error ? error.message : String(error),
		};
	}
}

export default async function (pi: ExtensionAPI) {
	const outcome = await updateExtensionsAtStartup({
		env: process.env,
		run: (command, args) => pi.exec(command, args),
	});

	if (outcome.status === "failed") {
		pi.on("session_start", (_event: SessionStartEvent, ctx: ExtensionContext) => {
			if (ctx.hasUI) {
				ctx.ui.notify(`Extension auto-update failed: ${outcome.reason}`, "warning");
			}
		});
	}
}
