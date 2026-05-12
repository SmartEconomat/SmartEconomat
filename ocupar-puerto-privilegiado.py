#!/usr/bin/env python3
"""
Mantiene ocupado el puerto TCP 80 o 443 (útil para pruebas o evitar que otro servicio lo use).

En Windows y en la mayoría de sistemas, los puertos < 1024 suelen requerir ejecutar el
intérprete como administrador (o root en Linux/macOS).

Uso:
  python ocupar-puerto-privilegiado.py
  python ocupar-puerto-privilegiado.py --port 80
"""

from __future__ import annotations

import argparse
import socket
import sys


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Abre un socket en escucha en el puerto 80 o 443 hasta Ctrl+C."
    )
    p.add_argument(
        "--port",
        type=int,
        choices=(80, 443),
        default=443,
        help="Puerto a ocupar (por defecto: 443).",
    )
    p.add_argument(
        "--host",
        default="0.0.0.0",
        help="Dirección de enlace (por defecto: 0.0.0.0, todas las interfaces).",
    )
    return p.parse_args()


def main() -> int:
    args = _parse_args()
    port = args.port
    host = args.host

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((host, port))
        sock.listen(8)
    except OSError as e:
        print(
            f"No se pudo enlazar {host}:{port}: {e}\n"
            "En Windows, prueba a ejecutar PowerShell o CMD como administrador.",
            file=sys.stderr,
        )
        return 1

    print(f"Ocupando {host}:{port}. Pulsa Ctrl+C para liberar el puerto.")

    try:
        while True:
            conn, addr = sock.accept()
            try:
                conn.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            finally:
                conn.close()
    except KeyboardInterrupt:
        print("\nCerrando socket…")
        return 0
    finally:
        sock.close()


if __name__ == "__main__":
    raise SystemExit(main())
