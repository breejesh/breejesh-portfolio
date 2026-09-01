---
title: "Concevoir un rate limiter : algorithmes, patterns Redis et réalité des gateways"
description: "Le rate limiting pour débutants absolus : analogie du videur de boîte, pourquoi les limites existent, token bucket et sliding window en langage clair, Redis comme carnet partagé, et une requête de bout en bout."
date: "2026-04-10"
tags: [Design Système et Architecture]
coverImage: /assets/images/design-a-rate-limiter.webp
previewImage: /assets/images/design-a-rate-limiter.webp
---


> **TL;DR**
> * **Le Problème:** La conception d'architectures évolutives exige un équilibre entre disponibilité, débit et complexité opérationnelle.
> * **L'Essentiel:** Le rate limiting pour débutants absolus : analogie du videur de boîte, pourquoi les limites existent, token bucket et sliding window en langage clair, Redis comme carnet partagé, et une requête de bout en bout.
> * **Le Résultat:** Plan technique avec des objectifs quantitatifs et la gestion des pannes en production.

Imagine une boîte de nuit pleine un samedi soir. Un videur à la porte a un travail simple : laisser entrer les gens au rythme que la salle peut encaisser. Trop de monde d'un coup et le bar, les toilettes et les sorties saturent. Trop strict et les clients honnêtes partent en colère. Un **rate limiter** est ce videur pour ton API. Chaque requête s'approche et demande : "est-ce que je peux entrer maintenant ?" Le limiter répond oui, attends, ou non.

Ce billet enseigne le rate limiting comme un professeur patient : d'abord les raisons humaines, puis les deux algorithmes que tu croiseras vraiment, puis le piège multi-serveurs, puis le parcours complet d'une seule requête. Tu n'as pas besoin d'expérience en systèmes distribués. Tu as besoin de curiosité et de l'envie de penser tickets et seaux d'eau quelques minutes.

---

## Pourquoi les limites existent (en termes humains)

Sans videur, trois douleurs arrivent vite.

**Équité.** Une personne qui martèle le refresh peut manger toute la salle. Les autres attendent. Les limites donnent à chaque invité (utilisateur, IP, clé API) un budget pour qu'un voisin bruyant ne prive pas les autres.

**Coût.** Chaque requête coûte quelque chose : CPU, temps base de données, argent vers un SMS ou une API d'IA tierce. Trafic gratuit illimité = facture gratuite illimitée. Les limites gardent les offres free viables et les offres payantes honnêtes.

**Abus.** Les bots testent des mots de passe, scrapent ton catalogue ou spam les inscriptions. Une limite n'arrête pas pour toujours un attaquant motivé, mais elle freine les attaques bon marché assez pour que logs, CAPTCHA et sécu respirent.

Langage produit que tu connais déjà :

- Plan free : 100 appels API par jour.
- Login : quelques essais, puis pause.
- API météo : 60 requêtes par minute par clé.

La même idée partout : **un budget d'actions dans le temps**.

---

## Ce que tu comptes

Avant de choisir un algo, décide **qui** tu limites et **ce qu'** un "ticket" veut dire.

| Tu comptes par... | Sens dans la vraie vie | Quand ça se tord |
| --- | --- | --- |
| Adresse IP | "Ce réseau téléphone" | Beaucoup de gens partagent une IP (bureau, opérateur mobile) |
| User id | "Cette personne connectée" | Comptes bot partagés ou utilisateurs de service oubliés |
| Clé API | "Cette app partenaire" | Une clé utilisée depuis beaucoup d'endroits à la fois |
| Tenant + route | "Cette entreprise sur cet endpoint cher" | Une feature chaude brûle le quota de toute l'entreprise |
| Tout le monde | "Protéger la cuisine partagée" | Un tenant bruyant blesse la plateforme |

Un bon limiter répond à trois choses :

1. **Autoriser ou refuser** (oui ou non maintenant).
2. **Combien attendre** si refus (guidance type `Retry-After`).
3. **Combien de budget reste** pour que le client ralentisse poliment.

Le statut HTTP **429** veut dire "trop de requêtes." Pense au "pas encore" poli du videur.

---

## Deux modèles mentaux que tu garderas

Entretiens et production tournent autour de deux idées. Apprends-les avec des images dans la tête, pas seulement des formules.

### 1. Token bucket = une cruche de tickets

Imagine une cruche sur le comptoir. Elle peut contenir **B** tickets (la capacité). Chaque seconde (ou minute), la boîte verse **R** nouveaux tickets dans la cruche (le taux de remplissage). Quand tu arrives, il te faut un ticket. S'il y en a un, tu le prends et tu entres. Si la cruche est vide, tu attends.

