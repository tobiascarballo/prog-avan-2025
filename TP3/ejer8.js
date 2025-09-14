function debounce(fn, delay) {
    let timeoutId; //guarda id del timer

    return function(...args) {
        clearTimeout(timeoutId); //si existe el timer anterior, lo cancela

        timeoutId = setTimeout(() => { //crea nuevo timer
            fn.apply(this,args);
        }, delay);
    };
}

//para poder probar
function buscar(query) {
    console.log(`buscando: ${query}`);
}
const debounceBuscar = debounce(buscar, 300);

debounceBuscar("a");
debounceBuscar("au");
debounceBuscar("aut");
debounceBuscar("auto") //se ejecuta 1 sola busqueda