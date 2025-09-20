const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (in production, store these securely)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10) // Default password: admin123
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'ticket-system-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    } else {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        } else {
            return res.redirect('/login');
        }
    }
}

// Authentication routes (BEFORE static files)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check credentials
        if (username === ADMIN_CREDENTIALS.username &&
            bcrypt.compareSync(password, ADMIN_CREDENTIALS.password)) {

            req.session.isAuthenticated = true;
            req.session.username = username;

            res.json({
                success: true,
                message: 'Login successful',
                user: { username }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login error',
            error: error.message
        });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout error'
            });
        }
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});

app.get('/api/auth/status', (req, res) => {
    res.json({
        success: true,
        isAuthenticated: !!(req.session && req.session.isAuthenticated),
        user: req.session && req.session.isAuthenticated ?
              { username: req.session.username } : null
    });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add some debugging for deployment
console.log('📁 Current directory:', __dirname);
console.log('📁 Public directory:', path.join(__dirname, 'public'));

// Check if public directory exists before trying to read it
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
    console.log('📁 Files in public:', fs.readdirSync(publicDir).join(', '));
} else {
    console.log('❌ Public directory does not exist!');
    console.log('📁 Available directories:', fs.readdirSync(__dirname).filter(item =>
        fs.statSync(path.join(__dirname, item)).isDirectory()
    ).join(', '));
}

// Data persistence setup
const DATA_FILE = path.join(__dirname, 'tickets.json');

// Load tickets from file or initialize empty array
let tickets = [];

function loadTickets() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            tickets = JSON.parse(data);
            console.log(`📁 Loaded ${tickets.length} tickets from storage`);
        } else {
            tickets = [];
            console.log('📁 No existing ticket data found, starting fresh');
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        tickets = [];
    }
}

function saveTickets() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
        console.log(`💾 Saved ${tickets.length} tickets to storage`);
    } catch (error) {
        console.error('Error saving tickets:', error);
    }
}

// Load tickets on startup
loadTickets();

// Ticket validation function
function validateTicket(ticket) {
    const errors = [];
    
    if (!ticket.name || ticket.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    if (!ticket.phone || ticket.phone.trim().length === 0) {
        errors.push('Phone number is required');
    }
    
    if (!ticket.email || ticket.email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.email)) {
        errors.push('Invalid email format');
    }
    
    if (!ticket.deviceName || ticket.deviceName.trim().length === 0) {
        errors.push('Device name is required');
    }
    
    return errors;
}

// API Routes

// Get all tickets
app.get('/api/tickets', (req, res) => {
    try {
        res.json({
            success: true,
            data: tickets,
            count: tickets.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving tickets',
            error: error.message
        });
    }
});

// Get a specific ticket by ID
app.get('/api/tickets/:id', (req, res) => {
    try {
        const ticket = tickets.find(t => t.id === req.params.id);
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving ticket',
            error: error.message
        });
    }
});

// Create a new ticket
app.post('/api/tickets', (req, res) => {
    try {
        const { name, phone, email, deviceName, description } = req.body;
        
        // Validate required fields
        const validationErrors = validateTicket(req.body);
        
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        // Create new ticket
        const newTicket = {
            id: uuidv4(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            deviceName: deviceName.trim(),
            description: description ? description.trim() : '',
            status: 'open',
            priority: 'medium',
            assignedTo: null,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        tickets.push(newTicket);
        saveTickets(); // Persist to file

        res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: newTicket
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating ticket',
            error: error.message
        });
    }
});

// Update ticket status (protected)
app.patch('/api/tickets/:id', requireAuth, (req, res) => {
    try {
        const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
        
        if (ticketIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        const { status, assignedTo, priority, note } = req.body;

        let updated = false;

        if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            tickets[ticketIndex].status = status;
            updated = true;
        }

        if (assignedTo !== undefined) {
            tickets[ticketIndex].assignedTo = assignedTo;
            updated = true;
        }

        if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
            tickets[ticketIndex].priority = priority;
            updated = true;
        }

        if (note && note.trim()) {
            if (!tickets[ticketIndex].notes) {
                tickets[ticketIndex].notes = [];
            }
            tickets[ticketIndex].notes.push({
                id: uuidv4(),
                text: note.trim(),
                author: req.body.author || 'Staff',
                timestamp: new Date().toISOString()
            });
            updated = true;
        }

        if (updated) {
            tickets[ticketIndex].updatedAt = new Date().toISOString();
            saveTickets(); // Persist changes
        }

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: tickets[ticketIndex]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating ticket',
            error: error.message
        });
    }
});

// Delete a ticket (protected)
app.delete('/api/tickets/:id', requireAuth, (req, res) => {
    try {
        const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
        
        if (ticketIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }
        
        const deletedTicket = tickets.splice(ticketIndex, 1)[0];
        saveTickets(); // Persist changes

        res.json({
            success: true,
            message: 'Ticket deleted successfully',
            data: deletedTicket
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting ticket',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve different pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'submit.html'));
});

app.get('/submit', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'submit.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Protected staff routes
app.get('/board', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'board.html'));
});

app.get('/ticket/:id', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ticket-detail.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🎫 Ticket Management System v2.0 running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/tickets`);
});

module.exports = app;
