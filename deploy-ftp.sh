#!/bin/bash

# FTP Deployment Script for ansitzplaner.de (serverprofis.de hosting)
# Passwort wird interaktiv abgefragt – keine Credentials im Repository!
#
# Voraussetzung: lftp installieren
#   Ubuntu/Debian: sudo apt-get install lftp
#   macOS:         brew install lftp
#
# FTP-Zugangsdaten aus dem Hosting-Panel bei serverprofis.de entnehmen
# und die Variablen FTP_SERVER, FTP_USER, REMOTE_DIR unten anpassen.

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# FTP Configuration – bitte anpassen!
FTP_SERVER="ftp.schuele-embedded.de"
FTP_USER="florian@schuele-embedded.de"
FTP_PORT="21"
REMOTE_DIR="/ansitzplaner.de"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AnsitzPlaner FTP Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${RED}Error: lftp ist nicht installiert.${NC}"
    echo "Bitte zuerst installieren:"
    echo "  Ubuntu/Debian: sudo apt-get install lftp"
    echo "  macOS: brew install lftp"
    exit 1
fi

# Step 1: Clean old build
echo -e "${BLUE}[1/4] Alten Build löschen...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}✓ Alter Build gelöscht${NC}"
else
    echo -e "${GREEN}✓ Kein alter Build vorhanden${NC}"
fi
echo ""

# Step 2: Build the application
echo -e "${BLUE}[2/4] App bauen...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build erfolgreich${NC}"
else
    echo -e "${RED}✗ Build fehlgeschlagen${NC}"
    exit 1
fi
echo ""

# Step 3: Check dist directory
if [ ! -d "dist" ]; then
    echo -e "${RED}Fehler: dist/ Verzeichnis nicht gefunden nach Build${NC}"
    exit 1
fi

# Step 4: Upload to FTP
echo -e "${BLUE}[3/4] Upload zum FTP-Server...${NC}"
echo "Server: $FTP_SERVER"
echo "Zielverzeichnis: $REMOTE_DIR"
echo ""

# FTP-Passwort interaktiv eingeben (wird nicht gespeichert)
echo -n "FTP-Passwort für $FTP_USER eingeben: "
read -s FTP_PASSWORD
echo ""
echo ""

# Upload mit lftp (mirror --reverse --delete synchronisiert dist/ → Remote)
lftp -e "
set ftp:ssl-allow no;
set ftp:passive-mode on;
open -u $FTP_USER,$FTP_PASSWORD -p $FTP_PORT $FTP_SERVER;
cd $REMOTE_DIR || mkdir -p $REMOTE_DIR;
mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .DS_Store dist/ ./;
bye
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Upload erfolgreich${NC}"
else
    echo ""
    echo -e "${RED}✗ Upload fehlgeschlagen${NC}"
    exit 1
fi
echo ""

# Step 5: Done
echo -e "${BLUE}[4/4] Deployment abgeschlossen!${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment erfolgreich! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Die App ist jetzt live unter:"
echo -e "${BLUE}https://www.ansitzplaner.de${NC}"
