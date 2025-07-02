// Vision Board Module
function initVisionBoard() {
    // Load vision board items
    loadVisionBoardItems();

    // Set up event listeners
    document.getElementById('add-vision-item-btn').addEventListener('click', showVisionItemModal);
    document.getElementById('cancel-vision-item-btn').addEventListener('click', hideVisionItemModal);
    document.getElementById('vision-item-form').addEventListener('submit', saveVisionItem);
    document.querySelectorAll('.close-modal')[2].addEventListener('click', hideVisionItemModal);

    // Set up sample image selection
    document.querySelectorAll('.sample-images img').forEach(img => {
        img.addEventListener('click', function () {
            document.getElementById('vision-item-image').value = this.dataset.url;
        });
    });
}

function loadVisionBoardItems() {
    const items = JSON.parse(localStorage.getItem('visionBoardItems')) || [];
    const grid = document.getElementById('vision-board-grid');

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<p class="empty-message">Add images to create your vision board</p>';
        return;
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'vision-item';
        itemElement.dataset.id = item.id;

        itemElement.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.title}">
            <div class="vision-item-overlay">
                <div class="vision-item-title">${item.title}</div>
                ${item.tag ? `<div class="vision-item-tag">${item.tag}</div>` : ''}
            </div>
            <div class="vision-item-actions">
                <button class="edit-vision-item" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="delete-vision-item" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Add event listeners to action buttons
        itemElement.querySelector('.edit-vision-item').addEventListener('click', (e) => {
            e.stopPropagation();
            editVisionItem(item.id);
        });

        itemElement.querySelector('.delete-vision-item').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteVisionItem(item.id);
        });

        grid.appendChild(itemElement);
    });
}

function showVisionItemModal(itemId = null) {
    const modal = document.getElementById('vision-item-modal');
    const form = document.getElementById('vision-item-form');
    const modalTitle = document.getElementById('vision-modal-title');

    if (itemId) {
        // Edit mode
        modalTitle.textContent = 'Edit Vision Item';
        const items = JSON.parse(localStorage.getItem('visionBoardItems')) || [];
        const item = items.find(i => i.id === itemId);

        if (item) {
            document.getElementById('vision-item-id').value = item.id;
            document.getElementById('vision-item-title').value = item.title;
            document.getElementById('vision-item-tag').value = item.tag || '';
            document.getElementById('vision-item-image').value = item.imageUrl;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add to Vision Board';
        form.reset();
        document.getElementById('vision-item-id').value = '';
    }

    modal.style.display = 'flex';
}

function hideVisionItemModal() {
    document.getElementById('vision-item-modal').style.display = 'none';
}

function saveVisionItem(e) {
    e.preventDefault();

    const form = e.target;
    const itemId = form.querySelector('#vision-item-id').value;
    const title = form.querySelector('#vision-item-title').value;
    const tag = form.querySelector('#vision-item-tag').value;
    const imageUrl = form.querySelector('#vision-item-image').value;

    if (!imageUrl) {
        alert('Please provide an image URL');
        return;
    }

    const items = JSON.parse(localStorage.getItem('visionBoardItems')) || [];

    if (itemId) {
        // Update existing item
        const index = items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            items[index] = {
                ...items[index],
                title,
                tag,
                imageUrl
            };
        }
    } else {
        // Add new item
        const newItem = {
            id: Date.now().toString(),
            title,
            tag,
            imageUrl,
            createdAt: new Date().toISOString()
        };
        items.unshift(newItem);
    }

    localStorage.setItem('visionBoardItems', JSON.stringify(items));
    loadVisionBoardItems();
    hideVisionItemModal();
}

function editVisionItem(itemId) {
    showVisionItemModal(itemId);
}

function deleteVisionItem(itemId) {
    if (confirm('Are you sure you want to delete this vision item?')) {
        const items = JSON.parse(localStorage.getItem('visionBoardItems')) || [];
        const updatedItems = items.filter(item => item.id !== itemId);
        localStorage.setItem('visionBoardItems', JSON.stringify(updatedItems));
        loadVisionBoardItems();
    }
}