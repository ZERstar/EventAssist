/**
 * Scanner Module
 * Handles QR code scanning functionality
 */

const Scanner = (function () {
    'use strict';

    let html5QrCode = null;
    let isScanning = false;
    let torchEnabled = false;
    let lastScanTime = 0;
    let lastScannedCode = '';

    const SCAN_COOLDOWN = 2000; // 2 seconds between same code scans

    /**
     * Initialize scanner
     */
    function init() {
        html5QrCode = new Html5Qrcode("scannerViewport");
    }

    /**
     * Start scanning
     */
    async function start(onSuccess, onError) {
        if (isScanning) return;

        const elements = UI.getElements().scanner;

        try {
            const cameras = await Html5Qrcode.getCameras();

            if (!cameras || cameras.length === 0) {
                UI.showToast('No camera found', 'error');
                return false;
            }

            // Prefer back camera on mobile
            let cameraId = cameras[0].id;
            for (const camera of cameras) {
                if (camera.label.toLowerCase().includes('back') ||
                    camera.label.toLowerCase().includes('rear')) {
                    cameraId = camera.id;
                    break;
                }
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1,
                disableFlip: false
            };

            await html5QrCode.start(
                cameraId,
                config,
                (decodedText) => handleScan(decodedText, onSuccess),
                () => { } // Ignore errors during scanning
            );

            isScanning = true;
            updateUI(true);

            // Enable torch button if supported
            try {
                const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
                if (capabilities.torchFeature && capabilities.torchFeature().isSupported()) {
                    elements.btnTorch.disabled = false;
                }
            } catch (e) {
                // Torch not supported
            }

            return true;
        } catch (err) {
            console.error('Error starting scanner:', err);
            UI.showToast('Failed to start camera', 'error');
            if (onError) onError(err);
            return false;
        }
    }

    /**
     * Stop scanning
     */
    async function stop() {
        if (!isScanning) return;

        try {
            await html5QrCode.stop();
            isScanning = false;
            torchEnabled = false;
            updateUI(false);
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    }

    /**
     * Toggle torch/flashlight
     */
    async function toggleTorch() {
        if (!isScanning) return;

        try {
            const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
            if (capabilities.torchFeature && capabilities.torchFeature().isSupported()) {
                torchEnabled = !torchEnabled;
                await capabilities.torchFeature().apply(torchEnabled);

                const elements = UI.getElements().scanner;
                elements.btnTorch.classList.toggle('btn--primary', torchEnabled);
                elements.btnTorch.classList.toggle('btn--secondary', !torchEnabled);
            }
        } catch (err) {
            console.error('Error toggling torch:', err);
        }
    }

    /**
     * Handle scanned QR code
     */
    function handleScan(decodedText, callback) {
        const now = Date.now();

        // Prevent rapid successive scans of the same code
        if (decodedText === lastScannedCode && now - lastScanTime < SCAN_COOLDOWN) {
            return;
        }

        lastScannedCode = decodedText;
        lastScanTime = now;

        // Vibrate feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(100);
        }

        // Play beep sound
        playBeep();

        if (callback) {
            callback(decodedText);
        }
    }

    /**
     * Play beep sound
     */
    function playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio not supported
        }
    }

    /**
     * Update scanning UI state
     */
    function updateUI(scanning) {
        const elements = UI.getElements().scanner;

        elements.btnStart.disabled = scanning;
        elements.btnStop.disabled = !scanning;
        elements.btnTorch.disabled = !scanning;

        if (scanning) {
            elements.overlay.classList.add('hidden');
            elements.frame.classList.add('active');
        } else {
            elements.overlay.classList.remove('hidden');
            elements.frame.classList.remove('active');
            elements.btnTorch.classList.remove('btn--primary');
            elements.btnTorch.classList.add('btn--secondary');
        }
    }

    /**
     * Check if currently scanning
     */
    function isActive() {
        return isScanning;
    }

    /**
     * Generate QR code
     * Uses davidshimjs-qrcodejs library which renders into a container element
     */
    function generateQR(container, text, size = 280) {
        if (!text) return false;

        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            UI.showToast('QR library not loaded. Please refresh.', 'error');
            return false;
        }

        try {
            // Clear any existing QR code
            container.innerHTML = '';

            // Create new QR code using davidshimjs-qrcodejs API
            new QRCode(container, {
                text: text,
                width: size,
                height: size,
                colorDark: '#1F1F1F',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });

            return true;
        } catch (err) {
            console.error('Error generating QR:', err);
            return false;
        }
    }

    // Public API
    return {
        init,
        start,
        stop,
        toggleTorch,
        isActive,
        generateQR,
        playBeep
    };
})();
