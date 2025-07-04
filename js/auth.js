// Check if credentials exist in localStorage, otherwise initialize with demo user
let users = JSON.parse(localStorage.getItem('harmony_credentials')) || [
    {
        id: 1,
        name: "Suman Mandal",
        email: "sumanmandal@harmony.com",
        password: "90wu9y78gy",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Mentor",
        email: "mentor@harmony.com",
        password: "90wdowjiou",
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        name: "Jiten Zala",
        email: "jitenzala@harmony.com",
        password: ";mouhsiyx",
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        name: "Auysh Kapadiya",
        email: "ayushkapadiya@harmony.com",
        password: "rmwhiyony23",
        createdAt: new Date().toISOString()
    }
];

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('harmony_credentials', JSON.stringify(users));
}

// DOM Elements
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSubmit = document.getElementById('auth-submit');
const authSwitch = document.getElementById('switch-action');
const authFooter = document.getElementById('auth-switch');
const nameField = document.getElementById('name-field');
const confirmPasswordField = document.getElementById('confirm-password-field');
const loginOptions = document.getElementById('login-options');
const loadingScreen = document.getElementById('auth-loading');
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const landingNav = document.querySelector('.landing-nav');

// Check URL for action parameter
const urlParams = new URLSearchParams(window.location.search);
const action = urlParams.get('action') || 'login';

// Initialize form based on action
if (action === 'register') {
    showRegisterForm();
} else {
    showLoginForm();
}

// Toggle between login and register forms
if (authSwitch) {
    authSwitch.addEventListener('click', function (e) {
        e.preventDefault();
        if (authSubmit.textContent === 'Sign Up') {
            showLoginForm();
        } else {
            showRegisterForm();
        }
    });
}

// Toggle password visibility
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    });
}

// Form submission
if (authForm) {
    authForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (authSubmit.textContent === 'Sign Up') {
            // Registration logic
            const name = document.getElementById('name').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            // Check if user already exists
            const userExists = users.some(user => user.email === email);
            if (userExists) {
                alert('User with this email already exists!');
                return;
            }

            // Create new user
            const newUser = {
                id: users.length + 1,
                name,
                email,
                password,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveUsers();
            console.log('New user registered:', newUser);

            // Show success message and redirect to login
            alert('Registration successful! Please login with your credentials.');
            showLoginForm();
        } else {
            // Login logic
            const user = users.find(user => user.email === email && user.password === password);

            if (!user) {
                alert('Invalid email or password!');
                return;
            }

            // Show loading screen
            loadingScreen.classList.add('active');

            // Simulate loading time (2 seconds)
            setTimeout(() => {
                // Store user session
                sessionStorage.setItem('currentUser', JSON.stringify(user));

                // Redirect to app
                window.location.href = 'app.html';
            }, 2000);
        }
    });
}

function showLoginForm() {
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Please enter your details to access your dashboard';
    authSubmit.textContent = 'Sign In';
    authFooter.innerHTML = 'Don\'t have an account? <a href="login.html?action=register" id="switch-action">Sign up</a>';
    nameField.style.display = 'none';
    confirmPasswordField.style.display = 'none';
    loginOptions.style.display = 'flex';
}

function showRegisterForm() {
    authTitle.textContent = 'Create Account';
    authSubtitle.textContent = 'Get started with your free account today';
    authSubmit.textContent = 'Sign Up';
    authFooter.innerHTML = 'Already have an account? <a href="login.html?action=login" id="switch-action">Sign in</a>';
    nameField.style.display = 'block';
    confirmPasswordField.style.display = 'block';
    loginOptions.style.display = 'none';
}

// Check for authenticated user on app page
if (window.location.pathname.includes('app.html')) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        // Update UI with user's name
        document.getElementById('user-name').textContent = currentUser.name || currentUser.email.split('@')[0];
    }
}

// Landing page mobile navigation
if (mobileMenuBtn && landingNav) {
    mobileMenuBtn.addEventListener('click', function () {
        landingNav.style.display = landingNav.style.display === 'flex' ? 'none' : 'flex';
    });
}