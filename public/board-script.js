class TicketDashboard {
    constructor() {
        this.apiBase = '/api';
        this.tickets = [];
        this.filteredTickets = [];
        this.currentView = 'grid';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        this.loadTickets();
        this.setupAutoRefresh();
    }

    bindEvents() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadTickets());

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleView(e.target.dataset.view));
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priorityFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchFilter').addEventListener('input', () => this.applyFilters());

        // Modal close on background click
        document.getElementById('ticketModal').addEventListener('click', (e) => {
            if (e.target.id === 'ticketModal') {
                this.closeTicketModal();
            }
        });
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/auth/status`);
            const result = await response.json();

            if (result.success && result.isAuthenticated) {
                // Update user info
                const userInfo = document.getElementById('userInfo');
                userInfo.textContent = `👤 ${result.user.username}`;
            } else {
                // Not authenticated, redirect to login
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login';
        }
    }

    async handleLogout() {
        try {
            const response = await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            } else {
                this.showMessage('Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showMessage('Logout error', 'error');
        }
    }

    setupAutoRefresh() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.loadTickets(false); // Silent refresh
        }, 30000);
    }

    async loadTickets(showLoading = true) {
        if (showLoading) {
            this.showLoading(true);
        }

        try {
            const response = await fetch(`${this.apiBase}/tickets`);
            const result = await response.json();

            if (result.success) {
                this.tickets = result.data;
                this.applyFilters();
                this.updateStats();
            } else {
                this.showMessage('Error loading tickets', 'error');
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            this.showMessage('Network error loading tickets', 'error');
        } finally {
            if (showLoading) {
                this.showLoading(false);
            }
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        this.filteredTickets = this.tickets.filter(ticket => {
            const matchesStatus = !statusFilter || ticket.status === statusFilter;
            const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
            const matchesSearch = !searchFilter || 
                ticket.name.toLowerCase().includes(searchFilter) ||
                ticket.email.toLowerCase().includes(searchFilter) ||
                ticket.deviceName.toLowerCase().includes(searchFilter) ||
                ticket.description.toLowerCase().includes(searchFilter) ||
                ticket.id.toLowerCase().includes(searchFilter);

            return matchesStatus && matchesPriority && matchesSearch;
        });

        this.renderTickets();
    }

    renderTickets() {
        const container = document.getElementById('ticketsContainer');
        
        if (this.filteredTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎫</div>
                    <h3>No tickets found</h3>
                    <p>No tickets match your current filters, or no tickets have been submitted yet.</p>
                </div>
            `;
            return;
        }

        // Sort tickets by creation date (newest first)
        const sortedTickets = [...this.filteredTickets].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        container.innerHTML = sortedTickets.map(ticket => this.createTicketCard(ticket)).join('');

        // Add click handlers
        container.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', () => {
                const ticketId = card.dataset.ticketId;
                this.openTicketModal(ticketId);
            });
        });
    }

    createTicketCard(ticket) {
        const createdDate = new Date(ticket.createdAt).toLocaleDateString();
        const shortId = ticket.id.substring(0, 8);
        const truncatedDescription = ticket.description ? 
            (ticket.description.length > 100 ? ticket.description.substring(0, 100) + '...' : ticket.description) : 
            'No description provided';

        return `
            <div class="ticket-card" data-ticket-id="${ticket.id}">
                <div class="ticket-header">
                    <span class="ticket-id">#${shortId}</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="ticket-priority priority-${ticket.priority}">${ticket.priority}</span>
                        <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                    </div>
                </div>
                
                <div class="ticket-info">
                    <div class="ticket-customer">${this.escapeHtml(ticket.name)}</div>
                    <div class="ticket-device">📱 ${this.escapeHtml(ticket.deviceName)}</div>
                    <div class="ticket-description">${this.escapeHtml(truncatedDescription)}</div>
                </div>
                
                <div class="ticket-meta">
                    <span>${createdDate}</span>
                    <span class="ticket-assigned">
                        ${ticket.assignedTo ? `👤 ${this.escapeHtml(ticket.assignedTo)}` : '👤 Unassigned'}
                    </span>
                </div>
            </div>
        `;
    }

    async openTicketModal(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const modal = document.getElementById('ticketModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = `Ticket #${ticket.id.substring(0, 8)}`;
        
        modalBody.innerHTML = this.createTicketDetailView(ticket);
        
        modal.style.display = 'flex';
        
        // Bind events for the modal
        this.bindModalEvents(ticket);
    }

    createTicketDetailView(ticket) {
        const createdDate = new Date(ticket.createdAt).toLocaleString();
        const updatedDate = new Date(ticket.updatedAt).toLocaleString();
        
        return `
            <div class="ticket-detail">
                <div class="detail-section">
                    <h3>Customer Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Name:</label>
                            <span>${this.escapeHtml(ticket.name)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${this.escapeHtml(ticket.email)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${this.escapeHtml(ticket.phone)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Device:</label>
                            <span>${this.escapeHtml(ticket.deviceName)}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Issue Description</h3>
                    <div class="description-box">
                        ${ticket.description ? this.escapeHtml(ticket.description) : 'No description provided'}
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Ticket Management</h3>
                    <div class="management-grid">
                        <div class="management-item">
                            <label for="statusSelect">Status:</label>
                            <select id="statusSelect" data-ticket-id="${ticket.id}">
                                <option value="open" ${ticket.status === 'open' ? 'selected' : ''}>Open</option>
                                <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                        <div class="management-item">
                            <label for="prioritySelect">Priority:</label>
                            <select id="prioritySelect" data-ticket-id="${ticket.id}">
                                <option value="low" ${ticket.priority === 'low' ? 'selected' : ''}>Low</option>
                                <option value="medium" ${ticket.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="high" ${ticket.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="urgent" ${ticket.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                            </select>
                        </div>
                        <div class="management-item">
                            <label for="assignedToInput">Assigned To:</label>
                            <input type="text" id="assignedToInput" value="${ticket.assignedTo || ''}" 
                                   placeholder="Enter staff name" data-ticket-id="${ticket.id}">
                        </div>
                    </div>
                    <button class="update-btn" onclick="dashboard.updateTicket('${ticket.id}')">
                        Update Ticket
                    </button>
                </div>

                <div class="detail-section">
                    <h3>Add Note</h3>
                    <div class="note-section">
                        <textarea id="noteInput" placeholder="Add a note about this ticket..." rows="3"></textarea>
                        <input type="text" id="noteAuthor" placeholder="Your name" value="Staff">
                        <button class="add-note-btn" onclick="dashboard.addNote('${ticket.id}')">
                            Add Note
                        </button>
                    </div>
                </div>

                ${ticket.notes && ticket.notes.length > 0 ? `
                    <div class="detail-section">
                        <h3>Notes & Updates</h3>
                        <div class="notes-list">
                            ${ticket.notes.map(note => `
                                <div class="note-item">
                                    <div class="note-header">
                                        <strong>${this.escapeHtml(note.author)}</strong>
                                        <span class="note-time">${new Date(note.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div class="note-text">${this.escapeHtml(note.text)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-section">
                    <h3>Ticket Information</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Created:</label>
                            <span>${createdDate}</span>
                        </div>
                        <div class="info-item">
                            <label>Last Updated:</label>
                            <span>${updatedDate}</span>
                        </div>
                        <div class="info-item">
                            <label>Ticket ID:</label>
                            <span>${ticket.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindModalEvents(ticket) {
        // Auto-save on field changes
        const statusSelect = document.getElementById('statusSelect');
        const prioritySelect = document.getElementById('prioritySelect');
        const assignedToInput = document.getElementById('assignedToInput');

        if (statusSelect) {
            statusSelect.addEventListener('change', () => this.updateTicket(ticket.id));
        }
        if (prioritySelect) {
            prioritySelect.addEventListener('change', () => this.updateTicket(ticket.id));
        }
        if (assignedToInput) {
            assignedToInput.addEventListener('blur', () => this.updateTicket(ticket.id));
        }
    }

    async updateTicket(ticketId) {
        const statusSelect = document.getElementById('statusSelect');
        const prioritySelect = document.getElementById('prioritySelect');
        const assignedToInput = document.getElementById('assignedToInput');

        const updateData = {};

        if (statusSelect) updateData.status = statusSelect.value;
        if (prioritySelect) updateData.priority = prioritySelect.value;
        if (assignedToInput) updateData.assignedTo = assignedToInput.value.trim() || null;

        try {
            const response = await fetch(`${this.apiBase}/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Ticket updated successfully', 'success');
                this.loadTickets(false); // Refresh data silently
            } else {
                this.showMessage(result.message || 'Error updating ticket', 'error');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            this.showMessage('Network error updating ticket', 'error');
        }
    }

    async addNote(ticketId) {
        const noteInput = document.getElementById('noteInput');
        const noteAuthor = document.getElementById('noteAuthor');

        const note = noteInput.value.trim();
        const author = noteAuthor.value.trim() || 'Staff';

        if (!note) {
            this.showMessage('Please enter a note', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ note, author })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Note added successfully', 'success');
                noteInput.value = '';

                // Refresh the modal with updated data
                this.loadTickets(false);
                setTimeout(() => {
                    this.openTicketModal(ticketId);
                }, 500);
            } else {
                this.showMessage(result.message || 'Error adding note', 'error');
            }
        } catch (error) {
            console.error('Error adding note:', error);
            this.showMessage('Network error adding note', 'error');
        }
    }

    closeTicketModal() {
        document.getElementById('ticketModal').style.display = 'none';
    }

    toggleView(view) {
        this.currentView = view;

        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update container class
        const container = document.getElementById('ticketsContainer');
        container.classList.toggle('list-view', view === 'list');

        this.renderTickets();
    }

    updateStats() {
        const total = this.tickets.length;
        const open = this.tickets.filter(t => t.status === 'open').length;
        const inProgress = this.tickets.filter(t => t.status === 'in-progress').length;
        const resolved = this.tickets.filter(t => t.status === 'resolved').length;

        document.getElementById('totalTickets').textContent = total;
        document.getElementById('openTickets').textContent = open;
        document.getElementById('inProgressTickets').textContent = inProgress;
        document.getElementById('resolvedTickets').textContent = resolved;
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        container.appendChild(messageElement);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for modal
function closeTicketModal() {
    dashboard.closeTicketModal();
}

// Global dashboard instance
let dashboard;

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new TicketDashboard();
});

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
