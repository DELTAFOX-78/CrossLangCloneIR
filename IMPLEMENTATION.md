# IMPLEMENTATION.md - Compiler & Code Details

This document provides detailed compiler-level integration specifications, the custom IR normalizer codebase design, and graph property parser details for the **CrossLangCloneIR** pipeline.

---

## 🛠️ Compiler-Level IR Generation

We compile high-level programming language sources down to LLVM Intermediate Representation text assembly (`.ll`) using native compiler toolchains:

### 1. C & C++ Compilation
We use the **Clang** compiler frontend with flags:
- `-S`: Output human-readable LLVM assembly text rather than binary bitcode.
- `-emit-llvm`: Emit target LLVM Intermediate Representation.

**Shell Command**:
```bash
clang -S -emit-llvm source.c -o output.ll
clang++ -S -emit-llvm source.cpp -o output.ll
```

### 2. Rust Compilation
We use the native **rustc** compiler with flags:
- `--emit=llvm-ir`: Directs the compiler to emit LLVM assembly files.

**Shell Command**:
```bash
rustc --emit=llvm-ir source.rs -o output.ll
```

---

## 🧹 Custom IR Normalization Engine

Our IR normalizer is written in Python (`src/cli/ir_normalizer.py`). It applies a series of multi-stage regular expression rules to remove compiler artifacts and normalize registers:

1. **Target Metadata Stripping**: Strips target-dependent metadata and platform information (like `target datalayout`, `target triple`, and `source_filename`), which vary across target architectures and operating systems.
2. **Metadata & Attributes Removal**: Strips debug markers (like `!dbg !12` or `#1` flags) that carry local environment paths.
3. **Register Label Sequential Mapping**: Normalizes SSA temporary variable names. A local function-scoped regex map tracks variable names and re-assigns them sequentially:
   - `%1`, `%a`, `%tmp` $\rightarrow$ `%VAR_1`, `%VAR_2`, `%VAR_3`
4. **Basic Block Label Standardizing**: Maps compiler-generated basic block definitions and branch labels sequentially:
   - `label %3`, `label %exit` $\rightarrow$ `label %LABEL_1`, `label %LABEL_2`

---

## 🏗️ Graph Extraction Engines

### 1. Kotlin Fraunhofer CPG Extractor (`src/cpg`)
Our standard extractor is built using the **Fraunhofer Code Property Graph (CPG)** library.
- Imports `de.fraunhofer.aisec:cpg-language-llvm` frontend.
- Runs a Gradle JVM application (`src/cpg/src/main/kotlin/Main.kt`) that parses the normalized `.ll` file.
- Performs a Depth First Search (DFS) traversal on the extracted AST nodes, tracking control flows (`curr.nextCFG`) and data dependency flows (`curr.nextDFG`).
- Outputs the nodes and edges as compact JSON structures.

### 2. High-Fidelity Python Fallback CPG Parser (`src/cli/graph_extractor.py`)
To ensure cross-platform execution when Gradle or JDK 17 are not installed, the system implements a fully-featured, self-contained Python fallback IR parser:
- **Block Identification**: Scans the normalized LLVM IR text, identifies block entry headers (like `LABEL_1:`), and partitions instructions.
- **Opcode Type Extraction**: Splits instructions (like `%VAR_2 = add nsw i32 %VAR_1, 1`), extracts the instruction type (`AddInst`), and registers definitions in a local map.
- **DFG Dependency Mapping**: For each operand referenced in an instruction, searches the definition map for the instruction that defined it and inserts a data-dependency edge (connecting the defining instruction node to the using instruction node).
- **CFG Flow Mapping**: Sequentially connects instructions within a basic block. For terminating instructions (like branch `br` or conditional jump `br i1 %VAR_1, label %LABEL_1, label %LABEL_2`), parses the target block labels and maps control-flow edges to the first instructions of those blocks.
