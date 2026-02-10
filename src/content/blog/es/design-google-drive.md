---
title: "Diseñar Google Drive: cómo funciona una carpeta mágica en cada dispositivo"
description: "Almacenamiento estilo Google Drive para principiantes absolutos: subida, descarga, sync, trozos, versiones, compartir y qué pasa cuando dos móviles editan el mismo archivo sin red."
date: "2026-02-10"
tags: [Diseño de sistemas]
coverImage: /assets/images/design-google-drive.webp
previewImage: /assets/images/design-google-drive.webp
---


> **TL;DR**
> * **El Problema:** Diseñar arquitecturas escalables requiere equilibrar disponibilidad, rendimiento y complejidad operativa.
> * **La Clave:** Almacenamiento estilo Google Drive para principiantes absolutos: subida, descarga, sync, trozos, versiones, compartir y qué pasa cuando dos móviles editan el mismo archivo sin red.
> * **El Resultado:** Plano técnico con objetivos cuantitativos y mitigación de fallos en producción.

Imagina una carpeta mágica. Dejas una foto en el portátil. Abres el móvil en el bus y la misma foto ya está ahí. Editas una hoja de cálculo en el trabajo. En casa, la tableta muestra los números nuevos. No se siente como un "servidor". Se siente como una sola carpeta que vive en todas partes a la vez.

Eso es el producto cuando alguien dice "diseña Google Drive". Bajo el cristal no hay magia. Hay ingeniería cuidadosa alrededor de seis ideas: **subida (upload)**, **descarga (download)**, **sincronización (sync)**, **trozos (chunks)**, **versiones** y **compartir (share)**. Este post explica cada una como lo haría con un alumno brillante que nunca ha dibujado un diagrama de sistema.

Dejamos fuera la coedición en vivo (muchas personas escribiendo a la vez en un Google Doc). Eso es otro producto, más difícil. Aquí diseñamos una carpeta de archivos normales: PDFs, fotos, zips, documentos de oficina.

---

## La carpeta mágica, en lenguaje sencillo

Tus dispositivos no son el hogar real de los archivos. El hogar real es un sistema grande y cuidadoso en la nube. Cada móvil o portátil guarda una **copia** de los archivos que te importan (o una lista de ellos, si son enormes). Cuando cambias algo, el dispositivo se lo dice a la nube. Cuando la nube se entera de un cambio, se lo dice a tus otros dispositivos. La "carpeta que aparece en todas partes" es la ilusión creada por ese bucle.

Dos trabajos no deben fallar nunca:

1. **Los bytes no pueden desaparecer.** Si subes el vídeo de una boda, perderlo no es un bug. Es un desastre.
2. **Los nombres y "cuál es la versión más reciente" deben coincidir** en cada dispositivo al que le importe. Si el móvil dice que `presupuesto.xlsx` está vacío y el portátil tiene los números de la semana pasada, la gente creerá que se borraron datos aunque los bytes sigan a salvo.

Todo lo de abajo sirve a esos dos trabajos.

---

## Subida: meter un archivo en la nube

**Subida** significa: "toma este archivo de mi dispositivo y guárdalo con seguridad lejos de aquí."

Para un archivo pequeño (una nota de texto corta), la app puede enviar el archivo entero de una vez. Para un archivo grande (un vídeo de 2 GB con datos móviles inestables), un envío largo a menudo se rompe a mitad. Por eso los sistemas serios al estilo Drive usan una **subida reanudable**:

1. La app pregunta al servidor: "Quiero subir un archivo de este tamaño, con este nombre, en esta carpeta."
2. El servidor abre una **sesión** y responde: "De acuerdo. Envíame trozos. Si te desconectas, pregúntame hasta dónde llegamos."
3. La app envía el archivo en trozos. Si el Wi-Fi muere al 70%, se reconecta y sigue desde el 70%, no desde cero.

Antes de aceptar el cuerpo, el servidor comprueba reglas simples: ¿el usuario puede escribir aquí? ¿El archivo está bajo el límite de tamaño? ¿Queda cuota?

**Nota de clase:** nunca digas al usuario "subida completa" hasta que sean verdad dos cosas: los bytes del archivo están guardados con seguridad, y la fila de base de datos que apunta a esos bytes está guardada. Si solo salvas una de las dos, aparecen archivos fantasma o datos huérfanos.

---

## Descarga: traer un archivo de vuelta

**Descarga** es lo contrario: "dame los bytes de este archivo para abrirlo o guardarlo."

Los sistemas grandes rara vez empujan archivos enormes por los mismos servidores de API pequeños que gestionan el login y las listas de carpetas. Un patrón habitual es:

1. Tu app pregunta: "¿Puedo descargar el archivo X?"
2. La API comprueba permisos.
3. La API devuelve un enlace especial de corta vida (una **URL firmada**) hacia el gran almacén de archivos.
4. Tu app obtiene los bytes de ese almacén directamente.

Para apps de sync que ya tienen la mayor parte de un archivo, a menudo solo descargas las **piezas cambiadas** (ver trozos más abajo), no el archivo entero otra vez.

---

## Sync: mantener honestos a todos los dispositivos

