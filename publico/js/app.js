let mode = 0; // 0: Caras, 1: Ojos, 2: Sonrisas
let faceCount = 0;
let smileCount = 0;
let interactionCount = 0;
let sessionStart = Date.now();
let classifiers = {};

function initApp() {
    cv['onRuntimeInitialized'] = () => {
        loadClassifiers();
        startCamera();
        setInterval(updateSessionTime, 1000); // Actualiza tiempo cada segundo
    };
}

function loadClassifiers() {
    const files = [
        'haarcascade_frontalface_default.xml',
        'haarcascade_eye.xml',
        'haarcascade_smile.xml'
    ];
    files.forEach(file => {
        utils.createFileFromUrl(file, file, () => {
            classifiers[file] = new cv.CascadeClassifier();
            classifiers[file].load(file);
        });
    });
}

function startCamera() {
    const video = document.getElementById('cam_input');
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            processVideo();
        })
        .catch(err => {
            document.getElementById('errorMsg').textContent = 'Error accediendo a la cámara: ' + err.message;
        });
}

function processVideo() {
    try {
        const video = document.getElementById('cam_input');
        const canvas = document.getElementById('canvas_output');
        const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        const dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        const gray = new cv.Mat();
        const cap = new cv.VideoCapture(video);
        const faces = new cv.RectVector();
        const items = new cv.RectVector(); // Para ojos o sonrisas

        cap.read(src);
        src.copyTo(dst);
        cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY, 0);

        // Detección de caras siempre como base
        classifiers['haarcascade_frontalface_default.xml'].detectMultiScale(gray, faces, 1.1, 3, 0);
        faceCount = faces.size();
        document.getElementById('faceCount').textContent = faceCount;

        for (let i = 0; i < faces.size(); ++i) {
            const face = faces.get(i);
            cv.rectangle(dst, new cv.Point(face.x, face.y), new cv.Point(face.x + face.width, face.y + face.height), [255, 0, 0, 255]);

            const roiGray = gray.roi(face);
            if (mode === 1) { // Ojos
                classifiers['haarcascade_eye.xml'].detectMultiScale(roiGray, items, 1.1, 3, 0);
                drawItems(items, dst, face, [0, 255, 0, 255]);
            } else if (mode === 2) { // Sonrisas
                classifiers['haarcascade_smile.xml'].detectMultiScale(roiGray, items, 1.3, 5, 0);
                smileCount = items.size();
                document.getElementById('smileCount').textContent = smileCount;
                drawItems(items, dst, face, [0, 0, 255, 255]);
            }
            roiGray.delete();
        }

        cv.imshow(canvas, dst);
        src.delete(); dst.delete(); gray.delete(); faces.delete(); items.delete();

        requestAnimationFrame(processVideo); // Mejor que setTimeout para performance
    } catch (err) {
        document.getElementById('errorMsg').textContent = 'Error en procesamiento: ' + err.message;
    }
}

function drawItems(items, dst, face, color) {
    for (let j = 0; j < items.size(); ++j) {
        const item = items.get(j);
        cv.rectangle(dst, new cv.Point(face.x + item.x, face.y + item.y),
            new cv.Point(face.x + item.x + item.width, face.y + item.y + item.height), color);
    }
}

function cycleMode() {
    mode = (mode + 1) % 3;
    interactionCount++;
    document.getElementById('interactionCount').textContent = interactionCount;
}

function updateSessionTime() {
    const time = Math.floor((Date.now() - sessionStart) / 1000);
    document.getElementById('sessionTime').textContent = time + 's';
}

function sendData() {
    const data = {
        faces: faceCount,
        smiles: smileCount,
        interactions: interactionCount,
        sessionTime: Math.floor((Date.now() - sessionStart) / 1000)
    };
    fetch('/api/send-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en respuesta');
        return response.json();
    })
    .then(result => console.log(result.message))
    .catch(err => document.getElementById('errorMsg').textContent = 'Error enviando datos: ' + err.message);
}