Sensations importantes :

- Si la boîte est calme, les tickets s'empilent jusqu'à remplir la cruche. Tu peux alors laisser entrer une **rafale** courte (jusqu'à B personnes d'un coup).
- Après la rafale, la cruche est vide. Les nouveaux n'entrent qu'à la vitesse du remplissage (taux R).
- Taille de rafale et vitesse long terme sont des manettes séparées. Le produit adore : "autoriser un pic court, jamais plus que R pour toujours."

C'est le **token bucket**. Les tokens sont des tickets. La capacité est le nombre de tickets de réserve. Le taux est la vitesse à laquelle tu en fabriques de nouveaux.

### 2. Sliding window = une bande de temps qui roule

Imagine un guichet qui ne regarde que les **60 dernières secondes**, pas "cette minute du calendrier." Une fenêtre de verre glisse sur la ligne du temps. Tu comptes combien de gens sont entrés sous ce verre. Si le compte est sous la limite, la personne suivante reçoit un tampon. Sinon, elle attend que d'anciens tampons sortent de la fenêtre.

Deux saveurs courantes :

**Sliding window log (exact, cher) :** tu notes chaque horodatage d'entrée. À chaque nouvelle personne, tu effaces les tampons de plus de 60 secondes et tu comptes le reste. Parfaitement juste. Lourd si des millions frappent, car chaque requête écrit et nettoie.

**Sliding window counter (assez bien, pratique) :** au lieu de chaque tampon, deux seaux approximatifs : "minute précédente" et "minute courante." Tu les mélanges selon l'avancement dans la minute courante. Presque aussi lisse que le log, avec deux nombres au lieu d'une longue liste.

**Fixed window** est le cousin naïf : "seulement 100 par minute calendaire." À 12:00:59 quelqu'un use 100. À 12:01:00 le compteur reset et il en use encore 100. En deux secondes il a utilisé 200. Les limites souples le tolèrent. Les SLA durs souvent non.

| Idée | Image du quotidien | Sensation de rafale | Coût mémoire |
| --- | --- | --- | --- |
| Fixed window | Remettre le clicker à zéro chaque minute pile | Pics aux bords | Minuscule (un compteur) |
| Sliding log | Liste exacte d'invités des 60 dernières s | Lisse et juste | Grande |
| Sliding counter | Mélange approx de deux minutes | Quasi lisse | Minuscule (deux compteurs) |
| Token bucket | Cruche de tickets qui se remplit lentement | Rafales contrôlées | Minuscule |
| Leaky bucket | Évier qui s'écoule à gouttes fixes | Sortie lisse | File ou compteur |

**Leaky bucket** (image bonus) : les gens font la queue, et la porte en laisse passer un à chaque tick fixe, comme un évier qui se vide à débit constant. La sortie est lisse. File pleine : les nouveaux sont refusés. Utile quand ce que tu protèges a besoin d'une arrivée stable plus que de pics courts.

Pour la plupart des APIs, le sweet spot est **token bucket** ou **sliding window counter**.

---

## Token bucket dans la forme de code la plus simple

Un processus, une horloge, pas encore de Redis. La cruche en code :

```python
import time

class TokenBucket:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate          # tickets ajoutés par seconde
        self.capacity = capacity  # max de tickets dans la cruche
        self.tokens = capacity
        self.updated_at = time.monotonic()

    def allow(self, cost: float = 1.0) -> bool:
        now = time.monotonic()
        elapsed = now - self.updated_at
        # remplir selon le temps écoulé, jamais au-dessus de capacity
        self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
        self.updated_at = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False
```

Ce qu'un professeur soigneux soulignerait :

- Préfère une **horloge stable** (monotone) pour le refill, pour qu'un saut d'horloge de laptop n'invente pas de tickets gratuits.
- **Cost** peut être plus que 1. Une route chère "exporter tout" peut coûter 10 tickets ; un health check cheap, 1 ou même 0.
- Un processus suffit pour la démo. Plusieurs serveurs ont besoin d'une cruche **partagée**, sinon chaque serveur est son propre videur avec un budget plein.

---

## Plusieurs serveurs : carnets privés vs un carnet partagé

Le piège multi-serveurs en langage clair.

Tu fais tourner **20** copies de ton API derrière un load balancer. Chaque copie tient un carnet privé : "cet utilisateur a utilisé 5 sur 100." L'utilisateur peut frapper les 20. Si le trafic se répartit, il obtient en gros **20 × 100** avant d'entendre non. Ta limite annoncée est devenue fiction.