**Sync** es el corazón de la carpeta mágica. Significa: después de que algo cambie en cualquier sitio, los demás sitios se ponen al día.

Una historia simple:

1. Renombras `viaje.jpg` a `paris.jpg` en el portátil.
2. El portátil dice a la nube: "este archivo ahora se llama paris.jpg."
3. La nube guarda ese hecho y avisa a tu móvil: "algo cambió en esta carpeta."
4. El móvil pide la lista de cambios, ve el renombre y actualiza el nombre local.

Si el móvil estaba sin red (modo avión), se perdió el aviso. Cuando vuelve online, dice: "la última vez que conocí el mundo era el cambio número 1200. ¿Qué pasó después?" La nube envía una lista de puesta al día. Ese número suele llamarse **cursor** o **change id**. Piénsalo como un marcapáginas en la historia de la carpeta.

Sync no es lo mismo que "enviarte el archivo por correo." Sync es continuo, automático y bidireccional (cuando el producto permite editar desde varios dispositivos).

---

## Trozos (chunks): partir archivos grandes en piezas

Volver a subir una presentación de 50 MB porque corregiste una errata es la forma de quemar datos móviles y paciencia.

Por eso el sistema a menudo **parte un archivo en trozos** (también llamados **bloques**). Un tamaño típico de clase es de unos pocos megabytes por trozo.

Imagina un tren largo de vagones. Cada vagón es un trozo. Cada vagón recibe una huella (un **hash**): un código corto calculado a partir de sus bytes exactos. Los mismos bytes siempre dan la misma huella.

Lo que guarda la nube:

- Los objetos de trozo crudos en un almacén enorme (object storage).
- Una receta para cada **versión** de un archivo: "la versión 7 de informe.pdf es el trozo A, luego B, luego C, en ese orden."

Cuando editas y solo cambia el medio:

1. La app vuelve a hashear los trozos nuevos.
2. Los trozos sin cambio ya viven en el almacén. No los subas otra vez.
3. Solo se suben las huellas nuevas.
4. Una receta nueva (versión 8) apunta a la nueva lista ordenada de huellas.

**Por qué importa:**

- **Delta sync:** envía solo lo que cambió.
- **Deduplicación:** si dos archivos comparten un trozo idéntico (misma huella), puedes guardar ese trozo una sola vez (al menos dentro de una cuenta).
- **Historial sin copias completas:** las versiones antiguas guardan sus recetas. Los trozos compartidos sin cambio no se duplican en cada versión.

Para abrir un archivo, el cliente lee la receta, descarga los vagones que le faltan y los pega en orden.

---

## Versiones: el rastro de deshacer

A la gente le encanta "necesito la copia del martes pasado." Un sistema al estilo Drive guarda **versiones** de un archivo.

Cada guardado con éxito puede crear una fila de versión nueva: quién la guardó, cuándo, tamaño, checksum y la lista ordenada de trozos. El árbol de carpetas apunta a la versión **actual** de cada nombre de archivo. Las versiones antiguas se quedan en el historial hasta que una política de retención las quite.

Regla de diseño importante: trata las versiones como **solo añadir**. No reescribas la receta antigua en el sitio. Apunta el archivo a una versión nueva cuando la nueva esté del todo lista. Así una subida a medias nunca se convierte en "el archivo oficial."

---

## Compartir: dejar entrar a otras personas

**Compartir** significa: "esta persona puede leer (o editar) este archivo o carpeta."

Detrás de escena eso es una **ACL** (lista de control de acceso): filas que dicen "el usuario B tiene rol escritor en la carpeta Proyectos." Cada descarga y cada lectura de metadata debe comprobar esas reglas. Un enlace de descarga firmado debe ser de corta vida y difícil de adivinar, o ligado a la persona correcta, para que un enlace filtrado no viva para siempre.

Compartir también afecta al sync. Cuando compartes una carpeta con un compañero, sus dispositivos deben empezar a enterarse de los cambios en esa carpeta. Cuando revocas el acceso, sus clientes deben dejar de recibir esos cambios (y pueden perder copias locales, según la política del producto).

---

## Conflicto: la historia de los dos móviles

Esta es la historia que uso en clase.

Tienes dos móviles. Ambos tienen la carpeta mágica. Ambos se quedan sin red en un vuelo. En el móvil A editas `notas.txt` y escribes "Comprar leche." En el móvil B editas el mismo `notas.txt` y escribes "Comprar huevos." Ningún móvil puede hablar con la nube todavía, así que cada uno cree que su edición está bien.

Aterrizáis. El móvil A se conecta primero y sube su versión. La nube la acepta. `notas.txt` en el servidor ahora dice "Comprar leche."

El móvil B se conecta e intenta subir "Comprar huevos." La nube mira el sello de versión (un **etag** o id de versión) y dice: "Tu base estaba vieja. Alguien ya guardó una versión más nueva."

¿Qué debe hacer el producto?

**Mala idea:** quedarse en silencio solo con la última subida. Quien usaba el móvil A pierde "Comprar leche" sin aviso. Eso se siente como pérdida de datos.

