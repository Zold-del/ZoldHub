@echo off
echo Démarrage du déploiement de l'API sur GitHub...

echo Vérification des changements Git...
cd ..\..\
git add api
git status

echo.
echo Pour déployer, exécutez les commandes suivantes:
echo git commit -m "Update API"
echo git push origin main
echo.
echo Note: Assurez-vous que MONGODB_URI et JWT_SECRET sont configurés dans les secrets GitHub!