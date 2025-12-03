// WebSocket helper (ES module)
export function createWS(url, onMessage, onOpen, onClose) {
    let ws = null;
    let available = false;
    let reconnect = 1000;

    function start() {
        try {
            ws = new WebSocket(url);
        } catch (e) {
            available = false;
            setTimeout(start, reconnect);
            return;
        }

        ws.addEventListener('open', () => {
            available = true;
            reconnect = 1000;
            console.log('WS connected', url);
            if (onOpen) onOpen();
        });

        ws.addEventListener('message', (evt) => {
            try {
                const state = JSON.parse(evt.data);
                if (onMessage) onMessage(state);
            } catch (e) {
                console.error('invalid ws message', e);
            }
        });

        ws.addEventListener('close', () => {
            available = false;
            if (onClose) onClose();
            try { ws.close(); } catch {}
            setTimeout(start, reconnect);
            reconnect = Math.min(5000, reconnect + 500);
        });

        ws.addEventListener('error', (err) => {
            console.error('ws error', err);
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
