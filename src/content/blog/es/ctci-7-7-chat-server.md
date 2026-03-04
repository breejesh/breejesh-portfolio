---
title: "Chat Server: usuarios, conversaciones, mensajes y estado (OOD en Java)"
description: "Problema estilo CTCI 7.7 para principiantes: diseña un servidor de chat en Java con User, PrivateChat y GroupChat, Message, presencia y solicitudes de amistad. Primero el alcance, luego las clases."
date: "2026-03-04"
tags: [Algoritmos]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.7 para principiantes: diseña un servidor de chat en Java con User, PrivateChat y GroupChat, Message, presencia y solicitudes de amistad. Primero el alcance, luego las clases.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

Un servidor de chat es un producto, no un solo método. Los entrevistadores lo saben. Quieren que **delimites** el trabajo, nombres los objetos y muestres cómo encajan amigos, chats privados, chats de grupo, mensajes y estado en línea. Redes, push y escala multi-región suelen quedar fuera del primer boceto salvo que pregunten.

Este post es enseñanza original de **diseño orientado a objetos** para principiantes en **Java**. Misma familia que el OOD clásico de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). El capítulo 7 sigue después de [Jigsaw](/blog/es/ctci-7-6-jigsaw).

---

## 1. Analogía cotidiana

Piensa en un tablón de chat de empresa en la pared de una oficina pequeña.

* Cada persona tiene una **etiqueta de nombre** y un post-it de humor: disponible, ocupado, ausente, desconectado.
* Los **amigos** son tu lista de contactos. No puedes spamear a desconocidos; alguien tiene que aceptar la solicitud de alta.
* Un **chat privado** es un sobre sellado que solo abren dos personas.
* Un **chat de grupo** es una carpeta compartida. La gente entra o sale. Los mensajes se apilan en orden.
* Cuando escribes una nota, va a la carpeta correcta, con marca de tiempo, y quienes están en esa carpeta deberían verla.

El servidor es el administrativo que mantiene coherentes listas de contactos, carpetas y post-its. En la entrevista diseñas el archivador como clases, no cada socket TCP.

---

## 2. Problema en palabras simples

**Objetivo:** esbozar clases y métodos de backend para un servidor de chat centrado en usuarios y conversaciones.

**Dentro del alcance (por defecto en este post):**

* Entrar y salir en línea (presencia).
* Tipo de estado y mensaje de estado opcional (disponible, ocupado, ausente, idle, offline).
* Amistad mutua: enviar, aceptar, rechazar solicitudes.
* Chats privados (1:1) y de grupo.
* Añadir mensajes de texto a una conversación.
* Buscar usuarios por id o nombre de cuenta.

**Fuera de alcance salvo que lo pidan:**

* Voz, vídeo, transferencia de archivos.
* Cifrado de extremo a extremo.
* Framing WebSocket y UI del cliente.
* Escala de producción particionada (háblalo como follow-up duro, no como primer código).

**Supuestos a decir en voz alta:**

* La amistad es mutua. Si A está en la lista de B, B está en la de A.
* Un chat privado tiene siempre exactamente dos participantes.
* Los grupos pueden añadir y quitar participantes.
* Primero modelamos objetos en memoria. Una base de datos persistiría usuarios e historial detrás de las mismas interfaces después.

**Tipos centrales:**

| Tipo | Rol |
| --- | --- |
| `User` | identidad, contactos, chats, estado, envío |
| `Conversation` | participantes + lista de mensajes (abstracta) |
| `PrivateChat` / `GroupChat` | dos formas concretas de conversación |
| `Message` | contenido + marca de tiempo |
| `UserStatus` / `UserStatusType` | presencia + texto opcional |
| `AddRequest` / `RequestStatus` | solicitudes de amistad pendientes |
| `UserManager` | registro de usuarios, conjunto online, aprobar/rechazar |

---

## 3. Piensa primero

### El alcance gana al "clon de WhatsApp"

Si empiezas con Kafka, Redis y failover multi-DC, nunca llegas a las clases. Abre con:

