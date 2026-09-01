---
title: "Fine-tuning LoRA para LLMs: rangos, módulos objetivo y cuentas de memoria"
description: "Guía práctica de LoRA y QLoRA: cuándo los adapters ganan al fine-tune completo, cómo elegir rank y módulos, VRAM aproximada y fallos que te queman un fin de semana."
date: "2026-08-04"
tags: [IA y Machine Learning]
coverImage: /assets/images/lora-finetuning-guide.webp
previewImage: /assets/images/lora-finetuning-guide.webp
---


El fine-tune completo sigue ganando en algunos trabajos. En la mayor parte del trabajo de producto, es el default equivocado. **LoRA** congela los pesos base y entrena un par de matrices de bajo rango en cada capa elegida. **QLoRA** mantiene esa idea y carga el modelo base en 4 bits, así un modelo de 7B o 13B puede entrenar en una sola tarjeta de 24 GB.

Esta es la lista que uso antes de gastar horas de GPU.

---

## Cuándo LoRA es la herramienta correcta

Elige LoRA (o QLoRA) cuando:

1. **Tienes un modelo base fuerte** y solo necesitas estilo, formato, jerga de dominio o hábitos de tool-calling. Los checkpoints instruction-tuned de 7B-70B ya saben lenguaje. Estás guiando, no enseñando inglés desde cero.
2. **La VRAM es el límite.** AdamW completo sobre un 7B en FP16 es, a grandes rasgos, pesos + gradientes + dos estados del optimizador: unos 14 + 14 + 28 = **56 GB** antes de activaciones y KV cache. Una GPU de 24 GB no termina ese trabajo con holgura.
3. **Quieres muchos adapters baratos.** Una base congelada, N packs LoRA por cliente o producto. Cambias adapters al cargar. El fine-tune completo te obliga a guardar y servir N copias enteras.
4. **Los datos son pequeños o medianos.** Miles a cientos de miles de ejemplos es el rango habitual de LoRA. Si tienes un corpus de dominio de miles de millones de tokens y te importa la calidad máxima, el full (o el continued pretrain) sigue teniendo sitio.

Salta LoRA cuando necesitas un cambio profundo de capacidad: idiomas casi sin cobertura en el pretrain, saltos grandes de razonamiento multi-paso, o cirugía de arquitectura. El bajo rango no inventa capacidad que la base nunca tuvo.

---

## Qué entrena LoRA de verdad

Para una matriz de pesos congelada \(W \in \mathbb{R}^{d \times k}\), LoRA aprende \(A \in \mathbb{R}^{r \times k}\) y \(B \in \mathbb{R}^{d \times r}\) y el forward pasa a ser \(W x + B A x\) (con un factor de escala \(\alpha / r\)).

El conteo entrenable por matriz es \(r(d + k)\). Para proyecciones de atención con \(d = k = 4096\) y rank \(r = 16\):

\[
16 \times (4096 + 4096) = 131{,}072 \text{ parámetros}
\]

Es minúsculo frente a una matriz completa 4096x4096 (16.7M pesos). En todas las capas objetivo sueles quedar en **0.1% a 2%** de los parámetros base, y por eso el estado del optimizador cabe al fin.

**QLoRA** (Dettmers et al., 2023) cuantiza los pesos base a **NF4**, puede double-quantizar las constantes, y usa optimizadores paged para que los picos del optimizador no hagan OOM. Los adapters siguen entrenándose en mayor precisión (normalmente BF16/FP16).

---

## Rank: empieza bajo, mide y luego sube

| Rank | Uso típico | Notas |
|---|---|---|
| 4-8 | Estilo, tono de chat, formato ligero | Rápido, poco riesgo de overfit en sets pequeños |
| 16 | Primer intento por defecto para SFT de instrucción / dominio | Buen equilibrio calidad / coste en 7B-13B |
| 32-64 | Cambio de dominio más duro, adapters multi-tarea | Más VRAM y más datos |
| 128+ | Rara vez hace falta en SFT | A menudo cuesta casi como un full sin igualarlo |

Regla práctica: **rank 16, alpha 32** (alpha = 2r) es un punto de partida sano en modelos tipo Llama. Si las evals se estancan y los datos están limpios, sube a 32 o 64. Si el train loss se hunde y la eval empeora, el rank (o el learning rate) es demasiado agresivo para el tamaño del set.

Alpha escala la contribución del adapter. Elige alpha fijo o alpha = 2r, mantén ese esquema fijo mientras barres rank y registra ambos valores. Cambiar los dos a la vez vuelve inútiles las ablaciones.

---

## Los módulos objetivo importan más de lo que se admite

