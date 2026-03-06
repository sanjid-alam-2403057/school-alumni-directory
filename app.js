document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("alumni-container");
    const searchInput = document.getElementById("searchInput");
    const sortNameBtn = document.getElementById("sortName");
    const sortBatchBtn = document.getElementById("sortBatch");
    
    let alumniData = [];
    let currentDisplayData = []; // This tracks the currently visible cards

    // Fetch the alumni data
    fetch("data.json")
        .then(response => response.json())
        .then(data => {
            alumniData = data;
            currentDisplayData = [...alumniData]; // Copy original data
            displayAlumni(currentDisplayData); // Show all alumni initially
        })
        .catch(error => console.error("Error loading alumni data:", error));

    // Function to create and display cards
    function displayAlumni(data) {
        container.innerHTML = ""; // Clear out old cards

        if (data.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#666; width:100%;'>No alumni found matching your search.</p>";
            return;
        }

        data.forEach(alumnus => {
            const card = document.createElement("div");
            card.classList.add("alumni-card");

            card.innerHTML = `
                <img src="${alumnus.photo}" alt="Photo of ${alumnus.name}">
                <h2>${alumnus.name}</h2>
                <p><strong>University:</strong> ${alumnus.university}</p>
                <p><strong>Department:</strong> ${alumnus.department}</p>
                <p><strong>Admission:</strong> ${alumnus.admissionYear}</p>
                <div class="badge">SSC Batch: ${alumnus.sscBatch}</div>
            `;

            container.appendChild(card);
        });
    }

    // Add live search functionality
    searchInput.addEventListener("input", (e) => {
        const searchString = e.target.value.toLowerCase();
        
        currentDisplayData = alumniData.filter(alumnus => {
            return alumnus.name.toLowerCase().includes(searchString) ||
                   alumnus.university.toLowerCase().includes(searchString) ||
                   alumnus.sscBatch.toString().includes(searchString);
        });
        
        displayAlumni(currentDisplayData); 
    });

    // --- NEW: Sorting Logic ---

    // Sort by Name (Alphabetical A-Z)
    sortNameBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => a.name.localeCompare(b.name));
        displayAlumni(currentDisplayData);
    });

    // Sort by Newest Batch (Highest number first)
    sortBatchBtn.addEventListener("click", () => {
        currentDisplayData.sort((a, b) => b.sscBatch - a.sscBatch);
        displayAlumni(currentDisplayData);
    });
    // --- NEW: Dark Mode Logic ---
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    // Check if the user previously chose dark mode
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️"; 
    }

    // Listen for the click
    darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        
        if (body.classList.contains("dark-mode")) {
            darkModeToggle.textContent = "☀️";
            localStorage.setItem("theme", "dark");
        } else {
            darkModeToggle.textContent = "🌙";
            localStorage.setItem("theme", "light");
        }
    });
    // --- NEW: Scroll to Top Logic ---
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    // Show the button when scrolling down 300px
    window.addEventListener("scroll", () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    });

    // Smooth scroll to top when clicked
    scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
