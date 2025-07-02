// Goals Module
function initGoals() {
    // Load goals from localStorage
    loadGoals();

    // Set up event listeners
    document.getElementById('add-goal-btn').addEventListener('click', showGoalModal);
    document.getElementById('cancel-goal-btn').addEventListener('click', hideGoalModal);
    document.getElementById('goal-form').addEventListener('submit', saveGoal);
    document.querySelector('.close-modal').addEventListener('click', hideGoalModal);

    // Set up drag and drop
    setupDragAndDrop();
}

function loadGoals() {
    const goals = JSON.parse(localStorage.getItem('goals')) || [];
    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('in-progress-list');
    const completedList = document.getElementById('completed-list');
    const somedayList = document.getElementById('someday-list');

    // Clear all lists
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    completedList.innerHTML = '';
    somedayList.innerHTML = '';

    if (goals.length === 0) {
        todoList.innerHTML = '<p class="empty-message">No goals yet. Add your first goal!</p>';
        return;
    }

    goals.forEach(goal => {
        const goalCard = createGoalCard(goal);

        switch (goal.status) {
            case 'todo':
                todoList.appendChild(goalCard);
                break;
            case 'in-progress':
                inProgressList.appendChild(goalCard);
                break;
            case 'completed':
                completedList.appendChild(goalCard);
                break;
            case 'someday':
                somedayList.appendChild(goalCard);
                break;
            default:
                todoList.appendChild(goalCard);
        }
    });
}

function createGoalCard(goal) {
    const goalCard = document.createElement('div');
    goalCard.className = `goal-card ${goal.status === 'completed' ? 'completed' : ''}`;
    goalCard.draggable = true;
    goalCard.dataset.id = goal.id;

    const typeIcon = getGoalTypeIcon(goal.type);
    const priorityColor = getPriorityColor(goal.priority);

    let dueDate = '';
    if (goal.targetDate) {
        const dateObj = new Date(goal.targetDate);
        dueDate = `Due: ${dateObj.toLocaleDateString()}`;
    }

    goalCard.innerHTML = `
        <h4>${typeIcon} ${goal.title}</h4>
        ${goal.description ? `<p>${goal.description}</p>` : ''}
        <div class="goal-meta">
            <span style="color: ${priorityColor}">${goal.priority}</span>
            <span>${dueDate}</span>
        </div>
        <div class="goal-actions">
            <button class="edit-goal" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="delete-goal" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
    `;

    // Add event listeners to action buttons
    goalCard.querySelector('.edit-goal').addEventListener('click', () => editGoal(goal.id));
    goalCard.querySelector('.delete-goal').addEventListener('click', () => deleteGoal(goal.id));

    return goalCard;
}

function getGoalTypeIcon(type) {
    const icons = {
        'personal': '<i class="fas fa-user" style="color: #6c5ce7"></i>',
        'career': '<i class="fas fa-briefcase" style="color: #00b894"></i>',
        'financial': '<i class="fas fa-money-bill-wave" style="color: #00cec9"></i>',
        'health': '<i class="fas fa-heartbeat" style="color: #e17055"></i>',
        'education': '<i class="fas fa-graduation-cap" style="color: #0984e3"></i>',
        'relationships': '<i class="fas fa-users" style="color: #fd79a8"></i>'
    };

    return icons[type] || '<i class="fas fa-star" style="color: #fdcb6e"></i>';
}

function getPriorityColor(priority) {
    const colors = {
        'low': '#00b894',
        'medium': '#fdcb6e',
        'high': '#e17055'
    };

    return colors[priority] || '#6c5ce7';
}

function showGoalModal(goalId = null) {
    const modal = document.getElementById('goal-modal');
    const form = document.getElementById('goal-form');
    const modalTitle = document.getElementById('modal-title');

    if (goalId) {
        // Edit mode
        modalTitle.textContent = 'Edit Goal';
        const goals = JSON.parse(localStorage.getItem('goals')) || [];
        const goal = goals.find(g => g.id === goalId);

        if (goal) {
            document.getElementById('goal-id').value = goal.id;
            document.getElementById('goal-title').value = goal.title;
            document.getElementById('goal-description').value = goal.description || '';
            document.getElementById('goal-type').value = goal.type;
            document.getElementById('goal-priority').value = goal.priority;
            document.getElementById('goal-date').value = goal.targetDate || '';
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Goal';
        form.reset();
        document.getElementById('goal-id').value = '';
    }

    modal.style.display = 'flex';
}

function hideGoalModal() {
    document.getElementById('goal-modal').style.display = 'none';
}

function saveGoal(e) {
    e.preventDefault();

    const form = e.target;
    const goalId = form.querySelector('#goal-id').value;
    const title = form.querySelector('#goal-title').value;
    const description = form.querySelector('#goal-description').value;
    const type = form.querySelector('#goal-type').value;
    const priority = form.querySelector('#goal-priority').value;
    const targetDate = form.querySelector('#goal-date').value;

    const goals = JSON.parse(localStorage.getItem('goals')) || [];

    if (goalId) {
        // Update existing goal
        const index = goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            goals[index] = {
                ...goals[index],
                title,
                description,
                type,
                priority,
                targetDate
            };
        }
    } else {
        // Add new goal
        const newGoal = {
            id: Date.now().toString(),
            title,
            description,
            type,
            priority,
            targetDate,
            status: 'todo',
            createdAt: new Date().toISOString()
        };
        goals.unshift(newGoal);
    }

    localStorage.setItem('goals', JSON.stringify(goals));
    loadGoals();
    updateDashboardStats();
    hideGoalModal();
}

function editGoal(goalId) {
    showGoalModal(goalId);
}

function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        const goals = JSON.parse(localStorage.getItem('goals')) || [];
        const updatedGoals = goals.filter(goal => goal.id !== goalId);
        localStorage.setItem('goals', JSON.stringify(updatedGoals));
        loadGoals();
        updateDashboardStats();
    }
}

function setupDragAndDrop() {
    const goalColumns = document.querySelectorAll('.goal-column');
    const goalLists = document.querySelectorAll('.goal-list');

    let draggedItem = null;

    // Add drag event listeners to all goal cards
    document.querySelectorAll('.goal-card').forEach(card => {
        card.addEventListener('dragstart', function () {
            draggedItem = this;
            setTimeout(() => {
                this.style.opacity = '0.4';
            }, 0);
        });

        card.addEventListener('dragend', function () {
            setTimeout(() => {
                this.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });
    });

    // Add drag event listeners to all columns
    goalColumns.forEach(column => {
        column.addEventListener('dragover', function (e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(this.querySelector('.goal-list'), e.clientY);
            const list = this.querySelector('.goal-list');

            if (afterElement == null) {
                list.appendChild(draggedItem);
            } else {
                list.insertBefore(draggedItem, afterElement);
            }
        });

        column.addEventListener('dragenter', function (e) {
            e.preventDefault();
            this.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
        });

        column.addEventListener('dragleave', function () {
            this.style.backgroundColor = '';
        });

        column.addEventListener('drop', function (e) {
            e.preventDefault();
            this.style.backgroundColor = '';

            // Update goal status in localStorage
            const goalId = draggedItem.dataset.id;
            const newStatus = this.dataset.status;

            const goals = JSON.parse(localStorage.getItem('goals')) || [];
            const goalIndex = goals.findIndex(g => g.id === goalId);

            if (goalIndex !== -1) {
                goals[goalIndex].status = newStatus;
                localStorage.setItem('goals', JSON.stringify(goals));
                updateDashboardStats();
            }
        });
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.goal-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}