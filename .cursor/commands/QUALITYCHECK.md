Run "npm run quality" which typechecks, lints and formats.

## Philosophy

**Code quality is not optional.** Fix errors iteratively until all checks pass. Typecheck and lint may require manual fixes; format auto-fixes formatting.

## Process

1. Run `npm run quality`
2. Review errors (typecheck and lint may need manual fixes)
3. Fix errors and re-run
4. Repeat until all checks pass
5. Goal: Commitable, deployable state

**Reference**: See [docs/COMMIT-Prism.md](../docs/COMMIT-Prism.md) for commit message style.
