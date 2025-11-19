let socket = null;
let reconnectInterval = null;
let logCount = 0;

function updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connectionStatus');
    statusElement.className = `connection-status ${status}`;
    statusElement.querySelector('span').textContent = message;
}

function addLogEntry(type, data) {
    const logContainer = document.getElementById('logContainer');
    const noLogsElement = document.getElementById('noLogs');

    if (noLogsElement) {
        noLogsElement.remove();
    }

    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;

    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    });

    logEntry.innerHTML = `
                <div class="timestamp">${timestamp}</div>
                <span class="log-type">${type}</span>
                <div class="log-content">${parseAnsiToHtml(data)}</div>
            `;

    logContainer.appendChild(logEntry);

    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;

    // Keep only last 1000 logs for performance
    logCount++;
    if (logCount > 1000) {
        logContainer.removeChild(logContainer.firstChild);
        logCount--;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseAnsiToHtml(text) {
    // ANSI color code mappings
    const ansiColors = {
        '0': 'reset',
        '1': 'bold',
        '30': '#45475a', // black
        '31': '#f38ba8', // red
        '32': '#a6e3a1', // green
        '33': '#f9e2af', // yellow
        '34': '#89b4fa', // blue
        '35': '#f5c2e7', // magenta
        '36': '#94e2d5', // cyan
        '37': '#bac2de', // white
        '90': '#6c7086', // bright black (gray)
        '91': '#f38ba8', // bright red
        '92': '#a6e3a1', // bright green
        '93': '#f9e2af', // bright yellow
        '94': '#89b4fa', // bright blue
        '95': '#f5c2e7', // bright magenta
        '96': '#94e2d5', // bright cyan
        '97': '#cdd6f4'  // bright white
    };

    let result = escapeHtml(text);
    let currentStyles = [];

    // Replace ANSI escape sequences
    result = result.replace(/\x1b\[([0-9;]*)m/g, (match, codes) => {
        if (!codes) codes = '0';

        const codeList = codes.split(';');
        let html = '';

        codeList.forEach(code => {
            if (code === '0' || code === '') {
                // Reset - close all spans
                html += '</span>'.repeat(currentStyles.length);
                currentStyles = [];
            } else if (code === '1') {
                // Bold
                currentStyles.push('font-weight: bold');
                html += '<span style="font-weight: bold;">';
            } else if (ansiColors[code]) {
                // Color
                const color = ansiColors[code];
                if (color !== 'reset' && color !== 'bold') {
                    currentStyles.push(`color: ${color}`);
                    html += `<span style="color: ${color};">`;
                }
            }
        });

        return html;
    });

    // Close any remaining open spans
    result += '</span>'.repeat(currentStyles.length);

    return result;
}

function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        return;
    }

    updateConnectionStatus('connecting', 'Connecting...');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/logs`;

    socket = new WebSocket(wsUrl);

    socket.onopen = function(event) {
        console.log('WebSocket connected');
        updateConnectionStatus('connected', 'Connected');
        clearInterval(reconnectInterval);
        addLogEntry('stdout', 'WebSocket connection established');
    };

    socket.onmessage = function(event) {
        try {
            const message = JSON.parse(event.data);
            addLogEntry(message.type, message.data);
        } catch (error) {
            console.error('Error parsing message:', error);
            addLogEntry('stderr', `Error parsing message: ${error.message}`);
        }
    };

    socket.onclose = function(event) {
        console.log('WebSocket disconnected:', event);
        updateConnectionStatus('disconnected', 'Disconnected');
        addLogEntry('stderr', `WebSocket connection closed (Code: ${event.code})`);

        // Auto-reconnect after 3 seconds
        if (!reconnectInterval) {
            reconnectInterval = setInterval(connectWebSocket, 3000);
        }
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        updateConnectionStatus('disconnected', 'Connection Error');
        addLogEntry('stderr', 'WebSocket connection error');
    };
}

function clearLogs() {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '<div class="no-logs" id="noLogs">Logs cleared. Waiting for new logs...</div>';
    logCount = 0;
}

function reconnect() {
    if (socket) {
        socket.close();
    }
    clearInterval(reconnectInterval);
    reconnectInterval = null;
    setTimeout(connectWebSocket, 100);
}

// Initialize connection when page loads
document.addEventListener('DOMContentLoaded', function() {
    connectWebSocket();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && socket && socket.readyState !== WebSocket.OPEN) {
        reconnect();
    }
});

// Handle window focus
window.addEventListener('focus', function() {
    if (socket && socket.readyState !== WebSocket.OPEN) {
        reconnect();
    }
});