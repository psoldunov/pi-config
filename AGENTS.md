# Pi Configuration Repository

This repository version-controls the personal Pi configuration normally loaded from `~/.pi/`. It contains configuration, extensions, skills, model definitions, and supporting files; it is not the Pi application source code.

## Working Agreement

- Make durable changes in the current repository workspace, not directly in the live `~/.pi/` checkout.
- External directories such as `~/.claude/` are import sources only. Copy required content into the matching tracked repository path.
- Before finishing, confirm every intended change appears in `git status` and the repository diff.
- Keep changes on the workspace branch for review and merge. Do not manually install the same change into the live configuration unless the user explicitly asks.
- Keep diffs focused. Do not modify generated or machine-local state unless the task specifically requires it.

## Repository Layout

- `agent/settings.json`: Pi defaults, packages, skill paths, and runtime preferences.
- `agent/AGENTS.md`: global behavioral instructions loaded by Pi agents.
- `agent/skills/`: globally available Pi skills. Each skill must include its `SKILL.md` and every referenced script, asset, agent prompt, or reference file.
- `agent/extensions/`: custom Pi extensions and their TypeScript project.
- `agent/models.json`: model and provider configuration.
- `agent/mcp.json`: MCP server configuration.
- `agent/git/`: Pi-managed Git support files.
- `agent/npm/`: Pi-managed package installation support.
- `pi-acp/`: Pi ACP integration data; change it only when explicitly requested.

## Skill Changes

- Keep specialized reviewer or worker prompts under the skill that owns them when Ensemblr will delegate to those agents.
- Follow Pi's Agent Skills format: a skill directory containing `SKILL.md` with valid `name` and `description` frontmatter.
- Preserve the complete dependency tree when importing a skill, including `references/`, `scripts/`, and `assets/`.
- Use relative paths inside skills so imported dependencies remain portable.
- Check for name collisions before adding a skill.
- Pi discovers skills when a session starts, so test newly added skills in a new session after merge.

## Safety and Validation

- Never commit credentials, auth tokens, environment files, private keys, session logs, databases, or other machine-local state.
- Respect `.gitignore`; do not force-add ignored files without explicit approval.
- Treat cache and generated files as disposable, even if an older copy is already tracked.
- Preserve existing configuration unless the requested change requires modifying it.
- Validate edited JSON and TypeScript files with the repository's available tooling.
- For imports, compare the tracked copy with its source and verify that all referenced files exist.
