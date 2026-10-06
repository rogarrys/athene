# Comment pousser ce dépôt sur GitHub (rogarrys/athene)

Le commit est prêt localement. Le push automatique est bloqué par les
restrictions de cette session, voici la procédure manuelle (2 minutes) :

## Méthode 1 — Ligne de commande (recommandée)

```bash
# 1. Cloner ton dépôt (vide pour l'instant)
git clone https://github.com/rogarrys/athene.git
cd athene

# 2. Récupérer le commit préparé (bundle fourni avec ce ZIP)
git fetch /chemin/vers/athene.bundle main
# ou si tu as le dossier complet :
#   git pull /chemin/vers/github__rogarrys__athene main

# 3. Pousser
 git push -u origin main
```

## Méthode 2 — Depuis le dossier préparé (github__rogarrys__athene/)

```bash
cd github__rogarrys__athene
git remote add origin https://github.com/rogarrys/athene.git
git push -u origin main
```

> Le commit `8a778c7` contient tout le site : README, .gitignore et le
> dossier `athenes-3d/` complet.

## Une fois poussé : activer GitHub Pages

1. Va sur https://github.com/rogarrys/athene/settings/pages
2. **Source** → Deploy from a branch → `main` → `/ (root)`
3. Enregistre — le site sera en ligne sur :

   **https://rogarrys.github.io/athene/athenes-3d/**

## Vérification

```bash
gh repo view rogarrys/athene
# ou ouvre : https://github.com/rogarrys/athene
```
