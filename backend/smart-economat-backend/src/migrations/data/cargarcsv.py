import csv
import json
import unicodedata
import re

def normalizar_nombre(nombre):
    nombre = nombre.lower()
    nombre = unicodedata.normalize('NFKD', nombre).encode('ASCII', 'ignore').decode('utf-8')
    nombre = re.sub(r'\s+', ' ', nombre).strip()
    nombre = re.sub(r'\bcong\.?\b', 'congelado', nombre)
    return nombre

def normalizar_unidad(unidad):
    unidad = unidad.lower().strip().replace('.', '')
    equivalencias = {
        'kg': 'kg', 'kilo': 'kg', 'kilogramo': 'kg',
        'l': 'l', 'lt': 'l', 'lts': 'l', 'litro': 'l',
        'u': 'u', 'unidad': 'u', 'unid': 'u'
    }
    return equivalencias.get(unidad, unidad)

def formatear_precio(precio):
    precio = precio.strip()
    if ',' in precio:
        precio = re.sub(r'[^\d,]', '', precio)
        partes = precio.split(',')
        if len(partes) == 2:
            return f"{partes[0]},{partes[1].ljust(2, '0')[:2]}"
    if '.' in precio:
        partes = precio.split('.')
        if len(partes) == 2:
            return f"{partes[0]},{partes[1].ljust(2, '0')[:2]}"
    return "0,00"

productos = []
with open('lista.csv', newline='', encoding='latin1') as archivo:
    lector = csv.reader(archivo, delimiter=';')
    next(lector)
    for fila in lector:
        if len(fila) < 3:
            continue
        nombre = normalizar_nombre(fila[0])
        unidad = normalizar_unidad(fila[1])
        precio = formatear_precio(fila[2])
        productos.append({
            "nombre": nombre,
            "unidad": unidad,
            "precio_unidad": precio
        })
with open('productos_normalizados.json', 'w', encoding='utf-8') as salida:
    json.dump(productos, salida, ensure_ascii=False, indent=2)

articulos = []
with open('inventario-articulos.csv', newline='', encoding='latin1') as archivo:
    lector = csv.reader(archivo, delimiter=';')
    next(lector)
    for fila in lector:
        if len(fila) < 3:
            continue
        nombre = normalizar_nombre(fila[0])
        unidad = normalizar_unidad(fila[1])
        precio = formatear_precio(fila[2])
        articulos.append({
            "nombre": nombre,
            "unidad": unidad,
            "precio_unidad": precio
        })



with open('articulos_normalizados.json', 'w', encoding='utf-8') as salida:
    json.dump(articulos, salida, ensure_ascii=False, indent=2)