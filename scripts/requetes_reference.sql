-- Q1 : Y a-t-il un câble HDMI en B204 ?            → 1
SELECT cable_hdmi FROM salles WHERE salle = 'B204';

-- Q2 : Combien de salles ont un écran interactif ?  → 4
SELECT COUNT(*) FROM salles WHERE ecran_interactif = 1;

-- Q3 : Quelles salles du bâtiment B ont un adaptateur USB-C ?  → B201, B202, B301
SELECT salle FROM salles WHERE batiment = 'B' AND adaptateur_usbc = 1;
