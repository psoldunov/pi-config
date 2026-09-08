import assert from "node:assert/strict";
import test from "node:test";

import autoUpdateExtensions, {
	updateExtensionsAtStartup,
} from "../auto-update-extensions.ts";

test("updates extension packages once per process startup", async () => {
	const commands: Array<{ command: string; args: string[] }> = [];
	const env: NodeJS.ProcessEnv = {};
	const run = async (command: string, args: string[]) => {
		commands.push({ command, args });
		return { code: 0, stdout: "Updated packages", stderr: "" };
	};

	const first = await updateExtensionsAtStartup({ env, run });
	const second = await updateExtensionsAtStartup({ env, run });

	assert.deepEqual(first, { status: "updated" });
	assert.deepEqual(second, { status: "skipped" });
	assert.deepEqual(commands, [
		{ command: "pi", args: ["update", "--extensions"] },
	]);
});

test("does not update while Pi is offline", async () => {
	let commandRan = false;
	const result = await updateExtensionsAtStartup({
		env: { PI_OFFLINE: "true" },
		run: async () => {
			commandRan = true;
			return { code: 0, stdout: "", stderr: "" };
		},
	});

	assert.deepEqual(result, { status: "skipped" });
	assert.equal(commandRan, false);
});

test("reports an update command failure without throwing", async () => {
	const result = await updateExtensionsAtStartup({
		env: {},
		run: async () => ({ code: 1, stdout: "", stderr: "registry unavailable\n" }),
	});

	assert.deepEqual(result, { status: "failed", reason: "registry unavailable" });
});

test("reports a missing updater command without blocking startup", async () => {
	const result = await updateExtensionsAtStartup({
		env: {},
		run: async () => {
			throw new Error("pi command not found");
		},
	});

	assert.deepEqual(result, { status: "failed", reason: "pi command not found" });
});

test("warns after startup when updating fails", async () => {
	type FakeContext = {
		hasUI: boolean;
		ui: { notify: (message: string, level: "warning") => void };
	};
	type FakeHandler = (event: unknown, context: FakeContext) => void;

	const handlers: FakeHandler[] = [];
	const notifications: string[] = [];
	const previousMarker = process.env.PI_EXTENSIONS_AUTO_UPDATE_COMPLETE;
	delete process.env.PI_EXTENSIONS_AUTO_UPDATE_COMPLETE;

	try {
		const pi = {
			exec: async () => ({ code: 1, stdout: "", stderr: "registry unavailable" }),
			on: (event: string, handler: FakeHandler) => {
				if (event === "session_start") handlers.push(handler);
			},
		} as unknown as Parameters<typeof autoUpdateExtensions>[0];

		await autoUpdateExtensions(pi);
		handlers[0]?.(
			{ type: "session_start", reason: "startup" },
			{
				hasUI: true,
				ui: { notify: (message) => notifications.push(message) },
			},
		);

		assert.deepEqual(notifications, [
			"Extension auto-update failed: registry unavailable",
		]);
	} finally {
		if (previousMarker === undefined) {
			delete process.env.PI_EXTENSIONS_AUTO_UPDATE_COMPLETE;
		} else {
			process.env.PI_EXTENSIONS_AUTO_UPDATE_COMPLETE = previousMarker;
		}
	}
});
