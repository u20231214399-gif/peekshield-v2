let streamAsistencia = null;
let asistenciaBlockeada = false;
let detectandoInterval = null;
let estudiantesCache = [];

async function cargarEstudiantes() {
  const snap = await db.collection('estudiantes').get();
  estudiantesCache = snap.docs
    .filter(d => d.data().descriptor)
    .map(d => ({ nombre: d.data().nombre, descriptor: new Float32Array(d.data().descriptor) }));
}

async function iniciarCamaraAsistencia() {
  await cargarEstudiantes();
  try {
    streamAsistencia = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    document.getElementById('video').srcObject = streamAsistencia;
    document.getElementById('statusAsistencia').textContent = 'Acercate a la camara...';
    iniciarDeteccion();
  } catch(e) {
    document.getElementById('statusAsistencia').textContent = 'Sin acceso a camara';
  }
}

function detenerCamaraAsistencia() {
  if (streamAsistencia) { streamAsistencia.getTracks().forEach(t => t.stop()); streamAsistencia = null; }
  clearInterval(detectandoInterval);
}

function iniciarDeteccion() {
  clearInterval(detectandoInterval);
  detectandoInterval = setInterval(async () => {
    if (asistenciaBlockeada) return;
    const video = document.getElementById('video');
    if (!video || video.readyState < 2) return;
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) { document.getElementById('statusAsistencia').textContent = 'Acercate a la camara...'; return; }
      if (estudiantesCache.length === 0) { document.getElementById('statusAsistencia').textContent = 'No hay estudiantes registrados'; return; }
      const labeled = estudiantesCache.map(e => new faceapi.LabeledFaceDescriptors(e.nombre, [e.descriptor]));
      const matcher = new faceapi.FaceMatcher(labeled, 0.5);
      const match = matcher.findBestMatch(detection.descriptor);
      if (match.label !== 'unknown') {
        asistenciaBlockeada = true;
        clearInterval(detectandoInterval);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        await registrarAsistencia(match.label, canvas.toDataURL('image/jpeg', 0.5).split(',')[1]);
      } else {
        document.getElementById('statusAsistencia').textContent = 'Cara no reconocida';
      }
    } catch(e) { console.error(e); }
  }, 2000);
}

async function registrarAsistencia(nombre, foto) {
  const status = document.getElementById('statusAsistencia');
  status.textContent = 'Registrando a ' + nombre + '...';
  try {
    await db.collection('asistencia').add({ nombre, foto, fecha: firebase.firestore.Timestamp.now() });
    status.textContent = nombre + ' — ' + new Date().toLocaleTimeString('es-CO');
    document.getElementById('btnSiguienteWrap').style.display = 'block';
  } catch(e) {
    status.textContent = 'Error al registrar';
    asistenciaBlockeada = false;
    iniciarDeteccion();
  }
}

function siguienteEstudiante() {
  asistenciaBlockeada = false;
  document.getElementById('statusAsistencia').textContent = 'Acercate a la camara...';
  document.getElementById('btnSiguienteWrap').style.display = 'none';
  iniciarDeteccion();
}
