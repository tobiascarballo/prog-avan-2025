function sumUnique(nums) {
    const numeros = nums.filter(elemento => Number.isFinite(elemento));//filtrar solo los numeros ignorando los no-numericos
    const numerosUnicos = [...new Set(numeros)]; //obtener nros unicos con set
    const suma = numerosUnicos.reduce((acumulador, numero) => acumulador + numero, 0); //sumar nros unicos

    return suma;
}
console.log(sumUnique([2,5])) // = 7
console.log(sumUnique([1,2,2,3])); // = 6
console.log(sumUnique([1,'hola',8])) // = 9