#!/bin/bash
# Moverse al directorio del script
cd "$(dirname "$0")"

clear
echo "============================================="
echo "        TORRENT WEB SEARCH INICIADOR         "
echo "============================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js no está instalado en tu sistema."
    echo "Por favor descarga e instala Node.js desde https://nodejs.org"
    echo "Presiona Enter para cerrar..."
    read
    exit 1
fi

# Verificar si node_modules existe, si no, instalar dependencias
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias necesarias (Express)..."
    npm install --no-audit --no-fund
    if [ $? -ne 0 ]; then
        echo "Error al instalar las dependencias."
        echo "Presiona Enter para cerrar..."
        read
        exit 1
    fi
    echo "¡Dependencias instaladas con éxito!"
    echo ""
fi

echo "Iniciando servidor web..."
node server.js
