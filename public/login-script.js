class LoginManager {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', (e) => this.handleLogin(e));

        // Auto-focus username field
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.focus();
            }
        }, 100);
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBase}/auth/status`);
            const result = await response.json();

            if (result.success && result.isAuthenticated) {
                // User is already logged in, redirect to dashboard
                this.showMessage('Already logged in, redirecting...', 'info');
                setTimeout(() => {
                    window.location.href = '/board';
                }, 1000);
            }
        } catch (error) {
            console.log('Auth status check failed:', error);
            // Continue with login page
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const form = e.target.tagName === 'FORM' ? e.target : document.getElementById('loginForm');
        const formData = new FormData(form);
        
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // Validate inputs
        if (!credentials.username || !credentials.password) {
            this.showMessage('Please enter both username and password', 'error');
            return;
        }

        // Show loading state
        this.setLoadingState(true);

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Clear form
                form.reset();
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/board';
                }, 1500);
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
                
                // Clear password field on failed login
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const loginBtn = document.querySelector('.login-btn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        if (loading) {
            loginBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
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

// Initialize the login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
