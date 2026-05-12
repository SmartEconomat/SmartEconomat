import serial
import time
import random
import argparse

def list_available_ports():
    import serial.tools.list_ports
    ports = serial.tools.list_ports.comports()
    if not ports:
        print("[!] No se detectaron puertos serie físicos o virtuales.")
        return
    print("[*] Puertos detectados:")
    for p in ports:
        print(f"    - {p.device} ({p.description})")

def simulate_scale(port: str, baudrate: int, min_weight: float, max_weight: float):
    """
    Simula una bascula realista que sube de peso, se estabiliza y luego vuelve a cero.
    """
    STX = '\x02'
    ETX = '\x03'

    list_available_ports()

    try:
        ser = serial.Serial(port, baudrate, timeout=1)
        print(f"\n[OK] Conectado a {port} a {baudrate} baudios.")
        print(f"[*] El simulador está escribiendo en {port}.")
        print(f"[*] IMPORTANTE: Tu aplicación debe conectarse al PUERTO ENLAZADO.")
        print(f"    Ejemplo: Si el simulador usa COM4, la App usa COM5.")
        print(f"[*] Simulando sesion de pesaje realista...")
        print("Presiona Ctrl+C para detener.")

        while True:
            # 1. Sin carga (0.00 kg)
            print("\n[WAIT] Esperando objeto (0.00 kg)...")
            for _ in range(3):
                weight_str = f"{STX}0.00{ETX}"
                ser.write(weight_str.encode('ascii'))
                time.sleep(1)

            # 2. Subiendo peso (simulando colocacion)
            target = round(random.uniform(min_weight, max_weight), 2)
            print(f"[LOAD] Colocando objeto (objetivo: {target} kg)...")
            current = 0.0
            while current < target:
                increment = random.uniform(0.1, 0.5)
                current = min(target, current + increment)
                weight_str = f"{STX}{current:0.2f}{ETX}"
                ser.write(weight_str.encode('ascii'))
                print(f"   Enviando: {current:0.2f} kg", end='\r')
                time.sleep(0.2)
            print()

            # 3. Peso estable
            print(f"[STABLE] Peso ESTABLE: {target} kg (manteniendo 5s)")
            for _ in range(25): 
                weight_str = f"{STX}{target:0.2f}{ETX}"
                ser.write(weight_str.encode('ascii'))
                time.sleep(0.2)

            # 4. Quitando peso
            print("[UNLOAD] Retirando objeto...")
            while current > 0:
                decrement = random.uniform(0.5, 1.0)
                current = max(0.0, current - decrement)
                weight_str = f"{STX}{current:0.2f}{ETX}"
                ser.write(weight_str.encode('ascii'))
                print(f"   Enviando: {current:0.2f} kg", end='\r')
                time.sleep(0.1)
            print("\n[DONE] Ciclo completado.")
            time.sleep(2)

    except serial.SerialException as e:
        print(f"\n[ERROR] No se pudo abrir el puerto {port}: {e}")
        print(f"\n💡 EXPLICACIÓN PARA WINDOWS:")
        print(f"Para que el simulador funcione con la App, necesitas un par de puertos cruzados.")
        print(f"Si usas un emulador (como com0com), crea un par (ej. COM4 <-> COM5).")
        print(f"1. Ejecuta este script en COM4.")
        print(f"2. En la aplicación SmartEconomat, vincula el COM5.")
        print(f"¡Nunca intentes conectar ambos al mismo puerto ({port})!")
    except KeyboardInterrupt:
        print("\n[STOP] Simulacion detenida.")
    finally:
        if 'ser' in locals() and ser.is_open:
            ser.close()
            print("[CLOSE] Puerto serial cerrado.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Simulador de Bascula Realista')
    parser.add_argument("-p", "--port", default="COM4", help="Puerto serial (ej. COM4)")
    parser.add_argument('-b', '--baudrate', type=int, default=9600, help='Baudrate')
    parser.add_argument('--min', type=float, default=1.0, help='Peso min')
    parser.add_argument('--max', type=float, default=15.0, help='Peso max')
    
    args = parser.parse_args()
    simulate_scale(args.port, args.baudrate, args.min, args.max)
