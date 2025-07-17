# Core Concept Renaming Guide

Inspired by the [Daydreams Core Documentation](https://docs.dreams.fun/docs/core/concepts/core), this guide details a thoughtful renaming of core concepts, files, and folders in your codebase. The goal is to make the architecture more intuitive, maintainable, and developer-friendly, while aligning with modern agent framework conventions and a React-like mental model.

---

## Why Rename?

- **Clarity:** Descriptive names help new and existing developers quickly understand the purpose of each module.
- **Domain Alignment:** Names should reflect the agent-oriented, modular, and extensible nature of the framework.
- **Maintainability:** Clean, consistent naming reduces onboarding time and cognitive load.
- **Best Practices:** Align with industry standards and successful frameworks like Daydreams.

---

## The React-like Mental Model

- **Contexts:** Like React components, manage state and rendering for specific agent tasks or interactions.
- **Actions:** Like event handlers, define what the agent can do in response to inputs or state changes.
- **Extensions:** Like component libraries, bundle reusable capabilities.
- **Agent:** Like the React app, orchestrates everything.

---

## Old-to-New Naming Table

| Old Name         | New Name         | Rationale/Notes                                             |
|------------------|------------------|-------------------------------------------------------------|
| `task.ts`        | `plan.ts`        | "Plan" is more intentional and future-oriented.            |
| `TaskRunner`     | `Planner`        | Emphasizes orchestration and strategy.                      |
| `task()`         | `plan()`         | Consistent with the above.                                  |
| `tasks/`         | `plans/`         | Directory for plans/strategies.                             |
| `context.ts`     | `session.ts`     | "Session" is clear for managing stateful interactions.     |
| `context()`      | `session()`      | Consistent with the above.                                  |
| `handlers.ts`    | `processors.ts`  | "Processors" is modern and descriptive.                    |
| `serviceProvider.ts` | `serviceRegistry.ts` | "Registry" is a standard for managing services.      |
| `createServiceManager` | `createServiceRegistry` | Clearer intent.                                 |
| `container.ts`   | `di.ts`          | "DI" (Dependency Injection) is a standard term.            |
| `createContainer`| `createDIContainer`| Consistent with DI pattern.                               |
| `axiom.ts`       | `agent.ts`       | "Agent" is domain-appropriate for orchestrators.           |
| `createAxiom`    | `createAgent`    | Consistent with the above.                                  |
| `prompts/`       | `templates/`     | "Templates" is flexible and descriptive.                   |
| `memory/`        | `store/`         | "Store" is concise for memory/data storage.                |
| `logs/`          | `logging/`       | "Logging" is the standard for log-related code.            |
| `utils.ts`       | `helpers.ts`     | "Helpers" is modern and descriptive.                       |
| `utils/`         | `helpers/`       | Consistent with the above.                                  |
| `types/`         | `schemas/`       | "Schemas" is clear for type/data definitions.              |
| `tracking/`      | `monitoring/`    | "Monitoring" is descriptive for tracking/analytics.        |

---

## Best Practices for Renaming

1. **Update All References:**
   - Use IDE refactoring tools to update imports and references across the codebase.
   - Search for both file and symbol names.

2. **Update Documentation:**
   - Revise all READMEs, guides, and code comments to reflect new names.
   - Provide a migration table (like above) for quick reference.

3. **Communicate Changes:**
   - Announce the changes to your team or community.
   - Explain the rationale and expected benefits.

4. **Deprecation Strategy:**
   - Optionally, keep old names as aliases (with warnings) for a transition period.
   - Remove deprecated names in a future major release.

5. **Test Thoroughly:**
   - Run all tests after renaming to catch any missed references.
   - Encourage developers to report any confusion or issues.

---

## Example: Applying the New Mental Model

- **Contexts → Sessions:**
  - Old: `const myContext = context({...})`
  - New: `const mySession = session({...})`

- **Tasks → Plans:**
  - Old: `const myTask = task({...})`
  - New: `const myPlan = plan({...})`

- **Handlers → Processors:**
  - Old: `import { handleAction } from './handlers'`
  - New: `import { processAction } from './processors'`

- **Axiom → Agent:**
  - Old: `const agent = createAxiom(config)`
  - New: `const agent = createAgent(config)`

---

## References
- [Daydreams Core Concepts Documentation](https://docs.dreams.fun/docs/core/concepts/core)
- [React Component Model](https://react.dev/learn/your-first-component)

---

## Summary

Renaming core concepts to be more descriptive and domain-aligned will make your codebase easier to understand, maintain, and extend. By following this guide, you ensure a smooth transition and a cleaner, more modern developer experience. 