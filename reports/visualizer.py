import matplotlib.pyplot as plt
import networkx as nx
import json
from pathlib import Path

class Visualizer:
    def __init__(self, output_dir: str = "reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def draw_graph(self, graph_json_file: Path, output_filename: str):
        with open(graph_json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        G = nx.DiGraph()
        for node in data["nodes"]:
            G.add_node(node["id"], label=node.get("type", ""))
            
        for edge in data["edges"]:
            G.add_edge(edge["source"], edge["target"])

        plt.figure(figsize=(10, 8))
        pos = nx.spring_layout(G)
        labels = nx.get_node_attributes(G, 'label')
        
        nx.draw(G, pos, with_labels=True, labels=labels, node_size=2000, 
                node_color="lightblue", font_size=10, font_weight="bold", arrows=True)
        
        plt.title(f"Graph Visualization: {data['function']}")
        plt.savefig(self.output_dir / output_filename)
        plt.close()

    def generate_similarity_heatmap(self, evaluation_json_file: Path):
        # Implementation for generating a heatmap matrix
        # For simplicity, we just save a placeholder plot.
        plt.figure(figsize=(8, 6))
        plt.text(0.5, 0.5, 'Similarity Heatmap Placeholder', horizontalalignment='center', verticalalignment='center', fontsize=12)
        plt.savefig(self.output_dir / "similarity_heatmap.png")
        plt.close()

if __name__ == "__main__":
    viz = Visualizer()
    print("Visualizer module initialized.")
