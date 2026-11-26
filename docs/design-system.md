# Oakie design system

Direction: **paper, ink and one seal.** Oakie is a project wall and, at the end
of a project, a credits list. So the interface is white paper and black ink,
and it owns exactly one colour: the vermilion of a seal, kept for what Oakie
has checked or what is waiting for you. Every other colour on a screen is
something a person uploaded.

- **Character**: direct, credible, made by hand.
- **Moments**: the pictures people upload, and the contribution record, which
  is laid out like the document it stands in for.
- **Signature**: the seal (`搭`, from 搭搭岛) stamped on a verified record, and
  its colour wherever something is verified or unread.

All tokens are defined in `frontend/src/index.css`. Components use the semantic
Tailwind utilities below and never raw hex values.

## Colour

| Token                              | Light                 | Dark                  | Use                                                    |
| ---------------------------------- | --------------------- | --------------------- | ------------------------------------------------------ |
| `paper`                            | `#FAFAFA`             | `#141415`             | Page background                                        |
| `surface`                          | `#FFFFFF`             | `#19191B`             | Cards, inputs, dialogs, the top bar                    |
| `sunken`                           | `#F2F2F2`             | `#232325`             | Wells, hover, the selected nav item                    |
| `ink`                              | `#171717`             | `#EDEDED`             | Text                                                   |
| `ink-soft`                         | `#5C5C5C`             | `#A1A1A6`             | Secondary text                                         |
| `ink-mute`                         | `#6E6E6E`             | `#85858B`             | Meta only: times, counts, captions                     |
| `line` / `line-strong`             | `#E6E6E6` / `#CDCDCD` | `#2A2A2D` / `#3D3D41` | Hairlines / borders of inputs and outline buttons      |
| `primary` / `on-primary`           | ink / white           | off-white / `#141415` | The primary action, progress, focus ring               |
| `primary-soft` / `on-primary-soft` | `#E9E9E9` / ink       | `#2E2E31` / ink       | What the viewer has chosen (applied filters, own role) |
| `accent` / `on-accent`             | `#C8371B` / white     | `#F2684A` / `#1A0D09` | The seal: verified, unread, needs your answer          |
| `positive`                         | `#16A34A`             | `#4CC38A`             | The "Recruiting" dot, nothing else                     |
| `danger` / `danger-soft`           | `#B4233C` / `#FBEAED` | `#FF8FA3` / `#3A1820` | Errors, destructive actions                            |

- The primary button is ink, not a colour. The accent is never a button.
- The accent covers a few percent of a screen at most. If a screen has no
  unread item and nothing verified, it has no accent, and that is correct.
- No tinted page backgrounds, no per-discipline colours, no coloured initials,
  no pastel icon tiles. A discipline is a word.
- The `block-*` colours survive for one thing: the flat band a member may pick
  for the top of their own profile. It is their content, so nothing else uses them.
- Colour never carries meaning alone: a status is a dot and a word, an unread
  item a dot plus medium weight and a screen-reader label.

## Type

- **Titles**: Newsreader (500), a serif. Page and section headings (`h1`,
  `h2`) and the title of a post (`font-serif` on a project card, an update, a
  record). It makes a project read as something a person wrote.
- **Interface**: Instrument Sans (400 and 500). Body, buttons, labels, small
  headings inside panels (`font-sans` on an `h2` there).
- The serif is never used for buttons, labels, chips or anything under 20px.
- Two weights. Hierarchy comes from size and from `ink` / `ink-soft` /
  `ink-mute`, not from bold. No uppercase labels, no letter-spaced labels.
- Record codes are monospace. Numbers that line up use `tabular-nums`.
- Both families are self-hosted through `@fontsource-variable`; Chinese falls
  back to the system's Songti (titles) and PingFang / YaHei (interface).
- Scale: landing headline 40–60px, page title 30–36px, project page title up
  to 44px, section 22px, card title 22px, body 16px, secondary 14–15px, meta 13px.

## Shape, space, motion

- Radius: cards 14px (`rounded-card`), buttons and fields 10px
  (`rounded-field`), chips 6px (`rounded-chip`), inner wells 8px. Only avatars,
  dots, count badges and progress tracks are round.
- Surfaces are separated by a 1px hairline (`border-line`). Only things that
  float (menus, dialogs, the search palette, toasts) carry `shadow-float`.
- Hover is a surface or border step. Nothing lifts, scales or moves on hover.
  Press scales a button to 0.98.
- Motion tokens: `animate-rise` (a list enters once, staggered by `.stagger`,
  six items at most), `animate-pop` (dialogs, menus, toasts), 150ms colour
  transitions, one easing curve (`ease-out-soft`). Width and height are never
  animated. `prefers-reduced-motion` disables all of it.
- Layout: one 72rem column, 16px gutters on phones and 24px from `sm`; pages
  start at the left edge of that column, never centred in it. A short list
  (applications, followed projects) sits in a side column instead of taking a
  full row. Empty and error states are left-aligned text in a plain box.

## Copy

- A title names the page or the thing ("Home", "Notifications", the project's
  name). No greetings, no slogans, no exclamation marks.
- The landing headline says what Oakie does; its picture is live data (the
  seats open right now), not artwork.

## Pictures are content, never decoration

A project shows a picture only when its team uploaded one: a screenshot, a
photo, a sketch. There is no generated cover and no placeholder. A picture that
every project gets says nothing about any of them, and a feed of them reads as
one project repeated. A project without a picture is a text post, and its card
quotes more of the text instead.

The same holds for people: a profile banner is the member's own picture, or
failing that a flat band in the colour they chose, or nothing. An avatar is a
photo or plain initials. There is no generated artwork anywhere, including the
sign-in page.

## Interaction rules

- Touch targets are at least 44px; small buttons extend their hit area invisibly.
- Every icon-only control has an `aria-label`; decorative icons are `aria-hidden`.
- Focus is always visible: a 2px ink outline with a 2px offset.
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
- **Colour is quiet.** Status is a dot and a word (`StatusDot`); only
  "Recruiting" is green, the rest differ by shape. Chips are neutral;
  `primary-soft` is reserved for what the viewer has chosen. On a project the
  only colour comes from its own picture and its people's photos.
- **Roles are words, not tags.** "Looking for" is one inset block: role names
  in bold, each kept on one line, with the open-seat count beside the label.
  On the project page the same roles are rows with their skills and an Apply
  button.
- **A person, a time and a place on every card.** The owner's avatar and name,
  how long ago it was posted, and the city (or "Remote").
- **No credential on a card.** A project's and a person's place is a city. A
  school, company or club is an optional "Community": one fact on the project
  page or profile and a filter, never a headline, and never required. The
  check mark (`VerifiedMark`, in the seal colour) confirms that one community
  claim by email, so it sits beside the community's name and nowhere near the
  person's.
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
