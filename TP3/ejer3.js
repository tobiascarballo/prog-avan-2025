function groupBy(list, keyOrFn) {
    const resultado = {};

    list.forEach(item => {
        let clave;

        if (typeof keyOrFn === 'string') {
            clave=item[keyOrFn];
        } else if (typeof keyOrFn === 'function') {
            clave = keyOrFn(item);
        }

        if (!resultado[clave]) {
            resultado[clave] = [];
        }

        resultado[clave].push(item);
    })

    return resultado;
}

console.log(groupBy([{t:'a'},{t:'b'},{t:'a'}], 't'));
console.log(groupBy([6,7,8,9], n => n%2?'impar':'par'));