| Approche | Image | Ce qui se passe vraiment |
| --- | --- | --- |
| Limite seulement en mémoire app | Chaque videur a un carnet privé | Le budget se multiplie par le nombre de serveurs |
| Sticky sessions seulement | "Toujours la même porte" | Retries et réseaux mobiles cassent le stickiness |
| Store partagé (souvent Redis) | Un carnet que tous lisent et écrivent | La vraie limite est à peu près la vraie limite |

**Redis** est le carnet partagé préféré de beaucoup d'équipes : très rapide, bon pour compteurs et petits hashes, scripts qui mettent à jour une clé sans que deux apps se marchent dessus.

### Patterns que les gens déploient vraiment

**Page fixed window dans le carnet**

```
key = rl:{apiKey}:{yyyyMMddHHmm}
count = INCR key
if count == 1: EXPIRE key 120
if count > limit: DENY
```

Bon marché et simple. Accepte les pics au bord si le produit peut vivre avec.

**Token bucket sur un hash partagé**

Tu stockes `tokens` et `last_refill_time` sur une clé Redis. À chaque requête, un petit **script Lua** (une étape atomique sur Redis) remplit selon le temps, dépense un token si possible, écrit le solde, et renvoie allow/deny plus tickets restants. Sans update atomique, deux serveurs peuvent lire "il en reste 1," tous les deux autoriser, et sur-vendre le dernier ticket.

**Sliding log en sorted set**

Tu stockes des timestamps, tu drop les vieux, tu comptes, tu ajoutes le nouveau tampon. Exact, mais mémoire et CPU grandissent avec le trafic. À haut QPS, c'est souvent le premier pattern que tu regrettes.

**Sliding counter avec deux pages**

Clés pour "cette fenêtre" et "la précédente," mélangées avec un poids. Presque toute la douceur, peu du coût.

### Fail-open vs fail-closed (quand le carnet manque)

Si Redis est down, il te faut encore une politique :

