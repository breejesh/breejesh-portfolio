---
title: "Servidor de Chat: Arquitectura Orientada a Objetos y Mensajería Escalable (CTCI 7.7)"
description: "Disena los componentes backend, clases y estructuras de datos para un servidor de chat en tiempo real con chats individuales y grupales."
date: "2026-05-06"
tags: [Algoritmos y Estructuras]
coverImage: /assets/images/ctci-7-7-chat-server.webp
previewImage: /assets/images/ctci-7-7-chat-server.webp
---

> **TL;DR**
> * **El Problema del Libro:** Explica como disenarias un servidor de chat. Proporciona detalles sobre los componentes backend, clases y metodos. ¿Cuales serian los problemas mas dificiles de resolver?
> * **La Solución Óptima:** Modelo Polimorfico de Conversacion: (1) Clase abstracta `Conversation` extendida por `PrivateChat` (2 participantes) y `GroupChat` (participantes dinamicos); (2) Entidad `Message` con emisor, contenido y marca de tiempo; (3) `UserManager` (Singleton) para gestion de cuentas, solicitudes de amistad y presencia online/offline; (4) Desafios mas complejos: sincronizacion de presencia masiva y entrega de mensajes offline.
> * **Realidad en Producción:** Pasarelas WebSocket en Slack/Discord y almacenamiento particionado en Cassandra.

## 1. Formulación del Problema del Libro

En *Cracking the Coding Interview* (Problema 7.7), se nos plantea:

*"Explica como disenarias un servidor de chat. Detalla los componentes backend, clases, metodos y los desafios tecnicos mas complejos."*

## 2. Arquitectura Orientada a Objetos

1. **`User`:** Identidad, estado de conexion, mapa de conversaciones privadas y chats grupales.
2. **`Conversation`:** Clase base con historial de mensajes y participantes. Subclases `PrivateChat` y `GroupChat`.
3. **`Message`:** Contenido textual, fecha y remitente.
4. **`UserManager`:** Orquestador de autenticacion, listado de usuarios activos y enrutamiento de sockets.

## Implementación de Producción

```java
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ChatServerDesign {
    public enum UserStatusType { Offline, Away, Idle, Available, Busy }

    public static class Message {
        private final String content;
        private final Date date;
        private final int senderId;

        public Message(String content, Date date, int senderId) {
            this.content = content;
            this.date = date;
            this.senderId = senderId;
        }

        public String getContent() { return content; }
        public Date getDate() { return date; }
        public int getSenderId() { return senderId; }
    }

    public static abstract class Conversation {
        protected List<User> participants = new ArrayList<>();
        protected List<Message> messages = new ArrayList<>();

        public List<Message> getMessages() { return messages; }
        public boolean addMessage(Message m) {
            messages.add(m);
            return true;
        }
    }

    public static class PrivateChat extends Conversation {
        public PrivateChat(User user1, User user2) {
            participants.add(user1);
            participants.add(user2);
        }
    }

    public static class GroupChat extends Conversation {
        public void addParticipant(User user) { participants.add(user); }
        public void removeParticipant(User user) { participants.remove(user); }
    }

    public static class User {
        private final int id;
        private final String accountName;
        private UserStatusType status = UserStatusType.Offline;
        private final Map<Integer, PrivateChat> privateChats = new HashMap<>();

        public User(int id, String accountName) {
            this.id = id;
            this.accountName = accountName;
        }

        public int getId() { return id; }
        public void setStatus(UserStatusType type) { this.status = type; }

        public boolean sendMessageToUser(User toUser, String content) {
            PrivateChat chat = privateChats.get(toUser.getId());
            if (chat == null) {
                chat = new PrivateChat(this, toUser);
                privateChats.put(toUser.getId(), chat);
                toUser.privateChats.put(this.id, chat);
            }
            return chat.addMessage(new Message(content, new Date(), this.id));
        }
    }

    public static class UserManager {
        private static UserManager instance;
        private final Map<Integer, User> usersById = new HashMap<>();
        private final Map<Integer, User> onlineUsers = new HashMap<>();

        public static synchronized UserManager getInstance() {
            if (instance == null) instance = new UserManager();
            return instance;
        }

        public void userSignedOn(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Available);
                onlineUsers.put(userId, user);
            }
        }

        public void userSignedOff(int userId) {
            User user = usersById.get(userId);
            if (user != null) {
                user.setStatus(UserStatusType.Offline);
                onlineUsers.remove(userId);
            }
        }
    }
}
```

## Análisis de Complejidad y Memoria

| Métrica | Complejidad | Detalle Técnico |
|---|---|---|
| Enviar Mensaje | `O(1)` | Acceso a tabla hash e insercion en lista. |
| Actualización de Presencia | `O(1)` | Insercion/eliminacion directa en mapa de usuarios en linea. |
| Espacio Auxiliar | `O(M + U)` | Memoria para mensajes y cuentas de usuario. |

## Discusión de Ingeniería de Sistemas en Producción

### Desafíos Técnicos en Producción

1. **Difusión de Presencia a Gran Escala:** El inicio de sesion de un usuario con miles de contactos requiere canales de publicacion/suscripcion distribuidos (Redis / Kafka) para evitar sobrecargar los sockets.
2. **Mensajería Fuera de Línea:** Almacenamiento persistente en Cassandra particionado por identificador de destinatario para recuperacion sincronizada.

## Casos Límite y Robustez en Producción

1. **Destinatario desconectado:** El mensaje se guarda en el historial de la conversacion sin bloquear la llamada.