1. ¿Qué acciones deben funcionar?
2. ¿Qué objetos poseen esas acciones?
3. ¿Qué se ignora a propósito?

Eso es la entrevista. El código demuestra que el modelo es real.

### Por qué Conversation es abstracta

Privado y grupo comparten participantes y mensajes. Difieren en membresía:

* Privado: pareja fija; helper para "la otra persona".
* Grupo: membresía dinámica (`addParticipant` / `removeParticipant`).

Comparte lista de mensajes e id en `Conversation` abstracta. Pon las reglas de membresía en las subclases. Así `User.sendMessageToGroupChat` y la lectura de historial se mantienen simples.

### Dónde van los mensajes

Flujo limpio habitual para chat privado:

1. El emisor busca o crea el `PrivateChat` con el otro usuario.
2. Construye un `Message` con contenido y hora.
3. Lo añade a la conversación.
4. (Sistema real) notifica a los destinatarios por red. En el boceto OOD, devolver `true` tras el append basta.

Grupo: resuelve el chat por id, comprueba que el emisor es participante, añade.

### Flujo de amistad

1. A llama `requestAddUser(nombre de cuenta de B)`.
2. `UserManager` crea un `AddRequest` y lo registra en ambos (mapas enviados y recibidos).
3. B acepta: el manager añade a cada uno en los contactos del otro y limpia la solicitud.
4. B rechaza: el estado pasa a rejected; sin enlace de contacto.

No dejes que A escriba a B como contacto hasta aceptar, si tu regla de producto lo exige. Declárala.

### Estado no es "estar en un chat"

`UserStatusType` responde "¿puedo molestar a esta persona?" (Available, Busy, Away, Idle, Offline). Estar en una conversación no sustituye la presencia. Los mapas online de `UserManager` rastrean quién ha iniciado sesión para el enrutado posterior.

### ¿UserManager singleton?

Un registro único vale en el boceto de entrevista para que todos los caminos vean el mismo mapa de usuarios. En producción lo sustituyes por un servicio y un almacén. Dilas: "singleton para la pizarra, no un decreto de producción."

---

## 4. Solución en Java

Modelo de enseñanza original: suficientes cuerpos de método para recorrer una solicitud de amistad y un mensaje privado. No es un servidor completo.

### Enums y tipos de valor pequeños

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

enum UserStatusType {
    Offline, Away, Idle, Available, Busy
}

enum RequestStatus {
    Unread, Read, Accepted, Rejected
}

class UserStatus {
    private final UserStatusType type;
    private final String message; // optional free text, may be null

    UserStatus(UserStatusType type, String message) {
        this.type = type;
        this.message = message;
    }

    UserStatusType getStatusType() {
        return type;
    }

    String getMessage() {
        return message;
    }
}

class Message {
    private final String content;
    private final Date date;
    private final int senderId;

    Message(String content, Date date, int senderId) {
        this.content = content;
        this.date = date;
        this.senderId = senderId;
    }

    String getContent() {
        return content;
    }

    Date getDate() {
        return date;
    }

    int getSenderId() {
        return senderId;
    }
}

class AddRequest {
    private final User fromUser;
    private final User toUser;
    private final Date date;
    private RequestStatus status;

    AddRequest(User from, User to, Date date) {
        this.fromUser = from;
        this.toUser = to;
        this.date = date;
        this.status = RequestStatus.Unread;
    }

    RequestStatus getStatus() {
        return status;
    }

    void setStatus(RequestStatus status) {
        this.status = status;
    }

    User getFromUser() {
        return fromUser;
    }

    User getToUser() {
        return toUser;
    }

    Date getDate() {
        return date;
    }
}
```

### Jerarquía Conversation

```java
abstract class Conversation {
    protected final int id;
    protected final ArrayList<User> participants = new ArrayList<>();
    protected final ArrayList<Message> messages = new ArrayList<>();

    Conversation(int id) {
        this.id = id;
    }

    int getId() {
        return id;
    }

