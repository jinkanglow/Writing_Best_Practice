# Editorial style signal policy (v3.3)

This is an original implementation informed by categories described in the public README of https://github.com/jalaalrd/anti-ai-slop-writing (accessed 2026-11-20). No upstream word list or skill text is reproduced.

## Detection classes

- Stock transitions and framing phrases: literal, configurable, context-dependent warnings.
- Formulaic sentence openers: sentence-boundary heuristic, not a ban.
- Punctuation repetition: per Markdown text node threshold, not a universal style rule.
- Repeated English sentence starts: frequency threshold, not a classifier.

## Editorial decision protocol

For each finding, preserve the exact source quote, offsets and rule ID. Decide whether the phrase performs a necessary rhetorical function before revising. Do not remove technically meaningful hedges, attribution, qualifiers, or quotations to make text sound less like a model. In finance and technical writing, accuracy outranks fluency.

## Exclusions and limits

Code fences, block quotations and frontmatter are excluded. This is not a full CommonMark parser. Node-level punctuation counts are not guaranteed to represent logical paragraphs. Heuristic warnings do not identify AI authorship and cannot verify facts, source credibility, character causality, or semantic equivalence.

## Upstream distinction

The referenced project describes broader lists of words, phrases, structural patterns and accuracy failures. This repository implements a deliberately smaller, independently authored, deterministic subset. Its README's claim of eliminating detectable AI patterns is not established by this integration.
