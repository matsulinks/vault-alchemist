# Vault Alchemist

**📖🧠🖥️ — Turning conversations into assets. Turning knowledge into something you can actually use.**

---

## Why this exists

Information keeps growing.

Every day, you read something, think about something, talk to someone, argue with an AI.
The traces become notes, PDFs, chat logs, web clips.

And then — you can't find them.

Tags multiply and collapse. Notes disappear into folders.
You paste the same context into the AI *again* because you can't retrieve what you already know.
Whatever felt important yesterday is somewhere in the vault, but you're not sure where.

> Data you can't find is data you don't have.

---

## June 2026 Product Update

Vault Alchemist was first designed as an Obsidian plugin.

That direction is now secondary.

The product is moving app-first: a standalone local app that can work with ordinary folders first, then integrate with Obsidian as an optional adapter.

## What Vault Alchemist is

Vault Alchemist is a **knowledge asset engine**.

Think of it as a local AI librarian for your working folders.
It splits overlong books into chapters.
It groups scattered fragments by theme.
It flags what's probably useless, without throwing it away.
It writes a "cover page" for every note — summary, topic, freshness, why you'd read it today.

And **nothing changes without your approval**.

---

## The Promises

Before any technical goal, this project makes promises about *experience*.

### Conversations don't disappear
The chat you had with an AI last Tuesday — the one where you figured something out — is now buried in a file called "ChatGPT export 2026-02-18.md".

Vault Alchemist takes that conversation and rebuilds it as **one note per topic**, with a title that tells you what happened, a summary that tells you what was decided, and metadata that makes it searchable.

Your AI conversations become knowledge. Not archives.

### AI organizes. Humans decide.
Destructive changes — rewriting content, deleting notes, bulk moves — always require your explicit approval.

The AI can work through the night. But it will leave the results on your desk in the morning, not apply them while you sleep.

### Emotional assets are untouchable
Journals. Letters. Emails to people you love.

These are not data to be optimized. They are records of your life.

Vault Alchemist recognizes `note_kind=journal|letter|email` and treats them as protected. It won't merge, split, or rewrite them. Instead, it adds a *cover* — a searchable front-page of who, when, and what — without touching what's inside.

### The same work never happens twice
Every note has a content hash. Every job is logged. If nothing changed, the job is skipped.

If something goes wrong — if you don't like what happened — there's always an Undo button. Prominently placed. Always visible.

---

## The Persona Vision

There is a deeper ambition here.

Vault Alchemist will eventually include a **Persona Public Mode**: the ability to selectively publish parts of your vault, via MCP, so that others can *converse* with your knowledge through AI.

Imagine an entrepreneur publishes their product vision notes.
Investors and builders can ask an AI about that person's thinking — deeply, specifically, not through a polished PR statement but through *actual recorded thought*.

Imagine a politician publishes their policy reasoning.
Citizens can engage with the underlying thinking, not just the soundbite.

Imagine a researcher publishes their lab notes.
Collaborators across the world can query the work directly.

And then — the conversations those people have flow back.
With permission, they become new material in the vault.
**The dialogue itself becomes an asset.**

This requires a clear philosophical line:

> **"Elon Musk" and "AI-Elon (based on Elon's public knowledge)" are different things. We say so, explicitly, always.**

Impersonation risk is real. But we don't aim for perfect prevention — we aim for *clear distinction*. Label the source. Require consent for publication. Log every access.

In the same way hallucination is not "solved" but "mitigated", we design for transparency rather than impossibility.

The ultimate mission of this project is simple:

**To help more people understand each other.**

---

## Design Philosophy

### Safety is the default
The first run is always a dry-run. Nothing is applied until you choose to apply it.
Trust is earned in increments, not assumed from the start.

### Batch the burden
Deletion candidates aren't presented one by one.
They're grouped by reason — duplicates together, stale content together, low-quality extractions together — and you process a group at once. 

Cognitive load is a design problem.

