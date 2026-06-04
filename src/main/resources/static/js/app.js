/**
 * app.js — Lógica del cliente para el Generador de Horarios Universitarios.
 *
 * Flujo principal:
 *   1. Al cargar la página: obtener materias del backend y renderizar checkboxes.
 *   2. El usuario selecciona materias y marca varios profesores por materia.
 *   3. Al hacer clic en "Calcular", se envía {materiaId, profesoresIds[]} al backend.
 *   4. El backend devuelve {combinaciones, totalPosibles, totalCalculadas}.
 *   5. Se renderizan las combinaciones como tarjetas con su grilla Lunes–Sábado.
 */

// ── Constantes ────────────────────────────────────────────────────────────────

/** Orden de los días para las columnas de la grilla. */
const DIAS_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

/** Etiquetas cortas para mostrar en el resumen de horario de cada profesor. */
const DIAS_CORTOS = {
    LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
    JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb'
};

/** Franja horaria de la grilla: 06:00 a 22:00, intervalos de 30 min. */
const HORA_INICIO_MIN = 6 * 60;
const HORA_FIN_MIN    = 22 * 60;
const INTERVALO_MIN   = 30;

// ── Estado global ─────────────────────────────────────────────────────────────

/** Lista completa de materias cargadas desde el backend. */
let todasLasMaterias = [];

// ── Inicialización ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', cargarMaterias);

// ── Carga de datos ────────────────────────────────────────────────────────────

/** Obtiene todas las materias del backend y construye el panel de selección. */
async function cargarMaterias() {
    try {
        const respuesta = await fetch('/api/materias');
        todasLasMaterias = await respuesta.json();
        renderizarPanelSeleccion();
    } catch (error) {
        document.getElementById('lista-materias-seleccion').innerHTML =
            '<p style="color:red;padding:1rem">Error al cargar las materias. Revisa que el servidor esté corriendo.</p>';
    }
}

// ── Renderizado del panel de selección ───────────────────────────────────────

/**
 * Construye la lista de tarjetas de materias con sus checkboxes de profesores.
 * Cada materia tiene un checkbox principal y, al activarse, muestra la lista
 * de profesores disponibles para selección múltiple.
 */
function renderizarPanelSeleccion() {
    const contenedor = document.getElementById('lista-materias-seleccion');
    contenedor.innerHTML = '';

    if (todasLasMaterias.length === 0) {
        contenedor.innerHTML = '<p class="texto-cargando">No se encontraron materias en el servidor.</p>';
        return;
    }

    todasLasMaterias.forEach(materia => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'item-materia-seleccion';
        tarjeta.id = `tarjeta-mat-${materia.id}`;

        // ── Cabecera: checkbox + nombre + créditos ────────────────────────
        const cabecera = document.createElement('div');
        cabecera.className = 'cabecera-materia';

        const cbMateria = document.createElement('input');
        cbMateria.type = 'checkbox';
        cbMateria.id = `cb-mat-${materia.id}`;
        cbMateria.addEventListener('change', () => toggleMateria(materia.id, cbMateria.checked));

        const etiquetaMateria = document.createElement('label');
        etiquetaMateria.htmlFor = `cb-mat-${materia.id}`;
        etiquetaMateria.textContent = materia.nombre;

        const badgeCreditos = document.createElement('span');
        badgeCreditos.className = 'badge-creditos';
        badgeCreditos.textContent = `${materia.creditos || ''} créd.`;

        cabecera.appendChild(cbMateria);
        cabecera.appendChild(etiquetaMateria);
        cabecera.appendChild(badgeCreditos);

        // ── Zona de profesores (oculta hasta marcar la materia) ───────────
        const zonaProfs = document.createElement('div');
        zonaProfs.className = 'zona-profesores';
        zonaProfs.id = `zona-profs-${materia.id}`;

        // Barra de controles: Todos, Ninguno y contador
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
        spanConteo.textContent = `0 de ${materia.profesores.length} seleccionados`;

        controles.appendChild(btnTodos);
        controles.appendChild(btnNinguno);
        controles.appendChild(spanConteo);

        // Lista de checkboxes de profesores
        const listaChecks = document.createElement('div');
        listaChecks.className = 'lista-checks-profesores';

        materia.profesores.forEach(prof => {
            const itemProf = document.createElement('div');
            itemProf.className = 'item-profesor-checkbox';

            const cbProf = document.createElement('input');
            cbProf.type = 'checkbox';
            cbProf.id = `cb-prof-${prof.id}`;
            cbProf.className = `cb-prof-mat-${materia.id}`;
            cbProf.value = prof.id;
            cbProf.addEventListener('change', () => actualizarConteo(materia.id));

            const lblProf = document.createElement('label');
            lblProf.htmlFor = `cb-prof-${prof.id}`;
            lblProf.style.cursor = 'pointer';
            lblProf.style.flex = '1';
            lblProf.style.display = 'flex';
            lblProf.style.alignItems = 'baseline';
            lblProf.style.gap = '0.4rem';
            lblProf.style.flexWrap = 'wrap';

            const nombreSpan = document.createElement('span');
            nombreSpan.className = 'nombre-prof';
            nombreSpan.textContent = prof.nombre;
            lblProf.appendChild(nombreSpan);

            // Badge con el código del grupo
            if (prof.codigoGrupo) {
                const badgeCod = document.createElement('span');
                badgeCod.className = 'badge-codigo';
                badgeCod.textContent = prof.codigoGrupo + (prof.tipo === 'lab' ? ' · Lab' : '');
                lblProf.appendChild(badgeCod);
            }

            // Resumen de horario (días y horas)
            if (prof.bloques && prof.bloques.length > 0) {
                const horarioSpan = document.createElement('span');
                horarioSpan.className = 'horario-prof';
                horarioSpan.textContent = prof.bloques
                    .map(b => `${DIAS_CORTOS[b.dia] || b.dia} ${b.horaInicio}–${b.horaFin}`)
                    .join(', ');
                lblProf.appendChild(horarioSpan);
            }

            itemProf.appendChild(cbProf);
            itemProf.appendChild(lblProf);
            listaChecks.appendChild(itemProf);
        });

        zonaProfs.appendChild(controles);
        zonaProfs.appendChild(listaChecks);

        tarjeta.appendChild(cabecera);
        tarjeta.appendChild(zonaProfs);
        contenedor.appendChild(tarjeta);
    });
}

