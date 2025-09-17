import Header from '../templates/Header';
import Home from '../pages/Home';
import Launch from '../pages/Launch';
import Error404 from '../pages/Error404';

const routes = {
    '/': Home,
    '/launch/:id': Launch,
};

const router = async () => {
    const header = document.getElementById('header');
    const content = document.getElementById('content');

    header.innerHTML = await Header();

    let hash = location.hash.slice(1).toLowerCase() || '/';
    let route = routes['/'];

    if (hash.startsWith('/launch/')) {
        route = routes['/launch/:id'];
    } else if (routes[hash]) {
        route = routes[hash];
    } else {
        route = Error404;
    }

    content.innerHTML = await route();
};

export default router;