document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('query-form');
    const apiUrlInput = document.getElementById('api-url');
    const modelInput = document.getElementById('model');
    const commandInput = document.getElementById('command');
    const argsInput = document.getElementById('args');
    const executeBtn = document.getElementById('execute-btn');
    const jsonOutput = document.getElementById('json-output');
    const executionTimeEl = document.getElementById('execution-time');
    const resultCountEl = document.getElementById('result-count');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const copyBtn = document.getElementById('copy-btn');

    // Init CodeMirror
    // @ts-ignore
    const editor = CodeMirror.fromTextArea(argsInput, {
        mode: "application/json",
        theme: "dracula",
        autoCloseBrackets: true,
        matchBrackets: true,
        lineNumbers: true,
        tabSize: 2,
        indentUnit: 2
    });

    // State
    let history = JSON.parse(localStorage.getItem('mongoShellHistory')) || [];

    // Initialize
    renderHistory();
    checkConnection();
    fetchModels();

    // Event Listeners
    form.addEventListener('submit', handleExecute);
    clearHistoryBtn.addEventListener('click', clearHistory);
    copyBtn.addEventListener('click', copyResults);

    // Auto-save API URL preference
    if (localStorage.getItem('mongoShellApiUrl')) {
        apiUrlInput.value = localStorage.getItem('mongoShellApiUrl');
    }

    apiUrlInput.addEventListener('change', () => {
        localStorage.setItem('mongoShellApiUrl', apiUrlInput.value);
        checkConnection();
        fetchModels();
    });

    async function fetchModels() {
        const apiUrl = apiUrlInput.value.replace(/\/mongo-shell\/?$/, '') + '/mongo-shell/models';
        const modelList = document.getElementById('model-list');

        try {
            const res = await fetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.models)) {
                    modelList.innerHTML = data.models.map(m => `<option value="${m}">`).join('');
                }
            }
        } catch (e) {
            console.warn('Failed to fetch models', e);
        }
    }

    async function handleExecute(e) {
        e.preventDefault();

        const apiUrl = apiUrlInput.value.trim();
        const model = modelInput.value.trim();
        const command = commandInput.value.trim();
        let argsRaw = editor.getValue().trim(); // Use editor value

        if (!argsRaw) {
            argsRaw = "[]";
        }

        let args;
        try {
            args = JSON.parse(argsRaw);
            if (!Array.isArray(args)) {
                throw new Error("Arguments must be an array");
            }
        } catch (err) {
            alert("Invalid JSON arguments: " + err.message);
            return;
        }

        setLoading(true);
        const startTime = performance.now();

        try {
            const payload = { model, command, args };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(0);

            displayResults(data, duration);
            addToHistory(model, command, argsRaw);

            if (data.success) {
                updateStatus('success', 'Connected');
            } else {
                updateStatus('error', 'Error');
            }

        } catch (error) {
            console.error(error);
            displayResults({
                success: false,
                message: "Network Error",
                error: error.message
            }, 0);
            updateStatus('error', 'Network Error');
        } finally {
            setLoading(false);
        }
    }

    function displayResults(data, duration) {
        // Format JSON with syntax highlighting
        const jsonStr = JSON.stringify(data, null, 2);
        jsonOutput.innerHTML = syntaxHighlight(jsonStr);

        // Update meta info
        executionTimeEl.textContent = `${duration}ms`;

        if (data.success) {
            resultCountEl.textContent = `${data.count} items`;
            resultCountEl.style.display = 'inline';
        } else {
            resultCountEl.style.display = 'none';
        }
    }

    function syntaxHighlight(json) {
        if (!json) return '';

        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    function addToHistory(model, command, args) {
        // Check if identical item exists at the top
        if (history.length > 0) {
            const last = history[0];
            if (last.model === model && last.command === command && last.args === args) {
                return;
            }
        }

        const item = {
            id: Date.now(),
            model,
            command,
            args,
            timestamp: new Date().toISOString()
        };

        history.unshift(item);
        if (history.length > 50) history.pop(); // Limit to 50 items

        localStorage.setItem('mongoShellHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No history yet</div>';
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-model">${item.model}</div>
                <div class="history-command">${item.command}(${truncate(item.args, 30)})</div>
            `;
            el.addEventListener('click', () => loadHistoryItem(item));
            historyList.appendChild(el);
        });
    }

    function loadHistoryItem(item) {
        modelInput.value = item.model;
        commandInput.value = item.command;
        editor.setValue(item.args); // Set editor value

        // Highlight active item
        document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    }

    function clearHistory() {
        if (confirm('Clear all history?')) {
            history = [];
            localStorage.removeItem('mongoShellHistory');
            renderHistory();
        }
    }

    function copyResults() {
        const text = jsonOutput.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }

    function setLoading(isLoading) {
        if (isLoading) {
            executeBtn.classList.add('loading');
            executeBtn.disabled = true;
        } else {
            executeBtn.classList.remove('loading');
            executeBtn.disabled = false;
        }
    }

    function updateStatus(type, text) {
        statusText.textContent = text;
        statusIndicator.className = 'status-indicator ' + type;
    }

    async function checkConnection() {
        // Simple health check or just assume ready until error
        updateStatus('', 'Ready');
    }

    function truncate(str, len) {
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    }
});