// ── Interacción con checkboxes ────────────────────────────────────────────────

/**
 * Muestra u oculta la lista de profesores al marcar/desmarcar una materia.
 * Al marcar, selecciona automáticamente todos los profesores para comodidad.
 */
function toggleMateria(materiaId, activa) {
    const zona = document.getElementById(`zona-profs-${materiaId}`);
    const tarjeta = document.getElementById(`tarjeta-mat-${materiaId}`);

    zona.classList.toggle('visible', activa);
    tarjeta.classList.toggle('activa', activa);

    if (activa) {
        toggleTodosProfesores(materiaId, true); // Preseleccionar todos por defecto
    } else {
        toggleTodosProfesores(materiaId, false);
    }
}

/** Marca o desmarca todos los checkboxes de profesores de una materia. */
function toggleTodosProfesores(materiaId, seleccionar) {
    document.querySelectorAll(`.cb-prof-mat-${materiaId}`).forEach(cb => {
        cb.checked = seleccionar;
    });
    actualizarConteo(materiaId);
}

/** Actualiza el texto "X de Y seleccionados" para una materia. */
function actualizarConteo(materiaId) {
    const total = document.querySelectorAll(`.cb-prof-mat-${materiaId}`).length;
    const seleccionados = document.querySelectorAll(`.cb-prof-mat-${materiaId}:checked`).length;
    const span = document.getElementById(`conteo-${materiaId}`);
    if (span) span.textContent = `${seleccionados} de ${total} seleccionados`;
}

// ── Generación de combinaciones ───────────────────────────────────────────────

/**
 * Recopila las selecciones del usuario (materias + profesores marcados),
 * llama al backend y muestra los resultados.
 */
async function generarHorario() {
    const selecciones = [];

    todasLasMaterias.forEach(materia => {
        const cbMateria = document.getElementById(`cb-mat-${materia.id}`);
        if (!cbMateria || !cbMateria.checked) return;

        const profesoresIds = Array.from(
            document.querySelectorAll(`.cb-prof-mat-${materia.id}:checked`)
        ).map(cb => Number(cb.value));

        if (profesoresIds.length > 0) {
            selecciones.push({ materiaId: materia.id, profesoresIds });
        }
    });

    if (selecciones.length === 0) {
        alert('Selecciona al menos una materia con uno o más profesores antes de generar.');
        return;
    }

    // Cambiar texto del botón mientras carga
    const btnGenerar = document.querySelector('.btn-generar');
    const textoOriginal = btnGenerar.textContent;
    btnGenerar.textContent = 'Calculando…';
    btnGenerar.disabled = true;

    try {
        const respuesta = await fetch('/api/horario/generar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selecciones)
        });

        if (!respuesta.ok) {
            alert('Error al generar el horario. Intenta de nuevo.');
            return;
        }

        const resultado = await respuesta.json();
        mostrarResultados(resultado);

    } catch (error) {
        alert('Error de conexión con el servidor.');
        console.error(error);
    } finally {
        btnGenerar.textContent = textoOriginal;
        btnGenerar.disabled = false;
    }
}

