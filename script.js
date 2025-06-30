// Configuration
const clientId = '9fe8f88aa58a475395328a1d600f5129'; // Replace with your Spotify Client ID
const redirectUri = 'https://mandal-suman.github.io/harmony/auth.html'; // Must match your Spotify app redirect URI
const scopes = 'user-read-private user-read-email';

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const userProfile = document.getElementById('user-profile');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const featuredContainer = document.getElementById('featured-container');
const searchResultsSection = document.getElementById('search-results');
const resultsContainer = document.getElementById('results-container');
const player = document.querySelector('.player');
const audioPlayer = document.getElementById('audio-player');
const nowPlayingImg = document.getElementById('now-playing-img');
const nowPlayingName = document.getElementById('now-playing-name');
const nowPlayingArtist = document.getElementById('now-playing-artist');

// State
let accessToken = null;
let expiresIn = null;

// Initialize the app
function init() {
    checkAuth();
    loadFeaturedPlaylists();
    setupEventListeners();
}

// Check if user is already authenticated
function checkAuth() {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const storedToken = localStorage.getItem('spotify_access_token');
    const storedExpiry = localStorage.getItem('spotify_token_expiry');

    if (params.has('access_token')) {
        // New authentication
        accessToken = params.get('access_token');
        expiresIn = params.get('expires_in');

        localStorage.setItem('spotify_access_token', accessToken);
        localStorage.setItem('spotify_token_expiry', Date.now() + (expiresIn * 1000));

        // Clean up URL
        window.history.pushState({}, document.title, window.location.pathname);

        updateUIAfterAuth();
    } else if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
        // Existing valid token
        accessToken = storedToken;
        updateUIAfterAuth();
    }
}

// Update UI after authentication
function updateUIAfterAuth() {
    loginBtn.classList.add('hidden');
    userProfile.classList.remove('hidden');

    // Fetch user profile
    fetch('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            userAvatar.src = data.images?.[0]?.url || 'https://via.placeholder.com/40';
            userName.textContent = data.display_name || data.id;
        });
}

// Setup event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', () => {
        window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    });

    searchBtn.addEventListener('click', searchTracks);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchTracks();
    });
}

// Load featured playlists
function loadFeaturedPlaylists() {
    if (!accessToken) return;

    fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=6', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            featuredContainer.innerHTML = '';
            data.playlists.items.forEach(playlist => {
                const playlistCard = createPlaylistCard(playlist);
                featuredContainer.appendChild(playlistCard);
            });
        });
}

// Create playlist card element
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `
        <img class="playlist-img" src="${playlist.images[0].url}" alt="${playlist.name}">
        <h3 class="playlist-name">${playlist.name}</h3>
        <p class="playlist-description">${playlist.description || 'By Spotify'}</p>
    `;

    card.addEventListener('click', () => {
        getPlaylistTracks(playlist.id);
    });

    return card;
}

// Get tracks from a playlist
function getPlaylistTracks(playlistId) {
    fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            displayTracks(data.items.map(item => item.track), 'Tracks in Playlist');
        });
}

// Search for tracks
function searchTracks() {
    const query = searchInput.value.trim();
    if (!query || !accessToken) return;

    fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            displayTracks(data.tracks.items, 'Search Results');
        });
}

// Display tracks
function displayTracks(tracks, sectionTitle) {
    searchResultsSection.querySelector('h2').textContent = sectionTitle;
    resultsContainer.innerHTML = '';

    tracks.forEach(track => {
        const trackCard = createTrackCard(track);
        resultsContainer.appendChild(trackCard);
    });

    featuredPlaylistsSection.classList.add('hidden');
    searchResultsSection.classList.remove('hidden');
}

// Create track card element
function createTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <img class="track-img" src="${track.album.images[0].url}" alt="${track.name}">
        <h3 class="track-name">${track.name}</h3>
        <p class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</p>
    `;

    card.addEventListener('click', () => {
        playTrack(track);
    });

    return card;
}

// Play a track preview
function playTrack(track) {
    if (!track.preview_url) {
        alert('No preview available for this track');
        return;
    }

    nowPlayingImg.src = track.album.images[0].url;
    nowPlayingName.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(artist => artist.name).join(', ');

    audioPlayer.src = track.preview_url;
    audioPlayer.play();

    player.classList.remove('hidden');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);