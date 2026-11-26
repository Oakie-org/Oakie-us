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

## Pictures are content, never decoration

A project shows a picture only when its team uploaded one: a screenshot, a
photo, a sketch. There is no generated cover and no placeholder. A picture that
every project gets says nothing about any of them, and a feed of them reads as
one project repeated. A project without a picture is a text post, and its card
quotes more of the text instead.

The same holds for people: a profile banner is the member's own picture, or
failing that a flat band in the accent colour they chose, or nothing. The only
generated artwork left is the illustration on the sign-in page (`ProjectCover`),
which decorates the product, not anyone's content.

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

## Information first

Lists exist to be scanned. A visitor should learn what a project is, who it
needs and whether there is a seat without reading a paragraph or decoding a colour.

- **A card is a preview of a post**, not a form with every slot filled. It is
  as tall as what it has to say: nothing is padded or reserved to make cards
  match, and lists are laid out as a masonry feed (`ProjectFeed`), 1 → 2 → 3
  columns. Columns are balanced from an estimate of each card's height, so
  loading more never reshuffles what is already on screen.
- **Card order**: picture (only if uploaded) → status, discipline and age →
  title → one-liner → opening paragraph (longer when there is no picture) →
  "Looking for" → who posted it and where.
- **Colour is quiet.** Status is a dot and a word (`StatusDot`). Chips are
  neutral; `primary-soft` is reserved for what the viewer has chosen. On a
  project the only colour comes from its own picture and its people's avatars.
- **Roles are words, not tags.** "Looking for" is one inset block: role names
  in bold, each kept on one line, with the open-seat count beside the label.
  On the project page the same roles are rows with their skills and an Apply
  button.
- **A person, a time and a place on every card.** The owner's avatar and name,
  how long ago it was posted, and the city (or "Remote").
- **No credential on a card.** A project's and a person's place is a city. A
  school, company or club is an optional "Community": one fact on the project
  page or profile and a filter, never a headline, and never required. The
  check mark (`VerifiedMark`) confirms that one community claim by email, so it
  sits beside the community's name and nowhere near the person's.
- **People are a grid, projects are a feed.** People are comparable (who, what
  they do, what they are open to), so their cards share a row height. A person
  card reads name and city → headline → skills as words → "Open to", the same
  inset "ask" block a project uses for "Looking for".
- The project page reads as the post in full: byline, the picture at full
  size, the text, the roles, and a team panel that draws one avatar per member
  and one dashed outline per open seat.

## Patterns

- **Search**: the top-bar field opens a palette (`⌘K`, `Ctrl+K` or `/`) with
  grouped suggestions after two characters, debounced 200ms; Enter runs the full
  search. Explore's own field filters the list in place, debounced 250ms.
- **Filters** apply instantly and live in the URL. Options come from
  `/projects/facets` with counts; applied filters are listed as removable chips
  with "Clear all". While results reload, the old list dims instead of emptying.
- **Preview**: clicking a project in a list opens a drawer (`?preview=<id>`), so
  Back closes it and scroll position is kept; modified clicks and "Full page" go
  to the project's own URL.
- **Creating a project** is five short steps with a live card preview, a
  "Step N of 5" count, autosave to `localStorage` and smart defaults from the
  profile. Only the name and the description are required; optional steps can be
  skipped. Publishing lands on the project with three next steps (invite, post, share).
- **A new member** is asked three things on three short screens (`/welcome`):
  what they are open to, what they can do, and a face, a line and a city.
  Answers are taps wherever a tap can say it; each screen is saved as it is
  left and can be skipped; a live card shows how teams will see them; the last
  screen is the projects their answers lead to. Sign-up itself asks only for a
  name, an email and a password.
- **Things are edited where they are read.** There is no settings form and no
  edit page. On their own profile a member, and on their project its owner and
  admins, see a pencil on each part and a dashed prompt where an empty part
  would go; each opens a small sheet with only that part's fields and saves on
  its own. The open sheet is in the URL (`?edit=<part>`), so Back closes it and
  a nudge can link straight to it. A sheet holding unsaved changes ignores a
  stray click outside it. Visitors never see an empty part. Creating is the
  one place a multi-step flow is used; changing something later never repeats it.
- **A profile photo** is picked, framed in a circle and saved in one sheet; it
  does not wait for another Save button.
- **Ask when the answer pays off.** A profile question is asked where its
  answer is used: skills are asked again in the application form if they are
  still empty, and the team reading that application sees the applicant's
  skills against the ones its roles named. A field nothing reads is not asked.
- **Choices over typing.** What members will be compared on (open to,
  availability, skills) comes from fixed lists; free text is for what is
  theirs alone (name, headline, bio).
- **Profiles** carry a strength meter that names the single next step, and can be
  shared as a link or embedded as a card (`/embed/u/<id>`).