- **Fail open :** laisser passer le trafic (peut-être avec un plafond local d'urgence). Beaucoup d'apps grand public choisissent ça pour que la douleur Redis ne devienne pas une panne totale.
- **Fail closed :** refuser. Paiements et login choisissent souvent ça pour que le chaos ne veuille pas dire essais illimités gratuits.

Aucun n'est gratuit. Choisis exprès par surface, et alarme les erreurs Redis dans les deux cas.

### Les horloges mentent si tu les laisses

Si chaque serveur d'app utilise sa propre horloge murale pour "dans quelle minute suis-je," deux serveurs peuvent diverger un instant. Pattern plus sûr : **temps serveur Redis** dans le script pour refill et id de fenêtre. Pour les démos locales, horloge monotone. Ne fais jamais confiance à un timestamp inventé par le client.

---

## Parcours d'une requête API à travers le limiter

Rencontre **Priya**. Elle est connectée. Son plan free autorise **100 requêtes par minute**, avec une rafale courte de **20**. Le système a beaucoup de pods API et un carnet Redis.

1. **Le client envoie la requête**  
   Le navigateur ou l'app mobile appelle `GET /api/weather?city=Pune` avec le cookie de session de Priya (ou sa clé API).

2. **Le load balancer choisit un pod**  
   N'importe quel serveur sain peut la servir. C'est OK, car le compte ne vivra pas seulement dans la mémoire de ce pod.

3. **Auth d'abord (en général)**  
   L'app vérifie que c'est Priya. La clé de rate devient quelque chose comme `rl:user:priya123`, pas seulement son IP. (Tu peux encore avoir une limite IP pour les bots qui ne se connectent jamais.)

4. **Check du limiter (le videur)**  
   L'app (ou un plugin gateway) appelle Redis avec la clé, la règle (token bucket : capacity 20, refill environ 100/60 par seconde) et cost 1. Le script Lua :
   - lit tokens courants et dernier refill,
   - ajoute des tickets pour le temps passé (plafonné à capacity),
   - si tokens ≥ 1, soustrait 1 et autorise,
   - sinon refuse et calcule un petit délai de retry.

5. **Chemin allow**  
   La requête continue vers la logique métier, peut-être le service météo, renvoie 200. Les en-têtes peuvent dire combien de tickets restent pour que son SDK ralentisse avant le prochain deny.

6. **Chemin deny**  
   La requête ne brûle pas de travail cher. Le client reçoit **429**, un indice `Retry-After`, et remaining = 0. Les clients honnêtes attendent. Les abusifs restent freinés par le carnet partagé sur tous les pods.

7. **Observabilité**  
   Les métriques comptent allows et denys. Si les denys explosent pour une clé, l'on-call demande "panne réelle, limite produit trop serrée, ou client bruyant ?" avant de "réparer" en montant le chiffre à l'aveugle.

Toute cette histoire est le system design d'un rate limiter : **politique + algorithme + store partagé + feedback client clair**.

---

## Où se tient le videur (réalité des gateways)

Tu peux placer des limites à plusieurs endroits. Beaucoup d'équipes empilent des couches, comme la sécu du club dans la rue, à la porte, et au salon VIP.

| Emplacement | Force | Faiblesse |
| --- | --- | --- |
| CDN / edge | Stoppe le junk tôt | Clés grossières ; peu de contexte métier |
| API gateway | Plans par clé, 429 prêts | "Ce body coûte 5" devient maladroit |
| Service mesh (Envoy) | Limites locales par route | Local seul = encore N × limite |
| Middleware app | Connaît user et plan produit | Facile d'oublier sur un nouveau service |
| Lib par service | Rapide pour une équipe | Drift entre langages |

Règle pratique : **limites IP grossières à l'edge**, **limites user ou plan après auth**, **garde-fous en plus sur les mutations chères** (reset mot de passe, export bulk). Les gateways ne suppriment pas les limites app. Ils évitent que chaque service junior réinvente la maths des tickets le jour un.

Pile hiérarchique d'exemple :

1. Par IP (abus)
2. Par utilisateur (équité)
3. Par route de tenant (produit)
4. Circuit global sur une dépendance fragile

Refuse si **n'importe quelle** couche dit non. Vérifie d'abord les couches cheap quand tu peux.

---

## Un design défendable en entretien

**Clarifie d'abord :**

- 100 requêtes par utilisateur par minute, rafale 20.
- Doit marcher sur 20 instances d'app.
- Préférer faible latence ; léger overshoot OK si Redis vacille.
- Renvoyer 429 avec guidance de retry.

**Propose :**

1. Clé : `rl:user:{userId}` (hash-tagged si Redis Cluster).
2. Algorithme : token bucket, capacity 20, refill 100/60 tokens par seconde.
3. Storage : Redis primary, Lua atomique, temps Redis pour le refill.
4. Placement : gateway pour IP grossière ; app (ou plugin gateway vers Redis) pour quotas user après auth.
5. Panne : fail-open local court avec plafond local dur ; alarme sur erreurs Redis.
6. Observabilité : compteurs allow/deny, histogramme remaining, top des clés refusées.

**Dis les trade-offs à voix haute :**

- Fixed window est simple mais bursty aux bords.
- Sliding log est exact mais lourd.
- Token bucket colle au langage produit (rafale + soutenu).
- Exactitude globale parfaite sous split réseau est chère ; approximer avec un mode de panne choisi est de l'ingénierie normale.

---

## Checklist production

- [ ] Clés avec user/tenant/route, pas seulement l'IP
- [ ] Chemin d'update atomique (Lua ou équivalent), pas de courses read-then-write naïves
- [ ] Hash tags Cluster si scripts multi-clés
- [ ] Source d'horloge partagée ou monotone
- [ ] 429 + Retry-After + en-têtes remaining documentés
- [ ] Fail-open ou fail-closed choisi par surface
- [ ] Load test avec N instances et une hot key
- [ ] Dashboards taux de deny et erreurs Redis
- [ ] Limites séparées pour login, reset password et mutations chères
- [ ] Runbooks "monter la limite" vs "trouver le client bruyant"

---

## Récap pour un ami

Un rate limiter est un **videur pour ton API**. Il existe pour qu'un invité ne mange pas la salle (**équité**), pour que la facture cloud n'explose pas (**coût**), et pour que les bots ne te martèlent pas gratuitement (**abus**).

Deux images restent :

1. **Token bucket :** une cruche de tickets qui se remplit lentement. Une courte file peut entrer s'il y a des tickets en réserve. Sur le long terme tu ne vas jamais plus vite que le taux de remplissage.
2. **Sliding window :** tu ne comptes que ce qui s'est passé dans la dernière bande de temps pendant que la fenêtre avance. Les listes exactes d'invités sont justes mais lourdes ; deux compteurs mélangés suffisent souvent.

Plusieurs serveurs avec chacun un **carnet privé** multiplient en silence ta limite. Un **carnet partagé** (souvent Redis) garde le vrai budget. Parcours une requête : client → load balancer → auth → check partagé → allow vers le vrai travail ou 429 avec "réessaie plus tard."

Si tu ne retiens qu'une leçon de production : **les compteurs partagés battent la maths locale maline**, et **les horloges mentent** si tu n'imposes pas une seule source de temps. Commence par token bucket ou sliding window counter sur Redis, mets des limites grossières à l'edge, garde les quotas produit près de l'auth, et mesure les denys avant de les "réparer" en montant le chiffre.

