import os
import re
from pathlib import Path

class IRNormalizer:
    def __init__(self, output_dir: str = "normalized_ir"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def normalize_file(self, input_file: Path) -> Path:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        normalized = self.normalize_content(content)

        relative_path = input_file.relative_to(input_file.parents[1]) # e.g., c/factorial.ll
        output_file = self.output_dir / relative_path
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(normalized)
            
        return output_file

    def normalize_content(self, ir_content: str) -> str:
        lines = ir_content.splitlines()
        normalized_lines = []
        
        var_counter = 1
        label_counter = 1
        var_map = {}
        label_map = {}

        def get_var(match):
            nonlocal var_counter
            original_var = match.group(0)
            if original_var not in var_map:
                var_map[original_var] = f"%VAR_{var_counter}"
                var_counter += 1
            return var_map[original_var]

        def get_label(match):
            nonlocal label_counter
            original_label = match.group(1)
            if original_label not in label_map:
                label_map[original_label] = f"LABEL_{label_counter}"
                label_counter += 1
            return f"label %{label_map[original_label]}"

        in_function = False
        
        for line in lines:
            # 1. Strip debug metadata and attributes (e.g., !dbg, #0)
            line = re.sub(r'![a-zA-Z0-9_]+( !dbg ![0-9]+)?', '', line)
            line = re.sub(r'#[0-9]+', '', line)
            
            # Remove target-dependent attributes at file level
            if line.startswith('target datalayout') or line.startswith('target triple') or line.startswith('source_filename'):
                continue
                
            # Skip empty lines or pure comments
            if not line.strip() or line.strip().startswith(';'):
                continue
                
            if line.startswith('define '):
                in_function = True
                var_counter = 1
                label_counter = 1
                var_map = {}
                label_map = {}
                # Canonicalize function signatures slightly by removing some attributes
                line = re.sub(r'(define\s+[a-zA-Z0-9_]+\s+@[a-zA-Z0-9_]+)\([^)]*\)', r'\1(...)', line)

            if in_function:
                # Normalize SSA variables %1, %2, %a
                line = re.sub(r'%[a-zA-Z0-9_.]+', get_var, line)
                
                # Normalize basic block labels
                line = re.sub(r'label\s+%([a-zA-Z0-9_.]+)', get_label, line)
                
                # Basic block definitions e.g., bb1:
                label_def = re.match(r'^([a-zA-Z0-9_.]+):', line)
                if label_def:
                    original_label = label_def.group(1)
                    if original_label not in label_map:
                        label_map[original_label] = f"LABEL_{label_counter}"
                        label_counter += 1
                    line = f"{label_map[original_label]}:"

            if line.startswith('}'):
                in_function = False

            normalized_lines.append(line.strip())

        return "\n".join(normalized_lines)

    def process_dir(self, input_dir: str):
        input_path = Path(input_dir)
        for root, _, files in os.walk(input_path):
            for file in files:
                if file.endswith('.ll'):
                    file_path = Path(root) / file
                    print(f"Normalizing IR file: {file_path}")
                    self.normalize_file(file_path)

if __name__ == "__main__":
    normalizer = IRNormalizer()
    normalizer.process_dir("ir")
