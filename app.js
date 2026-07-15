// PreservAI Dashboard Logic - Entry Point & Controllers

document.addEventListener("DOMContentLoaded", () => {
  // --- APPLICATION STATE ---
  let activeTab = "dashboard";
  let activeTheme = "light";
  let focusedShipmentId = "V-102"; // default focus
  let simulationInterval = null;
  let updateRateMs = 3000; // simulation step frequency (3s)

  // Map variables
  let mapInstance = null;
  let mapTileLayer = null;
  const mapMarkerGroup = L.layerGroup();
  const mapPathGroup = L.layerGroup();

  // Chart instances
  let liveCharts = {
    temp: null,
    humidity: null,
    shock: null,
    battery: null
  };
  let analyticsCharts = {
    spoilage: null,
    health: null,
    risk: null,
    routes: null,
    compliance: null
  };

  // --- INITIALIZATION ---
  initTheme();
  initTabs();
  initMap();
  initSelectFocuses();
  initLiveCharts();
  initAnalyticsCharts();
  initSimulation();
  initEventListeners();
  
  // Initial UI draw
  updateUI();

  // --- THEME MANAGEMENT ---
  function initTheme() {
    const savedTheme = localStorage.getItem("preservai-theme");
    if (savedTheme) {
      activeTheme = savedTheme;
    } else {
      activeTheme = "light";
    }
    document.documentElement.setAttribute("data-theme", activeTheme);
    updateThemeToggleIcon();
  }

  function toggleTheme() {
    activeTheme = activeTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("preservai-theme", activeTheme);
    updateThemeToggleIcon();
    
    // Swap map tiles to dark/light
    updateMapTiles();
    
    // Update chart theme colors
    updateChartColors();
  }

  function updateThemeToggleIcon() {
    const themeBtn = document.getElementById("theme-toggle");
    if (!themeBtn) return;
    if (activeTheme === "dark") {
      themeBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    } else {
      themeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3a6.364 6.364 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>`;
    }
  }

  function updateMapTiles() {
    if (!mapInstance) return;
    if (mapTileLayer) {
      mapInstance.removeLayer(mapTileLayer);
    }
    
    const tileUrl = activeTheme === "dark" 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      
    const attribution = activeTheme === "dark"
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

    mapTileLayer = L.tileLayer(tileUrl, { attribution, maxZoom: 19 });
    mapTileLayer.addTo(mapInstance);
  }

  function updateChartColors() {
    const isDark = activeTheme === "dark";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    // Live telemetry charts update
    Object.values(liveCharts).forEach(chart => {
      if (!chart) return;
      chart.options.scales.x.grid.color = gridColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.grid.color = gridColor;
      chart.options.scales.y.ticks.color = textColor;
      chart.update();
    });

    // Analytics charts update
    Object.values(analyticsCharts).forEach(chart => {
      if (!chart) return;
      if (chart.options.scales) {
        if (chart.options.scales.x) {
          chart.options.scales.x.grid.color = gridColor;
          chart.options.scales.x.ticks.color = textColor;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.grid.color = gridColor;
          chart.options.scales.y.ticks.color = textColor;
        }
      }
      chart.update();
    });
  }

  // --- TAB NAVIGATION ---
  function initTabs() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetTab = item.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    
    // Toggle nav active state
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Toggle panels visibility
    document.querySelectorAll(".tab-panel").forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add("active-tab");
      } else {
        panel.classList.remove("active-tab");
      }
    });

    // Trigger specific tab focus updates
    if (tabId === "dashboard" && mapInstance) {
      // Leaflet requires invalidating size if map was hidden
      setTimeout(() => mapInstance.invalidateSize(), 50);
    }
    
    // Populate tab data
    updateUI();
  }

  // --- LEAFLET MAP INITIALIZATION ---
  function initMap() {
    const mapElement = document.getElementById("india-map");
    if (!mapElement) return;

    // Centered on central India
    mapInstance = L.map("india-map", {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([21.7679, 78.8718], 5);

    updateMapTiles();
    
    mapMarkerGroup.addTo(mapInstance);
    mapPathGroup.addTo(mapInstance);
  }

  function updateMap() {
    if (!mapInstance) return;

    mapMarkerGroup.clearLayers();
    mapPathGroup.clearLayers();

    const selectedFilter = document.getElementById("map-filter-type").value;
    const shipments = window.PreservAiState.shipments;

    shipments.forEach(s => {
      // Filter out non-matching types
      if (selectedFilter !== "all" && s.type !== selectedFilter) {
        return;
      }

      const statusColor = s.status === "Safe" ? "#10b981" : (s.status === "Warning" ? "#f59e0b" : "#ef4444");

      // Draw path line if en route
      if (s.gpsStatus === "Active" && s.route && s.route.length > 1) {
        const polyline = L.polyline(s.route, {
          color: statusColor,
          weight: 2.5,
          opacity: 0.6,
          dashArray: "5, 10"
        });
        polyline.addTo(mapPathGroup);
      }

      // Draw custom animated marker
      const isWarehouse = s.type === "Warehouse";
      let markerHtml = "";

      if (isWarehouse) {
        markerHtml = `
          <div class="marker-pin status-${s.status.toLowerCase()}" style="color:${statusColor}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--bg-secondary)" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
              <path d="M3 21h18M3 10h18M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
            </svg>
          </div>`;
      } else {
        markerHtml = `
          <div class="marker-pin status-${s.status.toLowerCase()}" style="color:${statusColor}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="9" fill="${statusColor}" fill-opacity="0.3"/>
              <circle cx="12" cy="12" r="5" fill="${statusColor}"/>
              <circle cx="12" cy="12" r="6" stroke="white" stroke-width="1.5"/>
            </svg>
          </div>`;
      }

      const customIcon = L.divIcon({
        className: "custom-map-marker",
        html: markerHtml,
        iconSize: isWarehouse ? [28, 28] : [24, 24],
        iconAnchor: isWarehouse ? [14, 14] : [12, 12]
      });

      const marker = L.marker(s.currentLocation, { icon: customIcon });

      // Bind detailed popup
      const popupContent = `
        <div style="font-family:'Plus Jakarta Sans', sans-serif; padding: 4px; min-width:180px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <b style="font-size:13px; color:var(--text-primary);">${s.id}</b>
            <span class="status-pill ${s.status}" style="font-size:9px; padding:2px 6px;">${s.status}</span>
          </div>
          <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">${s.name}</div>
          <div style="font-size:11px; color:var(--text-primary); display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
            <div>Temp: <b>${s.temperature}°C</b></div>
            <div>Humidity: <b>${s.humidity}%</b></div>
            <div>Shock: <b>${s.shock}G</b></div>
            <div>Risk: <b>${s.avgRiskScore}%</b></div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="map-popup-btn" data-id="${s.id}" style="width:100%; background:var(--primary-blue); color:white; font-size:11px; font-weight:700; padding:6px; border-radius:6px; cursor:pointer;">
              Diagnostic Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(mapMarkerGroup);
    });
  }

  // --- SELECTION DROPDOWNS ---
  function initSelectFocuses() {
    const selector = document.getElementById("live-charts-focus-select");
    if (!selector) return;
    
    // Clear
    selector.innerHTML = "";
    
    // Fill options
    window.PreservAiState.shipments.forEach(s => {
      const option = document.createElement("option");
      option.value = s.id;
      option.textContent = `${s.id} – ${s.name}`;
      if (s.id === focusedShipmentId) {
        option.selected = true;
      }
      selector.appendChild(option);
    });

    selector.addEventListener("change", (e) => {
      focusedShipmentId = e.target.value;
      updateUI();
    });
  }

  // --- CHART INITIALIZATION (LIVE READINGS) ---
  function initLiveCharts() {
    const isDark = activeTheme === "dark";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor, drawTicks: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        y: {
          grid: { color: gridColor, drawTicks: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      },
      elements: {
        point: { radius: 0, hoverRadius: 4 }
      }
    };

    // Temp Chart
    const ctxTemp = document.getElementById("chart-temp-trend");
    if (ctxTemp) {
      liveCharts.temp = new Chart(ctxTemp, {
        type: "line",
        data: {
          labels: [],
          datasets: [{
            borderColor: "#0284c7",
            backgroundColor: "rgba(2, 132, 199, 0.05)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            data: []
          }]
        },
        options: commonOptions
      });
    }

    // Humidity Chart
    const ctxHum = document.getElementById("chart-humidity-trend");
    if (ctxHum) {
      liveCharts.humidity = new Chart(ctxHum, {
        type: "line",
        data: {
          labels: [],
          datasets: [{
            borderColor: "#0d9488",
            backgroundColor: "rgba(13, 148, 136, 0.05)",
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            data: []
          }]
        },
        options: commonOptions
      });
    }

    // Shock Event Chart
    const ctxShock = document.getElementById("chart-shock-events");
    if (ctxShock) {
      liveCharts.shock = new Chart(ctxShock, {
        type: "bar",
        data: {
          labels: [],
          datasets: [{
            backgroundColor: "rgba(239, 68, 68, 0.85)",
            borderRadius: 4,
            data: []
          }]
        },
        options: commonOptions
      });
    }

    // Battery Performance Chart
    const ctxBatt = document.getElementById("chart-battery-curve");
    if (ctxBatt) {
      liveCharts.battery = new Chart(ctxBatt, {
        type: "line",
        data: {
          labels: [],
          datasets: [{
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.05)",
            borderWidth: 2,
            tension: 0.2,
            data: []
          }]
        },
        options: commonOptions
      });
    }
  }

  // --- CHART INITIALIZATION (ANALYTICS PANEL) ---
  function initAnalyticsCharts() {
    const isDark = activeTheme === "dark";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const textColor = isDark ? "#94a3b8" : "#64748b";

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }
        }
      }
    };

    // 1. Spoilage reduction
    const ctxSpoilage = document.getElementById("chart-ana-spoilage");
    if (ctxSpoilage) {
      analyticsCharts.spoilage = new Chart(ctxSpoilage, {
        type: "line",
        data: {
          labels: window.PreservAiState.analytics.spoilageReduction.labels,
          datasets: [{
            label: "Reduction Rate %",
            borderColor: "#0d9488",
            borderWidth: 3,
            tension: 0.4,
            backgroundColor: "rgba(13, 148, 136, 0.1)",
            fill: true,
            data: window.PreservAiState.analytics.spoilageReduction.values
          }]
        },
        options: commonOptions
      });
    }

    // 2. Health Trends
    const ctxHealth = document.getElementById("chart-ana-health");
    if (ctxHealth) {
      analyticsCharts.health = new Chart(ctxHealth, {
        type: "line",
        data: {
          labels: window.PreservAiState.analytics.productHealthTrends.labels,
          datasets: [
            {
              label: "Vaccines",
              borderColor: "#38bdf8",
              borderWidth: 2,
              data: window.PreservAiState.analytics.productHealthTrends.vaccines,
              tension: 0.3
            },
            {
              label: "Pharma",
              borderColor: "#0d9488",
              borderWidth: 2,
              data: window.PreservAiState.analytics.productHealthTrends.pharma,
              tension: 0.3
            },
            {
              label: "Food Logistics",
              borderColor: "#f59e0b",
              borderWidth: 2,
              data: window.PreservAiState.analytics.productHealthTrends.food,
              tension: 0.3
            }
          ]
        },
        options: {
          ...commonOptions,
          plugins: { legend: { display: true, labels: { color: textColor } } }
        }
      });
    }

    // 3. Risk Distribution
    const ctxRisk = document.getElementById("chart-ana-risk");
    if (ctxRisk) {
      analyticsCharts.risk = new Chart(ctxRisk, {
        type: "doughnut",
        data: {
          labels: window.PreservAiState.analytics.riskDistribution.labels,
          datasets: [{
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
            borderWidth: 0,
            data: window.PreservAiState.analytics.riskDistribution.datasets
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true, position: "right", labels: { color: textColor } } }
        }
      });
    }

    // 4. Route Performance
    const ctxRoutes = document.getElementById("chart-ana-routes");
    if (ctxRoutes) {
      analyticsCharts.routes = new Chart(ctxRoutes, {
        type: "bar",
        data: {
          labels: window.PreservAiState.analytics.routePerformance.labels,
          datasets: [{
            backgroundColor: "#0284c7",
            borderRadius: 6,
            data: window.PreservAiState.analytics.routePerformance.scores
          }]
        },
        options: commonOptions
      });
    }

    // 5. Compliance score
    const ctxCompliance = document.getElementById("chart-ana-compliance");
    if (ctxCompliance) {
      analyticsCharts.compliance = new Chart(ctxCompliance, {
        type: "line",
        data: {
          labels: window.PreservAiState.analytics.complianceScore.labels,
          datasets: [{
            borderColor: "#10b981",
            borderWidth: 2.5,
            fill: false,
            tension: 0.4,
            data: window.PreservAiState.analytics.complianceScore.scores
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }
  }

  // --- TELEMETRY SIMULATION ---
  function initSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    simulationInterval = setInterval(() => {
      // Step simulator state
      window.runPreservAiSimulation();
      // Draw dashboard state
      updateUI();
    }, updateRateMs);
  }

  // --- REFRESH INTERACTIVE UI ELEMENTS ---
  function updateUI() {
    const state = window.PreservAiState;
    const focusShipment = state.shipments.find(s => s.id === focusedShipmentId) || state.shipments[0];

    // 1. KPI Panel values
    document.getElementById("kpi-active-shipments").textContent = state.kpis.activeShipments;
    document.getElementById("kpi-product-health").textContent = `${state.kpis.productHealthScore}%`;
    document.getElementById("kpi-risk-score").textContent = `${state.kpis.averageRiskScore}%`;
    document.getElementById("kpi-spoilage-prevented").textContent = `₹${state.kpis.spoilagePreventedCr} Cr`;
    document.getElementById("kpi-smart-tags").textContent = state.kpis.activeSmartTags;
    document.getElementById("kpi-smart-crates").textContent = state.kpis.activeSmartCrates;
    document.getElementById("kpi-co2-saved").textContent = `${state.kpis.co2EmissionsSavedTons} Tons`;

    // 2. Leaflet Map Markers
    updateMap();

    // 3. Live Environmental charts
    if (focusShipment && focusShipment.history) {
      // Update charts datasets
      if (liveCharts.temp) {
        liveCharts.temp.data.labels = focusShipment.history.timeLabels;
        liveCharts.temp.data.datasets[0].data = focusShipment.history.temperature;
        liveCharts.temp.update("none"); // update without transition for high performance
      }
      if (liveCharts.humidity) {
        liveCharts.humidity.data.labels = focusShipment.history.timeLabels;
        liveCharts.humidity.data.datasets[0].data = focusShipment.history.humidity;
        liveCharts.humidity.update("none");
      }
      if (liveCharts.shock) {
        liveCharts.shock.data.labels = focusShipment.history.timeLabels;
        liveCharts.shock.data.datasets[0].data = focusShipment.history.shock;
        liveCharts.shock.update("none");
      }
      if (liveCharts.battery) {
        liveCharts.battery.data.labels = focusShipment.history.timeLabels;
        liveCharts.battery.data.datasets[0].data = focusShipment.history.battery;
        liveCharts.battery.update("none");
      }

      // Live indicator highlights
      document.getElementById("chart-val-temp").textContent = `${focusShipment.temperature}°C`;
      document.getElementById("chart-val-humidity").textContent = `${focusShipment.humidity}%`;
      document.getElementById("chart-val-shock").textContent = `${focusShipment.shock} G`;
      document.getElementById("chart-val-battery").textContent = `${focusShipment.battery}%`;
    }

    // 4. Product Health Panel updates
    if (focusShipment) {
      const phScore = focusShipment.productHealthScore;
      document.getElementById("health-gauge-val").textContent = `${phScore}%`;
      
      // Update circular SVG gauge stroke-dashoffset
      const gaugeSvg = document.getElementById("health-gauge-svg");
      if (gaugeSvg) {
        // radius = 40, circumference = 2 * PI * r = 251.2
        const offset = 251.2 - (251.2 * phScore) / 100;
        gaugeSvg.style.strokeDashoffset = offset;
      }

      const pill = document.getElementById("health-status-pill");
      const title = document.getElementById("health-status-title");

      // Reset pill state
      pill.className = "status-badge";
      if (focusShipment.status === "Safe") {
        pill.classList.add("healthy");
        pill.textContent = "Healthy";
        title.textContent = "Ideal Preservation";
      } else if (focusShipment.status === "Warning") {
        pill.classList.add("warning");
        pill.textContent = "Thermal Warning";
        title.textContent = "Sub-optimal Preservation";
      } else {
        pill.classList.add("critical");
        pill.textContent = "Critical Danger";
        title.textContent = "Immediate Spoilage Risk";
      }

      // Secondary health panel metrics
      document.getElementById("health-metric-shelf-life").textContent = focusShipment.estimatedShelfLife;
      document.getElementById("health-metric-spoilage-prob").textContent = `${focusShipment.spoilageProbability}%`;
      document.getElementById("health-metric-temp-stability").textContent = `${focusShipment.tempStability}%`;
      document.getElementById("health-metric-shock").textContent = `${focusShipment.shockExposure}%`;
      document.getElementById("health-metric-cooling-cap").textContent = `${focusShipment.coolingCapacityRemaining}%`;

      // Smart Crate Info panel
      document.getElementById("crate-pcm-health").textContent = `${focusShipment.pcmHealth}%`;
      document.getElementById("crate-cooling-remaining").textContent = `${focusShipment.coolingRemaining} Hours`;
      document.getElementById("crate-internal-temp").textContent = `${focusShipment.internalTemp}°C`;
      document.getElementById("crate-humidity").textContent = `${focusShipment.humidity}%`;
      document.getElementById("crate-battery").textContent = `${focusShipment.battery}%`;

      // Harvesting badges toggles
      const solBadge = document.getElementById("crate-harvest-solar");
      const vibBadge = document.getElementById("crate-harvest-vibration");
      if (focusShipment.solarHarvesting === "Active") {
        solBadge.classList.add("active");
      } else {
        solBadge.classList.remove("active");
      }
      if (focusShipment.vibrationHarvesting === "Active") {
        vibBadge.classList.add("active");
      } else {
        vibBadge.classList.remove("active");
      }

      // AI Risk prediction center details
      document.getElementById("ai-card-risk-score").textContent = `${focusShipment.avgRiskScore}%`;
      document.getElementById("ai-card-spoilage-prob").textContent = `${focusShipment.spoilageProbability}%`;
      document.getElementById("ai-card-fail-time").innerHTML = focusShipment.status === "Safe" ? "Stable" : `<span>${focusShipment.expectedFailureTime}</span>`;
      document.getElementById("ai-card-recommendation").textContent = `"${focusShipment.recommendedAction}"`;
    }

    // 5. Dashboard Table feeds
    updateTagTableUI();

    // 6. Alerts Feed updates
    const recentAlerts = getGlobalAlerts(state.shipments);
    const feedContainer = document.getElementById("dashboard-alerts-feed");
    if (feedContainer) {
      feedContainer.innerHTML = "";
      if (recentAlerts.length === 0) {
        feedContainer.innerHTML = `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px;">No operational alerts detected.</div>`;
      } else {
        recentAlerts.forEach(a => {
          const card = document.createElement("div");
          card.className = "alert-item-card";
          
          const sevClass = a.severity.split(" ")[0]; // e.g. P1
          
          card.innerHTML = `
            <span class="alert-severity-indicator ${sevClass}">${sevClass}</span>
            <div class="alert-content-box">
              <div class="alert-item-title">${a.type}</div>
              <div class="alert-item-msg">${a.message} (<b>${a.shipmentId}</b>)</div>
            </div>
            <div class="alert-item-time">${a.time}</div>
          `;
          feedContainer.appendChild(card);
        });
      }
    }

    // 7. Render other tab views if currently active
    if (activeTab === "shipments") {
      updateShipmentsTabUI();
    } else if (activeTab === "tags") {
      updateTagsTabUI();
    } else if (activeTab === "crates") {
      updateCratesTabUI();
    } else if (activeTab === "alerts") {
      updateAlertsTabUI();
    }
  }

  // --- RENDER DYNAMIC TABLES ---

  // Dashboard Tab - Tag monitoring table
  function updateTagTableUI() {
    const state = window.PreservAiState;
    const body = document.getElementById("tag-table-body");
    if (!body) return;

    const query = document.getElementById("tag-search").value.toLowerCase();
    const statusFilter = document.getElementById("tag-filter-status").value;
    const batteryFilter = document.getElementById("tag-filter-battery").value;

    const tags = getSmartTags(state.shipments);
    body.innerHTML = "";

    tags.forEach(t => {
      // Search filters
      if (query && !t.id.toLowerCase().includes(query) && !t.shipmentName.toLowerCase().includes(query)) {
        return;
      }
      // Status filters
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return;
      }
      // Battery filters
      if (batteryFilter !== "all") {
        if (batteryFilter === "high" && t.battery <= 80) return;
        if (batteryFilter === "mid" && (t.battery > 80 || t.battery < 30)) return;
        if (batteryFilter === "low" && t.battery >= 30) return;
      }

      const row = document.createElement("tr");
      row.setAttribute("data-id", t.shipmentId);
      row.className = t.shipmentId === focusedShipmentId ? "active-row" : "";
      if (t.shipmentId === focusedShipmentId) {
        row.style.backgroundColor = "var(--primary-blue-light)";
      }

      row.innerHTML = `
        <td style="font-weight:700; color:var(--primary-blue);">${t.id}</td>
        <td>${t.shipmentName}</td>
        <td><b>${t.temperature}°C</b></td>
        <td>${t.humidity}%</td>
        <td>${t.shock}G</td>
        <td><span style="font-size:11px; font-weight:700;">${t.gpsStatus}</span></td>
        <td>${t.battery}%</td>
        <td class="tag-risk-text ${t.status}">${t.riskScore}%</td>
        <td><span class="status-pill ${t.status}">${t.status}</span></td>
      `;

      // Click to focus row and change live telemetry curves
      row.addEventListener("click", () => {
        focusedShipmentId = t.shipmentId;
        const selector = document.getElementById("live-charts-focus-select");
        if (selector) selector.value = t.shipmentId;
        updateUI();
      });

      body.appendChild(row);
    });
  }

  // Shipments Tab
  function updateShipmentsTabUI() {
    const state = window.PreservAiState;
    const body = document.getElementById("shipments-table-body");
    if (!body) return;

    const typeFilter = document.getElementById("shipments-filter-type").value;
    const statusFilter = document.getElementById("shipments-filter-status").value;

    body.innerHTML = "";

    state.shipments.forEach(s => {
      if (typeFilter !== "all" && s.type !== typeFilter) return;
      if (statusFilter !== "all" && s.status !== statusFilter) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight:700; color:var(--primary-blue);">${s.id}</td>
        <td style="font-weight:700;">${s.name}</td>
        <td>${s.type}</td>
        <td>${s.origin}</td>
        <td>${s.destination}</td>
        <td><b>${s.temperature}°C</b></td>
        <td>${s.battery}%</td>
        <td><b>${s.avgRiskScore}%</b></td>
        <td>${s.coolingRemaining} Hours</td>
        <td><span class="status-pill ${s.status}">${s.status}</span></td>
      `;

      row.addEventListener("click", () => {
        openShipmentDrawer(s.id);
      });

      body.appendChild(row);
    });
  }

  // Smart Tags Tab
  function updateTagsTabUI() {
    const state = window.PreservAiState;
    const body = document.getElementById("tags-inventory-body");
    if (!body) return;

    const tags = getSmartTags(state.shipments);
    body.innerHTML = "";

    tags.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight:700; color:var(--primary-teal);">${t.id}</td>
        <td>${t.shipmentName} (<b>${t.shipmentId}</b>)</td>
        <td><b>${t.temperature}°C</b></td>
        <td>${t.humidity}%</td>
        <td>${t.shock}G</td>
        <td>NB-IoT (98% signal)</td>
        <td><b>${t.battery}%</b></td>
        <td><span class="status-pill ${t.status}">${t.status}</span></td>
      `;
      body.appendChild(row);
    });
  }

  // Smart Crates Tab
  function updateCratesTabUI() {
    const state = window.PreservAiState;
    const body = document.getElementById("crates-table-body");
    if (!body) return;

    const crates = getSmartCrates(state.shipments);
    body.innerHTML = "";

    crates.forEach(c => {
      const harvestingDesc = [];
      if (c.solarHarvesting === "Active") harvestingDesc.push("Solar");
      if (c.vibrationHarvesting === "Active") harvestingDesc.push("Kinetic");
      const harvestStr = harvestingDesc.length > 0 ? harvestingDesc.join(" + ") : "None";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight:700; color:var(--primary-blue);">${c.id}</td>
        <td>${c.shipmentId}</td>
        <td><b>${c.pcmHealth}%</b> PCM Health</td>
        <td>${c.coolingRemaining} Hours</td>
        <td><b>${c.internalTemp}°C</b></td>
        <td>${c.humidity}%</td>
        <td style="color:var(--primary-teal); font-weight:700;">${harvestStr}</td>
        <td><span class="status-pill ${c.status}">${c.status}</span></td>
      `;
      body.appendChild(row);
    });
  }

  // Alerts Tab
  function updateAlertsTabUI() {
    const state = window.PreservAiState;
    const body = document.getElementById("alerts-history-body");
    if (!body) return;

    const alerts = getGlobalAlerts(state.shipments);
    body.innerHTML = "";

    if (alerts.length === 0) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No logs registered.</td></tr>`;
      return;
    }

    alerts.forEach(a => {
      const row = document.createElement("tr");
      const sevClass = a.severity.split(" ")[0]; // P1
      
      row.innerHTML = `
        <td><span class="alert-severity-indicator ${sevClass}">${a.severity}</span></td>
        <td>${a.time}</td>
        <td style="font-weight:700;">${a.shipmentName} (${a.shipmentId})</td>
        <td style="color:var(--status-critical); font-weight:700;">${a.type}</td>
        <td>${a.message}</td>
        <td><span style="font-weight:700; color:var(--primary-teal);">Monitoring Live</span></td>
      `;
      body.appendChild(row);
    });
  }

  // --- SLIDING DRAWER DETAIL LOGIC ---
  function openShipmentDrawer(shipmentId) {
    const state = window.PreservAiState;
    const shipment = state.shipments.find(s => s.id === shipmentId);
    if (!shipment) return;

    document.getElementById("drawer-id").textContent = shipment.id;
    document.getElementById("drawer-name").textContent = shipment.name;
    document.getElementById("drawer-type").textContent = shipment.type;
    
    const riskVal = document.getElementById("drawer-risk");
    riskVal.textContent = `${shipment.avgRiskScore}%`;
    riskVal.className = "drawer-meta-val";
    if (shipment.status === "Safe") riskVal.style.color = "var(--status-safe)";
    else if (shipment.status === "Warning") riskVal.style.color = "var(--status-warning)";
    else riskVal.style.color = "var(--status-critical)";

    document.getElementById("drawer-origin").textContent = shipment.origin;
    document.getElementById("drawer-destination").textContent = shipment.destination;
    document.getElementById("drawer-advisory").textContent = `"${shipment.recommendedAction}"`;
    document.getElementById("drawer-crate-pcm").textContent = `${shipment.pcmHealth}% PCM Remaining`;
    document.getElementById("drawer-tag-battery").textContent = `${shipment.battery}% Tag Battery`;
    document.getElementById("drawer-shelf-life").textContent = shipment.estimatedShelfLife;

    // Load alert list
    const alertsFeed = document.getElementById("drawer-alerts-feed");
    alertsFeed.innerHTML = "";
    if (shipment.alerts.length === 0) {
      alertsFeed.innerHTML = `<div style="font-size:11px;color:var(--text-muted);text-align:center;padding:12px;">No active excursions recorded.</div>`;
    } else {
      shipment.alerts.forEach(a => {
        const item = document.createElement("div");
        item.className = "alert-item-card";
        const sevClass = a.severity.split(" ")[0];
        item.innerHTML = `
          <span class="alert-severity-indicator ${sevClass}">${sevClass}</span>
          <div class="alert-content-box">
            <div class="alert-item-title">${a.type}</div>
            <div class="alert-item-msg" style="font-size:11px;">${a.message}</div>
          </div>
          <div class="alert-item-time">${a.time}</div>
        `;
        alertsFeed.appendChild(item);
      });
    }

    const drawer = document.getElementById("shipment-detail-drawer");
    drawer.classList.add("open");
  }

  function closeShipmentDrawer() {
    const drawer = document.getElementById("shipment-detail-drawer");
    drawer.classList.remove("open");
  }

  // --- FLOATING AI ASSISTANT COPILOT LOGIC ---
  function initEventListeners() {
    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

    // Map filters change
    document.getElementById("map-filter-type").addEventListener("click", () => {
      updateMap();
    });

    // Tag table searching
    document.getElementById("tag-search").addEventListener("input", () => {
      updateTagTableUI();
    });
    
    // Tag table status filter
    document.getElementById("tag-filter-status").addEventListener("change", () => {
      updateTagTableUI();
    });
    
    // Tag table battery filter
    document.getElementById("tag-filter-battery").addEventListener("change", () => {
      updateTagTableUI();
    });

    // Crate setting simulation speed rate
    document.getElementById("setting-sim-rate").addEventListener("change", (e) => {
      updateRateMs = parseInt(e.target.value);
      initSimulation();
    });

    // Save dashboard alert setting
    document.getElementById("save-settings-btn").addEventListener("click", () => {
      alert("System Configuration Saved. Notification webhooks registered successfully.");
    });

    // Map marker click detail link handler (delegated listener)
    document.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("map-popup-btn")) {
        const id = e.target.getAttribute("data-id");
        openShipmentDrawer(id);
      }
    });

    // Close drawer
    document.getElementById("drawer-close-btn").addEventListener("click", closeShipmentDrawer);

    // Organization scope alerting
    document.getElementById("organization-select").addEventListener("change", (e) => {
      const org = e.target.options[e.target.selectedIndex].text;
      alert(`Scope changed. Now displaying telemetry bounds for: ${org}`);
    });

    // Floating AI Copilot triggers
    const trigger = document.getElementById("ai-copilot-trigger");
    const chatWindow = document.getElementById("ai-chat-window");

    trigger.addEventListener("click", () => {
      chatWindow.classList.toggle("open");
    });

    // Send AI input handler
    document.getElementById("ai-send-btn").addEventListener("click", submitAiMessage);
    document.getElementById("ai-chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") submitAiMessage();
    });

    // AI suggestions handler
    document.querySelectorAll(".ai-suggestion-bubble").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const prompt = e.target.getAttribute("data-prompt");
        document.getElementById("ai-chat-input").value = prompt;
        submitAiMessage();
      });
    });
  }

  function submitAiMessage() {
    const input = document.getElementById("ai-chat-input");
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    appendAiMessage("user", text);
    input.value = "";

    // Scroll to bottom
    const chatBody = document.getElementById("ai-chat-body");
    chatBody.scrollTop = chatBody.scrollHeight;

    // Add simulated typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "ai-message assistant typing";
    typingDiv.innerHTML = "Thinking...";
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      chatBody.removeChild(typingDiv);
      const response = generateAiCopilotResponse(text);
      appendAiMessage("assistant", response);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 700);
  }

  function appendAiMessage(sender, text) {
    const chatBody = document.getElementById("ai-chat-body");
    const msg = document.createElement("div");
    msg.className = `ai-message ${sender}`;
    msg.innerHTML = text;
    chatBody.appendChild(msg);
  }

  function generateAiCopilotResponse(query) {
    const q = query.toLowerCase();
    const state = window.PreservAiState;

    if (q.includes("highest risk") || q.includes("risk")) {
      const highest = state.shipments.reduce((max, s) => s.avgRiskScore > max.avgRiskScore ? s : max, state.shipments[0]);
      return `Based on live NB-IoT telemetry, shipment <b>${highest.id}</b> (${highest.name}) has the highest risk factor of <b>${highest.avgRiskScore}%</b>. 
              <br><br>
              Current Core Temp: <b>${highest.temperature}°C</b>
              <br>
              Recommendation: <b>${highest.recommendedAction}</b>`;
    }

    if (q.includes("v-102") || q.includes("vaccine")) {
      const vaccine = state.shipments.find(s => s.id === "V-102");
      return `Analysis for <b>V-102</b> (${vaccine.name}):
              <br><br>
              - Status: <span class="status-pill Warning">${vaccine.status}</span>
              <br>
              - Core Temp: <b>${vaccine.temperature}°C</b> (SLA threshold limit: 6.0°C)
              <br>
              - Spoilage Probability: <b>${vaccine.spoilageProbability}%</b>
              <br>
              - Phase Change Material Autonomy: <b>${vaccine.coolingRemaining} Hours remaining</b>.
              <br><br>
              PreservAI recommendation: <b>${vaccine.recommendedAction}</b>`;
    }

    if (q.includes("delayed") || q.includes("delay")) {
      return `Analyzing transit pathways:
              <br><br>
              - Shipment <b>F-201</b> (Alphonso Mango Export) is experiencing thermal delays near Kalyan-Thane due to congestion on the NH-160 highway pathway.
              <br>
              - Facility <b>CF-02</b> has Dock Door #3 open longer than 30 mins, delaying temperature stabilization.`;
    }

    if (q.includes("cold storage") || q.includes("nearest")) {
      return `Scanning geographic nodes in India network:
              <br><br>
              1. <b>Gwalior Cold Storage Node</b>: 142km from V-102. Grid capacity: 74% free.
              <br>
              2. <b>Mumbai Port Gateway Depot</b>: 18km from F-201. Grid capacity: 42% free.
              <br>
              3. <b>Central Cold Hub, Pune</b>: Fully operational at -22°C.`;
    }

    return `I have query-analyzed the current logistics dataset. 
            <br><br>
            Overall, the network has <b>${state.shipments.filter(s => s.status === 'Safe').length}</b> safe nodes, 
            <b>${state.shipments.filter(s => s.status === 'Warning').length}</b> warning nodes, and 
            <b>${state.shipments.filter(s => s.status === 'Critical').length}</b> critical node. 
            The general compliance score is holding stable at <b>96.8%</b>.`;
  }
});
