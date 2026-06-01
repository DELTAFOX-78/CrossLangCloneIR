import sys
import os
from pathlib import Path

# Ensure modules in src/ and root directory can be imported
CLI_DIR = Path(__file__).resolve().parent
SRC_DIR = CLI_DIR.parent
ROOT_DIR = SRC_DIR.parent
sys.path.insert(0, str(SRC_DIR))
sys.path.insert(0, str(ROOT_DIR))

import click
import subprocess

from cli.ir_generator import IRGenerator
from cli.ir_normalizer import IRNormalizer
from fingerprints.fingerprinter import GraphFingerprinter
from similarity.scorer import SimilarityScorer

@click.group()
def cli():
    """CrossLangCloneIR - Cross-Language Semantic Code Clone Detector"""
    pass

@cli.command()
@click.argument('corpus_dir', type=click.Path(exists=True))
def analyze(corpus_dir):
    """Run full pipeline: IR -> Normalize -> CPG -> Fingerprint"""
    click.echo(f"Analyzing corpus in {corpus_dir}...")
    
    # 1. Generate IR
    click.echo("Generating LLVM IR...")
    ir_gen = IRGenerator()
    ir_gen.process_corpus(corpus_dir)
    
    # 2. Normalize IR
    click.echo("Normalizing LLVM IR...")
    ir_norm = IRNormalizer()
    ir_norm.process_dir("ir")
    
    # 3. Fraunhofer CPG Extraction
    click.echo("Running Fraunhofer CPG Graph Extraction...")
    try:
        # Assumes Gradle application run task is setup
        gradle_cmd = "gradlew.bat" if os.name == 'nt' else "./gradlew"
        cmd = [gradle_cmd, "run", "--args=../../normalized_ir ../../graphs"]
        subprocess.run(cmd, cwd="src/cpg", check=True)
    except Exception as e:
        click.echo(f"CPG processing failed or Java/Gradle unavailable: {e}")
        click.echo("Using high-fidelity dynamic Python-based IR semantic fallback parser...")
        from cli.graph_extractor import generate_graphs_for_all_normalized_files
        generate_graphs_for_all_normalized_files()
        
    # 4. Graph Fingerprinting
    click.echo("Generating Graph Fingerprints...")
    fp = GraphFingerprinter()
    fp.process_dir("graphs")
    click.echo("Analysis complete.")

@cli.command()
@click.option('--input', 'input_dir', default="fingerprints", help="Directory containing fingerprints")
@click.option('--threshold', default=0.85, type=float, help="Similarity threshold")
def detect(input_dir, threshold):
    """Detect clones based on fingerprints"""
    click.echo(f"Detecting clones in {input_dir} with threshold {threshold}...")
    fp_path = Path(input_dir)
    fingerprints = list(fp_path.glob("*.json"))
    
    scorer = SimilarityScorer()
    
    for i in range(len(fingerprints)):
        for j in range(i + 1, len(fingerprints)):
            result = scorer.compare_files(fingerprints[i], fingerprints[j])
            if result["score"] >= threshold:
                click.echo(f"CLONE DETECTED: {result['file1_func']} <-> {result['file2_func']} | Score: {result['score']:.2f} ({result['classification']})")

@cli.command()
@click.argument('file1', type=click.Path(exists=True))
@click.argument('file2', type=click.Path(exists=True))
def compare(file1, file2):
    """End-to-end comparison of two files"""
    click.echo(f"Comparing {file1} and {file2} is not fully implemented yet.")
    click.echo("In a real run, it would generate IR, normalize, extract CPG, fingerprint, and score.")

@cli.command()
@click.option('--format', default='json', type=click.Choice(['json', 'csv']))
def report(format):
    """Generate evaluation reports"""
    click.echo(f"Generating report in {format} format...")

if __name__ == '__main__':
    cli()
