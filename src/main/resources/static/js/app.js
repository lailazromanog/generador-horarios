/**
 * app.js — Lógica del cliente para el Generador de Horarios Universitarios.
 * Consume los endpoints REST del backend y actualiza la UI dinámicamente.
 */

// ── Estado global ─────────────────────────────────────────────────────────────
let todasLasMaterias = []; // Array<Materia> cargado desde el backend

// Franjas horarias: de 06:00 a 22:00 en intervalos de 30 minutos
const HORA_INICIO_GRILLA = 6 * 60;  // minutos desde medianoche
const HORA_FIN_GRILLA    = 22 * 60;
const INTERVALO_MIN      = 30;

const DIAS_ORDEN = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', cargarMaterias);

// ── Carga y renderizado de datos ──────────────────────────────────────────────

/** Recupera todas las materias del backend y refresca toda la UI. */
async function cargarMaterias() {
    try {
        const respuesta = await fetch('/api/materias');
        todasLasMaterias = await respuesta.json();
        renderizarListaAdmin();
        renderizarSelectsMaterias();
        renderizarPanelSeleccion();
    } catch (error) {
        console.error('Error al cargar materias:', error);
    }
}

/** Muestra chips con los nombres de materias en el panel de administración. */
function renderizarListaAdmin() {
    const contenedor = document.getElementById('lista-materias-admin');
    contenedor.innerHTML = '';
    todasLasMaterias.forEach(materia => {
        const chip = document.createElement('span');
        chip.className = 'chip-materia';
        chip.textContent = `${materia.nombre} (${materia.profesores.length} prof.)`;
        contenedor.appendChild(chip);
    });
}

/** Rellena los select de materia en los formularios de agregar profesor y bloque. */
function renderizarSelectsMaterias() {
    const selectores = [
        document.getElementById('select-materia-profesor'),
        document.getElementById('select-materia-bloque'),
    ];
    selectores.forEach(sel => {
        const valorActual = sel.value;
        sel.innerHTML = '<option value="">— seleccionar materia —</option>';
        todasLasMaterias.forEach(materia => {
            const opcion = document.createElement('option');
            opcion.value = materia.id;
            opcion.textContent = materia.nombre;
            sel.appendChild(opcion);
        });
        // Restaurar la selección previa si aún existe
        if (valorActual) sel.value = valorActual;
    });
    actualizarProfesoresBloque();
}

/**
 * Actualiza el select de profesores en el formulario de bloque horario
 * según la materia seleccionada.
 */
function actualizarProfesoresBloque() {
    const materiaId = document.getElementById('select-materia-bloque').value;
    const selectProf = document.getElementById('select-profesor-bloque');
    selectProf.innerHTML = '<option value="">— seleccionar profesor —</option>';
    if (!materiaId) return;

    const materia = todasLasMaterias.find(m => String(m.id) === String(materiaId));
    if (!materia) return;

    materia.profesores.forEach(prof => {
        const opcion = document.createElement('option');
        opcion.value = prof.id;
        opcion.textContent = prof.nombre + (prof.nota ? ` (${prof.nota})` : '');
        selectProf.appendChild(opcion);
    });
}

/**
 * Renderiza el panel de selección con checkboxes para cada materia
 * y dropdowns de profesor que aparecen al marcar el checkbox.
 */
function renderizarPanelSeleccion() {
    const contenedor = document.getElementById('lista-materias-seleccion');
    const textoPH    = document.getElementById('texto-sin-materias');

    // Guardar selecciones actuales antes de re-renderizar
    const seleccionesGuardadas = {};
    document.querySelectorAll('.cb-materia').forEach(cb => {
        if (cb.checked) {
            const sel = document.getElementById(`select-prof-${cb.dataset.materiaId}`);
            seleccionesGuardadas[cb.dataset.materiaId] = sel ? sel.value : '';
        }
    });

    contenedor.innerHTML = '';

    if (todasLasMaterias.length === 0) {
        contenedor.appendChild(textoPH);
        return;
    }

    todasLasMaterias.forEach(materia => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-materia-seleccion';
        itemDiv.id = `item-sel-${materia.id}`;

        // Fila del checkbox
        const filaCheck = document.createElement('div');
        filaCheck.className = 'fila-checkbox';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'cb-materia';
        cb.id = `cb-materia-${materia.id}`;
        cb.dataset.materiaId = materia.id;
        cb.addEventListener('change', () => toggleSelectorProfesor(materia.id));

        const etiqueta = document.createElement('label');
        etiqueta.htmlFor = `cb-materia-${materia.id}`;
        etiqueta.textContent = materia.nombre;

        filaCheck.appendChild(cb);
        filaCheck.appendChild(etiqueta);

        // Fila del selector de profesor (oculta por defecto)
        const filaProf = document.createElement('div');
        filaProf.className = 'selector-profesor';
        filaProf.id = `fila-prof-${materia.id}`;

        const lblProf = document.createElement('label');
        lblProf.textContent = 'Profesor:';

        const selProf = document.createElement('select');
        selProf.id = `select-prof-${materia.id}`;
        selProf.innerHTML = '<option value="">— elegir —</option>';
        materia.profesores.forEach(prof => {
            const op = document.createElement('option');
            op.value = prof.id;
            op.textContent = prof.nombre + (prof.nota ? ` (${prof.nota})` : '');
            selProf.appendChild(op);
        });

        filaProf.appendChild(lblProf);
        filaProf.appendChild(selProf);

        itemDiv.appendChild(filaCheck);
        itemDiv.appendChild(filaProf);
        contenedor.appendChild(itemDiv);

        // Restaurar estado previo
        if (seleccionesGuardadas[materia.id] !== undefined) {
            cb.checked = true;
            filaProf.classList.add('visible');
            itemDiv.classList.add('activa');
            selProf.value = seleccionesGuardadas[materia.id];
        }
    });
}

