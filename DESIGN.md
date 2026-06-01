# DESIGN.md - CrossLangCloneIR Architecture

This document describes the architectural approach, algorithmic designs, mathematical foundations, and comparative alternatives of the **CrossLangCloneIR** cross-language semantic code clone detection system.

---

## 💡 The Approach: LLVM IR & Code Property Graph (CPG)

Traditional code clone detection models look at syntax (tokens, text), which fails completely for cross-language clone detection (e.g., comparing C vs. Rust) due to completely different grammar, keywords, and typings.

**CrossLangCloneIR** overcomes this by lifting code into a language-neutral semantic intermediate representation:
1. **Compilation to LLVM IR**: High-level compilers (`clang` for C/C++, `rustc` for Rust) resolve syntactical structures (like `for`, `while`, and `do-while` loops) into canonical instructions (conditional branch `br`, load `load`, store `store`, SSA registers).
2. **CPG Representation**: Synthesizes the **Control Flow Graph (CFG)** and **Data Flow Graph (DFG)** from LLVM IR, creating a hybrid Code Property Graph (CPG).
3. **WL Graph Hashing**: Evaluates structural isomorphisms of the CFG and DFG independently of variable naming.

---

## 🧮 Algorithmic & Mathematical Foundations

### 1. IR Normalizer
LLVM IR generated from different compilers contains target-dependent data and compiler-specific register label details (e.g., `%1`, `%a`, `%tmp`). The custom **IRNormalizer** cleans and normalizes this using regular expressions:
- Strips source debug locations (`!dbg`, source metadata).
- Replaces SSA register names with canonical variables sequentially (`%VAR_1`, `%VAR_2`, etc.).
- Standardizes basic block labels sequentially (`LABEL_1`, `LABEL_2`, etc.).

### 2. Weisfeiler-Lehman (WL) Graph Isomorphism Hash
To compare two control-flow or data-flow graphs in a permutation-invariant manner, we use a custom **Weisfeiler-Lehman (WL) Graph Kernel** implementation:
1. **Initialization**: Initialize the label of each node $v$ with its opcode type:
   $$l^{(0)}(v) = \text{type}(v)$$
2. **Iterative Neighborhood Aggregation**: At step $i$, update the label of each node by sorting and concatenating its own label with its neighbors' labels, then hashing the combined string:
   $$l^{(i)}(v) = \text{Hash}\left( l^{(i-1)}(v) \parallel \text{sort}\left( \{ l^{(i-1)}(u) \mid u \in \mathcal{N}^{+}(v) \} \right) \right)$$
3. **Graph Signature**: Sort all node labels at iteration $K$ and compute an overall graph MD5 signature.

This process runs in $\mathcal{O}(M)$ linear time and maps isomorphic structural topologies to identical hashes, even if their nodes are permuted.

### 3. Weighted Similarity Formula
We combine structural control flow, structural data flow, and bag-of-words instruction types:
$$\text{Similarity}(G_1, G_2) = w_{\text{cfg}} \cdot S_{\text{CFG}} + w_{\text{dfg}} \cdot S_{\text{DFG}} + w_{\text{opcode}} \cdot S_{\text{opcode}}$$

Where:
- $w_{\text{cfg}} = 0.4$, $w_{\text{dfg}} = 0.4$, $w_{\text{opcode}} = 0.2$
- $S_{\text{CFG}}$ and $S_{\text{DFG}}$ resolve to `1.0` if the WL graph hashes match exactly, otherwise they fallback to a Jaccard size approximation:
  $$\text{Jaccard Approx}(G_1, G_2) = \frac{\min(|V_1| + |E_1|, |V_2| + |E_2|)}{\max(|V_1| + |E_1|, |V_2| + |E_2|)}$$
- $S_{\text{opcode}}$ evaluates to `1.0` if the instruction type bag-of-words MD5 matches exactly, else `0.5` approximation.

---

## 🔄 Alternative Approaches & Trade-offs

| Representation | Scope | Strengths | Weaknesses | Suitability for Cross-Language |
| :--- | :--- | :--- | :--- | :--- |
| **Source Text (Levenshtein / Jaccard)** | Type-1 & 2 clones | Trivial to implement, extremely fast | Fails with variable renaming, formatting changes, and syntactic grammar shifts | **Unusable** (C vs Rust keywords differ entirely) |
| **Tokens (Lexical - CCFinder)** | Type-2 & 3 clones | High speed, robust against renaming and identifier swaps | Ignores statement structure, loops, and logic branches | **Poor** (Different keyword token streams mismatch) |
| **Abstract Syntax Tree (AST)** | Type-3 clones | Captures syntactic grammar nesting | Highly dependent on language grammar rules; difficult to map nodes across languages | **Mediocre** (Requires complex manual AST node translation schemas) |
| **LLVM IR + CPG Graph Isomorphism (Ours)** | Type-3 & 4 (Semantic) | Language-agnostic, captures exact data & control dependency layouts, permutation invariant | Compilation toolchain required, computationally more complex graph kernels | **Excellent** (Compilers lower diverse syntaxes into shared semantic instructions) |
