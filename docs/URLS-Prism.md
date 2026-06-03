# URL Conventions

Human-friendly, path-first URLs for Prism apps.

**See also**: [NAMING.md](../.cursor/commands/NAMING.md) (identifier naming), [CONVENTIONS-Prism.md](./CONVENTIONS-Prism.md) (code style).

## Philosophy

- **Paths over query args** — Prefer `/addresses/sort/name/ascending` over `?sort=name&dir=asc`. Query strings are for ephemeral or external inputs (search boxes, OAuth callbacks), not for navigation state the user might bookmark or share.
- **Self-documenting** — A URL should read like a sentence: collection, optional page, optional sort, optional resource slug.
- **Defaults are omitted** — Page 1 and the list’s default sort do not appear in the path.
- **Lowercase, kebab-case, dashes only** — No camelCase, underscores, or spaces in path segments.

## Directory lists

Pattern:

```text
/{collection}                                    # page 1, default sort
/{collection}/sort/{column}/{direction}          # page 1, explicit sort
/{collection}/page/{n}                           # page n, default sort
/{collection}/page/{n}/sort/{column}/{direction} # page n + sort
```

Examples:

| URL | Meaning |
| --- | ------- |
| `/addresses` | Addresses, page 1, sorted by address ascending (default) |
| `/addresses/sort/name/ascending` | Addresses, page 1, by name A→Z |
| `/addresses/sort/members/descending` | Addresses, page 1, by member count high→low |
| `/addresses/page/2` | Addresses, page 2, default sort |
| `/addresses/page/2/sort/name/ascending` | Addresses, page 2, by name A→Z |
| `/people/sort/address/descending` | People, page 1, by address Z→A |

### Sort segments

- **Column** — Matches the table column id (`name`, `address`, `members`, `kind`). Same vocabulary as props and types ([NAMING.md](../.cursor/commands/NAMING.md)).
- **Direction** — Full words: `ascending` or `descending` (not `asc` / `desc`).

### Legacy query URLs

Old `?sort=` / `?dir=` links should redirect to the path form (e.g. `/addresses?sort=address&dir=asc` → `/addresses`). Host apps implement this in list route handlers.

## Resource detail

Pattern:

```text
/{collection}/{id}
/{collection}/{id}/{slug}   # optional, cosmetic
```

Examples:

| URL | Meaning |
| --- | ------- |
| `/addresses/8896/1305-105th-ave` | Address #8896 (slug from street line) |
| `/people/42` | Person #42 |

### Slugs after ids

- The **numeric id is canonical** — lookup uses id only; the trailing slug is for humans reading the URL or sharing a link.
- **Wrong or missing slug** — Server redirects to the canonical slug when known (e.g. `/addresses/8896` → `/addresses/8896/1305-105th-ave`).
- **Slug source** — Derived from a stable display field (street line for addresses), lowercased, non-alphanumerics stripped, spaces → dashes.

## General rules

| Rule | Example |
| ---- | ------- |
| Plural collection nouns | `/addresses`, `/people` |
| kebab-case segments | `/admin/app/system` |
| No trailing slash | `/addresses` not `/addresses/` |
| Page segment literal `page` | `/addresses/page/2` |
| Sort segment literal `sort` | `/addresses/sort/name/ascending` |
| RESTful ids in dynamic segments | `[addressId]`, `[personId]` in App Router |

## API routes

HTTP APIs under `/api/` follow REST in [CONVENTIONS-Prism.md](./CONVENTIONS-Prism.md). Same kebab-case and plural nouns; path params for ids. Slugs are a **UI routing** concern, not required on JSON APIs.

## When query params are OK

- **Search / filter text** the user types (`?q=…`).
- **Third-party callbacks** (OAuth `?code=`, `?state=`).
- **Debug or preview flags** that should not be bookmarked.

Prefer promoting repeated navigation state (sort, page, tab, view mode) into paths when it is user-facing and shareable.

## Adding a new list or detail route

1. Pick a plural collection path aligned with the domain noun (`/addresses`, not `/address-list`).
2. Wire sort via `/sort/{column}/{direction}`; build list links with the same path pattern as existing directory routes in the host app.
3. For detail pages, add an optional slug segment if a short label helps (name, title, street).
4. Redirect old query shapes so existing links keep working.
5. Update path bar and page title resolution so new list and detail URL shapes resolve correct breadcrumbs and titles.
