document.addEventListener("DOMContentLoaded", () => {
    const themeSwitch = document.getElementById("themeSwitch");
    const body = document.body;

    // Load saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        body.classList.add("light-theme");
        themeSwitch.checked = false;
    }

    themeSwitch.addEventListener("change", () => {
        if (themeSwitch.checked) {
            body.classList.remove("light-theme");
            localStorage.setItem("theme", "dark");
        } else {
            body.classList.add("light-theme");
            localStorage.setItem("theme", "light");
        }
    });
});
