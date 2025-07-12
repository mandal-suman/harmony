// Simple page navigation
document.addEventListener('DOMContentLoaded', function () {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');

    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Hide all page contents
            pageContents.forEach(page => {
                page.style.display = 'none';
            });

            // Show the target page
            document.getElementById(targetId).style.display = 'block';

            // Update active class
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Show dashboard by default
    document.getElementById('dashboard').style.display = 'block';
});