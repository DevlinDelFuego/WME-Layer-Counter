// ==UserScript==
// @name         WME Layer Counter
// @namespace    https://greasyfork.org/en/scripts/476456-wme-layer-counter
// @author       DevlinDelFuego
// @version      2024.7.8.1
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
    const updateMessage = "<b>Changelog</b><br><br>Update 2024.7.8.1<br>- Updated the way max layers are calculated.<br><br>Update 2023.10.4.8<br>- Found out Layer Counter wanted to hangout with the cool kids from the FUME block. I scolded him and told him he can't hangout with them. I then sent him to the corner and told him not to move again.<br><br>Update 2023.10.4.5<br>- Fixed no display issue.<br><br>Initial Release.<br>- Hope this helps those that need to know how many layers they are using.<br><br>";

    let _$layerCountElem = null;

    function createLayerCountElement() {
        _$layerCountElem = document.createElement('div');
        _$layerCountElem.innerHTML = `
            <div class="toolbar-button" style="font-weight: bold; font-size: 16px; border-radius: 10px; margin-left: 4px; background-color: white;" title="Active Layers / Max Layers">
                <div class="item-container" style="padding-left: 10px; padding-right: 10px; cursor: default;">
                    <!-- Your content here -->
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
        updateLayerCount();

        const secondaryToolbar = document.querySelector('.secondary-toolbar');
        if (secondaryToolbar && !secondaryToolbar.querySelector('#layer-count-monitor')) {
            secondaryToolbar.appendChild(_$layerCountElem);
        }
    }

    // Initialize the script
    function initialize() {
        if (W?.userscripts?.state.isReady) {
            createLayerCountElement();
            injectLayerCountElement();
            if (W.controller) {
                W.controller.events.register('mergeend', null, updateLayerCount);
            }

            const observer = new MutationObserver((mutationsList, observer) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.target.classList.contains('secondary-toolbar')) {
                        injectLayerCountElement();
                        observer.disconnect();
                    }
                }
            });

            observer.observe(document, { childList: true, subtree: true });

            setInterval(updateLayerCount, 1000);
            showScriptUpdate();
        } else {
            document.addEventListener('wme-ready', function () {
                initialize();
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
