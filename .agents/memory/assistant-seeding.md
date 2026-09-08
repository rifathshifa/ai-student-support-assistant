---
name: Assistant demo seeding
description: The seeded student workspace must initialize once before concurrent dashboard and conversation requests read it.
---

The demo seed is intentionally single-flight: multiple first-load screens request profile, documents, and history at the same time, so initialization must share one promise rather than independently checking and inserting.

**Why:** Concurrent first requests previously raced on the unique student profile and could briefly turn a healthy initial load into a 500 response.

**How to apply:** Preserve the shared initialization guard whenever adding new seeded assistant data or changing first-load API behavior.