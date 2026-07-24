# AI Design

The planner interface isolates goal decomposition from payment authority.
`ScriptedDemoPlanner` is deterministic and labelled. `GeminiPlanner` uses the
official `@google/genai` SDK, a constrained JSON schema, low temperature,
12-second timeout and Zod parsing.

Only the goal, budget and public provider summaries are model inputs. Secrets,
keys, wallet credentials and merchant credentials are excluded. Deterministic
code reselects eligible providers and recomputes all totals after the model
responds.
