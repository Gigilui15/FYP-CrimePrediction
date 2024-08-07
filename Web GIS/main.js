// Mapping month numbers to month names
const monthNames = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};

// Mapping crime codes to crime names
const crimeNames = {
    '400': 'Aggravated Assault',
    '750': 'Burglary',
    '1900': 'Damage of Asset',
    '800': 'Identity Theft',
    '850': 'Property Crimes',
    '725': 'Robbery',
    '300': 'Simple Assault',
    '775': 'Theft',
    '2400': 'Threats & Scares',
    '1700': 'Violation of Court Order'
};

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

    // Initialising the OpenLayers map
    initMap() {
        return new ol.Map({
            target: 'js-map',
            layers: [], 
            view: new ol.View({
                center: ol.proj.fromLonLat([-118.2437, 34.020]), // Center map on Los Angeles
                zoom: 10,
                minZoom: 10
            })
        });
    }    

    // Initialising map layers
    initLayers() {
        // Configuration for different map layers
        const layersConfig = [
            { title: "Open Street Map", type: "base", url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png" },
            { title: "Areas", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Areas', 'TILED': true } },
            { title: "Crime", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Crimes', 'TILED': true } },
            { title: "Local CBD Lines", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Local CBD Lines', 'TILED': true }, visible: false }
        ];

        //Adding each configured layer to the map
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
                    visible: config.visible !== undefined ? config.visible : true // Setting visibility based on config, default to true
                });
            }
            this.map.addLayer(layer);
        });

        // Setting the z-index for the Open Street Map layer to ensure it is at the bottom
        const osmLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Open Street Map');
        if (osmLayer) {
            osmLayer.setZIndex(0);
        }
    }

    // Initialising map controls
    initControls() {
        // Layer switcher control to toggle layers
        const layerSwitcher = new ol.control.LayerSwitcher({
            activationMode: 'click', // Activation mode
            startActive: false, // Start inactive
            groupSelectStyle: 'children' // Selection style
        });
        this.map.addControl(layerSwitcher);
    }

    // Mouse position control to the map
    addMousePositionControl() {
        const mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: function(coordinate) {
                return `Lon: ${coordinate[0].toFixed(4)}   |   Lat: ${coordinate[1].toFixed(4)}`;
            },
            projection: 'EPSG:4326',
            className: 'mouse-position',
            target: document.getElementById('mouse-position'),
            undefinedHTML: 'Longitude: -, Latitude: -' // Text when position is undefined
        });
        this.map.addControl(mousePositionControl);
    }

    // Event handlers for map interactions
    setupEventHandlers() {
        this.map.on('singleclick', evt => this.popupManager.handleMapClick(evt));
    }

    // Event listeners for UI elements
    addEventListeners() {
        document.getElementById('generate-both-heatmaps').addEventListener('click', () => this.generateBothHeatmaps());
    }

    // Home button to focus the map onto LA
    createHomeButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/home.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.title = 'Home'; // Tooltip text
        button.onclick = () => location.href = "index.html";

        const element = document.createElement('div');
        element.className = 'homeButtonDiv';
        element.appendChild(button);

        return new ol.control.Control({ element: element });
    }

    // Fullscreen button for the map
    createFullscreenButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/fs.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.title = 'Toggle Map Fullscreen'; // Tooltip text
        button.onclick = () => {
            const mapElement = document.getElementById('js-map');
            if (!document.fullscreenElement) {
                mapElement.requestFullscreen(); // Request fullscreen mode
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen(); // Exit fullscreen mode
                }
            }
            button.firstChild.src = document.fullscreenElement ? './Images/fs.png' : './Images/ss.png'; // Toggle icon button for fullscreen mode
        };

        const element = document.createElement('div');
        element.className = 'fsButtonDiv';
        element.appendChild(button);

        return new ol.control.Control({ element: element });
    }

    // Feature info button for the Heatmaps and Crime Points
    createFeatureInfoButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img id="featureImg" src="./Images/click.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.id = 'featureInfoButton';
        button.title = 'Point Information & Heatmap Information'; // Tooltip text

        const element = document.createElement('div');
        element.className = 'featureInfoButton';
        element.appendChild(button);

        button.addEventListener("click", () => {
            button.classList.toggle('clicked'); // Toggle button class
            this.popupManager.toggleFeatureInfoFlag(); // Toggle feature info flag
        });

        return new ol.control.Control({ element: element });
    }

    //Creating the Legend Toggling Button for Heatmap Info
    createLegendToggleButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/legend.png" style="width:20px;filter:brightness(0) invert(0); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.id = 'toggleLegendButton';
        button.title = 'Toggle Legend'; // Tooltip text
    
        const element = document.createElement('div');
        element.className = 'legendToggleButton';
        element.appendChild(button);
    
        button.addEventListener("click", () => {
            this.toggleLegend(); // Toggle legend visibility on click
        });
    
        return new ol.control.Control({ element: element });
    }
    
    //Legend Toggling Function
    toggleLegend() {
        const historicalLegend = document.getElementById('historical-legend');
        const predictedLegend = document.getElementById('predicted-legend');
        const toggleButton = document.getElementById('toggleLegendButton');

        if (historicalLegend.style.display === 'none' || predictedLegend.style.display === 'none') {
            historicalLegend.style.display = 'block'; // Show historical legend
            predictedLegend.style.display = 'block'; // Show predicted legend
            toggleButton.classList.add('clicked'); // Add clicked class to button
        } else {
            historicalLegend.style.display = 'none'; // Hide historical legend
            predictedLegend.style.display = 'none'; // Hide predicted legend
            toggleButton.classList.remove('clicked'); // Remove clicked class from button
        }
    }

    // Add custom controls to the map
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

    // Apply choropleth styling to the heatmap layer
    applyChoroplethStyling(crimeCounts, layerTitle, legendId) {
        console.log(`Applying ${layerTitle} styling...`);
        const numClasses = 7; // Number of classes for heatmap color ramp range to be split into
        const quantiles = this.calculateQuantiles(crimeCounts, numClasses);
        const colorRamp = this.generateColorRamp();
    
        // Get filter details and set the year correctly for predictions
        const filters = this.layerControl.updateFilters();
        let year = filters.selectedYear || '2015-2019'; // Default to '2015-2019' if no year is selected
        if (layerTitle === '2019 Predictions Heatmap') {
            year = '2019'; // Always 2019 for predictions heatmap
        }
        
        const month = filters.selectedMonth ? monthNames[filters.selectedMonth] : 'All';
        const crimes = filters.selectedCrimeFilters.length ? filters.selectedCrimeFilters.map(id => crimeNames[id]).join(', ') : 'All';
    
        const filterDetails = `<div style="margin-bottom: 5px;"><strong>Year:</strong> ${year}</div>
                               <div style="margin-bottom: 5px;"><strong>Month:</strong> ${month}</div>
                               <div><strong>Crimes:</strong> ${crimes}</div>`;
    
        this.generateLegend(quantiles, colorRamp, layerTitle, legendId, filterDetails);
    
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
                const areaName = feature.get('Area');
                let color = '#FFEDA0'; // Default color
    
                for (let i = 0; i < numClasses; i++) {
                    if (count <= quantiles[i + 1]) {
                        color = colorRamp[i];
                        break;
                    }
                }
    
                // Set the properties on the feature
                feature.set('total_crimes', count);
                feature.set('area_name', areaName);
                feature.set('month', month);
                feature.set('crimes', crimes);
    
                return new ol.style.Style({
                    fill: new ol.style.Fill({ color: color }), // Fill color based on crime count
                    stroke: new ol.style.Stroke({ color: '#333', width: 1 }) // Stroke style
                });
            }
        });
    
        newLayer.set('title', layerTitle); // Set layer title
        this.map.addLayer(newLayer); // Add new layer to the map
    }    

    // Calculate quantiles for choropleth mapping
    calculateQuantiles(crimeCounts, numClasses) {
        const values = Object.values(crimeCounts).sort((a, b) => a - b);
        const quantiles = [];
        for (let i = 0; i <= numClasses; i++) {
            const index = Math.floor((values.length - 1) * i / numClasses);
            quantiles.push(values[index]);
        }
        return quantiles;
    }

    //The color ramp for the Heatmaps
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

    //Generating a Legend for the Heatmap
    generateLegend(quantiles, colorRamp, layerTitle, legendId, filterDetails) {
        const legend = document.getElementById(legendId);
        legend.innerHTML = `<h3>${layerTitle} - Legend</h3>`; // Reset legend content
    
        // Add filter details to the legend
        if (filterDetails) {
            const filterDetailsDiv = document.createElement('div');
            filterDetailsDiv.className = 'legend-filter-details';
    
            filterDetailsDiv.innerHTML = filterDetails;// Set filter details content
    
            legend.appendChild(filterDetailsDiv);
        }
    
        // Add legend items for each quantile range
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
    
    //Function to hide the Legend of each Heatmap
    hideLegends() {
        document.getElementById('historical-legend').style.display = 'none';
        document.getElementById('predicted-legend').style.display = 'none';
    }

    // Fetch and aggregate prediction data for the predictions heatmap
    async fetchAndAggregatePredictionData() {
        const monthFilter = document.getElementById('month-filter').value; // Get selected month filter
        const crimeTypeFilters = [];
        document.querySelectorAll('#filter-options input[type="checkbox"]:checked').forEach(checkbox => {
            crimeTypeFilters.push(checkbox.value); // Get selected crime type filters
        });

        const cqlFilter = [];
        if (monthFilter) {
            cqlFilter.push(`month=${monthFilter}`); // Add month filter to CQL filter
        }
        if (crimeTypeFilters.length > 0) {
            cqlFilter.push(`(${crimeTypeFilters.map(id => `agg_id='${id}'`).join(' OR ')})`);  // Add crime type filters to CQL filter
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

    // Fetch and aggregate prediction data for the historical data heatmap
    async fetchAndAggregateCrimeData() {
        console.log('Fetching and aggregating crime data...');
        const crimeLayer = this.map.getLayers().getArray().find(l => l.get('title') === 'Crime');
        if (!crimeLayer) {
            console.error('Crime layer not found');
            return;
        }
    
        const yearFilter = document.getElementById('year-filter').value; // Get selected year filter
        const monthFilter = document.getElementById('month-filter').value; // Get selected month filter
        const crimeTypeFilters = [];
        document.querySelectorAll('#filter-options input[type="checkbox"]:checked').forEach(checkbox => {
            crimeTypeFilters.push(`agg_id='${checkbox.value}'`); // Get selected crime type filters
        });
    
        const cqlFilter = [];
        if (yearFilter) {
            cqlFilter.push(`year=${yearFilter}`);  // Add year filter to CQL filter
        }
        if (monthFilter) {
            cqlFilter.push(`month=${monthFilter}`); // Add month filter to CQL filter
        }
        if (crimeTypeFilters.length > 0) {
            cqlFilter.push(`(${crimeTypeFilters.join(' OR ')})`); // Add crime type filters to CQL filter
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
                const totalCrimes = 1;
                const aggId = feature.get('agg_id');
                const month = feature.get('month');
    
                // Log and aggregate the total crimes for all or selected crime categories
                if (crimeTypeFilters.length === 0 || crimeTypeFilters.includes(`agg_id='${aggId}'`)) {
                    console.log(`Area ID: ${area}, Total Crimes: ${totalCrimes}, Crime Category: ${aggId}, Month: ${month}`);
    
                    if (!crimeCounts[area]) {
                        crimeCounts[area] = 0;
                    }
                    crimeCounts[area] += totalCrimes;
                }
            });
    
            console.log('Crime counts:', crimeCounts);
            return crimeCounts;
        } catch (error) {
            console.error('Error fetching and aggregating crime data:', error);
        }
    }    

    //Function to generate both predicted and historical data heatmaps at a time (To avoid comparing two different heatmaps) with the same filters (apart from "year" for the predictions heatmap).
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
            this.applyChoroplethStyling(predictedCrimeCounts, '2019 Predictions Heatmap', 'predicted-legend');
        } else {
            console.error('No prediction data available for 2019 Predictions Heatmap styling');
        }
    
        // Hide loading indicator
        document.getElementById('loading-indicator').style.visibility = 'hidden';
    
        // Toggle the Crimes and Areas layers off
        this.toggleLayerVisibility('Crime', false);
        this.toggleLayerVisibility('Areas', false);
    }
    
    // Helper function to toggle layer visibility
    toggleLayerVisibility(layerTitle, visibility) {
        const layer = this.map.getLayers().getArray().find(l => l.get('title') === layerTitle);
        if (layer) {
            layer.setVisible(visibility);
        }
    }
}

// Initialize the GISMap class 
document.addEventListener('DOMContentLoaded', async () => {
    const gisMap = new GISMap();
});