// ── Visualización de resultados ───────────────────────────────────────────────

/**
 * Renderiza la cabecera de estadísticas y todas las tarjetas de combinaciones.
 *
 * @param {Object} respuesta - {combinaciones, totalPosibles, totalCalculadas}
 */
function mostrarResultados(respuesta) {
    const panelResultados = document.getElementById('panel-resultados');
    panelResultados.classList.remove('oculto');

    const { combinaciones, totalPosibles, totalCalculadas } = respuesta;

    // ── Cabecera con estadísticas ─────────────────────────────────────────
    const cabecera = document.getElementById('cabecera-resultados');
    const mostradas = combinaciones.length;
    const sinChoques = combinaciones.filter(c => !c.tieneChoques).length;

    let avisoLimite = '';
    if (totalCalculadas < totalPosibles) {
        avisoLimite = `<div class="aviso-limite">
            ⚠ Se calcularon ${totalCalculadas.toLocaleString()} de ${totalPosibles.toLocaleString()}
            combinaciones posibles (límite de cómputo alcanzado).
        </div>`;
    }

    cabecera.innerHTML = `
        <div class="resumen-stat">
            <div class="valor">${totalPosibles.toLocaleString()}</div>
            <div class="etiqueta">Combinaciones posibles</div>
        </div>
        <div class="resumen-stat">
            <div class="valor">${totalCalculadas.toLocaleString()}</div>
            <div class="etiqueta">Evaluadas</div>
        </div>
        <div class="resumen-stat">
            <div class="valor">${mostradas}</div>
            <div class="etiqueta">Mostrando (mejores)</div>
        </div>
        <div class="resumen-stat">
            <div class="valor" style="color:var(--verde)">${sinChoques}</div>
            <div class="etiqueta">Sin choques</div>
        </div>
        ${avisoLimite}
    `;

    // ── Tarjetas de combinaciones ─────────────────────────────────────────
    const listaCombinaciones = document.getElementById('lista-combinaciones');
    listaCombinaciones.innerHTML = '';

    if (combinaciones.length === 0) {
        listaCombinaciones.innerHTML = '<div class="card" style="text-align:center;color:#546E7A">No se generaron combinaciones. Verifica que los profesores tengan bloques horarios asignados.</div>';
    } else {
        combinaciones.forEach(combinacion => {
            const tarjeta = crearTarjetaCombinacion(combinacion);
            listaCombinaciones.appendChild(tarjeta);
        });
    }

    panelResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Crea y devuelve el elemento DOM de una tarjeta de combinación.
 *
 * @param {Object} combinacion - ResultadoHorario con entradas, choques, puntaje, etc.
 * @returns {HTMLElement} la tarjeta lista para insertar en el DOM
 */
function crearTarjetaCombinacion(combinacion) {
    const tarjeta = document.createElement('div');
    tarjeta.className = `combinacion-card ${combinacion.tieneChoques ? 'tiene-choques' : ''}`;

    // ── Cabecera de la tarjeta ────────────────────────────────────────────
    const cabecera = document.createElement('div');
    cabecera.className = 'combinacion-cabecera';

    const numSpan = document.createElement('span');
    numSpan.className = 'combinacion-num';
    numSpan.textContent = `#${combinacion.indiceCombinacion}`;

    cabecera.appendChild(numSpan);

    // Badge "Mejor opción" para la primera sin choques
    if (combinacion.indiceCombinacion === 1 && !combinacion.tieneChoques) {
        const badge = document.createElement('span');
        badge.className = 'badge-mejor';
        badge.textContent = '★ Mejor opción';
        cabecera.appendChild(badge);
    }

    const puntajeSpan = document.createElement('span');
    puntajeSpan.className = 'combinacion-puntaje';
    puntajeSpan.textContent = `Puntaje: ${combinacion.puntuacion.toFixed(1)}`;
    cabecera.appendChild(puntajeSpan);

    const estadoSpan = document.createElement('span');
    estadoSpan.className = `combinacion-estado ${combinacion.tieneChoques ? 'estado-choque' : 'estado-ok'}`;
    estadoSpan.textContent = combinacion.tieneChoques ? '⚠ Con choques' : '✓ Sin choques';
    cabecera.appendChild(estadoSpan);

    tarjeta.appendChild(cabecera);

    // ── Descripción de profesores seleccionados ───────────────────────────
    if (combinacion.descripcionProfesores) {
        const desc = document.createElement('div');
        desc.className = 'combinacion-descripcion';
        desc.textContent = combinacion.descripcionProfesores;
        tarjeta.appendChild(desc);
    }

    // ── Advertencias de choque ────────────────────────────────────────────
    if (combinacion.tieneChoques && combinacion.choques.length > 0) {
        const contenedorChoques = document.createElement('div');
        contenedorChoques.className = 'combinacion-choques';
        combinacion.choques.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'advertencia-choque';
            div.innerHTML = `<span>⚠</span><span>${msg}</span>`;
            contenedorChoques.appendChild(div);
        });
        tarjeta.appendChild(contenedorChoques);
    }

    // ── Grilla de horario ─────────────────────────────────────────────────
    const contenedorGrilla = document.createElement('div');
    contenedorGrilla.className = 'contenedor-grilla';

    const tabla = document.createElement('table');
    tabla.className = 'grilla-horario';
    tabla.innerHTML = `<thead><tr>
        <th class="col-hora">Hora</th>
        <th>Lunes</th><th>Martes</th><th>Miércoles</th>
        <th>Jueves</th><th>Viernes</th><th>Sábado</th>
    </tr></thead>`;

    const tbody = document.createElement('tbody');
    tabla.appendChild(tbody);
    contenedorGrilla.appendChild(tabla);
    tarjeta.appendChild(contenedorGrilla);

    // Rellenar la grilla con las entradas de esta combinación
    renderizarGrillaEnTabla(combinacion.entradas, tbody);

    return tarjeta;
}

