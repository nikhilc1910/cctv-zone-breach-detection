const mqtt = require('mqtt');
require('dotenv').config({ path: '../.env' });

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl);

const cameraEvents = [
  {
    camera_id: 'CAM_01',
    zone: 'Line 1 - Welding Loading Bay',
    event_types: ['restricted_zone_entry', 'forklift_near_miss'],
    images: {
      restricted_zone_entry: 'http://localhost:5000/public/events/cctv_zone_breach.jpg',
      forklift_near_miss: 'http://localhost:5000/public/events/cctv_near_miss.jpg'
    }
  },
  {
    camera_id: 'CAM_02',
    zone: 'Line 2 - Stamping Assembly Deck',
    event_types: ['ppe_violation', 'unauthorized_access'],
    images: {
      ppe_violation: 'http://localhost:5000/public/events/cctv_ppe_missing.jpg',
      unauthorized_access: 'http://localhost:5000/public/events/cctv_unauthorized.jpg'
    }
  },
  {
    camera_id: 'CAM_03',
    zone: 'Line 3 - Packing & Outfeed Conveyor',
    event_types: ['machine_blockage'],
    images: {
      machine_blockage: 'http://localhost:5000/public/events/cctv_blockage.jpg'
    }
  }
];

client.on('connect', () => {
  console.log(`[Simulator] Camera Simulator connected to Mosquitto Broker at ${brokerUrl}`);

  // Publish a camera event every 15 seconds
  setInterval(() => {
    // Choose random camera
    const camera = cameraEvents[Math.floor(Math.random() * cameraEvents.length)];
    // Choose random event type supported by that camera
    const eventType = camera.event_types[Math.floor(Math.random() * camera.event_types.length)];
    // Generate random confidence score
    const confidence = parseFloat((0.85 + Math.random() * 0.14).toFixed(2));
    
    const payload = {
      camera_id: camera.camera_id,
      zone: camera.zone,
      timestamp: new Date().toISOString(),
      event_type: eventType,
      confidence: confidence,
      image_url: camera.images[eventType] || 'https://via.placeholder.com/640x480.png?text=No+Image'
    };

    const topic = `factory/camera/${camera.camera_id}/event`;
    client.publish(topic, JSON.stringify(payload), { qos: 2 }, () => {
      console.log(`[Simulator CCTV Event] Published ${eventType} on topic ${topic} with confidence ${confidence}`);
    });
  }, 15000);
});

client.on('error', (err) => {
  console.error('[Simulator Error] MQTT Connection failed for Camera Simulator:', err);
});