    ArrayList<Message> getMessages() {
        return messages;
    }

    boolean addMessage(Message m) {
        if (m == null || m.getContent() == null) {
            return false;
        }
        messages.add(m);
        return true;
    }

    boolean hasParticipant(User u) {
        return participants.contains(u);
    }
}

class PrivateChat extends Conversation {
    PrivateChat(int id, User user1, User user2) {
        super(id);
        participants.add(user1);
        participants.add(user2);
    }

    User getOtherParticipant(User primary) {
        if (participants.get(0).equals(primary)) {
            return participants.get(1);
        }
        if (participants.get(1).equals(primary)) {
            return participants.get(0);
        }
        return null;
    }
}

class GroupChat extends Conversation {
    GroupChat(int id) {
        super(id);
    }

    void addParticipant(User user) {
        if (user != null && !participants.contains(user)) {
            participants.add(user);
        }
    }

    void removeParticipant(User user) {
        participants.remove(user);
    }
}
```

### User

```java
class User {
    private final int id;
    private final String accountName;
    private final String fullName;
    private UserStatus status = new UserStatus(UserStatusType.Offline, null);

    // other user id -> private chat
    private final Map<Integer, PrivateChat> privateChats = new HashMap<>();
    private final ArrayList<GroupChat> groupChats = new ArrayList<>();

    private final Map<Integer, AddRequest> receivedAddRequests = new HashMap<>();
    private final Map<Integer, AddRequest> sentAddRequests = new HashMap<>();
    private final Map<Integer, User> contacts = new HashMap<>();

    User(int id, String accountName, String fullName) {
        this.id = id;
        this.accountName = accountName;
        this.fullName = fullName;
    }

    int getId() {
        return id;
    }

    String getAccountName() {
        return accountName;
    }

    String getFullName() {
        return fullName;
    }

    UserStatus getStatus() {
        return status;
    }

    void setStatus(UserStatus status) {
        this.status = status;
    }

    boolean addContact(User user) {
        if (user == null || user.getId() == id) {
            return false;
        }
        contacts.put(user.getId(), user);
        return true;
    }

    boolean isContact(User other) {
        return other != null && contacts.containsKey(other.getId());
    }

    void receivedAddRequest(AddRequest req) {
        receivedAddRequests.put(req.getFromUser().getId(), req);
    }

    void sentAddRequest(AddRequest req) {
        sentAddRequests.put(req.getToUser().getId(), req);
    }

    void removeAddRequest(AddRequest req) {
        receivedAddRequests.remove(req.getFromUser().getId());
        sentAddRequests.remove(req.getToUser().getId());
    }

    void requestAddUser(String accountName) {
        UserManager.getInstance().addUser(this, accountName);
    }

    void addConversation(PrivateChat conversation) {
        User other = conversation.getOtherParticipant(this);
        if (other != null) {
            privateChats.put(other.getId(), conversation);
        }
    }

    void addConversation(GroupChat conversation) {
        if (!groupChats.contains(conversation)) {
            groupChats.add(conversation);
        }
    }

    boolean sendMessageToUser(User to, String content) {
        if (to == null || content == null || content.isEmpty()) {
            return false;
        }
        // product rule: only message contacts (state if you allow open messaging)
        if (!isContact(to)) {
            return false;
        }

        PrivateChat chat = privateChats.get(to.getId());
        if (chat == null) {
            chat = UserManager.getInstance()
                    .createPrivateChat(this, to);
        }

        Message msg = new Message(content, new Date(), id);
        return chat.addMessage(msg);
    }

    boolean sendMessageToGroupChat(int groupId, String content) {
        GroupChat chat = null;
        for (GroupChat g : groupChats) {
            if (g.getId() == groupId) {
                chat = g;
                break;
            }
        }
        if (chat == null || !chat.hasParticipant(this)) {
            return false;
        }
        return chat.addMessage(new Message(content, new Date(), id));
    }
}
```

### UserManager

```java
class UserManager {
    private static UserManager instance;

