# Research / Design

Before new implementation (subject to host access and privacy rules):

- Search GitHub first (`gh search repos`, `gh search code`) for implementations, templates, and proven skeletons; use web research for prior art and check package registries before writing utilities. Never send private code or secrets as search queries.
- Prefer a battle-tested library or adapting a solution covering ≥80% of the need over hand-rolling. Evaluate skeletons for security, extensibility, fit, and implementation effort; clone the best fit when choosing a new foundation. Use parallel evaluation only when host delegation rules permit.
- Data access: use a consistent repository interface (`findAll`, `findById`, `create`, `update`, `delete`) with storage details in implementations and business logic depending on the abstraction.
- API responses: consistent success/status, data (nullable on error), error (nullable on success), and pagination metadata (`total`, `page`, `limit`). TS shapes may use optional data/error/meta fields.
