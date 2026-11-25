# Oakie design system

Direction: **Vibrant & Block-based**, chosen with the UI/UX Pro Max skill for a
youth-focused, creator-led community product. Flat colour blocks, generous radii,
large geometric type, no drop shadows. The palette is grounded in the Oakie
wordmark (charcoal ink, a leaf, a wave) rather than the generic "creator pink"
the skill's product match suggested.

All tokens are defined in `frontend/src/index.css`. Components use the semantic
Tailwind utilities below and never raw hex values.

## Colour

| Token                              | Light                 | Dark                  | Use                                                  |
| ---------------------------------- | --------------------- | --------------------- | ---------------------------------------------------- |
| `paper`                            | `#F6F5EF`             | `#0F1512`             | Page background                                      |
| `surface`                          | `#FFFFFF`             | `#18201C`             | Cards, inputs, dialogs                               |
| `sunken`                           | `#ECEAE0`             | `#222C27`             | Wells, board columns, hover                          |
| `ink`                              | `#17201C`             | `#EEF2EE`             | Text, strong borders                                 |
| `ink-soft`                         | `#55615A`             | `#A6B1AB`             | Secondary text (at least 4.5:1 on paper and surface) |
| `line`                             | `#D9D7CA`             | `#303C36`             | Borders, dividers                                    |
| `primary` / `on-primary`           | `#0E6B55` / white     | `#4FD1A5` / `#06231A` | Primary actions, links, focus ring                   |
| `primary-soft` / `on-primary-soft` | `#D9EEE5` / `#0A4A3B` | `#16372D` / `#A8ECD3` | Skill and role chips, selected states                |
| `accent` / `on-accent`             | `#FF7A52` / ink       | `#FF8F6B` / ink       | Unread badges, highlights, one CTA per view          |
| `danger` / `danger-soft`           | `#B93319` / `#FBE3DC` | `#FF8D76` / `#45201A` | Errors, destructive actions                          |

### Block colours

Each discipline owns one block colour (`frontend/src/lib/categories.ts`). It is how
a card or cover says "finance" or "film" before a word is read. Blocks always carry
`block-ink` text, in both themes.

Software → sky · AI & Data → lilac · Finance & Quant → mint · Media & Content →
coral · Design & Art → pink · Events & Community → sun · Research → aqua ·
Startup → orange · Social Impact → leaf · anything else → sand.

Colour never carries meaning alone: status badges pair it with an icon and a
label, unread items with a dot plus bold text and a screen-reader label.

## Type

- **Display**: Outfit (600). Headings, buttons, labels. Tight tracking, balanced wrapping.
- **Body**: Work Sans (400–600). 16px base, 1.5 line height.
- Both are self-hosted through `@fontsource-variable`, so there is no third-party font request.
- Scale: hero 48–72px, page title 36–48px, section 24px, card title 20px, body 16px,
  secondary 14–15px, never below 11px for badges and 12px for text.

## Shape, space, motion

- Radius: cards 20px (`rounded-card`), fields 12px (`rounded-field`), buttons and chips fully round.
- No shadows. Elevation is expressed with a colour step (`paper` → `surface`) or a 2px border.
- Hover on cards: lift 4px and gain an ink border. Press: scale to 0.97.
- Motion tokens: `animate-rise` (lists enter, staggered by `.stagger`), `animate-pop`
  (dialogs, menus, toasts), 150–200ms colour transitions.
  `prefers-reduced-motion` disables all of it.
- Layout: one 72rem column, 16px gutters on phones and 24px from `sm`; grids go 1 → 2 → 3 columns.

## Signature: generated covers

`ProjectCover` composes a deterministic geometric cover from a project's id, in
its discipline's colour, whenever no image is uploaded. Every project (and profile
banner) has a recognisable face without anyone having to design one.

## Interaction rules

- Touch targets are at least 44px; small buttons extend their hit area invisibly.
- Every icon-only control has an `aria-label`; decorative icons are `aria-hidden`.
- Focus is always visible: a 3px primary outline with a 2px offset.
- Forms: visible labels, validation on blur, errors beneath the field tied by
  `aria-describedby`, and a focusable error summary on a failed submit.
- Navigation: top bar on desktop; five-item bottom tab bar on phones. Tabs and filters are URLs.
- Empty, loading and error states are designed for every list: skeletons that hold
  the layout, an explanation plus a next step, and a retry.
- Dragging on the task board is a shortcut; the card menu offers the same moves from the keyboard.
- Light and dark themes are both first-class; the choice is stored and applied before first paint.
