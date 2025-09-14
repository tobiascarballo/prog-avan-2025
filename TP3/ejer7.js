function wordFreq(text) {
    const textoNormalizado = text.toLowerCase().replace(/[,.:;!?]/g,'');

    const palabras = textoNormalizado.split(' ');

    const frecuencia = new Map();

    palabras.forEach(palabra => {
        if (palabra) {
            frecuencia.set(palabra, (frecuencia.get(palabra) || 0) +1);
        }
    });

    return frecuencia;
}

console.log(wordFreq("Hola, hola!, chau"));
console.log(wordFreq("buenas, todo bien?, todo bien"));
console.log(wordFreq("chau, hasta luego"));