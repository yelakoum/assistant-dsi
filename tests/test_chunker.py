from app.chunker import mettre_a_jour_pile, parse_titre


# --- parse_titre -------------------------------------------------------------

def test_parse_titre_niveaux():
    assert parse_titre("# Moodle") == (1, "Moodle")
    assert parse_titre("## Se connecter à Moodle") == (2, "Se connecter à Moodle")
    assert parse_titre("### Inscrire les étudiants") == (3, "Inscrire les étudiants")


def test_parse_titre_espaces_autour_du_texte():
    assert parse_titre("##   Wifi   ") == (2, "Wifi")


def test_parse_titre_pas_un_titre():
    assert parse_titre("- Ouvrez un ticket") is None
    assert parse_titre("#hashtag") is None      # pas d'espace après le "#"
    assert parse_titre("#") is None             # que des "#"
    assert parse_titre("") is None
    assert parse_titre("Texte # avec dièse") is None


# --- mettre_a_jour_pile ------------------------------------------------------

def test_pile_vide():
    assert mettre_a_jour_pile([], 1, "Moodle") == ["Moodle"]


def test_pile_titre_plus_profond():
    assert mettre_a_jour_pile(["Moodle"], 2, "Enseignants") == ["Moodle", "Enseignants"]


def test_pile_titre_meme_niveau():
    assert mettre_a_jour_pile(["Moodle", "Enseignants"], 2, "Étudiants") == ["Moodle", "Étudiants"]


def test_pile_remonte_de_plusieurs_niveaux():
    pile = ["Moodle", "Enseignants", "Créer un devoir"]
    assert mettre_a_jour_pile(pile, 2, "Étudiants") == ["Moodle", "Étudiants"]


def test_pile_ne_modifie_pas_l_original():
    pile = ["Moodle", "Enseignants"]
    mettre_a_jour_pile(pile, 1, "Wifi")
    assert pile == ["Moodle", "Enseignants"]
