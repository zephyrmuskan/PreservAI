// PreservAI Mock Data and Telemetry Simulator State

const initialKpis = {
  activeShipments: 1254,
  productHealthScore: 96,
  averageRiskScore: 12,
  spoilagePreventedCr: 2.8,
  activeSmartTags: 8920,
  activeSmartCrates: 542,
  co2EmissionsSavedTons: 18.6
};

// Major Indian cities for pathing and markers
const CITIES = {
  PUNE: { name: "Pune Hub", coords: [18.5204, 73.8567] },
  DELHI: { name: "New Delhi Central", coords: [28.6139, 77.2090] },
  MUMBAI: { name: "Mumbai Port Depot", coords: [19.0760, 72.8777] },
  HYDERABAD: { name: "Hyderabad Pharma City", coords: [17.3850, 78.4867] },
  BANGALORE: { name: "Bangalore Logistics Park", coords: [12.9716, 77.5946] },
  AHMEDABAD: { name: "Ahmedabad Cold Depot", coords: [23.0225, 72.5714] },
  CHENNAI: { name: "Chennai Cold Storage", coords: [13.0827, 80.2707] },
  KOLKATA: { name: "Kolkata Cargo Terminal", coords: [22.5726, 88.3639] },
  NASHIK: { name: "Nashik Agri Storage", coords: [19.9975, 73.7898] },
  JAIPUR: { name: "Jaipur distribution Center", coords: [26.9124, 75.7873] }
};

