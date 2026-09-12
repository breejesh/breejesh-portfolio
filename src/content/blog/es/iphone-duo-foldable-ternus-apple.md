---
title: "iPhone Duo: el nuevo CEO de Apple abrió su primera keynote doblando el teléfono"
description: "John Ternus usó su primer evento en Apple para lanzar el iPhone Duo de 1.999 dólares, un plegable de 7,6 pulgadas con soporte para Apple Pencil y apps en pantalla dividida. El hardware llega tarde a propósito. Las consecuencias para los desarrolladores llegan el 23 de octubre."
date: "2026-09-12"
tags: [Hardware y Semiconductores, Negocios Tech y Finanzas]
coverImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
previewImage: /assets/images/iphone-duo-foldable-ternus-apple.webp
---

> **TL;DR**
> * **El detonante:** El 9 de septiembre, en la primera keynote de John Ternus como CEO de Apple, la compañía lanzó el iPhone Duo: un plegable del tamaño de un pasaporte con pantalla interior de 7,6 pulgadas, exterior de 5,4, un A20 Pro en proceso de 2 nm, soporte para Apple Pencil y dos apps lado a lado. Precio: de 1.999 a 3.199 dólares.
> * **La clave:** Apple sigue su manual más antiguo. Deja que una categoría exista durante años (Samsung vende plegables desde 2019), espera a que el pliegue, la bisagra y la batería dejen de ser excusas, y entonces entra por la parte alta del precio y fija los estándares.
> * **La perspectiva:** El Duo no será un producto de volumen el primer año. Su efecto real está en el software: por primera vez, las apps de iPhone deben manejar un lienzo del tamaño de una tableta, pantalla dividida y un lápiz. Las reservas abren el 16 de octubre, y las apps que todavía asumen un ancho vertical fijo se verán rotas en el teléfono más caro de Apple.

Tim Cook pasó a ser presidente ejecutivo el 1 de septiembre. Ocho días después, su sucesor salió al escenario, repasó el iPhone 18 Pro, los nuevos Watch y AirPods, y luego dijo las tres palabras que las keynotes de Apple habían retirado en silencio: "one more thing".

Y entonces dobló el teléfono.

Cuesta exagerar lo coherente que es esto con Ternus. Pasó la mayor parte de su carrera dirigiendo la ingeniería de hardware. Su primer gran momento como CEO no es una demo de IA ni una cifra de servicios. Es una bisagra.

---

## Qué lanzó Apple exactamente

| Especificación | iPhone Duo |
| --- | --- |
| Pantalla interior | 7,6 pulgadas Super Retina XDR, recubrimiento nanotexturizado para disimular el pliegue |
| Pantalla exterior | 5,4 pulgadas |
| Chip | A20 Pro (2 nm), 12 GB de RAM |
| Cámaras | Principal de 48 MP (f/1.6), ultra gran angular de 48 MP (f/2.2) |
| Batería y carga | 4.883 mAh, 35 W por cable, 25 W MagSafe |
| Biometría | Touch ID en el botón lateral |
| Entrada | Soporte para Apple Pencil, una primicia en iPhone |
| Multitarea | Dos apps lado a lado, o dos ventanas del mismo sitio |
| Precio | 1.999 $ (256 GB) a 3.199 $ (2 TB) |
| Fechas | Reservas el 16 de octubre, disponibilidad el 23 de octubre |

Dos detalles de esa lista dicen más que el resto.

**Vuelve Touch ID.** Apple no ha explicado la decisión, pero la razón probable es física: un módulo de Face ID es profundo, y un teléfono tiene que ser muy delgado para doblarse por la mitad. El sensor en el botón lateral que Apple ya usa en los iPad evita sacrificar el grosor o la pantalla interior.

**El panel interior nanotexturizado.** El pliegue ha sido la queja más común sobre los plegables. Apple no dijo haberlo eliminado. Eligió un recubrimiento mate que lo hace menos visible. Es un intercambio muy de Apple: sacrificar algo de contraste para ganar mucho acabado percibido.

---

## Tarde a propósito

Samsung vende plegables desde 2019. Huawei presumió esa misma semana de su Mate XT2 de triple pliegue con el Kirin 9050 Pro de diseño propio. Según los estándares de la categoría, Apple llega siete años tarde.

Eso es el plan, no el problema. El patrón es conocido:

| Categoría | El pionero lanzó | Apple entró | Punto de entrada de Apple |
| --- | --- | --- | --- |
| Reproductores MP3 | Finales de los 90 | 2001 (iPod) | Premium, con una mejor historia de sincronización |
| Smartphones | Principios de los 2000 | 2007 (iPhone) | Premium, con una mejor historia táctil |
| Tabletas | Principios de los 2000 | 2010 (iPad) | Premium, con una historia de apps |
| Relojes inteligentes | 2013 | 2015 (Watch) | Premium, con una historia de salud |
| Plegables | 2019 | 2026 (Duo) | Premium, con una historia de Pencil y multitarea |

Cada vez, la pregunta no era "¿puede Apple construir esto?", sino "¿está la pila de componentes lo bastante madura para que la versión de Apple no parezca un prototipo?". Bisagras, vidrio ultrafino y silicio de 2 nm que no cocina un teléfono con dos pantallas cruzaron esa línea más o menos ahora.

