from opcua import Server
import random
import time


server = Server()
server.set_endpoint("opc.tcp://0.0.0.0:4840")

uri = "http://ads.freeopcua.server"
idx = server.register_namespace(uri)

objects = server.get_objects_node()
sensor = objects.add_object(idx, "Sensor")

temperature = sensor.add_variable(idx, "Temperature", 24.0)
pressure = sensor.add_variable(idx, "Pressure", 1.2)
running = sensor.add_variable(idx, "Running", True)
humidity = sensor.add_variable(idx, "Humidity", 55.0)
safety_lock = sensor.add_variable(idx, "SafetyLock", True)

temperature.set_writable()
pressure.set_writable()
running.set_writable()
humidity.set_writable()
safety_lock.set_writable()

server.start()
print("OPC-UA Server rodando em opc.tcp://localhost:4840")

try:
    while True:
        running_value = random.random() > 0.15
        temperature_value = round(24 + random.uniform(-3, 7), 2)
        pressure_value = round(1.2 + random.uniform(-0.25, 0.45), 2)
        humidity_value = round(55 + random.uniform(-12, 12), 2)
        safety_lock_value = running_value and temperature_value < 29 and pressure_value < 1.55

        temperature.set_value(temperature_value)
        pressure.set_value(pressure_value)
        running.set_value(running_value)
        humidity.set_value(humidity_value)
        safety_lock.set_value(safety_lock_value)

        output = {
            "Temperatura": temperature.get_value(),
            "Pressao": pressure.get_value(),
            "Status": running.get_value(),
            "Umidade": humidity.get_value(),
            "TravaSeguranca": safety_lock.get_value(),
        }

        print(output)
        time.sleep(2)

finally:
    server.stop()
