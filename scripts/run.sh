#!/bin/bash
# CrossLangCloneIR - Run & Evaluation Pipeline Script
set -e

echo "=== Running CrossLangCloneIR Semantic Pipeline ==="

# Move to the root directory if we are inside scripts/
if [ -f "../run.sh" ]; then
    cd ..
fi

# 1. Analyze the testcases corpus
echo "Step 1: Analyzing testcases..."
python -m src.cli.main analyze testcases

# 2. Detect clones using fingerprints
echo "Step 2: Detecting clones (threshold = 0.85)..."
python -m src.cli.main detect --threshold 0.85

# 3. Evaluate results against the ground truth
echo "Step 3: Evaluating precision, recall, and F1-score..."
python src/evaluation/evaluator.py

echo "=== Pipeline and Evaluation Complete ==="
