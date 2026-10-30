from sentence_transformers import SentenceTransformer

model = SentenceTransformer("intfloat/multilingual-e5-small")

question = "query: mon compte est bloqué, je n'arrive plus à me connecter"
passages = [
    "passage: Mot de passe oublié ou compte bloqué > Réinitialiser son mot de passe soi-même",
    "passage: Accès au Wi-Fi de l'école (eduroam) > Se connecter au Wi-Fi eduroam",
    "passage: Imprimer et scanner > Quotas d'impression",
]

vecteur_question = model.encode(question, normalize_embeddings=True)
vecteurs_passages = model.encode(passages, normalize_embeddings=True)

print("Taille d'un vecteur :", vecteur_question.shape)
print("Les 5 premiers nombres :", vecteur_question[:5])

scores = model.similarity(vecteur_question, vecteurs_passages)
for passage, score in zip(passages, scores[0]):
    print(f"{score:.3f}  {passage}")
