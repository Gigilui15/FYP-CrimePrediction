class SearchManager {
    constructor(map, popupManager) {
        this.map = map; // Reference to the map object
        this.popupManager = popupManager; // Reference to the popup manager object
        this.searchInput = document.getElementById('search'); // Search input field element
        this.suggestionList = document.getElementById('suggestion-list'); // Suggestion list element
        this.debounceTimer = null; // Timer ID for debouncing
        this.setupInputEventHandler(); // Initialise event handlers for the search input field
    }

    // Method to set up event handlers for the search input field
    setupInputEventHandler() {
        // Event listener for input events on the search field to handle input changes
        this.searchInput.addEventListener('input', event => this.handleInput(event.target.value));
        // Event listener for keypress events to handle Enter key press
        this.searchInput.addEventListener('keypress', event => {
            if (event.key === 'Enter') { // Check if the Enter key pressed
                event.preventDefault(); // Prevent the default form submission behavior
                const firstSuggestion = this.suggestionList.firstChild; // Get the first suggestion in the list
                if (firstSuggestion) {
                    firstSuggestion.click(); // Simulate a click on the first suggestion
                }
            }
        });
    }

    // Method to handle user input with debouncing to limit API calls
    handleInput(inputValue) {
        clearTimeout(this.debounceTimer); // Clear any existing timer
        // Set a new timer to fetch location suggestions after a delay of 300ms
        this.debounceTimer = setTimeout(() => {
            this.fetchLocationSuggestions(inputValue);
        }, 300);
    }

    // Method to fetch location suggestions from the API based on the user query
    fetchLocationSuggestions(query) {
        // If the query is empty, hide the suggestion list and return
        if (!query) {
            this.suggestionList.style.display = 'none';
            return;
        }

        // Bounding box coordinates for Los Angeles
        const bbox = '-118.6681900024414,33.70365524291992,-118.15536499023438,34.337310791015625'; // West, South, East, North
        // Construct the API URL with the query and bounding box parameters
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&bounded=1&viewbox=${bbox}`;

        // Fetch location suggestions from the API
        fetch(apiUrl)
            .then(response => response.json()) // Parse the response as JSON
            .then(data => {
                // Map the response data to a format suitable for displaying suggestions
                this.displaySuggestions(data.map(item => ({
                    name: item.display_name, // Location name
                    lat: parseFloat(item.lat), // Latitude
                    lon: parseFloat(item.lon) // Longitude
                })));
            })
            .catch(error => console.error('Error fetching location suggestions:', error)); // Log any errors
    }

    // Method to display the fetched suggestions in the suggestion list
    displaySuggestions(suggestions) {
        this.suggestionList.innerHTML = ''; // Clear any existing suggestions
        suggestions.forEach(suggestion => {
            // Create a new list item for each suggestion
            const listItem = document.createElement('li');
            listItem.textContent = suggestion.name; // Set the text content to the suggestion name
            // Add a click event listener to handle suggestion selection
            listItem.addEventListener('click', () => this.selectSuggestion(suggestion));
            // Append the list item to the suggestion list
            this.suggestionList.appendChild(listItem);
        });
        // Show the suggestion list if there are suggestions, otherwise hide it
        this.suggestionList.style.display = suggestions.length > 0 ? 'block' : 'none';
    }

    // Method to handle the selection of a suggestion from the list
    selectSuggestion(suggestion) {
        // Convert the suggestion's coordinates to the map's coordinate system
        const coordinate = ol.proj.fromLonLat([suggestion.lon, suggestion.lat]);
        // Set the map's view to the selected location
        this.map.getView().setCenter(coordinate);
        this.map.getView().setZoom(12); // Set an appropriate zoom level
        this.searchInput.value = ''; // Clear the search input field
        this.suggestionList.style.display = 'none'; // Hide the suggestion list

        // Show a popup at the selected location with the suggestion name
        this.popupManager.showPopup(coordinate, `<div><strong>Location:</strong> ${suggestion.name}</div>`);
    }
}
