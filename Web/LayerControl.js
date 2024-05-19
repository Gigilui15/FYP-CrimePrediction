class LayerControl {
    constructor(map) {
        this.map = map;
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('filter-options').addEventListener('change', event => this.handleFilterChange(event));
        document.getElementById('area-filter-options').addEventListener('change', event => this.handleAreaFilterChange(event));
        document.getElementById('year-filter').addEventListener('change', event => this.updateFilters());
    }

    handleFilterChange(event) {
        if (event.target.matches('input[type="checkbox"][name="filter"]')) {
            const allCrimesRadio = document.getElementById('all');
            allCrimesRadio.checked = false;

            const anyCheckboxChecked = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]')).some(checkbox => checkbox.checked);
            if (!anyCheckboxChecked) {
                allCrimesRadio.checked = true;
            }

            this.updateFilters();
        } else if (event.target.matches('input[type="radio"][name="filter"]')) {
            if (event.target.value === 'all') {
                document.querySelectorAll('input[type="checkbox"][name="filter"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            this.updateFilters();
        }
    }

    handleAreaFilterChange(event) {
        if (event.target.matches('input[type="checkbox"][name="area-filter"]')) {
            const allAreasRadio = document.getElementById('all-areas');
            allAreasRadio.checked = false;

            const anyCheckboxChecked = Array.from(document.querySelectorAll('input[type="checkbox"][name="area-filter"]')).some(checkbox => checkbox.checked);
            if (!anyCheckboxChecked) {
                allAreasRadio.checked = true;
            }

            this.updateFilters();
        } else if (event.target.matches('input[type="radio"][name="area-filter"]')) {
            if (event.target.value === 'all-areas') {
                document.querySelectorAll('input[type="checkbox"][name="area-filter"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
            this.updateFilters();
        }
    }

    updateFilters() {
        const selectedCrimeFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]:checked')).map(el => el.value);
        const selectedAreaFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="area-filter"]:checked')).map(el => el.value);
        const selectedYear = document.getElementById('year-filter').value;

        const crimeFilterCondition = selectedCrimeFilters.length ? `(${selectedCrimeFilters.map(filter => `agg_des = '${filter}'`).join(' OR ')})` : '1=1';
        const areaFilterCondition = selectedAreaFilters.length ? `(${selectedAreaFilters.map(filter => `area = '${filter}'`).join(' OR ')})` : '1=1';
        const yearFilterCondition = selectedYear ? `year = ${selectedYear}` : '1=1';

        const combinedFilter = `${crimeFilterCondition} AND ${areaFilterCondition} AND ${yearFilterCondition}`;
        this.updateLayerFilter(combinedFilter);
        this.updateAreaVisibility(selectedAreaFilters);

        const allCrimesRadio = document.getElementById('all');
        if (!selectedCrimeFilters.length) {
            allCrimesRadio.checked = true;
        }

        const allAreasRadio = document.getElementById('all-areas');
        if (!selectedAreaFilters.length) {
            allAreasRadio.checked = true;
        }

        return { selectedCrimeFilters, selectedAreaFilters, selectedYear };
    }

    updateLayerFilter(filterCondition) {
        const layer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (layer) {
            const CQL_FILTER = filterCondition === '1=1 AND 1=1 AND 1=1' ? null : filterCondition;
            layer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            layer.getSource().refresh();
        }
    }

    updateAreaVisibility(selectedAreaFilters) {
        const areasLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Areas');
        if (areasLayer) {
            if (selectedAreaFilters.length) {
                const CQL_FILTER = `(${selectedAreaFilters.map(filter => `prec = '${filter}'`).join(' OR ')})`;
                areasLayer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            } else {
                areasLayer.getSource().updateParams({ 'CQL_FILTER': null });
            }
            areasLayer.getSource().refresh();
        }
    }

    async fetchAreaNames() {
        const url = 'http://localhost:8080/geoserver/CrimePrediction/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=CrimePrediction:Areas&outputFormat=application/json';
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data.features.map(feature => ({
                id: feature.properties.prec,
                name: feature.properties.Area
            }));
        } catch (error) {
            console.error('Error fetching area names:', error);
            return [];
        }
    }

    async createAreaCheckboxes() {
        const areas = await this.fetchAreaNames();
        areas.sort((a, b) => a.name.localeCompare(b.name));

        const container = document.getElementById('area-filter-options');
        container.innerHTML = `
            <h3>Areas</h3>
            <input type="radio" id="all-areas" name="area-filter" value="all-areas" checked>
            <label for="all-areas">All Areas</label>
            <br>
        `;
        
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

            container.appendChild(checkbox);
            container.appendChild(label);
            container.appendChild(document.createElement('br'));
        });
    }
}
