// custom-elements.js
class AppHeader extends HTMLElement {
    connectedCallback() {
        console.log("ovo je this",this);
        this.innerHTML = `
            <div class="logo">
                <img src="images/Aurora-logo-white.svg">
            </div>
            <nav>
                <a href="#">Services</a>
                <a href="#">Contact</a>
                <a href="#">About us</a>
                <a href="#">Careers</a>
            </nav>
            <div class="calendly-link">
                <img src="images/Aurora-logo-white.svg">
            </div>
        `
    }
}
window.customElements.define('app-header', AppHeader)