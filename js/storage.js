/**
 * Storage Module
 * Handles all localStorage operations and data management
 */

const Storage = (function () {
    'use strict';

    const STORAGE_KEY = 'soundnexus_data';

    // Default configuration
    const DEFAULT_CONFIG = {
        eventName: 'The Sound Nexus',
        eventDate: '2026-01-17',
        ticketPrice: 255,
        growthxPrice: 219,
        upiLink: ''
    };

    // Sample attendees for testing
    const SAMPLE_ATTENDEES = [
        {
            id: 'REG-001',
            name: 'Priya Sharma',
            phone: '9876543210',
            email: 'priya@example.com',
            ticketType: 'Regular',
            quantity: 1,
            amountPaid: 255,
            type: 'PRE-REG',
            checkedIn: false,
            checkInTime: null
        },
        {
            id: 'REG-002',
            name: 'Rahul Kumar',
            phone: '9876543211',
            email: 'rahul@example.com',
            ticketType: 'Regular',
            quantity: 2,
            amountPaid: 510,
            type: 'PRE-REG',
            checkedIn: false,
            checkInTime: null
        },
        {
            id: 'REG-003',
            name: 'Ananya Patel',
            phone: '9876543212',
            email: 'ananya@example.com',
            ticketType: 'VIP',
            quantity: 1,
            amountPaid: 255,
            type: 'PRE-REG',
            checkedIn: false,
            checkInTime: null
        },
        {
            id: 'REG-004',
            name: 'Vikram Singh',
            phone: '9876543213',
            email: 'vikram@example.com',
            ticketType: 'Regular',
            quantity: 3,
            amountPaid: 765,
            type: 'PRE-REG',
            checkedIn: false,
            checkInTime: null
        },
        {
            id: 'REG-005',
            name: 'Neha Gupta',
            phone: '9876543214',
            email: 'neha@example.com',
            ticketType: 'Regular',
            quantity: 1,
            amountPaid: 255,
            type: 'PRE-REG',
            checkedIn: false,
            checkInTime: null
        }
    ];

    // Current app data
    let appData = {
        config: { ...DEFAULT_CONFIG },
        attendees: []
    };

    /**
     * Load data from localStorage
     */
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                appData = {
                    config: { ...DEFAULT_CONFIG, ...parsed.config },
                    attendees: parsed.attendees || []
                };
            } else {
                // First time - load sample data
                appData.attendees = [...SAMPLE_ATTENDEES];
                save();
            }
        } catch (e) {
            console.error('Error loading data:', e);
            appData.attendees = [...SAMPLE_ATTENDEES];
            save();
        }
        return appData;
    }

    /**
     * Save data to localStorage
     */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    }

    /**
     * Get current config
     */
    function getConfig() {
        return { ...appData.config };
    }

    /**
     * Update config
     */
    function updateConfig(newConfig) {
        appData.config = { ...appData.config, ...newConfig };
        save();
        return appData.config;
    }

    /**
     * Get all attendees
     */
    function getAttendees() {
        return [...appData.attendees];
    }

    /**
     * Find attendee by ID
     */
    function findAttendee(ticketId) {
        const normalizedId = ticketId.toLowerCase().trim();
        return appData.attendees.find(a =>
            a.id.toLowerCase() === normalizedId ||
            a.id.toLowerCase().endsWith(normalizedId) ||
            normalizedId.endsWith(a.id.toLowerCase())
        );
    }

    /**
     * Check in an attendee
     */
    function checkIn(attendeeId) {
        const attendee = appData.attendees.find(a => a.id === attendeeId);
        if (attendee && !attendee.checkedIn) {
            attendee.checkedIn = true;
            attendee.checkInTime = new Date().toISOString();
            save();
            return attendee;
        }
        return null;
    }

    /**
     * Undo check-in
     */
    function undoCheckIn(attendeeId) {
        const attendee = appData.attendees.find(a => a.id === attendeeId);
        if (attendee && attendee.type === 'PRE-REG') {
            attendee.checkedIn = false;
            attendee.checkInTime = null;
            save();
            return attendee;
        }
        return null;
    }

    /**
     * Add a walk-in
     */
    function addWalkIn(data) {
        const walkIn = {
            id: `WALKIN-${Date.now()}`,
            name: data.name,
            phone: null,
            email: null,
            ticketType: 'Walk-In',
            quantity: data.quantity,
            amountPaid: data.quantity * appData.config.ticketPrice,
            type: 'WALK-IN',
            checkedIn: true,
            checkInTime: new Date().toISOString(),
            transactionId: data.transactionId
        };

        appData.attendees.push(walkIn);
        save();
        return walkIn;
    }

    /**
     * Remove a walk-in
     */
    function removeWalkIn(id) {
        const index = appData.attendees.findIndex(a => a.id === id && a.type === 'WALK-IN');
        if (index > -1) {
            const removed = appData.attendees.splice(index, 1)[0];
            save();
            return removed;
        }
        return null;
    }

    /**
     * Import attendees
     */
    function importAttendees(newAttendees) {
        let added = 0;
        const ticketPrice = appData.config.ticketPrice;

        newAttendees.forEach(item => {
            const exists = appData.attendees.some(a => a.id === item.id);
            if (!exists) {
                appData.attendees.push({
                    id: item.id || `IMP-${Date.now()}-${added}`,
                    name: item.name || 'Unknown',
                    phone: item.phone || null,
                    email: item.email || null,
                    ticketType: item.ticketType || item.ticket_type || 'Regular',
                    quantity: parseInt(item.quantity) || 1,
                    amountPaid: parseInt(item.amountPaid || item.amount_paid || item.amount) || ticketPrice,
                    type: 'PRE-REG',
                    checkedIn: false,
                    checkInTime: null
                });
                added++;
            }
        });

        if (added > 0) save();
        return added;
    }

    /**
     * Reset all check-ins
     */
    function resetCheckIns() {
        appData.attendees.forEach(a => {
            if (a.type === 'PRE-REG') {
                a.checkedIn = false;
                a.checkInTime = null;
            }
        });
        save();
    }

    /**
     * Clear all data
     */
    function clearAll() {
        localStorage.removeItem(STORAGE_KEY);
        appData = {
            config: { ...DEFAULT_CONFIG },
            attendees: [...SAMPLE_ATTENDEES]
        };
        save();
    }

    /**
     * Get statistics
     */
    function getStats() {
        const preReg = appData.attendees.filter(a => a.type === 'PRE-REG');
        const walkIns = appData.attendees.filter(a => a.type === 'WALK-IN');
        const preRegCheckedIn = preReg.filter(a => a.checkedIn);
        const totalCheckedIn = appData.attendees.filter(a => a.checkedIn);
        const totalRevenue = appData.attendees.reduce((sum, a) => sum + a.amountPaid, 0);
        const walkInRevenue = walkIns.reduce((sum, a) => sum + a.amountPaid, 0);

        return {
            preRegistered: preReg.length,
            preRegCheckedIn: preRegCheckedIn.length,
            totalCheckedIn: totalCheckedIn.length,
            walkIns: walkIns.length,
            totalRevenue,
            walkInRevenue,
            checkInPercentage: preReg.length > 0
                ? Math.round((preRegCheckedIn.length / preReg.length) * 100)
                : 0
        };
    }

    /**
     * Get full data for export
     */
    function getExportData() {
        return JSON.parse(JSON.stringify(appData));
    }

    // Public API
    return {
        load,
        save,
        getConfig,
        updateConfig,
        getAttendees,
        findAttendee,
        checkIn,
        undoCheckIn,
        addWalkIn,
        removeWalkIn,
        importAttendees,
        resetCheckIns,
        clearAll,
        getStats,
        getExportData
    };
})();
