import Header from "./templates/Header.js";
import router from "./routes/index.js";
import "./styles/style.css";

const header = document.getElementById("header");
if (header) {
    header.innerHTML = Header();
}

window.addEventListener("load", router);
window.addEventListener("hashchange", router);
