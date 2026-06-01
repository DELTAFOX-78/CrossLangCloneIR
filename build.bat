@echo off
echo === Building and Preparing CrossLangCloneIR ===

echo Installing Python dependencies...
pip install -r requirements.txt

echo Preparing output directories...
if not exist ir mkdir ir
if not exist normalized_ir mkdir normalized_ir
if not exist graphs\cfg mkdir graphs\cfg
if not exist graphs\dfg mkdir graphs\dfg
if not exist fingerprints mkdir fingerprints
if not exist evaluation mkdir evaluation

echo Attempting CPG parser build...
if exist src\cpg (
    cd src\cpg
    if exist gradlew.bat (
        call gradlew.bat build -x test
    ) else (
        echo Info: Gradle wrapper not found. The system will use the high-fidelity dynamic Python IR parser fallback.
    )
    cd ..\..
)

echo === Build and Setup Complete ===
