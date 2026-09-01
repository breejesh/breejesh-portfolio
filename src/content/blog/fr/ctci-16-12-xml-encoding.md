---
title: "Encodage XML: Sérialisation d'AST et Tokenisation Binaire Compacte (CTCI 16.12)"
description: "Encodez des arbres de documents XML verbeux en flux compacts de jetons à l'aide d'un parcours récursif préfixe et d'un dictionnaire d'identifiants entiers."
date: "2026-05-06"
tags: [Algorithmes et Structures]
coverImage: /assets/images/ctci-16-12-xml-encoding.webp
previewImage: /assets/images/ctci-16-12-xml-encoding.webp
---

> **TL;DR**
> * **Le Problème du Livre:** Le format XML étant très verbeux, concevez un algorithme de compression où chaque balise est convertie en entier selon la grammaire : `Element -> Tag Attributes END (Value | Children) END`, `Attribute -> Tag Value`, `END -> 0`.
> * **La Solution Optimale:** **Sérialisation Récursive Préfixe de l'Arbre AST** :
>   1. **Dictionnaire de Correspondance** : Associer chaque balise à un entier prédéfini (ex. `family` $\to$ 1, `person` $\to$ 2).
>   2. **Règles d'Encodage** :
>      * Émettre `CodeBalise`.
>      * Pour chaque attribut : émettre `CodeAttribut` et `Valeur`.
>      * Émettre la sentinelle `0` (fin des attributs).
>      * Émettre la valeur textuelle si présente, sinon encoder récursivement les enfants.
>      * Émettre la sentinelle `0` (fin de l'élément).
>   3. S'exécute en **temps $O(N)$** et **espace $O(N)$**.
> * **Réalité en Production:** Formats binaires Protocol Buffers (Protobuf), Fast Infoset et BSON.

## 1. Formulation du Problème du Livre

Dans *Cracking the Coding Interview* (Problème 16.12), l'énoncé est :

*"Convertissez un arbre XML en un flux compact de jetons numeriques conformement a la grammaire definie."*

## 2. Déroulement du Parcours Préfixe

L'arbre est exploré selon un parcours en profondeur d'abord (DFS préfixe) pour préserver l'arborescence hiérarchique sans balises de fermeture textuelles.

## Implémentation de Production

```java
import java.util.*;

public class XmlEncoder {

    public static class Attribute {
        public final String tag;
        public final String value;

        public Attribute(String tag, String value) {
            this.tag = tag;
            this.value = value;
        }
    }

    public static class Element {
        public final String name;
        public final List<Attribute> attributes = new ArrayList<>();
        public final List<Element> children = new ArrayList<>();
        public String value;

        public Element(String name) {
            this.name = name;
        }

        public Element(String name, String value) {
            this.name = name;
            this.value = value;
        }
    }

    public static String encode(Element root, Map<String, String> tagMap) {
        StringBuilder sb = new StringBuilder();
        encodeHelper(root, tagMap, sb);
        return sb.toString().trim();
    }

    private static void encodeHelper(Element root, Map<String, String> tagMap, StringBuilder sb) {
        if (root == null) return;

        sb.append(tagMap.getOrDefault(root.name, root.name)).append(" ");

        for (Attribute attr : root.attributes) {
            sb.append(tagMap.getOrDefault(attr.tag, attr.tag)).append(" ");
            sb.append(attr.value).append(" ");
        }

        sb.append("0 "); // Clôture des attributs

        if (root.value != null && !root.value.isEmpty()) {
            sb.append(root.value).append(" ");
        } else {
            for (Element child : root.children) {
                encodeHelper(child, tagMap, sb);
            }
        }

        sb.append("0 "); // Clôture de l'élément
    }
}
```

## Analyse de Complexité

| Métrique | Complexité | Détail Technique |
|---|---|---|
| Complexité Temporelle | `O(N)` | Visite unique de chaque nœud et attribut. |
| Espace Mémoire | `O(N)` | Flux de sortie généré et pile d'appels. |

## Ingénierie des Systèmes en Production

### Architecture Système : Comparatif avec Protobuf

1. **Protocol Buffers :** Protobuf élimine les délimiteurs de fermeture grâce aux types de champs et aux longueurs de données codées en varints.
2. **Fast Infoset (XML Binaire ISO) :** Indexation des chaînes récurrentes pour optimiser la bande passante sur réseaux contraints.

## Cas Limites et Robustesse

1. **Balises Inconnues :** Fallback propre sur le nom littéral de la balise.
