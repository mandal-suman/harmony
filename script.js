const CLIENT_ID = '2a6bbce3df194ece9934b9d6d6d6c3c3';
const REDIRECT_URI = encodeURIComponent('https://mandal-suman.github.io/harmony'); // Must match Spotify app settings
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPE = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming user-read-recently-played user-top-read';

function handleLogin() {
    window.open(
        `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`,
        'SpotifyAuth',
        'width=500,height=600'
    );
}

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const welcomeScreen = document.getElementById('welcome-screen');
const content = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const results = document.getElementById('results');
const player = document.getElementById('player');
const nowPlayingImg = document.getElementById('now-playing-img');
const nowPlayingName = document.getElementById('now-playing-name');
const nowPlayingArtist = document.getElementById('now-playing-artist');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Global variables
let accessToken = null;
let currentTab = 'tracks';
let currentTrack = null;
let deviceId = null;
let progressInterval = null;

// Initialize the app
function init() {
    setupEventListeners();
    // Add this to your init() function
    window.addEventListener('message', (event) => {
        if (event.data.type === 'SPOTIFY_AUTH') {
            accessToken = event.data.token;
            fetchUserProfile();
            welcomeScreen.classList.add('hidden');
            content.classList.remove('hidden');
        } else if (event.data.type === 'SPOTIFY_AUTH_ERROR') {
            alert('Authentication failed. Please try again.');
        }
    });
}

// Check if user is already authenticated
function checkAuth() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');

    if (token) {
        accessToken = token;
        window.location.hash = '';
        fetchUserProfile();
        welcomeScreen.classList.add('hidden');
        content.classList.remove('hidden');
    }
}

// Setup event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            if (searchInput.value) handleSearch();
        });
    });

    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    progressBar.addEventListener('input', seekTo);
}

// Handle Spotify login
function handleLogin() {
    window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayUserInfo(data);
            initializePlayer();
        } else {
            throw new Error('Failed to fetch user profile');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Display user info
function displayUserInfo(user) {
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userName.textContent = user.display_name || user.id;
    if (user.images && user.images.length > 0) {
        userAvatar.src = user.images[0].url;
    }
}

// Initialize Spotify Web Playback SDK
function initializePlayer() {
    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Music Experience Web',
            getOAuthToken: cb => { cb(accessToken); },
            volume: 0.5
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            deviceId = device_id;
            transferPlayback(device_id);
        });

        player.addListener('player_state_changed', (state) => {
            if (state) {
                updatePlayerUI(state);
            }
        });

        player.connect().then(success => {
            if (success) {
                console.log('Connected to Spotify player');
            }
        });
    };

    // Load the Spotify Web Playback SDK script
    if (!document.getElementById('spotify-player-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-player-script';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        document.body.appendChild(script);
    }
}

// Transfer playback to our app
function transferPlayback(deviceId) {
    fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            device_ids: [deviceId],
            play: false
        })
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to transfer playback');
        }
    });
}

// Handle search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        let endpoint;
        switch (currentTab) {
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
                'Authorization': `Bearer ${accessToken}`
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
        results.innerHTML = '<p>Failed to load results. Please try again.</p>';
    }
}

// Display search results
function displayResults(data) {
    results.innerHTML = '';

    if (currentTab === 'tracks' && data.tracks) {
        data.tracks.items.forEach(track => {
            const trackCard = createTrackCard(track);
            results.appendChild(trackCard);
        });
    } else if (currentTab === 'artists' && data.artists) {
        data.artists.items.forEach(artist => {
            const artistCard = createArtistCard(artist);
            results.appendChild(artistCard);
        });
    } else if (currentTab === 'albums' && data.albums) {
        data.albums.items.forEach(album => {
            const albumCard = createAlbumCard(album);
            results.appendChild(albumCard);
        });
    }
}

// Create track card
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

// Create artist card
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
        // In a more complete app, you might navigate to artist details
        alert(`Viewing ${artist.name}'s profile would be implemented here`);
    });

    return card;
}

// Create album card
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
        // In a more complete app, you might navigate to album details
        alert(`Viewing ${album.name} album would be implemented here`);
    });

    return card;
}

// Play a track
function playTrack(trackUri) {
    if (!deviceId) {
        alert('Player not ready. Please try again in a moment.');
        return;
    }

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uris: [trackUri]
        })
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to play track');
        }
    });
}

// Toggle play/pause
function togglePlay() {
    fetch('https://api.spotify.com/v1/me/player', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to get player state');
        }
    }).then(state => {
        if (state.is_playing) {
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
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to pause playback');
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(progressInterval);
            progressInterval = null;
        }
    });
}

// Resume playback
function resumePlayback() {
    fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to resume playback');
        }
    });
}

// Play previous track
function playPrevious() {
    fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to play previous track');
        }
    });
}

// Play next track
function playNext() {
    fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to play next track');
        }
    });
}

// Seek to position in track
function seekTo() {
    const positionMs = Math.floor(progressBar.value * currentTrack.duration_ms / 100);

    fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to seek');
        }
    });
}

// Update player UI with current track info
function updatePlayerUI(state) {
    if (!state) return;

    player.classList.remove('hidden');

    const track = state.track_window.current_track;
    currentTrack = track;

    nowPlayingImg.src = track.album.images[0].url;
    nowPlayingName.textContent = track.name;
    nowPlayingArtist.textContent = track.artists.map(a => a.name).join(', ');

    if (state.paused) {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        clearInterval(progressInterval);
        progressInterval = null;
    } else {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        if (!progressInterval) {
            progressInterval = setInterval(updateProgressBar, 1000);
        }
    }

    updateProgressBar(state.position, track.duration_ms);
}

// Update progress bar
function updateProgressBar(position = null, duration = null) {
    if (position === null || duration === null) {
        if (!currentTrack) return;

        fetch('https://api.spotify.com/v1/me/player', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            return null;
        }).then(state => {
            if (state) {
                const progress = (state.position_ms / state.duration_ms) * 100;
                progressBar.value = progress;
                currentTimeEl.textContent = formatTime(state.position_ms);
                durationEl.textContent = formatTime(state.duration_ms);
            }
        });
    } else {
        const progress = (position / duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(position);
        durationEl.textContent = formatTime(duration);
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