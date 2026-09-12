---
title: "iPhone Duo : le nouveau PDG d'Apple a ouvert sa première keynote en pliant le téléphone"
description: "John Ternus a profité de son premier événement Apple pour lancer l'iPhone Duo à 1 999 dollars, un pliable de 7,6 pouces compatible Apple Pencil avec écran partagé. Le matériel arrive tard, exprès. Les conséquences pour les développeurs arrivent le 23 octobre."
date: "2026-09-12"
tags: [Matériel et Semiconducteurs, Économie Tech et Finance]
coverImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
previewImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
---

> **TL;DR**
> * **Le déclencheur :** Le 9 septembre, lors de la première keynote de John Ternus en tant que PDG, Apple a lancé l'iPhone Duo : un pliable au format passeport avec un écran intérieur de 7,6 pouces, un écran extérieur de 5,4 pouces, une puce A20 Pro gravée en 2 nm, la prise en charge de l'Apple Pencil et deux apps côte à côte. Prix : de 1 999 à 3 199 dollars.
> * **L'enjeu :** Apple applique sa plus vieille recette. Laisser une catégorie exister pendant des années (Samsung vend des pliables depuis 2019), attendre que le pli, la charnière et la batterie cessent d'être des excuses, puis entrer par le haut de gamme et fixer les standards.
> * **La perspective :** Le Duo ne sera pas un produit de volume la première année. Son vrai effet porte sur le logiciel : pour la première fois, les apps iPhone doivent gérer un canevas de la taille d'une tablette, l'écran partagé et un stylet. Les précommandes ouvrent le 16 octobre, et les apps qui supposent encore une largeur portrait fixe sembleront cassées sur l'iPhone le plus cher d'Apple.

Tim Cook est devenu président exécutif le 1er septembre. Huit jours plus tard, son successeur est monté sur scène, a présenté l'iPhone 18 Pro, les nouvelles Watch et les AirPods, puis a prononcé les trois mots que les keynotes d'Apple avaient discrètement mis au placard : « one more thing ».

Et il a plié le téléphone.

Difficile d'imaginer quelque chose de plus fidèle au personnage. Ternus a passé l'essentiel de sa carrière à diriger l'ingénierie matérielle. Son premier grand moment de PDG n'est pas une démo d'IA ni un chiffre des services. C'est une charnière.

---

## Ce qu'Apple a vraiment livré

| Caractéristique | iPhone Duo |
| --- | --- |
| Écran intérieur | 7,6 pouces Super Retina XDR, revêtement nanotexturé pour atténuer le pli |
| Écran extérieur | 5,4 pouces |
| Puce | A20 Pro (2 nm), 12 Go de RAM |
| Appareils photo | Principal 48 MP (f/1.6), ultra grand-angle 48 MP (f/2.2) |
| Batterie et charge | 4 883 mAh, 35 W filaire, 25 W MagSafe |
| Biométrie | Touch ID dans le bouton latéral |
| Saisie | Prise en charge de l'Apple Pencil, une première sur iPhone |
| Multitâche | Deux apps côte à côte, ou deux fenêtres du même site |
| Prix | 1 999 $ (256 Go) à 3 199 $ (2 To) |
| Dates | Précommandes le 16 octobre, disponibilité le 23 octobre |

Deux détails de cette liste en disent plus que le reste.

**Touch ID revient.** Apple n'a pas expliqué ce choix, mais la raison probable est physique : un module Face ID est épais, et un téléphone doit être très fin pour se plier en deux. Le capteur dans le bouton latéral, déjà utilisé sur les iPad, évite de sacrifier l'épaisseur ou l'écran intérieur.

**La dalle intérieure nanotexturée.** Le pli est la critique la plus fréquente des pliables. Apple n'a pas prétendu l'avoir supprimé. Elle a choisi un revêtement mat qui le rend moins visible. C'est un arbitrage très Apple : sacrifier un peu de contraste pour beaucoup de finition perçue.

---

## En retard, exprès

Samsung vend des pliables depuis 2019. Huawei a exhibé la même semaine son Mate XT2 à triple pliage, équipé du Kirin 9050 Pro maison. Au regard de la catégorie, Apple a sept ans de retard.

C'est le plan, pas le problème. Le schéma est connu :

| Catégorie | Le pionnier a lancé | Apple est entrée | Point d'entrée d'Apple |
| --- | --- | --- | --- |
| Baladeurs MP3 | Fin des années 1990 | 2001 (iPod) | Haut de gamme, avec une meilleure synchronisation |
| Smartphones | Début des années 2000 | 2007 (iPhone) | Haut de gamme, avec un meilleur tactile |
| Tablettes | Début des années 2000 | 2010 (iPad) | Haut de gamme, avec un écosystème d'apps |
| Montres connectées | 2013 | 2015 (Watch) | Haut de gamme, avec la santé |
| Pliables | 2019 | 2026 (Duo) | Haut de gamme, avec le Pencil et le multitâche |

À chaque fois, la question n'était pas « Apple sait-elle construire ça ? » mais « la chaîne de composants est-elle assez mûre pour que la version d'Apple ne ressemble pas à un prototype ? ». Charnières, verre ultra-fin et silicium 2 nm qui ne fait pas surchauffer un téléphone à deux écrans ont franchi cette ligne à peu près maintenant.

