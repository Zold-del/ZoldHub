@echo off
echo Démarrage du déploiement de l'API sur GitHub...

echo Vérification des changements Git...
cd ..\..\
git add api
git status

echo.
echo Préparation du commit et du push...
set /p commit_message=Entrez un message de commit (ou appuyez sur Entrée pour "Update API"): 
if "%commit_message%"=="" set commit_message=Update API

git commit -m "%commit_message%"
git push origin main

echo.
echo Déploiement initié! Les actions GitHub vont maintenant construire et publier votre image Docker.
echo Vous pouvez suivre la progression sur la page Actions de votre dépôt GitHub.
echo.
echo Note: Assurez-vous que MONGODB_URI et JWT_SECRET sont configurés dans les secrets GitHub!
echo.
echo Appuyez sur une touche pour quitter...
pause > nul