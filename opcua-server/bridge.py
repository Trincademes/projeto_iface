import json
import time
from datetime import datetime, timezone
from urllib import request

from opcua import Client


OPCUA_ENDPOINT = "opc.tcp://127.0.0.1:4840"
BACKEND_URL = "http://127.0.0.1:8080/iot"
PUBLISH_INTERVAL_SECONDS = 2


def post_json(payload):
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        BACKEND_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with request.urlopen(req, timeout=5) as response:
        return response.read().decode("utf-8")


def main():
    client = Client(OPCUA_ENDPOINT)
    client.connect()

    temperature = client.get_node("ns=2;i=2")
    pressure = client.get_node("ns=2;i=3")
    running = client.get_node("ns=2;i=4")
    humidity = client.get_node("ns=2;i=5")
    safety_lock = client.get_node("ns=2;i=6")

    print("Bridge OPC UA -> Backend conectada")

    try:
        while True:
            payload = {
                "deviceId": "opcua-lab-01",
                "name": "Bancada OPC UA",
                "type": "CLP / Sensores",
                "location": "Laboratorio IFAC",
                "temperature": float(temperature.get_value()),
                "pressure": float(pressure.get_value()),
                "running": bool(running.get_value()),
                "humidity": float(humidity.get_value()),
                "safetyLock": bool(safety_lock.get_value()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

            post_json(payload)
            print(payload)
            time.sleep(PUBLISH_INTERVAL_SECONDS)
    finally:
        client.disconnect()


if __name__ == "__main__":
    main()
