# VPN : accéder aux ressources de l'école depuis l'extérieur

> Concerne : enseignants et personnel administratif.
> Dernière mise à jour : septembre 2026.

## Dans quels cas utiliser cette procédure

Utilisez le VPN si, depuis chez vous ou en déplacement, vous voulez :
- accéder aux dossiers partagés de l'école (lecteurs réseau) ;
- utiliser un logiciel dont la licence fonctionne uniquement sur le réseau de l'école ;
- accéder à l'intranet ou aux applications administratives.

Le VPN n'est pas nécessaire pour l'ENT, Moodle et la messagerie : ces services sont accessibles directement depuis Internet. Il est aussi inutile quand vous êtes connecté au Wi-Fi de l'école.

## Activer la double authentification (obligatoire)

Le VPN demande un code à 6 chiffres en plus de votre mot de passe.
1. Installez une application d'authentification sur votre téléphone (par exemple FreeOTP ou une autre application compatible TOTP).
2. Ouvrez https://moncompte.ecole.example, rubrique « Sécurité », puis « Double authentification ».
3. Scannez le QR code affiché avec l'application.
4. Saisissez le code à 6 chiffres affiché par l'application pour valider.

## Installer le client VPN

1. Ouvrez https://vpn.ecole.example et connectez-vous avec votre identifiant ENT.
2. Téléchargez le client VPN pour votre système (Windows, macOS ou Linux), ainsi que votre profil de connexion « ECOLE-VPN ».
3. Installez le client, puis importez le profil.

Sur téléphone (Android ou iPhone), installez l'application OpenVPN Connect et importez le même profil.

## Se connecter

1. Lancez le client VPN et choisissez le profil « ECOLE-VPN ».
2. Saisissez votre identifiant ENT, votre mot de passe, puis le code à 6 chiffres de votre application.
3. Les dossiers partagés sont ensuite accessibles à l'adresse \\fichiers.ecole.example.

La connexion VPN est coupée automatiquement après 8 heures.

## Problèmes fréquents

- « Authentification échouée » : vérifiez votre mot de passe (procédure « Mot de passe oublié ou compte bloqué ») et utilisez un code récent, car chaque code change toutes les 30 secondes.
- Le code est toujours refusé : vérifiez que l'heure de votre téléphone est réglée automatiquement.
- Connecté mais les dossiers partagés ne s'ouvrent pas : vérifiez l'adresse \\fichiers.ecole.example et redémarrez votre ordinateur.
- Vous avez changé de téléphone : la double authentification doit être réinitialisée par la DSI, au bureau, avec une pièce d'identité.

## Règles d'utilisation

- Le VPN est réservé à un usage professionnel.
- Ne partagez jamais votre accès VPN.
- Votre ordinateur doit avoir un système d'exploitation à jour et un antivirus actif.

## Si ça ne fonctionne pas

- Ouvrez un ticket sur https://support.ecole.example (catégorie « VPN ») ou écrivez à dsi@ecole.example.
- Bureau de la DSI : bâtiment A, salle A012, du lundi au vendredi de 8 h 30 à 17 h.
