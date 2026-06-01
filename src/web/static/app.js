// Global State Manager
const state = {
    activeTab: 'compare',
    activeVisTab: 'raw-ir',
    activeInsTab: 'source',
    threshold: 0.85,
    selectedCorpusFile: null,
    
    // Vis.js networks
    networks: {
        cfg1: null,
        cfg2: null,
        dfg1: null,
        dfg2: null
    },
    
    // Code templates
    templates: {
        factorial: {
            c: `#include <stdio.h>\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    printf("%d\\n", factorial(5));\n    return 0;\n}`,
            cpp: `#include <iostream>\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    std::cout << factorial(5) << std::endl;\n    return 0;\n}`,
            rust: `fn factorial(n: i32) -> i32 {\n    if n <= 1 {\n        return 1;\n    }\n    n * factorial(n - 1)\n}\n\nfn main() {\n    println!("{}", factorial(5));\n}`
        },
        fibonacci: {
            c: `#include <stdio.h>\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    printf("%d\\n", fibonacci(6));\n    return 0;\n}`,
            cpp: `#include <iostream>\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    std::cout << fibonacci(6) << std::endl;\n    return 0;\n}`,
            rust: `fn fibonacci(n: i32) -> i32 {\n    if n <= 1 {\n        return n;\n    }\n    fibonacci(n - 1) + fibonacci(n - 2)\n}\n\nfn main() {\n    println!("{}", fibonacci(6));\n}`
        },
        bubblesort: {
            c: `#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) {\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n}`,
            cpp: `#include <iostream>\n#include <vector>\n\nvoid bubbleSort(std::vector<int>& arr) {\n    int n = arr.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                std::swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}`,
            rust: `fn bubbleSort(arr: &mut [i32], n: usize) {\n    for i in 0..n {\n        for j in 0..(n - i - 1) {\n            if arr[j] > arr[j + 1] {\n                let temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n    }\n}`
        },
        isPrime: {
            c: `#include <stdio.h>\n\nint isPrime(int n) {\n    if (n <= 1) return 0;\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) return 0;\n    }\n    return 1;\n}`,
            cpp: `#include <iostream>\n\nbool isPrime(int n) {\n    if (n <= 1) return false;\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}`,
            rust: `fn isPrime(n: i32) -> i32 {\n    if n <= 1 {\n        return 0;\n    }\n    let mut i = 2;\n    while i * i <= n {\n        if n % i == 0 {\n            return 0;\n        }\n        i += 1;\n    }\n    1\n}`
        },
        reverseString: {
            c: `#include <stdio.h>\n#include <string.h>\n\nvoid reverse_string(char* s) {\n    int len = strlen(s);\n    for (int i = 0; i < len / 2; i++) {\n        char temp = s[i];\n        s[i] = s[len - i - 1];\n        s[len - i - 1] = temp;\n    }\n}`,
            cpp: `#include <iostream>\n#include <string>\n\nstd::string reverse_string(std::string s) {\n    int len = s.length();\n    for (int i = 0; i < len / 2; i++) {\n        char temp = s[i];\n        s[i] = s[len - i - 1];\n        s[len - i - 1] = temp;\n    }\n    return s;\n}`,
            rust: `fn reverse_string(s: &str) -> String {\n    let mut chars: Vec<char> = s.chars().collect();\n    let len = chars.len();\n    let mut i = 0;\n    while i < len / 2 {\n        let temp = chars[i];\n        chars[i] = chars[len - i - 1];\n        chars[len - i - 1] = temp;\n        i += 1;\n    }\n    chars.into_iter().collect()\n}`
        }
    }
};

// ==========================================
// Initializer & Setup
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Template Load
    document.getElementById('template-select-1').value = 'factorial';
    document.getElementById('template-select-2').value = 'factorial';
    loadEditorTemplate(1, 'factorial');
    loadEditorTemplate(2, 'factorial');
    
    // 2. Fetch Corpus Explorer files
    fetchCorpusFiles();
    
    // 3. Fetch Initial Evaluation Metrics
    fetchEvaluationReport();
    
    // 4. Synchronize scrolling of textual layers in editors
    setupEditorSync(1);
    setupEditorSync(2);
});

