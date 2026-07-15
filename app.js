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
  initLandingPageAndDemo();
  
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
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      
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

    // Chrome-like keyboard tab switching
    document.addEventListener("keydown", (e) => {
      const dashboardApp = document.getElementById("dashboard-app");
      if (dashboardApp && !dashboardApp.classList.contains("hidden")) {
        const tabs = ["dashboard", "shipments", "tags", "crates", "analytics", "alerts", "health", "settings"];
        let currentIndex = tabs.indexOf(activeTab);
        
        if ((e.ctrlKey && e.key === "Tab") || (e.altKey && e.key === "ArrowRight")) {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % tabs.length;
          switchTab(tabs[currentIndex]);
        } else if ((e.ctrlKey && e.shiftKey && e.key === "Tab") || (e.altKey && e.key === "ArrowLeft")) {
          e.preventDefault();
          currentIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          switchTab(tabs[currentIndex]);
        }
      }
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

  // ==========================================================================
  // PRESERVAI LANDING PAGE & 3D IMMERSIVE DEMO LOGIC
  // ==========================================================================

  // Three.js instances and loops
  let threeRenderer = null;
  let threeScene = null;
  let threeCamera = null;
  let threeAnimFrameId = null;
  
  // Three.js groups
  let crateGroup = null;
  let partsGroup = null;
  let routeGroup = null;
  let scaleGroup = null;
  let pipelineGroup = null;
  let stormParticles = null;
  let dataPacket = null;
  
  // Exploded crate panels reference
  let cratePanels = [];
  
  // Interactive Showcase state
  let activeShowcaseProduct = "tag"; // "tag" or "crate"
  let activePipelineNode = "tag";
  
  // Scroll LERPing
  let scrollTarget = 0;
  let scrollCurrent = 0;
  
  // Canvas Graph instance for Scene 3
  let tempGraphCanvas = null;
  let tempGraphCtx = null;
  let graphData = [];
  
  function initLandingPageAndDemo() {
    // 1. Setup subscription form
    const subForm = document.getElementById("beta-subscribe-form");
    const subEmail = document.getElementById("subscribe-email");
    const subMsg = document.getElementById("subscribe-msg");
    
    if (subForm) {
      subForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = subEmail.value;
        subMsg.textContent = "Connecting to PreservAI network...";
        subMsg.className = "subscribe-msg";
        
        try {
          const response = await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
          });
          
          const data = await response.json();
          if (response.ok) {
            subMsg.textContent = data.message || "Beta registration successful!";
            subMsg.className = "subscribe-msg success";
            subEmail.value = "";
          } else {
            subMsg.textContent = data.detail || "Beta registration failed.";
            subMsg.className = "subscribe-msg error";
          }
        } catch (err) {
          subMsg.textContent = "Error submitting subscription. Please check connectivity.";
          subMsg.className = "subscribe-msg error";
        }
      });
    }
    
    // 2. Setup interactive triggers
    const enterDemoBtn = document.getElementById("enter-demo-btn");
    const launchDashboardBtn = document.getElementById("launch-dashboard-btn");
    const exitDemoBtn = document.getElementById("exit-demo-btn");
    
    if (enterDemoBtn) {
      enterDemoBtn.addEventListener("click", () => {
        document.getElementById("launching-soon-overlay").classList.add("hidden");
        document.getElementById("immersive-demo-container").classList.remove("hidden");
        document.body.classList.remove("landing-active");
        document.body.classList.add("demo-active");
        
        // Reset scroll position
        const container = document.getElementById("immersive-demo-container");
        container.scrollTop = 0;
        scrollTarget = 0;
        scrollCurrent = 0;
        countersAnimated = false;
        
        startThreeDemo();
      });
    }
    
    if (launchDashboardBtn) {
      launchDashboardBtn.addEventListener("click", () => {
        switchToDashboard();
      });
    }

    // Sign Out — return to landing page
    const signoutBtn = document.getElementById("signout-btn");
    if (signoutBtn) {
      signoutBtn.addEventListener("click", () => {
        const dashboardApp = document.getElementById("dashboard-app");
        if (dashboardApp) dashboardApp.classList.add("hidden");
        document.getElementById("launching-soon-overlay").classList.remove("hidden");
        document.body.classList.add("landing-active");
        document.body.classList.remove("demo-active");
      });
    }

    // Landing page → Go to Dashboard
    const landingDashboardBtn = document.getElementById("landing-dashboard-btn");
    if (landingDashboardBtn) {
      landingDashboardBtn.addEventListener("click", () => {
        switchToDashboard();
      });
    }

    if (exitDemoBtn) {
      exitDemoBtn.addEventListener("click", () => {
        stopThreeDemo();
        document.getElementById("immersive-demo-container").classList.add("hidden");
        document.getElementById("launching-soon-overlay").classList.remove("hidden");
        document.body.classList.remove("demo-active");
        document.body.classList.add("landing-active");
      });
    }

    // 2b. Setup products basket popup listeners
    const cartBasketBtn = document.getElementById("cart-basket-btn");
    const productsPopup = document.getElementById("products-popup");
    const productsPopupClose = document.getElementById("products-popup-close");
    
    if (cartBasketBtn && productsPopup) {
      cartBasketBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        productsPopup.classList.remove("hidden");
      });
    }
    
    if (productsPopupClose && productsPopup) {
      productsPopupClose.addEventListener("click", () => {
        productsPopup.classList.add("hidden");
      });
    }
    
    if (productsPopup) {
      productsPopup.addEventListener("click", (e) => {
        if (e.target === productsPopup) {
          productsPopup.classList.add("hidden");
        }
      });
    }
    
    // 3. Showcase & Pipeline Tab registers
    const btnTag = document.getElementById("btn-prod-tag");
    const btnCrate = document.getElementById("btn-prod-crate");
    const productDesc = document.getElementById("product-desc");
    
    if (btnTag && btnCrate) {
      btnTag.addEventListener("click", () => {
        btnTag.classList.add("active");
        btnCrate.classList.remove("active");
        activeShowcaseProduct = "tag";
        productDesc.innerHTML = `<strong>Smart Tag:</strong> Interactive 3D sensor tag. Hover/tap on the 3D model to trigger the exploded view and examine the integrated GPS, ESP32, and multi-sensor configurations.`;
      });
      
      btnCrate.addEventListener("click", () => {
        btnCrate.classList.add("active");
        btnTag.classList.remove("active");
        activeShowcaseProduct = "crate";
        productDesc.innerHTML = `<strong>Smart PCM Crate:</strong> Openable thermal-shield crate. Hover/tap to animate the opening sequence and reveal the active PCM panels, backup battery cartridge, and integrated solar harvesting receptors.`;
      });
    }
    
    const pipeNodes = document.querySelectorAll(".pipe-node");
    pipeNodes.forEach(node => {
      node.addEventListener("click", () => {
        pipeNodes.forEach(n => n.classList.remove("active"));
        node.classList.add("active");
        activePipelineNode = node.getAttribute("data-node");
      });
    });
    
    // 4. Scroll monitoring
    const demoContainer = document.getElementById("immersive-demo-container");
    if (demoContainer) {
      demoContainer.addEventListener("scroll", () => {
        const scrollTop = demoContainer.scrollTop;
        const scrollHeight = demoContainer.scrollHeight - demoContainer.clientHeight;
        scrollTarget = scrollTop / (scrollHeight || 1);
        
        // Update progress bar
        const progressBar = document.getElementById("demo-progress-bar");
        if (progressBar) {
          progressBar.style.width = (scrollTarget * 100) + "%";
        }
        
        // Update chapter active classes
        const chapters = document.querySelectorAll(".scroll-chapter");
        let activeIdx = 0;
        chapters.forEach((chapter, index) => {
          const rect = chapter.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
            chapter.classList.add("active");
            activeIdx = index;
          } else {
            chapter.classList.remove("gray-active");
            chapter.classList.remove("active");
          }
        });
        
        if (activeIdx === 4) {
          animateCounters();
        }
      });
    }
  }
  
  function switchToDashboard() {
    stopThreeDemo();
    document.getElementById("immersive-demo-container").classList.add("hidden");
    document.getElementById("launching-soon-overlay").classList.add("hidden");
    document.body.classList.remove("landing-active");
    document.body.classList.remove("demo-active");
    
    const dashboardApp = document.getElementById("dashboard-app");
    dashboardApp.classList.remove("hidden");
    
    // Invalidate Leaflet Map size to render correctly
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
        mapInstance.setView([21.7679, 78.8718], 5);
      }, 150);
    }
  }

  function startThreeDemo() {
    const canvas = document.getElementById("three-canvas");
    if (!canvas) return;

    // Renderer
    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
    threeRenderer.setClearColor(0x02040a, 1);
    threeRenderer.shadowMap.enabled = true;
    threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 1.1;

    // Scene
    threeScene = new THREE.Scene();

    // Camera — angled above, looking down at origin (like a stage view)
    threeCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
    threeCamera.position.set(0, 5.5, 10);
    threeCamera.lookAt(0, 0, 0);

    // ─── LIGHTS ───────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    threeScene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    threeScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    rimLight.position.set(-8, 3, -6);
    threeScene.add(rimLight);

    const fillLight = new THREE.PointLight(0x2dd4bf, 1.5, 20);
    fillLight.position.set(-3, 4, 4);
    threeScene.add(fillLight);

    // ─── SPACE STARFIELD ───────────────────────────────────────────
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 60 + Math.random() * 60;
      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
      starSizes[i] = 0.05 + Math.random() * 0.15;
    }
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starsGeo.setAttribute("size", new THREE.BufferAttribute(starSizes, 1));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    starField.name = "starfield";
    threeScene.add(starField);

    // Nebula / glow clouds (large colored points far away)
    const nebulaColors = [0x1e3a8a, 0x0c4a6e, 0x134e4a, 0x1a1a3e];
    nebulaColors.forEach((col, ci) => {
      const ng = new THREE.BufferGeometry();
      const np = new Float32Array(60 * 3);
      for (let i = 0; i < 60; i++) {
        np[i*3]   = (Math.random()-0.5) * 80 + (ci % 2 === 0 ? -30 : 30);
        np[i*3+1] = (Math.random()-0.5) * 40;
        np[i*3+2] = -40 + (Math.random()-0.5) * 30;
      }
      ng.setAttribute("position", new THREE.BufferAttribute(np, 3));
      const nm = new THREE.PointsMaterial({ color: col, size: 3.5, transparent: true, opacity: 0.18, sizeAttenuation: true });
      threeScene.add(new THREE.Points(ng, nm));
    });

    // ─── WHITE PLANE (the stage) ───────────────────────────────────
    // Physical white plane — the "paper" the objects sit on
    const planeGeo = new THREE.PlaneGeometry(12, 8, 1, 1);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.6,
      metalness: 0.0,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = -0.01;
    planeMesh.receiveShadow = true;
    planeMesh.name = "stage";
    threeScene.add(planeMesh);

    // Subtle grid lines on the plane (dark/black, thin)
    const gridHelper = new THREE.GridHelper(12, 24, 0x000000, 0x222222);
    gridHelper.position.y = 0.002;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.12;
    threeScene.add(gridHelper);

    // Plane border glow (thin emissive edges)
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const edgePoints = [
      new THREE.Vector3(-6, 0.01, -4),
      new THREE.Vector3( 6, 0.01, -4),
      new THREE.Vector3( 6, 0.01,  4),
      new THREE.Vector3(-6, 0.01,  4),
      new THREE.Vector3(-6, 0.01, -4),
    ];
    const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints);
    threeScene.add(new THREE.Line(edgeGeo, edgeMat));

    // ─── BUILD 3D OBJECTS ─────────────────────────────────────────
    buildPCMCrate();   // Scene 1
    buildSmartTag();   // Scene 2
    buildTruck3D();    // Scene 3

    // Start loop
    graphData = [];
    tempGraphCanvas = document.getElementById("route-temp-graph");
    if (tempGraphCanvas) tempGraphCtx = tempGraphCanvas.getContext("2d");

    window.addEventListener("resize", onThreeResize);
    animateThree(0);
  }

  function stopThreeDemo() {
    if (threeAnimFrameId) {
      cancelAnimationFrame(threeAnimFrameId);
      threeAnimFrameId = null;
    }
    window.removeEventListener("resize", onThreeResize);
    threeRenderer = null;
    threeScene = null;
    threeCamera = null;
  }

  function onThreeResize() {
    if (!threeCamera || !threeRenderer) return;
    threeCamera.aspect = window.innerWidth / window.innerHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── PCM CRATE ─────────────────────────────────────────────────
  function buildPCMCrate() {
    crateGroup = new THREE.Group();
    crateGroup.name = "crateGroup";
    crateGroup.position.set(0, 10, 0); // start offscreen above
    threeScene.add(crateGroup);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.3,
      metalness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.08
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 1.6), bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    crateGroup.add(body);

    // PCM layer bands (horizontal stripes)
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 });
    [-0.35, 0.35].forEach(y => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.12, 1.62), bandMat);
      band.position.y = y;
      band.castShadow = true;
      crateGroup.add(band);
    });

    // Lid (top)
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.2, metalness: 0.3 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.18, 1.64), lidMat);
    lid.position.y = 0.89;
    lid.castShadow = true;
    crateGroup.add(lid);

    // Handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 1.06, 0);
    crateGroup.add(handle);

    // Corner guards (yellow)
    const guardMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
    [[1.1,-0.79,0.8],[1.1,-0.79,-0.8],[-1.1,-0.79,0.8],[-1.1,-0.79,-0.8]].forEach(([x,y,z]) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), guardMat);
      g.position.set(x,y,z);
      crateGroup.add(g);
    });

    // LED indicator (glowing green dot)
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 2.0 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), ledMat);
    led.position.set(0.95, 0.0, 0.82);
    crateGroup.add(led);

    // Bottom feet
    const footMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    [[-0.8,-0.85,0.6],[0.8,-0.85,0.6],[-0.8,-0.85,-0.6],[0.8,-0.85,-0.6]].forEach(([x,y,z]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), footMat);
      f.position.set(x,y,z);
      crateGroup.add(f);
    });

    crateGroup.position.set(0, 12, 0);
  }

  // ─── SMART TAG ─────────────────────────────────────────────────
  function buildSmartTag() {
    partsGroup = new THREE.Group();
    partsGroup.name = "tagGroup";
    partsGroup.position.set(-15, 0.5, 0); // start offscreen left
    threeScene.add(partsGroup);

    // Main PCB board (slim rectangular)
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7, metalness: 0.1 });
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 2.0), pcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    partsGroup.add(pcb);

    // Outer casing (transparent plastic shell)
    const casingMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.55,
      transparent: true,
      opacity: 0.45,
      ior: 1.4,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    const casing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 2.1), casingMat);
    casing.position.y = 0.05;
    partsGroup.add(casing);

    // Chips on PCB
    const chipDefs = [
      { name:"esp32",  color: 0x1e293b, size:[0.38,0.06,0.38], pos:[ 0.2, 0.06, 0.0] },
      { name:"gps",    color: 0x2dd4bf, size:[0.25,0.07,0.25], pos:[-0.35,0.06,-0.55] },
      { name:"bme",    color: 0x94a3b8, size:[0.18,0.06,0.18], pos:[ 0.4, 0.06,-0.55] },
      { name:"mpu",    color: 0x3b82f6, size:[0.22,0.06,0.22], pos:[-0.35,0.06, 0.5] },
      { name:"lora",   color: 0xb45309, size:[0.32,0.08,0.32], pos:[ 0.38,0.06, 0.55] },
    ];
    chipDefs.forEach(c => {
      const m = new THREE.MeshStandardMaterial({ color: c.color, emissive: c.color, emissiveIntensity: 0.25, roughness: 0.3 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...c.size), m);
      mesh.name = c.name;
      mesh.position.set(...c.pos);
      mesh.castShadow = true;
      partsGroup.add(mesh);
    });

    // Battery (silver pill)
    const battMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.2 });
    const batt = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 16), battMat);
    batt.rotation.z = Math.PI / 2;
    batt.position.set(-0.36, 0.06, -0.1);
    batt.castShadow = true;
    partsGroup.add(batt);

    // Antenna wire (thin line)
    const antPoints = [
      new THREE.Vector3(0.6, 0.12, -0.9),
      new THREE.Vector3(0.6, 0.12, -1.3),
      new THREE.Vector3(0.85, 0.12, -1.3),
    ];
    const antGeo = new THREE.BufferGeometry().setFromPoints(antPoints);
    const antMat = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
    partsGroup.add(new THREE.Line(antGeo, antMat));

    // Status LEDs
    [[0.55,0.12,0.85],[0.55,0.12,0.65]].forEach((pos, i) => {
      const lm = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0x22c55e : 0x3b82f6,
        emissive: i === 0 ? 0x22c55e : 0x3b82f6,
        emissiveIntensity: 2.5
      });
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), lm);
      l.position.set(...pos);
      partsGroup.add(l);
    });

    // Serial number label geometry (flat black strip)
    const labelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const label = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.01, 0.18), labelMat);
    label.position.set(-0.1, 0.036, 0.85);
    partsGroup.add(label);

    partsGroup.rotation.x = -Math.PI / 2; // Lay flat
    partsGroup.position.set(-20, 0.15, 0);
  }

  // ─── TRUCK ─────────────────────────────────────────────────────
  function buildTruck3D() {
    routeGroup = new THREE.Group();
    routeGroup.name = "truckGroup";
    routeGroup.position.set(20, 0, 0); // start offscreen right
    threeScene.add(routeGroup);

    // ── Chassis
    const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 1.2), chassisMat);
    chassis.position.set(0, 0.09, 0);
    chassis.castShadow = true;
    routeGroup.add(chassis);

    // ── Cabin (white)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.05 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 1.15), cabMat);
    cab.position.set(1.25, 0.78, 0);
    cab.castShadow = true;
    routeGroup.add(cab);

    // Windshield (glass)
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.05, transmission: 0.7, transparent: true, opacity: 0.6, ior: 1.5 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.92), glassMat);
    windshield.position.set(1.81, 0.92, 0);
    routeGroup.add(windshield);

    // Side windows
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.06), glassMat);
    [-0.575, 0.575].forEach(z => {
      const w = sideWin.clone();
      w.position.set(1.25, 0.98, z);
      routeGroup.add(w);
    });

    // ── Cargo Container (blue with PreservAI branding)
    const cargoMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.4,
      metalness: 0.15,
      emissive: 0x0284c7,
      emissiveIntensity: 0.08
    });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 1.16), cargoMat);
    cargo.position.set(-0.5, 0.845, 0);
    cargo.castShadow = true;
    routeGroup.add(cargo);

    // Yellow stripe on cargo
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 1.17), stripeMat);
    stripe.position.set(-0.5, 0.6, 0);
    routeGroup.add(stripe);

    // Door seam (back)
    const seamMat = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.6 });
    const seamPoints = [new THREE.Vector3(-1.8,0.18,-0.58), new THREE.Vector3(-1.8,1.515,-0.58), new THREE.Vector3(-1.8,1.515,0.58), new THREE.Vector3(-1.8,0.18,0.58)];
    const seamGeo = new THREE.BufferGeometry().setFromPoints(seamPoints);
    routeGroup.add(new THREE.Line(seamGeo, seamMat));

    // ── Wheels (6 wheels: 2 front + 4 rear dual axle)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.15 });
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 20);
    const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.27, 10);

    const wheelDefs = [
      // front
      {x: 1.5, z: 0.63}, {x: 1.5, z: -0.63},
      // mid rear pair
      {x: -0.55, z: 0.73}, {x: -0.55, z: -0.73},
      // back rear pair
      {x: -1.3, z: 0.73}, {x: -1.3, z: -0.73},
    ];
    wheelDefs.forEach(({x,z}) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.32, z);
      w.castShadow = true;
      const h = new THREE.Mesh(hubGeo, hubMat);
      h.rotation.x = Math.PI / 2;
      w.add(h);
      routeGroup.add(w);
    });

    // ── Headlights
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 3.0 });
    [[1.87, 0.55, 0.38],[1.87, 0.55,-0.38]].forEach(([x,y,z]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.2), hlMat);
      hl.position.set(x,y,z);
      routeGroup.add(hl);
    });

    // ── Exhaust pipe
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8), exhaustMat);
    exhaust.position.set(0.7, 1.1, -0.62);
    routeGroup.add(exhaust);

    // ── Route path on the plane
    const routePoints = [
      new THREE.Vector3(-5.5, 0.015, 0),
      new THREE.Vector3(-2, 0.015, 1.2),
      new THREE.Vector3(0, 0.015, 0),
      new THREE.Vector3(2, 0.015, -0.8),
      new THREE.Vector3(5.5, 0.015, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(routePoints);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    const pathMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, linewidth: 1, dashSize: 0.18, gapSize: 0.1, transparent: true, opacity: 0.6 });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    pathLine.computeLineDistances();
    routeGroup.add(pathLine);

    // City dots
    const cityMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.5 });
    const dangerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2 });
    routePoints.forEach((pt, i) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), i === 2 ? dangerMat : cityMat);
      dot.position.copy(pt);
      dot.position.y = 0.1;
      routeGroup.add(dot);
    });

    routeGroup.position.set(25, 0, 0);
    stormParticles = null;
  }

  function drawRouteGraph(factor) {
    if (!tempGraphCtx) return;
    const canvas = tempGraphCanvas;
    if (!canvas) return;
    const w = canvas.width, h = canvas.height;
    tempGraphCtx.clearRect(0, 0, w, h);
    if (graphData.length === 0) {
      for (let i = 0; i < 30; i++) {
        graphData.push({ x: (i / 29) * w, y: h * 0.35 + Math.sin(i * 0.3) * h * 0.08 });
      }
    }
    const drawLimit = Math.floor(Math.min(factor, 1.0) * graphData.length);
    if (drawLimit < 2) return;
    const isAlert = factor > 1.0;
    tempGraphCtx.strokeStyle = isAlert ? "#ef4444" : "#38bdf8";
    tempGraphCtx.lineWidth = 2;
    tempGraphCtx.shadowColor = isAlert ? "#ef4444" : "#38bdf8";
    tempGraphCtx.shadowBlur = 8;
    tempGraphCtx.beginPath();
    const points = graphData;
    tempGraphCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < drawLimit; i++) {
      tempGraphCtx.lineTo(points[i].x, points[i].y);
    }
    tempGraphCtx.stroke();
  }

  function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  // ─── ANIMATE THREE ─────────────────────────────────────────────
  function animateThree(time) {
    threeAnimFrameId = requestAnimationFrame(animateThree);
    const timeSec = time * 0.001;

    // Smooth scroll lerp
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.06;

    // Slowly rotate starfield
    const sf = threeScene ? threeScene.getObjectByName("starfield") : null;
    if (sf) {
      sf.rotation.y = timeSec * 0.008;
      sf.rotation.x = Math.sin(timeSec * 0.004) * 0.02;
    }

    if (!crateGroup || !partsGroup || !routeGroup) {
      if (threeRenderer && threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
      return;
    }

    const sc = scrollCurrent; // 0..1

    // ─── 1. PCM CRATE POSITION & VISIBILITY ───
    let crateX = 0;
    let crateY = 0.82;
    if (sc < 0.10) {
      // Intro drop
      const f = smoothstep(0, 0.10, sc);
      crateY = 12 - 11.18 * f;
    } else if (sc >= 0.25 && sc <= 0.40) {
      // Slide out to left
      const f = smoothstep(0.25, 0.40, sc);
      crateX = -15 * f;
    } else if (sc > 0.40) {
      crateX = -15;
    }
    crateGroup.position.set(crateX, crateY, 0);
    crateGroup.rotation.y = timeSec * 0.3;
    crateGroup.visible = (crateX > -14);

    // ─── 2. SMART TAG POSITION & VISIBILITY ───
    let tagX = 15;
    if (sc >= 0.25 && sc < 0.40) {
      // Slide in from right
      const f = smoothstep(0.25, 0.40, sc);
      tagX = 15 - 15 * f;
    } else if (sc >= 0.40 && sc < 0.60) {
      tagX = 0;
    } else if (sc >= 0.60 && sc <= 0.75) {
      // Slide out to left
      const f = smoothstep(0.60, 0.75, sc);
      tagX = -15 * f;
    } else if (sc > 0.75) {
      tagX = -15;
    }
    partsGroup.position.set(tagX, 0.15, 0);
    partsGroup.rotation.set(-Math.PI / 2, 0, timeSec * 0.25);
    partsGroup.visible = (tagX > -14 && tagX < 14);

    // ─── 3. TRUCK POSITION & VISIBILITY ───
    let truckX = 15;
    if (sc >= 0.60 && sc < 0.75) {
      // Slide in from right
      const f = smoothstep(0.60, 0.75, sc);
      truckX = 15 - 15 * f;
    } else if (sc >= 0.75) {
      truckX = 0;
    }
    routeGroup.position.set(truckX, 0, 0);
    
    // Truck rotation: face straight left (Math.PI) while driving, slow spin during showcase
    if (sc < 0.75) {
      routeGroup.rotation.set(0, Math.PI, 0);
      // Wheels rotate while moving
      routeGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
          child.rotation.z = -timeSec * 5.0;
        }
      });
    } else {
      // Showcase spin
      const rotationSpeed = (sc - 0.75) * 1.5 + timeSec * 0.12;
      routeGroup.rotation.set(0, Math.PI + rotationSpeed, 0);
      // Wheels stopped
    }
    routeGroup.visible = (truckX < 14);

    // ─── CAMERA & ORBIT ───
    if (sc < 0.75) {
      // Settle camera on stage
      threeCamera.position.set(Math.sin(timeSec * 0.15) * 0.2, 5.5 + Math.cos(timeSec * 0.25) * 0.1, 10);
      threeCamera.lookAt(0, 0.4, 0);
    } else {
      // Orbital final stage showcase
      const angle = Math.PI + timeSec * 0.15;
      threeCamera.position.set(
        Math.sin(angle) * 10,
        5.5 + Math.sin(timeSec * 0.08) * 0.8,
        Math.cos(angle) * 10
      );
      threeCamera.lookAt(0, 0.4, 0);
    }

    threeRenderer.render(threeScene, threeCamera);
  }
});

