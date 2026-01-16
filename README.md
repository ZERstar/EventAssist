# 🎵 Event Assist - Check-In & Walk-In Management System

A lightweight, professional event management system designed for **The Sound Nexus** and similar events. Built as a Progressive Web App (PWA) with offline capabilities and mobile-first design.

![Event Assist Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Mobile Ready](https://img.shields.io/badge/Mobile-Ready-orange)

## ✨ Features

### 📱 QR Code Scanner
- Real-time camera-based QR code scanning
- Torch/flashlight support for low-light conditions
- Manual ticket ID entry as fallback
- Scan history with timestamps
- Audio/haptic feedback on successful scans

### 🚶 Walk-In Management
- Log walk-in customers with transaction ID
- Generate dynamic QR codes for payment links (Razorpay/Cashfree)
- Quantity selector with auto-calculated totals
- Real-time revenue tracking

### 📊 Dashboard
- Live statistics (Pre-registered, Checked-in, Walk-ins, Revenue)
- Full attendee list with search and filter
- Expandable attendee details
- Direct check-in/undo from list

### ⚙️ Settings
- Configurable event name, date, and ticket price
- Import attendees from JSON/CSV files
- Drag-and-drop file import
- Export functionality (Full backup, Check-in CSV, Walk-ins CSV, Summary)
- Data reset and clear options

### 💡 Technical Highlights
- **Zero dependencies** (core functionality) - just vanilla HTML/CSS/JS
- **Offline-capable** via localStorage
- **Mobile-first** responsive design
- **AAIKYAM brand** color scheme (dark theme with orange accents)
- **Modular architecture** with separated concerns

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)
```bash
cd /Users/tejas/Developer/EventAssist
python3 -m http.server 8080
```
Then open: http://localhost:8080

### Option 2: Live Server (VS Code)
Install the "Live Server" extension and click "Go Live"

### Option 3: Deploy to Static Host
Upload all files to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

## 📁 Project Structure

```
EventAssist/
├── index.html          # Main HTML entry point
├── css/
│   └── styles.css      # Complete styling (1497 lines)
├── js/
│   ├── storage.js      # LocalStorage data management
│   ├── ui.js           # UI components and utilities
│   ├── scanner.js      # QR code scanner functionality
│   ├── export.js       # Import/export functionality
│   └── app.js          # Main application logic
├── assets/             # Images and static assets
└── README.md           # This file
```

## 📦 Dependencies

**External CDN Libraries** (loaded automatically):
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) v2.3.8 - QR code scanning
- [qrcode](https://github.com/soldair/node-qrcode) v1.5.3 - QR code generation

## 💾 Data Storage

All data is stored in `localStorage` under the key `soundnexus_data`:

```javascript
{
  config: {
    eventName: "The Sound Nexus",
    eventDate: "2026-01-17",
    ticketPrice: 255,
    upiLink: ""
  },
  attendees: [
    {
      id: "REG-001",
      name: "Attendee Name",
      phone: "9876543210",
      email: "email@example.com",
      ticketType: "Regular",
      quantity: 1,
      amountPaid: 255,
      type: "PRE-REG",  // or "WALK-IN"
      checkedIn: false,
      checkInTime: null
    }
  ]
}
```

## 🔧 Customization

### Change Event Details
1. Go to **Settings** tab
2. Update Event Name, Date, and Ticket Price
3. Click **Save Configuration**

### Import Attendee List
Prepare a CSV file with columns:
- `id` - Unique ticket ID
- `name` - Attendee name
- `phone` - Contact number (optional)
- `email` - Email address (optional)
- `ticket_type` - Ticket category
- `quantity` - Number of tickets
- `amount` - Amount paid

Drag and drop onto the import zone in Settings.

### Branding Colors
Edit `css/styles.css` CSS custom properties:
```css
:root {
    --color-bg: #1F1F1F;          /* Background */
    --color-accent: #FB923C;       /* Orange accent */
    --color-success: #22C55E;      /* Green for check-in */
    --color-error: #EF4444;        /* Red for errors */
}
```

## 📱 Mobile Usage

1. Open the URL in mobile browser
2. Add to Home Screen for app-like experience
3. Grant camera permissions when prompted
4. Use the torch button in low-light venues

## 📤 Export Options

| Export Type | Format | Contents |
|-------------|--------|----------|
| Full Backup | JSON | All configuration and attendee data |
| Check-In CSV | CSV | Pre-registered attendees with check-in status |
| Walk-Ins CSV | CSV | All walk-in entries with transaction IDs |
| Summary | JSON | Event stats and revenue breakdown |

## 🧪 Testing

### Sample Data
The app comes with 5 sample pre-registered attendees for testing:
- REG-001 through REG-005
- Various ticket types and quantities

### Test Scenarios
1. **Scanner**: Use the manual entry with ID "REG-001"
2. **Walk-In**: Log a walk-in with any name and transaction ID
3. **Dashboard**: Search for "Priya" to filter the list
4. **Export**: Download a full backup to verify data

## 🔐 Security Notes

- All data is stored locally in the browser
- No data is sent to external servers
- Payment links are displayed as QR codes, not processed
- Clear all data option available for privacy

## 📝 License

MIT License - Feel free to use for your events!

---

**Built with ❤️ for Event Management**

*Last Updated: January 2026*