function setupEditorSync(id) {
    const ta = document.getElementById(`code-textarea-${id}`);
    const pre = ta.nextElementSibling;
    
    ta.addEventListener('scroll', () => {
        pre.scrollTop = ta.scrollTop;
        pre.scrollLeft = ta.scrollLeft;
    });
}

function syncCodeDisplay(id) {
    const ta = document.getElementById(`code-textarea-${id}`);
    const block = document.getElementById(`code-block-${id}`);
    
    block.textContent = ta.value;
    Prism.highlightElement(block);
}

// ==========================================
// SPA Tab Switchers
// ==========================================
function switchTab(tabId) {
    // Remove active state
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    // Set active tab
    document.getElementById(`tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    state.activeTab = tabId;
    
    // Trigger resize for networks in case Vis.js was loaded in hidden tab
    if (tabId === 'compare') {
        setTimeout(() => {
            Object.values(state.networks).forEach(net => {
                if (net) net.redraw();
            });
        }, 100);
    }
}

function switchVisTab(visTabId) {
    document.querySelectorAll('.vis-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(visTabId)) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.vis-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.getElementById(`vis-${visTabId}`).classList.add('active');
    state.activeVisTab = visTabId;
    
    // Fit and redraw the visible vis.js networks to center them in the container
    setTimeout(() => {
        Object.values(state.networks).forEach(net => {
            if (net) {
                net.setSize('100%', '100%');
                net.redraw();
                net.fit();
            }
        });
    }, 50);
}

function switchInspectorTab(insTabId) {
    document.querySelectorAll('.ins-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(insTabId)) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('.ins-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.getElementById(`ins-${insTabId}`).classList.add('active');
    state.activeInsTab = insTabId;
}

// ==========================================
// Control Operations
// ==========================================
function loadEditorTemplate(id, name) {
    const lang = document.getElementById(`lang-select-${id}`).value;
    const t = state.templates[name];
    if (!t) return;
    
    const code = t[lang];
    if (!code) {
        showToast(`Template not available in ${lang.toUpperCase()}`, 'error');
        return;
    }
    
    document.getElementById(`code-textarea-${id}`).value = code;
    
    // Update filename title
    const ext = lang === 'rust' ? 'rs' : (lang === 'cpp' ? 'cpp' : 'c');
    document.getElementById(`file-title-${id}`).textContent = `${name}.${ext}`;
    
    syncCodeDisplay(id);
    showToast(`Loaded ${name.toUpperCase()} in Editor ${id}`, 'info');
}

function changeLanguage(id, lang, filename = null) {
    const badge = document.getElementById(`lang-badge-${id}`);
    const title = document.getElementById(`file-title-${id}`);
    const textarea = document.getElementById(`code-textarea-${id}`);
    const block = document.getElementById(`code-block-${id}`);
    
    badge.className = `file-badge badge-${lang}`;
    badge.textContent = lang.toUpperCase();
    
    // Check if an algorithm template is selected
    const select = document.getElementById(`template-select-${id}`);
    const currentAlg = select.value;
    
    if (currentAlg && state.templates[currentAlg]) {
        const code = state.templates[currentAlg][lang];
        if (code) {
            textarea.value = code;
        }
    }
    
    // Update filename title
    if (!filename) {
        const ext = lang === 'rust' ? 'rs' : (lang === 'cpp' ? 'cpp' : 'c');
        const alg = currentAlg || 'scratch';
        title.textContent = `${alg}.${ext}`;
    } else {
        title.textContent = filename;
    }
    
    // Sync prism language class
    block.className = `language-${lang}`;
    syncCodeDisplay(id);
}

function updateThresholdValue(val) {
    state.threshold = parseFloat(val);
    document.getElementById('threshold-val').textContent = val;
}

// ==========================================
// Pipeline / API Tasks
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function executeComparison() {
    // 1. Clear previous visualizations and score overlays
    resetPipelineHUD();
    
    // 2. Fetch Code parameters
    const code1 = document.getElementById('code-textarea-1').value;
    const lang1 = document.getElementById('lang-select-1').value;
    const code2 = document.getElementById('code-textarea-2').value;
    const lang2 = document.getElementById('lang-select-2').value;
    
    if (!code1.trim() || !code2.trim()) {
        showToast('Please verify that code blocks are not empty.', 'error');
        return;
    }
    
    // 3. Trigger visual pipeline sequence
    updatePipelineStep('step-ir', 'running');
    
    fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source1: code1,
            lang1: lang1,
            source2: code2,
            lang2: lang2,
            threshold: state.threshold,
            file1_path: document.getElementById('file-title-1').textContent,
            file2_path: document.getElementById('file-title-2').textContent
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'error') {
            throw new Error(data.message);
        }
        
        // Success pipeline visualization updates
        setTimeout(() => updatePipelineStep('step-ir', 'completed'), 300);
        setTimeout(() => updatePipelineStep('step-norm', 'completed'), 600);
        setTimeout(() => updatePipelineStep('step-cpg', 'completed'), 900);
        setTimeout(() => updatePipelineStep('step-hash', 'completed'), 1200);
        setTimeout(() => {
            updatePipelineStep('step-score', 'completed');
            
            // Populate metrics & details
            populateComparisonResults(data);
        }, 1500);
    })
    .catch(err => {
        console.error(err);
        showToast(err.message || 'Comparison failed.', 'error');
        
        // Set all pending steps to failed
        document.querySelectorAll('.pipeline-steps .step').forEach(step => {
            if (step.classList.contains('running') || step.classList.contains('pending')) {
                step.className = 'step failed';
            }
        });
    });
}

function resetPipelineHUD() {
    document.querySelectorAll('.pipeline-steps .step').forEach(step => {
        step.className = 'step pending';
    });
    
    // Reset radial
    const radial = document.getElementById('score-radial-bar');
    radial.style.strokeDashoffset = '251.2';
    document.getElementById('score-text').textContent = '--%';
    
    const label = document.getElementById('score-class-label');
    label.textContent = 'No Match';
    label.className = 'score-label';
    
    // Reset breakdown
    document.getElementById('cfg-sim-text').textContent = '--';
    document.getElementById('cfg-sim-fill').style.width = '0%';
    document.getElementById('dfg-sim-text').textContent = '--';
    document.getElementById('dfg-sim-fill').style.width = '0%';
    document.getElementById('opcode-sim-text').textContent = '--';
    document.getElementById('opcode-sim-fill').style.width = '0%';
}

function updatePipelineStep(id, status) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (status === 'running') {
        el.className = 'step running';
        el.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${el.textContent.trim().replace(/^[^a-zA-Z]+/g, '')}`;
    } else if (status === 'completed') {
        el.className = 'step completed';
        el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${el.textContent.trim().replace(/^[^a-zA-Z]+/g, '')}`;
    } else if (status === 'failed') {
        el.className = 'step failed';
        el.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${el.textContent.trim().replace(/^[^a-zA-Z]+/g, '')}`;
    }
}

