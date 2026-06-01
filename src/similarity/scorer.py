import json
import math
from pathlib import Path

class SimilarityScorer:
    def __init__(self):
        self.w_cfg = 0.4
        self.w_dfg = 0.4
        self.w_opcode = 0.2

    def calculate_similarity(self, fp1: dict, fp2: dict) -> float:
        # 1. CFG Similarity (Hash exact match or size approximation)
        cfg_sim = 1.0 if fp1["cfg_hash"] == fp2["cfg_hash"] else self._jaccard_approx(
            fp1["cfg_node_count"], fp1["cfg_edge_count"],
            fp2["cfg_node_count"], fp2["cfg_edge_count"]
        )

        # 2. DFG Similarity
        dfg_sim = 1.0 if fp1["dfg_hash"] == fp2["dfg_hash"] else self._jaccard_approx(
            fp1["dfg_node_count"], fp1["dfg_edge_count"],
            fp2["dfg_node_count"], fp2["dfg_edge_count"]
        )

        # 3. Opcode Similarity
        opcode_sim = 1.0 if fp1["opcode_signature"] == fp2["opcode_signature"] else 0.5 # Simplified approximation

        # Weighted score
        score = (self.w_cfg * cfg_sim) + (self.w_dfg * dfg_sim) + (self.w_opcode * opcode_sim)
        return score

    def _jaccard_approx(self, n1, e1, n2, e2) -> float:
        """Approximates Jaccard similarity based on graph size."""
        size1 = n1 + e1
        size2 = n2 + e2
        if size1 == 0 and size2 == 0:
            return 1.0
        return min(size1, size2) / max(size1, size2)

    def classify_clone(self, score: float) -> str:
        if score >= 0.85:
            return "strong_clone"
        elif score >= 0.65:
            return "probable_clone"
        else:
            return "not_clone"

    def compare_files(self, fp1_path: Path, fp2_path: Path) -> dict:
        with open(fp1_path, 'r', encoding='utf-8') as f:
            fp1 = json.load(f)
        with open(fp2_path, 'r', encoding='utf-8') as f:
            fp2 = json.load(f)

        score = self.calculate_similarity(fp1, fp2)
        return {
            "file1_func": fp1["function"],
            "file2_func": fp2["function"],
            "score": score,
            "classification": self.classify_clone(score)
        }

if __name__ == "__main__":
    scorer = SimilarityScorer()
    # test dummy logic
    print("Similarity engine loaded.")
