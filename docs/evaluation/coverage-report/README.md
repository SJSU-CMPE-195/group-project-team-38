---
summary: "Implementation 3 coverage artifact index for the MediTag backend"
read_when:
  - Reviewing evaluation deliverables for Implementation 3
  - Looking for the committed HTML or JSON coverage report
  - Updating README coverage links or milestone evidence
title: "Implementation 3 Coverage Report"
---

# Coverage Report

This directory stores the committed backend coverage snapshot for Implementation 3.

Primary files:

- `backend/index.html` - browsable HTML coverage report
- `backend/coverage-summary.json` - machine-readable summary
- `backend-summary.md` - milestone-friendly summary and interpretation

Refresh it with:

```sh
bun run coverage:backend
```
