//a)
function withTimeout(promise, ms) {
    //crear promesa que rechaza despues de ms
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Timeout'));
        }, ms);
    });
    return Promise.race([promise, timeoutPromise]);
}

//uso de punto A
const promesaLenta = new Promise(resolve => { //simula promesa lenta
    setTimeout(() => resolve('Exito'), 2000);
});

withTimeout(promesaLenta, 1000) //agrega timeout 1000ms
    .then(resultado => console.log('resultado', resultado))
    .catch(error => console.log('error', error.message));

//devuelve error por la diferencia de ms

//-----------------------------
//b)
function allSettledLite(promises) {
    const promesasConEstado = promises.map(promise =>
        promise //mapea cada promesa a una nueva
            .then(value => ({status: 'fulfilled', value}))
            .catch(reason => ({status: 'rejected', reason}))
    );

    return Promise.all(promesasConEstado); //espera que todas se resuelvan
}

//uso de punto b
const ok = Promise.resolve('exito');
const falla = Promise.reject(new Error('fallo'));

allSettledLite([ok, falla])
    .then(resultados => {
        console.log(resultados);
    })

//devuelve el fulfilled como exito y el rejectd como error