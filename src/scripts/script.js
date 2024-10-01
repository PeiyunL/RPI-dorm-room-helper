const dorms = [
    { name: 'Dorm A', rooms: [{ type: 'single', price: 4500 }, { type: 'double', price: 6000 }, { type: 'triple', price: 7500 }] },
    { name: 'Dorm B', rooms: [{ type: 'double', price: 6000 }] },
    { name: 'Dorm C', rooms: [{ type: 'suite', price: 8000 }] },
    { name: 'Dorm D', rooms: [{ type: 'single', price: 5000 }, { type: 'double', price: 7000 }] },
    { name: 'Dorm E', rooms: [{ type: 'double', price: 7000 }, { type: 'suite', price: 9000 }] }
];


// The handler function after the menu item is clicked
function handleMenuClick(menuItem) {
    if (menuItem === 'Dorm') {
        window.location.href = '../src/pages/Dorm.html';
    } else if (menuItem === 'subkey 2') {
        window.location.href = '../src/pages/subkey_2.html';
    } else if (menuItem === 'subkey 3') {
        window.location.href = '../src/pages/subkey_3.html';
    } else if (menuItem === 'Favorites') {
        window.location.href = '../src/pages/favorites.html';
    } else if (menuItem === 'Record') {
        window.location.href = '../src/pages/record.html';
    } else if (menuItem === 'Settings') {
        window.location.href = '../src/pages/settings.html';
    } else if (menuItem === 'About us') {
        window.location.href = '../src/pages/about_us.html';
    } else if (menuItem === 'Log out') {
        window.location.href = '../src/pages/about_us.html';
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

    // const dormTypeSelect = document.getElementById('dormType');
    // const priceRangeSelect = document.getElementById('priceRange');
    // console.log("dormTypeSelect:", dormTypeSelect);  // Log the result
    // console.log("priceRangeSelect:", priceRangeSelect);  // Log the result

    // // Attach event listeners to call filterDorms when selection changes
    // if (dormTypeSelect && priceRangeSelect) {
    //     dormTypeSelect.addEventListener('change', filterDorms);
    //     priceRangeSelect.addEventListener('change', filterDorms);

    //     // Call filterDorms on page load to show all dorms by default
    //     filterDorms();
    // } else {
    //     console.error("One or both dropdowns are not found in the DOM.");
    // }
    
});

//This does not work while I put it in script but it works in inner script in html, do not delete it I am trying to fix this bug.

// function filterDorms() {
//     const dormType = document.getElementById('dormType').value;
//     const priceRange = document.getElementById('priceRange').value;
//     const dormList = document.getElementById('dormList');

//     // Clear the previous dorm list
//     dormList.innerHTML = '';

//     let foundDorms = false; // Track if any dorms match the filters

//     // Loop through each dorm and check its rooms
//     dorms.forEach(dorm => {
//         let matchingRooms = dorm.rooms.filter(room => {
//             let matchesType = dormType === 'all' || room.type === dormType;
//             let matchesPrice = true;

//             // Filter rooms based on price range
//             if (priceRange === 'low') {
//                 matchesPrice = room.price < 5000;
//             } else if (priceRange === 'mid') {
//                 matchesPrice = room.price >= 5000 && room.price <= 7000;
//             } else if (priceRange === 'high') {
//                 matchesPrice = room.price > 7000;
//             }

//             return matchesType && matchesPrice;
//         });

//         // If the dorm has matching rooms, display them
//         if (matchingRooms.length > 0) {
//             foundDorms = true;
//             dormList.innerHTML += `<h3>${dorm.name}</h3>`;
//             matchingRooms.forEach(room => {
//                 dormList.innerHTML += `<p>Room type: ${room.type}, Price: $${room.price}</p>`;
//             });
//         }
//     });

//     // If no dorms match the filters, display a message
//     if (!foundDorms) {
//         dormList.innerHTML = '<p>No dorms match the selected filters.</p>';
//     }
// }
