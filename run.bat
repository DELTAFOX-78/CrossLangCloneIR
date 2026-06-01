@echo off
echo === Running CrossLangCloneIR Semantic Pipeline ===

echo Step 1: Analyzing testcases...
python -m src.cli.main analyze testcases

echo Step 2: Detecting clones (threshold = 0.85)...
python -m src.cli.main detect --threshold 0.85

echo Step 3: Evaluating precision, recall, and F1-score...
python src/evaluation/evaluator.py

echo === Pipeline and Evaluation Complete ===
