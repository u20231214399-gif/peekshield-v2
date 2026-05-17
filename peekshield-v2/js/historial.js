let registrosActuales = [];

async function cargarHistorial() {
  const lista = document.getElementById('listaHistorial');
  lista.innerHTML = '<p class="empty">Cargando...</p>';
  const fechaVal = document.getElementById('filtroFecha').value;
  let query = db.collection('asistencia').orderBy('fecha', 'desc');
  if (fechaVal) {
    query = query
      .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(new Date(fechaVal + 'T00:00:00')))
      .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(new Date(fechaVal + 'T23:59:59')));
  }
  const snap = await query.get();
  registrosActuales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (registrosActuales.length === 0) { lista.innerHTML = '<p class="empty">No hay registros para esta fecha.</p>'; return; }
  lista.innerHTML = '';
  registrosActuales.forEach(r => {
    const fecha = r.fecha?.toDate();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="data:image/jpeg;base64,${r.foto||''}" onerror="this.src=''" onclick="verFoto('${r.foto||''}')"/>
      <div class="card-info">
        <div class="card-nombre">${r.nombre||'Sin nombre'}</div>
        <div class="card-fecha">📅 ${fecha?fecha.toLocaleDateString('es-CO'):''}</div>
        <div class="card-hora">🕐 ${fecha?fecha.toLocaleTimeString('es-CO'):''}</div>
      </div>
      <button class="btnDel" onclick="borrarRegistro('${r.id}',this)">🗑️</button>`;
    lista.appendChild(card);
  });
}

async function borrarRegistro(id, btn) {
  if (!confirm('Borrar este registro?')) return;
  await db.collection('asistencia').doc(id).delete();
  btn.closest('.card').remove();
}

function verFoto(base64) {
  if (!base64) return;
  document.getElementById('modalImg').src = 'data:image/jpeg;base64,' + base64;
  document.getElementById('modalFoto').classList.add('visible');
}

function exportarExcel() {
  if (registrosActuales.length === 0) { alert('No hay registros para exportar.'); return; }
  const datos = registrosActuales.map(r => {
    const fecha = r.fecha?.toDate();
    return { 'Nombre': r.nombre||'', 'Fecha': fecha?fecha.toLocaleDateString('es-CO'):'', 'Hora': fecha?fecha.toLocaleTimeString('es-CO'):'' };
  });
  const ws = XLSX.utils.json_to_sheet(datos);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
  XLSX.writeFile(wb, 'asistencia_' + (document.getElementById('filtroFecha').value||'historial') + '.xlsx');
}
