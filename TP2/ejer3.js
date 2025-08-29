const dispositivosRed = [
{ tipo: "Router", marca: "Cisco", modelo: "1941", precio: 1200 },
{ tipo: "Switch", marca: "TP-Link", modelo: "TL-SG108", precio: 150 },
{ tipo: "Firewall", marca: "Cisco", modelo: "ASA 5506-X", precio: 2500 },
{ tipo: "Access Point", marca: "Ubiquiti", modelo: "UniFi AP AC Pro", precio: 320 },
{ tipo: "Router", marca: "TP-Link", modelo: "Archer C7", precio: 180}
];

const marcaEspecifica = dispositivosRed.filter(dispositivo => dispositivo.marca === 'Cisco')
console.log(marcaEspecifica)

const marcaEspecifica2 = dispositivosRed.filter(dispositivo => dispositivo.marca === 'TP-Link')
console.log(marcaEspecifica2)