function populateComparisonResults(data) {
    // 1. Draw radial similarity gauge
    const percentage = Math.round(data.score * 100);
    document.getElementById('score-text').textContent = `${percentage}%`;
    
    const radial = document.getElementById('score-radial-bar');
    const circumference = 251.2;
    radial.style.strokeDashoffset = circumference - (circumference * data.score);
    
    // Gauge Classifications
    const label = document.getElementById('score-class-label');
    label.textContent = data.classification.replace('_', ' ');
    if (data.classification === 'strong_clone') {
        label.className = 'score-label strong';
    } else if (data.classification === 'probable_clone') {
        label.className = 'score-label probable';
    } else {
        label.className = 'score-label not';
    }
    
    // 2. Breakdown bars
    const cfgPct = Math.round(data.sim_breakdown.cfg_similarity * 100);
    const dfgPct = Math.round(data.sim_breakdown.dfg_similarity * 100);
    const opPct = Math.round(data.sim_breakdown.opcode_similarity * 100);
    
    document.getElementById('cfg-sim-text').textContent = `${cfgPct}%`;
    document.getElementById('cfg-sim-fill').style.width = `${cfgPct}%`;
    document.getElementById('dfg-sim-text').textContent = `${dfgPct}%`;
    document.getElementById('dfg-sim-fill').style.width = `${dfgPct}%`;
    document.getElementById('opcode-sim-text').textContent = `${opPct}%`;
    document.getElementById('opcode-sim-fill').style.width = `${opPct}%`;
    
    // 3. Populate IRs
    const rawIr1 = document.getElementById('raw-ir-block-1');
    const rawIr2 = document.getElementById('raw-ir-block-2');
    const normIr1 = document.getElementById('norm-ir-block-1');
    const normIr2 = document.getElementById('norm-ir-block-2');
    
    rawIr1.textContent = data.raw_ir1;
    rawIr2.textContent = data.raw_ir2;
    normIr1.textContent = data.norm_ir1;
    normIr2.textContent = data.norm_ir2;
    
    Prism.highlightElement(rawIr1);
    Prism.highlightElement(rawIr2);
    Prism.highlightElement(normIr1);
    Prism.highlightElement(normIr2);
    
    // 4. Render Graphs CFG & DFG using Vis.js Networks
    renderVisNetwork('cfg-network-1', 'cfg1', data.cfg1, 'cfg');
    renderVisNetwork('cfg-network-2', 'cfg2', data.cfg2, 'cfg');
    renderVisNetwork('dfg-network-1', 'dfg1', data.dfg1, 'dfg');
    renderVisNetwork('dfg-network-2', 'dfg2', data.dfg2, 'dfg');
    
    showToast('Semantic comparison completed successfully!', 'success');
    
    // Refresh Corpus Explorer and Evaluation Center in real-time!
    fetchCorpusFiles();
    fetchEvaluationReport();
}

