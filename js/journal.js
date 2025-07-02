// Journal Module
function initJournal() {
    // Load journal entries
    loadJournalEntries();

    // Set up event listeners
    document.getElementById('save-journal-btn').addEventListener('click', saveJournalEntry);
    document.getElementById('clear-journal-btn').addEventListener('click', clearJournalEntry);

    // Set today's prompt
    setTodaysPrompt();

    // Load any existing entry for today
    loadTodaysEntry();
}

function setTodaysPrompt() {
    const prompts = [
        "What's one thing you're grateful for today?",
        "What was the highlight of your day?",
        "What challenge did you face today and how did you handle it?",
        "What's one thing you learned today?",
        "How did you take care of yourself today?",
        "What's something that made you smile today?",
        "What would make tomorrow even better?",
        "What's one small win you had today?",
        "How did you move closer to your goals today?",
        "What's something you're looking forward to?"
    ];

    // Use the day of the month to select a prompt (for consistency)
    const today = new Date();
    const dayOfMonth = today.getDate();
    const promptIndex = dayOfMonth % prompts.length;

    document.getElementById('todays-prompt').textContent = prompts[promptIndex];
}

function loadTodaysEntry() {
    const today = new Date().toISOString().split('T')[0];
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];

    const todaysEntry = entries.find(entry => entry.date.split('T')[0] === today);

    if (todaysEntry) {
        document.getElementById('journal-entry').value = todaysEntry.content;
    }
}

function saveJournalEntry() {
    const content = document.getElementById('journal-entry').value.trim();
    if (!content) {
        alert('Please write something before saving.');
        return;
    }

    const today = new Date();
    const dateStr = today.toISOString();
    const prompt = document.getElementById('todays-prompt').textContent;

    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];

    // Check if an entry already exists for today
    const todayStr = today.toISOString().split('T')[0];
    const existingEntryIndex = entries.findIndex(entry => entry.date.split('T')[0] === todayStr);

    const newEntry = {
        date: dateStr,
        prompt,
        content
    };

    if (existingEntryIndex !== -1) {
        // Update existing entry
        entries[existingEntryIndex] = newEntry;
    } else {
        // Add new entry
        entries.unshift(newEntry);
    }

    localStorage.setItem('journalEntries', JSON.stringify(entries));
    loadJournalEntries();
    updateDashboardStats();

    // Show confirmation
    alert('Journal entry saved successfully!');
}

function clearJournalEntry() {
    if (confirm('Are you sure you want to clear your journal entry?')) {
        document.getElementById('journal-entry').value = '';
    }
}

function loadJournalEntries() {
    const entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
    const entriesContainer = document.getElementById('journal-entries');

    entriesContainer.innerHTML = '';

    if (entries.length === 0) {
        entriesContainer.innerHTML = '<p class="empty-message">No journal entries yet.</p>';
        return;
    }

    entries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const dateStr = entryDate.toLocaleDateString();
        const timeStr = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const entryElement = document.createElement('div');
        entryElement.className = 'journal-entry-item';
        entryElement.innerHTML = `
            <div class="journal-entry-date">${dateStr} at ${timeStr}</div>
            <div class="journal-entry-prompt"><em>${entry.prompt}</em></div>
            <div class="journal-entry-content">${entry.content}</div>
        `;

        entriesContainer.appendChild(entryElement);
    });
}