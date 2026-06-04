/**
 * app.js — Generador de Horarios Universitarios
 *
 * Flujo:
 *   1. Carga de materias desde el backend al iniciar.
 *   2. El usuario selecciona materias y marca varios profesores por materia.
 *   3. "Calcular" llama al backend con {materiaId, profesoresIds[]}.
 *   4. Se muestran combinaciones ordenadas: sin choques primero, luego por puntaje.
 *   5. Cada combinación tiene su grilla Lunes–Sábado y botón "Ver Códigos".
 */

// ── Constantes de la grilla ────────────────────────────────────────────────

/**
 * Franjas horarias fijas de 1h30 cada una, de 07:00 a 19:00.
 * La etiqueta se muestra en la columna de hora de la tabla.
 */
const FRANJAS_HORARIO = [
    { inicio: '07:00', fin: '08:30' },
    { inicio: '08:30', fin: '10:00' },
    { inicio: '10:00', fin: '11:30' },
    { inicio: '11:30', fin: '13:00' },
    { inicio: '13:00', fin: '14:30' },
    { inicio: '14:30', fin: '16:00' },
    { inicio: '16:00', fin: '17:30' },
    { inicio: '17:30', fin: '19:00' },
];

/** Orden de días para las columnas de la grilla. */
const DIAS_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

/** Abreviaciones de días para el resumen de horario en el panel de selección. */
const DIAS_CORTOS = {
    LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
    JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb'
};

// ── Estado global ─────────────────────────────────────────────────────────

/** Lista de materias cargadas desde el backend. */
let todasLasMaterias = [];

// ── Inicialización ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', cargarMaterias);

// ── Carga de datos ────────────────────────────────────────────────────────

/** Obtiene las materias del backend y renderiza el panel de selección. */
async function cargarMaterias() {
    try {
        const respuesta = await fetch('/api/materias');
        todasLasMaterias = await respuesta.json();
        renderizarPanelSeleccion();
    } catch (error) {
        document.getElementById('lista-materias-seleccion').innerHTML =
            '<p style="color:#c2410c;padding:1rem">Error al cargar las materias. Verifica que el servidor esté activo.</p>';
    }
}

// ── Panel de selección ────────────────────────────────────────────────────

/**
 * Construye la grilla de tarjetas de materias.
 * Cada tarjeta tiene: checkbox de materia + nombre + badge de créditos.
 * Al marcar, se despliega la lista de profesores con checkboxes individuales.
 */
