# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Repository for the UZH course "The Effects of AI on Individuals and Society" (HCIAI8, HS26, instructor Daniel M. Russell). It holds the final team project. The final presentation is in December 2026.

Status: the repository is new and empty. Topic, stack, structure, and tooling are not decided yet.

## Working rules

- Do not assume a tech stack. Once the first code lands, record the stack plus the setup, run, and test commands in this file.
- This repository is public. Never commit secrets, API keys, `.env` files, personal data, or course material that is not ours to publish (readings, slides, restricted datasets).
- Add a `.gitignore` before the first code commit (virtual environments, `node_modules`, `.env`, OS and editor files, large data files).
- Keep changes small and focused. One concern per commit.
- Prefer simple, readable solutions. This is course work with a deadline, not a product.
- State assumptions and open questions instead of guessing silently.

## Git

- Default branch: `main`.
- Use short-lived feature branches and pull requests when more than one person works on the same area.
- Commit messages in the imperative, e.g. "Add survey data loader".
- Never force-push to `main`.

## Writing style

- Code, comments, commit messages, and documentation in English.
- Concise and precise. No filler.
- No em-dashes. Use periods, commas, or colons.

## Keep this file current

Update this file when any of these is decided or changes:

- Project topic and research question
- Tech stack and versions
- Setup, run, and test commands
- Directory layout
- Deadlines and deliverables
