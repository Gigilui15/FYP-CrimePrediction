class LayerControl {
    constructor(map) {
        this.map = map; // Reference to the map object
        this.initEventListeners(); // Initialise event listeners for filter changes
        this.createAreaCheckboxes(); // Create checkboxes for area filters
    }

    // Initialise event listeners for filter changes
    initEventListeners() {
        // Change event listeners for the filter options and date filters
        document.getElementById('filter-options').addEventListener('change', event => this.handleFilterChange(event));
        document.getElementById('area-filter-options').addEventListener('change', event => this.handleAreaFilterChange(event));
        document.getElementById('year-filter').addEventListener('change', event => this.updateFilters());
        document.getElementById('month-filter').addEventListener('change', event => this.updateFilters());
    }

    // Handle changes in crime category filters
    handleFilterChange(event) {
        // If the event target is a crime category checkbox
        if (event.target.matches('input[type="checkbox"][name="filter"]')) {
            const allCrimesRadio = document.getElementById('all'); // Reference to the "All Crimes" radio button
            allCrimesRadio.checked = false; // Uncheck the "All Crimes" radio button

            // Check if any crime category checkbox is checked
            const anyCheckboxChecked = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]')).some(checkbox => checkbox.checked);
            if (!anyCheckboxChecked) {
                allCrimesRadio.checked = true; // Check the "All Crimes" radio button if no checkboxes are checked
            }

            this.updateFilters(); // Update the filters
        } else if (event.target.matches('input[type="radio"][name="filter"]')) {
            // If the event target is the "All Crimes" radio button
            if (event.target.value === 'all') {
                // Uncheck all crime category checkboxes
                document.querySelectorAll('input[type="checkbox"][name="filter"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            this.updateFilters(); // Update the filters
        }
    }

    // Handle changes in area filters
    handleAreaFilterChange(event) {
        // If the event target is an area checkbox
        if (event.target.matches('input[type="checkbox"][name="area-filter"]')) {
            const allAreasRadio = document.getElementById('all-areas'); // Reference to the "All Areas" radio button
            allAreasRadio.checked = false; // Uncheck the "All Areas" radio button

            // Check if any area checkbox is checked
            const anyCheckboxChecked = Array.from(document.querySelectorAll('input[type="checkbox"][name="area-filter"]')).some(checkbox => checkbox.checked);
            if (!anyCheckboxChecked) {
                allAreasRadio.checked = true; // Check the "All Areas" radio button if no checkboxes are checked
            }

            this.updateFilters(); // Update the filters
        } else if (event.target.matches('input[type="radio"][name="area-filter"]')) {
            // If the event target is the "All Areas" radio button
            if (event.target.value === 'all-areas') {
                // Uncheck all area checkboxes
                document.querySelectorAll('input[type="checkbox"][name="area-filter"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            this.updateFilters(); // Update the filters
        }
    }

    // Update filters based on selected criteria
    updateFilters() {
        // Get selected crime category filters
        const selectedCrimeFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]:checked')).map(el => el.value);
        // Get selected area filters
        const selectedAreaFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="area-filter"]:checked')).map(el => el.value);
        // Get selected year and month filters
        const selectedYear = document.getElementById('year-filter').value;
        const selectedMonth = document.getElementById('month-filter').value;

        // Create filter conditions for crime categories, areas, year, and month
        const crimeFilterCondition = selectedCrimeFilters.length ? `(${selectedCrimeFilters.map(filter => `agg_id = '${filter}'`).join(' OR ')})` : '1=1';
        const areaFilterCondition = selectedAreaFilters.length ? `(${selectedAreaFilters.map(filter => `area = '${filter}'`).join(' OR ')})` : '1=1';
        const yearFilterCondition = selectedYear ? `year = ${selectedYear}` : '1=1';
        const monthFilterCondition = selectedMonth ? `month = '${selectedMonth}'` : '1=1';

        // Combine all filter conditions
        const combinedFilter = `${crimeFilterCondition} AND ${areaFilterCondition} AND ${yearFilterCondition} AND ${monthFilterCondition}`;
        this.updateLayerFilter(combinedFilter); // Update the crime layer filter
        this.updateAreaVisibility(selectedAreaFilters); // Update the visibility of the area layer

        // Ensure the "All Crimes" radio button is checked if no crime category filters are selected
        const allCrimesRadio = document.getElementById('all');
        if (!selectedCrimeFilters.length) {
            allCrimesRadio.checked = true;
        }

        // Ensure the "All Areas" radio button is checked if no area filters are selected
        const allAreasRadio = document.getElementById('all-areas');
        if (!selectedAreaFilters.length) {
            allAreasRadio.checked = true;
        }

        // Return the selected filters for further use
        return { selectedCrimeFilters, selectedAreaFilters, selectedYear, selectedMonth };
    }

    // Update the filter for the Crimes layer
    updateLayerFilter(filterCondition) {
        // Find the Crimes layer in the map's layer array
        const layer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (layer) {
            // Set the CQL filter parameter for the layer's source
            const CQL_FILTER = filterCondition === '1=1 AND 1=1 AND 1=1 AND 1=1' ? null : filterCondition;
            layer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            layer.getSource().refresh(); // Refresh the layer to apply the new filter
        }
    }

    // Update the visibility of the area layer based on selected areas
    updateAreaVisibility(selectedAreaFilters) {
        // Find the area layer in the map's layer array
        const areasLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Areas');
        if (areasLayer) {
            // Set the CQL filter parameter for the layer's source based on selected areas
            if (selectedAreaFilters.length) {
                const CQL_FILTER = `(${selectedAreaFilters.map(filter => `prec = '${filter}'`).join(' OR ')})`;
                areasLayer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            } else {
                areasLayer.getSource().updateParams({ 'CQL_FILTER': null });
            }
            areasLayer.getSource().refresh(); // Refresh the layer to apply the new filter
        }
    }

    // Fetch area names from the GeoServer
    async fetchAreaNames() {
        const url = 'http://localhost:8080/geoserver/CrimePrediction/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=CrimePrediction:Areas&outputFormat=application/json';
        try {
            const response = await fetch(url); // Fetch the area data from the GeoServer
            const data = await response.json(); // Parse the response as JSON
            // Map the fetched features to area objects with id and name properties
            return data.features.map(feature => ({
                id: feature.properties.prec,
                name: feature.properties.Area
            }));
        } catch (error) {
            console.error('Error fetching area names:', error); // Log any errors
            return []; // Return an empty array in case of an error
        }
    }

    // Create checkboxes for each area
    async createAreaCheckboxes() {
        const areas = await this.fetchAreaNames(); // Fetch area names
        areas.sort((a, b) => a.name.localeCompare(b.name)); // Sort the areas alphabetically by name

        const container = document.getElementById('area-filter-options'); // Reference to the area filter options container
        container.innerHTML = `
            <h3>Areas</h3>
            <input type="radio" id="all-areas" name="area-filter" value="all-areas" checked>
            <label for="all-areas">All Areas</label>
            <br>
        `; // Create the "All Areas" radio button

        // Create a checkbox for each area
        areas.forEach(area => {
            const checkboxId = `area-${area.id}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.name = 'area-filter';
            checkbox.value = area.id;

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.textContent = area.name;

            container.appendChild(checkbox); // Append the checkbox to the container
            container.appendChild(label); // Append the label to the container
            container.appendChild(document.createElement('br')); // Append a line break to the container
        });
    }
}
