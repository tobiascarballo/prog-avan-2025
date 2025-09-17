import getData from '../utils/getData';

const Home = async () => {
    const launches = await getData();
    const view = `
    <section class="cards">
        ${launches.map(launch => `
        <article class="card">
            <a href="#/launch/${launch.id}">
            <h2>${launch.name}</h2>
            <img src="${launch.links.patch.small}" alt="${launch.name}" />
            </a>
        </article>
        `).join('')}
    </section>
    `;
    return view;
};

export default Home;
