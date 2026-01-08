// WebSocket helper (ES module)
export function createWS(url, onMessage, onOpen, onClose) {
    let ws = null;
    let available = false;
    let reconnect = 1000;

    function start() {
        try {
            console.log('[WS] Attempting to connect to:', url);
            ws = new WebSocket(url);
        } catch (e) {
            console.error('[WS] Failed to create WebSocket:', e);
            available = false;
            setTimeout(start, reconnect);
            return;
        }

        ws.addEventListener('open', () => {
            available = true;
            reconnect = 1000;
            console.log('[WS] Connected to:', url);
            if (onOpen) onOpen();
        });

        ws.addEventListener('message', (evt) => {
            try {
                const state = JSON.parse(evt.data);
                console.log('[WS] Received state:', state);
                if (onMessage) onMessage(state);
            } catch (e) {
                console.error('[WS] Invalid message:', e);
            }
        });

        ws.addEventListener('close', () => {
            console.log('[WS] Connection closed');
            available = false;
            if (onClose) onClose();
            try { ws.close(); } catch {}
            setTimeout(start, reconnect);
            reconnect = Math.min(5000, reconnect + 500);
        });

        ws.addEventListener('error', (err) => {
            console.error('[WS] Connection error:', err);
            available = false;
            try { ws.close(); } catch {}
        });
    }

    start();

    return {
        send(msg) {
            if (!ws || ws.readyState !== WebSocket.OPEN) return false;
            ws.send(JSON.stringify(msg));
            return true;
        },
        isAvailable() { return available; },
        close() { try { ws && ws.close(); } catch {} }
    };
}