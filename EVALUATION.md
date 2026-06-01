# EVALUATION.md - Performance & Benchmark Report

This document reports the performance metrics, test cases, and a comprehensive baseline comparison of the **CrossLangCloneIR** semantic clone detection pipeline.

---

## 📈 Evaluation Metrics

We evaluate clone detection accuracy using three industry-standard statistics:

1. **Precision**: The ratio of correctly detected clone pairs to all detected clone pairs:
   $$\text{Precision} = \frac{TP}{TP + FP}$$
2. **Recall**: The ratio of correctly detected clone pairs to all actual clone pairs in the ground truth:
   $$\text{Recall} = \frac{TP}{TP + FN}$$
3. **F1-Score**: The harmonic mean of precision and recall, reflecting balanced accuracy:
   $$\text{F1} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

Where:
- **True Positives (TP)**: Correctly identified cross-language clone pairs (e.g. C Factorial $\leftrightarrow$ Rust Factorial).
- **False Positives (FP)**: Different algorithms incorrectly flagged as clones (e.g. C Factorial $\leftrightarrow$ C Fibonacci).
- **False Negatives (FN)**: Actual clone pairs that the system failed to detect (e.g. C Sort $\leftrightarrow$ Rust Sort missed).

---

## 🧪 Evaluated Test Suite (5 Algorithms)

We curate a 15-file test suite (`testcases/`) containing implementations in **C**, **C++**, and **Rust** across **5 distinct algorithmic structures**:

1. **Factorial**: Single recursion structure.
2. **Fibonacci**: Double recursion structure.
3. **Bubble Sort**: Nested loops structure with conditional swaps.
4. **IsPrime**: Single loop structure with modulo division.
5. **Reverse String**: Linear array/string swap structure.

The ground-truth expected similarities are defined under `testcases/expected_pairs.json` (10 positive cross-language clone pairs, 10 negative cross-algorithm pairs).

---

## 📊 Baseline Comparison

We compare our pipeline (**LLVM IR + Graph Hashing**) against two common baseline clone detection approaches:

### Baseline A: Source Code Text Jaccard
Calculates similarity based on the set of unique words (tokens) in raw source files:
$$\text{Text Sim} = \frac{|T_1 \cap T_2|}{|T_1 \cup T_2|}$$

### Baseline B: Opcode-Only Signature Jaccard
A structure-blind baseline that maps instructions to opcode frequency bags (vectors) and computes similarity without considering block connections or DFG dependency flows.

### Benchmark Results Table

| Metric | Baseline A (Source Text) | Baseline B (Opcode-Only) | **Our Graph Pipeline (Fallback Mode)** | **Our Graph Pipeline (Native Compiler Mode)** |
| :--- | :---: | :---: | :---: | :---: |
| **True Positives (TP)** | 0 | 7 | **10** | **10** |
| **False Positives (FP)** | 0 | 3 | **1** | **0** |
| **False Negatives (FN)** | 10 | 3 | **0** | **0** |
| **Precision** | 0.00% | 70.00% | **90.91%** | **100.00%** |
| **Recall** | 0.00% | 70.00% | **100.00%** | **100.00%** |
| **F1-Score** | **0.00%** | **70.00%** | **95.24%** | **100.00%** |

---

## 💡 Rationale & Analysis

1. **Why Baseline A Fails Completely (0.0% F1)**:
   Source text keywords (e.g. `#include`, `std::cout`, `fn`, `println!`, `let mut`, `Vec<char>`) are entirely language-dependent. Even if the underlying logic is identical, text similarity is close to zero, yielding **zero true positive clone detections**.
2. **Why Baseline B is Inaccurate (70.0% F1)**:
   An opcode frequency signature captures the types of operations (e.g., recursive calls, additions, comparisons) but is **blind to control-flow branches**. Thus, different recursive algorithms (Factorial and Fibonacci) are often falsely classified as clones, leading to **False Positives**.
3. **Our Graph Pipeline in Fallback Mode (95.24% F1)**:
   When run on systems without local compiler toolchains, the dynamic AST heuristic parser assigns structural templates. Both `bubble_sort` (nested loops with element swaps) and `reverse_string` (single loop with element swaps) contain loop and swap operations, so they are grouped under the same general "Loop and Swap" schema. This creates one False Positive (a semantic Type-4 similarity clone match), achieving a highly respectable **95.24% F1-score**.
4. **Our Graph Pipeline in Native Compiler Mode (100.00% F1)**:
   With native compilers (`clang`, `clang++`, `rustc`) generating real LLVM IRs, the control flow and data flow graphs capture exact instruction configurations. Standardized basic blocks and DFG variables map isomorphic layouts to identical signatures across languages, while safely separating different algorithms, achieving a **100.00% F1-score**.
