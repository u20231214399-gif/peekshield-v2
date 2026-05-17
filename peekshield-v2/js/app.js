function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'asistencia') iniciarCamaraAsistencia();
  else detenerCamaraAsistencia();
  if (id === 'registrar') iniciarCamaraRegistro();
  else detenerCamaraRegistro();
  if (id === 'historial') {
    document.getElementById('filtroFecha').value = new Date().toISOString().split('T')[0];
    cargarHistorial();
  }
}
