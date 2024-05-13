class LayerControl {
    constructor(map) {
        this.map = map;
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('filter-options').addEventListener('change', event => this.handleFilterChange(event));
    }

    handleFilterChange(event) {
        if (event.target.matches('input[type="checkbox"][name="filter"]')) {
            // If any checkbox is changed
            const allCrimesRadio = document.getElementById('all');
            allCrimesRadio.checked = false; // Uncheck "All Crimes"
            this.updateMultipleFilters();
        } else if (event.target.matches('input[type="radio"][name="filter"]')) {
            // If "All Crimes" radio is changed
            if (event.target.value === 'all') {
                document.querySelectorAll('input[type="checkbox"][name="filter"]').forEach(checkbox => {
                    checkbox.checked = false; // Uncheck all checkboxes
                });
                this.updateLayerFilter('all');
            }
        }
    }

    updateMultipleFilters() {
        const selectedFilters = Array.from(document.querySelectorAll('input[type="checkbox"][name="filter"]:checked')).map(el => el.value);
        const filterCondition = selectedFilters.length ? selectedFilters.map(filter => `agg_des = '${filter}'`).join(' OR ') : 'all';
        this.updateLayerFilter(filterCondition);
    }

    updateLayerFilter(filterCondition) {
        const layer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (layer) {
            const CQL_FILTER = filterCondition === 'all' ? null : filterCondition;
            layer.getSource().updateParams({ 'CQL_FILTER': CQL_FILTER });
            layer.getSource().refresh();
        }
    }
}
