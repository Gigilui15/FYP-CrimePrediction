class SearchManager {
    constructor(map, popupManager) {
        this.map = map;
        this.popupManager = popupManager;
        this.searchInput = document.getElementById('search');
        this.suggestionList = document.getElementById('suggestion-list');
        this.debounceTimer = null;
        this.setupInputEventHandler();
    }

    setupInputEventHandler() {
        this.searchInput.addEventListener('input', event => this.handleInput(event.target.value));
        this.searchInput.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const firstSuggestion = this.suggestionList.firstChild;
                if (firstSuggestion) {
                    firstSuggestion.click();
                }
            }
        });
    }

    handleInput(inputValue) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.fetchLocationSuggestions(inputValue);
        }, 300);
    }

    fetchLocationSuggestions(query) {
        if (!query) {
            this.suggestionList.style.display = 'none';
            return;
        }

        const bbox = '-118.6681900024414,33.70365524291992,-118.15536499023438,34.337310791015625'; // West, South, East, North
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&bounded=1&viewbox=${bbox}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                this.displaySuggestions(data.map(item => ({
                    name: item.display_name,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                })));
            })
            .catch(error => console.error('Error fetching location suggestions:', error));
    }

    displaySuggestions(suggestions) {
        this.suggestionList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const listItem = document.createElement('li');
            listItem.textContent = suggestion.name;
            listItem.addEventListener('click', () => this.selectSuggestion(suggestion));
            this.suggestionList.appendChild(listItem);
        });
        this.suggestionList.style.display = suggestions.length > 0 ? 'block' : 'none';
    }

    selectSuggestion(suggestion) {
        const coordinate = ol.proj.fromLonLat([suggestion.lon, suggestion.lat]);
        this.map.getView().setCenter(coordinate);
        this.map.getView().setZoom(12);
        this.searchInput.value = '';
        this.suggestionList.style.display = 'none';

        this.popupManager.showPopup(coordinate, `<div><strong>Location:</strong> ${suggestion.name}</div>`);
    }
}