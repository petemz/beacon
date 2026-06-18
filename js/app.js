// Beacon Child Tracker - Shared Utilities

const Beacon = {
  // LocalStorage keys
  KEYS: {
    SESSION: 'beaconSession',
    FAMILIES: 'beaconFamilies',
    ALERT: 'beaconAlert',
    ALERT_HISTORY: 'beaconAlertHistory',
    SAFE_ZONES: 'beaconSafeZones'
  },

  // Generate random wristband ID (5 chars)
  generateId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  },

  // Generate master band ID
  generateMasterBandId() {
    const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    return `MB-${num}`;
  },

  // Session management
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.SESSION)) || null;
    } catch {
      return null;
    }
  },

  setSession(data) {
    localStorage.setItem(this.KEYS.SESSION, JSON.stringify(data));
  },

  clearSession() {
    localStorage.removeItem(this.KEYS.SESSION);
  },

  // Family management
  getFamilies() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.FAMILIES)) || [];
    } catch {
      return [];
    }
  },

  saveFamily(family) {
    const families = this.getFamilies();
    const existingIndex = families.findIndex(f => f.masterBandId === family.masterBandId);
    if (existingIndex >= 0) {
      families[existingIndex] = family;
    } else {
      families.push(family);
    }
    localStorage.setItem(this.KEYS.FAMILIES, JSON.stringify(families));
  },

  getFamilyByPhone(phone) {
    const normalized = phone.replace(/\s/g, '');
    return this.getFamilies().find(f => f.parentPhone.replace(/\s/g, '') === normalized);
  },

  // Alert management
  getAlert() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.ALERT)) || null;
    } catch {
      return null;
    }
  },

  setAlert(alert) {
    localStorage.setItem(this.KEYS.ALERT, JSON.stringify(alert));
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(new CustomEvent('beaconAlert', { detail: alert }));
  },

  clearAlert() {
    localStorage.removeItem(this.KEYS.ALERT);
    window.dispatchEvent(new CustomEvent('beaconAlert', { detail: null }));
  },

  // Alert history management
  getAlertHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.ALERT_HISTORY)) || [];
    } catch {
      return [];
    }
  },

  addToAlertHistory(alert) {
    const history = this.getAlertHistory();
    history.unshift({
      ...alert,
      id: Date.now(),
      resolved: false,
      resolvedAt: null
    });
    // Keep only last 50 alerts
    if (history.length > 50) history.pop();
    localStorage.setItem(this.KEYS.ALERT_HISTORY, JSON.stringify(history));
  },

  resolveAlertInHistory(alertId) {
    const history = this.getAlertHistory();
    const alert = history.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      localStorage.setItem(this.KEYS.ALERT_HISTORY, JSON.stringify(history));
    }
  },

  clearAlertHistory() {
    localStorage.removeItem(this.KEYS.ALERT_HISTORY);
  },

  // Safe zones management
  getSafeZones(masterBandId) {
    try {
      const zones = JSON.parse(localStorage.getItem(this.KEYS.SAFE_ZONES)) || {};
      return zones[masterBandId] || [];
    } catch {
      return [];
    }
  },

  saveSafeZone(masterBandId, zone) {
    try {
      const zones = JSON.parse(localStorage.getItem(this.KEYS.SAFE_ZONES)) || {};
      if (!zones[masterBandId]) zones[masterBandId] = [];
      zones[masterBandId].push({
        id: Date.now(),
        name: zone.name,
        center: zone.center, // {x, y} in percentage
        radius: zone.radius, // in percentage
        enabled: true
      });
      localStorage.setItem(this.KEYS.SAFE_ZONES, JSON.stringify(zones));
    } catch {
      // Handle error
    }
  },

  deleteSafeZone(masterBandId, zoneId) {
    try {
      const zones = JSON.parse(localStorage.getItem(this.KEYS.SAFE_ZONES)) || {};
      if (zones[masterBandId]) {
        zones[masterBandId] = zones[masterBandId].filter(z => z.id !== zoneId);
        localStorage.setItem(this.KEYS.SAFE_ZONES, JSON.stringify(zones));
      }
    } catch {
      // Handle error
    }
  },

  toggleSafeZone(masterBandId, zoneId) {
    try {
      const zones = JSON.parse(localStorage.getItem(this.KEYS.SAFE_ZONES)) || {};
      if (zones[masterBandId]) {
        const zone = zones[masterBandId].find(z => z.id === zoneId);
        if (zone) zone.enabled = !zone.enabled;
        localStorage.setItem(this.KEYS.SAFE_ZONES, JSON.stringify(zones));
      }
    } catch {
      // Handle error
    }
  },

  // Check if point is inside a safe zone
  isInsideSafeZone(x, y, zone) {
    const dx = x - zone.center.x;
    const dy = y - zone.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= zone.radius;
  },

  // Check if child is in any safe zone
  isChildInAnySafeZone(child, zones) {
    if (!zones || zones.length === 0) return { inZone: true, zoneName: null };
    const enabledZones = zones.filter(z => z.enabled);
    if (enabledZones.length === 0) return { inZone: true, zoneName: null };

    for (const zone of enabledZones) {
      if (this.isInsideSafeZone(child.x, child.y, zone)) {
        return { inZone: true, zoneName: zone.name };
      }
    }
    return { inZone: false, zoneName: null };
  },

  // Sound and vibration notifications
  playAlertSound() {
    try {
      // Create an oscillator for a warning beep
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();

      // Beep pattern: beep-beep-beep
      setTimeout(() => { gainNode.gain.value = 0; }, 150);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 250);
      setTimeout(() => { gainNode.gain.value = 0; }, 400);
      setTimeout(() => { gainNode.gain.value = 0.3; }, 500);
      setTimeout(() => { gainNode.gain.value = 0; oscillator.stop(); }, 650);
    } catch {
      // Audio not supported
    }
  },

  playSuccessSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 523.25; // C5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.2;

      oscillator.start();

      // Pleasant rising tone
      setTimeout(() => { oscillator.frequency.value = 659.25; }, 100); // E5
      setTimeout(() => { oscillator.frequency.value = 783.99; }, 200); // G5
      setTimeout(() => { gainNode.gain.value = 0; oscillator.stop(); }, 350);
    } catch {
      // Audio not supported
    }
  },

  vibrate(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern || [200, 100, 200, 100, 200]);
    }
  },

  vibrateShort() {
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  },

  // Trigger alert with sound and vibration
  triggerAlertNotification() {
    this.playAlertSound();
    this.vibrate([300, 100, 300, 100, 500]);
  },

  // Format time ago
  timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  // Format timestamp to readable time
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  },

  // Map landmarks
  landmarks: [
    { name: 'Main Courtyard', x: 50, y: 50 },
    { name: 'North Prayer Hall', x: 50, y: 16 },
    { name: 'Sector C Camp', x: 80, y: 26 },
    { name: 'Gate 7', x: 16, y: 82 },
    { name: 'Hydration Point 4', x: 20, y: 50 },
    { name: 'Car Park 3', x: 82, y: 80 }
  ],

  nearestLandmark(x, y) {
    let best = this.landmarks[0];
    let bestDist = Infinity;
    for (const l of this.landmarks) {
      const d = Math.pow(l.x - x, 2) + Math.pow(l.y - y, 2);
      if (d < bestDist) {
        bestDist = d;
        best = l;
      }
    }
    return best.name;
  },

  // Simulate child position drift
  driftPosition(x, y) {
    const nx = Math.max(16, Math.min(84, x + (Math.random() * 2 - 1) * 7));
    const ny = Math.max(16, Math.min(84, y + (Math.random() * 2 - 1) * 7));
    return { x: nx, y: ny };
  },

  // Initialize demo data if empty
  initDemoData() {
    if (this.getFamilies().length === 0) {
      const demoFamily = {
        parentName: 'Amina Yusuf',
        parentPhone: '+234 803 555 0142',
        masterBandId: 'MB-00592',
        children: [
          { index: 1, name: 'Bilal', wristband: 'K7F2Q', status: 'safe', x: 42, y: 48 },
          { index: 2, name: 'Zaynab', wristband: 'M3X9P', status: 'safe', x: 60, y: 24 },
          { index: 3, name: 'Omar', wristband: 'T8L4R', status: 'safe', x: 26, y: 74 }
        ]
      };
      this.saveFamily(demoFamily);
    }
  },

  // Format phone for display
  formatPhone(phone) {
    return phone || '';
  },

  // Check if on admin page
  isAdminPage() {
    return window.location.pathname.includes('/admin');
  }
};

// Listen for storage changes from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === Beacon.KEYS.ALERT) {
    const alert = e.newValue ? JSON.parse(e.newValue) : null;
    window.dispatchEvent(new CustomEvent('beaconAlert', { detail: alert }));
  }
});

// Export for use
if (typeof module !== 'undefined') {
  module.exports = Beacon;
}