/**
 * Rellena un <tbody> con las filas de la grilla de horario.
 * Itera sobre los slots de 30 min entre HORA_INICIO_MIN y HORA_FIN_MIN.
 *
 * @param {Array}  entradas - lista de EntradaHorario de la combinación
 * @param {HTMLElement} tbody - elemento <tbody> donde insertar las filas
 */
function renderizarGrillaEnTabla(entradas, tbody) {
    const totalSlots = (HORA_FIN_MIN - HORA_INICIO_MIN) / INTERVALO_MIN;

    for (let i = 0; i < totalSlots; i++) {
        const minutoSlot = HORA_INICIO_MIN + i * INTERVALO_MIN;
        const fila = document.createElement('tr');

        // Columna de etiqueta horaria
        const celdaHora = document.createElement('td');
        celdaHora.className = 'col-hora';
        celdaHora.textContent = minutosAHora(minutoSlot);
        fila.appendChild(celdaHora);

        // Una columna por día
        DIAS_ORDEN.forEach(dia => {
            const celda = document.createElement('td');

            // Buscar entradas que cubren este slot en este día
            const coincidentes = entradas.filter(e => {
                if (e.dia !== dia) return false;
                const ini = horaAMinutos(e.horaInicio);
                const fin = horaAMinutos(e.horaFin);
                return minutoSlot >= ini && minutoSlot < fin;
            });

            if (coincidentes.length === 0) {
                fila.appendChild(celda);
                return;
            }

            // Resaltar con borde cuando hay choque (más de una entrada en el slot)
            if (coincidentes.length > 1) celda.classList.add('celda-choque');

            const entrada = coincidentes[0];
            const esInicioBloque = minutoSlot === horaAMinutos(entrada.horaInicio);

            const bloqueDiv = document.createElement('div');
            bloqueDiv.className = 'celda-bloque';
            bloqueDiv.style.background = entrada.color;

            // Mostrar el nombre solo en el primer slot del bloque
            if (esInicioBloque) {
                const nombreMateria = document.createElement('span');
                nombreMateria.className = 'nombre-materia-grilla';
                nombreMateria.textContent = entrada.materiaNombre;

                const nombreProf = document.createElement('span');
                nombreProf.className = 'nombre-profesor-grilla';
                nombreProf.textContent = entrada.profesorNombre;

                bloqueDiv.appendChild(nombreMateria);
                bloqueDiv.appendChild(nombreProf);
            }

            celda.appendChild(bloqueDiv);
            fila.appendChild(celda);
        });

        tbody.appendChild(fila);
    }
}

// ── Utilidades de tiempo ──────────────────────────────────────────────────────

/** Convierte minutos desde medianoche a string "HH:mm". */
function minutosAHora(minutos) {
    const h = Math.floor(minutos / 60).toString().padStart(2, '0');
    const m = (minutos % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

/** Convierte string "HH:mm" a minutos desde medianoche. */
function horaAMinutos(hora) {
    if (!hora || !hora.includes(':')) return 0;
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}
