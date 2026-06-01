#!/bin/bash
# CrossLangCloneIR - Build & Setup Script
set -e

echo "=== Building and Preparing CrossLangCloneIR ==="

# 1. Install Python Dependencies
echo "Installing Python dependencies..."
if [ -f "../requirements.txt" ]; then
    pip install -r ../requirements.txt
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "Warning: requirements.txt not found!"
fi

# 2. Setup standard directories
echo "Preparing output directories..."
mkdir -p ../ir ../normalized_ir ../graphs/cfg ../graphs/dfg ../fingerprints ../evaluation 2>/dev/null || mkdir -p ir normalized_ir graphs/cfg graphs/dfg fingerprints evaluation

# 3. Attempt CPG compilation
echo "Attempting CPG parser build..."
if [ -d "../src/cpg" ]; then
    cd ../src/cpg
    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        ./gradlew build -x test || echo "Warning: Gradle build failed. The system will automatically use the Python-based high-fidelity semantic IR fallback parser."
    elif [ -f "gradlew.bat" ] && [ -n "$COMSPEC" ]; then
        cmd.exe /c gradlew.bat build -x test || echo "Warning: Gradle build failed. The system will automatically use the Python-based high-fidelity semantic IR fallback parser."
    else
        echo "Info: Gradle wrapper not found. The system will use the high-fidelity dynamic Python IR parser fallback."
    fi
    cd ../../scripts
elif [ -d "src/cpg" ]; then
    cd src/cpg
    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        ./gradlew build -x test || echo "Warning: Gradle build failed. The system will automatically use the Python-based high-fidelity semantic IR fallback parser."
    elif [ -f "gradlew.bat" ] && [ -n "$COMSPEC" ]; then
        cmd.exe /c gradlew.bat build -x test || echo "Warning: Gradle build failed. The system will automatically use the Python-based high-fidelity semantic IR fallback parser."
    else
        echo "Info: Gradle wrapper not found. The system will use the high-fidelity dynamic Python IR parser fallback."
    fi
    cd ../..
fi

echo "=== Build and Setup Complete ==="
