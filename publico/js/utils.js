// Utils para cargar archivos en OpenCV FS
let utils = {};

utils.createFileFromUrl = function(path, url, callback) {
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        if (request.status === 200) {
            let data = new Uint8Array(request.response);
            cv.FS_createDataFile('/', path, data, true, false, false);
            callback();
        } else {
            console.error('Error cargando ' + url);
        }
    };
    request.send();
};