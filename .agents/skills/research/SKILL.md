---
name: research
description: Perform deep research across primary sources — scientific papers, web, official documentation, and local codebase — and capture findings in a structured report.
---

# Research

Investigate a research question or technical decision against **primary sources** (scientific articles/PDFs, official documentation, verified specs, or local code). Produce an authoritative, highly-cited Markdown report in the repo.

## Completion Criteria

The research is complete ONLY when:
1. Every major claim or data point is backed by a primary source link/citation.
2. High-trust tools (`search_web`, `read_url_content`, `view_file`) have been consulted.
3. Findings are recorded in a clean Markdown report in the specified output directory (default: `docs/research/` or specified in prompt/issue).

## Execution Process

### 1. Define the Core Question
Identify the exact question, scope boundaries, and key terms to investigate. If the topic involves scientific literature or complex algorithms, break it into specific sub-queries.

### 2. Gather Primary Sources
- **Web / Papers**: Use `search_web` to locate official documentation, arXiv preprints, or authoritative research portals.
- **Deep Extraction**: Use `read_url_content` to read full paper abstracts or documentation pages.
- **Local Context**: Use `view_file` to verify existing local code, models, or LaTeX documents.

### 3. Synthesize Findings
Synthesize the evidence into a Markdown report:
- **Executive Summary**: 2-3 sentences answering the core question.
- **Detailed Analysis**: Structured sections breaking down the findings, equations, or API mechanics.
- **Trade-offs / Edge Cases**: Limitations, costs, or assumptions identified.
- **Primary Source Citations**: Direct URLs or relative file paths to primary sources.

### 4. Record Artifact
Save the resulting report to the designated path (e.g. `docs/research/<topic-name>.md`) and reference it in the parent ticket or issue.