// ==========================================
// Vis.js Graph Rendering Logic
// ==========================================
function renderVisNetwork(containerId, stateNetId, graphData, type = 'cfg') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Format nodes and edges
    const visNodes = graphData.nodes.map(node => {
        let label = node.type.replace('Inst', '');
        if (node.code.includes('alloca')) label = 'Alloca';
        if (node.code.includes('store')) label = 'Store';
        if (node.code.includes('load')) label = 'Load';
        if (node.code.includes('sub')) label = 'Sub';
        if (node.code.includes('mul')) label = 'Mul';
        if (node.code.includes('icmp')) label = 'Compare';
        if (node.code.includes('call')) label = 'Call';
        if (node.code.includes('ret')) label = 'Return';
        if (node.code.includes('br')) label = 'Branch';
        
        return {
            id: node.id,
            label: label,
            title: node.code,
            shape: 'box',
            font: { face: 'Outfit', color: '#ffffff', size: 12 },
            color: {
                background: type === 'cfg' ? '#1e1b4b' : '#042f2e',
                border: type === 'cfg' ? '#6366f1' : '#0d9488',
                highlight: {
                    background: '#4f46e5',
                    border: '#818cf8'
                }
            },
            borderWidth: 1.5,
            shapeProperties: { borderRadius: 6 }
        };
    });
    
    const visEdges = graphData.edges.map(edge => {
        return {
            from: edge.source,
            to: edge.target,
            arrows: 'to',
            color: {
                color: type === 'cfg' ? 'rgba(99, 102, 241, 0.45)' : 'rgba(13, 148, 136, 0.45)',
                highlight: type === 'cfg' ? '#6366f1' : '#0d9488'
            },
            smooth: {
                enabled: true,
                type: 'cubicBezier',
                roundness: 0.5
            }
        };
    });
    
    const data = { nodes: visNodes, edges: visEdges };
    
    const options = {
        physics: {
            stabilization: {
                enabled: true,
                iterations: 150
            },
            barnesHut: {
                gravitationalConstant: -1200,
                centralGravity: 0.2,
                springLength: 70
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 100
        }
    };
    
    // Destroy previous network
    if (state.networks[stateNetId]) {
        state.networks[stateNetId].destroy();
    }
    
    const net = new vis.Network(container, data, options);
    state.networks[stateNetId] = net;
    
    // Stop physics once layout stabilizes and fit network perfectly inside container bounds
    net.on('stabilizationFinished', () => {
        net.setOptions({ physics: false });
        net.fit();
    });
}

