class GISMap {
    constructor() {
        this.map = this.initMap();
        this.initLayers();
        this.initControls();
        this.setupEventHandlers();
        this.layerControl = new LayerControl(this.map); // Initialize LayerControl
        this.popupManager = new PopupManager(this.map); // Initialize PopupManager
        this.searchManager = new SearchManager(this.map, this.popupManager); // Initialize SearchManager
        this.addCustomControls();
    }

    initMap() {
        return new ol.Map({
            target: 'js-map',
            layers: [],
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
            { title: "Crime", type: "wms", url: "http://localhost:8080/geoserver/CrimePrediction/wms", params: { 'LAYERS': 'CrimePrediction:Crimes', 'TILED': true } }
        ];

        layersConfig.forEach(config => {
            let layer;
            if (config.type === "base") {
                layer = new ol.layer.Tile({ title: config.title, source: new ol.source.OSM() });
            } else if (config.type === "wms") {
                layer = new ol.layer.Tile({
                    title: config.title,
                    source: new ol.source.TileWMS({
                        url: config.url,
                        params: config.params,
                        serverType: 'geoserver'
                    })
                });
            }
            this.map.addLayer(layer);
        });
    }

    initControls() {
        const layerSwitcher = new ol.control.LayerSwitcher({
            activationMode: 'click',
            startActive: false,
            groupSelectStyle: 'children'
        });
        this.map.addControl(layerSwitcher);
    }

    setupEventHandlers() {
        this.map.on('singleclick', evt => this.popupManager.handleMapClick(evt));
    }

    addCustomControls() {
        const homeButton = this.createHomeButton();
        const fsButton = this.createFullscreenButton();
        const featureInfoButton = this.createFeatureInfoButton();

        this.map.addControl(homeButton);
        this.map.addControl(fsButton);
        this.map.addControl(featureInfoButton);
    }

    createHomeButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/home.png" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.onclick = () => location.href = "index.html";

        const element = document.createElement('div');
        element.className = 'homeButtonDiv';
        element.appendChild(button);

        return new ol.control.Control({ element: element });
    }

    createFullscreenButton() {
        const button = document.createElement('button');
        button.innerHTML = '<img src="./Images/fs.png" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
        button.className = 'myButton';
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
        button.innerHTML = '<img id="featureImg" src="./Images/click.png" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
        button.className = 'myButton';
        button.id = 'featureInfoButton';
        button.title = 'Click to toggle';

        const element = document.createElement('div');
        element.className = 'featureInfoButton';
        element.appendChild(button);

        button.addEventListener("click", () => {
            button.classList.toggle('clicked');
            this.popupManager.toggleFeatureInfoFlag();
        });

        return new ol.control.Control({ element: element });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gisMap = new GISMap();
});
