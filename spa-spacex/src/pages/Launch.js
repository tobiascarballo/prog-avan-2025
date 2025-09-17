import getData from '../utils/getData';

const Launch = async () => {
    const id = location.hash.split('/')[2];
    const launch = await getData(id);

    const view = `
    <section class="launch-detail">
        <h2>${launch.name}</h2>
        <img src="${launch.links.patch.small}" alt="${launch.name}" />
        <p><strong>Número de vuelo:</strong> ${launch.flight_number}</p>
        <p><strong>Fecha:</strong> ${new Date(launch.date_utc).toLocaleString()}</p>
        <p><strong>Detalles:</strong> ${launch.details || 'No hay detalles disponibles'}</p>
        <p><strong>Fallas:</strong> ${
        launch.failures.length > 0
            ? launch.failures.map(f => f.reason).join(', ')
            : 'None'
        }</p>
    </section>
    `;
    return view;
};

export default Launch;
