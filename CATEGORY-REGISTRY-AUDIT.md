# MZ Smart Tool House — Category Registry Audit

## Source of truth

- `src/data/tools.js` is the single source of truth for tool definitions and each tool's `category` slug.
- `src/data/categories.js` is the central category registry and route metadata.
- Category pages, homepage category cards, category rail, All Tools filters and counts derive from the registry helpers rather than hardcoded numbers.

## Root cause

`Utility Tools` existed in `src/data/categories.js`, but no registered tool had `category: "utility-tools"`. The category UI correctly counted the registry, so it displayed `0` because the underlying registry really contained zero assignments.

## Taxonomy correction

The project uses one category per tool, so tools were not duplicated. Six general-purpose calculators were moved from the mixed `calculators` category into `utility-tools`:

- Percentage Calculator
- Age Calculator
- Discount Calculator
- Average Calculator
- Ratio Calculator
- Time Calculator

This leaves the `calculators` category focused on the student/university calculation workflow without removing any tool.

## Counts

Before:

- Total registered/active tools: 215
- Utility Tools: 0
- Calculators: 12

After:

- Total registered/active tools: 215
- Utility Tools: 6
- Calculators: 6

All other category counts remain unchanged and reconcile exactly with the registry.

| Category | Count |
|---|---:|
| Utility Tools | 6 |
| Student Hub | 6 |
| Health & Fitness | 11 |
| Nutrition | 10 |
| Unit Converters | 13 |
| Date & Time | 12 |
| Daily Life | 8 |
| Finance | 11 |
| Scanner Tools | 1 |
| Calculators | 6 |
| PDF Tools | 23 |
| Image Tools | 20 |
| Text Tools | 25 |
| Developer Tools | 26 |
| Student Document Tools | 20 |
| University Tools | 9 |
| Productivity Tools | 8 |
| **Total** | **215** |

## Dynamic count implementation

`src/data/tools.js` now provides:

- `getActiveToolsByCategory(categorySlug)`
- `getCategoryCounts()`

Category displays use the active registry, so a future status change automatically updates counts and category contents together.

## Verification

- Category registry audit: PASS
- Tool registry audit: PASS
- Functional tool audit: PASS
- Calculator tests: 54 passed
- Total active tools: 215
- Category count sum: 215
- Utility category count equals Utility category page contents: PASS
- No duplicate tool assignment was introduced
- No tool was removed

A full Vite production build could not be executed in this environment because dependency installation timed out; therefore build success is not claimed here.
