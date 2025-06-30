const SPOTIFY_CONFIG = {
    CLIENT_ID: '9fe8f88aa58a475395328a1d600f5129', // Replace with your actual client ID
    REDIRECT_URI: 'https://mandal-suman.github.io/harmony/callback.html',
    AUTH_ENDPOINT: 'https://accounts.spotify.com/authorize',
    RESPONSE_TYPE: 'token',
    SCOPE: [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-modify-playback-state',
        'streaming',
        'user-read-recently-played',
        'user-top-read'
    ].join(' '),
    SHOW_DIALOG: false
};

function handleLogin() {
    // Build the authorization URL
    const authUrl = `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?client_id=${SPOTIFY_CONFIG.CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}` +
        `&response_type=${SPOTIFY_CONFIG.RESPONSE_TYPE}` +
        `&scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPE)}` +
        `&show_dialog=${SPOTIFY_CONFIG.SHOW_DIALOG}`;

    // Open auth window - important to specify the exact origin
    const authWindow = window.open(
        authUrl,
        'Spotify Auth',
        'width=500,height=700,scrollbars=yes,resizable=yes'
    );

    // Check for popup blockers
    if (!authWindow) {
        alert('Popup was blocked. Please allow popups for this site and try again.');
    }
}

// Update the message listener to specify exact origin
window.addEventListener('message', (event) => {
    // Only accept messages from our own origin
    if (event.origin !== 'https://mandal-suman.github.io') return;

    if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
        handleAuthSuccess(event.data);
    } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
        handleAuthError(event.data);
    }
}, false);

// DOM Elements
const elements = {
    loginBtn: document.getElementById('login-btn'),
    userInfo: document.getElementById('user-info'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    welcomeScreen: document.getElementById('welcome-screen'),
    content: document.getElementById('content'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    results: document.getElementById('results'),
    player: document.getElementById('player'),
    nowPlayingImg: document.getElementById('now-playing-img'),
    nowPlayingName: document.getElementById('now-playing-name'),
    nowPlayingArtist: document.getElementById('now-playing-artist'),
    playBtn: document.getElementById('play-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    progressBar: document.getElementById('progress-bar'),
    currentTimeEl: document.getElementById('current-time'),
    durationEl: document.getElementById('duration')
};

// App State
const state = {
    accessToken: null,
    refreshToken: null,
    tokenExpiration: 0,
    currentTab: 'tracks',
    currentTrack: null,
    deviceId: null,
    player: null,
    progressInterval: null,
    isAuthenticated: false
};

// Initialize the application
function init() {
    setupEventListeners();
    checkLocalStorage();
    setupMessageListener();
}

// Check for existing session in localStorage
function checkLocalStorage() {
    const authData = JSON.parse(localStorage.getItem('spotify_auth_data'));
    if (authData && authData.accessToken && new Date().getTime() < authData.tokenExpiration) {
        state.accessToken = authData.accessToken;
        state.refreshToken = authData.refreshToken;
        state.tokenExpiration = authData.tokenExpiration;
        state.isAuthenticated = true;
        updateUIAfterAuth();
        initializePlayer();
    }
}

// Setup event listeners
function setupEventListeners() {
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentTab = btn.dataset.tab;
            if (elements.searchInput.value) handleSearch();
        });
    });

    elements.playBtn.addEventListener('click', togglePlay);
    elements.prevBtn.addEventListener('click', playPrevious);
    elements.nextBtn.addEventListener('click', playNext);
    elements.progressBar.addEventListener('input', seekTo);
}

// Setup message listener for auth callback
function setupMessageListener() {
    window.addEventListener('message', (event) => {
        // Verify the message is from our own origin
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
            handleAuthSuccess(event.data);
        } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
            handleAuthError(event.data);
        }
    });
}

// Handle login with Spotify
function handleLogin() {
    const authUrl = `${SPOTIFY_CONFIG.AUTH_ENDPOINT}?client_id=${SPOTIFY_CONFIG.CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}` +
        `&response_type=${SPOTIFY_CONFIG.RESPONSE_TYPE}` +
        `&scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPE)}` +
        `&show_dialog=${SPOTIFY_CONFIG.SHOW_DIALOG}`;

    // Open auth window
    const authWindow = window.open(
        authUrl,
        'Spotify Auth',
        'width=500,height=700,scrollbars=yes,resizable=yes'
    );

    // Check if window was blocked
    if (!authWindow) {
        alert('Popup was blocked. Please allow popups for this site.');
    }
}

