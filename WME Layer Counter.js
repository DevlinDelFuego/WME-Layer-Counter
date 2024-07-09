// ==UserScript==
// @name         WME Layer Counter
// @namespace    https://greasyfork.org/en/scripts/476456-wme-layer-counter
// @version      2024.7.9.4
// @description  See how many layers you have active in WME.
// @match        *://*.waze.com/*editor*
// @exclude      *://*.waze.com/user/editor*
// @grant        none
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @license      GPLv3
// ==/UserScript==

/* global W */
/* global WazeWrap */

(function main() {
    'use strict';

    const SCRIPT_NAME = 'WME Layer Counter';
    const updateMessage = "<b>Changelog</b><br><br>Update 2024.7.9.4<br>- Moved layer counter over to the tab section. If you prefer, you can still have it show on the top right.<br><br>Update 2024.7.9.1<br>- Removed colors.<br><br>Update 2024.7.4.2<br>- Added dynamic button color change based on active layers.<br><br>Update 2024.7.8.1<br>- Updated the way max layers are calculated.<br><br>Update 2023.10.4.8<br>- Found out Layer Counter wanted to hangout with the cool kids from the FUME block. I scolded him and told him he can't hangout with them. I then sent him to the corner and told him not to move again.<br><br>Update 2023.10.4.5<br>- Fixed no display issue.<br><br>Initial Release.<br>- Hope this helps those that need to know how many layers they are using.<br><br>";
    const scriptVersion = GM_info.script.version;

    let _$layerCountElem = null;
    let _isButtonVisible = false; // Unchecked by default

    function createLayerCountElement() {
        _$layerCountElem = document.createElement('div');
        _$layerCountElem.innerHTML = `
            <div id="layer-count-monitor" class="toolbar-button" style="font-weight: bold; font-size: 16px; border-radius: 10px; margin-left: 4px; background-color: white;" title="Active Layers / Max Layers">
                <div class="item-container" style="padding-left: 10px; padding-right: 10px; cursor: default;">
                </div>
            </div>`;

        // Append _$layerCountElem to the DOM
        const secondaryToolbar = document.querySelector('.secondary-toolbar');
        if (secondaryToolbar) {
            secondaryToolbar.appendChild(_$layerCountElem);
        }
    }

    function updateLayerCount() {
        if (!_$layerCountElem) {
            createLayerCountElement();
        }
        const activeLayers = W.map.olMap.layers.filter(layer => layer.visibility).length;
        const featureLayer = W.map.olMap.Z_INDEX_BASE.Feature;
        const overlayLayer = W.map.olMap.Z_INDEX_BASE.Overlay;
        const maxLayers = (featureLayer - overlayLayer) / 5;

        const layerCountText = `${activeLayers}/${maxLayers}`;

        // Set layer count text
        const itemContainer = _$layerCountElem.querySelector('.item-container');
        itemContainer.textContent = layerCountText;
    }

    function injectLayerCountElement() {
        if (_$layerCountElem && _$layerCountElem.parentElement) {
            _$layerCountElem.parentElement.removeChild(_$layerCountElem);
        }
        if (_isButtonVisible) {
            updateLayerCount();
            const secondaryToolbar = document.querySelector('.secondary-toolbar');
            if (secondaryToolbar && !secondaryToolbar.querySelector('#layer-count-monitor')) {
                secondaryToolbar.appendChild(_$layerCountElem);
            }
        }
    }

    function toggleLayerCountButton() {
        _isButtonVisible = !_isButtonVisible;
        injectLayerCountElement();
    }

    function addScriptTab() {
        if (typeof W === 'undefined' || typeof WazeWrap === 'undefined') {
            console.log('WazeWrap is not available. Exiting script.');
            return;
        }

        const scriptId = 'wme-layer-counter-tab';
        const { tabLabel, tabPane } = W.userscripts.registerSidebarTab(scriptId);

        tabLabel.innerText = 'LC';
        tabLabel.title = 'Layer Counter';

        const description = document.createElement('p');
        description.style.fontWeight = 'bold';
        description.textContent = 'Layer Counter';
        tabPane.appendChild(description);

        const toggleButtonContainer = document.createElement('div');
        const toggleButtonLabel = document.createElement('label');
        toggleButtonLabel.textContent = 'Show Layer Count';
        const toggleButtonCheckbox = document.createElement('input');
        toggleButtonCheckbox.type = 'checkbox';
        toggleButtonCheckbox.checked = _isButtonVisible;
        toggleButtonCheckbox.addEventListener('change', toggleLayerCountButton);

        toggleButtonContainer.appendChild(toggleButtonCheckbox);
        toggleButtonContainer.appendChild(toggleButtonLabel);
        tabPane.appendChild(toggleButtonContainer);

        const activeLayersText = document.createElement('p');
        activeLayersText.id = 'active-layers';
        tabPane.appendChild(activeLayersText);

        const createdLayersText = document.createElement('p');
        createdLayersText.id = 'created-layers';
        tabPane.appendChild(createdLayersText);

        const maxLayersText = document.createElement('p');
        maxLayersText.id = 'max-layers';
        tabPane.appendChild(maxLayersText);

        const madeBy = document.createElement('p');
        madeBy.textContent = 'Made by DevlinDelFuego';
        madeBy.style.margin = '0';
        tabPane.appendChild(madeBy);

        const version = document.createElement('p');
        version.textContent = `Version: ${scriptVersion}`;
        version.style.margin = '0';
        tabPane.appendChild(version);

        updateTabContent(activeLayersText, createdLayersText, maxLayersText);

        setInterval(() => {
            updateTabContent(activeLayersText, createdLayersText, maxLayersText);
        }, 1000);
    }

    function updateTabContent(activeLayersText, createdLayersText, maxLayersText) {
        const activeLayers = W.map.olMap.layers.filter(layer => layer.visibility).length;
        const createdLayers = W.controller.map.layers.length;
        const featureLayer = W.map.olMap.Z_INDEX_BASE.Feature;
        const overlayLayer = W.map.olMap.Z_INDEX_BASE.Overlay;
        const maxLayers = (featureLayer - overlayLayer) / 5;

        activeLayersText.textContent = `Active Layers: ${activeLayers}`;
        createdLayersText.textContent = `Created Layers: ${createdLayers}`;
        maxLayersText.textContent = `Max Layers: ${maxLayers}`;
    }

    // Initialize the script
    function initialize() {
        if (W?.userscripts?.state.isReady) {
            addScriptTab();
            injectLayerCountElement();
            showScriptUpdate();
        } else {
            document.addEventListener('wme-ready', function () {
                addScriptTab();
                injectLayerCountElement();
                showScriptUpdate();
            }, { once: true });
        }
    }

    // Call the initialize function
    initialize();

    // Show script update notification
    function showScriptUpdate() {
        WazeWrap.Interface.ShowScriptUpdate(
            SCRIPT_NAME,
            GM_info.script.version,
            updateMessage,
            'https://greasyfork.org/en/scripts/476456-wme-layer-counter',
            'https://www.waze.com/forum/viewtopic.php?t=394699'
        );
    }

})();
