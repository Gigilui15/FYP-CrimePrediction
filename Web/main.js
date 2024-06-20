class GISMap {
    constructor() {
        this.map = this.initMap();
        this.initLayers();
        this.initControls();
        this.setupEventHandlers();
        this.layerControl = new LayerControl(this.map);
        this.popupManager = new PopupManager(this.map);
        this.searchManager = new SearchManager(this.map, this.popupManager);
        this.addCustomControls();
        this.addMousePositionControl();
        this.addEventListeners();
        this.hideLegends();
    }

    addEventListeners() {
        document.getElementById('generate-both-heatmaps').addEventListener('click', () => this.generateBothHeatmaps());
    }

    initMap() {
        return new ol.Map({
            target: 'js-map',
            layers: [], // Start with no layers
            view: new ol.View({
                center: ol.proj.fromLonLat([-118.2437, 34.020]),
                zoom: 10,
                minZoom: 10
            })
        });
    }

    initLayers() {
        const layersConfig = [
            { title: "Open Street Map", type: "base", url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
            { title: "Areas", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Areas', 'TILED': true } },
            { title: "Crime", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Crimes', 'TILED': true } },
        ];

        layersConfig.forEach(config => {
            let layer;
            if (config.type === "base") {
                layer = new ol.layer.Tile({ title: config.title, type: 'base', source: new ol.source.OSM() });
            } else if (config.type === "wms") {
                layer = new ol.layer.Tile({
                    title: config.title,
                    source: new ol.source.TileWMS({
                        url: config.url,
                        params: config.params,
                        serverType: 'geoserver'
                    }),
                    visible: config.visible !== undefined ? config.visible : true // Set visibility based on config, default to true
                });
            }
            this.map.addLayer(layer);
        });

        // Ensure OSM is at the bottom
        const osmLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Open Street Map');
        if (osmLayer) {
            osmLayer.setZIndex(0);
        }
    }

    initControls() {
        const layerSwitcher = new ol.control.LayerSwitcher({
            activationMode: 'click',
            startActive: false,
            groupSelectStyle: 'children'
        });
        this.map.addControl(layerSwitcher);
    }

    addMousePositionControl() {
        const mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: function(coordinate) {
                return `Lon: ${coordinate[0].toFixed(4)}   |   Lat: ${coordinate[1].toFixed(4)}`;
            },
            projection: 'EPSG:4326',
            className: 'mouse-position',
            target: document.getElementById('mouse-position'),
            undefinedHTML: 'Longitude: -, Latitude: -'
        });
        this.map.addControl(mousePositionControl);
    }

    setupEventHandlers() {
        this.map.on('singleclick', evt => this.popupManager.handleMapClick(evt));
    }

    calculateQuantiles(crimeCounts, numClasses) {
        const values = Object.values(crimeCounts).sort((a, b) => a - b);
        const quantiles = [];
        for (let i = 0; i <= numClasses; i++) {
            const index = Math.floor((values.length - 1) * i / numClasses);
            quantiles.push(values[index]);
        }
        return quantiles;
    }

    generateColorRamp() {
        return [
            '#ffffb2', // yellow
            '#fecb5c', // light orange
            '#fd9942', // orange
            '#f6602d', // dark orange
            '#ee2a23', // red
            '#a20205', // dark red
            '#620015'  // very dark red
        ];
    }

    generateLegend(quantiles, colorRamp, layerTitle, legendId) {
        const legend = document.getElementById(legendId);
        legend.innerHTML = `<h3>${layerTitle} - Legend</h3>`; // Reset legend content

        for (let i = 0; i < quantiles.length - 1; i++) {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';

            const colorBox = document.createElement('div');
            colorBox.style.width = '20px';
            colorBox.style.height = '20px';
            colorBox.style.backgroundColor = colorRamp[i];
            colorBox.style.marginRight = '10px';

            const label = document.createElement('span');
            let lowerBound = quantiles[i];
            let upperBound = quantiles[i + 1];

            label.textContent = `${Math.round(lowerBound)} - ${Math.round(upperBound)}`;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
        }
    }

    hideLegends() {
        document.getElementById('historical-legend').style.display = 'none';
        document.getElementById('predicted-legend').style.display = 'none';
    }

    applyChoroplethStyling(crimeCounts, layerTitle, legendId) {
        console.log(`Applying ${layerTitle} styling...`);
        const numClasses = 7;
        const quantiles = this.calculateQuantiles(crimeCounts, numClasses);
        const colorRamp = this.generateColorRamp();

        this.generateLegend(quantiles, colorRamp, layerTitle, legendId);

        const source = new ol.source.Vector({
            url: 'http://localhost:8080/geoserver/CrimePrediction/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=CrimePrediction:Areas&outputFormat=application/json',
            format: new ol.format.GeoJSON()
        });

        // Remove existing heatmap layer if it exists
        const existingLayer = this.map.getLayers().getArray().find(l => l.get('title') === layerTitle);
        if (existingLayer) {
            this.map.removeLayer(existingLayer);
        }

        const newLayer = new ol.layer.Vector({
            source: source,
            style: feature => {
                const area = feature.get('prec');
                const count = crimeCounts[area] || 0;
                let color = '#FFEDA0'; // Default color

                for (let i = 0; i < numClasses; i++) {
                    if (count <= quantiles[i + 1]) {
                        color = colorRamp[i];
                        break;
                    }
                }

                return new ol.style.Style({
                    fill: new ol.style.Fill({ color: color }),
                    stroke: new ol.style.Stroke({ color: '#333', width: 1 })
                });
            },
            title: layerTitle
        });

        this.map.addLayer(newLayer);
        newLayer.setZIndex(10);

        console.log(`${layerTitle} styling applied`);
    }

    addCustomControls() {
        const homeButton = this.createHomeButton();
        const fsButton = this.createFullscreenButton();
        const featureInfoButton = this.createFeatureInfoButton();
        const legendToggleButton = this.createLegendToggleButton();
    
        this.map.addControl(homeButton);
        this.map.addControl(fsButton);
        this.map.addControl(featureInfoButton);
        this.map.addControl(legendToggleButton);
    }

    createLegendToggleButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/legend.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.id = 'toggleLegendButton';
        button.title = 'Toggle Legend';
    
        const element = document.createElement('div');
        element.className = 'legendToggleButton';
        element.appendChild(button);
    
        button.addEventListener("click", () => {
            this.toggleLegend();
        });
    
        return new ol.control.Control({ element: element });
    }

    toggleLegend() {
        const historicalLegend = document.getElementById('historical-legend');
        const predictedLegend = document.getElementById('predicted-legend');
        const toggleButton = document.getElementById('toggleLegendButton');

        if (historicalLegend.style.display === 'none' || predictedLegend.style.display === 'none') {
            historicalLegend.style.display = 'block';
            predictedLegend.style.display = 'block';
            toggleButton.classList.add('clicked');
        } else {
            historicalLegend.style.display = 'none';
            predictedLegend.style.display = 'none';
            toggleButton.classList.remove('clicked');
        }
    }

    createHomeButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/home.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.title = 'Home';
        button.onclick = () => location.href = "index.html";

        const element = document.createElement('div');
        element.className = 'homeButtonDiv';
        element.appendChild(button);

        return new ol.control.Control({ element: element });
    }

    createFullscreenButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/fs.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.title = 'Toggle Map Fullscreen';
        button.onclick = () => {
            const mapElement = document.getElementById('js-map');
            if (!document.fullscreenElement) {
                mapElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            button.firstChild.src = document.fullscreenElement ? './Images/fs.png' : './Images/ss.png';
        };

        const element = document.createElement('div');
        element.className = 'fsButtonDiv';
        element.appendChild(button);

        return new ol.control.Control({ element: element });
    }

    createFeatureInfoButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img id="featureImg" src="./Images/click.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.id = 'featureInfoButton';
        button.title = 'Point Information';

        const element = document.createElement('div');
        element.className = 'featureInfoButton';
        element.appendChild(button);

        button.addEventListener("click", () => {
            button.classList.toggle('clicked');
            this.popupManager.toggleFeatureInfoFlag();
        });

        return new ol.control.Control({ element: element });
    }

    async fetchAndAggregatePredictionData() {
        const monthFilter = document.getElementById('month-filter').value;
        const crimeTypeFilters = [];
        document.querySelectorAll('#filter-options input[type="checkbox"]:checked').forEach(checkbox => {
            crimeTypeFilters.push(checkbox.value);
        });

        const cqlFilter = [];
        if (monthFilter) {
            cqlFilter.push(`month=${monthFilter}`);
        }
        if (crimeTypeFilters.length > 0) {
            cqlFilter.push(`(${crimeTypeFilters.map(id => `agg_id='${id}'`).join(' OR ')})`);
        }

        const cqlFilterString = cqlFilter.length > 0 ? `&CQL_FILTER=${encodeURIComponent(cqlFilter.join(' AND '))}` : '';
        const url = `http://localhost:8080/geoserver/CrimePrediction/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=CrimePrediction:LSTM_Predictions&outputFormat=application/json${cqlFilterString}`;

        try {
            const response = await fetch(url);
            const text = await response.text();

            // Check if the response is JSON or XML
            if (text.startsWith('<')) {
                console.error('Server returned an error:', text);
                alert('Error fetching prediction data. Please check the server response.');
                return;
            }

            const data = JSON.parse(text);
            const features = new ol.format.GeoJSON().readFeatures(data);
            const crimeCounts = {};

            features.forEach(feature => {
                const area = feature.get('area');
                const totalCrimes = Math.round(feature.get('total_crimes'));
                const aggId = feature.get('agg_id');
                const month = feature.get('month');

                // Log and aggregate the total crimes for all or selected crime categories
                if (crimeTypeFilters.length === 0 || crimeTypeFilters.includes(aggId.toString())) {
                    console.log(`Area ID: ${area}, Total Crimes: ${totalCrimes}, Crime Category: ${aggId}, Month: ${month}`);

                    if (!crimeCounts[area]) {
                        crimeCounts[area] = 0;
                    }
                    crimeCounts[area] += totalCrimes;
                }
            });

            return crimeCounts;
        } catch (error) {
            console.error('Error fetching and aggregating prediction data:', error);
            alert('Error fetching prediction data. Please check the console for more details.');
        }
    }

    async fetchAndAggregateCrimeData() {
        console.log('Fetching and aggregating crime data...');
        const crimeLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (!crimeLayer) {
            console.error('Crime layer not found');
            return;
        }

        const yearFilter = document.getElementById('year-filter').value;
        const monthFilter = document.getElementById('month-filter').value;
        const crimeTypeFilters = [];
        document.querySelectorAll('#filter-options input[type="checkbox"]:checked').forEach(checkbox => {
            crimeTypeFilters.push(`agg_id='${checkbox.value}'`);
        });

        const cqlFilter = [];
        if (yearFilter) {
            cqlFilter.push(`year=${yearFilter}`);
        }
        if (monthFilter) {
            cqlFilter.push(`month=${monthFilter}`);
        }
        if (crimeTypeFilters.length > 0) {
            cqlFilter.push(`(${crimeTypeFilters.join(' OR ')})`);
        }

        const cqlFilterString = cqlFilter.length > 0 ? `&CQL_FILTER=${encodeURIComponent(cqlFilter.join(' AND '))}` : '';
        const url = `http://localhost:8080/geoserver/CrimePrediction/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=CrimePrediction:Crimes&outputFormat=application/json${cqlFilterString}`;

        console.log('CQL Filter:', cqlFilterString);
        console.log('Fetch URL:', url);

        try {
            const response = await fetch(url);
            const text = await response.text();

            // Check if the response is JSON or XML
            if (text.startsWith('<')) {
                console.error('Server returned an error:', text);
                return;
            }

            const data = JSON.parse(text);
            console.log('Data fetched:', data);

            const features = new ol.format.GeoJSON().readFeatures(data);
            const crimeCounts = {};

            features.forEach(feature => {
                const area = feature.get('area');
                if (!crimeCounts[area]) {
                    crimeCounts[area] = 0;
                }
                crimeCounts[area] += 1;
            });

            console.log('Crime counts:', crimeCounts);
            return crimeCounts;
        } catch (error) {
            console.error('Error fetching and aggregating crime data:', error);
        }
    }

    async generateBothHeatmaps() {
        console.log('Generating both heatmaps...');

        // Show loading indicator
        document.getElementById('loading-indicator').style.visibility = 'visible';

        // Generate Historical Data Heatmap
        const historicalCrimeCounts = await this.fetchAndAggregateCrimeData();
        if (historicalCrimeCounts) {
            this.applyChoroplethStyling(historicalCrimeCounts, 'Historical Data Heatmap', 'historical-legend');
        } else {
            console.error('No crime data available for Historical Data Heatmap styling');
        }

        // Generate Predictions Heatmap
        const predictedCrimeCounts = await this.fetchAndAggregatePredictionData();
        if (predictedCrimeCounts) {
            this.applyChoroplethStyling(predictedCrimeCounts, 'Predictions Heatmap', 'predicted-legend');
        } else {
            console.error('No prediction data available for Predictions Heatmap styling');
        }

        // Hide loading indicator
        document.getElementById('loading-indicator').style.visibility = 'hidden';
    }

    async generateHeatmap() {
        console.log('Generating heatmap...');

        // Show loading indicator
        document.getElementById('loading-indicator').style.visibility = 'visible';

        const crimeCounts = await this.fetchAndAggregateCrimeData();
        if (crimeCounts) {
            this.applyChoroplethStyling(crimeCounts, 'Historical Data Heatmap');

            const areasLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Areas');
            const crimesLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
            if (areasLayer) areasLayer.setVisible(false);
            if (crimesLayer) crimesLayer.setVisible(false);

            const osmLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Open Street Map');
            if (osmLayer) osmLayer.setZIndex(0);

            localStorage.setItem('heatmapGenerated', 'true');
            localStorage.setItem('heatmapCrimeCounts', JSON.stringify(crimeCounts));
            localStorage.setItem('areasLayerVisible', areasLayer.getVisible());
            localStorage.setItem('crimesLayerVisible', crimesLayer.getVisible());
        } else {
            console.error('No crime data available for Historical Data Heatmap styling');
        }

        // Hide loading indicator
        document.getElementById('loading-indicator').style.visibility = 'hidden';
    }

    async generatePredictionsHeatmap() {
        console.log('Generating predictions heatmap...');
        document.getElementById('loading-indicator').style.visibility = 'visible';

        const crimeCounts = await this.fetchAndAggregatePredictionData();
        if (crimeCounts) {
            this.applyChoroplethStyling(crimeCounts, 'Predictions Heatmap');

            const areasLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Areas');
            const crimesLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
            if (areasLayer) areasLayer.setVisible(false);
            if (crimesLayer) crimesLayer.setVisible(false);

            const osmLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Open Street Map');
            if (osmLayer) osmLayer.setZIndex(0);

            localStorage.setItem('predictionsHeatmapGenerated', 'true');
            localStorage.setItem('predictionsHeatmapCrimeCounts', JSON.stringify(crimeCounts));
        } else {
            console.error('No prediction data available for Predictions Heatmap styling');
        }

        document.getElementById('loading-indicator').style.visibility = 'hidden';
    }

    async generateCustomHeatmap() {
        console.log('Generating custom heatmap...');
        document.getElementById('loading-indicator').style.visibility = 'visible';

        const crimeCounts = await this.fetchAndAggregateCrimeData();
        if (crimeCounts) {
            this.applyChoroplethStyling(crimeCounts, 'Historical Data Heatmap');

            const areasLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Areas');
            const crimesLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
            if (areasLayer) areasLayer.setVisible(false);
            if (crimesLayer) crimesLayer.setVisible(false);

            const osmLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Open Street Map');
            if (osmLayer) osmLayer.setZIndex(0);

            localStorage.setItem('customHeatmapGenerated', 'true');
            localStorage.setItem('customHeatmapCrimeCounts', JSON.stringify(crimeCounts));
        } else {
            console.error('No crime data available for custom heatmap styling');
        }

        document.getElementById('loading-indicator').style.visibility = 'hidden';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const gisMap = new GISMap();
});