function renderizarPanelSeleccion() {
    const contenedor = document.getElementById('lista-materias-seleccion');
    contenedor.innerHTML = '';

    if (todasLasMaterias.length === 0) {
        contenedor.innerHTML = '<p class="texto-cargando">No se encontraron materias.</p>';
        return;
    }

    todasLasMaterias.forEach(materia => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'item-materia-seleccion';
        tarjeta.id = `tarjeta-mat-${materia.id}`;

        // ── Fila cabecera: checkbox + nombre + créditos ──────────────────
        const cabecera = document.createElement('div');
        cabecera.className = 'cabecera-materia';

        const cbMateria = document.createElement('input');
        cbMateria.type = 'checkbox';
        cbMateria.id = `cb-mat-${materia.id}`;
        cbMateria.addEventListener('change', () => toggleMateria(materia.id, cbMateria.checked));

        const lblMateria = document.createElement('label');
        lblMateria.htmlFor = `cb-mat-${materia.id}`;
        lblMateria.textContent = materia.nombre;

        const badgeCreditos = document.createElement('span');
        badgeCreditos.className = 'badge-creditos';
        badgeCreditos.textContent = (materia.creditos || '?') + ' cr.';

        cabecera.appendChild(cbMateria);
        cabecera.appendChild(lblMateria);
        cabecera.appendChild(badgeCreditos);

        // ── Zona de profesores (oculta hasta marcar la materia) ──────────
        const zona = document.createElement('div');
        zona.className = 'zona-profesores';
        zona.id = `zona-profs-${materia.id}`;

        // Barra de controles
        const controles = document.createElement('div');
        controles.className = 'controles-seleccion';

        const btnTodos = document.createElement('button');
        btnTodos.className = 'btn-xs';
        btnTodos.textContent = 'Todos';
        btnTodos.onclick = () => toggleTodosProfesores(materia.id, true);

        const btnNinguno = document.createElement('button');
        btnNinguno.className = 'btn-xs';
        btnNinguno.textContent = 'Ninguno';
        btnNinguno.onclick = () => toggleTodosProfesores(materia.id, false);

        const spanConteo = document.createElement('span');
        spanConteo.className = 'conteo-seleccionados';
        spanConteo.id = `conteo-${materia.id}`;
        spanConteo.textContent = `0 de ${materia.profesores.length}`;

        controles.appendChild(btnTodos);
        controles.appendChild(btnNinguno);
        controles.appendChild(spanConteo);

        // Lista de checkboxes de profesores (scrollable)
        const lista = document.createElement('div');
        lista.className = 'lista-checks-profesores';

        materia.profesores.forEach(prof => {
            const item = document.createElement('div');
            item.className = 'item-profesor-checkbox';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = `cb-prof-${prof.id}`;
            cb.className = `cb-prof-mat-${materia.id}`;
            cb.value = prof.id;
            cb.addEventListener('change', () => actualizarConteo(materia.id));

            const lbl = document.createElement('label');
            lbl.htmlFor = `cb-prof-${prof.id}`;
            lbl.style.cssText = 'cursor:pointer;flex:1;display:flex;align-items:baseline;gap:0.35rem;flex-wrap:wrap;';

            // Nombre limpio (sin el [código] que ya viene en el string)
            const nombreSpan = document.createElement('span');
            nombreSpan.className = 'nombre-prof';
            nombreSpan.textContent = limpiarNombreProfesor(prof.nombre);
            lbl.appendChild(nombreSpan);

            // Badge con el código del grupo
            const codigo = prof.codigoGrupo || extraerCodigo(prof.nombre);
            if (codigo) {
                const badgeCod = document.createElement('span');
                badgeCod.className = 'badge-codigo';
                badgeCod.textContent = codigo + (prof.tipo === 'lab' ? ' · Lab' : '');
                lbl.appendChild(badgeCod);
            }

            // Resumen de bloques horarios
            if (prof.bloques && prof.bloques.length > 0) {
                const horSpan = document.createElement('span');
                horSpan.className = 'horario-prof';
                horSpan.textContent = prof.bloques
                    .map(b => `${DIAS_CORTOS[b.dia] || b.dia} ${b.horaInicio}–${b.horaFin}`)
                    .join(', ');
                lbl.appendChild(horSpan);
            }

            item.appendChild(cb);
            item.appendChild(lbl);
            lista.appendChild(item);
        });

        zona.appendChild(controles);
        zona.appendChild(lista);

        tarjeta.appendChild(cabecera);
        tarjeta.appendChild(zona);
        contenedor.appendChild(tarjeta);
    });
}

// ── Interacción con checkboxes ────────────────────────────────────────────

/**
 * Muestra/oculta la lista de profesores y preselecciona todos al activar.
 */
function toggleMateria(materiaId, activa) {
    const zona    = document.getElementById(`zona-profs-${materiaId}`);
    const tarjeta = document.getElementById(`tarjeta-mat-${materiaId}`);
    zona.classList.toggle('visible', activa);
    tarjeta.classList.toggle('activa', activa);
    toggleTodosProfesores(materiaId, activa);
}

/** Marca o desmarca todos los checkboxes de profesores de una materia. */
function toggleTodosProfesores(materiaId, seleccionar) {
    document.querySelectorAll(`.cb-prof-mat-${materiaId}`)
        .forEach(cb => { cb.checked = seleccionar; });
    actualizarConteo(materiaId);
}

/** Actualiza el texto "X de Y" del contador de seleccionados. */
function actualizarConteo(materiaId) {
    const total = document.querySelectorAll(`.cb-prof-mat-${materiaId}`).length;
    const sel   = document.querySelectorAll(`.cb-prof-mat-${materiaId}:checked`).length;
    const span  = document.getElementById(`conteo-${materiaId}`);
    if (span) span.textContent = `${sel} de ${total}`;
}

// ── Generación de combinaciones ───────────────────────────────────────────

