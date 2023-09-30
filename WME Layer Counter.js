// ==UserScript==
// @name         WME Layer Counter
// @namespace    https://greasyfork.org/en/scripts/476456-wme-layer-counter
// @author       DevlinDelFuego
// @version      2023.9.30.1
// @description  See how many layers you have active in WME.
// @match        *://*.waze.com/*editor*
// @exclude      *://*.waze.com/user/editor*
// @grant        none
// @require      https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @license      GPLv3
// ==/UserScript==

(function main() {
    'use strict';

    const SCRIPT_NAME = GM_info.script.name;
    const MAX_LAYERS = 81; // Maximum allowed layers
    const TOOLTIP_TEXT = 'Active Layers / Max Layers';
    const updateMessage = "<b>Changelog</b><br><br> - Initial Release. Hope this helps those that need to know how many layers they are using. <br><br>";

    let _$layerCountElem = null;

    function createLayerCountElement() {
        _$layerCountElem = document.createElement('div');
        _$layerCountElem.id = 'layer-count-monitor';
        _$layerCountElem.className = 'toolbar-button';
        _$layerCountElem.style.cssText = 'font-weight: bold; font-size: 16px; border-radius: 10px; margin-left: 4px; background-color: white;';
        _$layerCountElem.setAttribute('data-toggle', 'tooltip');
        _$layerCountElem.setAttribute('data-placement', 'auto top');
        _$layerCountElem.setAttribute('title', '');

        const innerDiv = document.createElement('div');
        innerDiv.className = 'item-container';
        innerDiv.style.cssText = 'padding-left: 10px; padding-right: 10px; cursor: default;';

        innerDiv.appendChild(_$layerCountElem);
    }

    function updateLayerCount() {
        if (!_$layerCountElem) {
            createLayerCountElement();
        }
        const activeLayers = W.controller.map.layers.length;
        const layerCountText = `${activeLayers}/${MAX_LAYERS}`;

        _$layerCountElem.setAttribute('data-original-title', TOOLTIP_TEXT);
        _$layerCountElem.textContent = layerCountText;

        // Enable Bootstrap tooltip
        $('[data-toggle="tooltip"]').tooltip();
    }

    function injectLayerCountElement() {
        if (_$layerCountElem && _$layerCountElem.parentElement) {
            _$layerCountElem.parentElement.removeChild(_$layerCountElem);
        }
        updateLayerCount();

        const existingToolbarButtonParent = document.querySelector('.secondary-toolbar-actions');

        if (existingToolbarButtonParent && !existingToolbarButtonParent.querySelector('#layer-count-monitor')) {
            existingToolbarButtonParent.appendChild(_$layerCountElem);
        }
    }

    function init() {
        W.model.events.register('mergeend', null, updateLayerCount);
    }

    if (WazeWrap.Ready) {
        init();
        showScriptUpdate();
    } else {
        document.addEventListener('WazeWrap.Ready', init);
        showScriptUpdate();
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

    // Show script update notification
function showScriptUpdate() {
    WazeWrap.Interface.ShowScriptUpdate(
      'WME Layer Counter',
      GM_info.script.version,
      updateMessage,
      'https://greasyfork.org/en/scripts/476456-wme-layer-counter',
      '#'
    );
  }
  
})();
