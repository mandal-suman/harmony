// Main application controller
document.addEventListener('DOMContentLoaded', function () {
    // Theme switcher
    const themeSwitch = document.getElementById('theme-switch');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Check for saved theme preference or use the system preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.body.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }

    // Listen for theme switch changes
    themeSwitch.addEventListener('change', function () {
        if (this.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // Navigation between sections
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetSection = this.getAttribute('data-section');

            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Show target section
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
        });
    });

    // Initialize modules
    initDashboard();
    initGoals();
    initHabits();
    initJournal();
    initVisionBoard();
});

// Dashboard Module
function initDashboard() {
    // Quotes data
    const quotes = [
        {
            text: "The secret of getting ahead is getting started.",
            author: "Mark Twain"
        },
        {
            text: "You don't have to be great to start, but you have to start to be great.",
            author: "Zig Ziglar"
        },
        {
            text: "The future depends on what you do today.",
            author: "Mahatma Gandhi"
        },
        {
            text: "Success is the sum of small efforts, repeated day in and day out.",
            author: "Robert Collier"
        },
        {
            text: "Your time is limited, don't waste it living someone else's life.",
            author: "Steve Jobs"
        }
    ];

    // Set random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById('daily-quote').textContent = `"${randomQuote.text}"`;
    document.getElementById('quote-author').textContent = `- ${randomQuote.author}`;

    // Update stats
    updateDashboardStats();
}

function updateDashboardStats() {
    // Get goals from localStorage
    const goals = JSON.parse(localStorage.getItem('goals')) || [];
    const activeGoals = goals.filter(goal => goal.status !== 'completed').length;
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;

    // Get habits from localStorage
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const today = new Date().toISOString().split('T')[0];
    let habitsCompletedToday = 0;

    habits.forEach(habit => {
        if (habit.completedDates && habit.completedDates.includes(today)) {
            habitsCompletedToday++;
        }
    });

    // Update stats display
    document.getElementById('active-goals-stat').innerHTML = `<span>${activeGoals}</span>`;
    document.getElementById('completed-goals-stat').innerHTML = `<span>${completedGoals}</span>`;
    document.getElementById('habits-today-stat').innerHTML = `<span>${habitsCompletedToday}</span>`;

    // Calculate and display overall progress
    const totalItems = goals.length + habits.length;
    const completedItems = completedGoals + habitsCompletedToday;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    document.querySelector('.progress-percent').textContent = `${progressPercent}%`;
    const circle = document.querySelector('.progress-ring-circle');
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Update recent journal entry
    updateRecentJournal();
}

function updateRecentJournal() {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    if (entries.length > 0) {
        const recentEntry = entries[0]; // Most recent entry
        const entryDate = new Date(recentEntry.date).toLocaleDateString();
        document.getElementById('recent-journal-content').innerHTML = `
            <p><strong>${entryDate}</strong></p>
            <p>${recentEntry.content}</p>
        `;
    }
}

// Add event listener for the journal button on dashboard
document.getElementById('add-journal-btn')?.addEventListener('click', function () {
    document.querySelector('.nav-btn[data-section="journal"]').click();
});

// Mobile navigation
document.querySelectorAll('.mobile-menu-btn').forEach(button => {
    button.addEventListener('click', function () {
        const targetSection = this.getAttribute('data-section');

        // Update active button
        document.querySelectorAll('.mobile-menu-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        this.classList.add('active');

        // Also update the regular nav if visible
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-section') === targetSection) {
                btn.classList.add('active');
            }
        });

        // Show target section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(targetSection).classList.add('active');

        // Scroll to top
        window.scrollTo(0, 0);
    });
});

// Handle window resize
window.addEventListener('resize', function () {
    // Close any open modals if screen gets too small
    if (window.innerWidth < 768) {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Prevent zooming on input focus on mobile
document.addEventListener('DOMContentLoaded', function () {
    let viewport = document.querySelector('meta[name="viewport"]');

    window.addEventListener('focusin', function () {
        if (window.innerWidth < 768) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        }
    });

    window.addEventListener('focusout', function () {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
    });
});