**Buena idea para archivos normales:** guardar las dos. El primer escritor gana como archivo principal. El segundo escritor conserva sus bytes como algo del estilo `notas (conflicto del móvil B).txt`, o la app muestra una pantalla clara de conflicto para que un humano elija o fusione a mano.

La fusión automática es razonable para texto puro con herramientas cuidadas. No es gratis para un `.xlsx` cualquiera o una foto. Así que para un Drive general, **copias de conflicto más elección del usuario** es honesto. La coedición con varios cursores en vivo es el otro producto que dejamos fuera de alcance.

La misma idea aplica si dos personas editan con red: el servidor serializa los commits. El primer guardado con éxito gana el puntero principal. Al perdedor se le dice que resuelva.

---

## Un dibujo simple del sistema

No necesitas cincuenta cajas. Necesitas unos pocos papeles:

```
Tus dispositivos (web, escritorio, móvil)
        |
   Balanceador de carga
        |
   Servidores API  ----  "¿Quién eres? ¿Cuál es el árbol de carpetas? ¿Quién puede editar?"
        |
   Base de metadata  (nombres, versiones, compartidos, historial de cambios)
        |
   Camino de trozos / bloques ---- Almacén de objetos (las piezas reales del archivo)
        |
   Camino de notificaciones  (despierta dispositivos: "algo cambió")
```

- **Servidores API** gestionan login, listar carpetas, iniciar subidas, compartir y "¿esta subida ha terminado?"
- **Object storage** guarda trozos duraderos. Está pensado para mantener bytes a salvo en varias máquinas y lugares.
- **Base de metadata** guarda la verdad sobre nombres, padres, versión actual y ACLs. Esta parte necesita un acuerdo fuerte: dos dispositivos no deben discrepar sobre "cuál es la última."
- **Notificaciones** (long poll, push o similar) despiertan clientes inactivos para que no machaquen "lista todo" cada segundo.

La versión de juguete del día uno puede ser un servidor de aplicación y una carpeta en disco. Muere cuando se llena el disco, se cae la máquina o tres dispositivos necesitan un abanico fiable de cambios. El dibujo de arriba es la forma adulta que esperan en entrevistas.

---

## Flujo de subida, de punta a punta (otra vez, despacio)

1. El cliente crea una sesión de subida (nombre, carpeta padre, tamaño).
2. El servidor registra una entrada pendiente y devuelve cómo enviar trozos.
3. El cliente sube trozos. El servidor los guarda en el almacén.
4. Cuando llegan todos los trozos y cuadran los checksums, el servidor escribe una receta de versión nueva y mueve el puntero del archivo hacia ella.
5. El servidor publica un evento de cambio.
6. Otros dispositivos se despiertan, tiran de la receta nueva, descargan solo los trozos que faltan y actualizan el archivo local.

Si el paso 4 falla después de que aterrizaron los trozos, un trabajo de limpieza borra después los trozos no usados. Nunca dejes el puntero principal a medias.

---

## Cómo se ve "bien"

| Objetivo | Significado sencillo |
| --- | --- |
| Durabilidad | Los archivos del usuario sobreviven a fallos de máquina |
| Metadata fuerte | Todo el mundo coincide en el nombre y la versión más recientes |
| Sync barato | Solo los trozos cambiados cruzan la red |
| Compartir justo | Permisos comprobados en cada acción sensible |
| Conflictos honestos | Sin sobrescrituras silenciosas cuando se encuentran dos ediciones |

Números aproximados de entrevista si te los piden: decenas de millones de usuarios diarios, cuotas gratis medidas en gigabytes por persona, cientos de subidas medias por segundo en todo el sistema, y mucha más cuota de almacenamiento de la que una sola base SQL debería guardar nunca como cuerpos crudos de archivo. Los blobs viven en object storage. Las bases de datos guardan hechos pequeños sobre esos blobs.

---

## Resumen para un amigo

Si tuvieras sesenta segundos en un café:

Google Drive es una **carpeta mágica** que parece vivir en cada dispositivo. En realidad, cada dispositivo guarda una copia, y un sistema en la nube es la fuente de verdad. **Subir** manda tu archivo arriba (en trozos si es grande, y reanudable si muere la red). **Descargar** lo trae de vuelta, a menudo con un enlace especial corto hacia un almacén de archivos. **Sync** es el bucle que dice a otros dispositivos "algo cambió" y les deja ponerse al día con un marcapáginas de los últimos cambios vistos. Los **trozos** parten archivos en piezas con huella para que un edit pequeño no reenvíe el archivo entero, y para que el historial reutilice piezas sin cambio. Las **versiones** son recetas de solo añadir de "cómo se veía el archivo al guardarlo." **Compartir** es una lista de permisos comprobada en cada apertura. Cuando **dos móviles editan sin red**, importan las dos ediciones: la primera en llegar al servidor se convierte en el archivo principal, y la segunda debería ser una copia de conflicto o una elección clara para un humano, nunca una pérdida silenciosa.

Protege los bytes. Ponte de acuerdo en lo último. Envía solo lo que cambió. Di la verdad cuando choquen dos ediciones.

Ese es el diseño.