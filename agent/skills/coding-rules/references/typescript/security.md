# TypeScript/JavaScript: Security

This section applies only to `*.ts`, `*.tsx`, `*.js`, and `*.jsx` files and extends [Common: Security Guidelines](../common/security.md).

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## Agent Support

- Use a **security-reviewer** agent, skill, or closest available workflow for comprehensive security audits
