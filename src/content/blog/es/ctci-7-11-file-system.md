---
title: "File System: árbol en memoria con Entry, File y Directory (Java)"
description: "Problema estilo CTCI 7.11 para principiantes: diseñar un sistema de archivos en memoria. Base Entry compartida, hojas File, nodos Directory, tamaño recursivo y rutas en Java."
date: "2025-11-09"
tags: [Algoritmos y Estructuras, Herramientas y Políticas Tech, Diseño de Sistemas y Arquitectura]
coverImage: /assets/images/ctci-7-11-file-system.webp
previewImage: /assets/images/ctci-7-11-file-system.webp
---


> **TL;DR**
> * **El Problema:** Optimización de complejidad temporal y espacial para estructuras de datos clave.
> * **El Enfoque:** Problema estilo CTCI 7.11 para principiantes: diseñar un sistema de archivos en memoria. Base Entry compartida, hojas File, nodos Directory, tamaño recursivo y rutas en Java.
> * **Complejidad:** Relación óptima de tiempo y espacio con gestión de casos límite.

En la entrevista te dicen: diseña un **sistema de archivos en memoria**. Sin drivers de disco. Sin asignación de bloques. Solo los objetos y algoritmos para carpetas y archivos en RAM, con un boceto de código pequeño.

Esto es diseño orientado a objetos, no un tutorial de kernel. La forma clásica es un **árbol**: base compartida `Entry`, hojas `File` y nodos `Directory` que guardan más entradas. Este post es enseñanza original para principiantes en **Java**. Misma familia de preguntas OOD de entrevista, no una copia de libro. Parte de la [serie CTCI en Java](/blog/es/ctci-series-guide). Capítulo 7, diseño orientado a objetos.

---

## 1. Analogía cotidiana

Piensa en un archivador físico.

* Una **carpeta** puede guardar papeles y otras carpetas.
* Un **papel** guarda texto. No guarda otras carpetas.
* Cada ítem tiene **nombre**, vive dentro de una carpeta padre (salvo el cajón raíz) y se creó o se tocó en algún momento.
* El **tamaño** de un papel es lo largo del texto. El tamaño de una carpeta es la suma de todo lo de dentro, incluidas carpetas anidadas.

Ese archivador es un árbol. La raíz es el cajón de arriba. Rutas como `docs/notes/todo.txt` son paseos por hijos con nombre. Borrar un papel es pedir a su carpeta padre que lo quite. Renombrar es cambiar el nombre (y quizá reindexar un mapa de hijos).

No diseñas discos duros. Modelas ese archivador con clases.

---

## 2. Problema en palabras llanas

**Objetivo:** explicar las estructuras de datos y los algoritmos de un **sistema de archivos en memoria** simple, e ilustrar con código donde ayude.

**Conceptos centrales:**

* **File:** blob con nombre de contenido (en el boceto, un `String` basta) más un tamaño.
* **Directory:** contenedor con nombre de entradas hijas (archivos y subdirectorios).
* **Metadatos compartidos:** nombre, padre, tiempos de creación / última actualización / último acceso.
* **Operaciones esperadas:** crear, borrar, renombrar, ruta completa, calcular tamaño, listar hijos, quizá contar archivos.

**Aclara en la entrevista:**

* ¿Solo en memoria? Sí en este problema. Persistencia fuera de alcance salvo que la pidan.
* ¿Enlaces suaves/duros, permisos, usuarios? Buenos seguimientos. Empieza sin ellos.
* ¿Mayúsculas, caracteres inválidos, longitud máxima de ruta? Menciónalo y elige reglas simples.
* ¿Nombres únicos por directorio? Sí: dos hijos del mismo padre no deben compartir nombre.
* La raíz no tiene padre. Borrar la raíz se prohíbe o es un caso especial.

**Forma de la jerarquía de tipos:**

```
Entry (abstract)
  ├── File
  └── Directory  (holds List or Map of Entry)
```

`size()` es abstracto en `Entry`. Los archivos devuelven su propio tamaño. Los directorios suman hijos.

---

## 3. Pensar antes de codificar

### Por qué una base compartida

Archivos y directorios tienen nombre, padre y marcas de tiempo. Ambos necesitan borrar y ruta completa. Duplicar eso en dos clases sin relación es ruido. Pon estado y comportamiento compartido en `Entry`. Haz `size()` abstracto para que cada tipo responda distinto.

Composición sola (un nodo con un flag de tipo) también vale. La herencia es la versión de enseñanza habitual porque `instanceof` y el polimorfismo aparecen al recorrer hijos.

### Enlaces del árbol

* **Puntero al padre** en cada entrada (null en la raíz): facilita `getFullPath()` y `delete()`.
* **Colección de hijos** solo en `Directory`.
* Usa `ArrayList<Entry>` si te importa el orden de inserción y el código simple.
* Usa `HashMap<String, Entry>` por nombre si quieres búsqueda O(1) del hijo (mejor para resolver rutas).

Un buen default de entrevista: `Map<String, Entry>` para hijos, y nota de que puedes guardar una lista si necesitas orden estable extra.

### Resolución de rutas

Parte la ruta por `/`. Empieza en la raíz (o en el directorio de trabajo). Por cada segmento, busca el hijo. Falla si falta un segmento o si intentas entrar en un archivo como si fuera directorio.

Ruta absoluta: desde la raíz. Relativa: desde un directorio dado. Cualquiera vale si lo dices.

### Tamaño y número de archivos

`size()` del directorio recorre el subárbol y suma. Es O(subárbol) salvo que **cachees** tamaños y actualices al mutar (seguimiento de optimización).

