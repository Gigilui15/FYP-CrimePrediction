// Declare map globally
let map;

window.onload = init;

function init() {

    map = new ol.Map({
        view: new ol.View({
            center: ol.proj.fromLonLat([-118.2437, 34.020]),
            zoom: 10,
            minZoom: 10,
        }),
        layers: [
            new ol.layer.Tile({
                title: 'Open Street Map',
                source: new ol.source.OSM(),
            })
        ],
        target: 'js-map'
    });

    var layerSwitcher = new ol.control.LayerSwitcher({
        activationMode: 'click',
        startActive: false,
        groupSelectStyle: 'children'
    })

    var Crimes = new ol.layer.Tile({
        title: "Crime",
        source: new ol.source.TileWMS({
            url: `http://localhost:8080/geoserver/CrimePrediction/wms`,
            params: {'LAYERS': 'CrimePrediction:Crimes', 'TILED': true},
            serverType: 'geoserver',
            visible: true
        })
    });

    var LaArea = new ol.layer.Tile({
        title: "Areas",
        source: new ol.source.TileWMS({
            url: `http://localhost:8080/geoserver/CrimePrediction/wms`,
            params: {'LAYERS': 'CrimePrediction:Areas', 'TILED': true},
            serverType: 'geoserver',
            visible: true
        })
    });

    var baseGroup = new ol.layer.Group({
        title: 'Crime Prediction',
        layers: [LaArea, Crimes]
    })

    var mousePosition = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(6),
        projection: 'EPSG:4326',
        className: 'mousePosition',
        target: document.getElementById('mouse-position'),
        undefinedHTML: '&nbsp;'
    });

    var container = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');

    var popup = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250,
        },
    })

    closer.onclick = function(){
        popup.setPosition(undefined);
        closer.blur();
        return false;
    }

    // Add event listener to handle radio button changes
    document.getElementById('filter-options').addEventListener('change', function(event) {
        if (event.target && event.target.matches('input[type="radio"][name="filter"]')) {
            var filterValue = event.target.value;
            updateLayerFilter(filterValue);
        }
    });

    // Function to update layer filter based on selected radio button
    function updateLayerFilter(filterValue) {
        var filterCondition;
        // Define filter condition based on the selected value
        if (filterValue === 'all') {
            // Show all crimes
            filterCondition = null; // No filter condition
        } else {
            // Show only crimes with the selected agg_des value
            filterCondition = "agg_des = '" + filterValue + "'";
        }
        // Update the layer source params with the new filter condition
        Crimes.getSource().updateParams({
            'CQL_FILTER': filterCondition
        });
        // Refresh the layer to apply the new filter
        Crimes.getSource().refresh();
    }

    map.on('singleclick', function(evt) {
        if(featureInfoFlag){
            if (Crimes.getVisible()) {
                content.innerHTML = ''; // Clear previous content
                var viewResolution = map.getView().getResolution();
                var url = Crimes.getSource().getFeatureInfoUrl(
                    evt.coordinate,
                    viewResolution,
                    'EPSG:3857', // Update projection if necessary
                    {'INFO_FORMAT': 'application/json', 'propertyName': 'date_occ,area_name,premis_des,crm_cd_des,agg_des'}
                );
        
                if (url) {
                    // Send GET request to the GeoServer URL
                    fetch(url)
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(json) {
                            // Check if features are available in the response
                            if (json.features && json.features.length > 0) {
                                var feature = json.features[0];
                                var properties = feature.properties;
                                // Extract properties
                                var date_occ = properties.date_occ;
                                var area_name = properties.area_name;
                                var premis_des = properties.premis_des;
                                var crm_cd_des = properties.crm_cd_des;
                                var agg_des = properties.agg_des;
                                // Display information in the popup
                                content.innerHTML = '<div class="popup-content-row"><h3>Date:</h3><p>' + date_occ +
                                                    '</p></div><div class="popup-content-row"><h3>Crime Type:</h3><p>' + agg_des +
                                                    '</p></div><div class="popup-content-row"><h3>Crime:</h3><p>' + crm_cd_des +
                                                    '</p></div><div class="popup-content-row"><h3>Area:</h3><p>' + area_name +
                                                    '</p></div><div class="popup-content-row"><h3>Premises:</h3><p>' + premis_des + '</p></div>';
                                popup.setPosition(evt.coordinate);
                            } else {
                            // URL is not available
                            popup.setPosition(undefined);
                            }
                        })
                        .catch(function(error) {
                            // Handle errors
                            console.error('Error fetching feature information:', error);
                            content.innerHTML = '<p>Error fetching information.</p>';
                            popup.setPosition(undefined);
                        });
                } else {
                    // URL is not available
                    popup.setPosition(undefined);
                }
            } else {
                // Close the popup if LaArea layer is not visible
                popup.setPosition(undefined);
            }
        }
    });
    
    //Adding Home Button Feature
    var homeButton = document.createElement('button');
    homeButton.innerHTML = '<img src="./Images/home.png" alt="" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
    homeButton.className = 'myButton';
    
    var homeElement = document.createElement('div');
    homeElement.className = 'homeButtonDiv';
    homeElement.appendChild(homeButton);

    var homeControl = new ol.control.Control({
        element: homeElement
    })

    homeButton.addEventListener("click", () =>{
        location.href = "index.html";
    })

    //Adding Fullscreen Feature
    var fsButton = document.createElement('button');
    fsButton.innerHTML = '<img src="./Images/fs.png" alt="" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
    fsButton.className = 'myButton';
    
    var fsElement = document.createElement('div');
    fsElement.className = 'fsButtonDiv';
    fsElement.appendChild(fsButton);

    var fsControl = new ol.control.Control({
        element: fsElement
    })

    fsButton.addEventListener("click", () => {
        var mapEle = document.getElementById("js-map");
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            // Exit fullscreen mode
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // Enter fullscreen mode
            if (mapEle.requestFullscreen) {
                mapEle.requestFullscreen();
            } else if (mapEle.msRequestFullscreen) {
                mapEle.msRequestFullscreen();
            } else if (mapEle.mozRequestFullscreen) {
                mapEle.mozRequestFullscreen();
            } else if (mapEle.webkitRequestFullscreen) {
                mapEle.webkitRequestFullscreen();
            }
        }
    
        // Toggle button image
        var imgSrc = fsButton.querySelector('img').src;
        if (imgSrc.includes('fs.png')) {
            fsButton.querySelector('img').src = './Images/ss.png';
        } else {
            fsButton.querySelector('img').src = './Images/fs.png';
        }
    });
    
    //Adding Feature Control
    var featureInfoButton = document.createElement('button');
    featureInfoButton.innerHTML = '<img id="featureImg" src="./Images/click.png" alt="" style="width:20px;filter:brightness(0) invert(1); vertical-align:middle"></img>';
    featureInfoButton.className = 'myButton';
    featureInfoButton.id = 'featureInfoButton';
    featureInfoButton.title = 'Click to toggle';
    
    var featureInfoElement = document.createElement('div');
    featureInfoElement.className = 'featureInfoButton';
    featureInfoElement.appendChild(featureInfoButton);
    
    var featureInfoControl = new ol.control.Control({
        element: featureInfoElement
    })
    
    var featureInfoFlag = false;
    featureInfoButton.addEventListener("click", () =>{
        featureInfoButton.classList.toggle('clicked');
        featureInfoFlag = !featureInfoFlag;
    })

    map.addControl(featureInfoControl);

    // Function to fetch location suggestions from the Nominatim API
    // Get the search input element
    const searchInput = document.getElementById('search');

    // Add an event listener to capture user input
    searchInput.addEventListener('input', function(event) {
        // Get the value of the search input
        const inputValue = event.target.value;
        
        // Call the updateSuggestions function with the input value
        updateSuggestions(inputValue);
    });


    function fetchLocationSuggestions(query) {
        // Define the bounding box for Los Angeles
        const bbox = '-118.6681900024414,33.70365524291992,-118.15536499023438,34.337310791015625'; // West, South, East, North
        
        // Construct the API URL with the query and bounding box parameters
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&bounded=1&viewbox=${bbox}`;
    
        console.log("API URL:", apiUrl); // Log API URL
    
        return fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                console.log("API Response:", data); // Log API response
                return data.map(item => ({
                    name: item.display_name,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon)
                }));
            });
    }
    
    let debounceTimer;
    // Function to update suggestions based on user input
    function updateSuggestions(input) {
        console.log("Input:", input); // Log user input

        // Get the suggestion list element
        const suggestionList = document.getElementById('suggestion-list');

        // Clear the previous debounce timer
        clearTimeout(debounceTimer);

        // Set a new debounce timer
        debounceTimer = setTimeout(() => {
            fetchLocationSuggestions(input)
                .then(suggestions => {
                    console.log("Suggestions:", suggestions); // Log suggestions
                    // Display suggestions in dropdown list
                    displaySuggestions(suggestions);

                    // Toggle visibility of suggestion list based on whether suggestions are empty
                    if (suggestions.length === 0) {
                        suggestionList.style.display = 'none';
                    } else {
                        suggestionList.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Error fetching location suggestions:', error);
                });
        }, 300); // Adjust debounce duration as needed (e.g., 300 milliseconds)
    }
    
    // Declare highlightOverlay globally
    let highlightOverlay;
    // Declare popupContent globally
    let popupContent;

    // Function to handle selection of a location suggestion
    function selectLocationSuggestion(suggestion) {
        // Zoom to the selected location on the map
        console.log("Selected Location:", suggestion); // Log selected location
        map.getView().setCenter(ol.proj.fromLonLat([suggestion.lon, suggestion.lat]));
        map.getView().setZoom(12); // Adjust the zoom level as needed

        // Remove existing highlight overlay if it exists
        if (highlightOverlay) {
            map.removeOverlay(highlightOverlay);
        }

        // Create a new overlay for the selected location
        highlightOverlay = new ol.Overlay({
            position: ol.proj.fromLonLat([suggestion.lon, suggestion.lat]),
            positioning: 'center-center',
            element: document.createElement('div')
        });

        // Set the style for the overlay
        highlightOverlay.getElement().style.background = 'yellow';
        highlightOverlay.getElement().style.border = '2px solid black';
        highlightOverlay.getElement().style.borderRadius = '50%';
        highlightOverlay.getElement().style.width = '20px';
        highlightOverlay.getElement().style.height = '20px';
        highlightOverlay.getElement().style.zIndex = '9999'; // Ensure it's displayed on top
        
        // Function to change color of highlight overlay
        function changeHighlightColor(color) {
            highlightOverlay.getElement().style.background = color;
        }

        // Add event listener to change color on hover if popup is minimized
        highlightOverlay.getElement().addEventListener('mouseenter', function() {
            if (popupContent && popupContent.classList.contains('minimized')) {
                changeHighlightColor('green'); // Change to desired hover color
            }
        });

        highlightOverlay.getElement().addEventListener('mouseleave', function() {
            if (popupContent && popupContent.classList.contains('minimized')) {
                changeHighlightColor('yellow'); // Revert back to original color
            }
        });

        // Add event listener to change color on click
        highlightOverlay.getElement().addEventListener('click', function() {
            changeHighlightColor('yellow'); // Change to desired click color
        });

        // Add the overlay to the map
        map.addOverlay(highlightOverlay);

        // Remove minimized class from popupContent to make it reappear
        if (popupContent) {
            popupContent.classList.remove('minimized');
        }

        // Create a popup for the selected place
        popupContent = document.createElement('div');
        popupContent.innerHTML = `
            <p>${suggestion.name}</p>
            <div class="popup-buttons">
                <button id="popup-minimize-btn">-</button>
                <button id="popup-close-btn">X</button>
            </div>
        `;
        popupContent.classList.add('popup-style'); // Add class for styling
        // Add event listener to close the popup and remove the point from the map
        popupContent.querySelector('#popup-close-btn').addEventListener('click', function() {
            map.removeOverlay(popupOverlay);
            map.removeOverlay(highlightOverlay);
            searchInput.value = ''; // Clear the search bar
            document.getElementById('suggestion-list').style.display = 'none'; // Hide suggestion list
        });
        // Add event listener to minimize the popup
        popupContent.querySelector('#popup-minimize-btn').addEventListener('click', function() {
            // Minimize functionality
            popupContent.classList.toggle('minimized');
        });
        const popupOverlay = new ol.Overlay({
            element: popupContent,
            autoPan: true,
            autoPanAnimation: {
                duration: 250,
            },
            position: ol.proj.fromLonLat([suggestion.lon, suggestion.lat]),
            positioning: 'bottom-center'
        });
        map.addOverlay(popupOverlay);

        // Add event listener to reappear the popup when clicked
        highlightOverlay.getElement().addEventListener('click', function() {
            if (popupContent && popupContent.classList.contains('minimized')) {
                popupContent.classList.remove('minimized');
            }
        });

        // Clear the suggestion list
        const suggestionList = document.getElementById('suggestion-list');
        suggestionList.innerHTML = '';

        searchInput.value = ''; // Clear the search bar
        suggestionList.style.display = 'none'; // Hide suggestion list
    }



    let enterPressed = false; // Flag to track if Enter has been pressed

    // Add an event listener to capture keypress events in the search input
    searchInput.addEventListener('keypress', function(event) {
        // Check if the Enter key is pressed
        if (event.key === 'Enter') {
            // Prevent the default behavior of the Enter key (e.g., form submission)
            event.preventDefault();
            // Toggle the enterPressed flag
            enterPressed = !enterPressed;
            // Remove focus from the input field to prevent further editing
            this.blur();
        }
    });
    
    // Add an event listener to capture focus events in the search input
    searchInput.addEventListener('focus', function(event) {
        // If Enter has been pressed, clear the flag and allow editing
        if (enterPressed) {
            enterPressed = false;
        }
    });
    

    // Function to display suggestions in the search dropdown list
    function displaySuggestions(suggestions) {
        const suggestionList = document.getElementById('suggestion-list');

        // Clear previous suggestions
        suggestionList.innerHTML = '';

        // Check if there are any suggestions
        if (suggestions.length > 0) {
            // Loop through the suggestions and create list items
            suggestions.forEach(suggestion => {
                const listItem = document.createElement('li');
                listItem.textContent = suggestion.name; // Display the name attribute

                // Add click event listener to zoom to the selected location when clicked
                listItem.addEventListener('click', function() {
                    selectLocationSuggestion(suggestion);
                });

                // Append list item to the suggestion list
                suggestionList.appendChild(listItem);
            });

            // Display the suggestion list
            suggestionList.style.display = 'block';
        } else {
            // Hide the suggestion list when it is empty
            suggestionList.style.display = 'none';
        }
    }

    map.addLayer(baseGroup);
    map.addControl(mousePosition);  
    map.addOverlay(popup);
    map.addControl(layerSwitcher);
    map.addControl(homeControl);
    map.addControl(fsControl);
}

function toggleLayer(eve){
    var lyrname = eve.target.value;
    var checkedStatus = eve.target.checked;
    var lyrList = map.getLayers();

    lyrList.forEach(function(element){
        if (lyrname == element.get('title')){
            element.setVisible(checkedStatus);
        }
    });
}