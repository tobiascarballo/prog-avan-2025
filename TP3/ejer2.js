function pick(obj,keys) {
    const resultado = {};
    keys.forEach(key => {
        if (obj.hasOwnProperty(key)) {
            resultado[key] = obj[key];
        }
    });
    return resultado;
}

console.log(pick({a: 1, b: 2, c: 3}, ['a', 'c', 'z']));