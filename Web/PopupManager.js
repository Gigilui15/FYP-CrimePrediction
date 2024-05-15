class PopupManager {
    constructor(map) {
        this.map = map;
        this.container = document.getElementById('popup');
        this.content = document.getElementById('popup-content');

        this.header = document.createElement('div');
        this.header.className = 'popup-header';
        
        this.closer = document.createElement('a');
        this.closer.className = 'ol-popup-closer';
        this.closer.innerHTML = '&#x2716;'; // Unicode for "X" to close the popup
        
        this.removeButton = document.createElement('a');
        this.removeButton.className = 'ol-popup-remove';
        this.removeButton.innerHTML = '&#128465;'; // Unicode for bin icon
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';
        iconContainer.appendChild(this.closer);
        iconContainer.appendChild(this.removeButton);

        this.header.appendChild(iconContainer);
        
        this.container.insertBefore(this.header, this.content);

        this.popup = new ol.Overlay({
            element: this.container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
        this.map.addOverlay(this.popup);
        this.setupCloseEventHandler();
        this.setupRemoveEventHandler();
        this.featureInfoFlag = false;
        this.highlightOverlay = null; // To store the point overlay
        this.popupShown = false; // Flag to track popup state
    }

    setupCloseEventHandler() {
        this.closer.onclick = () => {
            this.hidePopup();
            this.closer.blur();
            return false;
        };
    }

    setupRemoveEventHandler() {
        this.removeButton.onclick = () => {
            this.hidePopup();
            this.map.removeOverlay(this.highlightOverlay);
            this.highlightOverlay = null;
            this.closer.blur();
            return false;
        };
    }

    toggleFeatureInfoFlag() {
        this.featureInfoFlag = !this.featureInfoFlag;
    }

    handleMapClick(evt) {
        if (!this.featureInfoFlag) return;

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
                        const htmlContent = `<div class="popup-content-row"><h3>Date:</h3><p>${properties.date_occ}</p></div>
                                             <div class="popup-content-row"><h3>Crime Type:</h3><p>${properties.agg_des}</p></div>
                                             <div class="popup-content-row"><h3>Crime:</h3><p>${properties.crm_cd_des}</p></div>
                                             <div class="popup-content-row"><h3>Area:</h3><p>${properties.area_name}</p></div>
                                             <div class="popup-content-row"><h3>Premises:</h3><p>${properties.premis_des}</p></div>`;
                        this.updatePopupContent(htmlContent);
                        this.showPopup(evt.coordinate);
                    } else {
                        this.popup.setPosition(undefined);
                    }
                })
                .catch(error => {
                    console.error('Error fetching feature information:', error);
                    this.updatePopupContent('<p>Error fetching information.</p>');
                    this.showPopup(evt.coordinate);
                });
        } else {
            this.popup.setPosition(undefined);
        }
    }

    updatePopupContent(htmlContent) {
        this.content.innerHTML = htmlContent;
    }

    showPopup(coordinate, content = null) {
        if (content) {
            this.updatePopupContent(content);
        }
        this.popup.setPosition(coordinate);
        this.popupShown = true;
        this.addPoint(coordinate);
    }

    hidePopup() {
        this.popup.setPosition(undefined);
        this.popupShown = false;
        this.enablePointHover();
    }

    addPoint(coordinate) {
        if (this.highlightOverlay) {
            this.map.removeOverlay(this.highlightOverlay);
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

        pointElement.addEventListener('click', () => {
            if (this.popupShown) {
                this.hidePopup();
            } else {
                this.showPopup(coordinate);
                this.disablePointHover();
            }
        });

        // Add hover effect to change the color to green
        pointElement.addEventListener('mouseenter', () => {
            if (!this.popupShown) {
                pointElement.style.backgroundColor = 'green';
            }
        });

        pointElement.addEventListener('mouseleave', () => {
            if (!this.popupShown) {
                pointElement.style.backgroundColor = 'yellow';
            }
        });
    }

    disablePointHover() {
        const pointElement = this.highlightOverlay.getElement();
        pointElement.removeEventListener('mouseenter', this.pointHoverEnter);
        pointElement.removeEventListener('mouseleave', this.pointHoverLeave);
    }

    enablePointHover() {
        const pointElement = this.highlightOverlay.getElement();
        pointElement.addEventListener('mouseenter', this.pointHoverEnter);
        pointElement.addEventListener('mouseleave', this.pointHoverLeave);
    }

    pointHoverEnter() {
        this.style.backgroundColor = 'green';
    }

    pointHoverLeave() {
        this.style.backgroundColor = 'yellow';
    }
}