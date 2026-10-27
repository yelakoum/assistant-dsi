def parse_titre(ligne: str) -> tuple[int, str] | None:
    """Si la ligne est un titre Markdown, renvoie (niveau, texte du titre).
    Sinon, renvoie None.

    Exemple : "## Se connecter" → (2, "Se connecter")
    """
    # TODO 1 : compter combien de "#" il y a au début de la ligne
    # On enlève les '#' du début et on compare la longueur
    ligne_sans_diese_au_debut = ligne.lstrip('#')
    nb = len(ligne) - len(ligne_sans_diese_au_debut)
    
    # TODO 2 : si 0 "#", ce n'est pas un titre → return None
    if nb == 0:
        return None 
        
    # TODO 3 : vérifier que le caractère juste après les "#" est un espace
    # On vérifie d'abord que la chaîne est assez longue pour éviter un IndexError
    if len(ligne) == nb or ligne[nb] != ' ':
        return None
        
    # TODO 4 : récupérer le texte du titre (après les "#" et l'espace),
    #          sans espaces inutiles autour
    texte = ligne[nb:].strip()
    
    # TODO 5 : renvoyer (niveau, texte)
    return nb, texte

def mettre_a_jour_pile(pile: list[str], niveau: int, titre: str) -> list[str]:
    """Applique la règle des assiettes et renvoie la nouvelle pile.

    Exemple : (["Moodle", "Enseignants", "Créer un devoir"], 2, "Étudiants")
              → ["Moodle", "Étudiants"]
    """
    # TODO : une seule ligne suffit (slicing + ajout du titre)
    return pile[:niveau - 1] + [titre]


    if __name__ == "__main__":
        assert parse_titre("# Moodle") == (1, "Moodle")
        assert parse_titre("## Se connecter à Moodle") == (2, "Se connecter à Moodle")
        assert parse_titre("### Inscrire les étudiants") == (3, "Inscrire les étudiants")
        assert parse_titre("- Ouvrez un ticket") is None
        assert parse_titre("#hashtag") is None
        assert parse_titre("") is None
        print("Tous les tests passent ✅")