Los papers clásicos de LoRA a menudo adaptaban solo **query y value**. Es más barato. En LLMs decoder modernos, adaptar **todas las proyecciones lineales de atención y MLP** suele ganar:

```
# Nombres estilo Llama (PEFT / Hugging Face)
target_modules = [
  "q_proj", "k_proj", "v_proj", "o_proj",
  "gate_proj", "up_proj", "down_proj",
]
```

Si la VRAM aprieta, quita primero el MLP y deja la atención. Si la calidad no se mueve, añade módulos antes de saltar el rank de 16 a 128. La cobertura de módulos suele mover la aguja más que un aumento ciego de rank.

No olvides **embedding / lm_head** cuando la tarea añade muchos tokens nuevos (tags de tools, códigos de dominio). Déjalas congeladas salvo que el comportamiento a nivel de token salga mal.

---

## Cuentas de memoria en una servilleta

VRAM estacionaria aproximada para un denso de **7B** (orden de magnitud, no un profiler):

| Setup | Pesos base | Entrenables + estados Adam | Total orientativo* |
|---|---|---|---|
| Full FT, FP16 | ~14 GB | ~42 GB | **56 GB+** |
| LoRA r=16, base FP16 | ~14 GB | cientos de MB | **16-20 GB** |
| QLoRA 4-bit + LoRA | ~3.5-4.5 GB | cientos de MB | **6-12 GB** |

\*Activaciones, longitud de secuencia, batch size y gradient checkpointing dominan el resto. Contexto largo (4k-8k) con micro-batches grandes aún hará OOM un setup que "cabe en teoría".

Cuando vas justo de memoria: `gradient_checkpointing=True`, micro-batch 1-2 con acumulación, empaquetar o agrupar por longitud, preferir BF16 en Ampere+, y para QLoRA usar bitsandbytes NF4 más double quant.

Un SFT QLoRA de 13B con rank 16 y longitud 2048 suele caber en una GPU de 24 GB. Un trabajo QLoRA de 70B pide multi-GPU u offload.

---

## Fallos habituales (y los arreglos aburridos)

**1. Colapso de estilo o bucles de "solo soy un modelo de lenguaje"**  
Learning rate demasiado alto, o entrenaste un set minúsculo demasiadas épocas. Empieza cerca de **1e-4 a 2e-4** para LoRA (a menudo más alto que full FT). Early stop en un set aparte. Una a tres épocas bastan en muchos SFT.

**2. El train loss se ve genial, la eval de producto es basura**  
Desajuste de plantilla. Entrena con la plantilla de chat y el system prompt **exactos** que usarás en inferencia. Si producción envuelve tools en XML y el training usó texto plano, el adapter aprende la forma superficial equivocada.

**3. OOM en el paso 1 con QLoRA**  
No son los adapters. Memoria de activación o un pico de optimizador sin paging. Activa gradient checkpointing, baja `max_seq_length`, habilita AdamW paged y confirma que no estás descongelando el modelo entero por accidente.

**4. El adapter no hace nada tras el merge**  
Nombres incorrectos en `target_modules` para la arquitectura, o guardaste solo el estado del optimizador. Imprime el conteo de parámetros entrenables al arrancar. Si es cero o ridículamente bajo, para antes del job nocturno.

**5. Overfit de unos cientos de ejemplos a rank 64**  
Usa dropout en capas LoRA (0.05-0.1), baja el rank, diversifica datos o early stopping fuerte según eval. Rank alto no es capacidad gratis; es capacidad gratis para memorizar.

**6. Multi-GPU más lento que una GPU**  
Overhead de comunicación y tensores entrenables minúsculos. En jobs LoRA pequeños, una sola tarjeta fuerte con acumulación suele ganar a un DDP mal escalado.

---

## Una forma mínima de entrenamiento que funciona

```python
from peft import LoraConfig, get_peft_model, TaskType

config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)
model = get_peft_model(model, config)
model.print_trainable_parameters()
```

Empaqueta los datos a la plantilla de chat, enmascara tokens del prompt si solo quieres loss de completion, evalúa cada N pasos en tareas reales (no solo perplexity) y exporta el adapter más un checkpoint merged si el serving no carga PEFT en runtime.

---

## Conclusión práctica

LoRA no sustituye la calidad de los datos. Gasta presupuesto de GPU en las rebanadas de la red que mueven tu métrica de producto. Empieza con **QLoRA + rank 16 + módulos completos de atención/MLP** sobre una base instruction fuerte. Mide con los mismos prompts que envías a producción. Sube rank o descongela más solo cuando la eval diga que necesitas capacidad.

Si el fine-tune completo sigue ganando en tu suite offline y puedes pagar el hardware, úsalo. Si no, publica el adapter y deja la base congelada.