/** Muestra u oculta el selector de profesor al marcar/desmarcar un checkbox. */
function toggleSelectorProfesor(materiaId) {
    const cb      = document.getElementById(`cb-materia-${materiaId}`);
    const fila    = document.getElementById(`fila-prof-${materiaId}`);
    const item    = document.getElementById(`item-sel-${materiaId}`);
    fila.classList.toggle('visible', cb.checked);
    item.classList.toggle('activa', cb.checked);
}

// ── Acciones del panel de administración ─────────────────────────────────────

/** Envía el formulario para crear una nueva materia. */
async function agregarMateria() {
    const inputNombre = document.getElementById('input-nombre-materia');
    const nombre = inputNombre.value.trim();
    if (!nombre) { alert('Ingresa el nombre de la materia.'); return; }

    try {
        const respuesta = await fetch('/api/materias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
        if (!respuesta.ok) { alert('Error al crear la materia.'); return; }
        inputNombre.value = '';
        await cargarMaterias();
    } catch (error) {
        console.error('Error al agregar materia:', error);
    }
}

/** Envía el formulario para agregar un profesor a una materia. */
async function agregarProfesor() {
    const materiaId = document.getElementById('select-materia-profesor').value;
    const nombre    = document.getElementById('input-nombre-profesor').value.trim();
    const nota      = document.getElementById('input-nota-profesor').value.trim();

    if (!materiaId) { alert('Selecciona una materia.'); return; }
    if (!nombre)    { alert('Ingresa el nombre del profesor.'); return; }

    try {
        const respuesta = await fetch(`/api/materias/${materiaId}/profesores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, nota })
        });
        if (!respuesta.ok) { alert('Error al agregar el profesor.'); return; }
        document.getElementById('input-nombre-profesor').value = '';
        document.getElementById('input-nota-profesor').value = '';
        await cargarMaterias();
    } catch (error) {
        console.error('Error al agregar profesor:', error);
    }
}

/** Envía el formulario para agregar un bloque horario a un profesor. */
async function agregarBloque() {
    const profesorId  = document.getElementById('select-profesor-bloque').value;
    const dia         = document.getElementById('select-dia').value;
    const horaInicio  = document.getElementById('input-hora-inicio').value;
    const horaFin     = document.getElementById('input-hora-fin').value;

    if (!profesorId)  { alert('Selecciona un profesor.'); return; }
    if (!horaInicio || !horaFin) { alert('Completa las horas.'); return; }
    if (horaInicio >= horaFin)   { alert('La hora de inicio debe ser menor a la hora de fin.'); return; }

    try {
        const respuesta = await fetch(`/api/profesores/${profesorId}/bloques`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dia, horaInicio, horaFin })
        });
        if (!respuesta.ok) { alert('Error al agregar el bloque.'); return; }
        await cargarMaterias();
    } catch (error) {
        console.error('Error al agregar bloque:', error);
    }
}

// ── Generación del horario ────────────────────────────────────────────────────

/** Recopila las selecciones activas y solicita al backend generar el horario. */
async function generarHorario() {
    const selecciones = [];

    document.querySelectorAll('.cb-materia:checked').forEach(cb => {
        const materiaId  = Number(cb.dataset.materiaId);
        const selectProf = document.getElementById(`select-prof-${materiaId}`);
        const profesorId = selectProf ? Number(selectProf.value) : null;
        if (profesorId) selecciones.push({ materiaId, profesorId });
    });

    if (selecciones.length === 0) {
        alert('Selecciona al menos una materia con su profesor antes de generar.');
        return;
    }

    try {
        const respuesta = await fetch('/api/horario/generar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(selecciones)
        });
        if (!respuesta.ok) { alert('Error al generar el horario.'); return; }
        const resultado = await respuesta.json();
        mostrarResultados(resultado);
    } catch (error) {
        console.error('Error al generar horario:', error);
    }
}

// ── Visualización de resultados ───────────────────────────────────────────────

/**
 * Muestra el panel de resultados con la puntuación, advertencias de choque
 * y la grilla visual del horario.
 */
function mostrarResultados(resultado) {
    const panel = document.getElementById('panel-resultados');
    panel.classList.add('visible');

    renderizarPuntuacion(resultado.puntuacion, resultado.tieneChoques);
    renderizarChoques(resultado.choques, resultado.tieneChoques);
    renderizarGrilla(resultado.entradas);

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Muestra el resumen de puntuación de la combinación seleccionada. */
function renderizarPuntuacion(puntuacion, tieneChoques) {
    const contenedor = document.getElementById('resumen-puntuacion');
    const puntuacionFormateada = puntuacion.toFixed(1);
    const icono = tieneChoques ? '⚠️' : '✅';
    contenedor.innerHTML = `
        <div>
            <div class="puntuacion-valor">${puntuacionFormateada}</div>
            <div class="puntuacion-label">Puntuación total</div>
        </div>
        <div style="flex:1">
            <div style="font-size:1.4rem">${icono}</div>
            <div style="font-size:0.85rem;color:#546E7A">
                ${tieneChoques ? 'Hay choques de horario' : 'Sin choques de horario'}
            </div>
        </div>
    `;
}

/** Renderiza las advertencias de choque o el mensaje de horario limpio. */
function renderizarChoques(choques, tieneChoques) {
    const contenedor = document.getElementById('contenedor-choques');
    contenedor.innerHTML = '';

    if (!tieneChoques) {
        contenedor.innerHTML = `
            <div class="sin-choques">
                ✔ Ningún choque detectado. ¡Tu horario está libre de conflictos!
            </div>`;
        return;
    }

    const divChoques = document.createElement('div');
    divChoques.className = 'contenedor-choques';
    choques.forEach(mensaje => {
        const div = document.createElement('div');
        div.className = 'advertencia-choque';
        div.innerHTML = `<span>⚠</span><span>${mensaje}</span>`;
        divChoques.appendChild(div);
    });
    contenedor.appendChild(divChoques);
}

/**
 * Construye la grilla de horario Lunes–Sábado con franjas de 30 minutos.
 * Colorea las celdas que tienen bloque asignado y marca los choques.
 */
function renderizarGrilla(entradas) {
    const cuerpo = document.getElementById('cuerpo-tabla');
    cuerpo.innerHTML = '';

    // Índice rápido: "DIA_MINUTOINICIO_MINUTOFIN" → EntradaHorario[]
    // Para cada celda, buscar las entradas que cubren ese slot
    const totalSlots = (HORA_FIN_GRILLA - HORA_INICIO_GRILLA) / INTERVALO_MIN;

    for (let i = 0; i < totalSlots; i++) {
        const minutoSlot = HORA_INICIO_GRILLA + i * INTERVALO_MIN;
        const etiquetaHora = minutosAHora(minutoSlot);

        const fila = document.createElement('tr');

        // Columna de etiqueta horaria
        const celdaHora = document.createElement('td');
        celdaHora.className = 'col-hora';
        celdaHora.textContent = etiquetaHora;
        fila.appendChild(celdaHora);

        // Una columna por día
        DIAS_ORDEN.forEach(dia => {
            const celda = document.createElement('td');

            // Buscar entradas que ocupan este slot en este día
            const entradasDelSlot = entradas.filter(e => {
                if (e.dia !== dia) return false;
                const inicioE = horaAMinutos(e.horaInicio);
                const finE    = horaAMinutos(e.horaFin);
                return minutoSlot >= inicioE && minutoSlot < finE;
            });

            if (entradasDelSlot.length === 0) {
                // Celda vacía
                fila.appendChild(celda);
                return;
            }

            if (entradasDelSlot.length > 1) {
                // Choque: mostrar con borde rojo
                celda.classList.add('celda-choque');
            }

            // Mostrar la primera entrada (o la que choca)
            const entrada = entradasDelSlot[0];
            const inicioE = horaAMinutos(entrada.horaInicio);

            const bloqueDiv = document.createElement('div');
            bloqueDiv.className = 'celda-bloque';
            bloqueDiv.style.background = entrada.color;

            // Mostrar texto solo en el primer slot del bloque
            if (minutoSlot === inicioE) {
                bloqueDiv.innerHTML = `
                    <span class="nombre-materia">${entrada.materiaNombre}</span>
                    <span class="nombre-profesor">${entrada.profesorNombre}</span>
                `;
            }

            celda.appendChild(bloqueDiv);
            fila.appendChild(celda);
        });

        cuerpo.appendChild(fila);
    }
}

// ── Utilidades de tiempo ──────────────────────────────────────────────────────

/** Convierte un total de minutos a string "HH:mm". */
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
