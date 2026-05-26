const mqtt = require('mqtt');
require('dotenv').config({ path: '../.env' });

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(brokerUrl);

// Seed data structures for simulated factory floor machines
const machines = [
  { id: 'MACHINE_11', line: 'line_1', status: 'RUNNING', temp: 52, vib: 2.1, power: 14.8 },
  { id: 'MACHINE_12', line: 'line_1', status: 'RUNNING', temp: 58, vib: 2.3, power: 15.2 },
  { id: 'MACHINE_21', line: 'line_2', status: 'RUNNING', temp: 47, vib: 1.9, power: 16.1 },
  { id: 'MACHINE_22', line: 'line_2', status: 'IDLE', temp: 33, vib: 0.4, power: 1.8 },
  { id: 'MACHINE_31', line: 'line_3', status: 'RUNNING', temp: 62, vib: 2.6, power: 17.5 },
  { id: 'MACHINE_32', line: 'line_3', status: 'MAINTENANCE', temp: 38, vib: 0.8, power: 4.5 }
];

client.on('connect', () => {
  console.log(`[Simulator] Sensor Simulator connected to Mosquitto Broker at ${brokerUrl}`);
  
  // Publish telemetry every 1 second
  setInterval(() => {
    machines.forEach(m => {
      let currentStatus = m.status;
      let currentTemp = m.temp + (Math.random() - 0.5) * 4;
      let currentVib = m.vib + (Math.random() - 0.5) * 0.8;
      let currentPower = m.power + (Math.random() - 0.5) * 2;

      // 1. Spikes for testing High Temperature Alarm (Threshold 80°C)
      if (m.id === 'MACHINE_11' && Math.random() < 0.12) {
        currentTemp = 82.5 + Math.random() * 6;
        console.log(`[Simulator Temp Spike] MACHINE_11 generated temperature: ${currentTemp.toFixed(1)}°C`);
      }
      
      // 2. Spikes for testing High Vibration Alarm (Threshold 5.0 mm/s)
      if (m.id === 'MACHINE_21' && Math.random() < 0.12) {
        currentVib = 5.3 + Math.random() * 2.5;
        console.log(`[Simulator Vibration Spike] MACHINE_21 generated vibration: ${currentVib.toFixed(2)} mm/s`);
      }

      // 3. Force downtime state transitions for testing alert engines
      if (m.id === 'MACHINE_12' && Math.random() < 0.08) {
        currentStatus = 'DOWN';
        currentPower = 0.1;
        console.log(`[Simulator Status Down] MACHINE_12 reported DOWN status.`);
      }

      // 4. Silent window to test passive SYSTEM_TIMEOUT heartbeats
      // We will make MACHINE_31 go completely silent for 70 seconds every 180 seconds
      if (m.id === 'MACHINE_31') {
        const cycleSeconds = Math.floor(Date.now() / 1000) % 180;
        if (cycleSeconds >= 100 && cycleSeconds <= 170) {
          if (cycleSeconds === 100) {
            console.log(`[Simulator Silent Window] MACHINE_31 went silent for 70s to test timeout alarms.`);
          }
          return; // Skip publication
        }
      }

      // Constrain power consumption below zero bounds
      if (currentStatus === 'DOWN' || currentStatus === 'MAINTENANCE') {
        currentPower = Math.max(0.1, m.power / 4);
      }

      const payload = {
        machine_id: m.id,
        timestamp: new Date().toISOString(),
        status: currentStatus,
        metrics: {
          temperature: parseFloat(currentTemp.toFixed(1)),
          vibration: parseFloat(currentVib.toFixed(2)),
          power_consumption: parseFloat(Math.max(0.1, currentPower).toFixed(1))
        }
      };

      const topic = `factory/line/${m.line}/machine/${m.id}/telemetry`;
      client.publish(topic, JSON.stringify(payload), { qos: 1 });
    });
  }, 1000);
});

client.on('error', (err) => {
  console.error('[Simulator Error] MQTT Connection failed:', err);
});
