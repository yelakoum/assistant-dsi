from fastapi import FastAPI

app = FastAPI(title="Réservation de salles")


@app.get("/health")
def health():
    return {"status": "ok"}
