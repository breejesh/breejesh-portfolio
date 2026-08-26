---
title: "File System: arbre en mémoire avec Entry, File et Directory (Java)"
description: "Problème style CTCI 7.11 pour débutants: concevoir un système de fichiers en mémoire. Base Entry partagée, feuilles File, nœuds Directory, taille récursive et chemins en Java."
date: "2025-11-09"
tags: [Algorithmes et Structures, Outils Développeur et Régulation, Design Système et Architecture]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---


> **TL;DR**
> * **Le Problème:** Optimisation de la complexité temporelle et spatiale des structures de données.
> * **L'Approche:** Problème style CTCI 7.11 pour débutants: concevoir un système de fichiers en mémoire. Base Entry partagée, feuilles File, nœuds Directory, taille récursive et chemins en Java.
> * **Complexité:** Compromis optimal entre temps et mémoire avec gestion des cas limites.

En entretien on te dit: conçois un **système de fichiers en mémoire**. Pas de pilotes disque. Pas d'allocation de blocs. Juste les objets et algorithmes pour dossiers et fichiers en RAM, avec un petit croquis de code.

C'est de la conception orientée objet, pas un tutoriel noyau. La forme classique est un **arbre**: base partagée `Entry`, feuilles `File`, nœuds `Directory` qui contiennent d'autres entrées. Ce billet est un enseignement original pour débutants en **Java**. Même famille de questions OOD d'entretien, pas une copie de livre. Partie de la [série CTCI en Java](/blog/fr/ctci-series-guide). Chapitre 7, conception orientée objet.

---

## 1. Analogie du quotidien

Pense à un classeur physique.

* Un **dossier** peut contenir des papiers et d'autres dossiers.
* Un **papier** contient du texte. Il ne contient pas d'autres dossiers.
* Chaque élément a un **nom**, vit dans un dossier parent (sauf le tiroir racine), et a été créé ou touché à un moment.
* La **taille** d'un papier est la longueur du texte. La taille d'un dossier est la somme de tout ce qu'il contient, dossiers imbriqués inclus.

Ce classeur est un arbre. La racine est le tiroir du haut. Des chemins comme `docs/notes/todo.txt` sont des marches vers des enfants nommés. Supprimer un papier, c'est demander à son parent de le retirer. Renommer, c'est changer le champ nom (et peut-être re-indexer une map d'enfants).

Tu ne conçois pas des disques durs. Tu modèles ce classeur avec des classes.

---

## 2. Énoncé en mots simples

**But:** expliquer les structures de données et les algorithmes d'un **système de fichiers en mémoire** simple, et illustrer avec du code quand c'est utile.

**Concepts centraux:**

* **File:** blob nommé de contenu (pour le croquis, un `String` suffit) plus une taille.
* **Directory:** conteneur nommé d'entrées enfants (fichiers et sous-répertoires).
* **Métadonnées partagées:** nom, parent, dates de création / dernière mise à jour / dernier accès.
* **Opérations attendues:** créer, supprimer, renommer, chemin complet, calculer la taille, lister les enfants, parfois compter les fichiers.

**À clarifier en entretien:**

* En mémoire seulement? Oui pour ce problème. La persistance est hors scope sauf demande.
* Liens symboliques / durs, permissions, utilisateurs? Bons suivis. Commence sans.
* Sensibilité à la casse, caractères invalides, longueur max de chemin? Mentionne et choisis des règles simples.
* Noms uniques par répertoire? Oui: deux enfants du même parent ne partagent pas un nom.
* La racine n'a pas de parent. Supprimer la racine est interdit ou un cas spécial.

**Forme de la hiérarchie de types:**

```
Entry (abstract)
  ├── File
  └── Directory  (holds List or Map of Entry)
```

`size()` est abstrait sur `Entry`. Les fichiers renvoient leur propre taille. Les répertoires somment les enfants.

---

## 3. Réfléchir d'abord

### Pourquoi une base partagée

Fichiers et répertoires ont nom, parent et horodatages. Les deux ont besoin de delete et de chemin complet. Dupliquer ces champs sur deux classes sans lien, c'est du bruit. Mets l'état et le comportement partagés sur `Entry`. Rends `size()` abstrait pour que chaque type réponde différemment.

La composition seule (un nœud avec un flag de type) marche aussi. L'héritage est la version d'enseignement habituelle parce que `instanceof` et le polymorphisme apparaissent en parcourant les enfants.

### Liens de l'arbre

* **Pointeur parent** sur chaque entrée (null pour la racine): facilite `getFullPath()` et `delete()`.
* **Collection d'enfants** seulement sur `Directory`.
* Utilise `ArrayList<Entry>` si tu tiens à l'ordre d'insertion et au code simple.
* Utilise `HashMap<String, Entry>` par nom pour une recherche O(1) (mieux pour résoudre un chemin).

Un bon défaut d'entretien: `Map<String, Entry>` pour les enfants, plus une note que tu peux garder une liste si tu as besoin d'un ordre stable particulier.

### Résolution de chemin

Découpe le chemin sur `/`. Pars de la racine (ou du répertoire courant). Pour chaque segment, cherche l'enfant. Échoue si un segment manque ou si tu entres dans un fichier comme s'il était un répertoire.

Chemin absolu: depuis la racine. Relatif: depuis un répertoire donné. Les deux vont si tu le dis.

### Taille et nombre de fichiers

`size()` du répertoire parcourt le sous-arbre et somme. C'est O(sous-arbre) sauf si tu **caches** les tailles et mets à jour à la mutation (suivi d'optimisation).