// ==========================================
// Corpus Explorer Operations
// ==========================================
function fetchCorpusFiles() {
    const listContainer = document.getElementById('corpus-file-list');
    
    fetch('/api/corpus')
        .then(res => res.json())
        .then(data => {
            listContainer.innerHTML = '';
            
            if (!data.files || data.files.length === 0) {
                listContainer.innerHTML = '<div class="subtext">No C, C++, or Rust source files in corpus.</div>';
                return;
            }
            
            data.files.forEach(file => {
                const item = document.createElement('div');
                item.className = 'file-item';
                
                let iconClass = 'fa-file-code';
                if (file.language === 'c') iconClass = 'fa-solid fa-c';
                if (file.language === 'cpp') iconClass = 'fa-solid fa-heading';
                if (file.language === 'rust') iconClass = 'fa-brands fa-rust';
                
                item.innerHTML = `
                    <div class="file-meta-left">
                        <i class="${iconClass}"></i>
                        <div class="file-details">
                            <h5>${file.name}</h5>
                            <span>${file.path} (${Math.round(file.size)} bytes)</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted"></i>
                `;
                
                item.onclick = () => selectCorpusFile(file, item);
                listContainer.appendChild(item);
            });
            
            // Automatically select first file
            if (data.files.length > 0) {
                const firstItem = listContainer.firstElementChild;
                selectCorpusFile(data.files[0], firstItem);
            }
        })
        .catch(err => {
            listContainer.innerHTML = '<div class="subtext error">Failed to list corpus files.</div>';
            console.error(err);
        });
}

function selectCorpusFile(file, element) {
    // Remove active styles
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    state.selectedCorpusFile = file;
    
    document.getElementById('inspect-title').textContent = file.name;
    document.getElementById('inspect-meta').textContent = `Location: ${file.path} | Language: ${file.language.toUpperCase()} | Size: ${file.size} bytes`;
    
    // Fetch source code
    fetch(`/api/file-content?path=${file.path}`)
        .then(res => res.json())
        .then(data => {
            const codeEl = document.getElementById('ins-source-code');
            codeEl.textContent = data.content;
            codeEl.className = `language-${file.language}`;
            Prism.highlightElement(codeEl);
        })
        .catch(err => {
            document.getElementById('ins-source-code').textContent = `// Failed to load file: ${err.message}`;
        });
        
    // Fetch generated IR, Normalized, Fingerprints if they exist (based on naming convention)
    const baseStem = file.name.split('.')[0];
    const lang = file.language; // c, cpp, rust
    
    const irPath = `ir/${lang}/${baseStem}.ll`;
    const normPath = `normalized_ir/${lang}/${baseStem}.ll`;
    const fpPath = `fingerprints/${lang}_${baseStem}.json`;
    
    // Fetch IR
    fetch(`/api/file-content?path=${irPath}`)
        .then(res => res.json())
        .then(data => {
            const block = document.getElementById('ins-ir-code');
            if (data.error) {
                block.textContent = '; Intermediate LLVM IR file is missing.\n; Run the complete system analysis pipeline first.';
            } else {
                block.textContent = data.content;
            }
            Prism.highlightElement(block);
        });
        
    // Fetch Normalized IR
    fetch(`/api/file-content?path=${normPath}`)
        .then(res => res.json())
        .then(data => {
            const block = document.getElementById('ins-norm-code');
            if (data.error) {
                block.textContent = '; Normalized LLVM IR file is missing.\n; Run the complete system analysis pipeline first.';
            } else {
                block.textContent = data.content;
            }
            Prism.highlightElement(block);
        });
        
    // Fetch Fingerprint JSON
    fetch(`/api/file-content?path=${fpPath}`)
        .then(res => res.json())
        .then(data => {
            const block = document.getElementById('ins-fingerprint-code');
            if (data.error) {
                block.textContent = JSON.stringify({ "status": "Missing fingerprint file. Run analysis pipeline." }, null, 4);
            } else {
                block.textContent = data.content;
            }
            Prism.highlightElement(block);
        });
}