// Handle successful authentication
function handleAuthSuccess(data) {
    state.accessToken = data.accessToken;
    state.tokenExpiration = new Date().getTime() + (data.expiresIn * 1000);

    // Store auth data in localStorage
    localStorage.setItem('spotify_auth_data', JSON.stringify({
        accessToken: state.accessToken,
        tokenExpiration: state.tokenExpiration
    }));

    state.isAuthenticated = true;
    updateUIAfterAuth();
    initializePlayer();
}

// Handle authentication error
function handleAuthError(error) {
    console.error('Authentication error:', error);
    alert('Failed to authenticate with Spotify. Please try again.');
}

// Update UI after successful authentication
function updateUIAfterAuth() {
    elements.loginBtn.classList.add('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.welcomeScreen.classList.add('hidden');
    elements.content.classList.remove('hidden');

    // Fetch user profile
    fetchUserProfile();
}

// Fetch user profile from Spotify
async function fetchUserProfile() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${state.accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUserInfo(data);
        } else {
            throw new Error('Failed to fetch user profile');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Display user information
function displayUserInfo(user) {
    elements.userName.textContent = user.display_name || user.id;
    if (user.images && user.images.length > 0) {
        elements.userAvatar.src = user.images[0].url;
    }
}

// Initialize Spotify Web Playback SDK
function initializePlayer() {
    // Load the Spotify Web Playback SDK script
    if (!document.getElementById('spotify-player-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-player-script';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        document.body.appendChild(script);
    }

    // Wait for SDK to be ready
    window.onSpotifyWebPlaybackSDKReady = () => {
        state.player = new Spotify.Player({
            name: 'Music Experience Web',
            getOAuthToken: cb => { cb(state.accessToken); },
            volume: 0.5
        });

        // Ready event
        state.player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            state.deviceId = device_id;
            transferPlayback(device_id);
        });

        // Player state changed
        state.player.addListener('player_state_changed', (state) => {
            if (state) {
                updatePlayerUI(state);
            }
        });

        // Connect to player
        state.player.connect().then(success => {
            if (success) {
                console.log('Connected to Spotify player');
            }
        });
    };
}

// Transfer playback to our app
function transferPlayback(deviceId) {
    fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false
        })
    }).catch(error => {
        console.error('Failed to transfer playback:', error);
    });
}

// Handle search functionality
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    try {
        let endpoint;
        switch (state.currentTab) {
            case 'tracks':
                endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`;
                break;
            case 'artists':
                endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=12`;
                break;
            case 'albums':
                endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=12`;
                break;
            default:
                endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=12`;
        }

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${state.accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayResults(data);
        } else {
            throw new Error('Search failed');
        }
    } catch (error) {
        console.error('Error searching:', error);
        elements.results.innerHTML = '<p>Failed to load results. Please try again.</p>';
    }
}

// Display search results
function displayResults(data) {
    elements.results.innerHTML = '';

    if (state.currentTab === 'tracks' && data.tracks) {
        data.tracks.items.forEach(track => {
            const trackCard = createTrackCard(track);
            elements.results.appendChild(trackCard);
        });
    } else if (state.currentTab === 'artists' && data.artists) {
        data.artists.items.forEach(artist => {
            const artistCard = createArtistCard(artist);
            elements.results.appendChild(artistCard);
        });
    } else if (state.currentTab === 'albums' && data.albums) {
        data.albums.items.forEach(album => {
            const albumCard = createAlbumCard(album);
            elements.results.appendChild(albumCard);
        });
    }
}

// Create track card element
function createTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'track-card';

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = track.album.images[0]?.url || 'https://via.placeholder.com/200';
    img.alt = track.name;

    const name = document.createElement('h4');
    name.className = 'card-name';
    name.textContent = track.name;

    const artist = document.createElement('p');
    artist.className = 'card-artist';
    artist.textContent = track.artists.map(a => a.name).join(', ');

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(artist);

    card.addEventListener('click', () => playTrack(track.uri));

    return card;
}