/** Recopila selecciones y solicita al backend generar todas las combinaciones. */
async function generarHorario() {
    const selecciones = [];

    todasLasMaterias.forEach(materia => {
        const cbMateria = document.getElementById(`cb-mat-${materia.id}`);
        if (!cbMateria?.checked) return;

        const profesoresIds = Array.from(
            document.querySelectorAll(`.cb-prof-mat-${materia.id}:checked`)
        ).map(cb => Number(cb.value));

        if (profesoresIds.length > 0) {
            selecciones.push({ materiaId: materia.id, profesoresIds });
        }
    });

    if (selecciones.length === 0) {
        alert('Selecciona al menos una materia con uno o más profesores.');
        return;
    }

    const btn = document.querySelector('.btn-generar');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Calculando…';
    btn.disabled = true;

    try {
        const resp = await fetch('/api/horario/generar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selecciones)
        });
        if (!resp.ok) { alert('Error al generar. Intenta de nuevo.'); return; }
        mostrarResultados(await resp.json());
    } catch (e) {
        alert('Error de conexión con el servidor.');
        console.error(e);
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ── Visualización de resultados ───────────────────────────────────────────

/**
 * Muestra el panel de resultados con el contador (esquina superior derecha),
 * aviso de límite si aplica, y las tarjetas de combinaciones.
 */
function mostrarResultados(respuesta) {
    const { combinaciones, totalPosibles, totalCalculadas } = respuesta;

    // Contador en la esquina superior derecha (texto pequeño)
    const sinChoques = combinaciones.filter(c => !c.tieneChoques).length;
    document.getElementById('contador-combinaciones').textContent =
        `${combinaciones.length} mostradas · ${sinChoques} sin choques · ${totalPosibles.toLocaleString()} posibles`;

    // Aviso de límite de cómputo
    const avisoEl = document.getElementById('aviso-limite');
    if (totalCalculadas < totalPosibles) {
        avisoEl.textContent =
            `⚠ Se evaluaron ${totalCalculadas.toLocaleString()} de ${totalPosibles.toLocaleString()} combinaciones posibles (límite de cómputo alcanzado). Puedes reducir la selección para ver más opciones.`;
        avisoEl.classList.remove('oculto');
    } else {
        avisoEl.classList.add('oculto');
    }

    // Panel visible
    const panel = document.getElementById('panel-resultados');
    panel.classList.remove('oculto');

    // Renderizar tarjetas
    const lista = document.getElementById('lista-combinaciones');
    lista.innerHTML = '';

    if (combinaciones.length === 0) {
        lista.innerHTML = '<div class="card" style="text-align:center;color:#6b7280;padding:2rem">No se generaron combinaciones. Verifica que los profesores tengan bloques horarios asignados.</div>';
    } else {
        combinaciones.forEach(c => lista.appendChild(crearTarjetaCombinacion(c)));
    }

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Construye la tarjeta DOM de una combinación.
 * Incluye: cabecera, descripción, choques (si los hay), grilla y botón "Ver Códigos".
 */
function crearTarjetaCombinacion(combinacion) {
    const tarjeta = document.createElement('div');
    tarjeta.className = `combinacion-card${combinacion.tieneChoques ? ' tiene-choques' : ''}`;

    // ── Cabecera ─────────────────────────────────────────────────────────
    const cab = document.createElement('div');
    cab.className = 'combinacion-cabecera';

    const numSpan = document.createElement('span');
    numSpan.className = 'combinacion-num';
    numSpan.textContent = `#${combinacion.indiceCombinacion}`;
    cab.appendChild(numSpan);

    // Badge "Mejor opción" solo en la primera sin choques
    if (combinacion.indiceCombinacion === 1 && !combinacion.tieneChoques) {
        const badge = document.createElement('span');
        badge.className = 'badge-mejor';
        badge.textContent = '★ Mejor opción';
        cab.appendChild(badge);
    }

    const puntaje = document.createElement('span');
    puntaje.className = 'combinacion-puntaje';
    puntaje.textContent = `Puntaje: ${combinacion.puntuacion.toFixed(1)}`;
    cab.appendChild(puntaje);

    const estado = document.createElement('span');
    estado.className = `combinacion-estado ${combinacion.tieneChoques ? 'estado-choque' : 'estado-ok'}`;
    estado.textContent = combinacion.tieneChoques ? '⚠ Con choques' : '✓ Sin choques';
    cab.appendChild(estado);

    tarjeta.appendChild(cab);

    // ── Descripción de profesores elegidos ───────────────────────────────
    if (combinacion.descripcionProfesores) {
        const desc = document.createElement('div');
        desc.className = 'combinacion-descripcion';
        // Limpiar los códigos entre corchetes del texto descriptivo
        desc.textContent = combinacion.descripcionProfesores.replace(/\s*\[[^\]]*\]/g, '');
        tarjeta.appendChild(desc);
    }

    // ── Advertencias de choque ───────────────────────────────────────────
    if (combinacion.tieneChoques && combinacion.choques.length > 0) {
        const choquesCont = document.createElement('div');
        choquesCont.className = 'combinacion-choques';
        combinacion.choques.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'advertencia-choque';
            // Limpiar nombre de profesor en el mensaje de choque
            div.innerHTML = `<span>⚠</span><span>${msg.replace(/\s*\[[^\]]*\]/g, '')}</span>`;
            choquesCont.appendChild(div);
        });
        tarjeta.appendChild(choquesCont);
    }

    // ── Grilla Lunes–Sábado ──────────────────────────────────────────────
    const contGrilla = document.createElement('div');
    contGrilla.className = 'contenedor-grilla';

    const tabla = document.createElement('table');
    tabla.className = 'grilla-horario';
    tabla.innerHTML = `<thead><tr>
        <th class="col-hora">Hora</th>
        <th>Lunes</th><th>Martes</th><th>Miércoles</th>
        <th>Jueves</th><th>Viernes</th><th>Sábado</th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    tabla.appendChild(tbody);
    contGrilla.appendChild(tabla);
    tarjeta.appendChild(contGrilla);

    renderizarGrillaEnTabla(combinacion.entradas, tbody);

    // ── Botón "Ver Códigos" ──────────────────────────────────────────────
    tarjeta.appendChild(crearSeccionCodigos(combinacion));

    return tarjeta;
}

/**
 * Rellena el <tbody> con una fila por cada franja horaria (07:00–19:00, bloques de 1h30).
 * Una entrada "ocupa" una franja si sus rangos se solapan.
 * El texto (nombre de materia y profesor) se muestra solo en el primer slot solapado.
 */
function renderizarGrillaEnTabla(entradas, tbody) {
    // Registro de qué (materia+profesor+día) ya mostró texto, para no repetir en slots continuos
    const textoMostrado = new Set();

    FRANJAS_HORARIO.forEach(franja => {
        const inicioFranja = horaAMinutos(franja.inicio);
        const finFranja    = horaAMinutos(franja.fin);

        const fila = document.createElement('tr');

        // Columna de hora
        const celdaHora = document.createElement('td');
        celdaHora.className = 'col-hora';
        celdaHora.textContent = franja.inicio;
        fila.appendChild(celdaHora);

        // Una columna por día
        DIAS_ORDEN.forEach(dia => {
            const celda = document.createElement('td');

            // Buscar entradas que se solapan con esta franja en este día
            const coincidentes = entradas.filter(e => {
                if (e.dia !== dia) return false;
                const ini = horaAMinutos(e.horaInicio);
                const fin = horaAMinutos(e.horaFin);
                // Solapamiento: ini < finFranja Y inicioFranja < fin
                return ini < finFranja && inicioFranja < fin;
            });

            if (coincidentes.length === 0) {
                fila.appendChild(celda);
                return;
            }

            // Resaltar con contorno naranja cuando hay choque
            if (coincidentes.length > 1) celda.classList.add('celda-choque');

            const entrada = coincidentes[0];
            // Clave única para controlar si ya se mostró el texto en este día
            const claveTexto = `${entrada.materiaId}-${entrada.profesorId}-${dia}`;
            const mostrarTexto = !textoMostrado.has(claveTexto);
            if (mostrarTexto) textoMostrado.add(claveTexto);

            const bloque = document.createElement('div');
            bloque.className = 'celda-bloque';
            bloque.style.background = entrada.color;

            if (mostrarTexto) {
                const n1 = document.createElement('span');
                n1.className = 'nombre-materia-grilla';
                n1.textContent = acortarTexto(entrada.materiaNombre, 22);

                const n2 = document.createElement('span');
                n2.className = 'nombre-profesor-grilla';
                // Mostrar nombre del profesor sin el código entre corchetes
                n2.textContent = acortarTexto(limpiarNombreProfesor(entrada.profesorNombre), 24);

                bloque.appendChild(n1);
                bloque.appendChild(n2);
            }

            celda.appendChild(bloque);
            fila.appendChild(celda);
        });

        tbody.appendChild(fila);
    });
}

// ── Sección "Ver Códigos" ─────────────────────────────────────────────────

/**
 * Crea el pie de la tarjeta con el botón "Ver Códigos de Inscripción"
 * y la tabla oculta que muestra Materia | Profesor | Código.
 */
function crearSeccionCodigos(combinacion) {
    const pie = document.createElement('div');
    pie.className = 'pie-combinacion';

    const btn = document.createElement('button');
    btn.className = 'btn-ver-codigos';
    btn.textContent = '📋 Ver Códigos de Inscripción';

    // Tabla de códigos (oculta por defecto)
    const tablaDiv = document.createElement('div');
    tablaDiv.className = 'tabla-codigos oculto';

    // Deduplicar entradas: una fila por (materia, profesor) único
    const yaVistos = new Set();
    const entradasUnicas = [];
    combinacion.entradas.forEach(e => {
        const clave = `${e.materiaId}-${e.profesorId}`;
        if (!yaVistos.has(clave)) {
            yaVistos.add(clave);
            entradasUnicas.push(e);
        }
    });

    // Construir tabla
    const tabla = document.createElement('table');
    tabla.className = 'tabla-inscripcion';
    tabla.innerHTML = `<thead><tr>
        <th>Materia</th><th>Profesor</th><th>Código</th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    entradasUnicas.forEach(e => {
        const tr = document.createElement('tr');

        const tdMateria = document.createElement('td');
        tdMateria.textContent = e.materiaNombre;

        const tdProfesor = document.createElement('td');
        tdProfesor.textContent = limpiarNombreProfesor(e.profesorNombre);

        const tdCodigo = document.createElement('td');
        // Usar el campo codigoGrupo o extraerlo del nombre como respaldo
        const codigo = e.codigoGrupo || extraerCodigo(e.profesorNombre);
        const span = document.createElement('span');
        span.className = 'codigo-inscripcion';
        span.textContent = codigo || '—';
        tdCodigo.appendChild(span);

        tr.appendChild(tdMateria);
        tr.appendChild(tdProfesor);
        tr.appendChild(tdCodigo);
        tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    tablaDiv.appendChild(tabla);

    // Alternar visibilidad al hacer clic
    btn.addEventListener('click', () => {
        const estabaMostrado = !tablaDiv.classList.toggle('oculto');
        btn.textContent = estabaMostrado
            ? '📋 Ver Códigos de Inscripción'
            : '✕ Ocultar Códigos';
    });

    pie.appendChild(btn);
    pie.appendChild(tablaDiv);
    return pie;
}

// ── Utilidades ────────────────────────────────────────────────────────────

/** Convierte "HH:mm" a minutos desde medianoche para comparaciones numéricas. */
function horaAMinutos(hora) {
    if (!hora || !hora.includes(':')) return 0;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

/** Trunca un texto a `max` caracteres añadiendo "…" si es necesario. */
function acortarTexto(texto, max) {
    if (!texto) return '';
    return texto.length > max ? texto.slice(0, max - 1) + '…' : texto;
}

/**
 * Elimina el sufijo "[código]" del nombre del profesor.
 * Ej: "Carlos García [1562]" → "Carlos García"
 */
function limpiarNombreProfesor(nombre) {
    return (nombre || '').replace(/\s*\[.*/, '').trim();
}

/**
 * Extrae el código numérico del nombre del profesor cuando no viene como campo separado.
 * Ej: "Carlos García [1562]" → "1562"
 */
function extraerCodigo(nombre) {
    const match = /\[(\d+)/.exec(nombre || '');
    return match ? match[1] : null;
}
