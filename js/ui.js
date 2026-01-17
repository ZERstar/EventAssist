/**
 * UI Module
 * Handles user interface components and interactions
 */

const UI = (function () {
    'use strict';

    // DOM Elements cache
    const elements = {};

    /**
     * Cache commonly used DOM elements
     */
    function cacheElements() {
        elements.header = {
            eventName: document.getElementById('eventName'),
            eventDate: document.getElementById('eventDate'),
            offlineBadge: document.getElementById('offlineBadge')
        };

        elements.nav = {
            container: document.getElementById('mainNav'),
            buttons: document.querySelectorAll('.nav__btn'),
            walkinBadge: document.getElementById('walkinBadge')
        };

        elements.tabs = {
            scanner: document.getElementById('scannerTab'),
            walkin: document.getElementById('walkinTab'),
            dashboard: document.getElementById('dashboardTab'),
            settings: document.getElementById('settingsTab')
        };

        elements.scanner = {
            viewport: document.getElementById('scannerViewport'),
            overlay: document.getElementById('scannerOverlay'),
            frame: document.getElementById('scannerFrame'),
            btnStart: document.getElementById('btnStartScanner'),
            btnStop: document.getElementById('btnStopScanner'),
            btnTorch: document.getElementById('btnTorch'),
            result: document.getElementById('scanResult'),
            resultIcon: document.getElementById('scanResultIcon'),
            resultName: document.getElementById('scanResultName'),
            resultDetail: document.getElementById('scanResultDetail'),
            resultMeta: document.getElementById('scanResultMeta'),
            history: document.getElementById('scanHistory'),
            manualInput: document.getElementById('manualIdInput'),
            btnManual: document.getElementById('btnManualCheckin')
        };

        elements.walkin = {
            form: document.getElementById('walkinForm'),
            nameInput: document.getElementById('walkinName'),
            qtyValue: document.getElementById('qtyValue'),
            qtyTotal: document.getElementById('qtyTotal'),
            btnMinus: document.getElementById('btnQtyMinus'),
            btnPlus: document.getElementById('btnQtyPlus'),
            count: document.getElementById('walkinCount'),
            revenue: document.getElementById('walkinRevenue'),
            list: document.getElementById('walkinList'),
            // Payment QR elements
            btnCopyLink: document.getElementById('btnCopyLink'),
            qrDisplay: document.getElementById('qrDisplay'),
            qrCanvas: document.getElementById('qrCanvas'),
            // Payment info element
            basePrice: document.getElementById('basePrice')
        };

        elements.dashboard = {
            statRegistered: document.getElementById('statRegistered'),
            statCheckedIn: document.getElementById('statCheckedIn'),
            statPercentage: document.getElementById('statPercentage'),
            statWalkins: document.getElementById('statWalkins'),
            statRevenue: document.getElementById('statRevenue'),
            searchInput: document.getElementById('searchInput'),
            filterSelect: document.getElementById('filterSelect'),
            attendeeList: document.getElementById('attendeeList'),
            btnExportAll: document.getElementById('btnExportAll'),
            btnExportCheckin: document.getElementById('btnExportCheckin'),
            btnExportWalkins: document.getElementById('btnExportWalkins'),
            btnExportSummary: document.getElementById('btnExportSummary')
        };

        elements.settings = {
            form: document.getElementById('configForm'),
            eventName: document.getElementById('configEventName'),
            eventDate: document.getElementById('configEventDate'),
            ticketPrice: document.getElementById('configTicketPrice'),
            growthxPrice: document.getElementById('configGrowthxPrice'),
            upiLink: document.getElementById('configUpiLink'),
            dropZone: document.getElementById('dropZone'),
            importFile: document.getElementById('importFile'),
            btnResetCheckins: document.getElementById('btnResetCheckins'),
            deleteConfirm: document.getElementById('deleteConfirm'),
            btnClearAll: document.getElementById('btnClearAll')
        };

        elements.footer = {
            checkedIn: document.getElementById('footerCheckedIn'),
            walkins: document.getElementById('footerWalkins'),
            revenue: document.getElementById('footerRevenue')
        };

        elements.toast = document.getElementById('toastContainer');
        elements.modal = {
            container: document.getElementById('modal'),
            icon: document.getElementById('modalIcon'),
            title: document.getElementById('modalTitle'),
            body: document.getElementById('modalBody'),
            actions: document.getElementById('modalActions')
        };
    }

    /**
     * Get cached elements
     */
    function getElements() {
        return elements;
    }

    /**
     * Switch active tab
     */
    function switchTab(tabName) {
        // Update nav buttons
        elements.nav.buttons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('nav__btn--active');
            } else {
                btn.classList.remove('nav__btn--active');
            }
        });

        // Update tab visibility
        Object.entries(elements.tabs).forEach(([name, tab]) => {
            if (name === tabName) {
                tab.classList.add('tab--active');
            } else {
                tab.classList.remove('tab--active');
            }
        });
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'success') {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <span class="toast__icon">${icons[type]}</span>
            <span class="toast__message">${message}</span>
        `;

        elements.toast.appendChild(toast);

        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Show modal dialog
     */
    function showModal(options) {
        const { icon, title, body, actions } = options;

        elements.modal.icon.innerHTML = icon || '';
        elements.modal.title.textContent = title || '';
        elements.modal.body.innerHTML = body || '';
        elements.modal.actions.innerHTML = '';

        if (actions && actions.length) {
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `btn btn--${action.type || 'secondary'}`;
                btn.textContent = action.label;
                btn.onclick = () => {
                    hideModal();
                    if (action.handler) action.handler();
                };
                elements.modal.actions.appendChild(btn);
            });
        }

        elements.modal.container.classList.add('show');
    }

    /**
     * Hide modal
     */
    function hideModal() {
        elements.modal.container.classList.remove('show');
    }

    /**
     * Update header with event info
     */
    function updateHeader(config) {
        elements.header.eventName.textContent = config.eventName;

        // Format date
        const date = new Date(config.eventDate);
        const formatted = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        elements.header.eventDate.textContent = formatted;
    }

    /**
     * Update stats displays
     */
    function updateStats(stats, config) {
        // Dashboard stats
        animateValue(elements.dashboard.statRegistered, stats.preRegistered);
        animateValue(elements.dashboard.statCheckedIn, stats.preRegCheckedIn);
        elements.dashboard.statPercentage.textContent = `${stats.checkInPercentage}%`;
        animateValue(elements.dashboard.statWalkins, stats.walkIns);
        elements.dashboard.statRevenue.textContent = formatCurrency(stats.totalRevenue);

        // Footer stats
        elements.footer.checkedIn.textContent = `${stats.preRegCheckedIn}/${stats.preRegistered}`;
        elements.footer.walkins.textContent = stats.walkIns;
        elements.footer.revenue.textContent = formatCurrency(stats.walkInRevenue);

        // Walk-in section stats
        elements.walkin.count.textContent = stats.walkIns;
        elements.walkin.revenue.textContent = formatCurrency(stats.walkInRevenue);

        // Update base price display
        if (elements.walkin.basePrice) {
            elements.walkin.basePrice.textContent = formatCurrency(config.ticketPrice);
        }
    }

    /**
     * Update payment display with quantity and total
     */
    function updatePaymentDisplay(qty, price) {
        if (elements.walkin.payQtyValue) {
            elements.walkin.payQtyValue.textContent = qty;
        }
        if (elements.walkin.ticketCount) {
            elements.walkin.ticketCount.textContent = qty;
        }
        if (elements.walkin.totalPayAmount) {
            elements.walkin.totalPayAmount.textContent = formatCurrency(qty * price);
        }
        if (elements.walkin.basePrice) {
            elements.walkin.basePrice.textContent = formatCurrency(price);
        }
    }

    /**
     * Animate value update
     */
    function animateValue(element, value) {
        if (element) {
            element.textContent = value;
            element.classList.add('updating');
            setTimeout(() => element.classList.remove('updating'), 250);
        }
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return `₹${amount.toLocaleString('en-IN')}`;
    }

    /**
     * Format time
     */
    function formatTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Show scan result
     */
    function showScanResult(result) {
        const { type, name, detail, meta } = result;

        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕'
        };

        elements.scanner.result.className = `scan-result show scan-result--${type}`;
        elements.scanner.resultIcon.textContent = icons[type];
        elements.scanner.resultName.textContent = name;
        elements.scanner.resultDetail.textContent = detail || '';
        elements.scanner.resultMeta.textContent = meta || '';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideScanResult();
        }, 5000);
    }

    /**
     * Hide scan result
     */
    function hideScanResult() {
        elements.scanner.result.classList.remove('show');
    }

    /**
     * Add to scan history
     */
    function addScanHistory(item) {
        const { type, name, time } = item;

        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕'
        };

        // Remove empty state if present
        const emptyState = elements.scanner.history.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const historyItem = document.createElement('div');
        historyItem.className = 'scan-history__item';
        historyItem.innerHTML = `
            <div class="scan-history__icon scan-history__icon--${type}">${icons[type]}</div>
            <div class="scan-history__info">
                <div class="scan-history__name">${name}</div>
                <div class="scan-history__time">${formatTime(time)}</div>
            </div>
        `;

        elements.scanner.history.insertBefore(historyItem, elements.scanner.history.firstChild);

        // Keep only last 10 entries
        while (elements.scanner.history.children.length > 10) {
            elements.scanner.history.lastChild.remove();
        }
    }

    /**
     * Render attendee list
     */
    function renderAttendeeList(attendees, onCheckin, onUndo, onRemove) {
        if (!attendees.length) {
            elements.dashboard.attendeeList.innerHTML = `
                <div class="empty-state">
                    <p>No attendees found</p>
                </div>
            `;
            return;
        }

        elements.dashboard.attendeeList.innerHTML = attendees.map(a => `
            <div class="attendee" data-id="${a.id}">
                <div class="attendee__header">
                    <div class="attendee__info">
                        <div class="attendee__name">${a.name}</div>
                        <div class="attendee__meta">
                            <span>${a.id}</span>
                            ${a.phone ? `<span>📞 ${a.phone}</span>` : ''}
                            <span>${a.ticketType}</span>
                        </div>
                    </div>
                    <div class="attendee__status">
                        ${getStatusBadge(a)}
                        ${a.checkInTime ? `<span class="attendee__time">${formatTime(a.checkInTime)}</span>` : ''}
                    </div>
                </div>
                <div class="attendee__details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-item__label">Ticket ID</div>
                            <div class="detail-item__value">${a.id}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-item__label">Quantity</div>
                            <div class="detail-item__value">${a.quantity}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-item__label">Amount</div>
                            <div class="detail-item__value">${formatCurrency(a.amountPaid)}</div>
                        </div>
                        ${a.email ? `
                        <div class="detail-item">
                            <div class="detail-item__label">Email</div>
                            <div class="detail-item__value">${a.email}</div>
                        </div>
                        ` : ''}
                        ${a.transactionId ? `
                        <div class="detail-item">
                            <div class="detail-item__label">Transaction ID</div>
                            <div class="detail-item__value">${a.transactionId}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="attendee__actions">
                        ${getActionButtons(a)}
                    </div>
                </div>
            </div>
        `).join('');

        // Set up event handlers
        setupAttendeeHandlers(onCheckin, onUndo, onRemove);
    }

    /**
     * Get status badge HTML
     */
    function getStatusBadge(attendee) {
        if (attendee.type === 'WALK-IN') {
            return '<span class="status-badge status-badge--walkin">Walk-In</span>';
        }
        if (attendee.checkedIn) {
            return '<span class="status-badge status-badge--checked">✓ Checked In</span>';
        }
        return '<span class="status-badge status-badge--unchecked">Not Checked</span>';
    }

    /**
     * Get action buttons HTML
     */
    function getActionButtons(attendee) {
        if (attendee.type === 'WALK-IN') {
            return '<button class="btn btn--danger btn-remove" data-id="' + attendee.id + '">Remove Walk-In</button>';
        }
        if (attendee.checkedIn) {
            return '<button class="btn btn--secondary btn-undo" data-id="' + attendee.id + '">Undo Check-In</button>';
        }
        return '<button class="btn btn--success btn-checkin" data-id="' + attendee.id + '">Check In</button>';
    }

    /**
     * Set up attendee list handlers
     */
    function setupAttendeeHandlers(onCheckin, onUndo, onRemove) {
        // Expand/collapse
        elements.dashboard.attendeeList.querySelectorAll('.attendee').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.btn')) return;
                el.classList.toggle('expanded');
            });
        });

        // Check-in buttons
        elements.dashboard.attendeeList.querySelectorAll('.btn-checkin').forEach(btn => {
            btn.addEventListener('click', () => {
                if (onCheckin) onCheckin(btn.dataset.id);
            });
        });

        // Undo buttons
        elements.dashboard.attendeeList.querySelectorAll('.btn-undo').forEach(btn => {
            btn.addEventListener('click', () => {
                if (onUndo) onUndo(btn.dataset.id);
            });
        });

        // Remove buttons
        elements.dashboard.attendeeList.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                if (onRemove) onRemove(btn.dataset.id);
            });
        });
    }

    /**
     * Render walk-in list
     */
    function renderWalkInList(walkIns, onRemove) {
        if (!walkIns.length) {
            elements.walkin.list.innerHTML = `
                <div class="empty-state empty-state--sm">
                    <p>No walk-ins yet</p>
                </div>
            `;
            return;
        }

        elements.walkin.list.innerHTML = walkIns.map(w => `
            <div class="walkin-item" data-id="${w.id}">
                <div class="walkin-item__info">
                    <h4>${w.name}</h4>
                    <div class="walkin-item__meta">
                        ${w.quantity} ticket${w.quantity > 1 ? 's' : ''} • ${formatTime(w.checkInTime)}
                        ${w.transactionId ? ` • TXN: ${w.transactionId}` : ''}
                    </div>
                </div>
                <span class="walkin-item__amount">${formatCurrency(w.amountPaid)}</span>
            </div>
        `).join('');

        // Set up click handler for removal
        elements.walkin.list.querySelectorAll('.walkin-item').forEach(item => {
            item.addEventListener('click', () => {
                showModal({
                    icon: '🗑️',
                    title: 'Remove Walk-In?',
                    body: 'This will remove the walk-in entry. This action cannot be undone.',
                    actions: [
                        { label: 'Cancel', type: 'secondary' },
                        {
                            label: 'Remove',
                            type: 'danger',
                            handler: () => {
                                if (onRemove) onRemove(item.dataset.id);
                            }
                        }
                    ]
                });
            });
        });
    }

    /**
     * Update walk-in badge
     */
    function updateWalkInBadge(count) {
        elements.nav.walkinBadge.textContent = count > 0 ? count : '';
    }

    /**
     * Show/hide offline badge
     */
    function setOfflineStatus(isOffline) {
        if (isOffline) {
            elements.header.offlineBadge.classList.add('show');
        } else {
            elements.header.offlineBadge.classList.remove('show');
        }
    }

    /**
     * Update quantity display
     */
    function updateQuantity(qty, price) {
        elements.walkin.qtyValue.textContent = qty;
        elements.walkin.qtyTotal.textContent = `= ${formatCurrency(qty * price)}`;
    }

    /**
     * Show QR code
     */
    function showQR(show = true) {
        if (show) {
            elements.walkin.qrDisplay.classList.add('show');
            elements.walkin.btnCopyLink.style.display = 'inline-flex';
        } else {
            elements.walkin.qrDisplay.classList.remove('show');
            elements.walkin.btnCopyLink.style.display = 'none';
        }
    }

    /**
     * Populate settings form
     */
    function populateSettings(config) {
        elements.settings.eventName.value = config.eventName;
        elements.settings.eventDate.value = config.eventDate;
        elements.settings.ticketPrice.value = config.ticketPrice;
        elements.settings.growthxPrice.value = config.growthxPrice || 219;
        elements.settings.upiLink.value = config.upiLink || '';
    }

    // Public API
    return {
        cacheElements,
        getElements,
        switchTab,
        showToast,
        showModal,
        hideModal,
        updateHeader,
        updateStats,
        showScanResult,
        hideScanResult,
        addScanHistory,
        renderAttendeeList,
        renderWalkInList,
        updateWalkInBadge,
        setOfflineStatus,
        updateQuantity,
        updatePaymentDisplay,
        showQR,
        populateSettings,
        formatCurrency,
        formatTime
    };
})();
