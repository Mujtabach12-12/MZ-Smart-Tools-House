# First implementation group — Developer formatters

Selected because the permanent priority order starts with broken functionality, and these are local/browser tools with no backend dependency.

## Selected tools

- `html-formatter`
- `css-formatter`
- `javascript-formatter`

All three currently route through `UtilityTool -> CodeTool` and share the same regex formatter:

```js
input
  .replace(/>\s*</g, ">\n<")
  .replace(/;\s*/g, ";\n")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .join("\n  ");
```

## Confirmed correctness defects

### JavaScript

Input:

```js
const s = "a;b"; console.log(s);
```

The current formatter inserts a raw newline after the semicolon inside the string literal. The resulting JavaScript cannot be parsed by `new Function(...)`.

### CSS

Input:

```css
.x::before{content:"a;b";color:red;}
```

The current formatter inserts a raw newline inside the quoted `content` value. This is not a safe syntax-aware formatting transformation.

### HTML

Input:

```html
<span>a;b</span>
```

The same generic semicolon replacement modifies text-node whitespace/content even though semicolons in HTML text are not formatting delimiters.

## Current classification

All three are **D — Broken/Incomplete** because a formatter must not corrupt valid input.

## Required benchmark gate

Before implementation, the project standard requires current-web research for each exact task. The required research should compare multiple established/current formatters and record:

- input/editor workflow
- format action and live/manual behavior
- indentation/options
- parse/error feedback
- copy/download/reset flow
- desktop/mobile editor behavior
- handling of invalid syntax
- whether formatting is parser/AST based or delegated to a mature formatter

No tool implementation should be changed until that current-web benchmark step can actually be performed.
