# Vavist Three.js Lab Design System

## 1. Atmosphere & Identity

Vavist feels like a quiet WebGL workbench: dark, technical, readable, and built for developers who want to inspect a scene before adding polish. The signature is measured depth: a charcoal canvas, warm paper text, teal instrumentation, amber workflow cues, and subtle grid texture that makes the page feel like a 3D lab rather than a generic SaaS page.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | --bg | #10100e | #10100e | Page background |
| Surface/secondary | --bg-2 | #171612 | #171612 | Background gradient stop |
| Surface/card | --surface | #1e1c17 | #1e1c17 | Cards and panels |
| Surface/elevated | --surface-2 | #28241d | #28241d | Elevated controls |
| Text/primary | --text | #f7f0e5 | #f7f0e5 | Headings and body |
| Text/paper | --paper | #f4efe4 | #f4efe4 | Strong text on dark surfaces |
| Text/secondary | --paper-muted | #cfc5b4 | #cfc5b4 | Lead copy |
| Text/muted | --muted | #b9ad9b | #b9ad9b | Captions and secondary links |
| Border/default | --line | #403a30 | #403a30 | Structural borders |
| Border/subtle | --line-soft | rgb(244 239 228 / 0.14) | rgb(244 239 228 / 0.14) | Soft dividers |
| Accent/primary | --accent | #65d8c2 | #65d8c2 | Primary CTAs, focus, instrumentation |
| Accent/strong | --accent-strong | #9df3df | #9df3df | Hover links and emphasis |
| Accent/warm | --accent-warm | #f1ae63 | #f1ae63 | Workflow labels and secondary highlights |
| Shadow/default | --shadow | 0 28px 90px rgb(0 0 0 / 0.38) | 0 28px 90px rgb(0 0 0 / 0.38) | Elevated cards |

### Rules

- Teal is reserved for primary action, focus, metrics, and WebGL instrumentation.
- Amber is used for workflow labels, metadata, and "next step" cues.
- New colors must be added here before they appear in CSS.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | clamp(4rem, 12vw, 9.2rem) | 840 | 1.03 | 0 | Homepage hero |
| H1 | clamp(3.1rem, 8vw, 6.3rem) | 840 | 1.03 | 0 | Page title |
| H2/large | clamp(2.2rem, 5.6vw, 5.4rem) | 820 | 1.03 | 0 | Section title |
| H2/article | clamp(1.8rem, 4vw, 3.2rem) | 820 | 1.03 | 0 | Article section |
| Body/lead | clamp(1.08rem, 2vw, 1.38rem) | 400 | 1.58 | 0 | Hero and page lead |
| Body | 1rem | 400 | 1.58 | 0 | Default copy |
| Body/sm | 0.92rem | 680 | 1.5 | 0 | Navigation and metadata |
| Caption | 0.76rem | 760 | 1.4 | 0 | Card metadata |

### Font Stack

- Primary: "Geist", "Aptos", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif
- Mono: "Cascadia Mono", "SFMono-Regular", Consolas, monospace

### Rules

- Letter spacing stays at 0 for this project.
- Use tabular figures for metrics and scores.
- Body copy should stay under 76 characters where possible.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a base of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| --space-1 | 4px | Tight inline gaps |
| --space-2 | 8px | Compact control gaps |
| --space-3 | 12px | Button groups and grid gaps |
| --space-4 | 16px | Standard text/card padding |
| --space-5 | 20px | Compact card padding |
| --space-6 | 24px | Header gaps and section controls |
| --space-8 | 32px | Action groups |
| --space-10 | 40px | Page group spacing |
| --space-12 | 48px | Article body separation |
| --space-16 | 64px | Section rhythm |
| --space-20 | 80px | Hero/header offset |
| --space-24 | 96px | Large page sections |

### Grid

- Max content width: 1480px for landing sections, 1160px for article shells.
- Card grids use CSS Grid with 12px gutters.
- Breakpoints: 920px for single-column layout, 540px for compact mobile, 370px for stacked actions.

### Rules

- Cards and controls use 8px radius.
- Page sections are full-width bands; cards are reserved for repeated items, tools, and article panels.
- Fixed-format elements should have stable dimensions so text, hover, or dynamic scores do not shift layout.

## 5. Components

### Button

- **Structure**: anchor or button with `.button`, plus `.primary` or `.secondary`.
- **Variants**: primary teal fill, secondary translucent surface.
- **Spacing**: min-height 48px, horizontal padding 18px, gap from surrounding controls 12px.
- **States**: default, hover, active, focus-visible.
- **Accessibility**: visible focus state, semantic anchor for navigation, semantic button for actions.
- **Motion**: 180ms transform/background/border transition; active moves down 1px.

### Navigation Bar

- **Structure**: sticky header, brand link, menu button, nav link group.
- **Variants**: desktop inline links, mobile collapsible menu.
- **Spacing**: 68px minimum height, 14px horizontal padding, 4px link gap.
- **States**: hover/focus background shift, active translate.
- **Accessibility**: labeled nav, menu button with aria-expanded.
- **Motion**: 180ms link state transitions.

### Launch Card

- **Structure**: anchor with label, title, and description.
- **Variants**: large first-row cards and smaller second-row cards.
- **Spacing**: 22px padding, 12px grid gap.
- **States**: hover/focus raises 3px and shifts border to teal.
- **Accessibility**: entire card is one descriptive link.
- **Motion**: 260ms transform/background/border transition.

### Guide Card

- **Structure**: anchor with metadata, title, and summary.
- **Variants**: landing grid, index grid, related guides.
- **Spacing**: 20px padding, 12px internal title spacing.
- **States**: same as Launch Card.
- **Accessibility**: readable text link, no nested interactive elements.
- **Motion**: 260ms transform/background/border transition.

### Article Next Step

- **Structure**: callout section with label, heading, short copy, and one or two CTAs.
- **Variants**: external lab tool, local checklist fallback.
- **Spacing**: 20px to 28px padding, 12px action gaps.
- **States**: buttons inherit Button states.
- **Accessibility**: appears inside article flow with heading.
- **Motion**: no decorative motion; CTA state changes only.

### Health Check Panel

- **Structure**: sticky score panel, meter, copy button, grouped checkbox form.
- **Variants**: desktop sticky aside, mobile static block.
- **Spacing**: 22px panel padding, 14px group grid gap.
- **States**: checkbox checked, copy success text, score/meter updates.
- **Accessibility**: aria-live result panel, fieldset/legend groups.
- **Motion**: 220ms meter width transition.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 180ms | ease | Buttons and nav states |
| Card | 260ms | cubic-bezier(0.32, 0.72, 0, 1) | Launch and guide cards |
| Reveal | 720ms | cubic-bezier(0.32, 0.72, 0, 1) | Scroll reveal |
| Meter | 220ms | ease | Health score meter |

### Rules

- Animate transform, opacity, background, color, and border-color only.
- Respect prefers-reduced-motion.
- The WebGL hero may move, but content and controls must remain stable.

## 7. Depth & Surface

### Strategy

Mixed: tonal dark surfaces, subtle borders, tinted shadows, and transparent gradients.

| Level | Value | Usage |
|-------|-------|-------|
| Subtle border | 1px solid var(--line-soft) | Cards, nav, fieldsets |
| Elevated shadow | var(--shadow) | Launch cards, guide cards, panels |
| Glass surface | rgb(30 28 23 / 0.74) + blur | Sticky navigation |
| Texture | fixed grid and hatch background | Global atmosphere |

Surfaces should feel instrumented and tactile, not glossy for its own sake. Do not add decorative orbs, bokeh blobs, or unrelated gradients.