const initialShipments = [
  {
    id: "V-102",
    name: "Rotavirus Vaccine Batch #409",
    type: "Vaccine",
    status: "Warning",
    origin: "Serum Institute, Pune",
    destination: "Delhi Govt Hospital, New Delhi",
    currentLocation: [23.18, 75.78], // Between Pune and Delhi
    route: [
      CITIES.PUNE.coords,
      [20.0, 73.8],
      [22.7, 75.8],
      [23.18, 75.78], // current
      [26.9, 75.7],
      CITIES.DELHI.coords
    ],
    productHealthScore: 78,
    pcmHealth: 82,
    avgRiskScore: 68,
    spoilageProbability: 32,
    expectedFailureTime: "3 hours 45 mins",
    recommendedAction: "Transfer shipment to nearest cold storage facility in Gwalior within 4 hours.",
    temperature: 6.8,
    humidity: 61,
    shock: 0.2,
    battery: 93,
    gpsStatus: "Active",
    estimatedShelfLife: "14 Days",
    coolingRemaining: 18, // Hours
    internalTemp: 4.2,
    solarHarvesting: "Active",
    vibrationHarvesting: "Active",
    tempStability: 84, // %
    shockExposure: 12, // %
    coolingCapacityRemaining: 82, // %
    smartTagId: "TAG-9081",
    smartCrateId: "CRT-542",
    history: {
      temperature: [4.1, 4.2, 4.3, 4.4, 4.5, 4.8, 5.2, 5.5, 5.9, 6.2, 6.5, 6.8],
      humidity: [58, 59, 58, 60, 60, 61, 62, 61, 62, 63, 62, 61],
      shock: [0.1, 0.1, 0.2, 0.1, 0.1, 0.3, 0.2, 0.2, 0.1, 0.2, 0.2, 0.2],
      battery: [99, 98, 98, 97, 96, 96, 95, 94, 94, 93, 93, 93],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: [
      { type: "Temperature Excursion", severity: "P2 High", time: "22:15", message: "Temp reached 6.8°C (Limit: 6.0°C)" },
      { type: "Battery Low Warning", severity: "P4 Low", time: "20:30", message: "Backup smart tag sensor battery at 22%" }
    ]
  },
  {
    id: "V-101",
    name: "Covaxin Dry-Ice Pack #12",
    type: "Vaccine",
    status: "Safe",
    origin: "Bharat Biotech, Hyderabad",
    destination: "SMS Hospital, Jaipur",
    currentLocation: [21.1458, 79.0882], // Nagpur area (en route)
    route: [
      CITIES.HYDERABAD.coords,
      [19.07, 78.5],
      [21.1458, 79.0882], // current
      [23.18, 77.4],
      [25.2, 76.5],
      CITIES.JAIPUR.coords
    ],
    productHealthScore: 98,
    pcmHealth: 92,
    avgRiskScore: 5,
    spoilageProbability: 1,
    expectedFailureTime: "None (Stable)",
    recommendedAction: "Maintain current cooling velocity. Routing optimal.",
    temperature: -18.2,
    humidity: 34,
    shock: 0.1,
    battery: 98,
    gpsStatus: "Active",
    estimatedShelfLife: "45 Days",
    coolingRemaining: 74,
    internalTemp: -19.1,
    solarHarvesting: "Inactive",
    vibrationHarvesting: "Active",
    tempStability: 99,
    shockExposure: 2,
    coolingCapacityRemaining: 92,
    smartTagId: "TAG-4421",
    smartCrateId: "CRT-110",
    history: {
      temperature: [-18.5, -18.4, -18.4, -18.3, -18.3, -18.2, -18.2, -18.2, -18.2, -18.2, -18.2, -18.2],
      humidity: [33, 33, 34, 34, 34, 34, 34, 34, 34, 34, 34, 34],
      shock: [0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      battery: [100, 99, 99, 99, 98, 98, 98, 98, 98, 98, 98, 98],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: []
  },
  {
    id: "F-201",
    name: "Alphonso Mango Export Cargo",
    type: "Food",
    status: "Critical",
    origin: "Nashik Farms, Nashik",
    destination: "Jawaharlal Nehru Port, Mumbai",
    currentLocation: [19.25, 73.05], // Near Kalyan/Thane
    route: [
      CITIES.NASHIK.coords,
      [19.5, 73.4],
      [19.25, 73.05], // current
      CITIES.MUMBAI.coords
    ],
    productHealthScore: 42,
    pcmHealth: 21,
    avgRiskScore: 89,
    spoilageProbability: 76,
    expectedFailureTime: "1 hour 15 mins",
    recommendedAction: "Critical thermal decay! Route vehicle to Mumbai Cargo Cold Depot within 30 minutes.",
    temperature: 14.5,
    humidity: 82,
    shock: 2.1,
    battery: 34,
    gpsStatus: "Active",
    estimatedShelfLife: "2 Days",
    coolingRemaining: 2,
    internalTemp: 13.8,
    solarHarvesting: "Active",
    vibrationHarvesting: "Active",
    tempStability: 31,
    shockExposure: 67,
    coolingCapacityRemaining: 21,
    smartTagId: "TAG-1229",
    smartCrateId: "CRT-304",
    history: {
      temperature: [8.5, 9.1, 9.8, 10.5, 11.2, 12.0, 12.5, 13.1, 13.6, 14.0, 14.3, 14.5],
      humidity: [65, 67, 70, 72, 75, 78, 79, 81, 80, 82, 82, 82],
      shock: [0.1, 0.2, 0.1, 0.2, 1.8, 0.2, 0.1, 2.1, 0.2, 0.3, 0.2, 0.1],
      battery: [45, 44, 43, 42, 40, 39, 38, 36, 36, 35, 34, 34],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: [
      { type: "Temperature Excursion", severity: "P1 Critical", time: "22:50", message: "Temp exceeded critical limit of 10.0°C" },
      { type: "High Shock Detected", severity: "P2 High", time: "19:30", message: "Severe mechanical impact of 2.1G registered" }
    ]
  },
  {
    id: "P-301",
    name: "Insulin Injection Supplies",
    type: "Pharma",
    status: "Safe",
    origin: "Biocon, Bangalore",
    destination: "Apollo Pharmacies, Chennai",
    currentLocation: [12.98, 79.15], // Near Vellore
    route: [
      CITIES.BANGALORE.coords,
      [12.8, 78.2],
      [12.98, 79.15], // current
      [13.0, 79.8],
      CITIES.CHENNAI.coords
    ],
    productHealthScore: 97,
    pcmHealth: 95,
    avgRiskScore: 4,
    spoilageProbability: 2,
    expectedFailureTime: "None (Stable)",
    recommendedAction: "Maintain current temperature band (2-8°C). Routine shipping pattern.",
    temperature: 4.8,
    humidity: 55,
    shock: 0.1,
    battery: 91,
    gpsStatus: "Active",
    estimatedShelfLife: "22 Days",
    coolingRemaining: 42,
    internalTemp: 4.5,
    solarHarvesting: "Active",
    vibrationHarvesting: "Inactive",
    tempStability: 98,
    shockExposure: 1,
    coolingCapacityRemaining: 95,
    smartTagId: "TAG-7721",
    smartCrateId: "CRT-098",
    history: {
      temperature: [4.9, 4.8, 4.8, 4.7, 4.7, 4.8, 4.8, 4.9, 4.9, 4.8, 4.8, 4.8],
      humidity: [54, 54, 55, 55, 56, 56, 55, 55, 55, 56, 55, 55],
      shock: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1],
      battery: [96, 95, 95, 94, 94, 93, 93, 92, 92, 92, 91, 91],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: []
  },
  {
    id: "F-202",
    name: "Organic Dairy Products V2",
    type: "Food",
    status: "Safe",
    origin: "Amul Anand, Ahmedabad",
    destination: "Kolkata Cargo Terminal",
    currentLocation: [22.02, 80.89], // Madhya Pradesh en route
    route: [
      CITIES.AHMEDABAD.coords,
      [22.7, 75.8],
      [23.1, 77.4],
      [22.02, 80.89], // current
      [22.5, 84.5],
      CITIES.KOLKATA.coords
    ],
    productHealthScore: 92,
    pcmHealth: 88,
    avgRiskScore: 10,
    spoilageProbability: 5,
    expectedFailureTime: "None (Stable)",
    recommendedAction: "Cooling systems functional. GPS tracking active.",
    temperature: 3.9,
    humidity: 59,
    shock: 0.1,
    battery: 88,
    gpsStatus: "Active",
    estimatedShelfLife: "8 Days",
    coolingRemaining: 30,
    internalTemp: 3.5,
    solarHarvesting: "Active",
    vibrationHarvesting: "Active",
    tempStability: 94,
    shockExposure: 4,
    coolingCapacityRemaining: 88,
    smartTagId: "TAG-8822",
    smartCrateId: "CRT-244",
    history: {
      temperature: [3.2, 3.3, 3.4, 3.5, 3.5, 3.6, 3.7, 3.8, 3.8, 3.9, 3.9, 3.9],
      humidity: [58, 58, 59, 59, 59, 60, 60, 59, 60, 59, 59, 59],
      shock: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      battery: [92, 91, 91, 90, 90, 89, 89, 88, 88, 88, 88, 88],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: []
  },
  {
    id: "CF-01",
    name: "Central Cold Hub Facility",
    type: "Warehouse",
    status: "Safe",
    origin: "Pune Cold Storage, Sector 4",
    destination: "N/A (Stationary Facility)",
    currentLocation: CITIES.PUNE.coords,
    route: [CITIES.PUNE.coords],
    productHealthScore: 99,
    pcmHealth: 100,
    avgRiskScore: 1,
    spoilageProbability: 0.1,
    expectedFailureTime: "None",
    recommendedAction: "Secondary backup diesel generator active. Main cooling compressors locked at -22°C.",
    temperature: -22.1,
    humidity: 48,
    shock: 0.0,
    battery: 100,
    gpsStatus: "Stationary",
    estimatedShelfLife: "Indefinite",
    coolingRemaining: 999,
    internalTemp: -22.1,
    solarHarvesting: "Active",
    vibrationHarvesting: "Inactive",
    tempStability: 100,
    shockExposure: 0,
    coolingCapacityRemaining: 100,
    smartTagId: "TAG-HUB1",
    smartCrateId: "CRT-HUB1",
    history: {
      temperature: [-22.0, -22.0, -22.1, -22.1, -22.1, -22.1, -22.1, -22.1, -22.1, -22.1, -22.1, -22.1],
      humidity: [48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48],
      shock: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      battery: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: []
  },
  {
    id: "CF-02",
    name: "Airport Cold Gateway Terminal",
    type: "Warehouse",
    status: "Warning",
    origin: "IGIA Cargo Warehouse, Delhi",
    destination: "N/A (Stationary Facility)",
    currentLocation: CITIES.DELHI.coords,
    route: [CITIES.DELHI.coords],
    productHealthScore: 89,
    pcmHealth: 75,
    avgRiskScore: 24,
    spoilageProbability: 11,
    expectedFailureTime: "18 Hours",
    recommendedAction: "Bay 3 cooling door left open for transit loading. Door alarm active. Close to restore thermal envelope.",
    temperature: 2.1,
    humidity: 65,
    shock: 0.1,
    battery: 100,
    gpsStatus: "Stationary",
    estimatedShelfLife: "Indefinite",
    coolingRemaining: 18,
    internalTemp: 1.8,
    solarHarvesting: "Inactive",
    vibrationHarvesting: "Inactive",
    tempStability: 85,
    shockExposure: 0,
    coolingCapacityRemaining: 75,
    smartTagId: "TAG-HUB2",
    smartCrateId: "CRT-HUB2",
    history: {
      temperature: [-4.0, -3.5, -2.1, -1.0, 0.2, 0.8, 1.2, 1.5, 1.9, 2.0, 2.1, 2.1],
      humidity: [50, 52, 55, 57, 60, 62, 63, 64, 65, 65, 65, 65],
      shock: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
      battery: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
      timeLabels: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    },
    alerts: [
      { type: "Geofence Door Excursion", severity: "P3 Medium", time: "21:40", message: "Dock Door #3 open longer than 30 mins" }
    ]
  }
];

// Helper database of smart tag monitoring
const getSmartTags = (shipments) => {
  return shipments.map(s => ({
    id: s.smartTagId,
    shipmentId: s.id,
    shipmentName: s.name,
    temperature: s.temperature,
    humidity: s.humidity,
    shock: s.shock,
    gpsStatus: s.gpsStatus,
    battery: s.battery,
    riskScore: s.avgRiskScore,
    status: s.status
  }));
};

// Helper database of smart crates
const getSmartCrates = (shipments) => {
  return shipments.map(s => ({
    id: s.smartCrateId,
    shipmentId: s.id,
    pcmHealth: s.pcmHealth,
    coolingRemaining: s.coolingRemaining,
    internalTemp: s.internalTemp,
    humidity: s.humidity,
    battery: s.battery,
    solarHarvesting: s.solarHarvesting,
    vibrationHarvesting: s.vibrationHarvesting,
    status: s.status
  }));
};

// Compile global list of alerts from mock shipments
const getGlobalAlerts = (shipments) => {
  let alerts = [];
  shipments.forEach(s => {
    s.alerts.forEach(a => {
      alerts.push({
        shipmentId: s.id,
        shipmentName: s.name,
        type: a.type,
        severity: a.severity, // P1 Critical, P2 High, P3 Medium, P4 Low
        time: a.time,
        message: a.message
      });
    });
  });
  return alerts;
};

// Analytics historical charts data
const analyticsData = {
  spoilageReduction: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    values: [45, 52, 60, 72, 79, 84, 91] // % reduction vs traditional logistics
  },
  productHealthTrends: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    vaccines: [98, 97, 98, 96, 97, 96],
    pharma: [96, 95, 96, 97, 97, 97],
    food: [90, 89, 92, 91, 93, 94]
  },
  riskDistribution: {
    labels: ["Safe", "Warning", "Critical"],
    datasets: [72, 18, 10] // percentages
  },
  routePerformance: {
    labels: ["Pune-Delhi", "Hyd-Jaipur", "Nashik-Mumb", "Blr-Chennai", "Ahmd-Kolkt"],
    scores: [94, 97, 72, 98, 91] // compliance scores
  },
  complianceScore: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    scores: [96.5, 96.8, 95.9, 96.2, 96.0, 97.2, 96.9]
  }
};

// Simulation driver to fluctuate stats dynamically
function runSimulationStep(state) {
  state.shipments.forEach(shipment => {
    // stationary facilities do not drift as much
    const isStationary = shipment.gpsStatus === "Stationary";
    
    // Simulate slight temperature drift
    if (shipment.status === "Critical") {
      shipment.temperature += (Math.random() - 0.2) * 0.3; // drifts higher
      shipment.humidity += (Math.random() - 0.4) * 2;
    } else if (shipment.status === "Warning") {
      shipment.temperature += (Math.random() - 0.4) * 0.2;
      shipment.humidity += (Math.random() - 0.5) * 1;
    } else {
      // safe stable drift
      if (shipment.type === "Vaccine" && shipment.id === "V-101") {
        shipment.temperature += (Math.random() - 0.5) * 0.1;
        if (shipment.temperature < -19.5) shipment.temperature = -19.5;
        if (shipment.temperature > -17.5) shipment.temperature = -17.5;
      } else {
        shipment.temperature += (Math.random() - 0.5) * 0.08;
      }
      shipment.humidity += (Math.random() - 0.5) * 0.5;
    }

    // Keep numbers clean and bounded
    shipment.temperature = parseFloat(shipment.temperature.toFixed(1));
    shipment.humidity = Math.max(10, Math.min(100, Math.round(shipment.humidity)));
    
    // Shock event simulator
    if (!isStationary && Math.random() > 0.85) {
      shipment.shock = parseFloat((Math.random() * 0.4).toFixed(1));
      if (shipment.shock > 0.3) {
        shipment.shockEvents = shipment.shockEvents || [];
        shipment.shockEvents.push({ time: new Date().toLocaleTimeString(), G: shipment.shock });
      }
    } else {
      if (!isStationary) {
        shipment.shock = parseFloat(Math.max(0.1, shipment.shock + (Math.random() - 0.5) * 0.05).toFixed(1));
      }
    }

    // Battery drain simulation (very slow)
    if (Math.random() > 0.9) {
      shipment.battery = Math.max(0, shipment.battery - 1);
    }

    // Update historical logs (shift left and push new)
    shipment.history.temperature.shift();
    shipment.history.temperature.push(shipment.temperature);
    
    shipment.history.humidity.shift();
    shipment.history.humidity.push(shipment.humidity);
    
    shipment.history.shock.shift();
    shipment.history.shock.push(shipment.shock);
    
    shipment.history.battery.shift();
    shipment.history.battery.push(shipment.battery);

    // Update dates/timeLabels
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    shipment.history.timeLabels.shift();
    shipment.history.timeLabels.push(timeStr);

    // Simulating GPS location moving slightly along the route
    if (!isStationary && shipment.route && shipment.route.length > 1) {
      // Dynamic en route tracker
      const curr = shipment.currentLocation;
      // find next waypoint
      let nextIndex = 1;
      let minDistance = Infinity;
      
      // Calculate distances to determine where we are
      for (let i = 0; i < shipment.route.length; i++) {
        const wp = shipment.route[i];
        const dist = Math.hypot(wp[0] - curr[0], wp[1] - curr[1]);
        if (dist < minDistance) {
          minDistance = dist;
          nextIndex = i + 1;
        }
      }
      
      if (nextIndex >= shipment.route.length) {
        nextIndex = 0; // reset route cycle
      }
      
      const target = shipment.route[nextIndex];
      // Step towards target
      const speed = 0.005; // degree step
      const dy = target[0] - curr[0];
      const dx = target[1] - curr[1];
      const dist = Math.hypot(dy, dx);
      if (dist > speed) {
        shipment.currentLocation = [
          parseFloat((curr[0] + (dy / dist) * speed).toFixed(4)),
          parseFloat((curr[1] + (dx / dist) * speed).toFixed(4))
        ];
      } else {
        shipment.currentLocation = target; // arrived at waypoint
      }
    }
  });

  // Calculate dynamic average health score and risk score
  let totalHealth = 0;
  let totalRisk = 0;
  let activeShipmentsCount = 0;

  state.shipments.forEach(s => {
    if (s.gpsStatus !== "Stationary") {
      activeShipmentsCount++;
    }
    totalHealth += s.productHealthScore;
    totalRisk += s.avgRiskScore;
  });

  state.kpis.productHealthScore = Math.round(totalHealth / state.shipments.length);
  state.kpis.averageRiskScore = Math.round(totalRisk / state.shipments.length);
  
  // Fluctuate CO2 emissions slightly up
  state.kpis.co2EmissionsSavedTons = parseFloat((state.kpis.co2EmissionsSavedTons + 0.001).toFixed(3));
}

// Export simulator globally
window.PreservAiState = {
  kpis: { ...initialKpis },
  shipments: [ ...initialShipments ],
  cities: CITIES,
  analytics: { ...analyticsData }
};

window.runPreservAiSimulation = function() {
  runSimulationStep(window.PreservAiState);
};