`numberOfFiles()` puede contar solo archivos, o archivos más directorios. Di cuál. Un recorrido recursivo basta para el boceto.

### Alternativa: dos listas en Directory

Puedes tener `List<File>` y `List<Directory>` por separado. Contar es más limpio (sin `instanceof`), pero ordenar mixtos por nombre o fecha se complica. Una lista de `Entry` es más simple para "listar todo".

### Lo que no estás construyendo

Mapas de bloques, tablas de inodos, journaling, bloqueos concurrentes entre montajes. Si quieren profundidad de SO, pregunta qué capa. Para 7.11, el modelo de objetos del árbol es la victoria.

### Boceto en la pizarra

1. Dibuja `Entry` con `name`, `parent`, tiempos, `size()` abstracto, `delete()`, `getFullPath()`.
2. Dibuja `File` con `content` y tamaño fijo o guardado.
3. Dibuja `Directory` con mapa de hijos, `addEntry`, `deleteEntry`, `size` recursivo.
4. Camina un árbol de ejemplo: `/home/notes.txt` y muestra ruta y tamaño.

---

## 4. Solución en Java

Versión limpia de enseñanza. Los hijos viven en un `LinkedHashMap` para búsqueda rápida y orden de inserción estable.

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

Recorrido del árbol de demo:

| Paso | Estructura | Notas |
| --- | --- | --- |
| inicio | `root` | padre null |
| add | `root/home` | directorio |
| add | `home/docs`, `home/README.md` | hijos mixtos |
| add | `docs/notes.txt` | hoja archivo |
| write | contenido notes `"buy milk"` | tamaño pasa a 8 |
| path | `notes.getFullPath()` | sube padres con `/` |
| size | `home.size()` | suma recursiva de archivos debajo |
| resolve | `/home/docs/notes.txt` | lookups del mapa por segmento |
| delete | `notes.delete()` | el padre quita por nombre |

---

## 5. Tabla de complejidad

| Operación | Tiempo | Espacio extra | Notas |
| --- | --- | --- | --- |
| `addEntry` / `deleteEntry` / `getChild` | O(1) promedio | O(1) | con `HashMap` / `LinkedHashMap` por nombre |
| `getFullPath` | O(profundidad) | O(profundidad) al armar el string | caminar padres |
| `size()` en un directorio | O(tamaño del subárbol) | O(profundidad) recursión | se puede cachear si calienta |
| `numberOfFilesOnly` | O(tamaño del subárbol) | O(profundidad) | mismo estilo de recorrido |
| `resolve(path)` | O(segmentos) lookups de mapa | O(1) además del split | falla pronto si falta un hijo |
| Árbol completo | - | O(n) entradas | n = archivos + directorios |

Les importa que elegiste un árbol, metadatos compartidos y tamaño recursivo, no micro-optimizar cachés de ruta.

---

## 6. Casos límite y errores comunes

Suelen pinchar aquí:

* **Borrar la raíz:** `parent == null`, así que `delete()` devuelve false. Sin NPE.
* **Nombres duplicados** en un directorio: rechaza al añadir, o define sobrescritura al inicio.
* **Borrar mientras iteras hijos:** quita por nombre del mapa; no confíes solo en identidad de lista.
* **Nombre de raíz vacío:** el formato de ruta puede empezar con `/` + nombre del hijo. Sé consistente.
* **Entrar en un archivo:** `resolve` debe parar o fallar si un segmento no directorio no es el último.
* **Ciclos:** las APIs normales de create no ponen un directorio como ancestro de sí mismo. Si añades `move`, comprueba ciclos.
* **Contenido null:** trátarlo como string vacío; tamaño 0.
* **Árboles profundos:** `size()` recursivo puede reventar la pila; menciona recorrido iterativo como endurecimiento.

Errores comunes:

1. **Sin base compartida.** Pegar timestamps en File y Directory y olvidar un método.
2. **Tamaño de directorio = solo hijos directos.** A menudo quieren el total recursivo de bytes.
3. **Lista sin nombres únicos.** Dos `notes.txt` en la misma carpeta y la búsqueda queda ambigua.
4. **No limpiar el padre al borrar.** El huérfano sigue apuntando a un directorio que ya no lo lista.
5. **Montar un SO completo.** Bloques, permisos y montajes antes de tener un árbol que funcione.
6. **Solo un mapa plano de archivos.** Eso es un almacén clave-valor, no un sistema jerárquico.

Idea mínima de smoke:

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

## 7. Resumir a un amigo

Diseño de sistema de archivos en memoria, versión entrevista:

1. Modela un **árbol**, no un disco.
2. Campos compartidos en **`Entry`** abstracto: nombre, padre, tiempos, `delete`, `getFullPath`, `size()` abstracto.
3. **`File`** guarda contenido y devuelve su tamaño.
4. **`Directory`** guarda un mapa de hijos, suma tamaños en recursión, añade y quita entradas.
5. Las rutas son paseos: partir por `/`, buscar cada nombre, fallar limpio si falta.
6. Empieza simple. Enlaces, permisos y tamaños cacheados son seguimientos cuando el árbol ya es sólido.

Si dibujas la jerarquía, explicas por qué `size()` es polimórfico y muestras add/delete/path en un ejemplo pequeño, dominas el 7.11.

---

## Serie

* Guía: [guía de la serie CTCI](/blog/es/ctci-series-guide)
* Anterior: [Minesweeper](/blog/es/ctci-7-10-minesweeper)
* Siguiente: [Hash Table](/blog/es/ctci-7-12-hash-table)