    private final Map<Integer, User> usersById = new HashMap<>();
    private final Map<String, User> usersByAccountName = new HashMap<>();
    private final Map<Integer, User> onlineUsers = new HashMap<>();
    private int nextConversationId = 1;

    private UserManager() {
    }

    static UserManager getInstance() {
        if (instance == null) {
            instance = new UserManager();
        }
        return instance;
    }

    /** Register a brand-new account in the system. */
    User register(int id, String accountName, String fullName) {
        if (usersByAccountName.containsKey(accountName)) {
            return null;
        }
        User u = new User(id, accountName, fullName);
        usersById.put(id, u);
        usersByAccountName.put(accountName, u);
        return u;
    }

    /** A asks to add B by account name. */
    void addUser(User fromUser, String toAccountName) {
        User toUser = usersByAccountName.get(toAccountName);
        if (fromUser == null || toUser == null || fromUser.getId() == toUser.getId()) {
            return;
        }
        if (fromUser.isContact(toUser)) {
            return;
        }

        AddRequest req = new AddRequest(fromUser, toUser, new Date());
        fromUser.sentAddRequest(req);
        toUser.receivedAddRequest(req);
    }

    void approveAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        User from = req.getFromUser();
        User to = req.getToUser();
        from.addContact(to);
        to.addContact(from);
        req.setStatus(RequestStatus.Accepted);
        from.removeAddRequest(req);
        to.removeAddRequest(req);
    }

    void rejectAddRequest(AddRequest req) {
        if (req == null) {
            return;
        }
        req.setStatus(RequestStatus.Rejected);
        req.getFromUser().removeAddRequest(req);
        req.getToUser().removeAddRequest(req);
    }

    void userSignedOn(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.put(u.getId(), u);
        u.setStatus(new UserStatus(UserStatusType.Available, null));
    }

    void userSignedOff(String accountName) {
        User u = usersByAccountName.get(accountName);
        if (u == null) {
            return;
        }
        onlineUsers.remove(u.getId());
        u.setStatus(new UserStatus(UserStatusType.Offline, null));
    }

    PrivateChat createPrivateChat(User a, User b) {
        PrivateChat chat = new PrivateChat(nextConversationId++, a, b);
        a.addConversation(chat);
        b.addConversation(chat);
        return chat;
    }

    GroupChat createGroupChat(User creator, String ignoredTitleForSketch) {
        GroupChat chat = new GroupChat(nextConversationId++);
        chat.addParticipant(creator);
        creator.addConversation(chat);
        return chat;
    }

    boolean isOnline(int userId) {
        return onlineUsers.containsKey(userId);
    }
}
```

### Recorrido

```java
UserManager um = UserManager.getInstance();
User ana = um.register(1, "ana", "Ana Rao");
User ben = um.register(2, "ben", "Ben Cole");

um.userSignedOn("ana");
um.userSignedOn("ben");

ana.requestAddUser("ben");
// ben accepts the pending request from ana (in a real API, pull from received map)
AddRequest pending = /* ben's received request from ana */;
um.approveAddRequest(pending);