// Create artist card element
function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'artist-card';

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = artist.images[0]?.url || 'https://via.placeholder.com/200';
    img.alt = artist.name;

    const name = document.createElement('h4');
    name.className = 'card-name';
    name.textContent = artist.name;

    const type = document.createElement('p');
    type.className = 'card-artist';
    type.textContent = 'Artist';

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(type);

    card.addEventListener('click', () => {
        alert(`Viewing ${artist.name}'s profile would be implemented here`);
    });

    return card;
}

// Create album card element
function createAlbumCard(album) {
    const card = document.createElement('div');
    card.className = 'album-card';

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = album.images[0]?.url || 'https://via.placeholder.com/200';
    img.alt = album.name;

    const name = document.createElement('h4');
    name.className = 'card-name';
    name.textContent = album.name;

    const artist = document.createElement('p');
    artist.className = 'card-artist';
    artist.textContent = album.artists.map(a => a.name).join(', ');

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(artist);

    card.addEventListener('click', () => {
        alert(`Viewing ${album.name} album would be implemented here`);
    });

    return card;
}

// Play a track
function playTrack(trackUri) {
    if (!state.deviceId) {
        alert('Player not ready. Please try again in a moment.');
        return;
    }

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: [trackUri]
        })
    }).catch(error => {
        console.error('Failed to play track:', error);
    });
}

// Toggle play/pause
function togglePlay() {
    fetch('https://api.spotify.com/v1/me/player', {
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to get player state');
    }).then(playerState => {
        if (playerState.is_playing) {
            pausePlayback();
        } else {
            resumePlayback();
        }
    }).catch(error => {
        console.error('Error toggling play:', error);
    });
}

// Pause playback
function pausePlayback() {
    fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).catch(error => {
        console.error('Failed to pause playback:', error);
    });
}

// Resume playback
function resumePlayback() {
    fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).catch(error => {
        console.error('Failed to resume playback:', error);
    });
}

// Play previous track
function playPrevious() {
    fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).catch(error => {
        console.error('Failed to play previous track:', error);
    });
}

// Play next track
function playNext() {
    fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).catch(error => {
        console.error('Failed to play next track:', error);
    });
}

// Seek to position in track
function seekTo() {
    const positionMs = Math.floor(elements.progressBar.value * state.currentTrack.duration_ms / 100);

    fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${state.accessToken}`
        }
    }).catch(error => {
        console.error('Failed to seek:', error);
    });
}

// Update player UI with current track info
function updatePlayerUI(playerState) {
    elements.player.classList.remove('hidden');

    const track = playerState.track_window.current_track;
    state.currentTrack = track;

    elements.nowPlayingImg.src = track.album.images[0].url;
    elements.nowPlayingName.textContent = track.name;
    elements.nowPlayingArtist.textContent = track.artists.map(a => a.name).join(', ');

    if (playerState.paused) {
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
        clearInterval(state.progressInterval);
        state.progressInterval = null;
    } else {
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (!state.progressInterval) {
            state.progressInterval = setInterval(updateProgressBar, 1000);
        }
    }

    updateProgressBar(playerState.position, track.duration_ms);
}

// Update progress bar
function updateProgressBar(position = null, duration = null) {
    if (position === null || duration === null) {
        if (!state.currentTrack) return;

        fetch('https://api.spotify.com/v1/me/player', {
            headers: {
                'Authorization': `Bearer ${state.accessToken}`
            }
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            return null;
        }).then(playerState => {
            if (playerState) {
                const progress = (playerState.position_ms / playerState.duration_ms) * 100;
                elements.progressBar.value = progress;
                elements.currentTimeEl.textContent = formatTime(playerState.position_ms);
                elements.durationEl.textContent = formatTime(playerState.duration_ms);
            }
        });
    } else {
        const progress = (position / duration) * 100;
        elements.progressBar.value = progress;
        elements.currentTimeEl.textContent = formatTime(position);
        elements.durationEl.textContent = formatTime(duration);
    }
}

// Format time (ms to MM:SS)
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);