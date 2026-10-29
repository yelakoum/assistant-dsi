import sqlite3
from pathlib import Path

import pytest

from scripts.table_sql import create_table, load_rows, oui_non

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "tables" / "salles.csv"


@pytest.fixture
def conn():
    """Base SQLite en mémoire, remplie avec le CSV des salles."""
    conn = sqlite3.connect(":memory:")
    create_table(conn)
    load_rows(conn, CSV_PATH)
    yield conn
    conn.close()


def test_oui_non_convertit_en_0_1():
    df = oui_non(CSV_PATH)
    for colonne in ["videoprojecteur", "cable_hdmi", "adaptateur_usbc",
                    "ecran_interactif", "partage_sans_fil"]:
        assert set(df[colonne].unique()) <= {0, 1}


def test_load_rows_renvoie_le_nombre_de_salles():
    conn = sqlite3.connect(":memory:")
    create_table(conn)
    assert load_rows(conn, CSV_PATH) == 20
    assert conn.execute("SELECT COUNT(*) FROM salles").fetchone()[0] == 20
    conn.close()


def test_create_table_efface_les_anciennes_donnees(conn):
    create_table(conn)
    assert conn.execute("SELECT COUNT(*) FROM salles").fetchone()[0] == 0


# Requêtes de scripts/requetes_reference.sql

def test_q1_cable_hdmi_b204(conn):
    assert conn.execute(
        "SELECT cable_hdmi FROM salles WHERE salle = 'B204'"
    ).fetchone()[0] == 1


def test_q2_salles_ecran_interactif(conn):
    assert conn.execute(
        "SELECT COUNT(*) FROM salles WHERE ecran_interactif = 1"
    ).fetchone()[0] == 4


def test_q3_batiment_b_adaptateur_usbc(conn):
    salles = conn.execute(
        "SELECT salle FROM salles WHERE batiment = 'B' AND adaptateur_usbc = 1 ORDER BY salle"
    ).fetchall()
    assert [s for (s,) in salles] == ["B201", "B202", "B301"]
