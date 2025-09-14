function sortByMany(list, specs) {
    const clonedList = [...list]; //clona array

    clonedList.sort((a,b) => {
        for (let spec of specs) {
            const {key, dir} = spec;

            const valueA = a[key]
            const valueB = b[key]

            if (valueA < valueB) {
                return dir === 'asc' ? -1:1;
            }
            if (valueA > valueB) {
                return dir === 'asc' ? 1:-1;
            }
        }
        return 0;
    })
    return clonedList;
}

//prueba
const usuarios = [
    {firstName: 'Roman', lastName: 'Riquelme', age: 20},
    {firstName: 'Martin', lastName: 'Palermo', age: 31},
    {firstName: 'Julian', lastName: 'Alvarez', age: 25},
    {firstName: 'Lionel', lastName: 'Messi', age: 22}
]

const resultado = sortByMany(usuarios, [
    {key: 'lastName', dir: 'asc'},
    {key: 'age', dir: 'desc'}
])

console.log(resultado)