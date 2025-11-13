// main.js
// ===== Bottom Navigation Control =====
const navButtons = document.querySelectorAll(".nav-btn");
const currentPage = window.location.pathname.split("/").pop();

navButtons.forEach((btn) => {
    const target = btn.getAttribute("data-target");

    // Mark active button based on page
    if (currentPage.includes(target)) {
        btn.classList.add("active");
    }

    // Handle click navigation
    btn.addEventListener("click", () => {
        // Check if we're in Structure folder or root
        const isInStructure = window.location.pathname.includes("Structure");
        const basePath = isInStructure ? "" : "Structure/";
        
        if (target === "home") {
            window.location.href = basePath + "home.html";
        } else if (target === "tasks") {
            window.location.href = basePath + "daily-tasks.html";
        } else if (target === "rewards") {
            window.location.href = basePath + "rewards.html";
        } else if (target === "profile") {
            window.location.href = basePath + "profile.html";
        } else if (target === "shop") {
            window.location.href = basePath + "shop.html";
        }
    });
});