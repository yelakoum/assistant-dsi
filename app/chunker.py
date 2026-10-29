from pathlib import Path

def parse_titre(ligne: str) -> tuple[int, str] | None:
    """Si la ligne est un titre Markdown, renvoie (niveau, texte du titre).
    Sinon, renvoie None.

    Exemple : "## Se connecter" → (2, "Se connecter")
    """
    ligne_sans_diese_au_debut = ligne.lstrip('#')
    nb = len(ligne) - len(ligne_sans_diese_au_debut)
    
    if nb == 0:
        return None 
        
    if len(ligne) == nb or ligne[nb] != ' ':
        return None
        
    texte = ligne[nb:].strip()
    return nb, texte

def mettre_a_jour_pile(pile: list[str], niveau: int, titre: str) -> list[str]:
    """Applique la règle des assiettes et renvoie la nouvelle pile."""
    return pile[:niveau - 1] + [titre]

def decouper_markdown(texte: str, source: str) -> list[dict]:
    """Découpe un document Markdown en chunks, chacun avec son fil d'Ariane."""
    pile = []
    chunks = [{"fil_ariane": source, "lignes": []}]

    for ligne in texte.splitlines():
        resultat = parse_titre(ligne)
        if resultat is not None:
            niveau, titre = resultat
            pile = mettre_a_jour_pile(pile, niveau, titre)
            chunks.append({"fil_ariane": " > ".join(pile), "lignes": []})            
        else:
            # CORRECTION 1 : "chunks" avec un "s"
            chunks[-1]["lignes"].append(ligne)

    # CORRECTION 2 : initialisation de la liste finale
    list_final = []
    
    for chunk in chunks:
        corps = "\n".join(chunk["lignes"]).strip()
        if not corps:
            continue
        list_final.append({
            "source": source,
            "fil_ariane": chunk["fil_ariane"],
            "texte": chunk["fil_ariane"] + "\n" + corps,
        })
    return list_final


# CORRECTION 3 : indentation du main et retrait des numéros parasites
if __name__ == "__main__":
    assert parse_titre("# Moodle") == (1, "Moodle")
    assert parse_titre("## Se connecter à Moodle") == (2, "Se connecter à Moodle")
    assert parse_titre("### Inscrire les étudiants") == (3, "Inscrire les étudiants")
    assert parse_titre("- Ouvrez un ticket") is None
    assert parse_titre("#hashtag") is None
    assert parse_titre("") is None
    print("Tests parse_titre passent ✅")

    DOC = ("# VPN\n## Installer\nOuvrez vpn.ecole.example\n"
           "2. Téléchargez le client\n## Se connecter\n"
           "Lancez le client et saisissez votre code.")
    
    chunks = decouper_markdown(DOC, "vpn.md")
    assert len(chunks) == 2
    assert chunks[0]["fil_ariane"] == "VPN > Installer"
    assert chunks[0]["texte"] == "VPN > Installer\nOuvrez vpn.ecole.example\n2. Téléchargez le client"
    assert chunks[1]["texte"].endswith("Lancez le client et saisissez votre code.")
    assert decouper_markdown("Intro\n# VPN\n## A\ntexte", "x.md")[0]["fil_ariane"] == "x.md"
    assert decouper_markdown("# VPN\n## A\n\n\n## B\ntexte", "x.md")[0]["fil_ariane"] == "VPN > B"
    
    DOC_md = Path('../data/docs/moodle.md').read_text(encoding="utf-8")
    decouper = decouper_markdown(DOC_md,'moodle.md')
    tous_les_chunks = []
    for fichier in sorted(Path("../data/docs").glob("*.md")):
        texte = fichier.read_text(encoding="utf-8")
        chunks_du_fichier = decouper_markdown(texte, fichier.name)
        print(f"{fichier.name:25} → {len(chunks_du_fichier)} chunks")
        tous_les_chunks.extend(chunks_du_fichier)

    print(f"TOTAL : {len(tous_les_chunks)} chunks")
    
    print("Tests decouper_markdown passent ✅")
