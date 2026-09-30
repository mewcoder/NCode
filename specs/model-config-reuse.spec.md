# Model configuration reuse picker

## Goal

Let users explicitly select a reusable model configuration while adding a model, including built-in template defaults, without crowding the model editor.

## Owner and flow

- `ProviderSettingsView` provides configured model sources across Providers and resolves built-in template model defaults using the existing built-in model rules.
- The existing provider model draft hook owns the destination model draft.
- The search dialog owns only its temporary query and selection. The existing add-model save flow remains the persistence boundary.
- The Provider facade owns model-rule resolution; the UI consumes resolved model configuration and never reads provider catalog files directly.

## Interaction

- Add and edit model drafts both use manual configuration without automatic matching by Model ID. When editing an existing model that follows recommendations, opening the editor snapshots its current effective parameters into the temporary manual draft; only saving converts the persisted model to manual configuration. Canceling leaves the saved model unchanged.
- Show the “Reuse config” button beside the Model ID label when adding or editing. Resetting an add-model form clears its parameter draft while preserving the entered Model ID and manual mode; it must not trigger ID-based resolution. Explicitly restoring an edited model applies the current recommended parameters as a one-time manual snapshot and does not re-enable automatic following.
- Open a separate dialog titled “Reuse model configuration” with models from non-personal Providers and built-in template models; exclude user-created personal Providers. Search by model ID only, while each row keeps a unique command identity even when visible model IDs repeat. Each row uses two compact lines: Model ID and one Provider (append “and others” when there are more; hover the Provider name to see all eligible sources), then context/output size tags in K or M using the model-list context badge style, followed by supported input type tags (Image, Video, Audio, PDF) using the model-list capability badge style. If more input types exist, show a compact `+N` tag in the same capability badge style.
- Inset each option evenly from the list edges and separate adjacent rows with a small vertical gap. Show selection through the row surface and border, without a trailing check mark.
- Combine sources only when both the model ID and parameter configuration match. This avoids duplicate rows while keeping each selectable row tied to the model ID that will be filled into the draft.
- Keep built-in Coding Plan templates available as parameter references even without an owned Plan. Actual configured Plan Providers remain subject to entitlement/usability checks; ordinary template models such as GPT also remain searchable before their Provider is instantiated.
- Keep only Confirm and Cancel in the dialog footer; confirmation applies the selected source.
- Applying copies editable model parameters into the open draft and switches that draft to manual configuration. For a new model, fill Model ID from the first displayed source; for an edited model, preserve its current Model ID. In both cases, the current Provider continues to own its connection details.
- Canceling the search dialog leaves the model draft unchanged. If no source is applied, the user enters the model parameters manually; add and edit drafts do not run ID-based automatic matching.
- Existing models already saved in recommended mode are not migrated just by opening or canceling the editor. Saving an edit stores a manual snapshot, keeping the effective configuration shown at edit time.

## Invariants

- GPT model reasoning options follow the Codex model catalog per model: omit unsupported values such as `none` and keep the local maximum within the source-supported levels.
- The current GPT catalog whitelist is GPT-5.5, GPT-5.6, and GPT-6. OpenCode Zen/Go lists are refreshed from their own model endpoints; provider route compatibility is checked separately.
- Only model parameters represented by the existing editor/manual model-config schema are copied; Provider credentials and endpoints are not.
- Built-in template defaults are resolved from the same Provider and model rules used by the existing recommendation path; template configuration contributes its API type and base URL to rule matching.
- Configured account-based Coding Plan models require an available entitled account state, and configured API-key Coding Plan Providers must be enabled and executable. Built-in Plan templates only contribute model parameters and do not imply ownership or transfer credentials.
- Template models are an additive Host view field; if an older running Host omits it, the UI skips those template sources and keeps the settings view usable.
- Applying a source does not save anything. The existing add-model commit is still required.
- The Provider Settings contract may expose additional read-only resolved model defaults; no persisted configuration format change is required.

## Catalog refresh

- GPT model IDs and Codex-specific parameter metadata come from `openai/codex` `codex-rs/models-manager/models.json`; use `supported_in_api`, `visibility`, context window, input modalities, and supported reasoning levels instead of substituting OpenAI API metadata.
- OpenCode Zen and Go availability comes from their `/zen/v1/models` and `/zen/go/v1/models` endpoints. Use OpenCode's endpoint documentation to place each model under the compatible local API protocol. `models.dev` supplements capabilities and token limits; it does not replace the plan endpoint's available-model list.
- The built-in JSON catalog is a versioned static snapshot. Updating it does not add a runtime model-catalog request.

## Validation

- Run typecheck, lint on changed files, architecture checks, and whitespace checks.
- Do not add a test suite for this bounded UI change.
