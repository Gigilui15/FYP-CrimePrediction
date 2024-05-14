class LayerControl {
    constructor(map) {
        this.map = map;
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('filter-options').addEventListener('change', event => this.handleFilterChange(event));
        document.getElementById('area-filter-options').addEventListener('change', event => this.updateFilters());
        document.getElementById('year-filter').addEventListener('change', event => this.updateFilters());
    }

    handleFilterChange(event) {
        if (event.target.matches('input[type="checkbox"][name="filter"]')) {
            const allCrimesRadio = document.getElementById('all');
            allCrimesRadio.checked = false; // Uncheck "All Crimes"
            this.updateFilters();
        } else if (event.target.matches('input[type="radio"][name="filter"]')) {
            if (event.target.value === 'all') {
                document.querySelectorAll('input[type="checkbox"][name="filter"]').forEach(checkbox => {
                    checkbox.checked = false; // Uncheck all checkboxes
                });
            }
            this.updateFilters();
        }
    }

    updateFilters() {
        const selectedCrimeFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]:checked')).map(el => el.value);
        const selectedAreaFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="area-filter"]:checked')).map(el => el.value);
        const selectedYear = document.getElementById('year-filter').value;

        // Construct crime filter condition
        const crimeFilterCondition = selectedCrimeFilters.length ? `(${selectedCrimeFilters.map(filter => `agg_des = '${filter}'`).join(' OR ')})` : '1=1';

        // Construct area filter condition
        const areaFilterCondition = selectedAreaFilters.length ? `area IN (${selectedAreaFilters.join(', ')})` : '1=1';

        // Construct year filter condition
        const yearFilterCondition = selectedYear ? `year = ${selectedYear}` : '1=1';

        // Combine all conditions
        const combinedFilter = `${crimeFilterCondition} AND ${areaFilterCondition} AND ${yearFilterCondition}`;
        this.updateLayerFilter(combinedFilter);
    }

    updateLayerFilter(filterCondition) {
        const layer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (layer) {
            const CQL_FILTER = filterCondition === '1=1 AND 1=1 AND 1=1' ? null : filterCondition;
            layer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            layer.getSource().refresh();
        }
    }
}
