@echo off
echo ===== REDÉMARRAGE DE L'API ZOLDSTUDIO =====
echo.
echo [1/3] Arrêt de tous les processus Node.js en cours...
taskkill /F /IM node.exe /T 2>nul
echo.
echo [2/3] Démarrage de l'API...
cd ..
set PORT=5000
echo L'API va démarrer sur le port 5000
echo.
echo [3/3] Lancement du serveur...
npm start
echo.
pause