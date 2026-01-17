/**
 * Event Assist - Main Application
 * Event Check-In & Walk-In Management System
 */

const App = (function () {
    'use strict';

    // Payment links
    const PAYMENT_LINKS = {
        regular: 'https://payments.cashfree.com/forms/the-sound-nexus-ots',
        growthx: 'https://payments.cashfree.com/forms?code=the-sound-nexus-growthX'
    };

    let config = {};
    let walkInQty = 1;
    let currentPaymentType = 'regular';

    /**
     * Initialize the application
     */
    function init() {
        // Cache DOM elements
        UI.cacheElements();

        // Load data from storage
        Storage.load();
        config = Storage.getConfig();

        // Initialize scanner
        Scanner.init();

        // Set up event handlers
        setupNavigation();
        setupScanner();
        setupWalkIn();
        setupPaymentTabs();
        setupDashboard();
        setupSettings();
        setupOfflineDetection();

        // Initial render
        render();

        // Generate QR codes for both payment types
        generatePaymentQRs();

        console.log('🎵 Event Assist initialized');
    }

    /**
     * Render all UI components
     */
    function render() {
        const stats = Storage.getStats();
        config = Storage.getConfig();

        UI.updateHeader(config);
        UI.updateStats(stats, config);
        UI.populateSettings(config);
        UI.updateWalkInBadge(stats.walkIns);
        UI.updateQuantity(walkInQty, config.ticketPrice);
        updatePriceDisplays();

        renderAttendeeList();
        renderWalkInList();
    }

    /**
     * Update all price displays dynamically
     */
    function updatePriceDisplays() {
        // Regular price
        const basePrice = document.getElementById('basePrice');
        if (basePrice) {
            basePrice.textContent = UI.formatCurrency(config.ticketPrice);
        }

        // GrowthX price
        const growthxPrice = document.getElementById('growthxPrice');
        if (growthxPrice) {
            growthxPrice.textContent = UI.formatCurrency(config.growthxPrice);
        }
    }

    /**
     * Generate QR codes for both payment types
     */
    function generatePaymentQRs() {
        // Regular QR
        const regularCanvas = document.getElementById('qrCanvasRegular');
        if (regularCanvas) {
            Scanner.generateQR(regularCanvas, PAYMENT_LINKS.regular);
        }

        // GrowthX QR
        const growthxCanvas = document.getElementById('qrCanvasGrowthX');
        if (growthxCanvas) {
            Scanner.generateQR(growthxCanvas, PAYMENT_LINKS.growthx);
        }
    }


    /**
     * Set up navigation
     */
    function setupNavigation() {
        const elements = UI.getElements();

        elements.nav.buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                UI.switchTab(tab);

                // Stop scanner when leaving scanner tab
                if (tab !== 'scanner' && Scanner.isActive()) {
                    Scanner.stop();
                }

                // Refresh dashboard when switching to it
                if (tab === 'dashboard') {
                    renderAttendeeList();
                }
            });
        });
    }

    /**
     * Set up scanner functionality
     */
    function setupScanner() {
        const elements = UI.getElements().scanner;

        // Start scanner button
        elements.btnStart.addEventListener('click', () => {
            Scanner.start(handleScanResult);
        });

        // Stop scanner button
        elements.btnStop.addEventListener('click', () => {
            Scanner.stop();
        });

        // Torch button
        elements.btnTorch.addEventListener('click', () => {
            Scanner.toggleTorch();
        });

        // Manual check-in
        elements.btnManual.addEventListener('click', () => {
            const ticketId = elements.manualInput.value.trim();
            if (ticketId) {
                handleScanResult(ticketId);
                elements.manualInput.value = '';
            } else {
                elements.manualInput.classList.add('error');
                setTimeout(() => elements.manualInput.classList.remove('error'), 300);
            }
        });

        // Enter key in manual input
        elements.manualInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                elements.btnManual.click();
            }
        });
    }

    /**
     * Handle scan result
     */
    function handleScanResult(ticketId) {
        const attendee = Storage.findAttendee(ticketId);

        if (!attendee) {
            // Not found
            UI.showScanResult({
                type: 'error',
                name: 'Not Found',
                detail: `Ticket ID: ${ticketId}`,
                meta: 'This ticket is not in the system'
            });
            UI.addScanHistory({
                type: 'error',
                name: ticketId,
                time: new Date().toISOString()
            });
            UI.showToast('Ticket not found', 'error');
            return;
        }

        if (attendee.checkedIn) {
            // Already checked in
            UI.showScanResult({
                type: 'warning',
                name: attendee.name,
                detail: attendee.ticketType,
                meta: `Already checked in at ${UI.formatTime(attendee.checkInTime)}`
            });
            UI.addScanHistory({
                type: 'warning',
                name: attendee.name,
                time: new Date().toISOString()
            });
            UI.showToast('Already checked in', 'warning');
            return;
        }

        // Check in
        const result = Storage.checkIn(attendee.id);
        if (result) {
            UI.showScanResult({
                type: 'success',
                name: result.name,
                detail: `${result.ticketType} • ${result.quantity} ticket${result.quantity > 1 ? 's' : ''}`,
                meta: UI.formatCurrency(result.amountPaid)
            });
            UI.addScanHistory({
                type: 'success',
                name: result.name,
                time: result.checkInTime
            });
            UI.showToast(`${result.name} checked in!`, 'success');
            render();
        }
    }

    /**
     * Set up walk-in form functionality
     */
    function setupWalkIn() {
        const elements = UI.getElements().walkin;

        // Quantity controls for walk-in form
        elements.btnMinus.addEventListener('click', () => {
            if (walkInQty > 1) {
                walkInQty--;
                UI.updateQuantity(walkInQty, config.ticketPrice);
            }
        });

        elements.btnPlus.addEventListener('click', () => {
            if (walkInQty < 10) {
                walkInQty++;
                UI.updateQuantity(walkInQty, config.ticketPrice);
            }
        });

        // Walk-in form submission
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = elements.nameInput.value.trim();

            if (!name) {
                UI.showToast('Please enter customer name', 'error');
                return;
            }

            const walkIn = Storage.addWalkIn({
                name,
                quantity: walkInQty
            });

            if (walkIn) {
                UI.showToast(`Walk-in logged: ${name}`, 'success');

                // Reset form
                elements.nameInput.value = '';
                walkInQty = 1;

                render();
            }
        });
    }

    /**
     * Set up payment tabs with sliding indicator
     */
    function setupPaymentTabs() {
        const tabRegular = document.getElementById('tabRegular');
        const tabGrowthX = document.getElementById('tabGrowthX');
        const panelRegular = document.getElementById('panelRegular');
        const panelGrowthX = document.getElementById('panelGrowthX');
        const indicator = document.getElementById('tabIndicator');
        const btnCopyRegular = document.getElementById('btnCopyLinkRegular');
        const btnCopyGrowthX = document.getElementById('btnCopyLinkGrowthX');

        // Tab switching
        if (tabRegular) {
            tabRegular.addEventListener('click', () => {
                switchPaymentTab('regular');
            });
        }

        if (tabGrowthX) {
            tabGrowthX.addEventListener('click', () => {
                switchPaymentTab('growthx');
            });
        }

        function switchPaymentTab(type) {
            currentPaymentType = type;

            // Update tab active states
            tabRegular.classList.toggle('payment-tab--active', type === 'regular');
            tabGrowthX.classList.toggle('payment-tab--active', type === 'growthx');

            // Update panel visibility
            panelRegular.classList.toggle('payment-panel--active', type === 'regular');
            panelGrowthX.classList.toggle('payment-panel--active', type === 'growthx');

            // Slide indicator
            if (indicator) {
                indicator.classList.toggle('slide-right', type === 'growthx');
            }
        }

        // Copy link handlers
        if (btnCopyRegular) {
            btnCopyRegular.addEventListener('click', () => {
                copyToClipboard(PAYMENT_LINKS.regular, 'Regular payment link copied!');
            });
        }

        if (btnCopyGrowthX) {
            btnCopyGrowthX.addEventListener('click', () => {
                copyToClipboard(PAYMENT_LINKS.growthx, 'GrowthX payment link copied!');
            });
        }
    }

    /**
     * Copy text to clipboard with toast notification
     */
    async function copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            UI.showToast(message, 'success');
        } catch (e) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            UI.showToast(message, 'success');
        }
    }

    /**
     * Set up dashboard functionality
     */
    function setupDashboard() {
        const elements = UI.getElements().dashboard;

        // Search
        elements.searchInput.addEventListener('input', debounce(() => {
            renderAttendeeList();
        }, 300));

        // Filter
        elements.filterSelect.addEventListener('change', () => {
            renderAttendeeList();
        });

        // Export buttons
        elements.btnExportAll.addEventListener('click', () => {
            Export.exportFullBackup();
        });

        elements.btnExportCheckin.addEventListener('click', () => {
            Export.exportCheckIns();
        });

        elements.btnExportWalkins.addEventListener('click', () => {
            Export.exportWalkIns();
        });

        elements.btnExportSummary.addEventListener('click', () => {
            Export.exportSummary();
        });
    }

    /**
     * Render attendee list with search/filter
     */
    function renderAttendeeList() {
        const elements = UI.getElements().dashboard;
        let attendees = Storage.getAttendees();

        // Apply search
        const search = elements.searchInput.value.toLowerCase().trim();
        if (search) {
            attendees = attendees.filter(a =>
                a.name.toLowerCase().includes(search) ||
                a.id.toLowerCase().includes(search) ||
                (a.phone && a.phone.includes(search)) ||
                (a.email && a.email.toLowerCase().includes(search))
            );
        }

        // Apply filter
        const filter = elements.filterSelect.value;
        if (filter === 'checked') {
            attendees = attendees.filter(a => a.checkedIn && a.type === 'PRE-REG');
        } else if (filter === 'unchecked') {
            attendees = attendees.filter(a => !a.checkedIn && a.type === 'PRE-REG');
        } else if (filter === 'walkins') {
            attendees = attendees.filter(a => a.type === 'WALK-IN');
        }

        // Sort: checked in first, then by name
        attendees.sort((a, b) => {
            if (a.checkedIn && !b.checkedIn) return -1;
            if (!a.checkedIn && b.checkedIn) return 1;
            return a.name.localeCompare(b.name);
        });

        UI.renderAttendeeList(
            attendees,
            handleListCheckIn,
            handleUndoCheckIn,
            handleRemoveWalkIn
        );
    }

    /**
     * Render walk-in list
     */
    function renderWalkInList() {
        const walkIns = Storage.getAttendees()
            .filter(a => a.type === 'WALK-IN')
            .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));

        UI.renderWalkInList(walkIns, handleRemoveWalkIn);
    }

    /**
     * Handle check-in from list
     */
    function handleListCheckIn(id) {
        const result = Storage.checkIn(id);
        if (result) {
            UI.showToast(`${result.name} checked in!`, 'success');
            render();
        }
    }

    /**
     * Handle undo check-in
     */
    function handleUndoCheckIn(id) {
        const result = Storage.undoCheckIn(id);
        if (result) {
            UI.showToast(`Check-in undone for ${result.name}`, 'success');
            render();
        }
    }

    /**
     * Handle remove walk-in
     */
    function handleRemoveWalkIn(id) {
        const result = Storage.removeWalkIn(id);
        if (result) {
            UI.showToast('Walk-in removed', 'success');
            render();
        }
    }

    /**
     * Set up settings functionality
     */
    function setupSettings() {
        const elements = UI.getElements().settings;

        // Config form
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault();

            const newConfig = {
                eventName: elements.eventName.value.trim(),
                eventDate: elements.eventDate.value,
                ticketPrice: parseInt(elements.ticketPrice.value) || 0,
                growthxPrice: parseInt(elements.growthxPrice.value) || 0,
                upiLink: elements.upiLink.value.trim()
            };

            Storage.updateConfig(newConfig);
            config = newConfig;
            render();
            UI.showToast('Configuration saved', 'success');
        });

        // File import - Drop zone
        elements.dropZone.addEventListener('click', () => {
            elements.importFile.click();
        });

        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('dragover');
        });

        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('dragover');
        });

        elements.dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('dragover');

            const file = e.dataTransfer.files[0];
            if (file) {
                await handleFileImport(file);
            }
        });

        elements.importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleFileImport(file);
                e.target.value = ''; // Reset for same file
            }
        });

        // Reset check-ins
        elements.btnResetCheckins.addEventListener('click', () => {
            UI.showModal({
                icon: '🔄',
                title: 'Reset Check-Ins?',
                body: 'This will reset all pre-registered attendees to "not checked in" status. Walk-ins will not be affected.',
                actions: [
                    { label: 'Cancel', type: 'secondary' },
                    {
                        label: 'Reset',
                        type: 'warning',
                        handler: () => {
                            Storage.resetCheckIns();
                            render();
                            UI.showToast('All check-ins reset', 'success');
                        }
                    }
                ]
            });
        });

        // Clear all data
        elements.btnClearAll.addEventListener('click', () => {
            const confirmText = elements.deleteConfirm.value.trim();

            if (confirmText !== 'DELETE') {
                UI.showToast('Type DELETE to confirm', 'error');
                elements.deleteConfirm.classList.add('error');
                setTimeout(() => elements.deleteConfirm.classList.remove('error'), 300);
                return;
            }

            UI.showModal({
                icon: '⚠️',
                title: 'Clear All Data?',
                body: 'This will permanently delete ALL data including attendees and walk-ins. This action cannot be undone!',
                actions: [
                    { label: 'Cancel', type: 'secondary' },
                    {
                        label: 'Delete Everything',
                        type: 'danger',
                        handler: () => {
                            Storage.clearAll();
                            elements.deleteConfirm.value = '';
                            render();
                            UI.showToast('All data cleared', 'success');
                        }
                    }
                ]
            });
        });
    }

    /**
     * Handle file import
     */
    async function handleFileImport(file) {
        if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
            UI.showToast('Please upload a JSON or CSV file', 'error');
            return;
        }

        try {
            const result = await Export.importFile(file);
            UI.showToast(`Imported ${result.added} of ${result.total} attendees`, 'success');
            render();
        } catch (e) {
            UI.showToast(e.message || 'Import failed', 'error');
        }
    }

    /**
     * Set up offline detection
     */
    function setupOfflineDetection() {
        const updateStatus = () => {
            UI.setOfflineStatus(!navigator.onLine);
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    /**
     * Debounce utility
     */
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API (minimal, mostly internal)
    return {
        render
    };
})();
