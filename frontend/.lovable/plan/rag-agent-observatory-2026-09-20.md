# RAG Agent Observatory

## Build
- Replace the blank page with a complete desktop-first RAG workspace that adapts cleanly to mobile.
- Add a collapsible conversation sidebar, model controls, source toggle, settings, chat transcript, citations, and a polished composer.
- Add a right-side live agent observatory showing document chunks moving through retrieval, ranking, grounding, and answer generation.
- Include light and dark themes, with balanced contrast and a distinctive coral, cyan, and ink palette.

## Interactions
- Make new chat, history selection, source viewing, citation expansion, settings, theme switching, and sidebar controls functional.
- Simulate streaming answers and stop-generation behavior locally so the interface can be experienced immediately.
- Add a knowledge manager with drag-and-drop upload states, indexing progress, and success notifications.

## Motion
- Use a lightweight 3D vector field for the primary right-side animation, plus restrained interface motion for retrieval pulses, flowing provenance lines, source expansion, and streaming states.
- Respect reduced-motion preferences and provide a visible fallback if 3D rendering is unavailable.

## Technical details
- Compose chat surfaces from installed AI Elements primitives.
- Keep colors, shadows, typography, and motion values in the shared design system.
- Keep the experience demo-only for now; uploaded documents and conversations will not persist after refresh.
- Verify the final layout and animation in both desktop and mobile browser sizes.
