Partial close after **v1.0.132** on `main` ([PR #1058](https://github.com/TheMarkkBradonCollective/Guardr/pull/1058)).

**Addressed in this pass**
- **Guard card expiry** collected on upload (`certCatalog`); legacy rows without expiry grandfathered in `guardQualification`.
- **`workforceCompliance.ts`** — contractor compliance item tracking helpers; **staff role-separation** guard (actor cannot modify same/higher ladder peers).

**Not addressed** (still needs counsel/product work): AB5/staff classification, W-9/1099, background-check records, server-side role separation, legal re-acceptance, storage migration, discipline/offboarding, etc. — see [#1044](https://github.com/TheMarkkBradonCollective/Guardr/issues/1044) Wave 1–3.

See `docs/DEV-UPDATES.md` — Friday, Sep 26, 2026.