ana.sendMessageToUser(ben, "lunch at 1?");
// private chat now has one Message; both users share the same PrivateChat object
```

Lo que importa en la entrevista es el **grafo de objetos**: el manager posee el directorio, los usuarios poseen contactos y handles de chat, las conversaciones poseen el historial, el estado vive en el usuario.

---

## 5. Problemas duros (dílos si te sobra tiempo)

Son las preguntas clásicas de "¿qué dolería?" tras el diagrama de clases.

### ¿Cómo sabes si alguien está realmente online?

Los clientes pueden desaparecer sin un cierre limpio (sueño del portátil, proceso matado, red inestable). Trata la presencia como un **alquiler**:

* El cliente envía heartbeats con un temporizador.
* Si fallan heartbeats, pasa a Offline (o Away primero, luego offline).
* Nunca confíes solo en "el usuario pulsó cerrar sesión."

### Conflicto memoria vs base de datos

Los datos calientes (quién está online, sockets abiertos) viven en memoria del proceso. Los datos durables (cuentas, archivos) viven en una base de datos. Si discrepan, **lo durable suele ganar para el historial**, y **el último heartbeat gana para la presencia**. Diseña propiedad explícita para no doble-escribir sin regla.

### Escala

Un singleton `UserManager` no sirve a millones de usuarios concurrentes. Partes por rangos de user id o chat id, replicas con cuidado y aceptas que las solicitudes de amistad entre máquinas necesitan coordinación. Nombra el dolor: consistencia de listas de contactos y orden de mensajes entre máquinas.

### Abuso y denegación de servicio

Cualquier API que acepte tráfico de cliente puede inundarse: spam de solicitudes, mensajes enormes, thrash de join/leave. Limita tasa por usuario y por IP, tope de tamaño de mensaje y descarta o encola el exceso. Incluso en pizarra conviene mencionar topes.

### Garantías de entrega (bonus)

At-most-once es fácil y pierde mensajes. At-least-once necesita ids y des-duplicación en el cliente. Exactly-once es caro. En entrevistas de chat, "persistir y luego fan-out; el cliente reintenta con message id" es una frase sólida por defecto. Para arquitectura de producto a escala de la misma idea, ver [Diseñar un sistema de chat](/blog/es/design-chat-system).

---

## 6. Casos límite y errores comunes

Los entrevistadores tocan estos:

* **Añadirse a uno mismo** o **cuenta inexistente** → no-op o error claro.
* **Doble accept** de la misma solicitud → contactos correctos; sin chat privado duplicado.
* **Mensaje a no-contacto** → rechazar si esa es tu regla; dilas.
* **Cuerpo de mensaje vacío** → rechazar.
* **Mensaje de grupo de un no-miembro** → rechazar.
* **Sign-off sin sign-on** → remove es no-op seguro.
* **Dos chats privados para el mismo par** → crear una vez y reutilizar la entrada del mapa en ambos.

Errores comunes:

1. **Saltar a Kafka y balanceadores** antes de nombrar `User` y `Conversation`.
2. **Una clase Chat gigante** con flags private vs group en lugar de una jerarquía pequeña.
3. **Olvidar contactos mutuos** al aceptar (solo A obtiene a B).
4. **Poner todos los mensajes en User** en lugar de en la conversación que comparten.
5. **Mezclar presencia con entrega de mensajes** de forma que los offline rompan el modelo.
6. **Mano de networking silenciosa** cuando preguntan cómo B ve el mensaje de A: al menos di "notifica sesiones online; offline recupera del almacén después."

Ideas mínimas de humo:

```java
// after register + mutual accept
assert ana.isContact(ben);
assert ben.isContact(ana);
assert ana.sendMessageToUser(ben, "hi");
assert !ana.sendMessageToUser(ben, ""); // empty rejected
```

---

## 7. Explícaselo a un amigo

El OOD de Chat Server es un archivador acotado:

1. **User** guarda identidad de cuenta, estado, contactos, mapa de chat privado, lista de grupos y mapas de solicitudes.
2. **Conversation** es abstracta: id, participantes, mensajes. **PrivateChat** es un par fijo. **GroupChat** puede añadir y quitar gente.
3. **Message** es contenido, hora y emisor.
4. **AddRequest** más **RequestStatus** modelan amistades pendientes. Aceptar hace contactos mutuos.
5. **UserManager** es el directorio: registro, conjunto online, aprobar/rechazar, crear chats.
6. Follow-ups duros: presencia real (heartbeats), verdad memoria vs BD, escala y protección frente a abuso.

Si puedes dibujar User, Conversation, Message y el camino de solicitud de amistad en una pizarra, y recorrer un envío privado, dominas el 7.7 a profundidad de entrevista. El chat distribuido completo es una conversación larga de system design; este post mantiene el modelo de objetos honesto.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Jigsaw](/blog/es/ctci-7-6-jigsaw)
* Siguiente: [Othello](/blog/es/ctci-7-8-othello)