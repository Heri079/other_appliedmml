const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Middleware para logging detallado de accesos
app.use((req, res, next) => {
  const log = `Acceso: ${req.method} ${req.url} desde IP ${req.ip} | User-Agent: ${req.headers['user-agent']} | Timestamp: ${new Date().toISOString()}`;
  console.log(log);
  next();
});

// Servir archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, '..', 'public')));

// Endpoint para recibir datos (con validación básica)
app.post('/api/send-data', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    console.error('Datos inválidos recibidos');
    return res.status(400).send({ message: 'Datos inválidos' });
  }
  console.log('Datos recibidos del usuario:', data);
  res.send({ message: 'Datos recibidos exitosamente' });
});

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});