function runGlobalAnalysis() {
    const btn = document.getElementById('btn-reanalyze');
    const oldContent = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Full Pipeline...';
    
    showToast('Executing backend analyze pipeline. Please wait...', 'info');
    
    fetch('/api/analyze', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = oldContent;
            
            if (data.status === 'success') {
                showToast(`Analysis pipeline completed! CPG Extraction was: ${data.cpg_status}`, 'success');
                // Refresh views
                fetchCorpusFiles();
                fetchEvaluationReport();
            } else {
                showToast(`Pipeline execution failed: ${data.message}`, 'error');
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = oldContent;
            showToast(`API call failed: ${err.message}`, 'error');
        });
}

// ==========================================
// System Evaluation Suite
// ==========================================
function fetchEvaluationReport() {
    const tableBody = document.querySelector('#eval-pairs-table tbody');
    tableBody.innerHTML = '<tr><td colspan="5" class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Loading metric evaluation...</td></tr>';
    
    fetch('/api/evaluation')
        .then(res => res.json())
        .then(data => {
            // Metrics summary
            const m = data.metrics;
            document.getElementById('eval-f1-val').textContent = m.f1_score.toFixed(2);
            document.getElementById('eval-precision-val').textContent = m.precision.toFixed(2);
            document.getElementById('eval-recall-val').textContent = m.recall.toFixed(2);
            document.getElementById('eval-tp-val').textContent = `${m.true_positives} / ${m.true_positives + m.false_negatives}`;
            
            // Detail table
            tableBody.innerHTML = '';
            data.detailed_results.forEach(res => {
                const tr = document.createElement('tr');
                
                // Color badges
                const expClass = res.expected ? 'strong' : 'not';
                const expLabel = res.expected ? 'strong_clone' : 'not_clone';
                
                let outcomeClass = 'tp';
                let outcomeLabel = 'True Positive';
                
                if (res.detected && !res.expected) {
                    outcomeClass = 'fp';
                    outcomeLabel = 'False Positive';
                } else if (!res.detected && res.expected) {
                    outcomeClass = 'fn';
                    outcomeLabel = 'False Negative';
                } else if (!res.detected && !res.expected) {
                    outcomeClass = 'tn';
                    outcomeLabel = 'True Negative';
                }
                
                let scoreText = res.score ? res.score.toFixed(2) : '--';
                if (res.error) scoreText = 'Error';
                
                tr.innerHTML = `
                    <td><code>${res.file1}</code></td>
                    <td><code>${res.file2}</code></td>
                    <td><strong style="font-family: var(--font-mono);">${scoreText}</strong></td>
                    <td><span class="eval-table-badge ${expClass}">${expLabel}</span></td>
                    <td><span class="eval-outcome ${outcomeClass}"><i class="fa-solid fa-circle-chevron-right"></i> ${outcomeLabel}</span></td>
                `;
                tableBody.appendChild(tr);
            });
        })
        .catch(err => {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger);">Failed to calculate metric parameters: ${err.message}</td></tr>`;
            console.error(err);
        });
}

// ==========================================
// Custom File Uploader Integration
// ==========================================
function triggerFileUploader(id) {
    const input = document.getElementById(`file-input-${id}`);
    if (input) input.click();
}

function handleFileSelected(id, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Load into textarea
        const textarea = document.getElementById(`code-textarea-${id}`);
        textarea.value = content;
        
        // Auto-detect language from file extension
        const ext = file.name.split('.').pop().toLowerCase();
        let lang = 'c';
        if (ext === 'cpp' || ext === 'cc' || ext === 'cxx' || ext === 'hpp' || ext === 'h') {
            lang = 'cpp';
        } else if (ext === 'rs') {
            lang = 'rust';
        }
        
        // Set template dropdown to custom
        document.getElementById('template-select').value = 'custom';
        
        // Update UI dropdown select and call changeLanguage
        document.getElementById(`lang-select-${id}`).value = lang;
        changeLanguage(id, lang, file.name);
        
        showToast(`Loaded custom file: ${file.name} (${lang.toUpperCase()})`, 'success');
        
        // Clear value to allow selecting same file again
        inputElement.value = '';
    };
    reader.readAsText(file);
}

