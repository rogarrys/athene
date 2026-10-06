# Athène — Athènes en 3D

Site web statique présentant une **reconstitution 3D interactive de l'Athènes antique** :
Acropole, Parthénon, Érechthéion, Propylées, théâtre de Dionysos, la Plaka et l'Agora.

## 🚀 Voir le site en ligne

Active **GitHub Pages** (Settings → Pages → Deploy from branch `main`, dossier `/root`),
puis le site sera disponible sur :

**https://rogarrys.github.io/athene/athenes-3d/**

## 💻 En local

```bash
cd athenes-3d
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

> ⚠️ Ne pas ouvrir `index.html` directement en `file://` : les modules ES
> nécessitent un serveur HTTP.

## 🛠️ Contenu

| Fichier | Rôle |
|---|---|
| `athenes-3d/index.html` | Page du site |
| `athenes-3d/css/style.css` | Feuille de style |
| `athenes-3d/js/scene.js` | Scène 3D procédurale (~1 000 objets) |
| `athenes-3d/js/three.module.js` | Three.js r160 (embarqué, site 100 % autonome) |

## ✨ Fonctionnalités

- Scène 3D entièrement générée procéduralement (aucun asset externe)
- Contrôles souris + tactile : orbite, zoom, rotation auto
- 6 repères interactifs (Parthénon, Érechthéion, Propylées, théâtre, Plaka, Agora)
- Mode « coucher de soleil » avec transition de lumière
- Ombres temps réel, ciel shader, brouillard atmosphérique
