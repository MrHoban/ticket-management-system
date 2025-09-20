class TicketApp {
    constructor() {
        this.apiBase = '/api';
        this.tickets = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTickets();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('ticketForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        refreshBtn.addEventListener('click', () => this.loadTickets());
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const ticketData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            deviceName: formData.get('deviceName'),
            description: formData.get('description')
        };

        try {
            const response = await fetch(`${this.apiBase}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ticketData)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Ticket submitted successfully!', 'success');
                e.target.reset();
                this.loadTickets(); // Refresh the board
            } else {
                this.showMessage(result.message || 'Error submitting ticket', 'error');
                if (result.errors) {
                    result.errors.forEach(error => {
                        this.showMessage(error, 'error');
                    });
                }
            }
        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showMessage('Network error. Please try again.', 'error');
        }
    }

    async loadTickets() {
        const boardElement = document.getElementById('ticketBoard');
        boardElement.innerHTML = '<div class="loading">Loading tickets...</div>';

        try {
            const response = await fetch(`${this.apiBase}/tickets`);
            const result = await response.json();

            if (result.success) {
                this.tickets = result.data;
                this.renderTickets();
                this.updateStats();
            } else {
                this.showMessage('Error loading tickets', 'error');
                boardElement.innerHTML = '<div class="empty-state"><h3>Error loading tickets</h3></div>';
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
            this.showMessage('Network error loading tickets', 'error');
            boardElement.innerHTML = '<div class="empty-state"><h3>Network error</h3></div>';
        }
    }

    renderTickets() {
        const boardElement = document.getElementById('ticketBoard');
        
        if (this.tickets.length === 0) {
            boardElement.innerHTML = `
                <div class="empty-state">
                    <h3>No tickets yet</h3>
                    <p>Submit your first ticket using the form on the left</p>
                </div>
            `;
            return;
        }

        // Sort tickets by creation date (newest first)
        const sortedTickets = [...this.tickets].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        boardElement.innerHTML = sortedTickets.map(ticket => this.createTicketCard(ticket)).join('');
    }

    createTicketCard(ticket) {
        const createdDate = new Date(ticket.createdAt).toLocaleString();
        const shortId = ticket.id.substring(0, 8);
        
        return `
            <div class="ticket-card">
                <div class="ticket-header">
                    <span class="ticket-id">#${shortId}</span>
                    <span class="ticket-status status-${ticket.status}">${ticket.status}</span>
                </div>
                
                <div class="ticket-info">
                    <div class="info-item">
                        <span class="info-label">Name</span>
                        <span class="info-value">${this.escapeHtml(ticket.name)}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Phone</span>
                        <span class="info-value">${this.escapeHtml(ticket.phone)}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${this.escapeHtml(ticket.email)}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Device</span>
                        <span class="info-value">${this.escapeHtml(ticket.deviceName)}</span>
                    </div>
                </div>
                
                ${ticket.description ? `
                    <div class="ticket-description">
                        "${this.escapeHtml(ticket.description)}"
                    </div>
                ` : ''}
                
                <div class="ticket-timestamp">
                    Created: ${createdDate}
                </div>
            </div>
        `;
    }

    updateStats() {
        const totalElement = document.getElementById('totalTickets');
        totalElement.textContent = `Total: ${this.tickets.length}`;
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
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketApp();
});

// Add some utility functions for potential Python integration
window.TicketAPI = {
    async getAllTickets() {
        const response = await fetch('/api/tickets');
        return response.json();
    },
    
    async createTicket(ticketData) {
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData)
        });
        return response.json();
    },
    
    async updateTicketStatus(ticketId, status) {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return response.json();
    }
};
