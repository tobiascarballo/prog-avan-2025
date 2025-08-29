const traficoRed = {
"08:00": 1250, // MB transferidos
"09:00": 1870,
"10:00": 2100,
"11:00": 1950,
"12:00": 1600,
"13:00": 1300,
"14:00": 1700,
"15:00": 2200,
"16:00": 1800,
"17:00": 1500
};
// Calcula el total de datos transferidos
// Encuentra la hora con mayor tráfico

const horas = Object.keys(traficoRed); //keys
const datos = Object.values(traficoRed); //valores de las keys

const totalDatos = datos.reduce((acumulador, valorActual) => acumulador + valorActual, 0);

const maxTrafico = Math.max(...datos); //valor maximo

const indiceMax = datos.indexOf(maxTrafico); //hora con trafico max
const horaMayorTrafico = horas[indiceMax];

console.log("total de datos transferidos:", totalDatos + " MB");
console.log("hora con mayor cantidad de trafico:", horaMayorTrafico);
console.log("trafico maximo:", maxTrafico + " MB");