Ben Wood, de CCS Insight, dijo que el Duo "siempre iba a eclipsar los demás anuncios de Apple en el evento". En el escenario es cierto. En la cuenta de resultados, el iPhone 18 Pro hará el trabajo pesado durante años. A partir de 1.999 dólares, el Duo es un dispositivo halo: sube el techo de lo que puede costar un iPhone y hace que el Pro parezca razonable en comparación.

---

## La verdadera historia es el lienzo

Esta es la parte que importa a cualquiera que publique software para iOS.

Durante dieciocho años, el iPhone fue un dispositivo de ancho fijo, una sola app y solo dedos. Las size classes y las safe areas se complicaron, pero una app de teléfono podía seguir asumiendo un lienzo vertical estrecho que cambiaba poco.

El Duo rompe tres de esas suposiciones a la vez:

1. **El ancho cambia mientras la app se ejecuta.** Al desplegar el teléfono, el lienzo pasa de 5,4 a 7,6 pulgadas. Si en esa transición se pierden el estado, la posición de scroll o un formulario a medio rellenar, los usuarios lo notarán al instante.
2. **Tu app ya no está sola.** La pantalla dividida significa que tu diseño puede ocupar la mitad de una pantalla de 7,6 pulgadas, junto a la app de otro. Los desarrolladores de iPad conocen ese mundo. La mayoría de los equipos que solo hacen iPhone nunca lo han probado.
3. **Existe un lápiz.** La entrada con Pencil en un teléfono abre anotaciones, firmas y campos de escritura a mano en lugares que nadie diseñó para ello.

La buena noticia es que Apple lleva tiempo preparando esto. Las apps que ya adoptaron diseños adaptativos para iPad y Stage Manager tienen casi todo hecho. La mala es que muchas apps de iPhone, sobre todo las multiplataforma con breakpoints fijos, se verán estiradas o con bandas negras en el iPhone más caro jamás vendido, ante los clientes con más probabilidades de quejarse.

**Una lista práctica antes del 23 de octubre:**

* Prueba el tamaño de la pantalla interior en el simulador, a pantalla completa y en anchos de pantalla dividida.
* Asegúrate de que plegar y desplegar conserva el estado de navegación y el texto introducido.
* Sustituye los breakpoints fijos por size classes o diseños basados en contenedores.
* Revisa cualquier pantalla con firma, anotación o superficie de dibujo para soportar Pencil.
* Comprueba las vistas de vídeo y cámara con las nuevas proporciones. Un reproductor vertical centrado en medio de un lienzo de 7,6 pulgadas parece un bug.

---

## Lo que esto dice de la era Ternus

Es pronto. Una keynote no es una estrategia. Pero la elección de con qué abrir es una señal.

Los últimos años de Apple estuvieron dominados por la pregunta de si iba por detrás en IA. El Duo no responde a esa pregunta. Cambia de tema hacia el único terreno donde Apple sigue claramente por delante: hardware integrado, silicio y diseño industrial a una escala que nadie más iguala. Un A20 Pro de 2 nm dentro de un teléfono que se dobla, con los rendimientos y márgenes de Apple, es tanto un argumento de cadena de suministro como un producto.

El riesgo es el obvio. Un plegable es un teléfono que miras más tiempo, en más contextos, con más métodos de entrada. Ahí es exactamente donde debería brillar un asistente. Si la inteligencia de software del Duo se siente como el mismo asistente del iPhone clásico, estirado a una pantalla más grande, el hardware habrá cumplido y el software habrá perdido el momento.

---

## Lo que queda

La frase "one more thing" solía presentar lo que cambiaba la categoría. Esta vez presentó a Apple uniéndose a una categoría que ya existe, años después que todos los demás.

No es una crítica. Así ha funcionado Apple siempre. La prueba no es la bisagra. Es si, para el próximo septiembre, las apps de la pantalla interior parecen hechas para ella o parecen estar esperando a que alguien vuelva a cerrar el teléfono.

---

## Fuentes

* [Fold the phone: Apple's new CEO unveils a foldable iPhone (NPR)](https://npr.org/2026/09/09/nx-s1-5961487/apple-duo-foldable-iphone-john-ternus)
* [iPhone Duo: Release Date and Pre-Orders (MacRumors)](https://www.macrumors.com/2026/09/10/iphone-duo-release-date-pre-orders/)
* [iPhone Duo launched: check price and specifications (TelecomTalk)](https://telecomtalk.info/iphone-duo-launched-check-price-and-specifications/1011691/)
* [iPhone Duo hands-on (Tom's Guide)](https://www.tomsguide.com/phones/iphones/iphone-duo-hands-on-apple-nailed-it-and-just-put-everyone-else-on-notice)
* [New iPhone lineup includes a foldable version called Duo (AP vía WCAX)](https://www.wcax.com/2026/09/10/new-iphone-lineup-includes-foldable-version-called-duo/)
* [Top Tech News Today, September 10, 2026 (TechStartups)](https://techstartups.com/2026/09/10/top-tech-news-today-september-10-2026-apple-anthropic-ibm-meta-openai-spacex-more/)
