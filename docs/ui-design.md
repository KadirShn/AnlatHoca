# Mobile visual language

The mobile app extends the existing theme in `apps/mobile/src/theme`: forest-green
headings and primary actions, warm paper backgrounds, white reading surfaces,
and restrained yellow highlights. Do not introduce a second token system.

- Home has one main entry action for PDF lessons; exam preparation is secondary.
- Use `PageIntro` for a clear title and description, not another nested card.
- Use the existing text, button, card, radius and spacing tokens. The accent
  button is for the single highlighted action on a dark hero, not every action.
- Reading containers are capped at 780 logical pixels on wide displays.
  Content remains scrollable and text scaling stays enabled.
- Keep saved-content metadata honest: no fabricated streaks, scores or progress.

## Loading and motion

`OwlLoader` is the shared indeterminate loading indicator. Both sizes draw a logo-inspired owl with native views. Its pupils circle gently
and its eyes blink. Reanimated animates only transforms, without a JavaScript timer.

- Use the large variant for initial screen loads and document analysis.
- Use the compact variant in buttons and inline requests. While busy, replace visible loading copy with the animated owl. Keep the label
  available to assistive technology, disable repeated submission, and preserve
  failure/retry UI. Invisible button labels reserve layout space to prevent jumps.
- A loader does not imply completion percentage, successful analysis or a
  specific internal AI stage. Do not add fake progress or artificial delays.
- Reduced-motion settings disable animation. Animation also stops while the app
  is backgrounded; subscriptions are removed on unmount.
- Mark loaders inside an already-labelled control as decorative; otherwise
  provide a meaningful progressbar label. Expose status through accessibility labels and polite live regions, not visible loading text.

No new UI dependency, backend behavior, AI call, cloud resource or asset-generation
service is required by this visual refresh.

## Verification checklist

Run mobile typecheck and lint. Review Home, Library, upload, document analysis,
lesson creation and empty/error/loading states at narrow widths and larger text
sizes. Check reduced motion, long filenames, keyboard and safe-area behavior on
native devices before a release; a successful bundle alone is not visual QA.
