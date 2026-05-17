let streamRegistro = null;

async function iniciarCamaraRegistro() {
  try {
    streamRegistro = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    document.getElementById('videoRegistro').srcObject = streamRegistro;
  } catch(e) {
    document.getElementById('statusRegistrar').textContent = 'Sin acceso a camara';
  }
}

function detenerCamaraRegistro() {
  if (streamRegistro) { streamRegistro.getTracks().forEach(t => t.stop()); streamRegistro = null; }
}

function capturarFotoRegistro() {
  const video = document.getElementById('videoRegistro');
  const canvas = document.getElementById('canvasRegistro');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  canvas.dataset.vacio = 'false';
  canvas.style.display = 'block';
  document.getElementById('statusRegistrar').textContent = 'Foto capturada — escribe el nombre y registra';
}

async function registrarEstudiante() {
  const nombre = document.getElementById('inputNombre').value.trim();
  const status = document.getElementById('statusRegistrar');
  if (!nombre) { status.textContent = 'Escribe un nombre'; return; }
  const canvas = document.getElementById('canvasRegistro');
  if (!canvas || canvas.dataset.vacio === 'true') { status.textContent = 'Primero captura la foto'; return; }
  status.textContent = 'Analizando cara...';
  try {
    const detection = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!detection) { status.textContent = 'No se detecto cara — acercate mas y buena luz'; return; }
    const descriptor = Array.from(detection.descriptor);
    const foto = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    await db.collection('estudiantes').add({ nombre, descriptor, foto, fechaRegistro: firebase.firestore.Timestamp.now() });
    status.textContent = nombre + ' registrado correctamente';
    document.getElementById('inputNombre').value = '';
    canvas.dataset.vacio = 'true';
    canvas.style.display = 'none';
  } catch(e) {
    status.textContent = 'Error: ' + e.message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inputNombre').addEventListener('keydown', e => { if (e.key === 'Enter') registrarEstudiante(); });
});
