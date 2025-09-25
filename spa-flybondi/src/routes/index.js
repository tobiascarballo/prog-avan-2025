import Home from "../pages/Home.js";
import Results from "../pages/Results.js";
import Error404 from "../pages/Error404.js";

const routes = {
    "/": Home,
    "/results": Results,
};

const router = async () => {
    const content = document.getElementById("content");
    let hash = location.hash.slice(1).toLowerCase() || "/";
    let render = routes[hash] ? routes[hash] : Error404;
    content.innerHTML = await render();
};

export default router;
