// ==UserScript==
// @name         WME Layer Counter
// @namespace    https://greasyfork.org/en/scripts/476456-wme-layer-counter
// @version      2026.5.7.1
// @description  See how many layers you have active in WME.
// @match        *://*.waze.com/*editor*
// @exclude      *://*.waze.com/user/editor*
// @grant        none
// @license      GPLv3
// ==/UserScript==

(function main() {
    'use strict';

    const SCRIPT_NAME = 'WME Layer Counter';
    const SCRIPT_ID = 'wme-layer-counter';
    const scriptVersion = GM_info.script.version;

    let _$layerCountElem = null;
    let _isButtonVisible = JSON.parse(localStorage.getItem('wmeLayerCounterButtonVisible')) || false;
    let _wmeSDK = null;

    // layerName -> { visible: boolean } — populated via SDK layer events
    const layerRegistry = new Map();

    function setupLayerTracking(wmeSDK) {
        wmeSDK.Events.on({
            eventName: 'wme-map-layer-added',
            eventHandler: ({ layerName }) => {
                let visible = false;
                try { visible = wmeSDK.Map.isLayerVisible({ layerName }); } catch (e) {}
                layerRegistry.set(layerName, { visible });
            }
        });
        wmeSDK.Events.on({
            eventName: 'wme-map-layer-removed',
            eventHandler: ({ layerName }) => layerRegistry.delete(layerName)
        });
        wmeSDK.Events.on({
            eventName: 'wme-map-layer-changed',
            eventHandler: ({ layerName }) => {
                let visible = false;
                try { visible = wmeSDK.Map.isLayerVisible({ layerName }); } catch (e) {}
                layerRegistry.set(layerName, { visible });
            }
        });
    }

    function getLayerCounts() {
        let active = 0;
        for (const { visible } of layerRegistry.values()) {
            if (visible) active++;
        }
        return { active, total: layerRegistry.size };
    }

    function createLayerCountElement() {
        if (document.getElementById('layer-count-monitor')) return;

        _$layerCountElem = document.createElement('div');
        _$layerCountElem.innerHTML = `
            <div id="layer-count-monitor" class="toolbar-button" style="font-weight: bold; font-size: 16px; border-radius: 10px; margin-left: 4px; background-color: white;" title="Active Layers / Total Layers">
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
        if (!_isButtonVisible) return;

        if (!_$layerCountElem || !document.getElementById('layer-count-monitor')) {
            createLayerCountElement();
        }

        const { active, total } = getLayerCounts();

        if (_$layerCountElem) {
            const itemContainer = _$layerCountElem.querySelector('.item-container');
            if (itemContainer) {
                itemContainer.textContent = `${active}/${total}`;
            }
        }
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
        localStorage.setItem('wmeLayerCounterButtonVisible', JSON.stringify(_isButtonVisible));
        injectLayerCountElement();
    }

    const CHANGELOG = [
        { version: '2026.5.7.1', notes: 'Removed deprecated W.map.olMap. Layer tracking now uses SDK events. Removed WazeWrap dependency. Active/Total replaces Active/Max.' },
        { version: '2025.12.26.1', notes: 'Updated to new WME SDK.' },
        { version: '2024.7.15.1', notes: 'Script now remembers your show/hide choice.' },
    ];

    function showChangelogBanner(tabPane) {
        const lastSeen = localStorage.getItem('wmeLayerCounterLastVersion');
        if (lastSeen === scriptVersion) return;

        const newEntries = CHANGELOG.filter(entry => !lastSeen || entry.version > lastSeen);
        if (newEntries.length === 0) return;

        const banner = document.createElement('div');
        banner.style.cssText = 'background:#fffbe6;border:1px solid #f0c040;border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:12px;';

        const title = document.createElement('div');
        title.style.cssText = 'font-weight:bold;margin-bottom:4px;';
        title.textContent = "What's New";
        banner.appendChild(title);

        for (const entry of newEntries) {
            const line = document.createElement('div');
            line.style.marginBottom = '3px';
            line.innerHTML = `<b>${entry.version}</b> — ${entry.notes}`;
            banner.appendChild(line);
        }

        const dismissBtn = document.createElement('button');
        dismissBtn.textContent = 'Got it';
        dismissBtn.style.cssText = 'margin-top:6px;padding:2px 10px;cursor:pointer;';
        dismissBtn.addEventListener('click', () => {
            localStorage.setItem('wmeLayerCounterLastVersion', scriptVersion);
            banner.remove();
        });
        banner.appendChild(dismissBtn);

        tabPane.insertBefore(banner, tabPane.firstChild);
    }

    async function addScriptTab(wmeSDK) {
        let tabLabel, tabPane;
        try {
            const result = await wmeSDK.Sidebar.registerScriptTab();
            tabLabel = result.tabLabel;
            tabPane = result.tabPane;
            console.log('WME Layer Counter: Sidebar tab registered via SDK');
        } catch (e) {
            console.error('WME Layer Counter: Failed to register sidebar tab via SDK', e);
            return;
        }

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

        const totalLayersText = document.createElement('p');
        totalLayersText.id = 'total-layers';
        tabPane.appendChild(totalLayersText);

        const madeBy = document.createElement('p');
        madeBy.textContent = 'Made by DevlinDelFuego';
        madeBy.style.margin = '0';
        tabPane.appendChild(madeBy);

        const version = document.createElement('p');
        version.textContent = `Version: ${scriptVersion}`;
        version.style.margin = '0';
        tabPane.appendChild(version);

        showChangelogBanner(tabPane);
        updateTabContent(activeLayersText, totalLayersText);

        setInterval(() => {
            updateTabContent(activeLayersText, totalLayersText);
            if (_isButtonVisible) {
                updateLayerCount();
            }
        }, 1000);
    }

    function updateTabContent(activeLayersText, totalLayersText) {
        const { active, total } = getLayerCounts();
        if (activeLayersText) activeLayersText.textContent = `Active Layers: ${active}`;
        if (totalLayersText) totalLayersText.textContent = `Total Layers: ${total}`;
    }

    function observeLayerChanges(wmeSDK) {
        const updateAll = () => {
            const activeLayersText = document.getElementById('active-layers');
            const totalLayersText = document.getElementById('total-layers');
            if (activeLayersText || totalLayersText) {
                updateTabContent(activeLayersText, totalLayersText);
            }
            if (_isButtonVisible) {
                updateLayerCount();
            }
        };

        wmeSDK.Events.on({ eventName: 'wme-map-layer-changed', eventHandler: updateAll });
        wmeSDK.Events.on({ eventName: 'wme-map-layer-added', eventHandler: updateAll });
        wmeSDK.Events.on({ eventName: 'wme-map-layer-removed', eventHandler: updateAll });
    }

    // Initialize the script
    function initialize() {
        const currentWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const sdkInit = currentWindow.SDK_INITIALIZED;

        if (!sdkInit) {
            console.log('WME SDK initialization signal not found. Waiting for wme-ready.');
            document.addEventListener('wme-ready', () => {
                const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                if (win.SDK_INITIALIZED) {
                    win.SDK_INITIALIZED.then(() => {
                        if (typeof win.getWmeSdk === 'function') {
                            _wmeSDK = win.getWmeSdk({ scriptId: SCRIPT_ID, scriptName: SCRIPT_NAME });
                            setupLayerTracking(_wmeSDK);
                            addScriptTab(_wmeSDK);
                            injectLayerCountElement();
                            observeLayerChanges(_wmeSDK);
                        }
                    });
                }
            }, { once: true });
            return;
        }

        sdkInit.then(() => {
            if (typeof currentWindow.getWmeSdk === 'function') {
                _wmeSDK = currentWindow.getWmeSdk({ scriptId: SCRIPT_ID, scriptName: SCRIPT_NAME });
                setupLayerTracking(_wmeSDK);
                addScriptTab(_wmeSDK);
                injectLayerCountElement();
                observeLayerChanges(_wmeSDK);
            } else {
                console.error('WME SDK getWmeSdk function not found.');
            }
        });
    }

    // Call the initialize function
    initialize();


})();
