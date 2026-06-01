import os
import json
import re
from pathlib import Path

def generate_graphs_from_ir(normalized_ir: str, func_name: str):
    """
    Semantic IR Parser Fallback.
    Extracts a semi-realistic CFG and DFG from the normalized LLVM IR.
    We identify instructions, assign unique IDs, and link them to build a flow.
    """
    lines = normalized_ir.splitlines()
    nodes = []
    cfg_edges = []
    dfg_edges = []
    
    current_block = "entry"
    inst_counter = 1
    
    def_map = {}
    
    block_nodes = {}
    block_nodes[current_block] = []
    
    for line in lines:
        line_str = line.strip()
        if not line_str: continue
        
        if line_str.endswith(':'):
            current_block = line_str[:-1]
            block_nodes[current_block] = []
            continue
            
        node_id = f"n_{inst_counter}"
        inst_counter += 1
        
        opcode = "unknown"
        code = line_str
        
        tokens = line_str.split()
        if len(tokens) > 0:
            if '=' in tokens:
                eq_idx = tokens.index('=')
                assigned_var = tokens[eq_idx-1]
                right_tokens = tokens[eq_idx+1:]
                opcode = right_tokens[0] if right_tokens else "assign"
                def_map[assigned_var] = node_id
            else:
                opcode = tokens[0]
        
        node_data = {
            "id": node_id,
            "code": code,
            "type": opcode.capitalize() + "Inst",
            "block": current_block
        }
        nodes.append(node_data)
        block_nodes[current_block].append(node_id)
        
        for tok in tokens:
            if tok.startswith('%VAR_'):
                clean_tok = tok.split(',')[0].split(')')[0]
                if clean_tok in def_map:
                    dfg_edges.append({
                        "source": def_map[clean_tok],
                        "target": node_id
                    })
                    
    for block, node_ids in block_nodes.items():
        for i in range(len(node_ids) - 1):
            cfg_edges.append({
                "source": node_ids[i],
                "target": node_ids[i+1]
            })
            
    block_list = list(block_nodes.keys())
    for idx, block in enumerate(block_list):
        node_ids = block_nodes[block]
        if not node_ids: continue
        last_node_id = node_ids[-1]
        last_node = next(n for n in nodes if n["id"] == last_node_id)
        code = last_node["code"]
        
        if "br" in code:
            matches = re.findall(r'LABEL_\d+', code)
            for m in matches:
                if m in block_nodes and block_nodes[m]:
                    cfg_edges.append({
                        "source": last_node_id,
                        "target": block_nodes[m][0]
                    })
        elif "ret" in code:
            pass
        else:
            if idx + 1 < len(block_list):
                next_block = block_list[idx+1]
                if block_nodes[next_block]:
                    cfg_edges.append({
                        "source": last_node_id,
                        "target": block_nodes[next_block][0]
                    })

    if not cfg_edges and len(nodes) > 1:
        for i in range(len(nodes) - 1):
            cfg_edges.append({"source": nodes[i]["id"], "target": nodes[i+1]["id"]})

    cfg = {"function": func_name, "nodes": nodes, "edges": cfg_edges}
    dfg = {"function": func_name, "nodes": nodes, "edges": dfg_edges}
    return cfg, dfg

def generate_graphs_for_all_normalized_files(root_dir_str: str = "."):
    root_dir = Path(root_dir_str)
    norm_dir = root_dir / "normalized_ir"
    cfg_dir = root_dir / "graphs" / "cfg"
    dfg_dir = root_dir / "graphs" / "dfg"
    cfg_dir.mkdir(parents=True, exist_ok=True)
    dfg_dir.mkdir(parents=True, exist_ok=True)
    
    for root, _, files in os.walk(norm_dir):
        for file in files:
            if file.endswith('.ll'):
                norm_file_path = Path(root) / file
                subfolder = norm_file_path.parent.name # c, cpp, rust
                
                try:
                    with open(norm_file_path, 'r', encoding='utf-8') as f:
                        norm_ir = f.read()
                        
                    stem = norm_file_path.stem
                    graph_filename = f"{subfolder}_{stem}.json"
                    
                    cfg, dfg = generate_graphs_from_ir(norm_ir, stem)
                    
                    with open(cfg_dir / graph_filename, 'w', encoding='utf-8') as gf:
                        json.dump(cfg, gf)
                    with open(dfg_dir / graph_filename, 'w', encoding='utf-8') as gf:
                        json.dump(dfg, gf)
                    print(f"Generated CFG and DFG graphs for {subfolder}/{stem}")
                except Exception as e:
                    print(f"Failed parsing graph for {file}: {e}")
