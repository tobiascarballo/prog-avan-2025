import getData from "../utils/getData.js";

const Results = async () => {
    const budget = 800; // presupuesto disponible
    const data = await getData();
  
    console.log("Datos cargados:", data);
  
    // filtramos solo vuelos que entren en el presupuesto
    const availableFlights = data.filter(flight => flight.price <= budget);
  
    console.log("Vuelos filtrados:", availableFlights);
  
    let view = `
      <section>
        <h1>Resultados de vuelos</h1>
        <ul>
          ${
            availableFlights.length > 0
              ? availableFlights
                  .map(
                    (flight) => `
                <p>
                  <strong>${flight.origin} → ${flight.destination}</strong><br>
                  Precio: $${flight.price} - Disponibilidad: ${flight.availability} - Fecha: ${flight.date}
                </p>
              `
                  )
                  .join("")
              : `<p>No hay vuelos disponibles con tu presupuesto de $${budget}.</p>`
          }
        </ul>
      </section>
    `;
    return view;
  };
  
export default Results;
  