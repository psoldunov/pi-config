# Security

- Validate all user inputs; parameterize SQL; sanitize rendered HTML; enable CSRF protection; verify authentication AND authorization; rate-limit all endpoints. Errors/logs must not leak sensitive data.
- Never hardcode secrets; use environment variables or a secret manager, validate required values at startup.
- If a security issue is found: stop affected work, use available security-review guidance, fix CRITICAL issues before continuing, and inspect the codebase for similar issues. Rotate exposed secrets through an authorized mechanism; if unavailable, report the required rotation without revealing the secret. Do not pretend removing a secret revokes it.