Ben Wood, de CCS Insight, a déclaré que le Duo « allait forcément éclipser les autres annonces d'Apple lors de l'événement ». Sur scène, c'est vrai. Dans le compte de résultat, l'iPhone 18 Pro fera le gros du travail pendant des années. À partir de 1 999 dollars, le Duo est un produit vitrine : il relève le plafond de ce que peut coûter un iPhone et rend le Pro raisonnable par comparaison.

---

## Le vrai sujet, c'est le canevas

Voici la partie qui compte pour quiconque publie du logiciel iOS.

Pendant dix-huit ans, l'iPhone a été un appareil à largeur fixe, une seule app à la fois, uniquement au doigt. Les size classes et les safe areas se sont complexifiées, mais une app de téléphone pouvait encore supposer un canevas portrait étroit qui changeait rarement.

Le Duo casse trois de ces hypothèses d'un coup :

1. **La largeur change pendant que l'app tourne.** En dépliant le téléphone, le canevas passe de 5,4 à 7,6 pouces. Si l'état, la position de défilement ou un formulaire en cours sont perdus pendant cette transition, les utilisateurs le verront tout de suite.
2. **Votre app n'est plus seule.** L'écran partagé signifie que votre mise en page peut occuper la moitié d'un écran de 7,6 pouces, à côté de l'app de quelqu'un d'autre. Les développeurs iPad connaissent ce monde. La plupart des équipes uniquement iPhone ne l'ont jamais testé.
3. **Un stylet existe.** La saisie au Pencil sur un téléphone ouvre l'annotation, la signature et l'écriture manuscrite dans des écrans que personne n'a conçus pour ça.

La bonne nouvelle, c'est qu'Apple prépare le terrain depuis un moment. Les apps qui ont déjà adopté des mises en page adaptatives pour l'iPad et Stage Manager ont fait l'essentiel. La mauvaise, c'est que beaucoup d'apps iPhone, surtout les apps multiplateformes à points de rupture fixes, paraîtront étirées ou encadrées de bandes noires sur l'iPhone le plus cher jamais vendu, devant les clients les plus enclins à se plaindre.

**Une liste concrète avant le 23 octobre :**

* Testez la taille de l'écran intérieur dans le simulateur, en plein écran et en largeurs d'écran partagé.
* Vérifiez que plier et déplier conserve l'état de navigation et la saisie de texte.
* Remplacez les points de rupture codés en dur par des size classes ou des mises en page basées sur les conteneurs.
* Passez en revue tout écran avec signature, annotation ou zone de dessin pour la prise en charge du Pencil.
* Contrôlez les vues vidéo et caméra avec les nouveaux formats. Un lecteur portrait centré au milieu d'un canevas de 7,6 pouces ressemble à un bug.

---

## Ce que cela dit de l'ère Ternus

C'est tôt. Une keynote n'est pas une stratégie. Mais le choix de l'ouverture est un signal.

Les dernières années d'Apple ont été dominées par la question de son retard en IA. Le Duo ne répond pas à cette question. Il change de sujet pour revenir au seul terrain où Apple garde une avance nette : l'intégration du matériel, du silicium et du design industriel à une échelle que personne d'autre n'égale. Une A20 Pro en 2 nm dans un téléphone qui se plie, avec les rendements et les marges d'Apple, est autant un argument de chaîne d'approvisionnement qu'un produit.

Le risque est évident. Un pliable est un téléphone que l'on regarde plus longtemps, dans plus de contextes, avec plus de modes de saisie. C'est exactement là qu'un assistant devrait briller. Si l'intelligence logicielle du Duo ressemble au même assistant que celui de l'iPhone classique, simplement étiré sur un plus grand écran, le matériel aura fait son travail et le logiciel aura raté le moment.

---

## Ce qui reste

« One more thing » servait autrefois à présenter ce qui changeait la catégorie. Cette fois, la formule a présenté Apple rejoignant une catégorie qui existe déjà, des années après tout le monde.

Ce n'est pas une critique. Apple a toujours fonctionné ainsi. Le test n'est pas la charnière. C'est de savoir si, en septembre prochain, les apps de l'écran intérieur auront l'air conçues pour lui, ou si elles sembleront attendre que quelqu'un referme le téléphone.

---

## Sources

* [Fold the phone: Apple's new CEO unveils a foldable iPhone (NPR)](https://npr.org/2026/09/09/nx-s1-5961487/apple-duo-foldable-iphone-john-ternus)
* [iPhone Duo: Release Date and Pre-Orders (MacRumors)](https://www.macrumors.com/2026/09/10/iphone-duo-release-date-pre-orders/)
* [iPhone Duo launched: check price and specifications (TelecomTalk)](https://telecomtalk.info/iphone-duo-launched-check-price-and-specifications/1011691/)
* [iPhone Duo hands-on (Tom's Guide)](https://www.tomsguide.com/phones/iphones/iphone-duo-hands-on-apple-nailed-it-and-just-put-everyone-else-on-notice)
* [New iPhone lineup includes a foldable version called Duo (AP via WCAX)](https://www.wcax.com/2026/09/10/new-iphone-lineup-includes-foldable-version-called-duo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
