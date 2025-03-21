// Gets elements for the side menu and menu labels
const sideMenu = document.querySelector('.side-menu');
const menuLabel = document.querySelector('.menu-label');

// Add a click event listener
menuLabel.addEventListener('click', function () {
    // Toggle the show and hide state of the menu
    sideMenu.classList.toggle('active');
});

// Add an event listener and close the menu when you click on an area outside the menu
document.addEventListener('click', function(event) {
    const isClickInsideMenu = sideMenu.contains(event.target);
    const isClickOnLabel = menuLabel.contains(event.target);

    if (!isClickInsideMenu && !isClickOnLabel) {
        // If the click is not on the menu or menu TAB, close the menu
        sideMenu.classList.remove('active');
    }
});

// The handler function after the menu item is clicked
function handleMenuClick(menuItem) {
    if (menuItem === 'Home page') {
        window.location.href = '/public/index.html';
    } else if (menuItem === 'Dorm room') {
        window.location.href = '../src/pages/Dorm.html';
    } else if (menuItem === 'subkey 3') {
        window.location.href = '/src/pages/subkey_3.html';
    } else if (menuItem === 'Favorites') {
        window.location.href = '/src/pages/favorites.html';
    } else if (menuItem === 'Record') {
        window.location.href = '/src/pages/record.html';
    } else if (menuItem === 'Settings') {
        window.location.href = '/src/pages/settings.html';
    } else if (menuItem === 'About us') {
        window.location.href = '/src/pages/about_us.html';
    } else if (menuItem === 'Log out') {
        window.location.href = '/src/pages/about_us.html';
    } else {
        alert(menuItem + " page not found");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Detects user login status
    const loginButton = document.getElementById("loginButton");
    const userAvatar = document.getElementById("userAvatar");
    const restrictedContent = document.getElementById("restrictedContent");

    // Check for user data (simulated login)
    const user = localStorage.getItem("user");

    if (user) {
        // If logged in, show your avatar and hide the Login button
        const userData = JSON.parse(user);
        loginButton.style.display = "none";
        userAvatar.src = userData.avatarUrl;
        userAvatar.style.display = "block";
        restrictedContent.style.display = "block"; // Display qualification

        logoutButton.addEventListener("click", function() {
            localStorage.removeItem("user"); // Clear login status
            window.location.reload(); // Refresh page
        });
    } else {
        // If not logged in, hide the Log out button
        logoutButton.style.display = "none";
        // If not logged in, the Login button appears
        loginButton.addEventListener("click", function() {
            // Simulated user login and saved to localStorage
            const userData = {
                username: "AAA",
                avatarUrl: "../src/assets/images/avatar.jpg"
            };
            localStorage.setItem("user", JSON.stringify(userData));
            window.location.reload(); // Refresh the page update status
        });
    }

    // Carousel functionality
    let currentImageIndex = 0;
    const images = [
        "path_to_image1.jpg",
        "path_to_image2.jpg",
        "path_to_image3.jpg"
    ];

    function updateCarousel() {
        const mainImage = document.getElementById("mainImage");
        const carouselCounter = document.getElementById("carouselCounter");
        const thumbnails = document.querySelectorAll(".carousel-thumbnails img");

        mainImage.src = images[currentImageIndex];
        carouselCounter.textContent = `${currentImageIndex + 1}/${images.length}`;

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.classList.toggle("active", index === currentImageIndex);
        });
    }

    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateCarousel();
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateCarousel();
    }

    function showImage(index) {
        currentImageIndex = index;
        updateCarousel();
    }

    // Attach carousel navigation to buttons
    document.querySelector('.carousel-controls button:first-of-type').addEventListener('click', prevImage);
    document.querySelector('.carousel-controls button:last-of-type').addEventListener('click', nextImage);

    // Initialize the carousel
    updateCarousel();

    document.addEventListener("DOMContentLoaded", function () {
        const toggleButton = document.getElementById("darkModeToggle");
        const body = document.body;

        // Check if user has a preference stored
        if (localStorage.getItem("dark-mode") === "enabled") {
            body.classList.add("dark-mode");
        }

        toggleButton.addEventListener("click", function () {
            body.classList.toggle("dark-mode");

            // Store the preference
            if (body.classList.contains("dark-mode")) {
                localStorage.setItem("dark-mode", "enabled");
            } else {
                localStorage.setItem("dark-mode", "disabled");
            }
        });
    });
    
});
