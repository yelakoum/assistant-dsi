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