`numberOfFiles()` peut compter seulement les fichiers, ou fichiers plus répertoires. Dis lequel. Un parcours récursif suffit pour le croquis.

### Alternative: deux listes dans Directory

Tu peux garder `List<File>` et `List<Directory>` à part. Compter est plus propre (pas d'`instanceof`), mais un tri mixte par nom ou date devient gênant. Une liste d'`Entry` est plus simple pour "lister tout".

### Ce que tu ne construis pas

Cartes de blocs, tables d'inodes, journalisation, verrous de concurrence entre montages. S'ils veulent de la profondeur OS, demande quelle couche. Pour 7.11, le modèle objet de l'arbre gagne.

### Croquis au tableau

1. Dessine `Entry` avec `name`, `parent`, temps, `size()` abstrait, `delete()`, `getFullPath()`.
2. Dessine `File` avec `content` et taille fixe ou stockée.
3. Dessine `Directory` avec map d'enfants, `addEntry`, `deleteEntry`, `size` récursif.
4. Parcours un arbre d'exemple: `/home/notes.txt` et montre chemin et calcul de taille.

---

## 4. Solution Java

Version d'enseignement propre. Les enfants vivent dans un `LinkedHashMap` pour une recherche rapide et un ordre d'insertion stable.

```java
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Shared node in the in-memory file system tree. */
abstract class Entry {
    protected Directory parent;
    protected String name;
    protected final long created;
    protected long lastUpdated;
    protected long lastAccessed;

    Entry(String name, Directory parent) {
        this.name = name;
        this.parent = parent;
        long now = System.currentTimeMillis();
        this.created = now;
        this.lastUpdated = now;
        this.lastAccessed = now;
    }

    abstract int size();

    /** Ask the parent to drop this entry. Root cannot delete itself this way. */
    boolean delete() {
        if (parent == null) {
            return false;
        }
        return parent.deleteEntry(this);
    }

    String getFullPath() {
        if (parent == null) {
            return name == null ? "" : name;
        }
        String parentPath = parent.getFullPath();
        if (parentPath.isEmpty() || parentPath.equals("/")) {
            return "/" + name;
        }
        return parentPath + "/" + name;
    }

    void changeName(String newName) {
        if (parent != null) {
            parent.renameChild(this, newName);
        } else {
            this.name = newName;
            touch();
        }
    }

    String getName() {
        return name;
    }

    Directory getParent() {
        return parent;
    }

    long getCreated() {
        return created;
    }

    long getLastUpdated() {
        return lastUpdated;
    }

    long getLastAccessed() {
        return lastAccessed;
    }

    protected void touch() {
        long now = System.currentTimeMillis();
        lastUpdated = now;
        lastAccessed = now;
    }
}

class File extends Entry {
    private String content;
    private int size;

    File(String name, Directory parent, int size) {
        super(name, parent);
        this.size = Math.max(0, size);
        this.content = "";
    }

    @Override
    int size() {
        return size;
    }

    String getContents() {
        lastAccessed = System.currentTimeMillis();
        return content;
    }

    void setContents(String content) {
        this.content = content == null ? "" : content;
        this.size = this.content.length();
        touch();
    }
}

class Directory extends Entry {
    private final Map<String, Entry> children = new LinkedHashMap<>();

    Directory(String name, Directory parent) {
        super(name, parent);
    }

    @Override
    int size() {
        int total = 0;
        for (Entry e : children.values()) {
            total += e.size();
        }
        return total;
    }

    void addEntry(Entry entry) {
        if (entry == null || entry.getName() == null) {
            throw new IllegalArgumentException("entry and name required");
        }
        if (children.containsKey(entry.getName())) {
            throw new IllegalStateException("name already exists: " + entry.getName());
        }
        children.put(entry.getName(), entry);
        entry.parent = this;
        touch();
    }

    boolean deleteEntry(Entry entry) {
        if (entry == null) {
            return false;
        }
        Entry removed = children.remove(entry.getName());
        if (removed == entry) {
            entry.parent = null;
            touch();
            return true;
        }
        // name collision or already gone: try identity scan
        return false;
    }

    void renameChild(Entry entry, String newName) {
        if (!children.containsKey(entry.getName()) || children.get(entry.getName()) != entry) {
            throw new IllegalStateException("entry is not a child of this directory");
        }
        if (children.containsKey(newName)) {
            throw new IllegalStateException("name already exists: " + newName);
        }
        children.remove(entry.getName());
        entry.name = newName;
        children.put(newName, entry);
        entry.touch();
        touch();
    }

    Entry getChild(String name) {
        return children.get(name);
    }

    Collection<Entry> getContents() {
        return Collections.unmodifiableCollection(children.values());
    }

    /** Count files and directories in this subtree (including nested). */
    int numberOfEntries() {
        int count = 0;
        for (Entry e : children.values()) {
            count++;
            if (e instanceof Directory) {
                count += ((Directory) e).numberOfEntries();
            }
        }
        return count;
    }

    int numberOfFilesOnly() {
        int count = 0;
        for (Entry e : children.values()) {
            if (e instanceof File) {
                count++;
            } else if (e instanceof Directory) {
                count += ((Directory) e).numberOfFilesOnly();
            }
        }
        return count;
    }

    /**
     * Resolve a simple absolute path from this directory if this is root-like,
     * or treat path as relative segments joined by '/'.
     * Empty segments from leading/trailing slashes are skipped.
     */
    Entry resolve(String path) {
        if (path == null || path.isEmpty()) {
            return this;
        }
        Entry current = this;
        String[] parts = path.split("/");
        for (String part : parts) {
            if (part.isEmpty() || part.equals(".")) {
                continue;
            }
            if (part.equals("..")) {
                if (current.parent != null) {
                    current = current.parent;
                }
                continue;
            }
            if (!(current instanceof Directory)) {
                return null;
            }
            current = ((Directory) current).getChild(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}

/** Tiny demo of building a tree and querying it. */
class FileSystemDemo {
    public static void main(String[] args) {
        Directory root = new Directory("", null); // root path pieces show as /name

        Directory home = new Directory("home", null);
        Directory docs = new Directory("docs", null);
        File notes = new File("notes.txt", null, 0);
        File readme = new File("README.md", null, 0);

        root.addEntry(home);
        home.addEntry(docs);
        home.addEntry(readme);
        docs.addEntry(notes);

        notes.setContents("buy milk");
        readme.setContents("hello");

        System.out.println(notes.getFullPath());   // /home/docs/notes.txt
        System.out.println(docs.size());           // length of "buy milk"
        System.out.println(home.size());           // notes + readme
        System.out.println(home.numberOfFilesOnly()); // 2

        Entry found = root.resolve("/home/docs/notes.txt");
        System.out.println(found != null && found.getName().equals("notes.txt"));

        notes.delete();
        System.out.println(docs.getChild("notes.txt") == null);
    }
}
```

Parcours de l'arbre de démo:

| Étape | Structure | Notes |
| --- | --- | --- |
| départ | `root` | parent null |
| add | `root/home` | répertoire |
| add | `home/docs`, `home/README.md` | enfants mixtes |
| add | `docs/notes.txt` | feuille fichier |
| write | contenu notes `"buy milk"` | taille devient 8 |
| path | `notes.getFullPath()` | remonte les parents avec `/` |
| size | `home.size()` | somme récursive des fichiers en dessous |
| resolve | `/home/docs/notes.txt` | lookups de map par segment |
| delete | `notes.delete()` | le parent retire par nom |

---

## 5. Table de complexité

| Opération | Temps | Espace extra | Notes |
| --- | --- | --- | --- |
| `addEntry` / `deleteEntry` / `getChild` | O(1) moyen | O(1) | avec `HashMap` / `LinkedHashMap` par nom |
| `getFullPath` | O(profondeur) | O(profondeur) pour construire la chaîne | marche des parents |
| `size()` sur un répertoire | O(taille du sous-arbre) | O(profondeur) récursion | cache possible si chaud |
| `numberOfFilesOnly` | O(taille du sous-arbre) | O(profondeur) | même style de parcours |
| `resolve(path)` | O(segments) lookups de map | O(1) hors split du chemin | échoue vite si enfant manquant |
| Arbre entier | - | O(n) entrées | n = fichiers + répertoires |

Ils veulent surtout un arbre, des métadonnées partagées et une taille récursive, pas une micro-optimisation de cache de chemins.

---

## 6. Cas limites et erreurs fréquentes

Ils piquent souvent ici:

* **Supprimer la racine:** `parent == null`, donc `delete()` renvoie false. Pas de NPE.
* **Noms en double** sous un répertoire: refuse à l'ajout, ou définis l'écrasement dès le départ.
* **Supprimer pendant l'itération des enfants:** retire par nom dans la map; ne compte pas seulement sur l'identité de liste.
* **Nom de racine vide:** le format de chemin peut commencer par `/` + nom de l'enfant. Sois cohérent.
* **Entrer dans un fichier:** `resolve` doit s'arrêter ou échouer si un segment non-répertoire n'est pas le dernier.
* **Cycles:** les API de create normales ne placent jamais un répertoire comme ancêtre de lui-même. Si tu ajoutes `move`, vérifie les cycles.
* **Contenu null:** traite comme chaîne vide; taille 0.
* **Arbres profonds:** `size()` récursif peut faire exploser la pile; mentionne un parcours itératif pour durcir.

Erreurs fréquentes:

1. **Pas de base partagée.** Coller les horodatages dans File et Directory, puis oublier une méthode.
2. **Taille de répertoire = enfants directs seulement.** On veut souvent le total récursif d'octets.
3. **Liste sans noms uniques.** Deux `notes.txt` dans le même dossier, et la recherche devient ambiguë.
4. **Oublier de vider le parent à la suppression.** L'orphelin pointe encore vers un répertoire qui ne le liste plus.
5. **Construire un OS complet.** Blocs, permissions et montages avant d'avoir un arbre qui marche.
6. **Un simple map plat de fichiers.** C'est un magasin clé-valeur, pas un système hiérarchique.

Idée de smoke minimale:

```java
Directory root = new Directory("", null);
Directory a = new Directory("a", null);
File f = new File("f.txt", null, 0);
root.addEntry(a);
a.addEntry(f);
f.setContents("hi"); // size 2
assert a.size() == 2;
assert root.resolve("a/f.txt") == f;
assert f.delete();
assert a.getChild("f.txt") == null;
```

---

## 7. Récap à un ami

Conception d'un système de fichiers en mémoire, version entretien:

1. Modélise un **arbre**, pas un disque.
2. Champs partagés sur **`Entry`** abstrait: nom, parent, temps, `delete`, `getFullPath`, `size()` abstrait.
3. **`File`** tient le contenu et renvoie sa taille.
4. **`Directory`** tient une map d'enfants, somme les tailles en récursion, ajoute et retire des entrées.
5. Les chemins sont des marches: découpe sur `/`, cherche chaque nom, échoue proprement si manquant.
6. Commence simple. Liens, permissions et tailles en cache sont des suivis une fois l'arbre solide.

Si tu dessines la hiérarchie, expliques pourquoi `size()` est polymorphe, et montres add/delete/path sur un petit exemple, tu maîtrises le 7.11.

---

## Série

* Guide: [guide de la série CTCI](/blog/fr/ctci-series-guide)
* Précédent: [Minesweeper](/blog/fr/ctci-7-10-minesweeper)
* Suivant: [Hash Table](/blog/fr/ctci-7-12-hash-table)