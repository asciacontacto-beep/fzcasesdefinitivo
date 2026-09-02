// Lógica de la página de turnos: calendario, horarios disponibles y envío.
(function () {
    'use strict';

    const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
        'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    // Horario comercial: 0=domingo ... 6=sábado.
    const HORARIOS = {
        0: null,                              // domingo: cerrado
        1: { desde: '09:00', hasta: '18:00' },
        2: { desde: '09:00', hasta: '18:00' },
        3: { desde: '09:00', hasta: '18:00' },
        4: { desde: '09:00', hasta: '18:00' },
        5: { desde: '09:00', hasta: '18:00' },
        6: { desde: '10:00', hasta: '14:00' },
    };
    const PASO_MIN = 30;
    const DIAS_MAX_ADELANTE = 45;

    const pad2 = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const hhmmToMin = (hhmm) => {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    };
    const minToHHMM = (min) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;

    function generarSlots(diaSemana) {
        const rango = HORARIOS[diaSemana];
        if (!rango) return [];
        const slots = [];
        for (let m = hhmmToMin(rango.desde); m < hhmmToMin(rango.hasta); m += PASO_MIN) {
            slots.push(minToHHMM(m));
        }
        return slots;
    }

    const state = {
        sucursal: 'Tandil',
        viewDate: new Date(new Date().setHours(0, 0, 0, 0)),
        selectedDate: null,   // Date
        selectedTime: null,   // "HH:MM"
        busyCache: new Map(), // "sucursal|fecha" -> ["HH:MM", ...]
    };

    const el = (id) => document.getElementById(id);
    const board = el('turnos-board');
    if (!board) return; // no estamos en turnos.html

    const calGrid = el('cal-grid');
    const calMonthLabel = el('cal-month-label');
    const slotsGrid = el('slots-grid');
    const slotsDateLabel = el('slots-date-label');
    const summaryBox = el('turnos-summary');
    const form = el('turnos-form');
    const formError = el('turnos-form-error');
    const confirmBtn = el('btn-confirm-turno');

    // ---------- Calendario ----------
    function renderCalendar() {
        const year = state.viewDate.getFullYear();
        const month = state.viewDate.getMonth();
        calMonthLabel.textContent = `${MESES[month]} ${year}`;

        const first = new Date(year, month, 1);
        // Lunes=0 ... Domingo=6
        const firstWeekday = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + DIAS_MAX_ADELANTE);

        calGrid.innerHTML = '';
        for (let i = 0; i < firstWeekday; i++) {
            calGrid.insertAdjacentHTML('beforeend', '<span class="cal-day cal-day-empty"></span>');
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const iso = toISO(date);
            const weekday = date.getDay();
            const cerrado = !HORARIOS[weekday];
            const fueraDeRango = date < today || date > maxDate;
            const disabled = cerrado || fueraDeRango;
            const isSelected = state.selectedDate && toISO(state.selectedDate) === iso;
            const isToday = toISO(today) === iso;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cal-day' + (disabled ? ' cal-day-disabled' : '') +
                (isSelected ? ' cal-day-selected' : '') + (isToday ? ' cal-day-today' : '');
            btn.textContent = String(d);
            btn.setAttribute('aria-label', `${DIAS_SEMANA[weekday]} ${d} de ${MESES[month]}`);
            if (disabled) {
                btn.disabled = true;
            } else {
                btn.addEventListener('click', () => selectDate(date));
            }
            calGrid.appendChild(btn);
        }
    }

    el('cal-prev').addEventListener('click', () => {
        state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() - 1, 1);
        renderCalendar();
    });
    el('cal-next').addEventListener('click', () => {
        state.viewDate = new Date(state.viewDate.getFullYear(), state.viewDate.getMonth() + 1, 1);
        renderCalendar();
    });

    // ---------- Sucursal ----------
    el('turnos-sucursal-switch').addEventListener('click', (e) => {
        const btn = e.target.closest('.turnos-suc-btn');
        if (!btn) return;
        document.querySelectorAll('.turnos-suc-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.sucursal = btn.dataset.sucursal;
        state.selectedTime = null;
        if (state.selectedDate) renderSlots();
        updateSummary();
    });

    // ---------- Horarios ----------
    async function fetchBusy(dateISO) {
        const key = `${state.sucursal}|${dateISO}`;
        if (state.busyCache.has(key)) return state.busyCache.get(key);
        try {
            const r = await fetch(`/api/turnos?fecha=${dateISO}&sucursal=${encodeURIComponent(state.sucursal)}`);
            const data = await r.json();
            const ocupadas = Array.isArray(data.ocupadas) ? data.ocupadas : [];
            state.busyCache.set(key, ocupadas);
            return ocupadas;
        } catch (e) {
            return [];
        }
    }

    async function selectDate(date) {
        state.selectedDate = date;
        state.selectedTime = null;
        renderCalendar();
        updateSummary();

        const iso = toISO(date);
        slotsDateLabel.textContent = `${DIAS_SEMANA[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]}`;
        slotsGrid.innerHTML = '<div class="turnos-slots-loading"><span></span><span></span><span></span></div>';

        await renderSlots();
    }

    async function renderSlots() {
        if (!state.selectedDate) return;
        const date = state.selectedDate;
        const iso = toISO(date);
        const weekday = date.getDay();
        const slots = generarSlots(weekday);

        slotsGrid.innerHTML = '<div class="turnos-slots-loading"><span></span><span></span><span></span></div>';
        const ocupadas = await fetchBusy(iso);

        const today = new Date();
        const isToday = toISO(today) === iso;
        const nowMin = today.getHours() * 60 + today.getMinutes();

        slotsGrid.innerHTML = '';
        if (!slots.length) {
            slotsGrid.innerHTML = '<p class="turnos-slots-empty">No atendemos ese día. Elegí otra fecha.</p>';
            return;
        }

        let disponibles = 0;
        slots.forEach((hora) => {
            const ocupado = ocupadas.includes(hora);
            const pasado = isToday && hhmmToMin(hora) <= nowMin;
            const disabled = ocupado || pasado;
            if (!disabled) disponibles++;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slot-chip' + (disabled ? ' slot-chip-disabled' : '') +
                (state.selectedTime === hora ? ' slot-chip-selected' : '');
            btn.textContent = hora;
            btn.disabled = disabled;
            if (!disabled) {
                btn.addEventListener('click', () => selectTime(hora));
            }
            slotsGrid.appendChild(btn);
        });

        if (!disponibles) {
            slotsGrid.insertAdjacentHTML('beforeend',
                '<p class="turnos-slots-empty turnos-slots-empty-full">Ese día ya no quedan horarios. Probá otra fecha.</p>');
        }
    }

    function selectTime(hora) {
        state.selectedTime = hora;
        document.querySelectorAll('.slot-chip').forEach((c) => {
            c.classList.toggle('slot-chip-selected', c.textContent === hora);
        });
        updateSummary();
        // Scroll suave al formulario en mobile.
        if (window.innerWidth < 900) {
            el('turnos-step-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function updateSummary() {
        if (!state.selectedDate || !state.selectedTime) {
            const dia = state.selectedDate
                ? `${DIAS_SEMANA[state.selectedDate.getDay()]} ${state.selectedDate.getDate()} de ${MESES[state.selectedDate.getMonth()]}`
                : null;
            summaryBox.innerHTML = dia
                ? `<div class="turnos-summary-empty">Elegido: <strong>${dia}</strong> en <strong>${state.sucursal}</strong>. Falta elegir horario.</div>`
                : '<div class="turnos-summary-empty">Todavía no elegiste día y horario.</div>';
            confirmBtn.disabled = true;
            return;
        }
        const d = state.selectedDate;
        const dia = `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
        summaryBox.innerHTML = `
            <div class="turnos-summary-chip">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <div><strong>${dia}</strong><span>${state.selectedTime} hs · ${state.sucursal}</span></div>
            </div>`;
        confirmBtn.disabled = false;
    }

    // ---------- Envío ----------
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        formError.textContent = '';

        if (!state.selectedDate || !state.selectedTime) {
            formError.textContent = 'Elegí día y horario antes de confirmar.';
            return;
        }

        const nombre = el('f-nombre').value.trim();
        const telefono = el('f-telefono').value.trim();
        const motivo = el('f-motivo').value;
        const notas = el('f-notas').value.trim();

        if (nombre.length < 2) { formError.textContent = 'Ingresá tu nombre.'; el('f-nombre').focus(); return; }
        if (telefono.length < 6) { formError.textContent = 'Ingresá un teléfono válido.'; el('f-telefono').focus(); return; }

        confirmBtn.disabled = true;
        confirmBtn.classList.add('is-loading');

        try {
            const r = await fetch('/api/turnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre, telefono, motivo, notas,
                    fecha: toISO(state.selectedDate),
                    hora: state.selectedTime,
                    sucursal: state.sucursal,
                }),
            });
            const data = await r.json();

            if (!r.ok) {
                formError.textContent = data.error || 'No pudimos guardar el turno. Probá de nuevo.';
                if (r.status === 409) {
                    // Alguien tomó el horario justo antes: refrescar slots.
                    state.busyCache.delete(`${state.sucursal}|${toISO(state.selectedDate)}`);
                    state.selectedTime = null;
                    await renderSlots();
                    updateSummary();
                }
                return;
            }

            showSuccess();
        } catch (err) {
            formError.textContent = 'Sin conexión. Probá de nuevo en un momento.';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('is-loading');
        }
    });

    function showSuccess() {
        const d = state.selectedDate;
        const dia = `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
        el('turnos-step-pick').hidden = true;
        el('turnos-step-form').hidden = true;
        const successPanel = el('turnos-step-success');
        successPanel.hidden = false;
        el('turnos-success-detail').textContent =
            `${dia} a las ${state.selectedTime} hs, sucursal ${state.sucursal}. Guardá este turno.`;

        const nombre = encodeURIComponent(el('f-nombre').value.trim());
        const msg = encodeURIComponent(
            `Hola! Soy ${el('f-nombre').value.trim()}, acabo de sacar un turno para el ${dia} a las ${state.selectedTime}hs en ${state.sucursal} (${el('f-motivo').value}). Confirmo mi asistencia!`
        );
        el('turnos-wa-confirm').href = `https://wa.me/5492494521518?text=${msg}`;

        successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    el('turnos-nuevo-turno').addEventListener('click', () => {
        state.selectedDate = null;
        state.selectedTime = null;
        form.reset();
        formError.textContent = '';
        el('turnos-step-success').hidden = true;
        el('turnos-step-pick').hidden = false;
        el('turnos-step-form').hidden = false;
        slotsGrid.innerHTML = '<p class="turnos-slots-empty">Seleccioná un día del calendario para ver los horarios disponibles.</p>';
        slotsDateLabel.textContent = 'Elegí una fecha';
        updateSummary();
        renderCalendar();
        window.scrollTo({ top: board.offsetTop - 100, behavior: 'smooth' });
    });

    // ---------- Init ----------
    renderCalendar();
    updateSummary();
})();
