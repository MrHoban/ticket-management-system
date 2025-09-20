class TicketSubmission {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupFormValidation();
    }

    bindEvents() {
        const form = document.getElementById('ticketForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    setupFormValidation() {
        const inputs = document.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error styling
        this.clearFieldError(field);

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        } else if (field.type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
            if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#f56565';
        field.style.backgroundColor = '#fed7d7';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = '#c53030';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '5px';
        errorElement.textContent = message;
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.style.borderColor = '#e2e8f0';
        field.style.backgroundColor = 'white';
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        const form = e.target;
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isFormValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showMessage('Please fix the errors above before submitting', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        const formData = new FormData(form);
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
                this.showSuccessPage(result.data);
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
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const submitBtn = document.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    showSuccessPage(ticketData) {
        const form = document.querySelector('.ticket-form');
        const successMessage = document.getElementById('successMessage');
        const ticketIdElement = document.getElementById('ticketId');

        // Hide form and show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Display ticket ID (first 8 characters)
        ticketIdElement.textContent = `#${ticketData.id.substring(0, 8)}`;

        // Add animation
        successMessage.style.opacity = '0';
        successMessage.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            successMessage.style.transition = 'all 0.5s ease';
            successMessage.style.opacity = '1';
            successMessage.style.transform = 'translateY(0)';
        }, 100);
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
}

// Global function for "Submit Another" button
function submitAnother() {
    const form = document.querySelector('.ticket-form');
    const successMessage = document.getElementById('successMessage');
    
    // Reset form
    form.reset();
    
    // Clear any existing errors
    const errorElements = document.querySelectorAll('.field-error');
    errorElements.forEach(error => error.remove());
    
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#e2e8f0';
        input.style.backgroundColor = 'white';
    });
    
    // Show form and hide success message
    successMessage.style.display = 'none';
    form.style.display = 'flex';
    
    // Focus on first input
    document.getElementById('name').focus();
}

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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketSubmission();
});
