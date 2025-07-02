// Habits Module
function initHabits() {
    // Load habits from localStorage
    loadHabits();

    // Set up event listeners
    document.getElementById('add-habit-btn').addEventListener('click', showHabitModal);
    document.getElementById('cancel-habit-btn').addEventListener('click', hideHabitModal);
    document.getElementById('habit-form').addEventListener('submit', saveHabit);
    document.querySelectorAll('.close-modal')[1].addEventListener('click', hideHabitModal);

    // Set up habit calendar
    renderHabitCalendar();
}

function loadHabits() {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habitsList = document.getElementById('habits-list');

    habitsList.innerHTML = '';

    if (habits.length === 0) {
        habitsList.innerHTML = '<p class="empty-message">No habits yet. Add your first habit!</p>';
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    habits.forEach(habit => {
        const habitItem = document.createElement('div');
        habitItem.className = 'habit-item';
        habitItem.dataset.id = habit.id;

        // Calculate streak
        const streak = calculateStreak(habit.completedDates || []);

        habitItem.innerHTML = `
            <input type="checkbox" class="habit-checkbox" ${habit.completedDates?.includes(today) ? 'checked' : ''}>
            <div class="habit-info">
                <div class="habit-name">${habit.name}</div>
                <div class="habit-meta">
                    <span>${habit.frequency}</span>
                    <span class="habit-streak">${streak} day${streak !== 1 ? 's' : ''} streak</span>
                </div>
            </div>
            <div class="habit-actions">
                <button class="edit-habit" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-habit" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Add event listeners
        const checkbox = habitItem.querySelector('.habit-checkbox');
        checkbox.addEventListener('change', () => toggleHabitCompletion(habit.id, checkbox.checked));

        habitItem.querySelector('.edit-habit').addEventListener('click', () => editHabit(habit.id));
        habitItem.querySelector('.delete-habit').addEventListener('click', () => deleteHabit(habit.id));

        habitsList.appendChild(habitItem);
    });
}

function calculateStreak(completedDates) {
    if (completedDates.length === 0) return 0;

    // Sort dates in descending order
    const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if today is completed
    const todayStr = today.toISOString().split('T')[0];
    if (sortedDates[0] === todayStr) {
        streak = 1;

        // Check previous days
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (
                prevDate.getDate() === expectedDate.getDate() &&
                prevDate.getMonth() === expectedDate.getMonth() &&
                prevDate.getFullYear() === expectedDate.getFullYear()
            ) {
                streak++;
            } else {
                break;
            }
        }
    }
    // Check if yesterday is completed
    else {
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (sortedDates[0] === yesterdayStr) {
            streak = 1;

            // Check previous days
            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = new Date(sortedDates[i]);
                const expectedDate = new Date(yesterday);
                expectedDate.setDate(expectedDate.getDate() - i);

                if (
                    prevDate.getDate() === expectedDate.getDate() &&
                    prevDate.getMonth() === expectedDate.getMonth() &&
                    prevDate.getFullYear() === expectedDate.getFullYear()
                ) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    return streak;
}

function renderHabitCalendar() {
    const calendar = document.getElementById('habits-calendar');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get first day of month and total days in month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Create calendar header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    calendar.innerHTML = `
        <div class="calendar-header">
            <h3>${monthNames[currentMonth]} ${currentYear}</h3>
        </div>
        <div class="calendar-grid">
            ${dayNames.map(day => `<div class="calendar-day">${day}</div>`).join('')}
        </div>
    `;

    const grid = calendar.querySelector('.calendar-grid');

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-date empty';
        grid.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const completedDates = getAllCompletedDates(habits);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.className = 'calendar-date';
        dateCell.textContent = day;

        // Check if this date is today
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dateCell.classList.add('active');
        }

        // Check if this date has completed habits
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (completedDates.includes(dateStr)) {
            dateCell.classList.add('completed');
        }

        grid.appendChild(dateCell);
    }
}

function getAllCompletedDates(habits) {
    const completedDates = new Set();

    habits.forEach(habit => {
        if (habit.completedDates) {
            habit.completedDates.forEach(date => completedDates.add(date));
        }
    });

    return Array.from(completedDates);
}

function showHabitModal(habitId = null) {
    const modal = document.getElementById('habit-modal');
    const form = document.getElementById('habit-form');
    const modalTitle = document.getElementById('habit-modal-title');

    if (habitId) {
        // Edit mode
        modalTitle.textContent = 'Edit Habit';
        const habits = JSON.parse(localStorage.getItem('habits')) || [];
        const habit = habits.find(h => h.id === habitId);

        if (habit) {
            document.getElementById('habit-id').value = habit.id;
            document.getElementById('habit-name').value = habit.name;
            document.getElementById('habit-frequency').value = habit.frequency;
            document.getElementById('habit-reminder').value = habit.reminderTime || '';
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Habit';
        form.reset();
        document.getElementById('habit-id').value = '';
    }

    modal.style.display = 'flex';
}

function hideHabitModal() {
    document.getElementById('habit-modal').style.display = 'none';
}

function saveHabit(e) {
    e.preventDefault();

    const form = e.target;
    const habitId = form.querySelector('#habit-id').value;
    const name = form.querySelector('#habit-name').value;
    const frequency = form.querySelector('#habit-frequency').value;
    const reminderTime = form.querySelector('#habit-reminder').value;

    const habits = JSON.parse(localStorage.getItem('habits')) || [];

    if (habitId) {
        // Update existing habit
        const index = habits.findIndex(h => h.id === habitId);
        if (index !== -1) {
            habits[index] = {
                ...habits[index],
                name,
                frequency,
                reminderTime
            };

            // Set up reminder if time is provided
            if (reminderTime) {
                setupHabitReminder(habits[index]);
            }
        }
    } else {
        // Add new habit
        const newHabit = {
            id: Date.now().toString(),
            name,
            frequency,
            reminderTime,
            completedDates: [],
            createdAt: new Date().toISOString()
        };

        habits.unshift(newHabit);

        // Set up reminder if time is provided
        if (reminderTime) {
            setupHabitReminder(newHabit);
        }
    }

    localStorage.setItem('habits', JSON.stringify(habits));
    loadHabits();
    renderHabitCalendar();
    updateDashboardStats();
    hideHabitModal();
}

function toggleHabitCompletion(habitId, isCompleted) {
    const habits = JSON.parse(localStorage.getItem('habits')) || [];
    const habitIndex = habits.findIndex(h => h.id === habitId);

    if (habitIndex !== -1) {
        const habit = habits[habitIndex];
        const today = new Date().toISOString().split('T')[0];

        if (!habit.completedDates) {
            habit.completedDates = [];
        }

        if (isCompleted) {
            if (!habit.completedDates.includes(today)) {
                habit.completedDates.push(today);
            }
        } else {
            habit.completedDates = habit.completedDates.filter(date => date !== today);
        }

        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabitCalendar();
        updateDashboardStats();
    }
}

function editHabit(habitId) {
    showHabitModal(habitId);
}

function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        const habits = JSON.parse(localStorage.getItem('habits')) || [];
        const updatedHabits = habits.filter(habit => habit.id !== habitId);
        localStorage.setItem('habits', JSON.stringify(updatedHabits));
        loadHabits();
        renderHabitCalendar();
        updateDashboardStats();
    }
}

function setupHabitReminder(habit) {
    if (!habit.reminderTime) return;

    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
    );

    // If the reminder time is already past today, set it for tomorrow
    if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime - now;

    setTimeout(() => {
        alert(`Don't forget to ${habit.name}!`);

        // Set up the next reminder (for daily habits)
        if (habit.frequency === 'daily') {
            setupHabitReminder(habit);
        }
    }, timeUntilReminder);
}