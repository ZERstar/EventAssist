/**
 * Export Module
 * Handles data export functionality
 */

const Export = (function () {
    'use strict';

    /**
     * Download data as JSON file
     */
    function downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        download(blob, filename);
    }

    /**
     * Download data as CSV file
     */
    function downloadCSV(data, filename, columns) {
        const headers = columns.map(c => c.label).join(',');
        const rows = data.map(item => {
            return columns.map(c => {
                let value = item[c.key];

                // Format specific values
                if (c.key === 'checkInTime' && value) {
                    value = new Date(value).toLocaleString();
                }
                if (c.key === 'checkedIn') {
                    value = value ? 'Yes' : 'No';
                }
                if (typeof value === 'string') {
                    // Escape quotes and wrap in quotes if contains comma
                    value = value.replace(/"/g, '""');
                    if (value.includes(',') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }
                return value ?? '';
            }).join(',');
        });

        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        download(blob, filename);
    }

    /**
     * Trigger file download
     */
    function download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export full backup
     */
    function exportFullBackup() {
        const data = Storage.getExportData();
        const config = Storage.getConfig();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `${config.eventName.replace(/\s+/g, '_')}_backup_${timestamp}.json`;

        downloadJSON(data, filename);
        UI.showToast('Full backup exported', 'success');
    }

    /**
     * Export check-ins CSV
     */
    function exportCheckIns() {
        const attendees = Storage.getAttendees().filter(a => a.type === 'PRE-REG');
        const config = Storage.getConfig();
        const timestamp = new Date().toISOString().slice(0, 10);

        const columns = [
            { key: 'id', label: 'Ticket ID' },
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'ticketType', label: 'Ticket Type' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'amountPaid', label: 'Amount Paid' },
            { key: 'checkedIn', label: 'Checked In' },
            { key: 'checkInTime', label: 'Check-In Time' }
        ];

        downloadCSV(attendees, `${config.eventName.replace(/\s+/g, '_')}_checkins_${timestamp}.csv`, columns);
        UI.showToast('Check-ins exported', 'success');
    }

    /**
     * Export walk-ins CSV
     */
    function exportWalkIns() {
        const walkIns = Storage.getAttendees().filter(a => a.type === 'WALK-IN');
        const config = Storage.getConfig();
        const timestamp = new Date().toISOString().slice(0, 10);

        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'quantity', label: 'Tickets' },
            { key: 'amountPaid', label: 'Amount' },
            { key: 'transactionId', label: 'Transaction ID' },
            { key: 'checkInTime', label: 'Time' }
        ];

        downloadCSV(walkIns, `${config.eventName.replace(/\s+/g, '_')}_walkins_${timestamp}.csv`, columns);
        UI.showToast('Walk-ins exported', 'success');
    }

    /**
     * Export summary report
     */
    function exportSummary() {
        const config = Storage.getConfig();
        const stats = Storage.getStats();
        const timestamp = new Date().toISOString().slice(0, 10);

        const summary = {
            event: {
                name: config.eventName,
                date: config.eventDate,
                ticketPrice: config.ticketPrice
            },
            statistics: {
                preRegistered: stats.preRegistered,
                checkedIn: stats.preRegCheckedIn,
                checkInPercentage: `${stats.checkInPercentage}%`,
                walkIns: stats.walkIns,
                totalAttendees: stats.preRegCheckedIn + stats.walkIns,
                preRegRevenue: stats.totalRevenue - stats.walkInRevenue,
                walkInRevenue: stats.walkInRevenue,
                totalRevenue: stats.totalRevenue
            },
            exportedAt: new Date().toISOString()
        };

        downloadJSON(summary, `${config.eventName.replace(/\s+/g, '_')}_summary_${timestamp}.json`);
        UI.showToast('Summary exported', 'success');
    }

    /**
     * Parse CSV content
     */
    function parseCSV(content) {
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const records = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const record = {};

            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });

            // Map common field names
            const mapped = {
                id: record.id || record.ticket_id || record.booking_id || `IMP-${Date.now()}-${i}`,
                name: record.name || record.full_name || record.customer_name || 'Unknown',
                phone: record.phone || record.mobile || record.contact || null,
                email: record.email || null,
                ticketType: record.ticket_type || record.type || 'Regular',
                quantity: parseInt(record.quantity || record.tickets || 1) || 1,
                amountPaid: parseInt(record.amount || record.amount_paid || record.total || 0) || 0
            };

            records.push(mapped);
        }

        return records;
    }

    /**
     * Parse a single CSV line (handling quoted fields)
     */
    function parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    /**
     * Parse JSON content
     */
    function parseJSON(content) {
        try {
            const data = JSON.parse(content);

            // Handle full backup format
            if (data.attendees && Array.isArray(data.attendees)) {
                return data.attendees.filter(a => a.type === 'PRE-REG' || !a.type);
            }

            // Handle array format
            if (Array.isArray(data)) {
                return data;
            }

            return [];
        } catch (e) {
            console.error('JSON parse error:', e);
            return [];
        }
    }

    /**
     * Import file
     */
    async function importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                let records = [];

                if (file.name.endsWith('.csv')) {
                    records = parseCSV(content);
                } else if (file.name.endsWith('.json')) {
                    records = parseJSON(content);
                }

                if (records.length > 0) {
                    const added = Storage.importAttendees(records);
                    resolve({ total: records.length, added });
                } else {
                    reject(new Error('No valid records found'));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Public API
    return {
        exportFullBackup,
        exportCheckIns,
        exportWalkIns,
        exportSummary,
        importFile
    };
})();
