import { verifyTrackingToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { AuthenticationError, NotFoundError } from "@/utils/error";


/**
 * GET /live-map/:token
 * No login. No password. Opens directly from SMS link.
 * Returns a minimal Leaflet page that connects to the WS stream
 * and shows the child's location updating in real time.
 */



class LiveMap {
    async getLiveMap(token: string) {
        let childId: string;
        let childName: string;

        try {
            const payload = verifyTrackingToken(token);
            childId = payload.childId;
            childName = payload.childName;


        } catch (error) {
            throw new AuthenticationError("This tracking link has expired or is not valid");
        }

        //get latest known location for initial map render
        const latest = await prisma.locationEvent.findFirst({
            where: {childId},
            orderBy: {recordedAt: "desc"}
        });

        const child = await prisma.child.findUnique({
            where: {id: childId},
            select: {
                lastSeenLandmark: true,
                status: true
            }
        });

        if(!child) {
            throw new NotFoundError("Child with this id doesn't exist")
        }

        const lat = latest?.latitude ?? 6.882;
        const lng = latest?.longitude ?? 3.724;

        const landmark = latest?.landmarkName ?? child?.lastSeenLandmark ?? "unknown area";
        const updatedAt = latest ? new Date(latest.recordedAt).toLocaleTimeString("en-NG") : "Not yet received";

        const wsUrl = `${process.env.BASE_URL?.replace("https://", "wss://").replace("http://", "ws://") ?? "ws://localhost:3000"}/stream`;

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tracking ${childName}</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:sans-serif;background:#f5f5f5}
  #header{background:#c0392b;color:#fff;padding:12px 16px}
  #header h1{font-size:16px;font-weight:600}
  #header p{font-size:13px;opacity:.85;margin-top:2px}
  #status-bar{background:#fff;padding:10px 16px;font-size:13px;
    border-bottom:1px solid #e0e0e0;display:flex;align-items:center;gap:8px}
  #dot{width:10px;height:10px;border-radius:50%;background:#27ae60;
    animation:pulse 1.5s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  #map{height:calc(100vh - 100px)}
  #footer{background:#fff;padding:10px 16px;font-size:12px;color:#888;
    border-top:1px solid #e0e0e0;text-align:center}
</style>
</head>
<body>
<div id="header">
  <h1>Tracking: ${childName}</h1>
  <p id="landmark-text">Last seen near ${landmark}</p>
</div>
<div id="status-bar">
  <div id="dot"></div>
  <span id="updated-text">Last updated: ${updatedAt}</span>
</div>
<div id="map"></div>
<div id="footer">RCCG Camp Tracker &mdash; Do not close this page</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map').setView([${lat}, ${lng}], 17);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

var icon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#c0392b;border:3px solid #fff;box-shadow:0 0 0 3px #c0392b44"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

var marker = L.marker([${lat}, ${lng}], {icon: icon}).addTo(map);
marker.bindPopup('${childName}').openPopup();

function connect() {
  var ws = new WebSocket('${wsUrl}');
  ws.onmessage = function(e) {
    var data = JSON.parse(e.data);
    if (data.type !== 'location') return;
    var latlng = [data.latitude, data.longitude];
    marker.setLatLng(latlng);
    map.panTo(latlng);
    if (data.landmarkName) {
      document.getElementById('landmark-text').textContent = 'Last seen near ' + data.landmarkName;
    }
    var t = new Date(data.recordedAt).toLocaleTimeString('en-NG');
    document.getElementById('updated-text').textContent = 'Last updated: ' + t;
  };
  ws.onclose = function() {
    setTimeout(connect, 3000); // auto-reconnect
  };
}
connect();
</script>
</body>
</html>`;

return {html}
    }
}