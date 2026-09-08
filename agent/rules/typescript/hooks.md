# TypeScript/JavaScript: Hooks

This section applies only to `*.ts`, `*.tsx`, `*.js`, and `*.jsx` files and extends [Common: Hooks System](../common/hooks.md).

## PostToolUse Hooks

Configure equivalent Pi extensions or active-host hooks for:

- **Prettier**: Auto-format JS/TS files after edit
- **TypeScript check**: Run `tsc` after editing `.ts`/`.tsx` files
- **console.log warning**: Warn about `console.log` in edited files

## Stop Hooks

- **console.log audit**: Check all modified files for `console.log` before session ends
