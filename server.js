const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 8080);
const DEVICE_STALE_MS = Number(process.env.DEVICE_STALE_MS || 10000);
const RESET_ENABLED = process.env.ALLOW_DEVICE_RESET === "true";

app.use(express.json());
app.use(cors());

const devices = new Map();

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = normalizeText(value);

  if (["true", "1", "ligado", "ativo", "acionado", "running"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "desligado", "inativo", "desacionado", "stopped"].includes(normalized)) {
    return false;
  }

  return null;
};

const normalizeTimestamp = (value) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const isDeviceConnected = (device, now = Date.now()) => {
  const parsed = new Date(device.lastSeen);

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return now - parsed.getTime() <= DEVICE_STALE_MS;
};

const getSensorKeyFromTag = (tag) => {
  const normalized = normalizeText(tag);

  if (["temperature", "temperatura"].includes(normalized)) {
    return "temperature";
  }

  if (["pressure", "pressao"].includes(normalized)) {
    return "pressure";
  }

  if (["humidity", "umidade"].includes(normalized)) {
    return "humidity";
  }

  if (["running", "status", "sensor_presenca", "presenca"].includes(normalized)) {
    return "running";
  }

  if (["safetylock", "trava_seguranca", "trava"].includes(normalized)) {
    return "safetyLock";
  }

  return null;
};

const buildSensorPatch = (payload) => {
  const sensors = {
    temperature: null,
    pressure: null,
    humidity: null,
    running: null,
    safetyLock: null,
  };

  const directMappings = [
    ["temperature", payload.temperature],
    ["temperature", payload.temperatura],
    ["pressure", payload.pressure],
    ["pressure", payload.pressao],
    ["humidity", payload.humidity],
    ["humidity", payload.umidade],
    ["running", payload.running],
    ["running", payload.Status],
    ["running", payload.status],
    ["running", payload.sensor_presenca],
    ["safetyLock", payload.safetyLock],
    ["safetyLock", payload.trava_seguranca],
  ];

  for (const [key, value] of directMappings) {
    if (value === undefined) {
      continue;
    }

    if (key === "running" || key === "safetyLock") {
      sensors[key] = toBoolean(value);
      continue;
    }

    sensors[key] = toNumber(value);
  }

  if (payload.sensors && typeof payload.sensors === "object") {
    const nested = payload.sensors;
    const nestedMappings = [
      ["temperature", nested.temperature],
      ["pressure", nested.pressure],
      ["humidity", nested.humidity],
      ["running", nested.running],
      ["safetyLock", nested.safetyLock],
    ];

    for (const [key, value] of nestedMappings) {
      if (value === undefined) {
        continue;
      }

      if (key === "running" || key === "safetyLock") {
        sensors[key] = toBoolean(value);
        continue;
      }

      sensors[key] = toNumber(value);
    }
  }

  if (payload.tag !== undefined && payload.valor !== undefined) {
    const key = getSensorKeyFromTag(payload.tag);

    if (key) {
      sensors[key] =
        key === "running" || key === "safetyLock"
          ? toBoolean(payload.valor)
          : toNumber(payload.valor);
    }
  }

  return sensors;
};

const createDevice = (payload, deviceId) => ({
  deviceId,
  name: payload.name || payload.nome || payload.Sensor || "Estacao OPC UA",
  type: payload.type || payload.tipo || "CLP / Sensores",
  location: payload.location || payload.localizacao || "Laboratorio",
  connected: false,
  lastSeen: normalizeTimestamp(payload.timestamp),
  sensors: {
    temperature: null,
    pressure: null,
    humidity: null,
    running: null,
    safetyLock: null,
  },
  history: [],
});

const summarizeStatus = (device, connected = isDeviceConnected(device)) => {
  if (!connected) {
    return "Sem comunicacao";
  }

  if (device.sensors.running === false) {
    return "Parado";
  }

  if (device.sensors.running === true) {
    return "Operando";
  }

  return "Aguardando dados";
};

const serializeDevice = (device, now = Date.now()) => {
  const connected = isDeviceConnected(device, now);

  return {
    ...device,
    connected,
    status: summarizeStatus(device, connected),
  };
};

const listDevices = () => {
  const now = Date.now();
  return Array.from(devices.values()).map((device) => serializeDevice(device, now));
};

const upsertDevice = (payload) => {
  const deviceId = String(
    payload.deviceId ||
      payload.id ||
      payload.Codigo ||
      payload.codigo ||
      "opcua-lab-01"
  );

  const existingDevice = devices.get(deviceId) || createDevice(payload, deviceId);
  const patch = buildSensorPatch(payload);

  existingDevice.name = payload.name || payload.nome || payload.Sensor || existingDevice.name;
  existingDevice.type = payload.type || payload.tipo || existingDevice.type;
  existingDevice.location =
    payload.location || payload.localizacao || existingDevice.location;
  existingDevice.connected = true;
  existingDevice.lastSeen = normalizeTimestamp(payload.timestamp);

  for (const [key, value] of Object.entries(patch)) {
    if (value !== null) {
      existingDevice.sensors[key] = value;
    }
  }

  existingDevice.status = summarizeStatus(existingDevice, true);

  existingDevice.history.push({
    timestamp: existingDevice.lastSeen,
    sensors: { ...existingDevice.sensors },
  });

  if (existingDevice.history.length > 30) {
    existingDevice.history.shift();
  }

  devices.set(deviceId, existingDevice);
  return serializeDevice(existingDevice);
};

app.get("/", (req, res) => {
  res.send(listDevices());
});

app.get("/health", (req, res) => {
  const snapshot = listDevices();
  const connectedDevices = snapshot.filter((device) => device.connected).length;

  res.send({
    status: "ok",
    devices: snapshot.length,
    connectedDevices,
    staleDevices: snapshot.length - connectedDevices,
    deviceStaleMs: DEVICE_STALE_MS,
    resetEnabled: RESET_ENABLED,
    timestamp: new Date().toISOString(),
  });
});

app.get("/devices", (req, res) => {
  res.send(listDevices());
});

app.get("/devices/:deviceId", (req, res) => {
  const device = devices.get(req.params.deviceId);

  if (!device) {
    return res.status(404).send({ message: "Dispositivo nao encontrado." });
  }

  return res.send(serializeDevice(device));
});

app.post("/iot", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).send({ message: "Payload invalido." });
  }

  const device = upsertDevice(req.body);

  return res.status(201).send({
    message: "Leitura recebida com sucesso.",
    device,
  });
});

app.post("/devices", (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).send({ message: "Payload invalido." });
  }

  const device = upsertDevice(req.body);

  return res.status(201).send({
    message: "Dispositivo registrado com sucesso.",
    device,
  });
});

app.delete("/destroy", (req, res) => {
  if (!RESET_ENABLED) {
    return res.status(403).send({
      message: "Operacao desabilitada. Defina ALLOW_DEVICE_RESET=true para liberar a limpeza.",
    });
  }

  devices.clear();
  return res.send({ message: "Todos os dispositivos foram removidos." });
});

app.delete("/destroy/:deviceId", (req, res) => {
  if (!RESET_ENABLED) {
    return res.status(403).send({
      message: "Operacao desabilitada. Defina ALLOW_DEVICE_RESET=true para liberar a limpeza.",
    });
  }

  const removed = devices.delete(req.params.deviceId);

  if (!removed) {
    return res.status(404).send({ message: "Dispositivo nao encontrado." });
  }

  return res.send({ message: `Dispositivo ${req.params.deviceId} removido.` });
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
