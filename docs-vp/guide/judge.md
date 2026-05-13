---
title: judge
description: Use sigmap judge to score groundedness of an AI answer against the context file it used, with optional opt-in learning.
---
# judge

`sigmap judge` tells you whether an answer appears to be supported by the context you actually supplied.

```bash
sigmap judge --response response.txt --context .context/query-context.md
sigmap judge --response response.txt --context .context/query-context.md --json
sigmap judge --response response.txt --context .context/query-context.md --learn
```

## What it reports

- **Groundedness** — overlap score between the answer and the source context
- **Support level** — high / medium / low based on groundedness ratio
- **Unsupported symbols** — tokens and claims that look weakly supported

This is a traceability check, not a truth oracle. It helps answer: *"Did this response come from the code I provided, or did the model drift?"*

## Typical output

```text
Groundedness       : 78%
Support level      : HIGH
Unsupported symbols: none
```

## Complete workflow: ask → get answer → judge

**Step 1: Generate focused context**
```bash
sigmap ask "explain the auth flow"
# Creates: .context/query-context.md
```

**Step 2: Get AI response**
```bash
# Copy .context/query-context.md into your AI chat
cat .context/query-context.md
# Paste the output into Claude, Copilot, ChatGPT, or your IDE
# Ask your question: "Explain the auth flow"
# Copy the AI's response
```

**Step 3: Save the response**
```bash
# Create response.txt with the AI's answer
cat > response.txt << 'EOF'
[Paste the complete AI response here]
EOF
```

**Step 4: Judge groundedness**
```bash
sigmap judge --response response.txt --context .context/query-context.md
# Output: Groundedness score and support level
```

## Opt-in learning

With `--learn`, `judge` can apply a small local boost or penalty to the files referenced in the context headings:

- strongly grounded result → small boost
- weakly grounded result → small penalty
- middle band → no change

This learning is local-only and stored in `.context/weights.json`.

## When to use it

- reviewing AI-generated explanations
- checking whether a debugging suggestion is really grounded in the shown files
- grading prompt/response pairs in demos or release benchmarks
- feeding the [learning engine](/guide/learning) carefully instead of manually every time
