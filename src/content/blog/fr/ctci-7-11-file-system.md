---
title: "Système de Fichiers: Architecture Hiérarchique en Mémoire (CTCI 7.11)"
description: "Concevez les structures de données et algorithmes pour un système de fichiers en mémoire via le patron Composite en temps O(D)."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Expliquez les structures de données et algorithmes pour concevoir un système de fichiers en mémoire. Illustrez avec du code.
> * **La Solution Optimale:** **Patron de Conception Composite** : (1) Classe abstraite `Entry` contenant le nom, la référence au répertoire parent, les métadonnées temporelles et les méthodes abstraites `size()` et `getFullPath()` ; (2) Sous-classe `File` stockant le contenu brut `byte[] content` ; (3) Sous-classe `Directory` gérant `List<Entry> contents` avec calcul récursif de taille ; (4) Résolution des chemins en temps $O(D)$ où $D$ est la profondeur arborescente.
> * **Réalité en Production:** Systèmes de fichiers virtuels Linux (`tmpfs` / `procfs`) et émulation de répertoires sur stockage objet (Amazon S3).

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 7.11), l'énoncé est :

*"Expliquez les structures de donnees et la conception objet pour un systeme de fichiers hierarchique en memoire."*

## 2. Architecture Orientée Objet (Patron Composite)

1. **`Entry` (Classe Abstraite) :** Attributs communs à tous les nœuds de l'arborescence (nom, parent, dates de création et modification).
2. **`File` (Hérite d'`Entry`) :** Nœud feuille encapsulant un tableau d'octets (`byte[]`).
3. **`Directory` (Hérite d'`Entry`) :** Nœud composite contenant une collection d'entrées filles (`List<Entry>`).

## Implémentation de Production

```java
import java.util.ArrayList;
import java.util.List;

public class FileSystemDesign {
    public static abstract class Entry {
        protected Directory parent;
        protected long created;
        protected long lastUpdated;
        protected String name;

        public Entry(String n, Directory p) {
            this.name = n;
            this.parent = p;
            this.created = System.currentTimeMillis();
            this.lastUpdated = System.currentTimeMillis();
        }

        public boolean delete() {
            if (parent == null) return false;
            return parent.deleteEntry(this);
        }

        public abstract int size();

        public String getFullPath() {
            if (parent == null) return name;
            return parent.getFullPath() + "/" + name;
        }

        public String getName() { return name; }
    }

    public static class File extends Entry {
        private byte[] content;
        private int size;

        public File(String n, Directory p, int sz) {
            super(n, p);
            this.size = sz;
        }

        public int size() { return size; }
        public byte[] getContent() { return content; }
        public void setContent(byte[] c) {
            this.content = c;
            this.size = c == null ? 0 : c.length;
        }
    }

    public static class Directory extends Entry {
        protected List<Entry> contents = new ArrayList<>();

        public Directory(String n, Directory p) {
            super(n, p);
        }

        public int size() {
            int size = 0;
            for (Entry e : contents) {
                size += e.size();
            }
            return size;
        }

        public boolean deleteEntry(Entry entry) {
            return contents.remove(entry);
        }

        public void addEntry(Entry entry) {
            contents.add(entry);
        }

        public List<Entry> getContents() { return contents; }
    }
}
```

## Analyse de Complexité et Mémoire

| Métrique | Complexité | Détail Technique |
|---|---|---|
| getFullPath() | `O(D)` | Remonte la chaîne des parents jusqu'à la racine sur $D$ niveaux. |
| Directory size() | `O(N)` | Calcul récursif sur l'ensemble du sous-arbre. |
| Espace Auxiliaire | `O(N)` | Mémoire tas proportionnelle au nombre de fichiers et répertoires. |

## Ingénierie des Systèmes en Production

### Architecture Système : Systèmes de Fichiers Virtuels (VFS)

1. **Linux `tmpfs` & `procfs` :** Systèmes de fichiers éphémères exposant l'état du noyau et des processus sans persistance disque.
2. **Préfixes d'Objets S3 :** Émulation de dossiers imbriqués sur un magasin clé-valeur plat.

## Cas Limites et Robustesse

1. **Suppression de la Racine :** Protégée par vérification `parent == null`.