### Language describes experience, not systems
This project does not speak in system terms to users.

| ❌ Don't say | ✅ Say instead |
|---|---|
| "Launching background process" | "Works quietly in the background" |
| "Rebuilding index" | "Updating search" |
| "Error occurred" | "Some items didn't go as planned" |

> Vault Alchemist works quietly in the background, so it never gets in your way. 🌙

### Data flows in one direction by default
Your data stays local. It moves outward only when you explicitly decide it should.

"Local-first" doesn't mean "can never share" — it means **the default is protection, not extraction**.

---

## Why Open Source

This project is MIT-licensed and fully open. The reasons are layered.

**First: community adoption is the strategy.**
The first user must be able to use it without becoming an Obsidian power user. Obsidian remains valuable, but it is no longer required for the first useful version.

**Second: AI-assisted development needs a single codebase.**
The entire project lives in one monorepo. Plugin, backend service, shared types — all together. This isn't just convenient for humans. It's *essential* for AI contributors, who need to see the whole picture to make changes that don't break across boundaries.

**Third: the mission is larger than one person.**
A tool that helps humans understand each other cannot be built alone.

Contributors welcome — human or AI.

---

## Current Status

🚧 **Phase 1 (A-MVP) — In development**

| Phase | Focus | Status |
|---|---|---|
| Phase 0 | Standalone local app shell | 🚧 In progress |
| Phase 1 | Chat splitting · cover generation · rollback UI | 🚧 In progress |
| Phase 2 | Semantic search (embeddings) | ✅ Backend implemented |
| Phase 3 | Tag hierarchy & dictionary | Not started |
| Phase 4 | Knowledge graph (Intent / Insight / Interest) | Not started |
| Phase 5 | xAI exploration mode | Not started |
| Phase 6 | Local LLM support | Not started |
| Phase 7 | Persona Public Mode | Not started |

---

## Getting Started (for contributors)

```bash
git clone https://github.com/matsulinks/vault-alchemist
cd vault-alchemist
npm install
```

Requirements: Node.js 22+

Run the local app:

```bash
npm run start:app
```

Then open `http://127.0.0.1:3000/`.

---

## Documentation

- [Design Spec (spec.md)](docs/spec.md) — Technical spec and design philosophy
- [Task List (tasks.md)](docs/tasks.md) — Implementation plan in 10-minute chunks
- [Product Pivot](docs/product_pivot_2026-06-12.md) — Why the product is moving app-first
- [Decision Log (conversation_log.md)](docs/conversation_log.md) — Public reasoning log for why we made each choice
- [📖 NotebookLM](https://notebooklm.google.com/notebook/3f82472f-8f3a-48f5-b8e3-cf041ebc734e) — Public notebook for exploring the design intent

---

## License

MIT — see [LICENSE](LICENSE)

---

*This README is a specification. It is also a manifesto.*  
*Vault Alchemist is growing from a personal knowledge tool into something that helps people understand each other — and this document grows with it.*

---

## From the creator — to everyone walking this path

To those who build with me.  
To those who use this.  
To whoever stumbled across this README and is still reading.

I'm an ordinary person.

I have desires. Pettiness. Moments of selfishness and cowardice — like anyone does.
I want to live with integrity, and sometimes I drift without noticing.

That's why I built this specification the way I did.

"Never destroy data." "Nothing changes without approval." "Protect emotional records." —  
These aren't just product features. They are **stakes in the ground** — places to return to when I lose my way.

I wrote the philosophy into the design document not just to explain the product,  
but so that my future self — or anyone who works on this later — can remember *why* it was built this way.

So here is what I'm asking:

If you're a contributor, and you see this project drifting from what's written here —  
**please say so.**

If you're a user, and something about this tool feels wrong —  
**please say so.**

No hesitation needed. That kind of honesty is what keeps a project — and a person — healthy.

---

For a future where humanity and AI walk together.  
For a future where people and AI can take care of each other.

This is a small step toward that.
