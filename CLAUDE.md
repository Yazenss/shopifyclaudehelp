# FUNKE Brand Rules

## Colors
- Cream: #F5F0E8
- Charcoal: #1C1C1E
- Gold: #C9A84C

## Typography
- Headings: Bebas Neue
- Body: Inter

## Design rules (non-negotiable)
- Image overlays: charcoal (#1C1C1E) only, opacity between 15-25%. Never white/light overlays. Never higher than 25% opacity - the photo underneath must stay visible and punchy, not washed out.
- No hard-edged solid color boxes over photos. Text sits on a dark gradient (transparent to charcoal) fading from the bottom or side of the image, never inside a flat rectangle.
- Gold (#C9A84C) is an accent only - used for small text, dividers, or single-word emphasis. Never large fills or backgrounds.
- Every section must expose its styling as theme editor settings (schema), not hardcoded values. This includes: overlay color, overlay opacity, text position, image. If a setting isn't exposed, add it - the merchant needs to be able to adjust it without more code.

## Workflow rules
- This is the LIVE, published theme (shopifyclaudehelp/main). Changes go live immediately once pushed.
- Before making changes: run shopify theme dev and show me the result in Chrome before committing.
- One section at a time. Do not touch multiple sections in a single request.
- Run shopify theme check before every commit. Fix all errors before committing.
- Never write placeholder/boilerplate copy. If no copy is given, ask me instead of using theme defaults.
- Commit after each section is confirmed working. Clear commit messages describing what changed.
