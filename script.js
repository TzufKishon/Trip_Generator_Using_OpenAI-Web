// Event listener for the generate button click
document.getElementById("generate").addEventListener("click", function () {
    var country = document.getElementById("country").value;
    var mode = document.getElementById("mode").value;
    fetchData(country, mode, true); // true indicates a new search
});

// Function to fetch data from the server or display from session storage
function fetchData(country, mode, isNewSearch = false) {
    if (isNewSearch) {
        sessionStorage.removeItem('routesData'); // Clear existing data for new search
    }

    let storedData = sessionStorage.getItem('routesData');
    if (storedData) {
        displayRoutes(JSON.parse(storedData));
    } else {
        fetch("http://127.0.0.1:3000/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ country, mode }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            sessionStorage.setItem('routesData', JSON.stringify(data)); // Store new data
            displayRoutes(data);
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("output").innerHTML = `<p>Error fetching routes: ${error.message}</p>`;
        });
    }
}

// Function to display routes on the page
function displayRoutes(data) {
    var outputDiv = document.getElementById("output");
    outputDiv.innerHTML = ""; // Clear previous content

    if (data.length === 0) {
        throw new Error('No trips found');
    }
    let routes = data[0];
    routes = lowercaseKeys(routes);

    Object.keys(routes).forEach((trip, index) => {
        var tripContainer = document.createElement("div");
        tripContainer.classList.add("trip-container");

        var tripLink = document.createElement("a");
        tripLink.href = generateTripLink(routes[trip]);
        tripLink.textContent = routes[trip].name;
        tripContainer.appendChild(tripLink);

        outputDiv.appendChild(tripContainer);
    });
}

// Function to generate a trip link with appropriate parameters
function generateTripLink(route) {
    try {
        return `trip.html?name=${encodeURIComponent(route.name)}&startLat=${route.start_coordinates.latitude}&startLng=${route.start_coordinates.longitude}&endLat=${route.end_coordinates.latitude}&endLng=${route.end_coordinates.longitude}`;
    } catch {
        try {
            return `trip.html?name=${encodeURIComponent(route.name)}&startLat=${route.startcoordinates.latitude}&startLng=${route.startcoordinates.longitude}&endLat=${route.endcoordinates.latitude}&endLng=${route.endcoordinates.longitude}`;
        } catch {
            return `trip.html?name=${encodeURIComponent(route.name)}&startLat=${route.start.latitude}&startLng=${route.start.longitude}&endLat=${route.end.latitude}&endLng=${route.end.longitude}`;
        }
    }
}

// Lowercase keys of nested objects function
function lowercaseKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = key.toLowerCase();
            newObj[newKey] = lowercaseKeys(obj[key]);
        }
    }
    return newObj;
}

// Call fetchData on page load to check for existing data in session storage
document.addEventListener("DOMContentLoaded", function() {
    var country = document.getElementById("country").value;
    var mode = document.getElementById("mode").value;
    fetchData(country, mode);
});
