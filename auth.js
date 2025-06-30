// This page is just for handling the Spotify redirect
window.addEventListener('load', () => {
    // Extract the access token from the URL
    const params = new URLSearchParams(window.location.hash.substring(1));

    if (params.has('access_token')) {
        // Store the token in localStorage and redirect back to the main app
        localStorage.setItem('spotify_access_token', params.get('access_token'));
        localStorage.setItem('spotify_token_expiry', Date.now() + (params.get('expires_in') * 1000));
        window.location.href = 'index.html';
    } else {
        // Handle error case
        console.error('Authentication failed');
        window.location.href = 'index.html';
    }
});