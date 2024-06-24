//Function to Format the Popup Cases
function format(str) {
    return str.toLowerCase().replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

class PopupManager {
    constructor(map) {
        this.map = map; // Reference to the map object
        this.container = document.getElementById('popup'); // Popup container element
        this.content = document.getElementById('popup-content'); // Popup content element
        
        // Create header for the popup
        this.header = document.createElement('div');
        this.header.className = 'popup-header';
        
        // Create closer button for the popup
        this.closer = document.createElement('a');
        this.closer.className = 'ol-popup-closer';
        this.closer.innerHTML = '&#x2716;'; // Unicode for "X" to close the popup
        
        // Create remove button for the popup
        this.removeButton = document.createElement('a');
        this.removeButton.className = 'ol-popup-remove';
        this.removeButton.innerHTML = '&#128465;'; // Unicode for bin icon
        
        // Container for the closer and remove buttons
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';
        iconContainer.appendChild(this.closer);
        iconContainer.appendChild(this.removeButton);

        // Append icon container to the header
        this.header.appendChild(iconContainer);
        
        // Insert header before the content in the popup container
        this.container.insertBefore(this.header, this.content);

        // Create the main popup overlay
        this.popup = new ol.Overlay({
            element: this.container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        this.map.addOverlay(this.popup); // Add the popup to the map
        this.setupCloseEventHandler(); // Set up close event handler
        this.setupRemoveEventHandler(); // Set up remove event handler
        this.featureInfoFlag = false; // Flag to indicate if feature info is enabled
        this.highlightOverlay = null; // To store the point overlay
        this.popupShown = false; // Flag to track popup state
        
        // Popup for Heatmap
        this.simpleContainer = document.createElement('div');
        this.simpleContainer.id = 'simple-popup';
        this.simpleContent = document.createElement('div');
        this.simpleContainer.appendChild(this.simpleContent);
        document.body.appendChild(this.simpleContainer);

        this.simplePopup = new ol.Overlay({
            element: this.simpleContainer,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        this.map.addOverlay(this.simplePopup);

        this.clickedIndicator = null; // To store the clicked indicator overlay

        this.initHoverHandler(); // Initialise hover handler
    }

    // Initialise the hover handler
    initHoverHandler() {
        this.map.on('pointermove', evt => this.handleHover(evt));
    }

    // Handle hover events over the map
    handleHover(evt) {
        const pixel = this.map.getEventPixel(evt.originalEvent);
        const feature = this.map.forEachFeatureAtPixel(pixel, feature => feature);
    
        const predictionsLayer = this.map.getLayers().getArray().find(layer => layer.get('title') === 'Predictions Heatmap');
        const historicalLayer = this.map.getLayers().getArray().find(layer => layer.get('title') === 'Historical Data Heatmap');

        //Enabling popup based on layer visibility and featureInfoFlag's state
        if ((predictionsLayer && predictionsLayer.getVisible() || historicalLayer && historicalLayer.getVisible()) && this.featureInfoFlag) {
            if (feature && feature.get('total_crimes')) {
                const coordinate = evt.coordinate;
                const totalCrimes = feature.get('total_crimes');
                const areaName = feature.get('area_name');
                const month = feature.get('month');
                const crimes = feature.get('crimes');
                //Popup Content
                const htmlContent = `
                <div class="popup-content">
                    <div class="popup-row"><h3>Area Name:</h3><p>${format(areaName)}</p></div>
                    <div class="popup-row"><h3>Crimes:</h3><p>${format(crimes)}</p></div>
                    <div class="popup-row"><h3>Month:</h3><p>${format(month)}</p></div>
                    <div class="popup-row"><h3>Total Crimes:</h3><p>${totalCrimes}</p></div>
                </div>`;
                this.showSimplePopup(coordinate, htmlContent); // Show the heatmap popup with feature info
                this.addClickedIndicator(coordinate); // Add an indicator at the clicked location
            } else {
                this.hideSimplePopup(); // Hide the heatmap popup if no feature info
                this.removeClickedIndicator(); // Remove the clicked indicator
            }
        } else {
            this.hideSimplePopup(); // Hide the simple popup if no relevant layers are visible
            this.removeClickedIndicator(); // Remove the clicked indicator
        }
    }

    // Update the content of the simple popup
    updateSimplePopupContent(htmlContent) {
        this.simpleContent.innerHTML = htmlContent;
    }

    // Show the heatmap popup at a given coordinate
    showSimplePopup(coordinate, content = null) {
        if (content) {
            this.updateSimplePopupContent(content); // Update the content if provided
        }
        this.simplePopup.setPosition(coordinate); // Set the position of the simple popup
    }

    // Hide the heatmap popup
    hideSimplePopup() {
        this.simplePopup.setPosition(undefined);
    }

    // Add a clicked indicator at a given coordinate
    addClickedIndicator(coordinate) {
        if (this.clickedIndicator) {
            this.map.removeOverlay(this.clickedIndicator);
        }

        const indicatorElement = document.createElement('div');
        indicatorElement.className = 'clicked-indicator';

        this.clickedIndicator = new ol.Overlay({
            position: coordinate,
            positioning: 'center-center',
            element: indicatorElement,
            stopEvent: false
        });

        this.map.addOverlay(this.clickedIndicator);
    }

    // Remove the clicked indicator
    removeClickedIndicator() {
        if (this.clickedIndicator) {
            this.map.removeOverlay(this.clickedIndicator);
            this.clickedIndicator = null;
        }
    }

    // Setup the close event handler for the popup
    setupCloseEventHandler() {
        this.closer.onclick = () => {
            this.hidePopup(); // Hide the popup on click
            this.closer.blur(); // Remove focus from the closer element
            return false; // Prevent default action
        };
    }

    // Setup the remove event handler for the popup
    setupRemoveEventHandler() {
        this.removeButton.onclick = () => {
            this.hidePopup(); // Hide the popup on click
            if (this.highlightOverlay) {
                this.map.removeOverlay(this.highlightOverlay); // Remove the highlight overlay
                this.highlightOverlay = null;
            }
            this.closer.blur(); // Remove focus from the remove button
            return false; // Prevent default action
        };
    }

    // Toggle the feature info flag
    toggleFeatureInfoFlag() {
        this.featureInfoFlag = !this.featureInfoFlag; // Toggle the feature info flag
    }

    // Handle map click events to show feature info
    handleMapClick(evt) {
        if (!this.featureInfoFlag) return; // Exit if feature info flag is not enabled

        const viewResolution = this.map.getView().getResolution();
        const crimesLayer = this.map.getLayers().getArray().find(layer => layer.get('title') === 'Crime');

        if (!crimesLayer || !crimesLayer.getVisible()) {
            this.popup.setPosition(undefined);
            return;
        }

        const url = crimesLayer.getSource().getFeatureInfoUrl(
            evt.coordinate,
            viewResolution,
            'EPSG:3857',
            { 'INFO_FORMAT': 'application/json', 'propertyName': 'date_occ,area_name,premis_des,crm_cd_des,agg_des' }
        );

        if (url) {
            fetch(url)
                .then(response => response.json())
                .then(json => {
                    if (json.features && json.features.length > 0) {
                        const feature = json.features[0];
                        const properties = feature.properties;
                        const date = new Date(properties.date_occ);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });

                        const htmlContent = `
                        <div class="popup-content">
                            <div class="popup-row"><h3>Date:</h3><p>${formattedDate}</p></div>
                            <div class="popup-row"><h3>Crime Type:</h3><p>${format(properties.agg_des)}</p></div>
                            <div class="popup-row"><h3>Crime:</h3><p>${format(properties.crm_cd_des)}</p></div>
                            <div class="popup-row"><h3>Area:</h3><p>${format(properties.area_name)}</p></div>
                            <div class="popup-row"><h3>Premises:</h3><p>${format(properties.premis_des)}</p></div>
                        </div>`;
                    this.updatePopupContent(htmlContent); // Update the popup content with feature info
                     // Update the popup content with feature info
                        this.showPopup(evt.coordinate); // Show the popup at the clicked coordinate
                    } else {
                        this.popup.setPosition(undefined); // Hide the popup if no features found
                    }
                })
                .catch(error => {
                    console.error('Error fetching feature information:', error);
                    this.updatePopupContent('<p>Error fetching information.</p>'); // Show error message in popup
                    this.showPopup(evt.coordinate); // Show the popup at the clicked coordinate
                });
        } else {
            this.popup.setPosition(undefined); // Hide the popup if no URL
        }
    }

    // Update the content of the main popup
    updatePopupContent(htmlContent) {
        this.content.innerHTML = htmlContent; // Set the inner HTML of the popup content
    }

    // Show the main popup at a given coordinate
    showPopup(coordinate, content = null) {
        if (content) {
            this.updatePopupContent(content); // Update the content if provided
        }
        this.popup.setPosition(coordinate); // Set the position of the popup
        this.popupShown = true; // Set the popup shown flag to true
        this.addPoint(coordinate); // Add a point marker at the coordinate
    }

    // Hide the main popup
    hidePopup() {
        this.popup.setPosition(undefined); // Hide the popup by setting its position to undefined
        this.popupShown = false; // Set the popup shown flag to false
        this.enablePointHover(); // Enable hover effects on the point marker
    }

    // Add a point marker at a given coordinate
    addPoint(coordinate) {
        if (this.highlightOverlay) {
            this.map.removeOverlay(this.highlightOverlay); // Remove the existing highlight overlay if any
        }

        const pointElement = document.createElement('div');
        pointElement.className = 'popup-point';

        this.highlightOverlay = new ol.Overlay({
            position: coordinate,
            positioning: 'center-center',
            element: pointElement,
            stopEvent: false
        });

        this.map.addOverlay(this.highlightOverlay);

        // Add event listeners for click, mouse enter, and mouse leave events on the point element
        pointElement.addEventListener('click', () => {
            if (this.popupShown) {
                this.hidePopup(); // Hide the popup if it is shown
            } else {
                this.showPopup(coordinate); // Show the popup if it is hidden
                this.disablePointHover(); // Disable hover effects on the point marker
            }
        });

        pointElement.addEventListener('mouseenter', () => {
            if (!this.popupShown) {
                pointElement.style.backgroundColor = 'green'; // Change color to green on hover
            }
        });

        pointElement.addEventListener('mouseleave', () => {
            if (!this.popupShown) {
                pointElement.style.backgroundColor = 'yellow'; // Change color to yellow on leave
            }
        });
    }

    // Disable hover effects on the point marker
    disablePointHover() {
        if (this.highlightOverlay) {
            const pointElement = this.highlightOverlay.getElement();
            pointElement.removeEventListener('mouseenter', this.pointHoverEnter);
            pointElement.removeEventListener('mouseleave', this.pointHoverLeave);
        }
    }

    // Enable hover effects on the point marker
    enablePointHover() {
        if (this.highlightOverlay) {
            const pointElement = this.highlightOverlay.getElement();
            pointElement.addEventListener('mouseenter', this.pointHoverEnter);
            pointElement.addEventListener('mouseleave', this.pointHoverLeave);
        }
    }

    // Event handler for entering hover state on point marker
    pointHoverEnter() {
        this.style.backgroundColor = 'green';
    }

    // Event handler for leaving hover state on point marker
    pointHoverLeave() {
        this.style.backgroundColor = 'yellow';
    }
}