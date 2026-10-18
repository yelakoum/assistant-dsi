import csv
import sqlite3
import pandas as pd
from pathlib import Path

CSV_PATH = Path("data/tables/salles.csv")
DB_PATH = Path("data/index/ecole.db")   # fichier généré : déjà ignoré par Git


def create_table(conn: sqlite3.Connection) -> None:
    # TODO : CREATE TABLE salles (...) avec une colonne par colonne du CSV.
    # À toi de choisir les types : capacite en INTEGER, et les "oui"/"non"  
    """(Re)crée la table salles, avec une colonne par colonne du CSV."""
    conn.execute("DROP TABLE IF EXISTS salles")
    conn.execute("""
        CREATE TABLE salles (
            salle            TEXT PRIMARY KEY,
            batiment         TEXT NOT NULL,
            capacite         INTEGER NOT NULL,
            videoprojecteur  INTEGER NOT NULL CHECK (videoprojecteur IN (0, 1)),
            cable_hdmi       INTEGER NOT NULL CHECK (cable_hdmi IN (0, 1)),
            adaptateur_usbc  INTEGER NOT NULL CHECK (adaptateur_usbc IN (0, 1)),
            ecran_interactif INTEGER NOT NULL CHECK (ecran_interactif IN (0, 1)),
            partage_sans_fil INTEGER NOT NULL CHECK (partage_sans_fil IN (0, 1)),
            copieur_proche   TEXT
        )
    """)
    conn.commit()
def oui_non(csv_path: Path) -> pd.DataFrame:
    """Lit le CSV et transforme les oui / non en 1 / 0 (sans modifier le fichier)."""
    df = pd.read_csv(csv_path)
    colonnes_oui_non = ["videoprojecteur", "cable_hdmi", "adaptateur_usbc",
                        "ecran_interactif", "partage_sans_fil"]
    for colonne in colonnes_oui_non:
        df[colonne] = df[colonne].map({"oui": 1, "non": 0})
    return df
    
    

def load_rows(conn: sqlite3.Connection, csv_path: Path) -> int:
    # TODO : lire le CSV (csv.DictReader), insérer chaque ligne avec des
    # paramètres "?" (jamais de f-string dans une requête SQL),
    # puis retourner le nombre de lignes insérées.
    """Insère les salles du CSV dans la table et renvoie le nombre de lignes"""
    df = oui_non(csv_path)                                    # 1. le tableau traduit
    lignes = list(df.itertuples(index=False, name=None))      # 2. liste de tuples
    conn.executemany(
        "INSERT INTO salles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", lignes
    )                                                         # 3. on range tout
    conn.commit()                                             #    on valide
    return len(lignes)  
    

	
    	 	


def main() -> None:
    # TODO : supprimer la base si elle existe déjà, la recréer,
    # créer la table, charger les lignes, commit, afficher le nombre de salles.
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)   # crée data/index/ s'il n'existe pas
    conn = sqlite3.connect(DB_PATH)                     # ouvre (ou crée) la base
    create_table(conn)                                  # efface et recrée la table
    n = load_rows(conn, CSV_PATH)                       # remplit la table
    print(f"{n} salles chargées")
    conn.close()                                        # ferme la base


if __name__ == "__main__":
    main()
